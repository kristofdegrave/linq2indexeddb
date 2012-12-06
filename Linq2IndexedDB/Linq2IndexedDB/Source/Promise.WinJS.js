(function (WinJS, linq2indexedDB) {
    "use strict";

    function winJSPromise(promise) {
        return new WinJS.Promise(function (completed, error, progress) {
            promise({
                complete: function (context, args) {
                    completed(args);
                },
                error: function (context, args) {
                    error(args);
                },
                progress: function (context, args) {
                    progress(args);
                }
            });
        });
    }

    linq2indexedDB.promises = {
        promise: winJSPromise
    };
})(WinJS, linq2indexedDB)