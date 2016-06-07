// jscs:disable
var path = require('path');
var webpack = require('webpack');

module.exports = {
    devtool: 'source-map',
    entry : {
        script: __dirname + '/src/js/script.js',
        doppler: __dirname + '/src/js/index.js'
    },
    output: {
        path: __dirname + '/public/js',
        filename: '[name].js',
        publicPath: '/public/js',
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.NoErrorsPlugin(),
    ],
    module: {
        loaders: [
            {
                test: require.resolve("./src/js/doppler"),
                loader: "expose?Dopler"
            },
            {
                test: /\.js/,
                loader: 'babel',
                query: {
                    presets: ['es2015', 'stage-0']
                },
                exclude: /(node_modules|bower_components)/
            }
        ]
    }
};