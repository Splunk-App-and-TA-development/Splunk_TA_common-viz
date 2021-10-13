define([
            'jquery',
            'underscore',
            'api/SplunkVisualizationBase',
			'api/SplunkVisualizationUtils',
			'moment',
            'fullcalendar'
        ],
        function(
            $,
            _,
            SplunkVisualizationBase,
			vizUtils,
			moment,
            fullcalendar
        ) {
	
	// 14,400 results will display an event for every minute of every day
	// for 10 days for one series. If more than one serices is used,
	// the number of events per day will decrease.
	var MAX_RESULTS = 14400;
  
	return SplunkVisualizationBase.extend({

 
        initialize: function() {
            
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

            this.$el = $(this.el);
            
            this.$el.addClass('splunk-event-calendar');
			
        },
 
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            });

        },
		
		setupView: function() {
			
		},
		
		_getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        },
		
		_getConfigParams: function(config) {
            this.showWeekends = vizUtils.normalizeBoolean(this._getEscapedProperty('showWeekends', config), { default: true });
			this.showWeekNumbers = vizUtils.normalizeBoolean(this._getEscapedProperty('showWeekNumbers', config), { default: false });
			this.calendarView = this._getEscapedProperty('calendarView', config) || 'month';
		},

        formatData: function(data, config) {
            if (data.rows.length < 1 || data.fields.length < 1) {
                return false;
            }
			
			if(data.rows.length > MAX_RESULTS) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'The search returned too many results to render the visualization. Adjust the query by narrowing the time range or using a bigger span.'
                );
            }
			
			if(data.fields.length < 2) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Check the Statistics tab. To generate a calendar, the results table must include columns representing values in these two fields: _time and <value>.'
                );
            }

            var fieldNames = _.pluck(data.fields, 'name');
			var timeIndex = _.indexOf(fieldNames, '_time');
            var spanIndex = _.indexOf(fieldNames, '_span');
			var nameField = fieldNames[1];

            if(spanIndex < 0) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'No span field found. To generate a calendar, the query must include the timechart command with span=1d, span=1h, or span=1m.'
                );
            }
			
			this._getConfigParams(config);
			
            var calendarEvents = {'events': [] };
			colors = vizUtils.getColorPalette();
            
            _.each(data.rows, function(row){
				var timeField = row[timeIndex];
				
				_.each(data.fields, function(field, i) { 
					if(field.name[0] !== '_' ) {
						var nameField = field.name;
						var countField = row[i];
						var spanSeconds = Number(row[spanIndex]);
						
						if(Number(countField) > 0) {
							var startTime = moment(timeField)
							var endTime = startTime.clone().add(spanSeconds, 'seconds');
							var event = {
								title: nameField + ": " + countField,
								start: startTime,
								end: endTime,
								color: colors[i]
							}
							calendarEvents.events.push(event);
						}
					}
				}, this);
                
            });
			
			return calendarEvents;
        },

        _eventClick: function(event) {
            this.drilldown({
                earliest: event.start.format(),
                latest: event.end.format()
            });
        },
		
		_getAvailableHeight: function(){
            return parseInt(this.$el.height(), 10);
        },

        updateView: function(data, config) {
           
            if (!data) {
                return;
            }
			
			var that = this;
			
			this.$el.fullCalendar( 'destroy' )
			this.$el.fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,agendaWeek,agendaDay'
                },
                selectable: true,
				defaultView: this.calendarView,
				height: this._getAvailableHeight(),
				weekends: this.showWeekends,
				weekNumbers: this.showWeekNumbers,
				eventClick: function(event) {
					that._eventClick(event);
				},
				events: data.events
			});
		
        },


    });
});
