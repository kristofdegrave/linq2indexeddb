// ReSharper disable InconsistentNaming
(function (window, linq2indexedDB, JSON) {
// ReSharper restore InconsistentNaming
    "use strict";

    // Private Fields
    var defaultFileLocationWorker = "/Scripts/Linq2IndexedDB.js";

    // Web Worker Thread
    if (typeof (window) === "undefined") {
        self.onmessage = function (event) {
            var data = event.data.data;
            var filtersString = event.data.filters || "[]";
            var sortClauses = event.data.sortClauses || [];
            var filters = JSON.parse(filtersString, linq2indexedDB.json.deserialize);
            var returnData = filterSort(data, filters, sortClauses);

            postMessage(returnData);
            return;
        };
    }

    // Private Functions
    function worker(data, filters, sortClauses) {
        return linq2indexedDB.promises.promise(function (pw) {
            if (typeof (window) !== "undefined" && typeof (window.Worker) !== "undefined") {
                var webworker = new Worker(linq2indexedDB.workers.location);
                webworker.onmessage = function (event) {
                    pw.complete(this, event.data);
                    webworker.terminate();
                };
                webworker.onerror = pw.error;

                var filtersString = JSON.stringify(filters, linq2indexedDB.json.serialize);

                webworker.postMessage({ data: data, filters: filtersString, sortClauses: sortClauses });
            } else {
                // Fallback when there are no webworkers present. Beware, this runs on the UI thread and can block the UI
                pw.complete(this, filterSort(data, filters, sortClauses));
            }
        });
    }

    function filterSort(data, filters, sortClauses) {
        var returnData = [];

        for (var i = 0; i < data.length; i++) {
            if (isDataValid(data[i].data, filters)) {
                returnData = addToSortedArray(returnData, data[i], sortClauses);
            }
        }

        return returnData;
    }

    function isDataValid(data, filters) {
        var isValid = true;

        for (var i = 0; i < filters.length; i++) {
            var filterValid = filters[i].filter.isValid(data, filters[i]);
            if (filters[i].isNotClause) {
                filterValid = !filterValid;
            }
            if (filters[i].isAndClause) {
                isValid = isValid && filterValid;
            } else if (filters[i].isOrClause) {
                isValid = isValid || filterValid;
            }
        }
        return isValid;
    }

    function addToSortedArray(array, data, sortClauses) {
        var newArray = [];
        if (array.length == 0 || sortClauses.length == 0) {
            newArray = array;
            newArray.push(data);
        } else {
            var valueAdded = false;
            for (var i = 0; i < array.length; i++) {
                var valueX = array[i].data;
                var valueY = data.data;
                for (var j = 0; j < sortClauses.length; j++) {
                    var sortPropvalueX = linq2indexedDB.json.getPropertyValue(valueX, sortClauses[j].propertyName);
                    var sortPropvalueY = linq2indexedDB.json.getPropertyValue(valueY, sortClauses[j].propertyName);

                    if (sortPropvalueX != sortPropvalueY) {
                        if ((sortClauses[j].descending && sortPropvalueX > sortPropvalueY)
                            || (!sortClauses[j].descending && sortPropvalueX < sortPropvalueY)) {
                            newArray.push(array[i]);
                        } else {
                            if (!valueAdded) {
                                valueAdded = true;
                                newArray.push(data);
                            }
                            newArray.push(array[i]);
                        }
                    }
                    else if (j == (sortClauses.length - 1)) {
                        newArray.push(array[i]);
                    }
                }
            }

            // Add at the end
            if (!valueAdded) {
                newArray.push(data);
            }
        }
        return newArray;
    }

    // Public functionality
    linq2indexedDB.workers = {
        location: defaultFileLocationWorker,
        worker: worker
    };

})(win, linq2indexedDB, JSON);