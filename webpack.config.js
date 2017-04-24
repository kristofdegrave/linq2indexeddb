const webpack = require('webpack');
const path = require('path');
const packageSettings = require("./package.json");

module.exports = {
    devtool: 'source-map', // 'cheap-eval-source-map'
    context: path.join(__dirname, 'src'),
    entry: {
        "indexedDB": "_index.js"
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "linq2indexedDB.js",
        library: "linq2indexedDB",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    module: {
        rules:[
            /*{ 
                enforce: "pre",
                test: /\.js$/, 
                loader: "eslint-loader",
                exclude: /node_modules/,
                options: {
                    cache: true,
                    failOnWarning: false,
                    failOnError: false,
                    fix: true
                }
            },*/
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use:[
                    {
                        loader: "babel-loader",
                        options:{
                            // https://github.com/babel/babel-loader#options
                            cacheDirectory: true,  
                            "presets": [                                                                                                                                         
                                [
                                    "env", 
                                    {
                                        //http://www.2ality.com/2015/12/babel6-loose-mode.html
                                        "loose": true,
                                        "modules": false,
                                        "targets": {
                                            "browsers": packageSettings.browserslist
                                        },
                                        useBuiltIns: true
                                    }
                                ]                                                                                                                     
                            ],
                            "plugins": [
                                "babel-plugin-transform-class-properties",
                                "transform-runtime"
                            ]
                        }
                    }
                ]
            },
            { 
                enforce: "post",
                test: /\.js$/, 
                loader: "istanbul-instrumenter-loader",
                exclude: /node_modules/,
                options:{
                    esModules: true
                }
            },    
        ]
    },
    target: "web",
    resolve: {
        mainFiles: ["_index", "index"],
        modules: [
            path.resolve("./src"),
            "node_modules"
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true,
            sourceMap: true,
            beautify: false,
            comments: false,
            compress: {
                warnings: true,
                drop_debugger: true,
                screw_ie8: true
            }
        })
    ]
};