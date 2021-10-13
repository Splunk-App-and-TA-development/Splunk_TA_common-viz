var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: 'sankey_diagram',
    resolve: {
        modules: [
            path.join(__dirname, 'src'),
            "node_modules"
        ]
    },
    output: {
        path: path.join(__dirname),
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    module: {
        rules: [
            {
                test: /sankey\.js$/,
                use: [
                    {
                        loader: 'imports-loader',
                        options: {
                            d3: 'd3'
                        }
                    }
                ]
            }
        ]
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils'
    ]
};