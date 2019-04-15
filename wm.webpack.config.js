const express = require('express')

module.exports = {
  entry: './wm.index.js',
  mode: 'development',
  devServer: {
    contentBase: __dirname + '/weltmeister',
    before: (app) => {
      app.use('/media', express.static('./media'))
    },
  },
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
    publicPath: '/dist/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          /node_modules/,
          /entities.index.js/,
        ],
        loader: 'babel-loader',
      },
    ],
  },
}