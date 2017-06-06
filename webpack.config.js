const webpack = require('webpack')
const path = require('path')

module.exports = {
  name: 'client',
  target: 'web',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist/'),
    filename: 'main.min.js',
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      include: [
        path.resolve(__dirname, 'src/'),
      ],
      exclude: /node_modules/,
      query: {
        babelrc: false,
        presets: [
          'es2015',
          'stage-2',
        ],
      },
    }],
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: false,
    }),
  ],
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    redis: 'empty',
    hiredis: 'empty',
  },
}
