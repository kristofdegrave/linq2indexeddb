// ReSharper disable InconsistentNaming
(function (window, $, linq2indexedDB) {
// ReSharper restore InconsistentNaming
    "use strict";

    if (typeof (window) !== "undefined" && (typeof ($) === "undefined" || typeof ($.Deferred) === "undefined")) {
        throw "linq2indexedDB: No jQuery framework that supports promises found. Please ensure jQuery is referenced before the linq2indexedDB.js file and the version is higher then 1.7.1";
    }

    function jQueryPromise(promise) {
        return $.Deferred(function (dfd) {
            promise({
                complete: function (context, args) {
                    dfd.resolveWith(context, [args]);
                },
                error: function (context, args) {
                    dfd.rejectWith(context, [args]);
                },
                progress: function (context, args) {
                    dfd.notifyWith(context, [args]);
                }
            });
        }).promise();
    }

    linq2indexedDB.promises = {
        promise: jQueryPromise
    };
})(win, $, linq2indexedDB);
