/*
 * Visualization source
 */
define([
        'jquery',
        'underscore',
        'leaflet',
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils',
	    '../contrib/leaflet.migrationLayer'
        ],
        function(
            $,
            _,
            L,
            SplunkVisualizationBase,
            vizUtils
        ) {    

        var TILE_PRESETS = {
            'satellite_tiles': {
                minZoom: 1,
                maxZoom: 19,
                url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            },
            'openstreetmap_tiles': {
                minZoom: 1,
                maxZoom: 19,
                url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            
            },
            'light_tiles': {
                minZoom: 1,
                maxZoom: 19,
                url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            }, 
            'dark_tiles': {
                minZoom: 1,
                maxZoom: 19,
                url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            },
            'splunk': {
                minZoom: 1,
                maxZoom: 19,
                url: '/splunkd/__raw/services/mbtiles/splunk-tiles/{z}/{x}/{y}'
            }
         };

    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({

        maxResults: 50000,
        COLORS: vizUtils.getColorPalette('splunkCategorical'),

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            $(this.el).addClass('missile-map');
            this.isInitializedDom = false;
        },

        // Optionally implement to format data returned from search. 
        // The returned object will be passed to updateView as 'data'
        formatData: function(data) {

            return data;
        },
  
        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData or from the search
        //  'config' will be the configuration property object
        updateView: function(data, config) {

            var tileset = this._getEscapedProperty('tileSet', config) || 'splunk'
            var tileConfig  = TILE_PRESETS[tileset];
            var url         = tileConfig.url,
                maxZoom     = tileConfig.maxZoom,
                minZoom     = tileConfig.minZoom,
                attribution = tileConfig.attribution;

            var customTileset = this._getEscapedProperty('customTileSet', config) || ''
            if (customTileset) {
                url = customTileset;
                maxZoom = 19;
                minZoom = 1;
                attribution = "";
            }

            var updateTiles = url !== this.activeTileset;


            var lat         = this._getEscapedProperty('mapLatitude', config) || 35,
                lon         = this._getEscapedProperty('mapLongitude', config) || -95,
                zoom        = this._getEscapedProperty('mapZoom', config) || 5

            if (this.lat != lat || this.lon != lon || this.zoom != zoom) updateBounds = true;
            else updateBounds = false;

            var staticColor = this._getEscapedProperty('staticColor', config) || "#65a637";
            var lineThickness = parseInt(this._getEscapedProperty('lineThickness', config) || 1);
            var updateLineWidth = lineThickness != this.activeLineThickness;
	    var scrollWheelZoom = Splunk.util.normalizeBoolean(this._getEscapedProperty('scrollWheelZoom', config) || true)

    		if (!this.isInitializedDom) {
                var map = this.map = L.map(this.el, { zoomSnap: 0.1, scrollWheelZoom: scrollWheelZoom }).setView([lat, lon], zoom);

                this.tileLayer = L.tileLayer(url, {
                    attribution: attribution
                }).addTo(map);

                var migrationLayer = this.migrationLayer = new L.migrationLayer({map: map, arcWidth: lineThickness});
                migrationLayer.addTo(map);

    			this.isInitializedDom = true;         
    		} else {
                if (updateTiles || updateLineWidth || updateBounds) {

                    this.migrationLayer.destroy();
                    var migrationLayer = this.migrationLayer = new L.migrationLayer({map: this.map, arcWidth: lineThickness});
                    migrationLayer.addTo(this.map);

                    this.map.removeLayer(this.tileLayer);
                    this.tileLayer = L.tileLayer(url, {
                        attribution: attribution
                    }).addTo(this.map);

                    if (updateBounds) {
                        this.map.setView([lat, lon], zoom);
                        this.lat = lat;
                        this.lon = lon;
                        this.zoom = zoom;
                    }

                    if (minZoom <= maxZoom) {
                        this.map.options.maxZoom = maxZoom;
                        this.map.options.minZoom = minZoom;

                        if (this.map.getZoom() > maxZoom) {
                            this.map.setZoom(maxZoom);
                        }
                        else if (this.map.getZoom() < minZoom) {
                            this.map.setZoom(minZoom);
                        } else {
                            this.map.fire('zoomend');
                        }
                    }
                    this.activeTileset = url;
                    this.activeLineThickness = lineThickness;
                }
            }

            var dataRows = data.rows;
            if (!dataRows || dataRows.length === 0 || dataRows[0].length === 0) {
                return this;
            }

            var dataFields = data.fields;
            for (i = 0; i < dataFields.length; i++) {

                switch (dataFields[i].name) {
                    case "end_lat":
                        var end_lat_idx = i;
                        break;
                    case "end_lon":
                        var end_lon_idx = i;
                        break;
                    case "start_lat":
                        var start_lat_idx = i;
                        break;
                    case "start_lon":
                        var start_lon_idx = i;
                        break;
                    case "color":
                        var color_idx = i;
                        break;
                    case "animate":
                        var animate_idx = i;
                        break;
                    case "pulse_at_start":
                        var pulse_idx = i;
                        break;
                    case "weight":
                        var weight_idx = i;
                        break;
                }
            }

            var animated = false;

            var formatted = dataRows.map(function(d) {
                var end_lat = parseFloat(+d[end_lat_idx]);
                var end_lon = parseFloat(+d[end_lon_idx]);
                var start_lat = parseFloat(+d[start_lat_idx]);
                var start_lon = parseFloat(+d[start_lon_idx]);
                var color = vizUtils.escapeHtml(d[color_idx]);
                var animate = vizUtils.normalizeBoolean(d[animate_idx]);
                var pulse_at_start = vizUtils.normalizeBoolean(d[pulse_idx]);
                var weight = +d[weight_idx];

                if (animate) animated = true; // Global flag to run (or not) the animation loop

                if (!color) color = staticColor;
                if (!weight) weight = lineThickness;

                return {
                    "from":[start_lon, start_lat], "to":[end_lon, end_lat], "color": color, "animate": animate, "pulse_at_start": pulse_at_start, "weight": weight
                }
            });

            this.migrationLayer.setData(formatted);

            if (animated) this.migrationLayer.play();
            else this.migrationLayer.pause(); // Save CPU if nothing animating

            return this;
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: this.maxResults
            });
        },

        // Override to respond to re-sizing events
        reflow: function() {
            if (this.map) {
                this.map.invalidateSize();
            }
        },

        _getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        }
    });
});
