const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const { DefinePlugin } = require('webpack');

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';
const finalCSSLoader = isProd ? MiniCssExtractPlugin.loader : 'style-loader';

module.exports = {
  mode: env,
  entry: './src/index.tsx',
  infrastructureLogging: {
    level: isProd ? 'info' : 'warn',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'bundle.js',
    clean: true,
  },
  devtool: 'source-map',
  stats: isProd ? 'normal' : 'errors-warnings',
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    alias: {
      'chessground/assets': path.resolve(__dirname, 'node_modules/chessground/assets'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      { test: /\.m?js$/, resolve: { fullySpecified: false } },
      { test: /chess.js$/, parser: { amd: false } },
      {
        test: /\.css$/,
        oneOf: [
          {
            test: /\.module\.css$/,
            use: [
              finalCSSLoader,
              {
                loader: 'css-loader',
                options: { sourceMap: true, modules: true },
              },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: { plugins: ['tailwindcss', 'autoprefixer'] },
                },
              },
            ],
          },
          {
            test: /node_modules\/chessground\/assets\/.+\.css$/,
            use: [
              finalCSSLoader,
              {
                loader: 'css-loader',
                options: { sourceMap: true, modules: false },
              },
            ],
          },
          {
            use: [
              finalCSSLoader,
              {
                loader: 'css-loader',
                options: { sourceMap: true, modules: false },
              },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: { plugins: ['tailwindcss', 'autoprefixer'] },
                },
              },
            ],
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        oneOf: [
          {
            test: /\.module\.s[ac]ss$/i,
            use: [
              finalCSSLoader,
              {
                loader: 'css-loader',
                options: { sourceMap: true, modules: true },
              },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: { plugins: ['tailwindcss', 'autoprefixer'] },
                },
              },
              {
                loader: 'sass-loader',
                options: { sourceMap: true, implementation: require('sass') },
              },
            ],
          },
          {
            use: [
              finalCSSLoader,
              {
                loader: 'css-loader',
                options: { sourceMap: true, modules: false },
              },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: { plugins: ['tailwindcss', 'autoprefixer'] },
                },
              },
              {
                loader: 'sass-loader',
                options: { sourceMap: true, implementation: require('sass') },
              },
            ],
          },
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg|woff2?|ttf|eot)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      favicon: './src/assets/logo.svg',
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: '200.html',
    }),
    // Ensure static assets in ./public (e.g., /pieces, /pieces_w) are available in the production build
    // Load plugin only in production to avoid dev-time dependency errors
    ...(
      isProd
        ? [
            new (require('copy-webpack-plugin'))({
              patterns: [
                {
                  from: path.resolve(__dirname, 'public'),
                  to: '.',
                  noErrorOnMissing: true,
                },
              ],
            })
          ]
        : []
    ),
    new Dotenv({ systemvars: true }),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
  ],
  devServer: {
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 8080,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      logging: 'none',
    },
    devMiddleware: {
      writeToDisk: false,
      stats: 'errors-warnings',
    },
    proxy: {
      '/dev/top-moves': {
        target: 'http://localhost:8082',
        pathRewrite: { '^/dev/top-moves': '/predict' },
        changeOrigin: true,
        logLevel: 'warn'
      }
    },
  },
};
