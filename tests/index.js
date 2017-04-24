// require all `project/test/**/*.spec.js`
const testsContext = require.context(".", true, /\.spec\.js$/);

testsContext.keys().forEach(testsContext);

// require all `project/src/**/_index.js`
const componentsContext = require.context("./../src/", true, /\.js$/);

componentsContext.keys().forEach(componentsContext);
