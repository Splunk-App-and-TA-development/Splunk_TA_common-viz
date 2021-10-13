/*
 * Calendar Heatmap visualization view class
 */
define([
    'jquery',
    'underscore',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils',
    'd3',
    'cal-heatmap',
    'moment',
    'popper.js',
    'bootstrap/js/dist/tooltip'
],
function(
    $,
    _,
    SplunkVisualizationBase,
    vizUtils,
    d3,
    CalHeatMap,
    moment
) {

    var DEFAULT_WIDTH = 900;
    var MESSAGE_HEIGHT = 30;

    var MAX_RANGES = {
        hour: 12,
        day: 14,
        month: 12,
        year: 2
    }

    // Max allowed results is enough for the number of
    // minutes in 8 days.
    var MAX_RESULTS = 11520;

    var f = {
        integer: d3.format(',.0f')
    }

    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({

        initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            this.$el.addClass('splunk-calendar-heatmap');
            if (vizUtils.getCurrentTheme && vizUtils.getCurrentTheme() === 'dark'){
              this.$el.addClass('dark');
            }

            this.compiledTemplate = _.template(this._template);

            this.heatmaps = [];

            this.tooltipContainer = $('<div class="splunk-calendar-heatmap-tooltip"></div>').appendTo('body');

            this.margin = {top: 15, right: 15, bottom: 15, left: 15};
        },

        _getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        },

        _getConfigParams: function(config) {
            this.cellSize = +this._getEscapedProperty('cellSize', config) || 10;
            this.cellPadding = +this._getEscapedProperty('cellPadding', config) || 2;

            this.cellStyle = this._getEscapedProperty('cellStyle', config) || 'square';
            this.legendType = this._getEscapedProperty('legendType', config) || 'independent';

            this.showLegend = vizUtils.normalizeBoolean(this._getEscapedProperty('showLegend', config), { default: true });

            this.minColor = this._getEscapedProperty('minColor', config) || '#dae667';
            this.maxColor = this._getEscapedProperty('maxColor', config) || '#269489';

            this.numOfBins = this._getEscapedProperty('numOfBins', config) || 6;
            this.splitMonths = vizUtils.normalizeBoolean(this._getEscapedProperty('splitMonths', config), { default: true });

            // SimpleXML only property
            this.range = +this._getEscapedProperty('range', config) || null;

            this.useDrilldown = this._isEnabledDrilldown(config);
        },

        _getDomain: function(span) {

            var scale = d3.scale.threshold()
                .domain([3600, 86400, 604800])
                .range(['hour', 'day', 'month', 'year'])

            domain = scale(span);

            // If the months are not split, we show a year
            if(domain === 'month' && this.splitMonths === false) {
                domain = 'year';
            }

            return domain;
        },

        formatData: function(data, config) {
            // Check for empty data
            if(data.rows.length < 1) {
                return false;
            }

            if(data.rows.length > MAX_RESULTS) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'The search returned too many results to render the visualization. Adjust the query by narrowing the time range or using a bigger span.'
                );
            }

            if(data.fields.length < 2) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Check the Statistics tab. To generate a calendar heat map, the results table must include columns representing values in these two fields: _time and <value>.'
                );
            }

            this._getConfigParams(config);

            var fieldNames = _.pluck(data.fields, 'name');
            var timeIndex = _.indexOf(fieldNames, '_time');
            var spanIndex = _.indexOf(fieldNames, '_span');

            if(spanIndex < 0) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'No span field found. To generate a calendar heat map, the query must include the timechart command with span=1m, span=1h, or span=1d.'
                );
            }

            var columns = _.unzip(data.rows);

            var dataMoments = _.map(columns[timeIndex], function(timeString) {
                return moment(timeString);
            });

            this.earliestMoment = moment.min(dataMoments).clone();
            this.latestMoment = moment.max(dataMoments).clone();

            // Figure out the domain
            // We assume timespans are all similar
            this.domain = this._getDomain(data.rows[0][spanIndex]);

            // Find the earliest displayable data point
            // max hours = 12, max days = 14, max months = 12
            var earliestDisplayMoment = this.latestMoment.clone()
                .startOf(this.domain)
                .subtract(MAX_RANGES[domain] - 1, this.domain + 's');

            this.range = MAX_RANGES[domain];
            this.rangeWarning = false;
            // If the earliest data point is before the earliest possible
            // we set the earliest to the earliest display moment. We will truncate
            if(this.earliestMoment.isBefore(earliestDisplayMoment)){
                this.earliestMoment = earliestDisplayMoment;
                this.rangeWarning = true;
            }
            else {
                this.range = Math.ceil(
                    this.latestMoment
                        .diff(this.earliestMoment.clone().startOf(this.domain), this.domain + 's', true)
                );
            }

            // Convert to the form
            // "splunk_web_service": {
            //     "maxValue": 6,
            //     "data": {
            //         "1461104040": "0",
            //         "1461104100": "0",
            //         "1461104160": "0",
            //         "1461104220": "0",
            //         "1461104280": "6"
            //     }
            // }
            var formattedData = {};
            _.each(data.fields, function(field, i) {
                if(field.name[0] !== '_' ) {

                    // Using this splitby
                    this.splitByField = field.splitby_field;

                    var numbers = _.map(columns[i], function(n){
                        return parseInt(n);
                    });

                    // Remove times before earliest moment
                    var times = {};
                    _.each(dataMoments, function(m, i){
                        if(this.earliestMoment.isSameOrBefore(m)){
                            var timeInSeconds = m.valueOf() / 1000;
                            times[timeInSeconds] = numbers[i];
                        }
                    }, this)

                    formattedData[field.name] = {
                        maxValue: _.max(_.values(times)),
                        times: times
                    }
                }
            }, this);

            return formattedData;
        },

        _getAvailableWidth: function(){
            return parseInt(this.$el.width(), 10);
        },

        _getAvailableHeight: function(){
            return parseInt(this.$el.height(), 10) - MESSAGE_HEIGHT;
        },

        updateView: function(data, config) {

            //Return if no data
            if(!data) {
                return;
            }

            var that = this;
            this.$el.empty(); //Clear the div

            this.tooltipContainer.empty();

            _.each(this.heatmaps, function(heatmap) {
                heatmap.destroy();
            });

            this.$el.append(this.compiledTemplate({
                height: this._getAvailableHeight(),
                width: this._getAvailableWidth()
            }));

            _.each(data, function(series, seriesName){

                var seriesId = _.uniqueId('series');
                series.seriesId = seriesId;

                //Add the components
                var div = d3.select(this.el)
                    .select('.heatmap-list')
                    .append('div')
                    .attr('id', seriesId)
                    .classed('heatmap-list-item', true)

                div.append('span').attr('class', 'title').text(seriesName);

                series.legend = [];

                var step = series.maxValue / this.numOfBins;

                if(step >= 1) {
                    for(var j=1; j < this.numOfBins; j++) {
                        series.legend.push(Math.round(step*j));
                    }
                }
                else {
                    for(var k=1; k <= series.maxValue; k++) {
                        series.legend.push(k);
                    }
                }
            }, this);

            //For a uniform legend, choose the longest legend.
            if(this.legendType === 'uniform') {
                this.uniformLegend = [];
                _.each(data, function(series) {
                    if(series.legend.length > this.uniformLegend.length) {
                        this.uniformLegend = series.legend;
                    }
                }, this);
            }

            //Add a Calendar Heatmap for each series
            _.each(data, function(series, seriesName){

                //Configure Calendar Heatmap
                var calHeatMap = {
                    animationDuration: 0,
                    cellSize: this.cellSize,
                    cellRadius: (this.cellStyle === 'square' ? 0 : parseInt(this.cellSize - this.cellSize/3)),
                    cellPadding: this.cellPadding,
                    data: series.times,
                    displayLegend: (
                            // In uniform mode, only show the legend on the first series
                            this.showLegend && this.legendType === 'uniform' && _.indexOf(_.keys(data), seriesName) > 0
                                ? false
                                : this.showLegend
                        ),
                    itemName: [seriesName, seriesName],
                    itemNamespace: series.seriesId,
                    itemSelector: '#' + series.seriesId,
                    legend: this.legendType === 'uniform' ? this.uniformLegend : series.legend,
                    legendColors: [this.minColor, this.maxColor],
                    legendVerticalPosition: 'center',
                    legendHorizontalPosition: 'right',
                    legendOrientation: 'vertical',
                    legendMargin: [0, 0, 0, 20],
                    legendTitleFormat: {
                        lower: 'less than {min} ' + (this.legendType === 'independent' ? '' : ''),
                        inner: 'between {down} and {up} ' + (this.legendType === 'independent' ? '' : ''),
                        upper: 'more than {max} ' + (this.legendType === 'independent' ? '' : '')
                    },
                    onClick: _.bind(function(date, value) {
                            this._onCellclick(date, value, seriesName)
                        }, this),
                    start: this.earliestMoment.toDate(),
                    tooltip: true
                };

                calHeatMap.domain = this.domain;
                calHeatMap.range = this.range;

                if (this.domain === 'year') {
                    calHeatMap.subDomain = 'day';
                }

                var cal = new CalHeatMap();

                cal.init(calHeatMap);

                this.heatmaps.push(cal);

            }, this);

            // Graph tooltips
            // We use the boodtrap tooltip attached to the body
            // and pull the text out of the library tooltip.
            var tooltipContainer = this.tooltipContainer;
            this.$el.on('mouseover', '.cal-heatmap-container .graph g', function(e) {

                $(e.target).tooltip({
                    animation: false,
                    title: $('.ch-tooltip').text(),
                    'container': tooltipContainer,
                    template: '<div class="tooltip_cal" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
                })
                .tooltip('show');

            });
            this.$el.on('mouseout', '.cal-heatmap-container .graph g', function(e) {
                $(e.target).tooltip('dispose');
            });

            // Legend tooltips
            this.$el.on('mouseover', '.cal-heatmap-container .graph-legend rect', function(e) {
                $(e.target).tooltip({
                    animation: false,
                    title: $(e.target).text(),
                    'container': tooltipContainer,
                    template: '<div class="tooltip_cal" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
                })
                .tooltip('show');

            });
            this.$el.on('mouseout', '.cal-heatmap-container .graph-legend rect', function(e) {
                $(e.target).tooltip('dispose');
            });

            if (this.useDrilldown) {
                this.$el.addClass('cal-heatmap-drilldown');
            } else {
                this.$el.removeClass('cal-heatmap-drilldown');
            }

            this._applyRangeWarning();
        },

        _applyRangeWarning: function() {
            var rangeWarningStrings = {
                'hour': 'Showing data for a 12 hour period. To see earlier data, increase the size of the time span.',
                'day': 'Showing data for a 2 week period. To see earlier data, increase the size of the time span.',
                'month': 'Showing data for 12 months. Additional results cannot be rendered.',
                'year': 'Showing data for 2 years. Additional results cannot be rendered.'
            }
            if(this.rangeWarning === true) {
                this.$el.find('.range-warning')
                    .removeClass('hidden');

                this.$el.find('.range-warning-text')
                    .text(rangeWarningStrings[this.domain])
            }
            else {
                this.$el.find('.range-warning')
                    .removeClass('hidden');

                this.$el.find('.range-warning-text')
                    .text('')
            }
        },

        _onCellclick: function(date, value, seriesName) {

            var payload = {
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: {}
            };

            var d = new Date(date);
            payload.earliest = d.getTime() / 1000;

            //Set 'latest' time value based on domain
            switch(this.domain) {
                case 'hour':
                    //Cell is minute - add 59 seconds
                    d.setSeconds(d.getSeconds() + 59);
                    break;

                case 'day':
                    //Cell is an hour - add 59 minutes
                    d.setMinutes(d.getMinutes() + 59);
                    break;

                case 'month':
                case 'year':
                    //Cell is a day - set time to 23:59:59
                    d.setHours(23, 59, 59, 999);
                    break;
            }

            payload.latest = d.getTime() / 1000;

            if(!_.isUndefined(this.splitByField)) {
                payload.data[this.splitByField] = seriesName;
            }

            this.drilldown(payload, d3.event);
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 12000
            });
        },

        // Override to respond to re-sizing events
        reflow: function() {

            this.$el.find('.heatmap-list').css('height', this._getAvailableHeight() + 'px');
            this.$el.find('.heatmap-list').css('width', this._getAvailableWidth() + 'px');
        },

         _isEnabledDrilldown: function(config) {
            if (config['display.visualizations.custom.drilldown'] && config['display.visualizations.custom.drilldown'] === 'all') {
                return true;
            }
            return false;
        },

        _template: '\
                    <div class="heatmap-list" style="height: <%= height %>px; width: <%= width %>px;"></div>\
                    <div class="range-warning hidden">\
                        <span class="range-warning-text"></span>\
                    </div>\
        ',
    });
});
