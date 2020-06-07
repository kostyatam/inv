const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require( 'nodemon-webpack-plugin' );
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: 'inline-source-map',
  // entry is where, say, your app starts - it can be called main.ts, index.ts, app.ts, whatever
  entry: ['./src/main.ts'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
  },
  // This forces webpack not to compile TypeScript for one time, but to stay running, watch for file changes in project directory and re-compile if needed
  watch: true,
  // Is needed to have in compiled output imports Node.JS can understand. Quick search gives you more info
  //target: 'node',
  // Prevents warnings from TypeScript compiler
  externals: [
    nodeExternals(),
  ],
  resolve: {
    modules: [
      path.resolve('./src'),
      path.resolve('./node_modules')
    ]
  },
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: {
            loader: 'ts-loader',
            options: {
                configFile : 'server.tsconfig.json'
            }
        },
        exclude: /node_modules/
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new NodemonPlugin({
        watch: path.resolve('./dist'),
        ignore: [
            'node_modules',
            path.resolve('./dist/public')
        ],
        script: './dist/server.js'
    }),
    new CopyPlugin([{
      from: './src/views',
      to: 'views'
    }])
  ]
};