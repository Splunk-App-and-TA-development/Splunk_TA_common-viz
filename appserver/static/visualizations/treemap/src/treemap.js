/*
 * Treemap visualization view class
 */
define([
    'jquery',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils',
    'd3'
],
function(
    $,
    SplunkVisualizationBase,
    vizUtils,
    d3
) {

    var DEFAULT_WIDTH = 900,
        DEFAULT_HEIGHT = 500,
        LEGEND_WIDTH = 145,
        MSG_AREA_HEIGHT = 20;

    var MARGIN = {top: 18, right: 15, bottom: 15, left: 15};

    var f = {
        integer: d3.format(',.0f')
    }

    function sortByValDesc(a, b) {
        if(a.value < b.value) { return 1; }
        else if (a.value === b.value) { return 0; }
        else { return -1; }
    }

    function sortByColorValDesc(a, b) {
        if(a.colorVal < b.colorVal) { return 1; }
        else if (a.colorVal === b.colorVal) { return 0; }
        else { return -1; }
    }

    //Helper to check if value is numeric
    function filterFloat(value) {
        if(/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
            return Number(value);
        }
        return NaN;
    }

    function stringToInt(input, defaultVal) {
        var toReturn = parseInt(input);
        return isNaN(toReturn) ? defaultVal : toReturn;
    }

    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({

        //Treemap can use:
        // -- Single Measure (single)
        // -- Two Measures
        //     >> 2nd Measure Number (doubleNumber)
        //     >> 2nd Measure Category (doubleString)
        mode: 'single',

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            this.$el.addClass('splunk-treemap');
            if (vizUtils.getCurrentTheme && vizUtils.getCurrentTheme() === 'dark'){
              this.$el.addClass('dark');
            }
        },

        //Setup the color scale.
        //
        // Single measure (must be numeric), colorMode:
        //  -- Categorical - use Parent / Group / Category for the colors.
        //  -- Sequential - use value for the color.
        //
        // Two measures - first is numeric.
        //  -- 2nd measure is String, force colorMode: Categorical
        //  -- 2nd measure is Numeric, allow either colorMode.
        _getColors: function(data) {
            var domain = [];
            var min = Infinity, max = -Infinity;

            //Sort children by descending by value
            if(this.mode === 'doubleNumber') {
                data.children.sort(sortByColorValDesc);
            }
            else {
                data.children.sort(sortByValDesc);
            }

            for(var i=0; i < data.children.length; i++) {
                if(this.colorMode === 'categorical') {
                    if(this.mode === 'doubleString') {
                        //Use children's children for categories in this case.
                        for(var k=0; k < data.children[i].children.length; k++) {
                            if(domain.indexOf(data.children[i].children[k].colorVal) === -1) {
                                domain.push(data.children[i].children[k].colorVal);
                            }
                        }
                    }
                    else {
                        domain.push(data.children[i].name);
                    }
                }
                else {
                    //Find min, max for children, not aggregates of parents.
                    for(var j=0; j < data.children[i].children.length; j++) {
                        var currentVal;
                        if(this.mode === 'doubleNumber') {
                            currentVal = data.children[i].children[j].colorVal;
                            if(currentVal < min) min = currentVal;
                            if(currentVal > max) max = currentVal;
                        }
                        else {
                            currentVal = data.children[i].children[j].value;
                            if(currentVal < min) min = currentVal;
                            if(currentVal > max) max = currentVal;
                        }
                        if (this.useColors) {
                            domain.push(currentVal);
                        }
                    }
                }
            }

            if(this.useColors) {
                if(this.colorMode === 'categorical') {
                    if(this.mode === 'doubleString') {
                        domain.sort();
                    }

                    //Splunk Categorical Color Scheme
                    this.colors = d3.scale.ordinal()
                        .domain(domain)
                        .range(vizUtils.getColorPalette('splunkCategorical'));
                }
                else {
                    //Sequential Color Scheme
                    max = Math.floor(max);

                    var interpolateNum = d3.interpolateRound(min, max);
                    var interpolateColor = d3.interpolateHcl(this.minColor, this.maxColor); //Rgb, Hcl, Hsl
                    var colorDomain = [];
                    var colorRange = [];

                    for(var x=0; x < this.numOfBins; x++) {
                        colorDomain.push(interpolateNum(x/(this.numOfBins-1)));
                        colorRange.push(interpolateColor(x/(this.numOfBins-1)));
                    }

                    this.colors = d3.scale.ordinal()
                        .domain(colorDomain)
                        .range(colorRange);

                    var colorCategories = domain.sort(function(a, b) { return b - a; });
                    var categoryToColorDomain = {};
                    // binning
                    for (var i = 0; i < colorCategories.length; i++) {
                        var colorCategory = colorCategories[i];
                        var bin = -1;
                        for (var o = 0; o < colorDomain.length; o++) {
                            if (colorDomain[o] <= colorCategory) {
                                bin++;
                                continue;
                            }
                        }
                        categoryToColorDomain[colorCategory] = colorDomain[bin] ;
                    }

                    this.categories = function(category) {
                        return categoryToColorDomain[category];
                    };
                }
            }
            else {
                //No colors - only use first categorical color
                this.colorMode = 'categorical';

                this.colors = d3.scale.ordinal()
                            .domain(domain)
                            .range(['#1e93c6']);
            }
        },

        _setupTooltips: function(children) {
            var that = this;

            children
                .on('mousemove', function(d) {

                    // Add tooltip content
                    that.tooltip
                        .style('display', 'block')
                        .html('');

                    that.tooltip.append('h4').text(d.parent.name);
                    that.tooltip.append('h5').text(d.name);

                    var toolTipData = [{ title: (that.measureOneName ? that.measureOneName : 'Measure 1') +':', value: f.integer(d.value) }];

                    if(that.mode === 'doubleNumber') {
                        toolTipData.push({ title: (that.measureTwoName ? that.measureTwoName : 'Measure 2') + ':', value: f.integer(d.colorVal) });
                    }
                    else if(that.mode === 'doubleString') {
                        toolTipData.push({ title: (that.measureTwoName ? that.measureTwoName : 'Measure 2') + ':', value: d.colorVal });
                    }

                    var table = that.tooltip.append('table');

                    var tr = table.selectAll('tr')
                            .data(toolTipData).enter()
                            .append('tr');

                    tr.append('td')
                            .attr('class', 'title')
                            .html(function(m) { return m.title; });

                    tr.append('td')
                            .attr('class', 'value')
                            .html(function(m) { return m.value; });

                    // Position tooltip
                    getRect = function($el) {
                        return {
                            offset_l: $el.offset().left,
                            offset_t: $el.offset().top,
                            pos_l: $el.position().left,
                            pos_t: $el.position().top,
                            scroll_l: $el.scrollLeft(),
                            scroll_t: $el.scrollTop(),
                            w: $el.width(),
                            h: $el.height()
                        };
                    };

                    var pos = d3.mouse(this);
                    var facetsContainer = getRect(that.$el.closest('.facets-container'));
                    var container = getRect(that.$el);
                    var tooltipWidth = $(that.tooltip[0]).width();

                    that.tooltip
                        .style('left', pos[0] < that.width / 2
                            ? (container.pos_l + pos[0] + 22) + 'px'
                            : (container.pos_l + pos[0] - tooltipWidth - 15) + 'px');

                    that.tooltip.style('top', container.offset_t + pos[1] + facetsContainer.scroll_t - facetsContainer.offset_t + 'px');

                    that.tooltip.classed('tooltip-top-left', false);
                    that.tooltip.classed('tooltip-bottom-left', false);
                    that.tooltip.classed('tooltip-top-right', false);
                    that.tooltip.classed('tooltip-bottom-right', false);
                    if(pos[0] < that.width / 2) {
                        that.tooltip.classed('tooltip-top-left', true);
                    }
                    else {
                        that.tooltip.classed('tooltip-top-right', true);
                    }
                })
                .on('mouseout', function(d) {
                    that.tooltip.style('display', 'none');
                });
        },

        _resizeRects: function(rect) {
            var that = this;
            var xscale = that.xscale;
            var yscale = that.yscale;
            //Prevent drawing outside the svg bounds
            rect
                .attr('x', function(d) {
                    var xVal = xscale(d.x);
                    return (xVal < 0 ? 0 : xVal);
                })
                .attr('y', function(d) {
                    var yVal = yscale(d.y);
                    return (yVal < 0 ? 0 : yVal);
                })
                .attr('width', function(d) {
                    var xVal = xscale(d.x);
                    var rightEdge = xscale(d.x + d.dx);

                    xVal = (xVal < 0 ? 0 : xVal);
                    rightEdge = (rightEdge > that.width ? that.width : rightEdge);

                    var w = rightEdge - xVal;
                    return (w < 0 ? 0 : w);
                })
                .attr('height', function(d) {
                    var yVal = yscale(d.y);
                    var bottomEdge = yscale(d.y + d.dy);

                    yVal = (yVal < 0 ? 0 : yVal);
                    bottomEdge = (bottomEdge > that.height ? that.height : bottomEdge);

                    var h = bottomEdge - yVal;
                    return (h < 0 ? 0 : h);
                })
                .attr('style', function(d) {

                    function getRectFill(){
                        //don't fill parents
                        if(that.colorMode === 'categorical') {
                            if(that.mode === 'doubleString') {
                                return d.children ? null : that.colors(d.colorVal);
                            }
                            else {
                                return d.children ? null : that.colors(d.parent.name);
                            }
                        }
                        else {
                            if(that.mode === 'doubleNumber') {
                                return d.children ? null : that.colors(that.categories(d.colorVal));
                            }
                            else {
                                return d.children ? null : that.colors(that.categories(d.value));
                            }
                        }
                    }

                    var rectFill = getRectFill();
                    return rectFill ? 'fill: ' + rectFill + ';' : '';
                });
        },

        _resizeObject: function(foreign) {
            var that = this;
            foreign
                .attr('x', function(d) { return that.xscale(d.x); })
                .attr('y', function(d) { return that.yscale(d.y); })
                .attr('width', function(d) { return that.xscale(d.x + d.dx) - that.xscale(d.x); })
                .attr('height', function(d) { return that.yscale(d.y + d.dy) - that.yscale(d.y); });
        },

        _getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        },

        _getConfigParams: function(config) {
            this.mode = 'single';
            this.maxCategoriesExceeded = false;

            this.useZoom = vizUtils.normalizeBoolean(this._getEscapedProperty('useZoom', config), { default: true });
            this.showLabels = vizUtils.normalizeBoolean(this._getEscapedProperty('showLabels', config), { default: true });
            this.showLegend = vizUtils.normalizeBoolean(this._getEscapedProperty('showLegend', config), { default: true });
            this.showTooltip = vizUtils.normalizeBoolean(this._getEscapedProperty('showTooltip', config), { default: true });

            this.maxCategories = stringToInt(this._getEscapedProperty('maxCategories', config), 10);

            this.useColors = vizUtils.normalizeBoolean(this._getEscapedProperty('useColors', config), { default: true });
            this.colorMode = this._getEscapedProperty('colorMode', config) || 'categorical'; // or sequential

            this.minColor = this._getEscapedProperty('minColor', config) || '#d93f3c';
            this.maxColor = this._getEscapedProperty('maxColor', config) || '#3fc77a';
            this.numOfBins = this._getEscapedProperty('numOfBins', config) || 6;
        },

        _isEnabledDrilldown: function(config) {
            if (config['display.visualizations.custom.drilldown'] && config['display.visualizations.custom.drilldown'] === 'all') {
                return true;
            }
            return false;
        },

        // Optionally implement to format data returned from search.
        // The returned object will be passed to updateView as 'data'
        formatData: function(data, config) {
            // Check for empty data
            if(data.rows.length < 1) {
                    return false;
            }

            this._getConfigParams(config);

            this.parentName = data.fields[0].name;
            this.childName = data.fields[1].name;
            this.measureOneName = data.fields[2].name;

            if(data.rows[0].length > 3) {
                //For "doubleString" mode, the 2nd measure will be in the 3rd position (2),
                //and the 1st measure will be in the 4th position (3).
                if(isNaN(filterFloat(data.rows[0][3]))) {
                    throw new SplunkVisualizationBase.VisualizationError(
                        'Check the Statistics tab. To build a treemap with colors determined by a color field, the results table must include columns representing these four fields: <category>, <name>, <metric>, and <color>. The <color> and <metric> field values must be numeric.'
                    );
                }

                if(isNaN(filterFloat(data.rows[0][2]))) {
                    this.mode = 'doubleString';
                    this.measureOneName = data.fields[3].name;
                    this.measureTwoName = data.fields[2].name;
                }
                else {
                    this.mode = 'doubleNumber';
                    this.measureTwoName = data.fields[3].name;
                }
            }
            else {
                if(isNaN(filterFloat(data.rows[0][2]))) {
                    throw new SplunkVisualizationBase.VisualizationError(
                        'Check the Statistics tab. To build a treemap with colors determined by parent category, the results table must include columns representing these three fields: <category>, <name>, and <metric>. The <metric> field values must be numeric.'
                    );
                }
            }

            // Create map for treemap data
            var count = 0;
            var that = this;
            var dataMap = data.rows.reduce(function(map, nodeArr) {
                if(nodeArr.length < 3) {
                    throw new SplunkVisualizationBase.VisualizationError(
                        'Check the Statistics Tab. To generate a treemap, the results table must include columns representing these three fields: <category>, <name>, and <metric>'
                    );
                }

                //Convert array to object
                var node = {
                    group: nodeArr[0],
                    name: nodeArr[1],
                    value: nodeArr[2]
                }

                //2nd field for defining colors
                if(that.mode !== 'single') {
                    if(that.mode === 'doubleNumber') {
                        node.colorVal = nodeArr[3];
                    }
                    else {
                        node.colorVal = nodeArr[2];
                        node.value = nodeArr[3];
                    }
                }

                var obj = map.objMap[node.group];

                //If a node's group has not been added, add it.
                if(!obj) {
                    obj = {
                        name: node.group,
                        children: [],
                        value: 0
                    };

                    //2nd field for defining colors
                    if(that.mode !== 'single') {
                        if(that.mode === 'doubleNumber') {
                            obj.colorVal = 0;
                        }
                    }

                    map.results.children.push(obj);
                    map.objMap[node.group] = obj;
                    count++;
                }

                //Add this child to the group
                if(obj) {
                    var val = parseFloat(node.value);

                    //2nd field for defining colors
                    if(that.mode !== 'single') {
                        var colorVal = node.colorVal;

                        if(that.mode === 'doubleNumber') {
                            colorVal = parseFloat(node.colorVal);
                            obj.colorVal += colorVal;
                        }

                        obj.children.push({
                            name: node.name,
                            value: val,
                            colorVal: colorVal
                        });
                    }
                    else {
                        obj.children.push({
                            name: node.name,
                            value: val
                        });
                    }

                    obj.value += val;
                }

                return map;
            }, {
                results: {
                    name:'top',
                    children:[]
                },
                objMap: {}
            });

            //Only keep the largest 'maxCategories' values.
            if(dataMap.results.children.length > this.maxCategories) {
                this.maxCategoriesExceeded = true;

                //First sort the children descending by value
                dataMap.results.children.sort(sortByValDesc);

                //Then, remove all children, except the first 'maxCategories'.
                dataMap.results.children = dataMap.results.children.slice(0, this.maxCategories);
            }

            if(this.colorMode === 'categorical' && this.mode === 'doubleString') {
                //In this case, check maxCategories for children's children.
                var domainSort = [];
                var domainSortMap = {};

                for(var i=0; i < dataMap.results.children.length; i++) {
                    for(var j=0; j < dataMap.results.children[i].children.length; j++) {
                        var name = dataMap.results.children[i].children[j].colorVal;
                        var value = dataMap.results.children[i].children[j].value;

                        if(!domainSortMap.hasOwnProperty(name)) {
                            var obj = {
                                name: name,
                                value: value
                            };

                            domainSort.push(obj);
                            domainSortMap[obj.name] = obj;
                        }
                        else {
                            domainSortMap[name].value += value;
                        }
                    }
                }

                if(domainSort.length > this.maxCategories) {
                    this.maxCategoriesExceeded = true;

                    //First sort by descending by value
                    domainSort.sort(sortByValDesc);

                    //Then, remove all, except the first 'maxCategories'.
                    domainSort = domainSort.slice(0, this.maxCategories);
                    domainSortMap = {};

                    domainSort.forEach(function(domain) {
                        domainSortMap[domain.name] = domain;
                    });

                    for(var k=dataMap.results.children.length-1; k >= 0; k--) {
                        for(var l=dataMap.results.children[k].children.length-1; l >= 0; l--) {
                            if(!domainSortMap.hasOwnProperty(dataMap.results.children[k].children[l].colorVal)) {
                                dataMap.results.children[k].children.splice(l, 1);
                            }
                        }

                        if(dataMap.results.children[k].children.length === 0) {
                            dataMap.results.children.splice(k, 1); //No Children Left
                        }
                    }
                }
            }

            return dataMap.results;
        },

        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData
        //  'config' will be the configuration property object
        updateView: function(data, config) {
            //Return if no data
            if(!data) {
                return;
            }

            this.$el.empty(); //Clear the div

            //Resize to fill container
            var width = this.$el.width() - MARGIN.left - MARGIN.right - (this.showLegend ? LEGEND_WIDTH : 0);
            var height = this.$el.height() - MARGIN.top - MARGIN.bottom - (this.maxCategoriesExceeded ? MSG_AREA_HEIGHT : 0);

            width = (width <= 0 ? DEFAULT_WIDTH - MARGIN.left - MARGIN.right - (this.showLegend ? LEGEND_WIDTH : 0) : width);
            height = (height <= 0 ? DEFAULT_HEIGHT - MARGIN.top - MARGIN.bottom - (this.maxCategoriesExceeded ? MSG_AREA_HEIGHT : 0) : height);

            this.width = width;
            this.height = height;

            this.xscale = d3.scale.linear()
                .domain([0, width])
                .range([0, width]);

            this.yscale = d3.scale.linear()
                .domain([0, height])
                .range([0, height]);

            this._getColors(data); //Setup the Color scale

            this.useDrilldown = this._isEnabledDrilldown(config);

            //Add the components
            var treemap = d3.layout.treemap()
                    .size([width, height])
                    .sort(function(a, b) { return a.value - b.value; })
                    .round(false)
                    .nodes(data);

            var div = d3.select(this.el).append('div')
                    .style('width', (width + MARGIN.left + MARGIN.right) + 'px')
                    .style('height', (height + MARGIN.top + MARGIN.bottom) + 'px')
                    .style('top', MARGIN.top + 'px');

            this.svg = div.append('svg')
                    .attr('width', width + MARGIN.left + MARGIN.right)
                    .attr('height', height + MARGIN.bottom + MARGIN.top)
                    .append('g')
                    .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')')
                    .style('shape-rendering', 'crispEdges');

            //Header
            this.header = this.svg.append('g')
                    .attr('class', 'header')
                    .style('display', 'none');

            this.header.append('rect')
                    .attr('y', -MARGIN.top)
                    .attr('width', width)
                    .attr('height', MARGIN.top);

            this.header.append('text')
                    .attr('class', 'headerLabel')
                    .attr('x', 6)
                    .attr('y', 4 - MARGIN.top)
                    .attr('dy', '.75em');

            this.header.append('text')
                    .attr('x', width - 120)
                    .attr('y', 4 - MARGIN.top)
                    .attr('dy', '.75em')
                    .text('Click to Zoom Out');

            //Tooltip
            if(this.showTooltip) {
                this.tooltip = div.append('div')
                        .attr('class', 'tooltip')
                        .style('display', 'none')
                        .text('Tooltip');
            }

            //Initialize the Treemap
            this.drawTreemap(data);

            //Add Legend
            var that = this;
            if(this.showLegend) {
                var legend = d3.select(this.el).append('div')
                        .attr('class', 'legend')
                        .append('ul');

                var keys = legend.selectAll('li.key')
                        .data(that.colors.domain());

                keys.enter().append('li')
                        .attr('class', 'key')
                        .style('border-left-color', function(d) { return that.colors(d); })
                        .append('span')
                        .text(function(d) {
                            if(that.colorMode === 'categorical') {
                                return d;
                            }
                            else {
                                return '>= ' + f.integer(d);
                            }
                        });

                if(this.colorMode === 'sequential') {
                    if(this.mode === 'single') {
                        legend.append('text').text(this.measureOneName);
                    }
                    else if(this.mode === 'doubleNumber') {
                        legend.append('text').text(this.measureTwoName);
                    }
                    else if(this.mode === 'doubleString') {
                        legend.append('text').text(this.measureOneName);
                    }
                }
            }

            if(this.maxCategoriesExceeded) {
                div
                    .append('div')
                    .style('MARGIN-top', '-' + (MARGIN.bottom - 3) + 'px')
                    .style('padding-left', MARGIN.left + 'px')
                    .html('Max Number of Categories exceeded (' + this.maxCategories + '). Results have been truncated.');
            }
        },

        drawTreemap: function(d) {
            var that = this;

            //Only show header when zoomed in
            if(d.depth > 0) {
                this.header
                    .datum(d.parent)
                    .on('click', transition)
                    .style('display', 'block')
                    .select('.headerLabel')
                    .text(d.name);
            }
            else {
                this.header
                    .style('display', 'none');
            }

            var g1 = this.svg.insert('g', '.header')
                .datum(d)
                .attr('class', 'depth');

            //Add the data
            var g = g1.selectAll('g')
                .data(d.children)
                .enter().append('g');

            //Transition for children
            g.filter(function(d) { return d.children; })
                .classed('children', true)
                .on('click', transition);

            //Child rectangles
            var children = g.selectAll('.child')
                .data(function(d) { return d.children || [d]; })
                .enter().append('rect')
                .attr('class', 'child')
                .call(that._resizeRects.bind(that));

            //Only show cursor:pointer when drilldown is active
            if(that.useDrilldown) {
                children.classed('drillable', true);
            }

            //Only show tooltip when option is active
            if(this.showTooltip) {
                this._setupTooltips(children);
            }

            //Parent rectangles -- only at root
            if(d.depth === 0) {
                if(that.useZoom) {
                    children.classed('zoomable', true);
                }

                //Hide the cursor:pointer when cursor:zoom-in is active
                if(that.useDrilldown) {
                    children.classed('drillable', false);
                }

                g.append('rect')
                    .attr('class', 'parent')
                    .call(that._resizeRects.bind(that));
            }
            else {
                //When drilled down, run search on click.
                children
                    .on('click', function(d) {
                        //For leaf children, run another search.
                        if(!d.children) {
                            var payload = {
                                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                                data: {}
                            };

                            payload.data[that.parentName] = d.parent.name;
                            payload.data[that.childName] = d.name;

                            that.drilldown(payload, d3.event);
                        }
                    });
            }

            // Use foreignObject so text will wrap (instead of svg:text)
            g.append('foreignObject')
                .call(that._resizeRects.bind(that))
                .attr('class','foreignobj')
                .append('xhtml:div')
                .call(that._resizeRects.bind(that))
                .attr('dy', '.75em')
                .style('text-overflow', 'clip')
                .classed('parent-label', function(d){
                    return d.depth === 1;
                })
                .html(function(d) {
                    return (!that.showLabels ? '' : '<p>' + d.name + '</p>');
                })
                .classed('node-label', true); //css class for the labels

            //Handle the transitions
            function transition(d) {
                if(!that.useZoom || that.transitioning || !d) return; //debounce
                that.transitioning = true;

                var g2 = that.drawTreemap(d),
                        t1 = g1.transition().duration(750),
                        t2 = g2.transition().duration(750);

                that.xscale.domain([d.x, d.x + d.dx]);
                that.yscale.domain([d.y, d.y + d.dy]);

                that.svg.style('shape-rendering', null); //Enable anti-aliasing while transitioning

                //Draw child nodes on top of parents
                that.svg.selectAll('.depth').sort(function(a, b) { return a.depth - b.depth; });

                //Fade-out exiting text
                g2.selectAll('foreignObject div').style('display', 'none');

                //Transition to the new view (t1 --> t2)
                t1.selectAll('rect').call(that._resizeRects.bind(that));
                t2.selectAll('rect').call(that._resizeRects.bind(that));

                t1.selectAll('.node-label').style('display', 'none');
                t1.selectAll('.foreignobj').call(that._resizeObject.bind(that));

                t2.selectAll('.foreignobj').call(that._resizeObject.bind(that));

                // Resize text containers, render text if there is space
                t2.selectAll('.node-label').call(that._resizeObject.bind(that));
                t2.selectAll('.node-label').each('end', function(d){
                    $(this).css('display', $(this).attr('height') > 30 && $(this).attr('width') > 30 ? 'block' : 'none')
                });

                //Remove old nodes when transition complete
                t1.remove().each('end', function() {
                    that.svg.style('shape-rendering', 'crispEdges'); //turn off anti-aliasing
                    that.transitioning = false;
                });
            }

            return g;
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            });
        },

        // Override to respond to re-sizing events
        reflow: function() {
            //If size changed, redraw.
            if(this.width !== this.$el.width() - MARGIN.left - MARGIN.right - (this.showLegend ? LEGEND_WIDTH : 0) ||
                this.height !== this.$el.height() - MARGIN.top - MARGIN.bottom - (this.maxCategoriesExceeded ? MSG_AREA_HEIGHT : 0)) {
                this.invalidateUpdateView();
            }
        }

    });
});
