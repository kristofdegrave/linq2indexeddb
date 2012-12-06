(function (linq2indexedDB) {
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