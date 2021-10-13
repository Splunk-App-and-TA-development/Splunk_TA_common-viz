require(["jquery",
        "splunkjs/ready!",
        "splunkjs/mvc/utils",
        "splunkjs/mvc/searchmanager",
        "/static/app/link_analysis_app/scripts/cytoscape.min.js",
        'api/SplunkVisualizationUtils'
    ],
    function (
        $,
        Ready,
        utils,
        SearchManager,
        cytoscape,
        SplunkVisualizationUtils
    ) {
        var desiredSearchName = "cytoState";
        var cyto_viz;
        debugger;
        var sm = splunkjs.mvc.Components.getInstance(desiredSearchName);
        sm.on('search:done', function (properties) {
            var searchName = properties.content.request.label;
            if (properties.content.resultCount == 0) {
                console.log(searchName, "gave no results", properties);
                $("#results").html("<p><span style=\"color: red; font-weight: bolder;\">ERROR!</span> No Results.... do you have any data?</p>");
            } else {
                var results = splunkjs.mvc.Components.getInstance(searchName).data('results', {
                    output_mode: 'json',
                    count: 0
                });
                results.on("data", function (properties) {
                    var searchName = properties.attributes.manager.id;
                    var data = properties.data().results;
                    cyto_viz = JSON.parse(properties.data().results[0]["_raw"]);
                    debugger;
                    var cy = cytoscape({
                        container: document.getElementById('cy') // container to render in
                    });

                    cy.json(cyto_viz.graph_info);
                    var layout = cy.layout({
                        name: 'preset'
                    });

                    if (SplunkVisualizationUtils.getCurrentTheme && SplunkVisualizationUtils.getCurrentTheme() === 'dark') {
                        var bgColor = "#212527";
                        var textColor = "#ffffff";
                    } else {
                        var bgColor = "#ffffff";
                        var textColor = "#000";

                    }

                    cy.style()
                        .selector('core')
                        .style({
                            'background': bgColor
                        });

                    cy.style()
                        .selector('edge')
                        .style({
                            'color': textColor,
                            'text-background-color': bgColor
                        });

                    cy.style()
                        .selector('node')
                        .style({
                            'color': textColor
                        }).update();


                        debugger;
                    layout.run();
                })
            }
        });


        // If you wanted to implement this without jQuery, you could do this:
        // document.getElementById("results").innerHTML = "<p>Hello world!</p>"
        // but jQuery makes things so easy. Easiest to get in the habit!
    })
//# sourceURL=ex00-hello-world.js