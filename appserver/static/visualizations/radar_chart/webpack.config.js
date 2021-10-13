var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: ['babel-polyfill', 'radar_chart'],
    resolve: {
        root: [
            path.join(__dirname, 'src'),
        ]
    },
    output: {
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    module: {
        loaders: [
            {
                test: /d3-radar-chart\.js$/,
                loader: 'imports-loader?d3=d3'
            },
            {
                test: /d3-legend\.js$/,
                loader: 'imports-loader?d3=d3'
            }
        ]
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils'
    ]
};
