/*
 * Sankey visualization view class
 */
define([
        'jquery',
        'underscore',
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils',
        'd3',
        '../contrib/sankey'
],
function(
        $,
        _,
        SplunkVisualizationBase,
        vizUtils,
        d3,
        d3sankey
) {

    var DEFAULT_WIDTH = 900,
        DEFAULT_HEIGHT = 500,
        LEGEND_WIDTH = 125;

    //Sort and only allow top 3 and put the rest in "Others" bucket.
    var MAX_TOOLTIP_VALUES = 3;

    var MARGIN = {top: 15, right: 15, bottom: 15, left: 15};

    var f = {
        integer: d3.format(',.0f')
    }

    function sortByValDesc(a, b) {
        if(a.value < b.value) { return 1; }
        else if (a.value === b.value) { return 0; }
        else { return -1; }
    }

    //Helper to check if value is numeric
    function filterFloat(value) {
        if(/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
            return Number(value);
        }
        return NaN;
    }

    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({

        sankey: null,
        path: null,
        linksGroup: null,
        nodesGroup: null,
        color: null,
        dialog: null,
        sourceFieldName: null,
        targetFieldName: null,
        measureOneName: null,
        measureTwoName: null,

        //Sankey can use:
        // -- Single Measure (single) to control size of nodes
        // -- Two Measures (double) - 1st for size of nodes and 2nd for color of nodes
        mode: 'single',

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            this.$el.addClass('splunk-sankey');
            if (vizUtils.getCurrentTheme && vizUtils.getCurrentTheme() === 'dark'){
              this.$el.addClass('dark');
            }
        },

        _getColor: function(data) {
            var domain = [];
            var min = 0, max = 0;

            if(this.colorMode === 'categorical') {
                for(var i=0; i < data.nodes.length; i++) {
                    domain.push(data.nodes[i].name.replace(/ .*/, ''));
                }
            }
            else {
                //Find min, max
                if(this.mode === 'single') {
                    for(var j=0; j < data.links.length; j++) {
                        var currentVal = data.links[j].value;
                        if(currentVal < min) min = parseInt(currentVal);
                        if(currentVal > max) max = parseInt(currentVal);
                        if(this.useColors) domain.push(currentVal);
                    }
                }
                else {
                    for(var k=0; k < data.links.length; k++) {
                        var currentVal = data.links[k].colorVal;
                        if(currentVal < min) min = parseInt(currentVal);
                        if(currentVal > max) max = parseInt(currentVal);
                        if(this.useColors) domain.push(currentVal);
                    }
                }
            }

            if(this.useColors) {
                if(this.colorMode === 'categorical') {
                    //Splunk Categorical Color Scheme
                    this.color = d3.scale.ordinal()
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

                    this.color = d3.scale.ordinal()
                        .domain(colorDomain)
                        .range(colorRange);

                    var categoryDomain = [];
                    var categoryRange = [];
                    var colorCategories = domain.sort(function(a, b) { return b - a; });


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
                        categoryDomain.push(colorCategory);
                        categoryRange.push(colorDomain[bin]);
                    }

                    this.category = d3.scale.ordinal()
                                        .domain(categoryDomain)
                                        .range(categoryRange);

                }
            }
            else {
                //No colors - only use first categorical color
                this.colorMode = 'categorical';

                this.color = d3.scale.ordinal()
                            .domain(domain)
                            .range(['#1e93c6']);
            }
        },

        _calcTooltipLocation: function(x, y, showTwo) {
            this.tooltip
                .style('display', 'block')
                .style('left', x < this.width/2
                    ? (x + 22) + 'px'
                    : (x - (showTwo ? 340 : 270) - 14) + 'px')
                .html('');

            if(y < this.height/2) {
                this.tooltip
                    .style('top', (y - 3) + 'px')
                    .style('bottom', null);
            }
            else {
                this.tooltip
                    .style('top', null)
                    .style('bottom', this.height - y + 3 + 'px');
            }

            this.tooltip.classed('tooltip-top-left', false);
            this.tooltip.classed('tooltip-bottom-left', false);
            this.tooltip.classed('tooltip-top-right', false);
            this.tooltip.classed('tooltip-bottom-right', false);

            if(x < this.width/2) {
                if(y < this.height/2) {
                    this.tooltip.classed('tooltip-top-left', true);
                }
                else {
                    this.tooltip.classed('tooltip-bottom-left', true);
                }
            }
            else {
                if(y < this.height/2) {
                    this.tooltip.classed('tooltip-top-right', true);
                }
                else {
                    this.tooltip.classed('tooltip-bottom-right', true);
                }
            }
        },

        _sortAndCleanTooltipTable: function(toolTipData) {
            //TODO: Should we sort by colorVal when there are two measures?
            toolTipData.sort(sortByValDesc);

            //Remove duplicates
            for(var i=0; i < toolTipData.length-1; i++) {
                if(toolTipData[i].title === toolTipData[i+1].title ) {
                    toolTipData.splice(i, 1)
                }
            }

            if(toolTipData.length > MAX_TOOLTIP_VALUES + 1) {
                var tally = 0, tally2 = 0;
                for(var j=toolTipData.length-1; j >= 0; j--) {
                    if(j >= MAX_TOOLTIP_VALUES) {
                        tally += toolTipData[j].value;
                        if(this.mode === 'double') tally2 += toolTipData[j].colorVal;
                        toolTipData.splice(j, 1);
                    }
                    else {
                        var obj = { title: 'Other', value: f.integer(tally) };
                        if(this.mode === 'double') obj.colorVal = f.integer(tally2);
                        toolTipData.push(obj);
                        break;
                    }
                }
            }
        },

        _updateTooltipTable: function(toolTipData, prefix, showTwo) {
            var table = this.tooltip.append('table').attr('class', 'measures');
            var tr = table.selectAll('tr')
                    .data(toolTipData).enter()
                    .append('tr');

            tr.append('td')
                    .attr('class', 'title')
                    .html(function(m) {
                        return '<span style="color:' + (m.color || 'white') + ';">' + (prefix ? '- ' : '') + m.title + '</span>';
                    });

            tr.append('td')
                    .attr('class', 'value')
                    .html(function(m) { return (isNaN(filterFloat(m.value)) ? m.value : f.integer(m.value)); });

            if(this.mode === 'double' && showTwo) {
                this.tooltip.classed('tooltipDouble', true);

                tr.append('td')
                        .attr('class', 'value value2')
                        .html(function(m) {
                            return (isNaN(filterFloat(m.colorVal)) ? m.colorVal : f.integer(m.colorVal));
                        });
            }
            else {
                this.tooltip.classed('tooltipDouble', false);
            }
        },

        _drawSankey: function(data) {
            this.sankey.nodes(data.nodes)
                    .links(data.links)
                    .layout(32);

            this._getColor(data);

            var that = this;
            //--- Draw links (as svg paths)
            var links = this.linksGroup.selectAll('.link').data(data.links);

            // Enter
            var linksEnterSelection = links.enter()
                .append('path')
                .attr('data-shape-name', function(d) {
                    return d.source.name.replace(/\//g, '-') + '_' + d.target.name.replace(/\//g, '-'); })
                .attr('class', 'link');

            this._setupLinkHoverAndTooltips(linksEnterSelection);

            // Update
            links.attr('d', this.path)
                .style('stroke', function(d) {
                    if(that.colorMode === 'categorical') {
                        return d.color = that.color(d.source.name.replace(/ .*/, ''));
                    }
                    else {
                        if(that.mode === 'single') {
                            return d.color = that.color(that.category(d.value));
                        }
                        else {
                            return d.color = that.color(that.category(d.colorVal));
                        }
                    }
                })
                .style('stroke-width', function(d) { return Math.max(1, d.dy); });

            //Formatter options
            links.classed('hide', function(d) {
                if(!that.showSelf && !that.showBackwards) {
                    return (d.cycleBreaker && !(d.target.x < d.source.x)) || d.target.x < d.source.x;
                }

                if(!that.showSelf) {
                    return (d.cycleBreaker && !(d.target.x < d.source.x));
                }

                if(!that.showBackwards) {
                    return d.target.x < d.source.x;
                }

                return false;
            });

            links.classed('backwards', function(d) { return that.styleBackwards && d.target.x < d.source.x; });

            links.classed('link-drilldown', function() {return this.useDrilldown; }.bind(this));

            // Exit
            links.exit().remove();

            //--- Draw nodes
            var nodes = this.nodesGroup.selectAll('.node').data(data.nodes);

            // Enter
            var nodesEnterSelection = nodes.enter()
                .append('g')
                .attr('data-shape-name', function(d) { return d.name.replace(/\//g, '-'); })
                .attr('class', 'node');

            nodesEnterSelection.append('rect')
                .attr('width', this.sankey.nodeWidth());

            nodesEnterSelection.append('text')
                .attr('x', -6)
                .attr('dy', '.35em')
                .attr('text-anchor', 'end')
                .attr('transform', null);

            this._setupNodeHoverAndTooltips(nodesEnterSelection);

            // Update
            nodes
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                })
                .call(d3.behavior.drag()
                    .origin(function(d) { return d; })
                    .on('drag', dragmove));

            nodes.select('rect')
                .attr('height', function(d) { return Math.max(3, d.dy); })
                .style('fill', function(d) {
                    if(that.colorMode === 'categorical') {
                        return d.color = that.color(d.name.replace(/ .*/, ''));
                    }
                    else {
                        return '#BFBFBF'; //grey nodes for sequential colorMode
                    }
                });

            if(this.showLabels) {
                nodes.select('text')
                    .attr('y', function(d) { return d.dy / 2; })
                    .text(function(d) { return d.name; })
                    .filter(function(d) { return d.x < that.width / 2; })
                        .attr('x', 6 + that.sankey.nodeWidth())
                        .attr('text-anchor', 'start');
            }

            // Exit
            nodes.exit().remove();

            function dragmove(d) {
                if(that.showTooltip) {
                    that.tooltip.style('display', 'none');
                }

                d3.select(this).attr('transform', 'translate(' + d.x + ',' + (d.y = Math.max(0, Math.min(that.height - d.dy, d3.event.y))) + ')');
                that.sankey.relayout();
                links.attr('d', that.path);
            }
        },

        //Hovering over a node (bar) does the following:
        // -- Hightlights the connected streams.
        // -- Mutes all non-connected streams (and nodes)
        // -- If tooltips on, display a tooltip listing all connections and their weights.
        _setupNodeHoverAndTooltips: function(nodes) {
            var that = this;
            nodes
                .on('mouseover', function(d) {
                    //First, mute all nodes and links.
                    that.linksGroup.selectAll('path').classed('mute', true);
                    that.nodesGroup.selectAll('.node').classed('mute', true);

                    //Highlight this node
                    that.nodesGroup
                        .select('*[data-shape-name="' + d.name.replace(/\//g, '-') + '"]')
                        .classed('mute', false)
                        .classed('highlight', true);

                    //Highlight target nodes and links where this node is the source.
                    d.sourceLinks.forEach(function(sourceLink) {
                        that.linksGroup
                            .select('*[data-shape-name="' + sourceLink.source.name.replace(/\//g, '-') + '_' + sourceLink.target.name.replace(/\//g, '-') + '"]')
                            .classed('mute', false)
                            .classed('highlight', true);

                        that.nodesGroup
                            .select('*[data-shape-name="' + sourceLink.target.name.replace(/\//g, '-') + '"]')
                            .classed('mute', false)
                            .classed('highlight', true);
                    });

                    //Highlight source nodes and links where this node is the target.
                    d.targetLinks.forEach(function(targetLink) {
                        that.linksGroup
                            .select('*[data-shape-name="' + targetLink.source.name.replace(/\//g, '-') + '_' + targetLink.target.name.replace(/\//g, '-') + '"]')
                            .classed('mute', false)
                            .classed('highlight', true);

                        that.nodesGroup
                            .select('*[data-shape-name="' + targetLink.source.name.replace(/\//g, '-') + '"]')
                            .classed('mute', false)
                            .classed('highlight', true);
                    });
                })
                .on('mouseout', function(d) {
                    if(that.showTooltip) {
                        that.tooltip.style('display', 'none');
                    }

                    //First, unmute all nodes and links.
                    that.linksGroup.selectAll('path').classed('mute', false);
                    that.nodesGroup.selectAll('.node').classed('mute', false);

                    that.nodesGroup
                        .select('*[data-shape-name="' + d.name.replace(/\//g, '-') + '"]')
                        .classed('highlight', false);

                    d.sourceLinks.forEach(function(sourceLink) {
                        that.linksGroup
                            .select('*[data-shape-name="' + sourceLink.source.name.replace(/\//g, '-') + '_' + sourceLink.target.name.replace(/\//g, '-') + '"]')
                            .classed('highlight', false);

                        that.nodesGroup
                            .select('*[data-shape-name="' + sourceLink.target.name.replace(/\//g, '-') + '"]')
                            .classed('highlight', false);
                    });

                    d.targetLinks.forEach(function(targetLink) {
                        that.linksGroup
                            .select('*[data-shape-name="' + targetLink.source.name.replace(/\//g, '-') + '_' + targetLink.target.name.replace(/\//g, '-') + '"]')
                            .classed('highlight', false);

                        that.nodesGroup
                            .select('*[data-shape-name="' + targetLink.source.name.replace(/\//g, '-') + '"]')
                            .classed('highlight', false);
                    });
                });

            if(that.showTooltip) {
                nodes
                    .on('mousemove', function(d) {
                        var pos = d3.mouse(this);
                        var x = pos[0] + d.x,
                            y = pos[1] + d.y;

                        that._calcTooltipLocation(x, y, (that.mode === 'double'));

                        that.tooltip.append('h4').text(d.name);

                        //Sources - where this node is the target
                        if(d.targetLinks.length > 0) {
                            var table = that.tooltip.append('table');
                            tr = table.append('tr');
                            tr.append('td').attr('class', 'labelTxt').html(function(m) { return 'Source'; });
                            tr.append('td').attr('class', 'header').html(function(m) { return that.measureOneName; });

                            if(that.mode === 'double') tr.append('td').attr('class', 'header header2').html(function(m) { return that.measureTwoName; });

                            toolTipData = [];
                            d.targetLinks.forEach(function(targetLink) {
                                if(d.name !== targetLink.source.name) {
                                    var obj = {
                                        title: targetLink.source.name,  //link is from source
                                        value: parseInt(targetLink.value),
                                        color: that.color(
                                            (that.colorMode === 'categorical') ?
                                                (targetLink.source.name.replace(/ .*/, '')) :
                                                (that.category(that.mode === 'double' ? targetLink.colorVal : targetLink.value))
                                        )
                                    };
                                    if(that.mode === 'double') obj.colorVal = parseInt(targetLink.colorVal);

                                    toolTipData.push(obj);
                                }
                            });

                            that._sortAndCleanTooltipTable(toolTipData);
                            that._updateTooltipTable(toolTipData, true, (that.mode === 'double'));
                        }

                        //Targets - where this node is the source
                        if(d.sourceLinks.length > 0) {
                            var table = that.tooltip.append('table').attr('class', 'padded');
                            var tr = table.append('tr');
                            tr.append('td').attr('class', 'labelTxt').html(function(m) { return 'Target'; });
                            tr.append('td').attr('class', 'header').html(function(m) { return that.measureOneName; });

                            if(that.mode === 'double') tr.append('td').attr('class', 'header header2').html(function(m) { return that.measureTwoName; });

                            var toolTipData = [];
                            d.sourceLinks.forEach(function(sourceLink) {
                                if(d.name !== sourceLink.target.name) {
                                    var obj = {
                                        title: sourceLink.target.name,  //link is from target
                                        value: parseInt(sourceLink.value),
                                        color: that.color(
                                            (that.colorMode === 'categorical') ?
                                                sourceLink.target.name.replace(/ .*/, '') :
                                                that.category((that.mode === 'double') ? sourceLink.colorVal : sourceLink.value)
                                        )
                                    };
                                    if(that.mode === 'double') obj.colorVal = parseInt(sourceLink.colorVal);

                                    toolTipData.push(obj);
                                }
                            });

                            that._sortAndCleanTooltipTable(toolTipData);
                            that._updateTooltipTable(toolTipData, true, (that.mode === 'double'));
                        }
                    });
            }
        },

        //Hovering over a link (stream) does the following:
        // -- Hightlights the source and target nodes (bars).
        // -- If tooltips on, display a tooltip with the source and target names and values.
        _setupLinkHoverAndTooltips: function(links) {
            var that = this;
            links
                .on('mouseover', function(d) {
                    //First, mute all nodes and links.
                    that.linksGroup.selectAll('path').classed('mute', true);
                    that.nodesGroup.selectAll('.node').classed('mute', true);

                    //Highlight source and target nodes (bars).
                    that.nodesGroup
                        .select('*[data-shape-name="' + d.source.name.replace(/\//g, '-') + '"]')
                        .classed('highlight', true)
                        .classed('mute', false);

                    that.nodesGroup
                        .select('*[data-shape-name="' + d.target.name.replace(/\//g, '-') + '"]')
                        .classed('highlight', true)
                        .classed('mute', false);

                    //Highlight link
                    that.linksGroup.select('*[data-shape-name="' + d.source.name.replace(/\//g, '-') + '_' + d.target.name.replace(/\//g, '-') + '"]')
                        .classed('highlight', true)
                        .classed('mute', false);
                })
                .on('mouseout', function(d) {
                    if(that.showTooltip) {
                        that.tooltip.style('display', 'none');
                    }
                    //First, unmute all nodes and links.
                    that.linksGroup.selectAll('path').classed('mute', false);
                    that.nodesGroup.selectAll('.node').classed('mute', false);

                    //Unhighlight source and target nodes (bars).
                    that.nodesGroup
                        .select('*[data-shape-name="' + d.source.name.replace(/\//g, '-') + '"]')
                        .classed('highlight', false);

                    that.nodesGroup
                        .select('*[data-shape-name="' + d.target.name.replace(/\//g, '-') + '"]')
                        .classed('highlight', false);

                    that.linksGroup.select('*[data-shape-name="' + d.source.name.replace(/\//g, '-') + '_' + d.target.name.replace(/\//g, '-') + '"]')
                        .classed('highlight', false)
                        .classed('mute', false);
                })
                .on('click', _.bind(this.onLinkClick, that));

            if(that.showTooltip) {
                links
                    .on('mousemove', function(d) {
                        var pos = d3.mouse(this);
                        var x = pos[0],
                                y = pos[1];

                        that._calcTooltipLocation(x, y);

                        var table = that.tooltip.append('table');
                        var tr = table.append('tr');
                        tr.append('td').attr('class', 'labelTxt').html(function(m) { return 'Source'; });
                        tr.append('td').attr('class', 'nodeName').html(function(m) {
                            return '<span style="color:' + ((that.colorMode === 'categorical') ?
                                that.color(d.source.name.replace(/ .*/, '')) : 'white') + '">' + d.source.name + '</span>';
                        });
                        tr = table.append('tr');
                        tr.append('td').attr('class', 'labelTxt').html(function(m) { return 'Target'; });
                        tr.append('td').attr('class', 'nodeName').html(function(m) {
                            return '<span style="color:' + ((that.colorMode === 'categorical') ?
                                that.color(d.target.name.replace(/ .*/, '')) : 'white') + '">' + d.target.name + '</span>';
                        });

                        //Tooltip with the source and target names and values.
                        var toolTipData = [];

                        toolTipData.push({
                            title: that.measureOneName,
                            value: d.value,
                            // if the viz is in double mode, the streams and nodes will be colored
                            // based on colorVal -> it doesn't make sense to colorize the first tooltip item
                            color: that.mode === 'double' ?
                                'white' : that.color(
                                    (that.colorMode === 'categorical') ?
                                        d.source.name.replace(/ .*/, '') : that.category(d.value)
                                )
                        });

                        if(that.mode === 'double') {
                            toolTipData.push({
                                title: that.measureTwoName,
                                value: d.colorVal,
                                color: that.color(
                                    (that.colorMode === 'categorical') ?
                                        d.source.name.replace(/ .*/, '') : that.category(d.colorVal)
                                )
                            });
                        }

                        that._updateTooltipTable(toolTipData);
                    });
            }
        },

        onLinkClick: function(d) {
            if(d3.event.defaultPrevented) {
                return;
            }
            if(this.showTooltip) {
                this.tooltip.style('display', 'none');
            }

            var payload = {
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: {}
            };

            payload.data[this.sourceFieldName] = d.source.name;
            payload.data[this.targetFieldName] = d.target.name;

            this.drilldown(payload, d3.event);
        },

        _getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        },

        _getConfigParams: function(config) {
            this.mode = 'single';

            this.showLabels = vizUtils.normalizeBoolean(this._getEscapedProperty('showLabels', config), { default: true });
            this.showLegend = vizUtils.normalizeBoolean(this._getEscapedProperty('showLegend', config), { default: true });
            this.showTooltip = vizUtils.normalizeBoolean(this._getEscapedProperty('showTooltip', config), { default: true });

            //Custom Color Handling
            this.useColors = vizUtils.normalizeBoolean(this._getEscapedProperty('useColors', config), { default: true });
            this.colorMode = this._getEscapedProperty('colorMode', config) || 'categorical'; // or sequential
            this.minColor = this._getEscapedProperty('minColor', config) || '#d93f3c';
            this.maxColor = this._getEscapedProperty('maxColor', config) || '#3fc77a';
            this.numOfBins = this._getEscapedProperty('numOfBins', config) || 6;

            this.useDrilldown = this._isEnabledDrilldown(config);

            this.showSelf = vizUtils.normalizeBoolean(this._getEscapedProperty('showSelf', config), { default: false });
            this.showBackwards = vizUtils.normalizeBoolean(
                this._getEscapedProperty('showBackwards', config),
                 { default: false }
            );
            this.styleBackwards = vizUtils.normalizeBoolean(
                this._getEscapedProperty('styleBackwards', config),
                { default: false }
            );
        },

        // Optionally implement to format data returned from search.
        // The returned object will be passed to updateView as 'data'
        formatData: function(data, config) {
            // Check for empty data
            if(data.rows.length < 1) {
                    return false;
            }

            this._getConfigParams(config);

            this.sourceFieldName = data.fields[0].name;
            this.targetFieldName = data.fields[1].name;
            this.measureOneName = data.fields[2].name;

            //Setup mode of operation: single or double measure.
            if(data.rows[0].length < 3) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Check the Statistics tab. The results table must include columns representing these three fields: <from>, <to>, and <value>.'
                );
            }
            else if(data.rows[0].length > 3) {
                this.mode = 'double';
                this.measureTwoName = data.fields[3].name;

                if(isNaN(filterFloat(data.rows[0][3]))) {
                    throw new SplunkVisualizationBase.VisualizationError(
                        'Check the Statistics tab. To generate a double measure Sankey diagram, make sure that the fourth column in the results table is numeric.'
                    );
                }
            }

            if(isNaN(filterFloat(data.rows[0][2]))) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Check the Statistics tab. To generate a Sankey diagram, make sure that the third column in the results table is numeric.'
                );
            }

            var that = this;
            var dataMap = data.rows.reduce(function(map, nodeArr) {
                var from = nodeArr[0],
                        to   = nodeArr[1],
                        val  = nodeArr[2];

                //Make sure 'from' node is in the results.
                if(!map.objMap[from]) {
                    map.objMap[from] = {
                        name: from,
                        index: map.results.nodes.length
                    };

                    map.results.nodes.push({ name: from });
                }

                //Make sure 'to' node is in the results.
                if(!map.objMap[to]) {
                    map.objMap[to] = {
                        name: to,
                        index: map.results.nodes.length
                    };

                    map.results.nodes.push({ name: to });
                }

                //Every link object has 'source', 'target' node indices and a 'value' for the link weight
                var obj = {
                    source: map.objMap[from].index,
                    target: map.objMap[to].index,
                    value: val
                };

                if(that.mode === 'double') {
                    obj.colorVal = nodeArr[3];
                }

                map.results.links.push(obj);

                return map;
            }, {
                results: {
                    nodes:[],
                    links:[]
                },
                objMap: {}
            });

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

            //Only show Legend for sequential colorMode with colorVal.
            if(this.colorMode === 'categorical' || !this.useColors) this.showLegend = false;

            //Resize to fill container
            var width = this.$el.width() - MARGIN.left - MARGIN.right - (this.showLegend ? LEGEND_WIDTH : 0);
            var height = this.$el.height() - MARGIN.top - MARGIN.bottom;

            width = (width <= 0 ? DEFAULT_WIDTH - MARGIN.left - MARGIN.right - (this.showLegend ? LEGEND_WIDTH : 0) : width);
            height = (height <= 0 ? DEFAULT_HEIGHT - MARGIN.top - MARGIN.bottom : height);

            this.width = width;
            this.height = height;

            //Add the components
            var div = d3.select(this.el).append('div')
                    .style('width', (width + MARGIN.left + MARGIN.right) + 'px')
                    .style('height', (height + MARGIN.top + MARGIN.bottom) + 'px')
                    .style('top', MARGIN.top + 'px');

            var svg = div.append('svg')
                    .attr({
                        width: width + MARGIN.left + MARGIN.right,
                        height: height + MARGIN.top + MARGIN.bottom
                    })
                    .append('g')
                    .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');

            this.linksGroup = svg.append('g').attr('class', 'links');
            this.nodesGroup = svg.append('g').attr('class', 'nodes');

            //Configure sankey and get the path generator.
            this.sankey = d3sankey
                .nodeWidth(15)
                .nodePadding(10)
                .size([width, height]);

            this.path = this.sankey.link();

            //Tooltip
            if(this.showTooltip) {
                this.tooltip = div.append('div')
                    .attr('class', 'tooltip')
                    .style('display', 'none')
                    .text('Tooltip');
            }

            this.dialogContainerName = _.uniqueId() + 'drilldown-choice';
            this.dialogContainer = div.append('div')
                .attr('id', this.dialogContainerName);

            this._drawSankey(data);

            //Add Legend
            var that = this;
            if(this.showLegend) {
                var legend = d3.select(this.el).append('div')
                        .attr('class', 'legend')
                        .append('ul');

                var keys = legend.selectAll('li.key')
                        .data(that.color.domain());

                keys.enter().append('li')
                        .attr('class', 'key')
                        .style('border-left-color', function(d) {
                            return that.color(d);
                        })
                        .append('span')
                        .text(function(d) {
                            if(that.colorMode === 'categorical') {
                                return d;
                            }
                            else {
                                return '>= ' + f.integer(d);
                            }
                        });

                if(that.colorMode === 'sequential') {
                    if(this.mode === 'single') {
                        legend.append('text').text(this.measureOneName);
                    }
                    else if(this.mode === 'double') {
                        legend.append('text').text(this.measureTwoName);
                    }
                }
            }
        },

         _isEnabledDrilldown: function(config) {
            if (config['display.visualizations.custom.drilldown'] && config['display.visualizations.custom.drilldown'] === 'all') {
                return true;
            }
            return false;
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
            // If size changed, redraw.
            if(this.width !== this.$el.width() - MARGIN.left - MARGIN.right - (this.showLegend ? LEGEND_WIDTH : 0) ||
                this.height !== this.$el.height() - MARGIN.top - MARGIN.bottom ) {
                this.invalidateUpdateView();
            }
        }

    });
});
