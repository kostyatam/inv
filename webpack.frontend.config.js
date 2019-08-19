const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  // entry is where, say, your app starts - it can be called main.ts, index.ts, app.ts, whatever
  entry: ['./src/public/js/index.ts'],
  output: {
    path: path.join(__dirname, 'dist/public/js'),
    filename: 'index.js',
  },
  // This forces webpack not to compile TypeScript for one time, but to stay running, watch for file changes in project directory and re-compile if needed
  watch: true,
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: {
            loader: 'ts-loader',
            options: {
                configFile : 'frontend.tsconfig.json'
            }
        },
        exclude: /node_modules/
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  }
};