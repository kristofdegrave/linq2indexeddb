/// <reference path="_references.js" />

// ReSharper disable InconsistentNaming
(function(WinJS, linq2indexedDB) {
    // ReSharper restore InconsistentNaming
    "use strict";

    function winJsPromise(promise) {
        return new WinJS.Promise(function(completed, error, progress) {
            promise({
                complete: function(context, args) {
                    completed(args);
                },
                error: function(context, args) {
                    error(args);
                },
                progress: function(context, args) {
                    progress(args);
                }
            });
        });
    }

    linq2indexedDB.promises = {
        promise: winJsPromise
    };
})(WinJS, linq2indexedDB);