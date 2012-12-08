// ReSharper disable InconsistentNaming
(function (linq2indexedDB) {
// ReSharper restore InconsistentNaming
    "use strict";

    function isArray(array) {
        if (array instanceof Array) {
            return true;
        } else {
            return false;
        }
    }

    linq2indexedDB.util = {
        isArray: isArray
    };

})(linq2indexedDB);