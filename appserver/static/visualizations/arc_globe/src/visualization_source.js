/*
 * Visualization source
 */




 // it's really not the same file gooosedadadwdaw



 define([
    'jquery',
    'underscore',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils',
    'globe.gl'
    // Add required assets to this listawnoit'snot!!!
],
    function (
        $,
        _,
        SplunkVisualizationBase,
        vizUtils,
        globe
    ) {




        // Extend from SplunkVisualizationBase
        return SplunkVisualizationBase.extend({

            initialize: function () {
                SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
                this.$el = $(this.el);


                var clientHeight = document.getElementById($(this.el).attr('id')).clientHeight;
                var clientWidth = document.getElementById($(this.el).attr('id')).clientWidth;
                console.log("Init height: " + clientHeight);
                console.log("init width" + clientWidth)

                // Init GLOBE.
                this.GLOBE = globe().height(clientHeight).width(clientWidth);
                this.configIteration=1;
                window.configIteration=1;
                console.log(window.configIteration);
            },

            // Optionally implement to format data returned from search. 
            // The returned object will be passed to updateView as 'data'
            formatData: function (data) {

                // Format data 

                return data;
            },

            // Implement updateView to render a visualization.
            //  'data' will be the data object returned from formatData or from the search
            //  'config' will be the configuration property object
            updateView: function (data, config) {

                function moveMap(globeref, animationPath, animationCount, ptpSpeed, ptpElevation, ptpDelay, configIteration) {
                    if (animationCount == null || animationCount == animationPath.length) {
                        animationCount = 0;
                    } 


                    if (configIteration!=window.configIteration) {
                        console.log("Old loop version - killing");
                        return
                    }

                    globeref.pointOfView({
                        lat: animationPath[animationCount]["lat"],
                        lng: animationPath[animationCount]["lng"],
                        altitude: ptpElevation,
                    }, ptpSpeed)

                    
                    _.delay(moveMap, ptpDelay, globeref, animationPath, (animationCount+1), ptpSpeed, ptpElevation, ptpDelay, configIteration);
                }


                var rotateEnabled = config[this.getPropertyNamespaceInfo().propertyNamespace + 'rotateEnabled'] || "false";
                var rotateSpeed = config[this.getPropertyNamespaceInfo().propertyNamespace + 'rotateSpeed'] || "0.1";
                var doRotate = (rotateEnabled == "true");
                var textureName = config[this.getPropertyNamespaceInfo().propertyNamespace + 'textureName'] || "day";
                var defaultColor = config[this.getPropertyNamespaceInfo().propertyNamespace + 'defaultColor'] || "#f1813f";
                var defaultLabelSize = config[this.getPropertyNamespaceInfo().propertyNamespace + 'defaultLabelSize'] || "3";
                var ptpEnabled = config[this.getPropertyNamespaceInfo().propertyNamespace + 'ptpEnabled'] || "true";
                var ptpEnabled = (ptpEnabled == 'true');
                var ptpSpeed = ((config[this.getPropertyNamespaceInfo().propertyNamespace + 'ptpSpeed'] || "1") * 1000) //Convert from S to MS
                var ptpDelay = ((config[this.getPropertyNamespaceInfo().propertyNamespace + 'ptpDelay'] || "5") * 1000) //Convert from S to MS
                var ptpElevation = config[this.getPropertyNamespaceInfo().propertyNamespace + 'ptpElevation'] || "2";
                var defaultLat = parseFloat(config[this.getPropertyNamespaceInfo().propertyNamespace + 'defaultLat']) || -33.86;
                var defaultLng = parseFloat(config[this.getPropertyNamespaceInfo().propertyNamespace + 'defaultLng']) || 150.933;


                console.log("Default color:")
                console.log(defaultColor);

                if (textureName == "day") {
                    var texture = "/static/app/arc_globe/marble.jpg"
                } else {
                    var texture = "/static/app/arc_globe/blackmarble.jpg"
                }

                console.log(doRotate);

                

                this.GLOBE(document.getElementById($(this.el).attr('id')))
                    .globeImageUrl(texture)
                    .labelLat('lat')
                    .labelLng('lng')
                    .labelText('labelText')
                    .labelLabel('label')
                    .labelSize('labelSize')
                    .arcColor('color')
                    .arcDashAnimateTime('dashTime')
                    .arcDashLength('dashLength')
                    .arcDashGap('dashGap')
                    .arcStroke('stroke')
                    .pointOfView({lat:defaultLat, lng:defaultLng});
                this.GLOBE.controls().autoRotate = doRotate;
                this.GLOBE.controls().autoRotateSpeed = rotateSpeed;


                this.init = true;

                console.log(this.init);

                var dataRows = data.rows;
                if (!dataRows || dataRows.length === 0 || dataRows[0].length === 0) {
                    return this;
                }

                var dataFields = data.fields;
                for (i = 0; i < dataFields.length; i++) {
                    switch (dataFields[i].name) {
                        case "lat":
                            var lat_idx = i;
                            break;
                        case "lon":
                            var lon_idx = i;
                            break;
                        case "color":
                            var color_idx = i;
                            break;
                        case "dash_time":
                            var dashTime_idx = i;
                            break;
                        case "dash_gap":
                            var dashGap_idx = i;
                            break;
                        case "dash_length":
                            var dashLength_idx = i;
                            break;
                        case "stroke":
                            var stroke_idx = i;
                            break;
                        case "label":
                            var label_idx = i;
                            break;
                        case "snap":
                            var rotateTo_idx = i;
                            break;
                        case "label_size":
                            var labelSize_idx = i;
                    }
                }

                var animated = false;

                console.log(data);


                var outgoing_data = new Array();
                var label_data = new Array();
                var animation_route = new Array();


                for (x = 0; x < dataRows.length; x++) {
                    var row = dataRows[x];

                    console.log("first row");

                    if (Array.isArray(row[lat_idx])) {
                        console.log("Got row");
                        for (i = 0; i < (row[lat_idx].length - 1); i++) { // don't want the last event, as we've already used it as an end coordinate.
                            var startLat = parseFloat(+row[lat_idx][i]);
                            var startLon = parseFloat(+row[lon_idx][i]);

                            var endLat = parseFloat(+row[lat_idx][i + 1]);
                            var endLon = parseFloat(+row[lon_idx][i + 1]);

                            if (Array.isArray(row[color_idx])) {
                                var color = vizUtils.escapeHtml(row[color_idx][i]);
                            } else {
                                var color = vizUtils.escapeHtml(row[color_idx]);
                            }

                            // if color is undefined, set to default. Vis needs a color to work.
                            if (color == "") {
                                var color = defaultColor;
                                console.log("null color");
                            }

                            console.log("color3154:");
                            console.log(color);
                            

                            if (Array.isArray(row[dashTime_idx])) {
                                var dashTime = vizUtils.escapeHtml(row[dashTime_idx][i]);
                            } else {
                                var dashTime = vizUtils.escapeHtml(row[dashTime_idx]);
                            }

                            if (Array.isArray(row[dashGap_idx])) {
                                var dashGap = vizUtils.escapeHtml(row[dashGap_idx][i]);
                            } else {
                                var dashGap = vizUtils.escapeHtml(row[dashGap_idx]);
                            }

                            if (Array.isArray(row[dashLength_idx])) {
                                var dashLength = vizUtils.escapeHtml(row[dashLength_idx][i]);
                            } else {
                                var dashLength = vizUtils.escapeHtml(row[dashLength_idx]);
                            }

                            if (Array.isArray(row[stroke_idx])) {
                                var stroke = vizUtils.escapeHtml(row[stroke_idx][i]);
                            } else {
                                var stroke = vizUtils.escapeHtml(row[stroke_idx]);
                            }

                            if (!color) color = () => staticColor;

                            outgoing_data.push({
                                "startLat": startLat,
                                "startLng": startLon,
                                "endLat": endLat,
                                "endLng": endLon,
                                "color": color,
                                "dashGap": dashGap,
                                "dashLength": dashLength,
                                "dashTime": dashTime,
                                "stroke": stroke,
                            });
                        }
                    }
                }


                for (x = 0; x < dataRows.length; x++) {
                    var row = dataRows[x];

                    if (Array.isArray(row[lat_idx])) {
                        for (i = 0; i < row[lat_idx].length; i++) {
                            var startLat = parseFloat(+row[lat_idx][i]);
                            var startLon = parseFloat(+row[lon_idx][i]);

                            if (Array.isArray(row[label_idx])) {
                                if(vizUtils.escapeHtml(row[label_idx][i]) != "N/A") {
                                    if (labelSize_idx != null) {
                                        if (Array.isArray(row[labelSize_idx])) {
                                            var size=parseFloat(+row[labelSize_idx][i]);
                                        } else {
                                            var size=parseFloat(+row[labelSize_idx]);
                                        }
                                    } else {
                                        var size=defaultLabelSize;
                                    }
                                    label_data.push({
                                        "lat":parseFloat(+row[lat_idx][i]),
                                        "lng":parseFloat(+row[lon_idx][i]),
                                        "label":vizUtils.escapeHtml(row[label_idx][i]),
                                        "labelText":vizUtils.escapeHtml(row[label_idx][i]),
                                        "labelSize":size,
                                    });
                                }
                            }

                            if (rotateTo_idx!=null) {
                                if (Array.isArray(row[rotateTo_idx])) {
                                    if(vizUtils.escapeHtml(row[rotateTo_idx][i]) == "true") {
                                        animation_route.push({
                                           "lat":parseFloat(+row[lat_idx][i]),
                                           "lng":parseFloat(+row[lon_idx][i])
                                        })
                                    }
                                } else {
                                    if(vizUtils.escapeHtml(row[rotateTo_idx]) == "true") {
                                        animation_route.push({
                                           "lat":parseFloat(+row[lat_idx][i]),
                                           "lng":parseFloat(+row[lon_idx][i])
                                        })
                                    }
                                } 
                            }
                        }
                    }
                }

                // exit loop

                this.GLOBE.arcsData(outgoing_data);
                this.GLOBE.labelsData(label_data);

                //Global configIteration, so the loop can check in to check if it should still be active
                window.configIteration = window.configIteration + 1;

                if(ptpEnabled && animation_route.length!=0) {
                    moveMap(this.GLOBE, _.sortBy(animation_route, 'lng').reverse(), null, ptpSpeed, ptpElevation, ptpDelay, window.configIteration);
                }

            },

            // Search data params
            getInitialDataParams: function () {
                return ({
                    outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                    count: 10000
                });
            },

            // Override to respond to re-sizing events
            reflow: function () {
                this.$el = $(this.el);
                var clientHeight = document.getElementById($(this.el).attr('id')).clientHeight;
                console.log("Reflow: " + clientHeight);
            }
        });
    });
