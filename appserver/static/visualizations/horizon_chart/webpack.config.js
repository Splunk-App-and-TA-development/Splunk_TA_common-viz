var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: 'horizon_chart',
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
                test: /cubism\.v1\.js$/,
                use: [
                    {
                        loader: 'imports-loader?window=>{addEventListener:function(){}}',
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