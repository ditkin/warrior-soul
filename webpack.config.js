const express = require('express')

module.exports = {
  entry: './index.js',
  // entry: {
  //   game: './index.js',
  //   wm: './start.weltmeister.js',
  // },
  mode: 'development',
  devtool: '#source-map',
  devServer: {
    contentBase: __dirname + '/game',
    before: app => {
      app.use('/media', express.static('./media'))
    },
  },
  output: {
    path: __dirname + '/docs',
    filename: 'bundle.js',
    publicPath: '/docs/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              ['@babel/plugin-proposal-class-properties', { loose: true }],
            ],
          },
        },
      },
    ],
  },
  watchOptions: {
    ignored: [/game\/levels\/.*/, /node_modules/],
  },
}
