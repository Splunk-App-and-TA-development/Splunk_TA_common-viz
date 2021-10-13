var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: 'timeline',
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
                test: /d3-timeline\.js$/,
                use: [
                    {
                        loader: 'imports-loader',
                        options: {
                            d3: 'd3'
                        }
                    }
                ]
            },
            {
                test: /tooltip/,
                use: [
                    {
                        loader: 'imports-loader',
                        options: {
                            jQuery: 'jquery'
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