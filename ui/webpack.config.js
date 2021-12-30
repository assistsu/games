const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const commonConfig = {
    output: {
        filename: 'main.js',
        chunkFilename: 'bundle.[id].js',
        path: path.resolve(__dirname, './assets/js/bundle/'),
        publicPath: '/assets/js/bundle/',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', "@babel/preset-react"],
                        plugins: ["@babel/plugin-transform-runtime"]
                    }
                }
            },
            {
                test: /\.(s)?css$/i,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader",
                ],
            },
        ]
    },
    resolve: {
        alias: {
            Model: path.resolve(__dirname, 'src/components/Model/'),
            Utils: path.resolve(__dirname, 'src/components/Utils/'),
            UtilsContainer: path.resolve(__dirname, 'src/components/UtilsContainer/'),
            styles: path.resolve(__dirname, 'assets/styles/'),
            Config: path.resolve(__dirname, 'src/components/Config/'),
            images: path.resolve(__dirname, 'assets/images/'),
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            _: 'lodash',
            moment: 'moment',
            AppConfig: path.resolve(__dirname, 'src/components/Config/index.js'),
        })
    ],
};

const developmentConfig = {
    devtool: "source-map",
    watch: true,
    watchOptions: {
        aggregateTimeout: 200,
        poll: 1000,
        ignored: ['**/node_modules/', '**/assests']
    },
    plugins: [
        new BundleAnalyzerPlugin(),
    ]
}

const productionConfig = {
}

module.exports = (env, args) => {
    switch (args.mode) {
        case 'development':
            return merge(commonConfig, developmentConfig);
        case 'production':
            return merge(commonConfig, productionConfig);
        default:
            throw new Error('No matching configuration was found!');
    }
}