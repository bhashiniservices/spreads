var path = require('path'),
    webpack = require('webpack');

module.exports = {
  cache: true,
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js",
    publicPath: "/static/"
  },
  module: {
    rules: [
      {test: /\.js$/, use: {loader: 'jsx-loader?harmony'}},
      {test: /\.css$/, use: [{loader: 'style-loader'}, {loader: 'css-loader'}]},
      {test: /\.scss$/, use: [{loader: 'style-loader'}, {loader: 'css-loader'}, {loader: 'sass-loader'}]},
      {test: /\.(ttf|svg|eot|woff|png|jpg)$/, use: 'file-loader'}
    ]
  },
  mode: 'development'
}
