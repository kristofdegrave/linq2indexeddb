/// <reference path="_references.js" />

// Namespace linq2indexedDB.prototype.linq
// ReSharper disable InconsistentNaming
(function (linq2indexedDB) {
// ReSharper restore InconsistentNaming
    var filters = {};
    var equalsFilter = createFilter("equals"
                                   , true
                                   , 0
                                   , function (data, filter) {
                                       return linq2indexedDB.json.getPropertyValue(data, filter.propertyName) == filter.value;
                                   }
                                   , function (callback, queryBuilder, filterMetaData) {
                                       /// <summary>Creates a function to retrieve values for the filter and adds the filter to the querybuilder.</summary>
                                       /// <param name="callback" type="function">
                                       ///     Callback method so the query expression can be builded.
                                       /// </param>
                                       /// <param name="queryBuilder" type="Object">
                                       ///     The objects that builds up the query for the user.
                                       /// </param>
                                       /// <param name="filterMetaData" type="string">
                                       ///     The metadata for the filter.
                                       /// </param>
                                       /// <returns type="function">
                                       ///     returns a function to retrieve the necessary values for the filter
                                       /// </returns>
                                       return function (value) {
                                           if (typeof (value) === "undefined") {
                                               throw "linq2indexedDB: value needs to be provided to the equal clause";
                                           }
                                           filterMetaData.value = value;

                                           return callback(queryBuilder, filterMetaData);
                                       };
                                   });
    var betweenFilter = createFilter("between"
                                   , true
                                   , 1
                                   , function (data, filter) {
                                       var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
                                       return (value > filter.minValue || (filter.minValueIncluded && value == filter.minValue))
                                           && (value < filter.maxValue || (filter.maxValueIncluded && value == filter.maxValue));
                                   }
                                   , function (callback, queryBuilder, filterMetaData) {
                                       /// <summary>Creates a function to retrieve values for the filter and adds the filter to the querybuilder.</summary>
                                       /// <param name="callback" type="function">
                                       ///     Callback method so the query expression can be builded.
                                       /// </param>
                                       /// <param name="queryBuilder" type="Object">
                                       ///     The objects that builds up the query for the user.
                                       /// </param>
                                       /// <param name="filterMetaData" type="string">
                                       ///     The metadata for the filter.
                                       /// </param>
                                       /// <returns type="function">
                                       ///     returns a function to retrieve the necessary values for the filter
                                       /// </returns>
                                       return function (minValue, maxValue, minValueIncluded, maxValueIncluded) {
                                           var isMinValueIncluded = typeof (minValueIncluded) === "undefined" ? false : minValueIncluded;
                                           var isMasValueIncluded = typeof (maxValueIncluded) === "undefined" ? false : maxValueIncluded;
                                           if (typeof (minValue) === "undefined") {
                                               throw "linq2indexedDB: minValue needs to be provided to the between clause";
                                           }
                                           if (typeof (maxValue) === "undefined") {
                                               throw "linq2indexedDB: maxValue needs to be provided to the between clause";
                                           }

                                           filterMetaData.minValue = minValue;
                                           filterMetaData.maxValue = maxValue;
                                           filterMetaData.minValueIncluded = isMinValueIncluded;
                                           filterMetaData.maxValueIncluded = isMasValueIncluded;

                                           return callback(queryBuilder, filterMetaData);
                                       };
                                   });
    var greaterThenFilter = createFilter("greaterThan"
                                   , true
                                   , 2
                                   , function (data, filter) {
                                       var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
                                       return value > filter.value || (filter.valueIncluded && value == filter.value);
                                   }
                                   , function (callback, queryBuilder, filterMetaData) {
                                       /// <summary>Creates a function to retrieve values for the filter and adds the filter to the querybuilder.</summary>
                                       /// <param name="callback" type="function">
                                       ///     Callback method so the query expression can be builded.
                                       /// </param>
                                       /// <param name="queryBuilder" type="Object">
                                       ///     The objects that builds up the query for the user.
                                       /// </param>
                                       /// <param name="filterMetaData" type="string">
                                       ///     The metadata for the filter.
                                       /// </param>
                                       /// <returns type="function">
                                       ///     returns a function to retrieve the necessary values for the filter
                                       /// </returns>
                                       return function (value, valueIncluded) {
                                           if (typeof (value) === "undefined") {
                                               throw "linq2indexedDB: value needs to be provided to the greatherThan clause";
                                           }
                                           var isValueIncluded = typeof (valueIncluded) === "undefined" ? false : valueIncluded;

                                           filterMetaData.value = value;
                                           filterMetaData.valueIncluded = isValueIncluded;

                                           return callback(queryBuilder, filterMetaData);
                                       };
                                   });
    var smallerThanFilter = createFilter("smallerThan"
                                   , true
                                   , 2
                                   , function (data, filter) {
                                       var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
                                       return value < filter.value || (filter.valueIncluded && value == filter.value);
                                   }
                                   , function (callback, queryBuilder, filterMetaData) {
                                       /// <summary>Creates a function to retrieve values for the filter and adds the filter to the querybuilder.</summary>
                                       /// <param name="callback" type="function">
                                       ///     Callback method so the query expression can be builded.
                                       /// </param>
                                       /// <param name="queryBuilder" type="Object">
                                       ///     The objects that builds up the query for the user.
                                       /// </param>
                                       /// <param name="filterMetaData" type="string">
                                       ///     The metadata for the filter.
                                       /// </param>
                                       /// <returns type="function">
                                       ///     returns a function to retrieve the necessary values for the filter
                                       /// </returns>
                                       return function (value, valueIncluded) {
                                           if (typeof (value) === "undefined") {
                                               throw "linq2indexedDB: value needs to be provided to the smallerThan clause";
                                           }
                                           var isValueIncluded = typeof (valueIncluded) === "undefined" ? false : valueIncluded;

                                           filterMetaData.value = value;
                                           filterMetaData.valueIncluded = isValueIncluded;

                                           return callback(queryBuilder, filterMetaData);
                                       };
                                   });
    var inArrayFilter = createFilter("inArray"
                                   , false
                                   , 3
                                   , function (data, filter) {
                                       var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
                                       if (value) {
                                           return filter.value.indexOf(value) >= 0;
                                       }
                                       else {
                                           return false;
                                       }
                                   }
                                   , function (callback, queryBuilder, filterMetaData) {
                                       /// <summary>Creates a function to retrieve values for the filter and adds the filter to the querybuilder.</summary>
                                       /// <param name="callback" type="function">
                                       ///     Callback method so the query expression can be builded.
                                       /// </param>
                                       /// <param name="queryBuilder" type="Object">
                                       ///     The objects that builds up the query for the user.
                                       /// </param>
                                       /// <param name="filterMetaData" type="string">
                                       ///     The metadata for the filter.
                                       /// </param>
                                       /// <returns type="function">
                                       ///     returns a function to retrieve the necessary values for the filter
                                       /// </returns>
                                       return function (array) {
                                           if (typeof (array) === "undefined" || array.push === "undefined") { // typeof array !== "Array") {
                                               throw "linq2indexedDB: array needs to be provided to the inArray clause";
                                           }

                                           filterMetaData.value = array;

                                           return callback(queryBuilder, filterMetaData);
                                       };
                                   });
    var likeFilter = createFilter("like"
                                   , false
                                   , 4
                                   , function (data, filter) {
                                       var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
                                       if (value) {
                                           return value.indexOf(filter.value) >= 0;
                                       }
                                       else {
                                           return false;
                                       }
                                   }
                                   , function (callback, queryBuilder, filterMetaData) {
                                       /// <summary>Creates a function to retrieve values for the filter and adds the filter to the querybuilder.</summary>
                                       /// <param name="callback" type="function">
                                       ///     Callback method so the query expression can be builded.
                                       /// </param>
                                       /// <param name="queryBuilder" type="Object">
                                       ///     The objects that builds up the query for the user.
                                       /// </param>
                                       /// <param name="filterMetaData" type="string">
                                       ///     The metadata for the filter.
                                       /// </param>
                                       /// <returns type="function">
                                       ///     returns a function to retrieve the necessary values for the filter
                                       /// </returns>
                                       return function (value) {
                                           if (typeof (value) === "undefined") {
                                               throw "linq2indexedDB: value needs to be provided to the like clause";
                                           }

                                           filterMetaData.value = value;

                                           return callback(queryBuilder, filterMetaData);
                                       };
                                   });
    var isUndefinedFilter = createFilter("isUndefined"
                                   , false
                                   , 5
                                   , function (data, filter) {
                                       return linq2indexedDB.json.getPropertyValue(data, filter.propertyName) === undefined;
                                   }
                                   , function (callback, queryBuilder, filterMetaData) {
                                       /// <summary>Creates a function to retrieve values for the filter and adds the filter to the querybuilder.</summary>
                                       /// <param name="callback" type="function">
                                       ///     Callback method so the query expression can be builded.
                                       /// </param>
                                       /// <param name="queryBuilder" type="Object">
                                       ///     The objects that builds up the query for the user.
                                       /// </param>
                                       /// <param name="filterMetaData" type="string">
                                       ///     The metadata for the filter.
                                       /// </param>
                                       /// <returns type="function">
                                       ///     returns a function to retrieve the necessary values for the filter
                                       /// </returns>
                                       return function () {
                                           return callback(queryBuilder, filterMetaData);
                                       };
                                   });

    // Private Methods
    function createFilter(name, indexeddbFilter, sortOrder, isValid, filterCallback) {
        if (typeof name === 'undefined') {
            throw "linq2IndexedDB: No name argument provided to the addFilter method.";
        }
        if (typeof name !== 'string') {
            throw "linq2IndexedDB: The name argument provided to the addFilterObject method must be a string.";
        }
        if (typeof isValid === 'undefined') {
            throw "linq2IndexedDB: No isValid argument provided to the addFilter method.";
        }
        if (typeof isValid !== 'function') {
            throw "linq2IndexedDB: The isValid argument provided to the addFilterObject method must be a function.";
        }
        if (typeof filterCallback === 'undefined') {
            throw "linq2IndexedDB: No filterCallback argument provided to the addFilter method.";
        }
        //if (typeof filterCallback !== 'function') {
        //    throw "linq2IndexedDB: The filterCallback argument provided to the addFilterObject method must be a function.";
        //}

        return {
            name: name,
            indexeddbFilter: indexeddbFilter,
            sortOrder: sortOrder,
            isValid: isValid,
            filter: filterCallback
        };
    }

    function addFilter(filter) {
        if (typeof (filters[filter.name]) !== 'undefined') {
            throw "linq2IndexedDB: A filter with the name '" + filter.name + "' already exists.";
        }

        filters[filter.name] = filter;
    }

    // Initialize
    addFilter(equalsFilter);
    addFilter(betweenFilter);
    addFilter(greaterThenFilter);
    addFilter(smallerThanFilter);
    addFilter(inArrayFilter);
    addFilter(likeFilter);
    addFilter(isUndefinedFilter);

    // Public
    linq2indexedDB.linq = {
        addFilter: function (name, isValid, filterCallback) {
            addFilter(this.createFilter(name, isValid, filterCallback));
        },
        createFilter: function (name, isValid, filterCallback) {
            return createFilter(name, false, 99, isValid, filterCallback);
        },
        filters: filters
    };
})(linq2indexedDB);