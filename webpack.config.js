const webpack = require('webpack');
const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.js',
    },
    devtool: 'inline-source-map',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'static'),
        clean: true,
    },
    module: {
        rules: [
            // Transpile .js files to vanilla JavaScript using Babel
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            
            // style-loader: inject loaded styles into document
            // css-loader: allow CSS to be imported in JS
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            }
        ]
    },
};