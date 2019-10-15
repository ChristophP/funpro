const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    main: './index.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'FunPro',
    libraryTarget: 'umd',
  },
  // consider not bundling at all, just minify, to keep filesize low
  //module: {
    //rules: [
      //{
        //test: /\.js$/,
        //exclude: /node_modules/,
        //use: {
          //loader: 'babel-loader',
          //options: {
            //presets: ['@babel/preset-env'],
          //},
        //},
      //},
    //],
  //},
  plugins: [],
};
