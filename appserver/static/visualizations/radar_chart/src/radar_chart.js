/*
 * Visualization source
 * Author: Scott Haskell
 * Date: 10/25/2017
 * Company: Splunk Inc.
 */
define([
            'jquery',
            'underscore',
            'api/SplunkVisualizationBase',
            'api/SplunkVisualizationUtils',
            'd3',
            '../contrib/js/d3-legend',
            '../contrib/js/d3-radar-chart'
        ],
        function(
            $,
            _,
            SplunkVisualizationBase,
            SplunkVisualizationUtils 
        ) {
  
    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({
        validFields: ["key","axis","value","keyColor"],
        allAxes: [],
        categories: {},
        parentEl: null,
        parentView: null,
        defaultConfig: {
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.chartHeight': 500,
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.chartWidth': 500,
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.maxValue': 1,
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.maxValue': 5,
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.levels': 8,
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.format': "",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.isRounded': "1",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.fullScreen': "0",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.legendEnabled': "1",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.legendSymbol': "cross",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.legendToggleSymbol': "circle",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.legendFontSize': "12",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.legendPositionX': 25,
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.legendPositionY': 25,
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.legendFontColor': "black",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.axesLegendFontSize': "12",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.axesLabelFontSize': "12",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.axesLineColor': "white",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.axesLabelFontColor': "#737373",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.axesLegendFontColor': "black",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.circlesColor': "#CDCDCD",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.circlesFillColor': "#CDCDCD",
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.areasOpacity': 0.35,
            'display.visualizations.custom.custom-radar-chart-viz.radar_chart.circlesOpacity': 0.1
        },
        //category: function(key, name, data) {
        category: function(key, options) {    
            this.key = key;
            this.axes = [];
            this.axes.push(options.name);
            this.isInit = false;
            this.isCharted = false;
            this.vals = [];

            if(!this.isInit) {
                this.vals.push({axis: options.name, value: options.data}); 
                this.isInit = true;
            }

            //this.update = function (name, data) {
            this.update = function (name, options) {
                this.vals.push({axis: name, value: options.data}); 
                this.axes.push(name);
            };

            this.fillMissingAxis = function(allAxes) {
                // Sort the axes so we insert in the correct spot if missing
                allAxes.sort()
                this.axes.sort()

                _.each(allAxes, function(v, i) {
                    if(!this.axes.includes(v)) {
                        this.vals.splice(i, 0, {axis: v, value: 0})
                        this.axes.splice(i, 0, v)
                    }
                }, this); 
            };
        }, 

        onConfigChange: function(configChanges, previousConfig) {
            var legendEnabled = this._propertyExists('legendEnabled', configChanges) ? this.isArgTrue(parseInt(this._getEscapedProperty('legendEnabled', configChanges))):this.isArgTrue(parseInt(this._getEscapedProperty('legendEnabled', previousConfig))),
                chartHeight = this._propertyExists('chartHeight', configChanges) ? parseInt(this._getEscapedProperty('chartHeight', configChanges)):parseInt(this._getEscapedProperty('chartHeight', previousConfig)),
                chartWidth = this._propertyExists('chartWidth', configChanges) ? parseInt(this._getEscapedProperty('chartWidth', configChanges)):parseInt(this._getEscapedProperty('chartWidth', previousConfig)),
                maxValue = this._propertyExists('maxValue', configChanges) ? parseFloat(this._getEscapedProperty('maxValue', configChanges)):parseFloat(this._getEscapedProperty('maxValue', previousConfig)),
                levels = this._propertyExists('levels', configChanges) ? parseInt(this._getEscapedProperty('levels', configChanges)):parseInt(this._getEscapedProperty('levels', previousConfig)),
                format = this._propertyExists('format', configChanges) ? this._getEscapedProperty('format', configChanges):this._getEscapedProperty('format', previousConfig),
                isRounded = this._propertyExists('isRounded', configChanges) ? this.isArgTrue(parseInt(this._getEscapedProperty('isRounded', configChanges))):this.isArgTrue(parseInt(this._getEscapedProperty('isRounded', previousConfig))),
                fullScreen = this._propertyExists('fullScreen', configChanges) ? this.isArgTrue(parseInt(this._getEscapedProperty('fullScreen', configChanges))):this.isArgTrue(parseInt(this._getEscapedProperty('fullScreen', previousConfig))),
                legendSymbol = this._propertyExists('legendSymbol', configChanges) ? this._getEscapedProperty('legendSymbol', configChanges):this._getEscapedProperty('legendSymbol', previousConfig),
                legendToggleSymbol = this._propertyExists('legendToggleSymbol', configChanges) ? this._getEscapedProperty('legendToggleSymbol', configChanges):this._getEscapedProperty('legendToggleSymbol', previousConfig),
                legendFontSize = this._propertyExists('legendFontSize', configChanges) ? this._getEscapedProperty('legendFontSize', configChanges):this._getEscapedProperty('legendFontSize', previousConfig),
                legendPositionX = this._propertyExists('legendPositionX', configChanges) ? parseInt(this._getEscapedProperty('legendPositionX', configChanges)):parseInt(this._getEscapedProperty('legendPositionX', previousConfig)),
                legendPositionY = this._propertyExists('legendPositionY', configChanges) ? parseInt(this._getEscapedProperty('legendPositionY', configChanges)):parseInt(this._getEscapedProperty('legendPositionY', previousConfig)),
                legendFontColor = this._propertyExists('legendFontColor', configChanges) ? this._getEscapedProperty('legendFontColor', configChanges):this._getEscapedProperty('legendFontColor', previousConfig),
                axesLegendFontSize = this._propertyExists('axesLegendFontSize', configChanges) ? this._getEscapedProperty('axesLegendFontSize', configChanges):this._getEscapedProperty('axesLegendFontSize', previousConfig),
                axesLabelFontSize = this._propertyExists('axesLabelFontSize', configChanges) ? this._getEscapedProperty('axesLabelFontSize', configChanges):this._getEscapedProperty('axesLabelFontSize', previousConfig),
                axesLineColor = this._propertyExists('axesLineColor', configChanges) ? this._getEscapedProperty('axesLineColor', configChanges):this._getEscapedProperty('axesLineColor', previousConfig),
                axesLabelFontColor = this._propertyExists('axesLabelFontColor', configChanges) ? this._getEscapedProperty('axesLabelFontColor', configChanges):this._getEscapedProperty('axesLabelFontColor', previousConfig),
                axesLegendFontColor = this._propertyExists('axesLegendFontColor', configChanges) ? this._getEscapedProperty('axesLegendFontColor', configChanges):this._getEscapedProperty('axesLegendFontColor', previousConfig),
                circlesColor = this._propertyExists('circlesColor', configChanges) ? this._getEscapedProperty('circlesColor', configChanges):this._getEscapedProperty('circlesColor', previousConfig),
                circlesFillColor = this._propertyExists('circlesFillColor', configChanges) ? this._getEscapedProperty('circlesFillColor', configChanges):this._getEscapedProperty('circlesFillColor', previousConfig),
                areasOpacity = this._propertyExists('areasOpacity', configChanges) ? parseFloat(this._getEscapedProperty('areasOpacity', configChanges)):parseFloat(this._getEscapedProperty('areasOpacity', previousConfig)),
                circlesOpacity = this._propertyExists('circlesOpacity', configChanges) ? parseFloat(this._getEscapedProperty('circlesOpacity', configChanges)):parseFloat(this._getEscapedProperty('circlesOpacity', previousConfig))

            // Set default options from format parameters
			let radarChartOptions = {
				width: chartWidth,
				height: chartHeight,
				format: format,
				legend: {
					display: legendEnabled,
					symbol: legendSymbol,
					toggle: legendToggleSymbol,
                    position: {x: legendPositionX, y: legendPositionY},
                    fontColor: legendFontColor
				},
				areas: {
					opacity: areasOpacity
				},
				circles: {
					color: circlesColor,
					fill: circlesFillColor,
					opacity: circlesOpacity
				},
				axes: {
                    lineColor: axesLineColor,
                    axesLabelFontColor: axesLabelFontColor,
                    axesLegendFontColor: axesLegendFontColor,
                    fontWidth: axesLegendFontSize + "px"
				}
            }
            
            this.radarChart
                .options(radarChartOptions)
                .rounded(isRounded)
                .maxValue(maxValue)
                .levels(levels)
                .update()

            if(legendEnabled) {                
                $('.rcLegend').show()
                $('.rcAxisLegend').attr("fill", axesLegendFontColor)
                $('.rcAxisLabel').attr("fill", axesLabelFontColor)
                $('.label').attr("fill", legendFontColor)
                $('.label').css("font-size", legendFontSize + "px")
                $('.rcAxisLabel').css("font-size", axesLabelFontSize + "px")
                $('.rcAxisLegend').css("font-size", axesLegendFontSize + "px")
            } else {
                $('.rcLegend').hide()
            }

            if(fullScreen) {
                this._setFullScreenMode(this.parentEl, {radarChart: this.radarChart})
            } else {
                $("div[data-cid=" + this.parentEl + "]").css("height", chartHeight);
                this.radarChart.options({height: chartHeight, width: chartWidth}).update()
                $(window).off("resize")
            }
        },

        _propertyExists: function(name, config) {
            return _.has(config, this.getPropertyNamespaceInfo().propertyNamespace + name)
        },

        _getSafeUrlProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name]
            return SplunkVisualizationUtils.makeSafeUrl(propertyValue)
        },
        
        _getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return SplunkVisualizationUtils.escapeHtml(propertyValue);
        },

        _getProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return propertyValue;
        },

        // Convert string '1/0' or 'true/false' to boolean true/false
        isArgTrue: function(arg) {
            if(arg === 1 || arg === 'true') {
                return true;
            } else {
                return false;
            }
        },

        // Valide field in results set and error out if it shouldn't be there
        validateFields: function(fields) {
            _.each(fields, function(v, i) {
                if(!_.contains(this.validFields, v.name)) {  
                   throw new SplunkVisualizationBase.VisualizationError(
                        "Invalid Field Detected => " + v.name + "; Required Fields: key, axis, value"
                    ); 
                }    
            }, this);
        },

        _setFullScreenMode: function(parentEl, options) {
            // Map Full Screen Mode
            var vh = $(window).height()
            var vw = $(window).width()

            $("div[data-cid=" + parentEl + "]").css("height", vh)
            $("div[data-cid=" + parentEl + "]").css("width", vw)
            options.radarChart.options({height: vh, width: vw}).update()

            $(window).resize(function() {
                var vh = $(window).height()
                var vw = $(window).width()

                $("div[data-cid=" + parentEl + "]").css("height", vh)
                $("div[data-cid=" + parentEl + "]").css("width", vw)
                options.radarChart.options({height: vh, width: vw}).update();
            });
        },

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            this.isInitializedDom = false;
        },

        // Optionally implement to format data returned from search. 
        // The returned object will be passed to updateView as 'data'
        formatData: function(data) {
            // Clear axes and categories
            this.allAxes = []
            this.categories = {}

            if(!data.results || data.results.length === 0) {
                return this;
            }

            // Make sure the fields are named correctly
            this.validateFields(data.fields);

            _.each(data.results, function(v, i, obj) {
                try {
                    // Key exists, update
                    if(_.has(this.categories, v.key)) {
                        this.categories[v.key].update(v.axis, {data: v.value});
                    } else {
                        if(v.key) {
                            // Create new category
                            var c = new this.category(v.key, {name: v.axis, data: v.value});
                            if(_.has(v, "keyColor")) {
                                c.keyColor = v.keyColor;
                            }
                            this.categories[v.key] = c
                        }
                    }
                    // Update global axes list
                    if(v.key && !this.allAxes.includes(v.axis)) {
                        this.allAxes.push(v.axis);
                    }
                } catch(err) {
                    console.error(err);
                }
            }, this);

            // Fill in missing axes for each category
            _.each(this.categories, function(v, i) {
                v.fillMissingAxis(this.allAxes);  
            }, this); 
            
            return this.categories
        },
  
        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData or from the search
        //  'config' will be the configuration property object
        updateView: function(categories, config) {
            if(_.keys(config).length <= 1) {
                config = this.defaultConfig;
            }

            if(_.isEmpty(this.categories)) {
                return this
            }

            // Get Format menu parameters
            var chartHeight = parseInt(this._getEscapedProperty('chartHeight', config)) || 400,
                chartWidth = parseInt(this._getEscapedProperty('chartWidth', config)) || 400,
                maxValue = parseFloat(this._getEscapedProperty('maxValue', config)) || 1,
                levels = parseInt(this._getEscapedProperty('levels', config)) || 8,
                format = this._getEscapedProperty('format', config) || "",
                isRounded = parseInt(this._getEscapedProperty('isRounded', config)),
                fullScreen = parseInt(this._getEscapedProperty('fullScreen', config)),
                legendEnabled = parseInt(this._getEscapedProperty('legendEnabled', config)),
                legendSymbol= this._getEscapedProperty('legendSymbol', config) || "cross",
                legendToggleSymbol= this._getEscapedProperty('legendToggleSymbol', config) || "circle",
                legendFontSize = this._getEscapedProperty('legendFontSize', config) || "12px",
                legendPositionX = parseInt(this._getEscapedProperty('legendPositionX', config)) || 25,
                legendPositionY = parseInt(this._getEscapedProperty('legendPositionY', config)) || 25,
                legendFontColor = this._getEscapedProperty('legendFontColor', config) || "black",
                axesLegendFontSize = this._getEscapedProperty('axesLegendFontSize', config) || "12",
                axesLabelFontSize = this._getEscapedProperty('axesLabelFontSize', config) || "12",
                axesLineColor = this._getEscapedProperty('axesLineColor', config) || "white",
                axesLabelFontColor = this._getEscapedProperty('axesLabelFontColor', config) || "#737373",
                axesLegendFontColor = this._getEscapedProperty('axesLegendFontColor', config) || "black",
                circlesColor = this._getEscapedProperty('circlesColor', config) || "#CDCDCD",
                circlesFillColor = this._getEscapedProperty('circlesFillColor', config) || "#CDCDCD",
                areasOpacity = parseFloat(this._getEscapedProperty('areasOpacity', config)),
                circlesOpacity = parseFloat(this._getEscapedProperty('circlesOpacity', config))

            // Initialize Viz
            if (!this.isInitializedDom) {
                var radarChart = this.radarChart = {}
                var radarChartOptions = this.radarChartOptions = {}


				// Create radar chart
                this.radarChart = new RadarChart(format)
                
                d3.select(this.el)
                  .call(this.radarChart)

                this.isInitializedDom = true
            }

			// Set default options from format parameters
			this.radarChartOptions = {
				width: chartWidth,
				height: chartHeight,
				format: format,
				legend: {
					display: this.isArgTrue(legendEnabled),
					symbol: legendSymbol,
					toggle: legendToggleSymbol,
                    position: {x: legendPositionX, y: legendPositionY},
                    fontColor: legendFontColor
				},
				areas: {
					opacity: areasOpacity
				},
				circles: {
					color: circlesColor,
					fill: circlesFillColor,
					opacity: circlesOpacity
				},
				axes: {
                    lineColor: axesLineColor,
                    axesLabelFontColor: axesLabelFontColor,
                    axesLegendFontColor: axesLegendFontColor,
                    fontWidth: axesLegendFontSize + "px"
				}
			};
            
            this.radarChart
				.options(this.radarChartOptions)
				.rounded(this.isArgTrue(isRounded))
				.maxValue(maxValue) 
				.levels(levels) 
                //.update()

            this.radarChart.clear()

            // Get parent element of div to resize 
            // Nesting of Div's is different, try 7.x first
            this.parentEl = $(this.el).parent().parent().parent().parent().parent().closest("div").attr("data-cid")
            this.parentView = $(this.el).parent().parent().parent().parent().parent().closest("div").attr("data-view")

            // Default to 6.x view
            if(this.parentView != 'views/shared/ReportVisualizer') {
                this.parentEl = $(this.el).parent().parent().closest("div").attr("data-cid")
                this.parentView = $(this.el).parent().parent().closest("div").attr("data-view")
            }

            // Set fullscreen or height/width
            if (this.isArgTrue(fullScreen)) {
                this._setFullScreenMode(this.parentEl, {radarChart: this.radarChart})
            } else {
                $("div[data-cid=" + this.parentEl + "]").css("height", chartHeight)
                $("div[data-cid=" + this.parentEl + "]").css("width", chartWidth)
                this.radarChart.options({height: chartHeight, width: chartWidth}).update();
            }

            _.each(categories, function(v, i, obj) {
                    // get current colors so we don't clobber them
                    var c = this.radarChart.colors()
                    
                    // Check for custom color and set
                    if(_.has(v, 'keyColor')) {
                        c[v.key] = v.keyColor
                    }

                    this.radarChart
                      .push({key: v.key, values: v.vals})
                      .colors(c)
            }, this); 

            this.radarChart.update()
            $('.label').css("font-size", legendFontSize + "px")
            $('.rcAxisLabel').css("font-size", axesLabelFontSize + "px")

            return this
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.RAW_OUTPUT_MODE,
                count: 50000
            });
        },

    });
});
