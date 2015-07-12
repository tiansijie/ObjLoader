var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
        app: path.resolve(__dirname + "/example/", "index.js")
    },
    output: {
        path: path.resolve(__dirname + "/example/", "public"),
        filename: "bundle.js"
    },
    resolve: {
        // you can now require('file') instead of require('file.coffee')
        extensions: ['', '.js', '.json']
    }

};
