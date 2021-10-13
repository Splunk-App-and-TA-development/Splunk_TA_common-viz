/*
 * Horizon chart visualization view class
 */

define([
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils',
    'jquery',
    'underscore',
    'd3',
    'cubism'
],
function(
    SplunkVisualizationBase,
    vizUtils,
    $,
    _,
    d3,
    cubism
) {

    var LANE_HEIGHT = 32;
    var AXIS_HEIGHT = 30;
    
    var AXIS_FORMAT_SECONDS = d3.time.format("%I:%M:%S %p");
    var AXIS_FORMAT_MINUTES = d3.time.format("%I:%M %p");
    var AXIS_FORMAT_DAYS = d3.time.format("%B %d");

    var isDarkTheme = vizUtils.getCurrentTheme && vizUtils.getCurrentTheme() === 'dark';

    function stringToInt(input, defaultVal) {
        var toReturn = parseInt(input);
        return isNaN(toReturn) ? defaultVal : toReturn;
    }
  
    return SplunkVisualizationBase.extend({
  
        padding: 15,
        options: {},
        minDate: Infinity,
        maxDate: -Infinity,

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            this.$el.addClass('splunk-horizon-chart');
            if (isDarkTheme){
              this.$el.addClass('dark');
            }
            this.$el.css('position', 'absolute');
        },

        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 10000
            };
        },

        formatData: function(data, config) {
            if (!data.fields || data.fields.length == 0) {
                return false;
            }

            if (data.fields[0].name === '_time') {
                this.maxDate = Math.max(-Infinity, new Date(data.columns[0][data.columns[0].length - 1]).getTime());
                this.minDate = Math.min(Infinity, new Date(data.columns[0][0]).getTime());
            }
            else {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Check the Statistics tab. To generate a horizon chart, the first columnn in the results table must be "_time". Use the timechart command to generate a _time field.'
                );
            }

            var series = _.chain(data.fields)
                .pluck('name')
                .filter(function(d) {
                    // Filter out hidden fields starting with underscore
                    return d.substr(0, 1) != '_';
                })
                .value();
            
            var data = _.filter(data.columns, function(d, i) {
                return data.fields[i].name.substr(0, 1) != '_'; ;
            });

            return {
                fields: series,
                columns: data
            }
        },

        updateView: function(data, config) {
            if (!data) {
                return;
            }

            this.options.relative = vizUtils.normalizeBoolean(this._getEscapedProperty('relative', config), { default: true });
            this.options.showChangeInPercent = vizUtils.normalizeBoolean(
                this._getEscapedProperty('showChangeInPercent', config),
                { default: true }
            );
            this.options.smoothen = vizUtils.normalizeBoolean(this._getEscapedProperty('smoothen', config), { default: true });
            this.options.positiveColor = this._getEscapedProperty('positiveColor', config) || '#6db7c6';
            this.options.negativeColor = this._getEscapedProperty('negativeColor', config) || '#d93f3c';
            this.options.numBands = stringToInt(this._getEscapedProperty('numBands', config), 3);

            this.$el.empty();
            
            var width = this.$el.width() || 960;
            var height = this.$el.height() || 400;

            var d3El = d3.select(this.el)

            var chartArea = d3El.append('div')
                .attr('class', 'chart-area')

            var laneContainer = chartArea.append('div')
                .attr('class', 'lane-container')
                .style('top', AXIS_HEIGHT + 'px');
                
            var lanes = laneContainer.append('div')
                .attr('class', 'lanes');

            var axes = chartArea.append('div')
                .style('position', 'absolute')
                .style('height', 'inherit')
                .attr('class', 'axes');

            axes.selectAll('.axis')
                .data(['top', 'bottom'])
                .enter()
                .append('div')
                .attr('class', function(d) { return d + ' axis'; })
                .style('position', 'absolute');

            // Create vertical rule for hover interaction
            this.rule = d3El.append('div')
                .attr('class', 'rule');

            var that = this;
            var series = _.map(data.columns, function(series, i) {
                var compare = +series[0];
                return _.map(series, function(d) {
                    return that.options.relative ? 
                        that.options.showChangeInPercent ? 
                            ((+d - compare) / compare) : 
                            (+d - compare) :
                        +d;
                })
            });

            var totalDuration = (this.maxDate - this.minDate) || 86400000;

            var msPerPixel = totalDuration / width;
            
            var axisFocusFormat = msPerPixel < 6e4 ? // less than a minute
                AXIS_FORMAT_SECONDS : msPerPixel < 36e5 ? // less than an hour
                AXIS_FORMAT_MINUTES : AXIS_FORMAT_DAYS;

            // setting the context for cubism and metrics
            var context = cubism.context()
                .serverDelay(Date.now() - this.maxDate)
                .step(msPerPixel) 
                .size(width)
                .stop();

            function metric(name, values) {
                var num = context.size();

                return context.metric(function(start, stop, step, callback) {
                    var data = _.map(d3.range(num), function(d) {
                        var value = values[0];
                        var idxCalculated = values.length / num * d;
                        var idx = Math.floor(idxCalculated);
                        if (d > 0) {
                            var i = d3.interpolateNumber(values[idx-1], values[idx]);
                            value = that.options.smoothen ? i(idxCalculated % 1) : values[idx] 
                        }
                        return value;
                    })
                    callback(null, data);
                }, name);
            };
            
            var metrics = _.map(data.fields, function(d, i) {
                return metric(d, series[i]);
            });

            // Set up heights
            var axesHeight = AXIS_HEIGHT * 2;
            var lanesHeight = metrics.length * LANE_HEIGHT;

            // If the height is big enough to all lanes, makes space for them if not, they scroll
            var lanesContainerHeight = height > (axesHeight + lanesHeight) ? lanesHeight : height - axesHeight;

            chartArea.style('height', function(){
                return lanesContainerHeight + axesHeight + 'px';
            })
            .style('width', width + 'px');

            laneContainer.style('height', function(){
                return lanesContainerHeight + 'px';
            });

            lanes
                .style('height', function() {
                    return lanesHeight;
                })
                .style('overflow', 'auto');

            //Add axes
            chartArea.select('.axes').selectAll('.axis')
                .each(function(d) {   
                    var axes = d3.select(this);
                    axes.selectAll('*').remove();
                    axes.call(
                        context.axis()
                            .ticks(12)
                            // NOTE: focusFormat is not part of cubism's documented API.
                            // But it seems to work
                            .focusFormat(axisFocusFormat)
                            .orient(d)); 
                });

            // Initializing interactivity
            this.rule.call(context.rule());
            context.on('focus', function(i) {
                if (i > context.size() / 4) {
                    d3.select(that.el).selectAll('.value').style({
                        'right': i == null ? null : context.size() - i + 'px', 
                        'left': null
                    });
                } else {
                    d3.select(that.el).selectAll('.value').style({
                        'left': i == null ? null : i + 'px',
                        'right': null
                    });
                }
            });

            var rangeStop = isDarkTheme ? '#000' : '#FFF';
            // calculate colors
            var colorScale = d3.scale.linear()
                .domain([-this.options.numBands, 0, this.options.numBands])
                .range([this.options.negativeColor, rangeStop, this.options.positiveColor]);

            var colorArray = _.map(
                d3.range(-this.options.numBands, 0).concat(d3.range(1, this.options.numBands + 1)),
                colorScale
            );

            horizon = context.horizon()
                .mode('mirror')
                .colors(colorArray)
                .format(
                    this.options.relative 
                    ? this.options.showChangeInPercent 
                    ? function(d) {
                        if (_.isNaN(d)) {
                            return '';
                        }
                        return d3.format('+,.3p')(d);
                    } 
                    : d3.format('+,.2f') 
                    : d3.format('.2f')
                );

            // Render charts
            lanes.selectAll('div.horizon')
                .data(metrics)
                .enter().append('div')
                .attr('class', 'horizon')
                .call(horizon);  

            return this;
        },

        _getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        },

        // Override to respond to re-sizing events
        reflow: function() {
            this.invalidateUpdateView();
        }
    });
});