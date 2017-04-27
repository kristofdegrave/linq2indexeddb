// Karma configuration
// Generated on Thu Apr 20 2017 20:32:25 GMT+0200 (Romance Daylight Time)
var webpack = require("webpack");
var webpackConfig = require('./webpack.config.js');

module.exports = function(config) {
  var configuration = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
        'tests/index.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'tests/index.js': ['webpack', 'sourcemap']
    },

    webpack: {
        devtool: 'inline-source-map', // 'cheap-eval-source-map'
        output: {
            library: "linq2indexedDB",
            libraryTarget: "umd",
            umdNamedDefine: true
        },
        module: {
            rules:[
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
                                            /*"targets": {
                                                "browsers": packageSettings.browserslist
                                            },*/
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
                //path.resolve("./src"),
                "node_modules"
            ]
        }
    },

    webpackMiddleware: {
      noInfo: true
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage-istanbul', 'spec'/*, 'coverage'*/],

    coverageReporter: {
      dir: 'dist/coverage/',
      reporters: [
          { type: 'html' },
          { type: 'text' },
          { type: 'text-summary' }
      ]
    },

    coverageIstanbulReporter: {
        reports: [ 'text-summary' ],
        fixWebpackSourcePaths: true
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    client: {
        captureConsole: true
    },

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //browsers: ['Chrome', 'Firefox', 'Safari', 'IE'],
    browsers: ['Chrome', 'Firefox', 'IE', "Edge"],
    //browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    //singleRun: false,
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    //concurrency: Infinity,
    concurrency: 4,

    customLaunchers: {
        Chrome_travis_ci: {
            base: 'Chrome',
            flags: ['--no-sandbox']
        }
    },

    plugins: [
      "karma-webpack",
      "istanbul-instrumenter-loader",
      "karma-coverage",
      "karma-spec-reporter",
      "karma-sourcemap-loader",
      "karma-chrome-launcher",
      "karma-firefox-launcher",
      "karma-safari-launcher",
      "karma-ie-launcher",
      "karma-edge-launcher",
      "karma-jasmine",
      "karma-coverage-istanbul-reporter"
    ]
  };

  if (process.env.TRAVIS) {
      configuration.browsers = ['Chrome_travis_ci'];
      configuration.singleRun = true;
  }

  config.set(configuration);
}
