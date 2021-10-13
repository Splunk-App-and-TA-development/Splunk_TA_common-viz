define([
            'jquery',
            'underscore',
            'api/SplunkVisualizationBase',
            'api/SplunkVisualizationUtils',
            'd3'
        ],
        function(
            $,
            _,
            SplunkVisualizationBase,
            vizUtils,
            d3
        ) {

    // These ranges are hardcoded as they are the builtin
    // splunk time units. Any other range is calculated from
    // the range of the data
    // NOTE: _.range excludes the final value, so they are all 1 over
    var TIME_RANGES = {
        'date_hour' : _.range(0, 24),
        'date_minute': _.range(0, 60),
        'date_mday': _.range(1, 32),
        'date_month': [
            'january', 'february', 'march',
            'april', 'may', 'june',
            'july', 'august', 'september',
            'october', 'november', 'december'
        ],
        'date_second': _.range(0, 60),
        'date_wday': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    };
    var LABEL_WIDTH = 130;
    var MIN_RADIUS = 1;
    var LEGEND_SPACING = 8;
    var LEGEND_CIRCLE_RADIUS = 7;
    var LEGEND_WIDTH = 100;

    // Returns true if all elements of a list are numbers
    var isNumericList = function (list) {
        return _.every(list, function(i) { return _.isNumber(i); });;
    }

    // Truncates a string to a length, optionally adding a suffix
    var truncate = function(str, maxLength, suffix) {
        maxLength = maxLength || 25;
        suffix = suffix || '...';
        str = str || 'null';
        if (str.length > maxLength) {
            str = str.substring(0, maxLength + 1);
            str = str + suffix;
        }
        return str;
    }

    // Rounds to thousands and adds a 'K'
    var roundToThousands = function(value) {
        if (value > 1000) {
            value = Math.round((value / 1000)) + 'K';
        }
        return value;
    }

    var formatHours = function(x) {
        var parsed = parseInt(x, 10);
        if (x < 12) {
            return (x === 0 ? 12 : x) + "AM";
        }
        else {
            return (x === 12 ? 12 : x-12) + "PM";
        }
    };

    var formatLabel = function(x) {
        return x;
    }

    var isDarkTheme = vizUtils.getCurrentTheme && vizUtils.getCurrentTheme() === 'dark';

    return SplunkVisualizationBase.extend({

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

            this.$el = $(this.el);
            this.$el.addClass('splunk-punchcard');
            if (isDarkTheme){
              this.$el.addClass('dark');
            }
        },

        setupView: function() {
            // Here we set up the initial view layout
            var margin = {top: 30, right: 30, bottom: 30, left: 30};
            var availableWidth = parseInt(this.$el.width(), 10);
            var availableHeight = parseInt(this.$el.height(), 10);

            var svg = d3.select(this.el)
                .append('svg')
                .attr('width', availableWidth)
                .attr('height', availableHeight)
                .attr('pointer-events', 'all');

            this._viz = { container: this.$el, svg: svg, margin: margin};
        },

        formatData: function(data) {
            var fields = data.fields;
            var rows = data.rows;

            if (rows.length < 1 && fields.length < 1) {
                return false;
            }

            if (fields.length < 3) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Check the Statistics tab. To create a punchcard, there must be at least three columns in the results table. These columns should represent two dimensions and a metric count.'
                );
            }

            // Get dimension names
            this.xDimension = fields[0].name;
            this.yDimension = fields[1].name;

            var categories = {};
            var currentCategory = 1;

            // We keep the possible values of
            // x for calculating the x scale later
            var xValues = [];
            var colorCategories = [];

            var countData = {};
            var nonNumericalCategories = false;

            _.each(rows, function(row) {
                var name = row[1];
                var category = row[3];
                var count = parseInt(row[2], 10);

                var xValue = row[0];

                if (_.isNaN(+category)) {
                    nonNumericalCategories = true;
                } else {
                    category = +category;
                }

                xValues.push(xValue);

                countData[name] = countData[name] ||
                    {
                        total: 0,
                        name: name,
                        counts: []
                    };
                countData[name]['total'] += count;
                countData[name]['counts'].push({
                    yValue: name,
                    xValue: xValue,
                    count: count,
                    category: category
                });
                colorCategories.push(category);
            });

            // Dedupe range values
            xValues = _.uniq(xValues);

            if(_.contains(_.keys(TIME_RANGES), this.yDimension)){
                countData = _.sortBy(countData, function(t){
                    return _.indexOf(TIME_RANGES[this.yDimension], t.name)
                }.bind(this));
            }

            var metadata = {
                xValues: xValues,
                colorCategories: _.uniq(colorCategories),
                nonNumericalCategories: nonNumericalCategories
            };

            data['metadata'] = metadata;
            data['countData'] = _.values(countData);

            return data;
        },

        updateView: function(data, config) {
            if (!data || data.rows.length < 1) {
                return
            }

            this.useDrilldown = this._isEnabledDrilldown(config);

            var radiusScale = this._getEscapedProperty('radiusScale', config) || 'local';
            var useColors = vizUtils.normalizeBoolean(this._getEscapedProperty('useColors', config));
            var colorMode = this._getEscapedProperty('colorMode', config) || 'categorical';
            var minColor = this._getEscapedProperty('minColor', config) || '#d93f3c';
            var maxColor = this._getEscapedProperty('maxColor', config) || '#3fc77a';
            var numOfBins = this._getEscapedProperty('numOfBins', config) || 6;
            var labelRotation = this._getEscapedProperty('labelRotation', config) || 'horizontal';
            var showLegend = useColors;
            var colorScale;
            var categoryScale;

            var that = this;

            if (useColors) {
                if (colorMode === 'categorical') {
                    categoryScale = d3.scale.ordinal()
                        .domain(data.metadata.colorCategories)
                        .range(data.metadata.colorCategories);
                    colorScale = d3.scale.ordinal()
                        .domain(data.metadata.colorCategories)
                        .range(vizUtils.getColorPalette('splunkCategorical'));
                } else {
                    if (data.metadata.nonNumericalCategories) {
                        // throw, because we can't interpolate sequentially w/ categories as domain
                        throw new SplunkVisualizationBase.VisualizationError(
                            'Check the Statistics tab. To use the sequential color mode, color field values must be numerical.'
                        );
                    }

                    var colorCategories = data.metadata.colorCategories.sort(function(a, b) { return a - b; });
                    var min = _.min(colorCategories);
                    var max = _.max(colorCategories);
                    var domain = [];
                    var range = [];

                    var interpolateNum = d3.interpolateRound(min, max);
                    var interpolateColor = d3.interpolateHcl(minColor, maxColor); //Rgb, Hcl, Hsl

                    for(var x=0; x < numOfBins; x++) {
                        domain.push(interpolateNum(x/(numOfBins-1)));
                        range.push(interpolateColor(x/(numOfBins-1)));
                    }

                    colorScale = d3.scale.ordinal()
                                .domain(domain)
                                .range(range);

                    var categoryDomain = [];
                    var categoryRange = [];

                    // binning
                    for (var i = 0; i < colorCategories.length; i++) {
                        var colorCategory = colorCategories[i];
                        var bin = -1;
                        for (var o = 0; o < domain.length; o++) {
                            if (domain[o] <= colorCategory) {
                                bin++;
                                continue;
                            }
                        }
                        categoryDomain.push(colorCategory);
                        categoryRange.push(domain[bin]);
                    }
                    categoryScale = d3.scale.ordinal()
                                        .domain(categoryDomain)
                                        .range(categoryRange);
                }
            } else {
                categoryScale = d3.scale.ordinal()
                        .domain(data.metadata.colorCategories)
                        .range(data.metadata.colorCategories);
                colorScale = d3.scale.ordinal()
                    .domain(data.metadata.colorCategories)
                    .range(['#1e93c6']);
            }

            var containerEl = this.el;
            var fields = data.fields;
            var metadata = data.metadata;
            var countData = data.countData;

            var formatXAxisLabel = (this.xDimension === 'date_hour') ?
                formatHours :
                function(x) {
                    return labelRotation === 'angle' ? truncate(x, 4) : truncate(x, 9);
                };
            var formatYAxisLabel = function(label) {
                return truncate(label, 15);
            };
            var formatCount = roundToThousands;

            var containerHeight = this.$el.height();
            var containerWidth = this.$el.width();

            // Clear svg
            var svg = $(this._viz.svg[0]);
            svg.empty();
            svg.height(containerHeight);
            svg.width(containerWidth);

            // Add the graph group as a child of the main svg
            var graphWidth = containerWidth - this._viz.margin.left - this._viz.margin.right - LABEL_WIDTH - (LEGEND_WIDTH * (showLegend ? 1 : 0));
            var graphHeight = containerHeight - this._viz.margin.top - this._viz.margin.bottom;
            var chartHeight = graphHeight - 30; // graphHeight - axis height
            var graph = this._viz.svg
                .append('g')
                .attr('width', graphWidth)
                .attr('height', graphHeight)
                .attr('transform', 'translate('
                        + (this._viz.margin.left + LABEL_WIDTH) + ','
                        + this._viz.margin.top + ')');

            var colors = [
                '#1e93c6', '#f2b827',
                '#d6563c', '#6a5c9e',
                '#31a35f', '#ed8440',
                '#3863a0', '#a2cc3e',
                '#cc5068', '#73427f'
            ];

            // If we have a hardcoded set of xValues, we use it,
            // otherwise it comes from the data
            var xValues =  TIME_RANGES[this.xDimension]
                || metadata.xValues;

            // If the x scale is numbers, we make it linear, otherwise its ordinal
            var xScale = null;
            if (isNumericList(xValues)) {
                var start = _.min(xValues);
                var end = _.max(xValues);

                xScale = d3.scale.linear()
                    .domain([start, end])
                    .range([0, graphWidth - this._viz.margin.right]);
            }
            else {
                xScale = d3.scale.ordinal()
                    .domain(xValues)
                    .rangePoints([0, graphWidth - this._viz.margin.right]);
            }

            // Set up the axis markers
            var xAxis = d3.svg.axis()
                .scale(xScale)
                .ticks(xValues.length + 1)
                .tickFormat(formatXAxisLabel)
                .orient('top');

            var axisContainer = graph.append('g')
                .attr('class', 'x axis')
                .call(xAxis);

            var axisText = axisContainer.selectAll('text');

            axisText
                .attr('data-label-input', function(d) { return d; })

            axisText
                .append('title')
                .attr('data-label-input', function(d) { return d; })
                .text(function(d) { return d; });

            if (labelRotation === 'angle') {
                axisText
                    .attr('y', 0)
                    .attr('x', 9)
                    .attr('dy', '-.35em')
                    .attr('transform', 'rotate(-33, -5, 5)')
                    .style('text-anchor', 'start');
            }

            var textFillColor = isDarkTheme ? '#E1E6EB' : '#333';

            (d3.select(this.el).selectAll('.tick')[0]).forEach(function(d1, index) {
                d3.select(d1).select('text')
                    .on('mouseover', function(d) {
                            d3.select(this).style('fill', textFillColor)
                                .style('font-weight', 'bold');
                            d3.select(containerEl).selectAll('circle[data-column="' + d + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', '0');
                            d3.select(containerEl).selectAll('text[data-column="' + d + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', '1');
                    })
                    .on('mouseout',function(d) {
                            d3.select(this).style('fill', textFillColor)
                                .style('font-weight', 'normal');
                            d3.select(containerEl).selectAll('circle[data-column="' + d + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', '1');
                            d3.select(containerEl).selectAll('text[data-column="' + d + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', '0');
                    })
                    .on('click', function(d) {
                        var element = d3.select(this);
                        that._axisLabelDrilldown(that.xDimension, element.attr('data-label-input'));
                    });
            });

            var col = graphWidth / xValues.length;

            var dataMax = _.max(_.pluck(_.flatten(_.pluck(countData, 'counts')), 'count'));

            var rows = countData.length;

            // maximum radius & row height will be calculated dynamically
            // this radius ensures that circles won't overlap in the x dimension
            var maxRadiusBasedOnWidth = ((graphWidth - LABEL_WIDTH) / xValues.length) / 2;
            var maxRadiusBasedOnHeight = (chartHeight / rows) / 2;
            var maxRadius = Math.min(maxRadiusBasedOnHeight, maxRadiusBasedOnWidth);
            // the smallest maximum radius should be 6.5px -> row height of 15px
            maxRadius = Math.max(maxRadius, 6.5);
            var rowHeight = maxRadius * 2 + 2;
            var axisHeight = 30;

            // calculate the svg height based on rows so it can overflow
            var overflowHeight = this._viz.margin.top + axisHeight + rowHeight * countData.length;
            var legendHeight = axisHeight + colorScale.domain().length * (2 * LEGEND_CIRCLE_RADIUS + LEGEND_SPACING);

            svg.height(Math.max(overflowHeight, legendHeight));

            _.each(countData, function(row, j) {

                // Scaler for radius
                var scaleMax = (radiusScale === 'global') ? dataMax : _.max(_.pluck(_.flatten(row.counts), 'count'));
                var rScale = d3.scale.linear()
                    .domain([
                        0,
                        scaleMax
                    ])
                    .range([MIN_RADIUS, maxRadius])
                    .clamp(true);

                // Append a category class
                var g = graph.append('g')
                    .attr('class','dimension')
                    .attr('data-category', row.category);

                // Add circles
                var circles = g.selectAll('circle')
                    .data(row['counts'])
                    .enter()
                    .append('circle');

                // Add text
                var text = g.selectAll('text')
                    .data(row['counts'])
                    .enter()
                    .append('text')
                    .attr('data-ccat', function(d, i) {
                        return colorMode === 'categorical' ? d.category : categoryScale(d.category);
                    });

                // Position and color the circles
                circles
                    .attr('cx', function(d, i) { return xScale(d.xValue); })
                    .attr('cy', j * rowHeight + rowHeight)
                    .attr('r', function(d) { return rScale(d.count); })
                    .attr('data-column', function(d, i) { return d.xValue })
                    .attr('data-ccat', function(d, i) {
                        return colorMode === 'categorical' ? d.category : categoryScale(d.category);
                    })
                    .style('fill', function(d, i) {
                        return useColors ? colorScale(categoryScale(d.category)) : 'rgb(30, 147, 198)';
                    })
                    .append('svg:title')
                        .text(function(d) { return d.count; });

                var labels = g.selectAll('.punch-label')
                    .data(row['counts']);

                var labelEnter = labels.enter().append('g')
                    .attr('class', 'punch-label')
                    .attr('data-column', function(d, i) { return d.xValue })
                    .on('mouseover', function(d){
                        var selection = d3.select(this);
                        var text = selection.select('text')
                            .style('font-weight', 'bold');
                        text.transition()
                            .duration(120)
                            .style('opacity', 1);
                        text.attr('storedFill', text.style('fill'))
                            .style('fill', textFillColor);
                        var currentCol = text.attr('data-column');
                        d3.select(d3.select(this).node().parentNode)
                            .selectAll('circle[data-column="' + currentCol + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', '0');
                    })
                    .on('mouseout', function(d){
                        var selection = d3.select(this)
                        var text = selection.select('text')
                            .style('font-weight', 'normal');
                        text.transition()
                            .duration(120)
                            .style('opacity', 0);
                        text.style('fill', text.attr('storedFill'));
                        var currentCol = text.attr('data-column');
                        d3.select(d3.select(this).node().parentNode)
                            .selectAll('circle[data-column="' + currentCol + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', '1');
                    })
                    .on('click', that._punchDrilldown.bind(that));

                labelEnter.append('rect')
                    .style('fill', '#000000')
                    .style('opacity', 0);

                labelEnter.append('text')
                    .attr('data-column', function(d, i) { return d.xValue })
                    .attr('data-ccat', function(d, i) { return colorMode === 'categorical' ? d.category : categoryScale(d.category); })
                    .style('text-anchor', 'middle')
                    .style('fill', function(d) { return useColors ? colorScale(categoryScale(d.category)) : 'rgb(30, 147, 198)'; })
                    .style('opacity', 0);

                labels
                    .attr('transform', function(d, i){
                        return 'translate(' +
                            (xScale(d.xValue) - maxRadius) + ',' + ((j * rowHeight) + maxRadius) +
                        ')';
                    })
                    .select('text')
                        .text(function(d) {
                            return formatCount(d.count)
                        })
                        .attr('class', 'value')
                        .attr('y', maxRadius + 7)
                        .attr('x', maxRadius);

                labels
                    .select('rect')
                    .attr('width', (maxRadius * 2) + 2)
                    .attr('height', (maxRadius * 2) + 2);

                // Position and color the labels
                g.append('text')
                    .attr('y', j * rowHeight + rowHeight + 5)
                    .attr('x', -LABEL_WIDTH)
                    .attr('class','label')
                    .attr('data-label-input', row['name'])
                    .text(formatYAxisLabel(row['name']))
                    .style('fill', isDarkTheme ? '#E1E6EB' : '#555')
                    .on('mouseover', function(p) {
                        var g = d3.select(this).node().parentNode;
                        var element = d3.select(this);
                        element.attr('storedFill', element.style('fill'));
                        element.style('fill', isDarkTheme ? 'white' : 'black');
                        element.style('font-weight', 'bold');
                        d3.select(g).selectAll('circle')
                            .transition()
                            .duration(120)
                            .style('opacity','0');
                        d3.select(g).selectAll('g text.value')
                            .transition()
                            .duration(120)
                            .style('opacity','1');
                    })
                    .on('mouseout', function(p) {
                        var g = d3.select(this).node().parentNode;
                        var element = d3.select(this);
                        element.style('fill', element.attr('storedFill'));
                        element.style('font-weight', 'normal');
                        d3.select(g).selectAll('circle')
                            .transition()
                            .duration(120)
                            .style('opacity','1');
                        d3.select(g).selectAll('g text.value')
                            .transition()
                            .duration(120)
                            .style('opacity','0');
                    })
                    .on('click', function(){
                        var element = d3.select(this);
                        that._axisLabelDrilldown(that.yDimension, element.attr('data-label-input'));
                    });
            });

            if (showLegend) {
                var legend = graph.append('g')
                    .attr('class', 'legend-container')
                    .attr('transform', function(d, i) {
                        return 'translate(' + (graphWidth + LEGEND_SPACING) + ',0)';
                    })
                    .attr('height', colorScale.domain() * (2 * LEGEND_CIRCLE_RADIUS + LEGEND_SPACING));


                var legendItems = legend.selectAll('.legend-item')
                    .data(colorScale.domain())
                    .enter()
                    .append('g')
                    .attr('class', 'legend-item')
                    .attr('transform', function(d, i) {
                        var height = 2 * LEGEND_CIRCLE_RADIUS + LEGEND_SPACING;
                        var vert = i * height;
                        return 'translate(' + 0 + ',' + vert + ')';
                    })
                    .on('mouseover', function(d, i) {
                        d3.select(this).select('text')
                            .style('font-weight', 'bold');
                        graph
                            .selectAll('circle[data-ccat="' + d + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', 0);
                        graph
                            .selectAll('text[data-ccat="' + d + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', 1);
                    })
                    .on('mouseout', function(d, i) {
                        d3.select(this).select('text')
                            .style('font-weight', 'normal');
                        graph
                            .selectAll('circle[data-ccat="' + d + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', 1);
                        graph
                            .selectAll('text[data-ccat="' + d + '"]')
                                .transition()
                                .duration(120)
                                .style('opacity', 0);
                    });

                legendItems.append('circle')
                  .attr('r', LEGEND_CIRCLE_RADIUS)
                  .attr('fill', colorScale);

                legendItems.append('text')
                  .attr('x', 2 * LEGEND_CIRCLE_RADIUS + LEGEND_SPACING)
                  .attr('y', 4)
                  .attr('fill', isDarkTheme ? 'white' : '')
                  .text(function(d) { return truncate((colorMode === 'categorical' ? '' : '>= ') + d, 18); })
                  .append('title')
                  .text(function(d) { return (colorMode === 'categorical' ? '' : '>= ') + d; });
            }

            if (this.useDrilldown) {
                this.$el.addClass('punchcard-drilldown');
            } else {
                this.$el.removeClass('punchcard-drilldown');
            }

            return this;
        },

        _punchDrilldown: function(d){
            var drilldownDescription = {
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: {}
            };
            drilldownDescription.data[this.xDimension] = d.xValue;
            drilldownDescription.data[this.yDimension] = d.yValue;

            this.drilldown(drilldownDescription, d3.event);
        },

         _axisLabelDrilldown: function(key, labelText){
            var drilldownDescription = {
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: {}
            };

            drilldownDescription.data[key] = labelText;

            this.drilldown(drilldownDescription, d3.event);
        },

        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            };
        },

        reflow: function() {
            this.invalidateUpdateView();
        },

        _getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        },

        _isEnabledDrilldown: function(config) {
            if (config['display.visualizations.custom.drilldown'] && config['display.visualizations.custom.drilldown'] === 'all') {
                return true;
            }
            return false;
        }

    });
});