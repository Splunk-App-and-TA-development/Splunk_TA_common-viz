/*
 * Parallel coordinates visualization view class
 */
define([
            'jquery',
            'underscore',
            'api/SplunkVisualizationBase',
            'api/SplunkVisualizationUtils',
            'd3',
            '../contrib/d3.paracoords'
        ],
        function(
            $,
            _,
            SplunkVisualizationBase,
            vizUtils,
            d3
        ) {
  
    var CONTAINER_PADDING = 15;
    var FILTER_HEIGHT = 20;

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
    };

    return SplunkVisualizationBase.extend({
  
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            this.$el.attr('id', 'viz-' + _.uniqueId());
            this.$el.addClass('splunk-parcoords-viz');
            if (vizUtils.getCurrentTheme && vizUtils.getCurrentTheme() === 'dark'){
              this.$el.addClass('dark');
            }
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 50000
            });
        },

        formatData: function(data) {
            if (!data.rows || data.rows.length < 1) {
                return false;
            }

            if (data.fields.length > 15) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'The search returned too many dimensions to render in a Parallel Coordinates visualization. Adjust the search to return at most 15 dimensions.'
                );
            }
            var config = this.getCurrentConfig();
            var rows = data.rows;
            var results = [];
            var truncatedResults = [];
            var maxCategories = +this._getEscapedProperty('maxCategories', config) || 25;
            var truncatedCategories = 0;
            var renderMode = rows.length < 2000 ? 'default' : 'queue';
            var colorField = data.fields[0].name;
            var colorCategories = {};
            var nonNumericalCategories = false;
            var fields = data.fields;

            // initialize dimensions
            var dimensions = {};
            _.each(fields, function(dimension) {
                dimensions[dimension.name] = {
                    nonNumericalCategories: false,
                    categories: {}
                };
            })

            _.each(rows, function(row) {
                var omitRow = false;
                var result = {};
                _.each(fields, function(field, index) {
                    if (omitRow) {
                        return;
                    }
                    var fieldName = field.name;
                    var category = row[index];
                    var dimension = dimensions[fieldName];
                    var categories = dimension.categories;

                    if (_.isNaN(+category)) {
                        dimensions[fieldName]['nonNumericalCategories'] = true;
                        nonNumericalCategories = true;
                    } else {
                        category = +category;
                    }

                    if (_.keys(categories).length === maxCategories &&
                        dimensions[fieldName]['nonNumericalCategories']) {
                        if (!categories[category]) {
                            // exceeding maximum categories
                            omitRow = true;
                        }
                    } else {
                        dimensions[fieldName]['categories'][category] = 1;
                    }
                    result[fieldName] = category;
                });

                if (!omitRow) {
                    truncatedResults.push(result);
                }
                results.push(result);

            });

            return {
                results: nonNumericalCategories ? truncatedResults : results,
                isTruncated: nonNumericalCategories && truncatedResults.length !== results.length,
                renderMode: renderMode,
                fields: data.fields,
                colorCategories: _.keys(dimensions[colorField]['categories']),
                colorField: colorField,
                nonNumericalCategories: dimensions[colorField]['nonNumericalCategories']
            }
        },
  
        // Called on updates to data or configuration
        updateView: function(data, config) {
            if (!data || data.length < 1) {
                return;
            }

            var hideTicks = vizUtils.normalizeBoolean(this._getEscapedProperty('hideTicks', config));
            var colorMode = this._getEscapedProperty('colorMode', config) || 'categorical';
            var minColor = this._getEscapedProperty('minColor', config) || '#d93f3c';
            var maxColor = this._getEscapedProperty('maxColor', config) || '#3fc77a';
            var compositeMode = this._getEscapedProperty('compositeMode', config) || 'darken';
            var maxCategories = +this._getEscapedProperty('maxCategories', config) || 25;
            var alpha = .25;
            var colorScale;

            var $filterLine = $('<div class="filter-line"></div>');
            var $dataLength = this.$dataLength = $('<div class="data-length" />');

            $filterLine.append($dataLength);

            if (colorMode == 'categorical') {
                colorScale = d3.scale.ordinal()
                    .domain(data.colorCategories)
                    .range(vizUtils.getColorPalette('splunkCategorical'));
            } else {
                if (data.nonNumericalCategories) {
                    throw new SplunkVisualizationBase.VisualizationError(
                        'Check the Statistics tab. To use sequential colors, make sure that the color field that you are using has numerical values.'
                    );
                }
                var colorCategories = data.colorCategories.map(function(item) { return parseInt(item, 10); });
                var min = _.min(colorCategories);
                var max = _.max(colorCategories);
                var domain = [];
                var range = [];
                var interpolateNum = d3.interpolateRound(min, max);
                var interpolateColor = d3.interpolateHcl(minColor, maxColor); //Rgb, Hcl, Hsl

                _.each(colorCategories, function(category) {
                    domain.push(category);
                    range.push(interpolateColor(category/(max - min)));
                })
                
                
                colorScale = d3.scale.ordinal()
                            .domain(domain)
                            .range(range);

            }


            var that = this;
            var containerWidth = this.$el.width() - 2 * CONTAINER_PADDING;
            var containerHeight = this.$el.height() - 2 * CONTAINER_PADDING;
            // this prevents d3 parcoords from initializing w/ wrong dimensions 
            // and triggering a resize
            // :(
            if (containerWidth < 100) {
                return;
            }
            var dimensions = data.fields.length;
            var dimensionWidth = (containerWidth / (dimensions+1)) >> 0;
            var maxCharacters = ((dimensionWidth/2) / 6) >> 0;
            var dataLength = data.results.length;
            var margin = {
                top: 25,
                bottom: 15,
                right: -(dimensionWidth/2),
                left: hideTicks || !data.nonNumericalCategories ? -(dimensionWidth/2) : 0
            };

            if (hideTicks) {
                this.$el.html('').addClass('no-ticks');
            } else {
                this.$el.html('').removeClass('no-ticks');
            }
            
            var classList = this.$el.attr('class').split(/\s+/);
            _.each(classList, function(item) {
                if (/cat-max/.test(item)) {
                    this.$el.removeClass(item);
                }
            }.bind(this));
            this.$el.addClass('cat-max-' + maxCategories);

            that.pc = d3.parcoords()('#' + this.$el.attr('id'))
                .data(data.results)
                .color(function(d) {
                    return colorScale(d[data.colorField]);
                })
                .width(containerWidth)
                .height(containerHeight - FILTER_HEIGHT)
                .alpha(alpha)
                .composite(compositeMode)
                .tickFormat(function(d) { return (d.length > maxCharacters) ? truncate(d, maxCharacters) : d; })
                .margin(margin)
                .on('brush', _.debounce(function(d) {
                    that._updateShownDataLength(d.length, dataLength);
                    that.$el.find('.foreground').addClass('faded');
                }.bind(that), 50))
                .shadows()
                .mode(data.renderMode)
                .render()
                .brushMode('1D-axes');  // enable brushing

            var $clearFilters = this.$clearFilters = $('<button class="clear-filters">Clear filters</button>')
                .click(function() {
                    that.pc.brushReset();
                    that.pc.unhighlight();
                    that._updateShownDataLength(dataLength, dataLength);
                });

            $filterLine.append($clearFilters);
            if (data.isTruncated) {
                $filterLine.append('Note: Your data has been truncated due to a high amount of categorical values');
            }
            this.$el.append($filterLine);

            this._updateShownDataLength(dataLength, dataLength);

            d3.select(this.el)
                .selectAll('text.label')
                    .on('wheel', function() { return; });

            return this;
        },

        _updateShownDataLength: function(len, maxLen) {
            this.$dataLength.text(
                'Currently showing ' + len + ' / ' + maxLen + ' datapoint' +
                (maxLen > 1 ? 's' : '')
            );
            if (len === maxLen) {
                this.$clearFilters.attr('disabled', true);
            } else {
                this.$clearFilters.attr('disabled', null);
            }
        },

        // Override to respond to re-sizing events
        reflow: function() {
            this.invalidateUpdateView();
        },

        _getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        }
    });
});