/**************************
 * Logging functionality. *
 **************************/
(function (linq2indexedDB) {
    "use strict";

    var severityEnum = {
        information: 0,
        warning: 1,
        error: 2,
        exception: 3
    };
    var undefined = "undefined";

    // Fixing logging exception, warning and error function on the log
    if (typeof (console) !== undefined) {

        if (typeof (console.warning) === undefined) {
            if (typeof (console.warn) === undefined) {
                console.warning = console.log;
            }
            else {
                console.warning = console.warn;
            }
        }

        if (typeof (console.error) === undefined) {
            console.error = console.log;
        }

        if (typeof (console.exception) === undefined) {
            console.exception = console.error;
        }
    }

    function log(severity) {
        if (typeof (console) === undefined
            || !linq2indexedDB.logging.enabled) {
            return false;
        }

        var currtime = (function currentTime() {
            var time = new Date();
            return time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + '.' + time.getMilliseconds();
        })();

        var args = [];

        args.push(currtime);

        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        switch (severity) {
            case severityEnum.exception:
                args[0] += ' Linq2IndexedDB Exception: ';
                console.exception.apply(console, args);
                break;
            case severityEnum.error:
                args[0] += ' Linq2IndexedDB Error: ';
                console.error.apply(console, args);
                break;
            case severityEnum.warning:
                args[0] += ' Linq2IndexedDB Warning: ';
                console.warning.apply(console, args);
                break;
            case severityEnum.information:
                args[0] += ' Linq2IndexedDB Info: ';
                console.log.apply(console, args);
                break;
            default:
                args[0] += ' Linq2IndexedDB: ';
                console.log.apply(console, args);
        }

        return true;
    }

    function logError(error) {
        return log(error.severity, error.message, error.type, error.method, error.orignialError);
    }

    linq2indexedDB.logging = {
        debug: function (enable) {
            this.enabled = !!enable;
            this.log(severityEnum.warning, "Debugging enabled: be carefull when using in production enviroment. Complex objects get written to  the log and may cause memory leaks.");
        },
        log: log,
        logError: logError,
        severity: severityEnum,
        enabled: false
    };
})(linq2indexedDB);