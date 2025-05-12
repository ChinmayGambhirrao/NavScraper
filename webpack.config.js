const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const backgroundConfig = {
  mode: "production",
  entry: {
    background: "./src/background.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/[name].js",
    clean: false,
    module: true,
  },
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: false,
            passes: 2,
          },
          mangle: true,
          module: true,
          ecma: 2020,
          safari10: false,
        },
        extractComments: false,
      }),
    ],
  },
};

const appConfig = {
  mode: "production",
  entry: {
    contentScript: "./src/contentScript.ts",
    popup: "./src/popup.ts",
    options: "./src/options.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/[name].js",
    clean: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "public", to: "." }],
    }),
    new HtmlWebpackPlugin({
      template: "./src/popup.html",
      filename: "popup.html",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/options.html",
      filename: "options.html",
      chunks: ["options"],
    }),
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: false,
          },
          mangle: true,
        },
        extractComments: false,
      }),
    ],
  },
};

module.exports = [backgroundConfig, appConfig];
