/*******************************************
 * Define and initialize global variables. *
 *******************************************/
var linq2indexedDB = linq2indexedDB || {},
    win = typeof (window) !== "undefined" ? window : undefined,
    $ = typeof (window) !== "undefined" && typeof (window.jQuery) !== "undefined" ? window.jQuery : undefined;