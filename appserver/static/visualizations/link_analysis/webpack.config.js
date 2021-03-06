var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: ['visualization_source'],
    resolve: {
        root: [
            path.join(__dirname, 'src'),
        ],
    },
    module: {
        loaders: [
            { test: /\.json$/, loader: "json-loader" }
        ]
      },

 node: {
    console: false,
    fs: 'empty',
    child_process: 'empty'
  },
    output: {
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils',
        'splunkjs/mvc/searchmanager',
        'splunkjs/mvc/simplexml/ready!',
        'splunkjs/mvc',
        'splunkjs/mvc/searchbarview'

    ]
};



