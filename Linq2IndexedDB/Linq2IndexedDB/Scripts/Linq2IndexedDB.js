/// <reference path="jquery-1.7.2.js" />
/// <reference path="indexeddb.shim.js" />

var linq2indexedDB;
var enableLogging = true;

// Initializes the linq2indexeddb object.
(function() {
    /// <param name="$" type="jQuery" />
    "use strict";

    linq2indexedDB = function(name, configuration, enableDebugging) {
        /// <summary>Creates a new or opens an existing database for the given name</summary>
        /// <param name="name" type="String">The name of the database</param>
        /// <param name="configuration" type="Object">
        ///     [Optional] provide comment
        /// </param>
        /// <returns type="linq2indexedDB" />

        var dbConfig = {
            autoGenerateAllowed: true
        };

        if (name) {
            dbConfig.name = name;
        }

        if (configuration) {
            if (configuration.version) {
                dbConfig.version = configuration.version;
            }
            // From the moment the configuration is provided by the developper, autoGeneration isn't allowed.
            // If this would be allowed, the developper wouldn't be able to determine what to do for which version.
            if (configuration.schema) {
                var appVersion = dbConfig.version || -1;
                for (key in configuration.schema) {
                    appVersion = version > key ? version : key;
                }
                if (version > -1) {
                    dbConfig.autoGenerateAllowed = false;
                    dbConfig.version = appVersion;
                    dbConfig.schema = configuration.schema;
                }
            }
            if (configuration.definition) {
                dbConfig.autoGenerateAllowed = false;
                dbConfig.definition = configuration.definition;
            }
            if (configuration.onupgradeneeded) {
                dbConfig.autoGenerateAllowed = false;
                dbConfig.onupgradeneeded = configuration.onupgradeneeded;
            }
            if (configuration.oninitializeversion) {
                dbConfig.autoGenerateAllowed = false;
                dbConfig.oninitializeversion = configuration.oninitializeversion;
            }
        }

        var returnObject = {
            utilities: linq2indexedDB.prototype.utilities,
            core: linq2indexedDB.prototype.core,
            linq: linq(dbConfig),
            initialize: function() {
                linq2indexedDB.prototype.utilities.log("Initialize Started");
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    linq2indexedDB.prototype.core.db(dbConfig.name, dbConfig.version).then(function(args /*db*/) {
                        var db = args[0];

                        linq2indexedDB.prototype.utilities.log("Close dbconnection");
                        db.close();
                        linq2indexedDB.prototype.utilities.log("Initialize Succesfull");
                        pw.complete();
                    }, pw.error, function(args /*txn, e*/) {
                        var txn = args[0];
                        var e = args[1];
                        if (e.type == "upgradeneeded") {
                            upgradeDatabase(dbConfig, e.oldVersion, e.newVersion, txn);
                        }
                    });
                });
            },
            deleteDatabase: function() {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    linq2indexedDB.prototype.core.deleteDb(dbConfig.name).then(function() {
                        pw.complete();
                    }, pw.error);
                });
            }
        };

        if (enableDebugging) {
            returnObject.viewer = viewer(dbConfig);
        }

        return returnObject;
    };

    function linq(dbConfig) {

        var queryBuilderObj = function(objectStoreName) {
            this.from = objectStoreName;
            this.where = [];
            this.select = [];
            this.sortClauses = [];
            this.get = [];
            this.insert = [];
            this.merge = [];
            this.update = [];
            this.remove = [];
            this.clear = false;
        };

        queryBuilderObj.prototype = {
            executeQuery: function() {
                executeQuery(this);
            }
        };

        function from(queryBuilder, objectStoreName) {
            queryBuilder.from = objectStoreName;
            return {
                where: function(filter) {
                    /// <summary>Filters the selected data.</summary>
                    /// <param name="filter">
                    /// The filter argument can be a string (In this case the string represents the property name you want to filter on) or a function.
                    /// (In this case the function will be used to filter the data. This callback function is called with 1 parameter: data
                    /// ,this argument holds the data that has to be validated. The return type of the function must be a boolean.)
                    ///</param>
                    return where(queryBuilder, filter, true, false);
                },
                orderBy: function(propertyName) {
                    /// <summary>Sorts the selected data ascending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, false);
                },
                orderByDesc: function(propertyName) {
                    /// <summary>Sorts the selected data descending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, true);
                },
                select: function(propertyNames) {
                    /// <summary>Selects the data.</summary>
                    /// <param name="propertyNames" type="Array">A list of the names of the properties you want to select.</param>
                    /// <returns type="Array">A list with the selected objects.</returns>
                    return select(queryBuilder, propertyNames);
                },
                insert: function(data, key) {
                    /// <summary>inserts data.</summary>
                    /// <param name="data" type="Object">The object you want to insert.</param>
                    /// <param name="key" type="Object">
                    ///     [Optional] The key of the data you want to insert.
                    /// </param>
                    /// <returns type="Object">The object that was inserted.</returns>
                    return insert(queryBuilder, data, key);
                },
                update: function(data, key) {
                    /// <summary>updates data.</summary>
                    /// <param name="data" type="Object">The object you want to update.</param>
                    /// <param name="key" type="Object">
                    ///     [Optional] The key of the data you want to update.
                    /// </param>
                    /// <returns type="Object">The object that was updated.</returns>
                    return update(queryBuilder, data, key);
                },
                merge : function (data, key) {
                    /// <summary>merges data.</summary>
                    /// <param name="data" type="Object">The data you want to merge.</param>
                    /// <param name="key" type="Object">
                    ///     [Optional] The key of the data you want to update.
                    /// </param>
                    /// <returns type="Object">The object that was updated.</returns>
                    return merge(queryBuilder, data, key);
                },
                remove: function(key) {
                    /// <summary>Removes data from the objectstore by his key.</summary>
                    /// <param name="key" type="Object">The key of the object you want to remove.</param>
                    return remove(queryBuilder, key);
                },
                clear: function() {
                    /// <summary>Removes all data from the objectstore.</summary>
                    return clear(queryBuilder);
                },
                get: function(key) {
                    /// <summary>Gets an object by his key.</summary>
                    /// <param name="key" type="Object">The key of the object you want to retrieve.</param>
                    /// <returns type="Object">The object that has the provided key.</returns>
                    return get(queryBuilder, key);
                }
            };
        }

        function where(queryBuilder, filter, isAndClause, isOrClause, isNotClause) {
            var whereClauses = { };
            var filterMetaData;

            if (typeof isNotClause === "undefined") {
                whereClauses.not = function() {
                    return where(queryBuilder, filter, isAndClause, isOrClause, true);
                };
            }

            if (typeof filter === "function") {
                filterMetaData = {
                    propertyName: filter,
                    isOrClause: isOrClause,
                    isAndClause: isAndClause,
                    isNotClause: (typeof isNotClause === "undefined" ? false : isNotClause),
                    filter: linq2indexedDB.prototype.linq.createFilter("anonymous" + queryBuilder.where.length, filter, null)
                };
                return whereClause(queryBuilder, filterMetaData);
            } else if (typeof filter === "string") {
                // Builds up the where filter methodes
                for (var filterName in linq2indexedDB.prototype.linq.filters) {
                    filterMetaData = {
                        propertyName: filter,
                        isOrClause: isOrClause,
                        isAndClause: isAndClause,
                        isNotClause: (typeof isNotClause === "undefined" ? false : isNotClause),
                        filter: linq2indexedDB.prototype.linq.filters[filterName]
                    };
                    if (typeof linq2indexedDB.prototype.linq.filters[filterName].filter !== "function") {
                        throw "Linq2IndexedDB: a filter methods needs to be provided for the filter '" + filterName + "'";
                    }
                    if (typeof linq2indexedDB.prototype.linq.filters[filterName].name === "undefined") {
                        throw "Linq2IndexedDB: a filter name needs to be provided for the filter '" + filterName + "'";
                    }

                    whereClauses[linq2indexedDB.prototype.linq.filters[filterName].name] = linq2indexedDB.prototype.linq.filters[filterName].filter(whereClause, queryBuilder, filterMetaData);
                }
            }
            return whereClauses;
        }

        function whereClause(queryBuilder, filterMetaData) {
            queryBuilder.where.push(filterMetaData);
            return {
                and: function(filter) {
                    /// <summary>Adds an extra filter.</summary>
                    /// <param name="filter">
                    /// The filter argument can be a string (In this case the string represents the property name you want to filter on) or a function.
                    /// (In this case the function will be used to filter the data. This callback function is called with 1 parameter: data
                    /// ,this argument holds the data that has to be validated. The return type of the function must be a boolean.)
                    ///</param>
                    return where(queryBuilder, filter, true, false);
                },
                or: function(filter) {
                    /// <summary>Adds an extra filter.</summary>
                    /// <param name="filter">
                    /// The filter argument can be a string (In this case the string represents the property name you want to filter on) or a function.
                    /// (In this case the function will be used to filter the data. This callback function is called with 1 parameter: data
                    /// ,this argument holds the data that has to be validated. The return type of the function must be a boolean.)
                    ///</param>
                    return where(queryBuilder, filter, false, true);
                },
                orderBy: function(propertyName) {
                    /// <summary>Sorts the selected data ascending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, false);
                },
                orderByDesc: function(propertyName) {
                    /// <summary>Sorts the selected data descending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, true);
                },
                select: function(propertyNames) {
                    /// <summary>Selects the data.</summary>
                    /// <param name="propertyNames" type="Array">A list of the names of the properties you want to select.</param>
                    return select(queryBuilder, propertyNames);
                }
            };
        }

        function orderBy(queryBuilder, propName, descending) {
            queryBuilder.sortClauses.push({ propertyName: propName, descending: descending });
            return {
                orderBy: function(propertyName) {
                    /// <summary>Sorts the selected data ascending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, false);
                },
                orderByDesc: function(propertyName) {
                    /// <summary>Sorts the selected data descending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, true);
                },
                select: function(propertyNames) {
                    /// <summary>Selects the data.</summary>
                    /// <param name="propertyNames" type="Array">A list of the names of the properties you want to select.</param>
                    return select(queryBuilder, propertyNames);
                }
            };
        }

        function select(queryBuilder, propertyNames) {
            if (propertyNames) {
                if (!linq2indexedDB.prototype.utilities.isArray(propertyNames)) {
                    propertyNames = [propertyNames];
                }

                for (var i = 0; i < propertyNames.length; i++) {
                    queryBuilder.select.push(propertyNames[i]);
                }
            }
            return executeQuery(queryBuilder);
        }

        function insert(queryBuilder, data, key) {
            queryBuilder.insert.push({ data: data, key: key });
            return executeQuery(queryBuilder);
        }

        function update(queryBuilder, data, key) {
            queryBuilder.update.push({ data: data, key: key });
            return executeQuery(queryBuilder);
        }

        function merge(queryBuilder, data, key) {
            queryBuilder.merge.push({ data: data, key: key });
            return executeQuery(queryBuilder);
        }

        function remove(queryBuilder, key) {
            queryBuilder.remove.push({ key: key });
            return executeQuery(queryBuilder);
        }

        function clear(queryBuilder) {
            queryBuilder.clear = true;
            return executeQuery(queryBuilder);
        }

        function get(queryBuilder, key) {
            queryBuilder.get.push({ key: key });
            return executeQuery(queryBuilder);
        }

        function executeQuery(queryBuilder) {
            return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                linq2indexedDB.prototype.core.db(dbConfig.name, dbConfig.version).then(function(args /* [db, event] */) {
                    if (queryBuilder.insert.length > 0) {
                        executeInsert(queryBuilder, pw, args[0]);
                    } else if (queryBuilder.update.length > 0) {
                        executeUpdate(queryBuilder, pw, args[0]);
                    } else if (queryBuilder.merge.length > 0) {
                        executeMerge(queryBuilder, pw, args[0]);
                    } else if (queryBuilder.remove.length > 0) {
                        executeRemove(queryBuilder, pw, args[0]);
                    } else if (queryBuilder.clear) {
                        executeClear(queryBuilder, pw, args[0]);
                    } else if (queryBuilder.get.length > 0) {
                        executeGet(queryBuilder, pw, args[0]);
                    } else {
                        executeRead(queryBuilder, pw, args[0]);
                    }
                }, pw.error, function(args /*txn, e*/) {
                    var txn = args[0];
                    var e = args[1];

                    if (e.type == "upgradeneeded") {
                        upgradeDatabase(dbConfig, e.oldVersion, e.newVersion, txn);
                    }
                });
            });
        }

        function executeGet(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.prototype.core.transaction(dbPromise, queryBuilder.from, linq2indexedDB.prototype.core.transactionTypes.READ_ONLY, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function(args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
                pw.error,
                function(args /* [transaction] */) {
                    linq2indexedDB.prototype.core.get(linq2indexedDB.prototype.core.objectStore(args[0], queryBuilder.from), queryBuilder.get[0].key).then(function(args1 /*data*/) {
                        pw.complete(this, args1[0] /*[data]*/);
                    }, pw.error);
                });
        }

        function executeClear(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.prototype.core.transaction(dbPromise, queryBuilder.from, linq2indexedDB.prototype.core.transactionTypes.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function(args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
                pw.error,
                function(args /* [transaction] */) {
                    var clearPromis = linq2indexedDB.prototype.core.clear(linq2indexedDB.prototype.core.objectStore(args[0], queryBuilder.from));
                    clearPromis.then(function() {
                        pw.complete(this);
                    }, pw.error);
                });
        }

        function executeRemove(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.prototype.core.transaction(dbPromise, queryBuilder.from, linq2indexedDB.prototype.core.transactionTypes.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function(args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
                pw.error,
                function(args /* [transaction] */) {
                    var removePromis = linq2indexedDB.prototype.core.remove(linq2indexedDB.prototype.core.objectStore(args[0], queryBuilder.from), queryBuilder.remove[0].key);
                    removePromis.then(function() {
                        pw.complete(this, queryBuilder.remove[0].key /*[queryBuilder.remove[0].key]*/);
                    }, pw.error);
                });
        }

        function executeUpdate(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.prototype.core.transaction(dbPromise, queryBuilder.from, linq2indexedDB.prototype.core.transactionTypes.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function(args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
                pw.error,
                function(args /* [transaction] */) {
                    linq2indexedDB.prototype.core.update(linq2indexedDB.prototype.core.objectStore(args[0], queryBuilder.from), queryBuilder.update[0].data, queryBuilder.update[0].key).then(function(args1 /*storedData, storedkey*/) {
                        pw.complete(this, args1[0] /*{object: args[0], key: args[1]}*/ /*[storedData, storedkey]*/);
                    }, pw.error);
                });
        }

        function executeMerge(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.prototype.core.transaction(dbPromise, queryBuilder.from, linq2indexedDB.prototype.core.transactionTypes.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function (args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
                pw.error,
                function (args /* [transaction] */) {
                    var objectStore = linq2indexedDB.prototype.core.objectStore(args[0], queryBuilder.from);
                    var obj = null;
                    linq2indexedDB.prototype.core.cursor(objectStore, IDBKeyRange.only(queryBuilder.merge[0].key)).then(function () {
                        //pw.complete(this, obj);
                    }, null, function (args1 /*data*/) {
                        obj = args1[0];
                        for (var prop in queryBuilder.merge[0].data) {
                            obj[prop] = queryBuilder.merge[0].data[prop];
                        }

                        args1[1].update(obj);
                        pw.complete(this, obj);
                        //pw.progress(this, obj /*[data]*/);
                    }, pw.error);
                });
        }

        function executeInsert(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.prototype.core.transaction(dbPromise, queryBuilder.from, linq2indexedDB.prototype.core.transactionTypes.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function(args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
                pw.error,
                function(args /* [transaction] */) {
                    var insertPromis = linq2indexedDB.prototype.core.insert(linq2indexedDB.prototype.core.objectStore(args[0], queryBuilder.from), queryBuilder.insert[0].data, queryBuilder.insert[0].key);
                    insertPromis.then(function(args1 /*storedData, storedkey*/) {
                        pw.complete(this, args1[0] /*{object: args[0], key: args[1]}*/ /*[storedData, storedkey]*/);
                    }, pw.error);
                });
        }

        function executeRead(queryBuilder, pw, dbPromise) {
            linq2indexedDB.prototype.core.transaction(dbPromise, queryBuilder.from, linq2indexedDB.prototype.core.transactionTypes.READ_ONLY, dbConfig.autoGenerateAllowed).then(function(args /* [txn] */) {
                var txn = args[0];
                txn.db.close();
            },
                pw.error,
                function(args /* [txn] */) {

                    linq2indexedDB.prototype.core.objectStore(args[0], queryBuilder.from).then(function(objArgs) {
                        try {
                            var objectStore = objArgs[1];
                            var whereClauses = queryBuilder.where || [];
                            var returnData = [];
                            var cursorPromise = determineCursor(objectStore, whereClauses);

                            cursorPromise.then(
                                function(args1 /*data*/) {
                                    var data = args1[0];

                                    linq2indexedDB.prototype.utilities.linq2indexedDBWorker(data, whereClauses, queryBuilder.sortClauses).then(function(d) {
                                        // No need to notify again if it allready happend in the onProgress method of the cursor.
                                        if (returnData.length == 0) {
                                            for (var j = 0; j < d.length; j++) {
                                                var obj = selectData(d[j], queryBuilder.select);
                                                returnData.push(obj);
                                                pw.progress(this, obj /*[obj]*/);
                                            }
                                        }
                                        pw.complete(this, returnData /*[returnData]*/);
                                    });
                                },
                                pw.error,
                                function(args1 /*data*/) {
                                    var data = args1[0];

                                    // When there are no more where clauses to fulfill and the collection doesn't need to be sorted, the data can be returned.
                                    // In the other case let the complete handle it.
                                    if (whereClauses.length == 0 && queryBuilder.sortClauses.length == 0) {
                                        var obj = selectData(data, queryBuilder.select);
                                        returnData.push(obj);
                                        pw.progress(this, obj /*[obj]*/);
                                    }
                                }
                            );
                        } catch(ex) {
                            // Handle errors like an invalid keyRange.
                            linq2indexedDB.prototype.core.abortTransaction(args[0]);
                            pw.error(this, [ex.message, ex]);
                        }
                    }, pw.error);
                });
        }
        
        function determineCursor(objectStore, whereClauses) {
            var cursorPromise;

            // Checks if an indexeddb filter can be used
            if (whereClauses.length > 0
                && !whereClauses[0].isNotClause
                && whereClauses[0].filter.indexeddbFilter
                && (whereClauses.length == 1 || (whereClauses.length > 1 && !whereClauses[1].isOrClause))) {
                var source = objectStore;
                var indexPossible = dbConfig.autoGenerateAllowed || objectStore.indexNames.contains(whereClauses[0].propertyName + linq2indexedDB.prototype.core.indexSuffix);
                // Checks if we can use an index
                if (whereClauses[0].propertyName != objectStore.keyPath && indexPossible){
                    source = linq2indexedDB.prototype.core.index(objectStore, whereClauses[0].propertyName, dbConfig.autoGenerateAllowed);
                }
                // Checks if we can use indexeddb filter
                if (whereClauses[0].propertyName == objectStore.keyPath
                    || indexPossible) {
                    // Gets the where clause + removes it from the collection
                    var clause = whereClauses.shift();
                    switch (clause.filter) {
                        case linq2indexedDB.prototype.linq.filters.equals:
                            cursorPromise = linq2indexedDB.prototype.core.cursor(source, IDBKeyRange.only(clause.value));
                            break;
                        case linq2indexedDB.prototype.linq.filters.between:
                            cursorPromise = linq2indexedDB.prototype.core.cursor(source, IDBKeyRange.bound(clause.minValue, clause.maxValue, clause.minValueIncluded, clause.maxValueIncluded));
                            break;
                        case linq2indexedDB.prototype.linq.filters.greaterThan:
                            cursorPromise = linq2indexedDB.prototype.core.cursor(source, IDBKeyRange.lowerBound(clause.value, clause.valueIncluded));
                            break;
                        case linq2indexedDB.prototype.linq.filters.smallerThan:
                            cursorPromise = linq2indexedDB.prototype.core.cursor(source, IDBKeyRange.upperBound(clause.value, clause.valueIncluded));
                            break;
                        default:
                            cursorPromise = linq2indexedDB.prototype.core.cursor(source);
                            break;
                    }
                } else {
                    // Get everything if the index can't be used
                    cursorPromise = linq2indexedDB.prototype.core.cursor(source);
                }
            } else {
                // Get's everything, manually filter data
                cursorPromise = linq2indexedDB.prototype.core.cursor(objectStore);
            }
            return cursorPromise;
        }

        function selectData(data, propertyNames) {
            if (propertyNames && propertyNames.length > 0) {
                if (!linq2indexedDB.prototype.utilities.isArray(propertyNames)) {
                    propertyNames = [propertyNames];
                }

                var obj = new Object();
                for (var i = 0; i < propertyNames.length; i++) {
                    obj[propertyNames[i]] = data[propertyNames[i]];
                }
                return obj;
            }
            return data;
        }

        return {
            from: function(objectStoreName) {
                return from(new queryBuilderObj(objectStoreName), objectStoreName);
            }
        };
    }

    function viewer(dbConfig) {
        var dbView = { };
        var refresh = true;

        function refreshInternal() {
            if (refresh) {
                refresh = false;
                getDbInformation(dbView, dbConfig);
            }
        }

        dbView.Configuration = {
            name: dbConfig.name,
            version: dbConfig.version,
            autoGenerateAllowed: dbConfig.autoGenerateAllowed,
            schema: dbConfig.schema,
            definition: dbConfig.definition,
            onupgradeneeded: dbConfig.onupgradeneeded,
            oninitializeversion: dbConfig.oninitializeversion
        };

        dbView.refresh = function() {
            refresh = true;
            refreshInternal();
        };

        linq2indexedDB.prototype.core.dbStructureChanged.addListener(linq2indexedDB.prototype.core.databaseEvents.databaseUpgrade, function() {
            refresh = true;
        });
        linq2indexedDB.prototype.core.dbStructureChanged.addListener(linq2indexedDB.prototype.core.databaseEvents.databaseOpened, function() {
            refreshInternal();
        });
        linq2indexedDB.prototype.core.dbStructureChanged.addListener(linq2indexedDB.prototype.core.databaseEvents.databaseRemoved, function() {
            dbView.name = null;
            dbView.version = null;
            dbView.ObjectStores = [];
        });
        linq2indexedDB.prototype.core.dbDataChanged.addListener([linq2indexedDB.prototype.core.dataEvents.dataInserted, linq2indexedDB.prototype.core.dataEvents.dataRemoved, linq2indexedDB.prototype.core.dataEvents.dataUpdated, linq2indexedDB.prototype.core.dataEvents.objectStoreCleared], function() {
            dbView.refresh();
        });

        return dbView;
    }

    function getDbInformation(dbView, dbConfig) {
        linq2indexedDB.prototype.core.db(dbConfig.name).then(function() {
            var connection = arguments[0][0];
            dbView.name = connection.name;
            dbView.version = connection.version;
            dbView.ObjectStores = [];

            linq2indexedDB.prototype.core.dbStructureChanged.addListener(linq2indexedDB.prototype.core.databaseEvents.databaseBlocked, function() {
                connection.close();
            });

            var objectStoreNames = [];
            for (var k = 0; k < connection.objectStoreNames.length; k++) {
                objectStoreNames.push(connection.objectStoreNames[k]);
            }

            if (objectStoreNames.length > 0) {
                linq2indexedDB.prototype.core.transaction(connection, objectStoreNames, linq2indexedDB.prototype.core.transactionTypes.READ_ONLY, false).then(null, null, function() {
                    var transaction = arguments[0][0];

                    for (var i = 0; i < connection.objectStoreNames.length; i++) {
                        linq2indexedDB.prototype.core.objectStore(transaction, connection.objectStoreNames[i]).then(function() {
                            var objectStore = arguments[0][1];
                            var indexes = [];
                            var objectStoreData = [];

                            for (var j = 0; j < objectStore.indexNames.length; j++) {
                                linq2indexedDB.prototype.core.index(objectStore, objectStore.indexNames[j], false).then(function() {
                                    var index = arguments[0][1];
                                    var indexData = [];

                                    linq2indexedDB.prototype.core.cursor(index).then(null, null, function() {
                                        var data = arguments[0][0];
                                        var key = arguments[0][1].primaryKey;
                                        indexData.push({ key: key, data: data });
                                    });

                                    indexes.push({
                                        name: index.name,
                                        keyPath: index.keyPath,
                                        multiEntry: index.multiEntry,
                                        data: indexData
                                    });
                                });
                            }

                            linq2indexedDB.prototype.core.cursor(objectStore).then(null, null, function() {
                                var data = arguments[0][0];
                                var key = arguments[0][1].primaryKey;
                                objectStoreData.push({ key: key, data: data });
                            });

                            dbView.ObjectStores.push({
                                name: objectStore.name,
                                keyPath: objectStore.keyPath,
                                autoIncrement: objectStore.autoIncrement,
                                indexes: indexes,
                                data: objectStoreData
                            });
                        });
                    }
                });
            }
        }, null, function(args) {
            if (args[1].type == "upgradeneeded") {
                args[0].abort();
            }
        });
    }

    function getVersionDefinition(version, definitions) {
        var result = null;
        for (var i = 0; i < definitions.length; i++) {
            if (parseInt(definitions[i].version) == parseInt(version)) {
                result = definitions[i];
            }
        }
        return result;
    }

    function initializeVersion(txn, definition) {
        try {
            if (definition.objectStores) {
                for (var i = 0; i < definition.objectStores.length; i++) {
                    var objectStoreDefinition = definition.objectStores[i];
                    if (objectStoreDefinition.remove) {
                        linq2indexedDB.prototype.core.deleteObjectStore(txn, objectStoreDefinition.name);
                    } else {
                        linq2indexedDB.prototype.core.createObjectStore(txn, objectStoreDefinition.name, objectStoreDefinition.objectStoreOptions);
                    }
                }
            }

            if (definition.indexes) {
                for (var j = 0; j < definition.indexes.length; j++) {
                    var indexDefinition = definition.indexes[j];
                    if (indexDefinition.remove) {
                        linq2indexedDB.prototype.core.deleteIndex(linq2indexedDB.prototype.core.objectStore(txn, indexDefinition.objectStoreName), indexDefinition.propertyName);
                    } else {
                        linq2indexedDB.prototype.core.createIndex(linq2indexedDB.prototype.core.objectStore(txn, indexDefinition.objectStoreName), indexDefinition.propertyName, indexDefinition.indexOptions);
                    }
                }
            }

            if (definition.defaultData) {
                for (var k = 0; k < definition.defaultData.length; k++) {
                    var defaultDataDefinition = definition.defaultData[k];
                    if (defaultDataDefinition.remove) {
                        linq2indexedDB.prototype.core.remove(linq2indexedDB.prototype.core.objectStore(txn, defaultDataDefinition.objectStoreName), defaultDataDefinition.key);
                    } else {
                        linq2indexedDB.prototype.core.insert(linq2indexedDB.prototype.core.objectStore(txn, defaultDataDefinition.objectStoreName), defaultDataDefinition.data, defaultDataDefinition.key);
                    }
                }
            }
        } catch(ex) {
            linq2indexedDB.prototype.utilities.log("initialize version exception: ", ex);
            linq2indexedDB.prototype.core.abortTransaction(txn);
        }
    }

    function upgradeDatabase(dbConfig, oldVersion, newVersion, txn) {
        if (dbConfig.onupgradeneeded) {
            dbConfig.onupgradeneeded(txn, oldVersion, newVersion);
        }
        if (dbConfig.oninitializeversion || dbConfig.schema || dbConfig.definition) {
            for (var version = oldVersion + 1; version <= newVersion; version++) {
                if (dbConfig.schema) {
                    dbConfig.schema[version](txn);
                }
                if (dbConfig.definition) {
                    var versionDefinition = getVersionDefinition(version, dbConfig.definition);
                    if (versionDefinition) {
                        initializeVersion(txn, versionDefinition);
                    }
                } else if (dbConfig.oninitializeversion) {
                    dbConfig.oninitializeversion(txn, version);
                }
            }
        }
    }

})();

// Namespace linq2indexedDB.prototype.linq
(function() {
    linq2indexedDB.prototype.linq = {
        addFilter: function(name, isValid, filterCallback) {
            if (typeof linq2indexedDB.prototype.linq.filters[name] !== 'undefined') {
                throw "linq2IndexedDB: A filter with the name '" + name + "' already exists.";
            }

            linq2indexedDB.prototype.linq.filters[name] = linq2indexedDB.prototype.linq.createFilter(name, isValid, filterCallback);
        },
        createFilter: function(name, isValid, filterCallback) {
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
                indexeddbFilter: false,
                sortOrder: 99,
                isValid: isValid,
                filter: filterCallback
            };
        },
        filters: {
            equals: {
                name: "equals",
                indexeddbFilter: true,
                sortOrder: 0,
                isValid: function(data, filter) {
                    return data[filter.propertyName] == filter.value;
                },
                filter: function(callback, queryBuilder, filterMetaData) {
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
                    return function(value) {
                        if (!value) {
                            throw "linq2indexedDB: value needs to be provided to the equal clause";
                        }
                        filterMetaData.value = value;

                        return callback(queryBuilder, filterMetaData);
                    };
                }
            },
            between: {
                name: "between",
                sortOrder: 1,
                indexeddbFilter: true,
                isValid: function(data, filter) {
                    return (data[filter.propertyName] > filter.minValue || (filter.minValueIncluded && data[filter.propertyName] == filter.minValue))
                        && (data[filter.propertyName] < filter.maxValue || (filter.maxValueIncluded && data[filter.propertyName] == filter.maxValue));
                },
                filter: function(callback, queryBuilder, filterMetaData) {
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
                    return function(minValue, maxValue, minValueIncluded, maxValueIncluded) {
                        var isMinValueIncluded = typeof(minValueIncluded) === undefined ? false : minValueIncluded;
                        var isMasValueIncluded = typeof(maxValueIncluded) === undefined ? false : maxValueIncluded;
                        if (!minValue) {
                            throw "linq2indexedDB: minValue needs to be provided to the between clause";
                        }
                        if (!maxValue) {
                            throw "linq2indexedDB: maxValue needs to be provided to the between clause";
                        }

                        filterMetaData.minValue = minValue;
                        filterMetaData.maxValue = maxValue;
                        filterMetaData.minValueIncluded = isMinValueIncluded;
                        filterMetaData.maxValueIncluded = isMasValueIncluded;

                        return callback(queryBuilder, filterMetaData);
                    };
                }
            },
            greaterThan: {
                name: "greaterThan",
                sortOrder: 2,
                indexeddbFilter: true,
                isValid: function(data, filter) {
                    return data[filter.propertyName] > filter.value || (filter.valueIncluded && data[filter.propertyName] == filter.value);
                },
                filter: function(callback, queryBuilder, filterMetaData) {
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
                    return function(value, valueIncluded) {
                        if (!value) {
                            throw "linq2indexedDB: value needs to be provided to the greatherThan clause";
                        }
                        var isValueIncluded = typeof(valueIncluded) === undefined ? false : valueIncluded;

                        filterMetaData.value = value;
                        filterMetaData.valueIncluded = isValueIncluded;

                        return callback(queryBuilder, filterMetaData);
                    };
                }
            },
            smallerThan: {
                name: "smallerThan",
                sortOrder: 2,
                indexeddbFilter: true,
                isValid: function(data, filter) {
                    return data[filter.propertyName] < filter.value || (filter.valueIncluded && data[filter.propertyName] == filter.value);
                },
                filter: function(callback, queryBuilder, filterMetaData) {
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
                    return function(value, valueIncluded) {
                        if (!value) {
                            throw "linq2indexedDB: value needs to be provided to the smallerThan clause";
                        }
                        var isValueIncluded = typeof(valueIncluded) === undefined ? false : valueIncluded;

                        filterMetaData.value = value;
                        filterMetaData.valueIncluded = isValueIncluded;

                        return callback(queryBuilder, filterMetaData);
                    };
                }
            },
            inArray: {
                name: "inArray",
                sortOrder: 3,
                indexeddbFilter: false,
                isValid: function(data, filter) {
                    return filter.value.indexOf(data[filter.propertyName]) >= 0;
                },
                filter: function(callback, queryBuilder, filterMetaData) {
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
                    return function(array) {
                        if (!array && typeof array !== "Array") {
                            throw "linq2indexedDB: array needs to be provided to the inArray clause";
                        }

                        filterMetaData.value = array;

                        return callback(queryBuilder, filterMetaData);
                    };
                }
            },
            like: {
                name: "like",
                sortOrder: 4,
                indexeddbFilter: false,
                isValid: function(data, filter) {
                    return data[filter.propertyName].indexOf(filter.value) >= 0;
                },
                filter: function(callback, queryBuilder, filterMetaData) {
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
                    return function(value) {
                        if (!value) {
                            throw "linq2indexedDB: value needs to be provided to the like clause";
                        }

                        filterMetaData.value = value;

                        return callback(queryBuilder, filterMetaData);
                    };
                }
            }
        }
    };
})();

// Namespace linq2indexedDB.prototype.utitlities
(function(isMetroApp) {
    "use strict";

    var utilities = {
        linq2indexedDBWorkerFileLocation: "../Scripts/Linq2indexedDB.js",
        linq2indexedDBWorker: function(data, filters, sortClauses) {
            return utilities.promiseWrapper(function(pw) {
                if (!!window.Worker) {
                    var worker = new Worker(utilities.linq2indexedDBWorkerFileLocation);
                    worker.onmessage = function(event) {
                        pw.complete(this, event.data);
                    };
                    worker.onerror = pw.error;

                    var filtersString = JSON.stringify(filters, linq2indexedDB.prototype.utilities.serialize);

                    worker.postMessage({ data: data, filters: filtersString, sortClauses: sortClauses });
                } else {
                    // Fallback when there are no webworkers present. Beware, this runs on the UI thread and can block the UI
                    pw.complete(this, utilities.filterSort(data, filters, sortClauses));
                }
            });
        },
        isArray: function(array) {
            if (array instanceof Array) {
                return true;
            } else {
                return false;
            }
        },
        JSONComparer: function(propertyName, descending) {
            return {
                sort: function(valueX, valueY) {
                    if (descending) {
                        return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? -1 : 1));
                    } else {
                        return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? 1 : -1));
                    }
                }
            };
        },
        promiseWrapper: function(promise) {
            if (isMetroApp) {
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
            } else if (typeof($) === "function" && $.Deferred) {
                return $.Deferred(function(dfd) {
                    promise({
                        complete: function(context, args) {
                            dfd.resolveWith(context, [args]);
                        },
                        error: function(context, args) {
                            dfd.rejectWith(context, [args]);
                        },
                        progress: function(context, args) {
                            dfd.notifyWith(context, [args]);
                        }
                    });
                }).promise();
            } else {
                throw "linq2indexedDB: No framework (WinJS or jQuery) that supports promises found. Please ensure jQuery or WinJS is referenced before the linq2indexedDB.js file.";
            }
        },
        log: function() {
            if ((window && typeof(window.console) === "undefined")) {
                return false;
            }
            return window.console.log.apply(console, arguments);
        },
        filterSort: function(data, filters, sortClauses) {
            var returnData = [];

            for (var i = 0; i < data.length; i++) {
                if (utilities.isDataValid(data[i], filters)) {
                    returnData = utilities.addToSortedArray(returnData, data[i], sortClauses);
                }
            }

            return returnData;
        },
        isDataValid: function(data, filters) {
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
        },
        addToSortedArray: function(array, data, sortClauses) {
            var newArray = [];
            if (array.length == 0 || sortClauses.length == 0) {
                newArray = array;
                newArray.push(data);
            } else {
                var valueAdded = false;
                for (var i = 0; i < array.length; i++) {
                    for (var j = 0; j < sortClauses.length; j++) {
                        var valueX = array[i];
                        var valueY = data;

                        if (valueX[sortClauses[j].propertyName] != valueY[sortClauses[j].propertyName]) {
                            if ((sortClauses[j].descending && valueX[sortClauses[j].propertyName] > valueY[sortClauses[j].propertyName])
                                || (!sortClauses[j].descending && valueX[sortClauses[j].propertyName] < valueY[sortClauses[j].propertyName])) {
                                newArray.push(valueX);
                            } else {
                                if (!valueAdded) {
                                    valueAdded = true;
                                    newArray.push(valueY);
                                }
                                newArray.push(valueX);
                            }
                        }
                    }
                }

                // Add at the end
                if (!valueAdded) {
                    newArray.push(data);
                }
            }
            return newArray;
        },
        serialize: function(key, value) {
            if (typeof value === 'function') {
                return value.toString();
            }
            return value;
        },
        deserialize: function(key, value) {
            if (value && typeof value === "string" && value.substr(0, 8) == "function") {
                var startBody = value.indexOf('{') + 1;
                var endBody = value.lastIndexOf('}');
                var startArgs = value.indexOf('(') + 1;
                var endArgs = value.indexOf(')');

                return new Function(value.substring(startArgs, endArgs), value.substring(startBody, endBody));
            }
            return value;
        }
    };

    linq2indexedDB.prototype.utilities = utilities;
})(typeof Windows !== "undefined");

if (typeof window !== "undefined") {
    // UI Thread 

    // Namespace linq2indexedDB.prototype.core
    (function(window, isMetroApp) {
        "use strict";

        // Region variables
        var defaultDatabaseName = "Default";
        //var log = function () {
        //    if (enableLogging === "undefined" || !enableLogging) {
        //        return false;
        //    }

        //    return linq2indexedDB.prototype.utilities.log
        //};
        var log = linq2indexedDB.prototype.utilities.log;
        var implementations = {
            NONE: 0,
            NATIVE: 1,
            MICROSOFT: 2,
            MOZILLA: 3,
            GOOGLE: 4,
            MICROSOFTPROTOTYPE: 5,
            SHIM: 6
        };
        var transactionTypes = {
            READ_ONLY: "readonly",
            READ_WRITE: "readwrite",
            VERSION_CHANGE: "versionchange"
        };
        var implementation = initializeIndexedDb();
        var handlers = {
            IDBRequest: function(request) {
                return deferredHandler(IDBRequestHandler, request);
            },
            IDBBlockedRequest: function(request) {
                return deferredHandler(IDBBlockedRequestHandler, request);
            },
            IDBOpenDBRequest: function(request) {
                return deferredHandler(IDBOpenDbRequestHandler, request);
            },
            IDBDatabase: function(database) {
                return deferredHandler(IDBDatabaseHandler, database);
            },
            IDBTransaction: function(txn) {
                return deferredHandler(IDBTransactionHandler, txn);
            },
            IDBCursorRequest: function(request) {
                return deferredHandler(IDBCursorRequestHandler, request);
            }
        };

        //Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
        //MIT License

        function eventTarget() {
            this._listeners = { };
        }

        eventTarget.prototype = {
            constructor: eventTarget,

            addListener: function(type, listener) {
                if (!linq2indexedDB.prototype.utilities.isArray(type)) {
                    type = [type];
                }

                for (var i = 0; i < type.length; i++) {
                    if (typeof this._listeners[type[i]] == "undefined") {
                        this._listeners[type[i]] = [];
                    }

                    this._listeners[type[i]].push(listener);
                }
            },

            fire: function(event) {
                if (typeof event == "string") {
                    event = { type: event };
                }
                if (!event.target) {
                    event.target = this;
                }

                if (!event.type) { //falsy
                    throw new Error("Event object missing 'type' property.");
                }

                if (this._listeners[event.type] instanceof Array) {
                    var listeners = this._listeners[event.type];
                    for (var i = 0, len = listeners.length; i < len; i++) {
                        listeners[i].call(this, event);
                    }
                }
            },

            removeListener: function(type, listener) {
                if (!linq2indexedDB.prototype.utilities.isArray(type)) {
                    type = [type];
                }

                for (var j = 0; j < type[j].length; j++) {
                    if (this._listeners[type[j]] instanceof Array) {
                        var listeners = this._listeners[type[j]];
                        for (var i = 0, len = listeners.length; i < len; i++) {
                            if (listeners[i] === listener) {
                                listeners.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }
        };
        // End copyright

        var dbEvents = {
            objectStoreCreated: "Object store created",
            objectStoreRemoved: "Object store removed",
            indexCreated: "Index created",
            indexRemoved: "Index removed",
            databaseRemoved: "Database removed",
            databaseBlocked: "Database blocked",
            databaseUpgrade: "Database upgrade",
            databaseOpened: "Database opened"
        };

        var dataEvents = {
            dataInserted: "Data inserted",
            dataUpdated: "Data updated",
            dataRemoved: "Data removed",
            objectStoreCleared: "Object store cleared"
        };

        var internal = {
            db: function(pw, name, version) {
                try {
                    // Initializing defaults
                    var req;
                    name = name ? name : defaultDatabaseName;

                    // Creating a new database conection
                    if (version) {
                        linq2indexedDB.prototype.utilities.log("db opening", name, version);
                        req = handlers.IDBOpenDBRequest(window.indexedDB.open(name, version));
                    } else {
                        log("db opening", name);
                        req = handlers.IDBOpenDBRequest(window.indexedDB.open(name));
                    }

                    // Handle the events of the creation of the database connection
                    req.then(
                        function(args /*db, e*/) {
                            var db = args[0];
                            var e = args[1];
                            // Database connection established

                            // Handle the events on the database.
                            handlers.IDBDatabase(db).then(
                                function(/*result, event*/) {
                                    // No done present.
                                },
                                function(/*error, event*/) {
                                    // Database error or abort
                                    linq2indexedDB.prototype.core.closeDatabaseConnection(db);
                                    // When an error occures the result will already be resolved. This way calling the reject won't case a thing
                                },
                                function(args1 /*result, event*/) {
                                    var event = args1[1];
                                    if (event) {
                                        // Sending a notify won't have any effect because the result is already resolved. There is nothing more to do than close the current connection.
                                        if (event.type === "versionchange") {
                                            if (event.version != db.version) {
                                                // If the version is changed and the current version is different from the requested version, the connection needs to get closed.
                                                linq2indexedDB.prototype.core.closeDatabaseConnection(db);
                                            }
                                        }
                                    }
                                });

                            var currentVersion = internal.getDatabaseVersion(db);
                            if (currentVersion < version || (version == -1)) {
                                // Current version deferres from the requested version, database upgrade needed
                                log("DB Promise upgradeneeded", this, db, e, db.connectionId);
                                internal.changeDatabaseStructure(db, version).then(
                                    function(args1 /*txn, event*/) {
                                        var txn = args1[0];
                                        var event = args1[1];

                                        // Fake the onupgrade event.
                                        var context = req;
                                        context.transaction = txn;

                                        var upgardeEvent = { };
                                        upgardeEvent.type = "upgradeneeded";
                                        upgardeEvent.newVersion = version;
                                        upgardeEvent.oldVersion = currentVersion;
                                        upgardeEvent.originalEvent = event;

                                        linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseUpgrade, data: upgardeEvent });
                                        pw.progress(context, [txn, upgardeEvent]);

                                        handlers.IDBTransaction(txn).then(function(/*trans, args*/) {
                                            // When the new version is completed, close the db connection, and make a new connection.
                                            linq2indexedDB.prototype.core.closeDatabaseConnection(txn.db);
                                            linq2indexedDB.prototype.core.db(name).then(function(args3 /*dbConnection, ev*/) {
                                                // Connection resolved
                                                pw.complete(this, args3);
                                            },
                                                function(args3 /*err, ev*/) {
                                                    // Database connection error or abort
                                                    pw.error(this, args3);
                                                },
                                                function(args3 /*dbConnection, ev*/) {
                                                    // Database upgrade or blocked
                                                    pw.progress(this, args3);
                                                });
                                        },
                                            function(args2 /*err, ev*/) {
                                                //txn error or abort
                                                pw.error(this, args2);
                                            });
                                    },
                                    function(args1 /*err, event*/) {
                                        // txn error or abort
                                        pw.error(this, args1);
                                    },
                                    function(args1 /*result, event*/) {
                                        // txn blocked
                                        linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseBlocked, data: args });
                                        pw.progress(this, args1);
                                    });
                            } else {
                                // Database Connection resolved.
                                linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseOpened, data: db });
                                log("DB Promise resolved", db, e);
                                pw.complete(this, [db, e]);
                            }
                        },
                        function(args /*error, e*/) {
                            // Database connection error or abort
                            log("DB Promise rejected", args[0], args[1]);
                            pw.error(this, args);
                        },
                        function(args /*result, e*/) {
                            // Database upgrade + db blocked
                            if (args[1].type == "blocked") {
                                linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseBlocked, data: args });
                            } else if (args[1].type == "upgradeneeded") {
                                linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseUpgrade, data: args });
                            }
                            pw.progress(this, args);
                        }
                    );
                } catch(ex) {
                    log("DB exception", this, ex.message, ex);
                    pw.error(this, [ex.message, ex]);
                }
            },
            transaction: function(pw, db, objectStoreNames, transactionType, autoGenerateAllowed) {
                log("Transaction promise started", db, objectStoreNames, transactionType);

                // Initialize defaults
                if (!linq2indexedDB.prototype.utilities.isArray(objectStoreNames)) objectStoreNames = [objectStoreNames];
                transactionType = transactionType || linq2indexedDB.prototype.core.transactionTypes.READ_ONLY;

                try {
                    var nonExistingObjectStores = [];

                    // Check for non-existing object stores
                    for (var i = 0; i < objectStoreNames.length; i++) {
                        if (!db.objectStoreNames || !db.objectStoreNames.contains(objectStoreNames[i])) {
                            nonExistingObjectStores.push(objectStoreNames[i]);
                        }
                    }

                    // When non-existing object stores are found and the autoGenerateAllowed is true.
                    // Then create these object stores
                    if (nonExistingObjectStores.length > 0 && autoGenerateAllowed) {
                        var version = internal.getDatabaseVersion(db) + 1;
                        var dbName = db.name;
                        log("Transaction database upgrade needed: ", db);
                        // Closing the current connections so it won't block the upgrade.
                        linq2indexedDB.prototype.core.closeDatabaseConnection(db);
                        // Open a new connection with the new version
                        linq2indexedDB.prototype.core.db(dbName, version).then(function(args /*dbConnection, event*/) {
                            // When the upgrade is completed, the transaction can be opened.
                            //linq2indexedDB.prototype.core.transaction(args[0], objectStoreNames, transactionType, autoGenerateAllowed).then(function (args1 /*txn, ev*/) {
                            //    // txn completed
                            //    pw.complete(this, args1);
                            //},
                            //function (args1 /*error, ev*/) {
                            //    // txn error or abort
                            //    pw.error(this, args1);
                            //},
                            //function (args1 /*txn*/) {
                            //    // txn created
                            //    pw.progress(this, args1);
                            //});

                            // Necessary for getting it work in WIN 8, WinJS promises have troubles with nesting promises
                            var txn = args[0].transaction(objectStoreNames, transactionType);

                            // Handle transaction events
                            handlers.IDBTransaction(txn).then(function(args1 /*result, event*/) {
                                // txn completed
                                pw.complete(this, args1);
                            },
                                function(args1 /*err, event*/) {
                                    // txn error or abort
                                    pw.error(this, args1);
                                });

                            // txn created
                            log("Transaction transaction created.", txn);
                            pw.progress(txn, [txn]);
                        },
                            function(args /*error, event*/) {
                                // When an error occures, bubble up.
                                pw.error(this, args);
                            },
                            function(args /*txn, event*/) {
                                var event = args[1];

                                // When an upgradeneeded event is thrown, create the non-existing object stores
                                if (event.type == "upgradeneeded") {
                                    for (var j = 0; j < nonExistingObjectStores.length; j++) {
                                        linq2indexedDB.prototype.core.createObjectStore(args[0], nonExistingObjectStores[j]);
                                    }
                                }
                            });
                    } else {
                        // If no non-existing object stores are found, create the transaction.
                        var transaction = db.transaction(objectStoreNames, transactionType);

                        // Handle transaction events
                        handlers.IDBTransaction(transaction).then(function(args /*result, event*/) {
                            // txn completed
                            pw.complete(this, args);
                        },
                            function(args /*err, event*/) {
                                // txn error or abort
                                pw.error(this, args);
                            });

                        // txn created
                        log("Transaction transaction created.", transaction);
                        pw.progress(transaction, [transaction]);
                    }
                } catch(ex) {
                    log("Transaction exception", ex, db);
                    ex.type = "exception";
                    pw.error(this, [ex.message, ex]);
                }
            },
            changeDatabaseStructure: function(db, version) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    log("changeDatabaseStructure started", db, version);
                    handlers.IDBBlockedRequest(db.setVersion(version)).then(function(args /*txn, event*/) {
                        // txn created
                        pw.complete(this, args);
                    },
                        function(args /*error, event*/) {
                            // txn error or abort
                            pw.error(this, args);
                        },
                        function(args /*txn, event*/) {
                            // txn blocked
                            pw.progress(this, args);
                        });
                });
            },
            objectStore: function(pw, transaction, objectStoreName) {
                log("objectStore started", transaction, objectStoreName);
                try {
                    var store = transaction.objectStore(objectStoreName);
                    log("objectStore completed", transaction, store);
                    pw.complete(store, [transaction, store]);
                } catch(ex) {
                    log("objectStore exception", ex, transaction);
                    linq2indexedDB.prototype.core.abortTransaction(transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            createObjectStore: function(pw, transaction, objectStoreName, objectStoreOptions) {
                log("createObjectStore started", transaction, objectStoreName, objectStoreOptions);
                try {
                    if (!transaction.db.objectStoreNames.contains(objectStoreName)) {
                        // If the object store doesn't exists, create it
                        var options = new Object();

                        if (objectStoreOptions) {
                            if (objectStoreOptions.keyPath) options.keyPath = objectStoreOptions.keyPath;
                            options.autoIncrement = objectStoreOptions.autoIncrement;
                        } else {
                            options.autoIncrement = true;
                        }

                        var store = transaction.db.createObjectStore(objectStoreName, options, options.autoIncrement);

                        log("ObjectStore Created", transaction, store);
                        linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.objectStoreCreated, data: store });
                        pw.complete(store, [transaction, store]);
                    } else {
                        // If the object store exists, retrieve it
                        linq2indexedDB.prototype.core.objectStore(transaction, objectStoreName).then(function(args /*trans, store*/) {
                            // store resolved
                            log("ObjectStore Found", args[1], objectStoreName);
                            log("createObjectStore Promise", args[0], args[1]);
                            pw.complete(store, args);
                        },
                            function(args /*error, event*/) {
                                // store error
                                pw.error(this, args);
                            });
                    }
                } catch(ex) {
                    // store exception
                    log("createObjectStore Exception", ex);
                    linq2indexedDB.prototype.core.abortTransaction(transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            deleteObjectStore: function(pw, transaction, objectStoreName) {
                log("deleteObjectStore Promise started", transaction, objectStoreName);
                try {
                    if (transaction.db.objectStoreNames.contains(objectStoreName)) {
                        // store found, delete it
                        transaction.db.deleteObjectStore(objectStoreName);
                        log("ObjectStore Deleted", objectStoreName);
                        log("deleteObjectStore completed", objectStoreName);
                        linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.objectStoreRemoved, data: objectStoreName });
                        pw.complete(this, [transaction, objectStoreName]);
                    } else {
                        // store not found, return error
                        log("ObjectStore Not Found", objectStoreName);
                        pw.error(this, ["ObjectStore Not Found" + objectStoreName]);
                    }
                } catch(ex) {
                    // store exception
                    log("deleteObjectStore exception", ex);
                    linq2indexedDB.prototype.core.abortTransaction(transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            index: function(pw, objectStore, propertyName, autoGenerateAllowed) {
                log("Index started", objectStore, propertyName, autoGenerateAllowed);
                try {
                    var indexName = propertyName;
                    if (propertyName.indexOf(linq2indexedDB.prototype.core.indexSuffix) == -1) {
                        indexName = indexName + linq2indexedDB.prototype.core.indexSuffix;
                    }

                    if (objectStore.indexNames.contains(indexName)) {
                        // If index exists, resolve it
                        var index = objectStore.index(indexName);
                        log("Index completed", objectStore.transaction, index, objectStore);
                        pw.complete(this, [objectStore.transaction, index, objectStore]);
                    } else if (autoGenerateAllowed) {
                        // If index doesn't exists, create it if autoGenerateAllowed
                        var version = internal.getDatabaseVersion(objectStore.transaction.db) + 1;
                        var dbName = objectStore.transaction.db.name;
                        var transactionType = objectStore.transaction.mode;
                        var objectStoreNames = [objectStore.name]; //transaction.objectStoreNames;
                        var objectStoreName = objectStore.name;
                        // Close the currenct database connections so it won't block
                        linq2indexedDB.prototype.core.closeDatabaseConnection(objectStore.transaction.db);

                        // Open a new connection with the new version
                        linq2indexedDB.prototype.core.db(dbName, version).then(function(args /*dbConnection, event*/) {
                            // When the upgrade is completed, the index can be resolved.
                            linq2indexedDB.prototype.core.transaction(args[0], objectStoreNames, transactionType, autoGenerateAllowed).then(function(/*transaction, ev*/) {
                                // txn completed
                                // TODO: what to do in this case
                            },
                                function(args1 /*error, ev*/) {
                                    // txn error or abort
                                    pw.error(this, args1);
                                },
                                function(args1 /*transaction*/) {
                                    // txn created
                                    linq2indexedDB.prototype.core.index(linq2indexedDB.prototype.core.objectStore(args1[0], objectStoreName), propertyName).then(function(args2 /*trans, index, store*/) {
                                        pw.complete(this, args2);
                                    }, function(args2 /*error, ev*/) {
                                        // txn error or abort
                                        pw.error(this, args2);
                                    });
                                });
                        },
                            function(args /*error, event*/) {
                                // When an error occures, bubble up.
                                pw.error(this, args);
                            },
                            function(args /*trans, event*/) {
                                var trans = args[0];
                                var event = args[1];

                                // When an upgradeneeded event is thrown, create the non-existing object stores
                                if (event.type == "upgradeneeded") {
                                    linq2indexedDB.prototype.core.createIndex(linq2indexedDB.prototype.core.objectStore(trans, objectStore.name), propertyName).then(function(/*index, store, transaction*/) {
                                        // index created
                                    },
                                        function(args1 /*error, ev*/) {
                                            // When an error occures, bubble up.
                                            pw.error(this, args1);
                                        });
                                }
                            });
                    }
                } catch(ex) {
                    // index exception
                    log("Exception index", ex);
                    linq2indexedDB.prototype.core.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            createIndex: function(pw, objectStore, propertyName, indexOptions) {
                log("createIndex started", objectStore, propertyName, indexOptions);
                try {
                    var indexName = propertyName;
                    if (propertyName.indexOf(linq2indexedDB.prototype.core.indexSuffix) == -1) {
                        indexName = indexName + linq2indexedDB.prototype.core.indexSuffix;
                    }

                    if (!objectStore.indexNames.contains(indexName)) {
                        var index = objectStore.createIndex(indexName, propertyName, { unique: indexOptions ? indexOptions.unique : false, /*multiRow: indexOptions ? indexOptions.multiEntry : false*/ });
                        log("createIndex completed", objectStore.transaction, index, objectStore);
                        linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.indexCreated, data: index });
                        pw.complete(this, [objectStore.transaction, index, objectStore]);
                    } else {
                        // if the index exists retrieve it
                        linq2indexedDB.prototype.core.index(objectStore, propertyName, false).then(function(args) {
                            pw.complete(this, args);
                        });
                    }
                } catch(ex) {
                    log("createIndex Failed", ex);
                    linq2indexedDB.prototype.core.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            deleteIndex: function(pw, objectStore, propertyName) {
                log("deleteIndex started", objectStore, propertyName);
                try {
                    var indexName = propertyName;
                    if (propertyName.indexOf(linq2indexedDB.prototype.core.indexSuffix) == -1) {
                        indexName = indexName + linq2indexedDB.prototype.core.indexSuffix;
                    }

                    objectStore.deleteIndex(indexName);
                    linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.indexRemoved, data: indexName });
                    log("deleteIndex completed", objectStore.transaction, propertyName, objectStore);
                    pw.complete(this, [objectStore.transaction, propertyName, objectStore]);
                } catch(ex) {
                    log("deleteIndex Failed", ex);
                    linq2indexedDB.prototype.core.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            cursor: function(pw, source, range, direction) {
                log("Cursor Promise Started", source);

                try {
                    var returnData = [];
                    var request;
                    var keyRange = range;

                    if (!keyRange) {
                        if (implementation != implementations.GOOGLE) {
                            keyRange = IDBKeyRange.lowerBound(0);
                        } else {
                            keyRange = IDBKeyRange.lowerBound(parseFloat(0));
                        }
                    }

                    // direction can not be null when passed.
                    if (direction) {
                        request = handlers.IDBCursorRequest(source.openCursor(keyRange, direction));
                    } else if (keyRange) {
                        request = handlers.IDBCursorRequest(source.openCursor(keyRange));
                    } else {
                        request = handlers.IDBCursorRequest(source.openCursor());
                    }

                    request.then(function(args1 /*result, e*/) {
                        var e = args1[1];
                        var transaction = source.transaction || source.objectStore.transaction;

                        log("Cursor completed", returnData, transaction, e);
                        pw.complete(this, [returnData, transaction, e]);
                    },
                        function(args /*error, e*/) {
                            log("Cursor error", args);
                            pw.error(this, args);
                        },
                        function(args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            log("Cursor progress", result, e);
                            if (result.value) {
                                pw.progress(this, [result.value, result, e]);
                                returnData.push(result.value);
                            }
                            result["continue"]();
                        });
                } catch(ex) {
                    var txn = source.transaction || source.objectStore.transaction;
                    // cursor exception
                    log("Exception cursor", ex);
                    linq2indexedDB.prototype.core.abortTransaction(txn);
                    pw.error(this, [ex.message, ex]);
                }
            },
            keyCursor: function(pw, index, range, direction) {
                log("keyCursor Started", index, range, direction);
                var returnData = [];

                try {
                    var request;
                    var keyRange = range;

                    if (!keyRange) {
                        keyRange = IDBKeyRange.lowerBound(0);
                    }

                    // direction can not be null when passed.
                    if (direction) {
                        request = handlers.IDBCursorRequest(source.openKeyCursor(keyRange, direction));
                    } else {
                        request = handlers.IDBCursorRequest(source.openKeyCursor(keyRange));
                    }

                    request.then(function(args /*result, e*/) {
                        var e = args[1];

                        log("keyCursor completed", returnData, index.objectStore.transaction, e);
                        pw.complete(this, [returnData, index.objectStore.transaction, e]);
                    },
                        function(args /*error, e*/) {
                            log("keyCursor error", args);
                            pw.error(this, args);
                        },
                        function(args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            log("keyCursor progress", result, e);
                            if (result.value) {
                                pw.progress(this, [result.value, e, index.objectStore.transaction]);
                                returnData.push(result.value);
                            }
                            result["continue"]();
                        });
                } catch(ex) {
                    // cursor exception
                    log("Exception keyCursor", ex);
                    linq2indexedDB.prototype.core.abortTransaction(index.objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            get: function(pw, source, key) {
                log("Get Started", source);

                try {
                    handlers.IDBRequest(source.get(key)).then(function(args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];
                        var transaction = source.transaction || source.objectStore.transaction;

                        log("Get completed", result, transaction, e);
                        pw.complete(this, [result, transaction, e]);
                    }, function(args /*error, e*/) {
                        log("Get error", args);
                        pw.error(this, args);
                    });
                } catch(ex) {
                    var txn = source.transaction || source.objectStore.transaction;
                    // get exception
                    log("Exception get", ex);
                    linq2indexedDB.prototype.core.abortTransaction(txn);
                    pw.error(this, [ex.message, ex]);
                }
            },
            getKey: function(pw, index, key) {
                log("GetKey Started", index, key);

                try {
                    handlers.IDBRequest(index.getKey(key)).then(function(args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        log("GetKey completed", result, index.objectStore.transaction, e);
                        pw.complete(this, [result, index.objectStore.transaction, e]);
                    }, function(args /*error, e*/) {
                        log("GetKey error", args);
                        pw.error(this, args);
                    });
                } catch(ex) {
                    // getKey exception
                    log("Exception getKey", ex);
                    linq2indexedDB.prototype.core.abortTransaction(index.objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            insert: function(pw, objectStore, data, key) {
                log("Insert Started", objectStore, data, key);
                try {
                    var req;

                    if (key /*&& !store.keyPath*/) {
                        req = handlers.IDBRequest(objectStore.add(data, key));
                    } else {
                        /*if (key) log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                        req = handlers.IDBRequest(objectStore.add(data));
                    }

                    req.then(function(args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        // Add key to the object if a keypath exists
                        if (objectStore.keyPath) {
                            data[objectStore.keyPath] = result;
                        }

                        linq2indexedDB.prototype.core.dbDataChanged.fire({ type: dataEvents.dataInserted, data: data, objectStore: objectStore });
                        log("Insert completed", data, result, objectStore.transaction, e);
                        pw.complete(this, [data, result, objectStore.transaction, e]);
                    }, function(args /*error, e*/) {
                        log("Insert error", args);
                        pw.error(this, args);
                    });
                } catch(ex) {
                    log("Insert exception", ex);
                    linq2indexedDB.prototype.core.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            update: function(pw, objectStore, data, key) {
                log("Update Started", objectStore, data, key);

                try {
                    var req;
                    if (key /*&& !store.keyPath*/) {
                        req = handlers.IDBRequest(objectStore.put(data, key));
                    } else {
                        /*if (key) log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                        req = handlers.IDBRequest(objectStore.put(data));
                    }
                    req.then(function(args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        linq2indexedDB.prototype.core.dbDataChanged.fire({ type: dataEvents.dataUpdated, data: data, objectStore: objectStore });
                        log("Update completed", data, result, objectStore.transaction, e);
                        pw.complete(this, [data, result, objectStore.transaction, e]);
                    }, function(args /*error, e*/) {
                        log("Update error", args);
                        pw.error(this, args);
                    });
                } catch(ex) {
                    log("Update exception", ex);
                    linq2indexedDB.prototype.core.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            remove: function(pw, objectStore, key) {
                log("Remove Started", objectStore, key);

                try {
                    handlers.IDBRequest(objectStore["delete"](key)).then(function(args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        linq2indexedDB.prototype.core.dbDataChanged.fire({ type: dataEvents.dataRemoved, data: key, objectStore: objectStore });
                        log("Remove completed", result, objectStore.transaction, e);
                        pw.complete(this, [result, objectStore.transaction, e]);
                    },
                        function(args /*error, e*/) {
                            log("Remove error", args);
                            pw.error(this, args);
                        });
                } catch(ex) {
                    log("Remove exception", ex);
                    linq2indexedDB.prototype.core.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            clear: function(pw, objectStore) {
                log("Clear Started", objectStore);
                try {
                    handlers.IDBRequest(objectStore.clear()).then(function(args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        linq2indexedDB.prototype.core.dbDataChanged.fire({ type: dataEvents.objectStoreCleared, objectStore: objectStore });
                        log("Clear completed", result, objectStore.transaction, e);
                        pw.complete(this, [result, objectStore.transaction, e]);
                    },
                        function(args /*error, e*/) {
                            log("Clear error", args);
                            pw.error(this, args);
                        });
                } catch(ex) {
                    log("Clear exception", ex);
                    linq2indexedDB.prototype.core.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            deleteDb: function(pw, name) {
                try {
                    if (typeof(window.indexedDB.deleteDatabase) != "undefined") {

                        handlers.IDBBlockedRequest(window.indexedDB.deleteDatabase(name)).then(function(args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseRemoved });
                            log("Delete Database Promise completed", result, e, name);
                            pw.complete(this, [result, e, name]);
                        }, function(args /*error, e*/) {
                            var error = args[0];
                            var e = args[1];

                            // added for FF, If a db gets deleted that doesn't exist an errorCode 6 ('NOT_ALLOWED_ERR') is given
                            if (e.currentTarget && e.currentTarget.errorCode == 6) {
                                linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseRemoved });
                                pw.complete(this, [error, e, name]);
                            } else if (implementation == implementations.SHIM
                                && e.message == "Database does not exist") {
                                linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseRemoved });
                                pw.complete(this, [error, e, name]);
                            } else {
                                log("Delete Database Promise error", error, e);
                                pw.error(this, [error, e]);
                            }
                        }, function(args /*result, e*/) {
                            if (args[0] == "blocked") {
                                linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseBlocked });
                            }
                            log("Delete Database Promise blocked", args /*result*/);
                            pw.progress(this, args /*[result, e]*/);
                        });
                    } else {
                        log("Delete Database function not found", name);
                        // Workaround for older versions of chrome and FireFox
                        // Doesn't delete the database, but clears him
                        linq2indexedDB.prototype.core.db(name, -1).then(function(args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            linq2indexedDB.prototype.core.dbStructureChanged.fire({ type: dbEvents.databaseRemoved });
                            pw.complete(this, [result, e, name]);
                        },
                            function(args /*error, e*/) {
                                log("Clear Promise error", args /*error, e*/);
                                pw.error(this, args /*[error, e]*/);
                            },
                            function(args /*dbConnection, event*/) {
                                var dbConnection = args[0];
                                var event = args[1];

                                // When an upgradeneeded event is thrown, create the non-existing object stores
                                if (event.type == "upgradeneeded") {
                                    for (var i = 0; i < dbConnection.objectStoreNames.length; i++) {
                                        linq2indexedDB.prototype.core.deleteObjectStore(dbConnection.txn, dbConnection.objectStoreNames[i]);
                                    }
                                    linq2indexedDB.prototype.core.closeDatabaseConnection(dbConnection);
                                }
                            });
                    }
                } catch(ex) {
                    log("Delete Database Promise exception", ex);
                    pw.error(this, [ex.message, ex]);
                }
            },
            getDatabaseVersion: function(db) {
                var dbVersion = parseInt(db.version);
                if (isNaN(dbVersion) || dbVersion < 0) {
                    return 0;
                } else {
                    return dbVersion;
                }
            },
            indexOf: function(array, value, propertyName) {
                for (var i = 0; i < array.length; i++) {
                    if (array[i][propertyName] == value[propertyName]) {
                        return i;
                    }
                }
                return -1;
            }
        };

        linq2indexedDB.prototype.core = {
            db: function(name, version) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    internal.db(pw, name, version);
                });
            },
            transaction: function(db, objectStoreNames, transactionType, autoGenerateAllowed) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (db.then) {
                        db.then(function(args /*db, e*/) {
                            // Timeout necessary for letting it work on win8. If not, progress event triggers before listeners are coupled
                            if (isMetroApp) {
                                setTimeout(function() {
                                    internal.transaction(pw, args[0], objectStoreNames, transactionType, autoGenerateAllowed);
                                }, 1);
                            } else {
                                internal.transaction(pw, args[0], objectStoreNames, transactionType, autoGenerateAllowed);
                            }
                        },
                            function(args /*error, e*/) {
                                pw.error(this, args);
                            },
                            function(args /**/) {
                                pw.progress(this, args);
                            });
                    } else {
                        // Timeout necessary for letting it work on win8. If not, progress event triggers before listeners are coupled
                        setTimeout(function() {
                            internal.transaction(pw, db, objectStoreNames, transactionType, autoGenerateAllowed);
                        }, 1);
                    }
                });
            },
            objectStore: function(transaction, objectStoreName) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (transaction.then) {
                        transaction.then(function(/*txn, e*/) {
                            // transaction completed
                            // TODO: what todo in this case?
                        }, function(args /*error, e*/) {
                            pw.error(this, args);
                        }, function(args /*txn, e*/) {
                            internal.objectStore(pw, args[0], objectStoreName);
                        });
                    } else {
                        internal.objectStore(pw, transaction, objectStoreName);
                    }
                });
            },
            createObjectStore: function(transaction, objectStoreName, objectStoreOptions) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (transaction.then) {
                        transaction.then(function(/*txn, e*/) {
                            // txn completed
                            // TODO: what todo in this case?
                        },
                            function(args /*error, e*/) {
                                // txn error or abort
                                pw.error(this, args);
                            },
                            function(args /*txn, e*/) {
                                internal.createObjectStore(pw, args[0], objectStoreName, objectStoreOptions);
                            });
                    } else {
                        internal.createObjectStore(pw, transaction, objectStoreName, objectStoreOptions);
                    }
                });
            },
            deleteObjectStore: function(transaction, objectStoreName) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (transaction.then) {
                        transaction.then(function(/*txn, e*/) {
                            // txn completed
                            // TODO: what todo in this case?
                        }, function(args /*error, e*/) {
                            // txn error
                            pw.error(this, args);
                        },
                            function(args /*txn, e*/) {
                                internal.deleteObjectStore(pw, args[0], objectStoreName);
                            });
                    } else {
                        internal.deleteObjectStore(pw, transaction, objectStoreName);
                    }
                });
            },
            index: function(objectStore, propertyName, autoGenerateAllowed) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (objectStore.then) {
                        objectStore.then(function(args /*txn, objectStore*/) {
                            internal.index(pw, args[1], propertyName, autoGenerateAllowed);
                        }, function(args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        internal.index(pw, objectStore, propertyName, autoGenerateAllowed);
                    }
                });
            },
            createIndex: function(objectStore, propertyName, indexOptions) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (objectStore.then) {
                        objectStore.then(function(args/*txn, objectStore*/) {
                            internal.createIndex(pw, args[1], propertyName, indexOptions);
                        }, function(args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        internal.createIndex(pw, objectStore, propertyName, indexOptions);
                    }
                });
            },
            deleteIndex: function(objectStore, propertyName) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (objectStore.then) {
                        objectStore.then(function(args/*txn, objectStore*/) {
                            internal.deleteIndex(pw, args[1], propertyName);
                        }, function(args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        internal.deleteIndex(pw, objectStore, propertyName);
                    }
                });
            },
            cursor: function(source, range, direction) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (source.then) {
                        source.then(function(args /*txn, source*/) {
                            internal.cursor(pw, args[1], range, direction);
                        }, function(args /*error, e*/) {
                            // store or index error
                            pw.error(this, args);
                        });
                    } else {
                        internal.cursor(pw, source, range, direction);
                    }
                });
            },
            keyCursor: function(index, range, direction) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (index.then) {
                        index.then(function(args /*txn, index, store*/) {
                            internal.keyCursor(pw, args[1], range, direction);
                        }, function(args /*error, e*/) {
                            // index error
                            pw.error(this, args);
                        });
                    } else {
                        internal.keyCursor(pw, index, range, direction);
                    }
                });
            },
            get: function(source, key) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (source.then) {
                        source.then(function(args /*txn, source*/) {
                            internal.get(pw, args[1], key);
                        }, function(args /*error, e*/) {
                            // store or index error
                            pw.error(this, args);
                        });
                    } else {
                        internal.get(pw, source, key);
                    }
                });
            },
            getKey: function(index, key) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (index.then) {
                        index.then(function(args /*txn, index, objectStore*/) {
                            internal.getKey(pw, args[1], key);
                        }, function(args /*error, e*/) {
                            // index error
                            pw.error(this, args);
                        });
                    } else {
                        internal.getKey(pw, index, key);
                    }
                });
            },
            insert: function(objectStore, data, key) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (objectStore.then) {
                        objectStore.then(function(args /*txn, store*/) {
                            internal.insert(pw, args[1], data, key);
                        }, function(args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        internal.insert(pw, objectStore, data, key);
                    }
                });
            },
            update: function(objectStore, data, key) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (objectStore.then) {
                        objectStore.then(function(args /*txn, store*/) {
                            internal.update(pw, args[1], data, key);
                        }, function(args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        internal.update(pw, objectStore, data, key);
                    }
                });
            },
            remove: function(objectStore, key) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (objectStore.then) {
                        objectStore.then(function(args /*txn, store*/) {
                            internal.remove(pw, args[1], key);
                        }, function(args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        internal.remove(pw, objectStore, key);
                    }
                });
            },
            clear: function(objectStore) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    if (objectStore.then) {
                        objectStore.then(function(args /*txn, store*/) {
                            internal.clear(pw, args[1]);
                        }, function(args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        internal.clear(pw, objectStore);
                    }
                });
            },
            deleteDb: function(name) {
                return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                    internal.deleteDb(pw, name);
                });
            },
            closeDatabaseConnection: function(db) {
                linq2indexedDB.prototype.utilities.log("Close database Connection: ", db);
                db.close();
            },
            abortTransaction: function(transaction) {
                linq2indexedDB.prototype.utilities.log("Abort transaction: " + transaction);
                // Calling the abort, blocks the database in IE10
                if (implementation != implementations.MICROSOFT) {
                    transaction.abort();
                    linq2indexedDB.prototype.core.closeDatabaseConnection(transaction.db);
                }
            },
            transactionTypes: transactionTypes,
            dbStructureChanged: new eventTarget(),
            dbDataChanged: new eventTarget(),
            databaseEvents: dbEvents,
            dataEvents: dataEvents
        };
        
        if (implementation == implementations.SHIM) {
            linq2indexedDB.prototype.core.indexSuffix = "IIndex";
        } else {

            linq2indexedDB.prototype.core.indexSuffix = "-Index";
        }

        // Region Functions

        function initializeIndexedDb() {
            if (window === 'undefined') {
                return implementations.NONE;
            }

            if (window.indexedDB) {
                log("Native implementation", window.indexedDB);
                return implementations.NATIVE;
            } else {
                // Initialising the window.indexedDB Object for FireFox
                if (window.mozIndexedDB) {
                    window.indexedDB = window.mozIndexedDB;

                    if (typeof window.IDBTransaction.READ_ONLY === "number"
                        && typeof window.IDBTransaction.READ_WRITE === "number"
                        && typeof window.IDBTransaction.VERSION_CHANGE === "number") {
                        transactionTypes.READ_ONLY = window.IDBTransaction.READ_ONLY;
                        transactionTypes.READ_WRITE = window.IDBTransaction.READ_WRITE;
                        transactionTypes.VERSION_CHANGE = window.IDBTransaction.VERSION_CHANGE;
                    }

                    log("FireFox Initialized", window.indexedDB);
                    return implementations.MOZILLA;
                }

                    // Initialising the window.indexedDB Object for Chrome
                else if (window.webkitIndexedDB) {
                    if (!window.indexedDB) window.indexedDB = window.webkitIndexedDB;
                    if (!window.IDBCursor) window.IDBCursor = window.webkitIDBCursor;
                    if (!window.IDBDatabase) window.IDBDatabase = window.webkitIDBDatabase; //if (!window.IDBDatabaseError) window.IDBDatabaseError = window.webkitIDBDatabaseError
                    if (!window.IDBDatabaseException) window.IDBDatabaseException = window.webkitIDBDatabaseException;
                    if (!window.IDBFactory) window.IDBFactory = window.webkitIDBFactory;
                    if (!window.IDBIndex) window.IDBIndex = window.webkitIDBIndex;
                    if (!window.IDBKeyRange) window.IDBKeyRange = window.webkitIDBKeyRange;
                    if (!window.IDBObjectStore) window.IDBObjectStore = window.webkitIDBObjectStore;
                    if (!window.IDBRequest) window.IDBRequest = window.webkitIDBRequest;
                    if (!window.IDBTransaction) window.IDBTransaction = window.webkitIDBTransaction;
                    if (typeof window.IDBTransaction.READ_ONLY === "number"
                        && typeof window.IDBTransaction.READ_WRITE === "number"
                        && typeof window.IDBTransaction.VERSION_CHANGE === "number") {
                        transactionTypes.READ_ONLY = window.IDBTransaction.READ_ONLY;
                        transactionTypes.READ_WRITE = window.IDBTransaction.READ_WRITE;
                        transactionTypes.VERSION_CHANGE = window.IDBTransaction.VERSION_CHANGE;
                    }

                    log("Chrome Initialized", window.indexedDB);
                    return implementations.GOOGLE;
                }

                    // Initialiseing the window.indexedDB Object for IE 10 preview 3+
                else if (window.msIndexedDB) {
                    window.indexedDB = window.msIndexedDB;

                    transactionTypes.READ_ONLY = 0;
                    transactionTypes.READ_WRITE = 1;
                    transactionTypes.VERSION_CHANGE = 2;

                    log("IE10+ Initialized", window.indexedDB);
                    return implementations.MICROSOFT;
                }

                    // Initialising the window.indexedDB Object for IE 8 & 9
                else if (navigator.appName == 'Microsoft Internet Explorer') {
                    try {
                        window.indexedDB = new ActiveXObject("SQLCE.Factory.4.0");
                        window.indexedDBSync = new ActiveXObject("SQLCE.FactorySync.4.0");
                    } catch(ex) {
                        log("Initializing IE prototype exception", ex);
                    }

                    if (window.JSON) {
                        window.indexedDB.json = window.JSON;
                        window.indexedDBSync.json = window.JSON;
                    } else {
                        var jsonObject = {
                            parse: function(txt) {
                                if (txt === "[]") return [];
                                if (txt === "{}") return { };
                                throw { message: "Unrecognized JSON to parse: " + txt };
                            }
                        };
                        window.indexedDB.json = jsonObject;
                        window.indexedDBSync.json = jsonObject;
                    }

                    // Add some interface-level constants and methods.
                    window.IDBDatabaseException = {
                        UNKNOWN_ERR: 0,
                        NON_TRANSIENT_ERR: 1,
                        NOT_FOUND_ERR: 2,
                        CONSTRAINT_ERR: 3,
                        DATA_ERR: 4,
                        NOT_ALLOWED_ERR: 5,
                        SERIAL_ERR: 11,
                        RECOVERABLE_ERR: 21,
                        TRANSIENT_ERR: 31,
                        TIMEOUT_ERR: 32,
                        DEADLOCK_ERR: 33
                    };

                    window.IDBKeyRange = {
                        SINGLE: 0,
                        LEFT_OPEN: 1,
                        RIGHT_OPEN: 2,
                        LEFT_BOUND: 4,
                        RIGHT_BOUND: 8
                    };

                    window.IDBRequest = {
                        INITIAL: 0,
                        LOADING: 1,
                        DONE: 2
                    };

                    window.IDBTransaction = {
                        READ_ONLY: 0,
                        READ_WRITE: 1,
                        VERSION_CHANGE: 2
                    };

                    transactionTypes.READ_ONLY = 0;
                    transactionTypes.READ_WRITE = 1;
                    transactionTypes.VERSION_CHANGE = 2;

                    window.IDBKeyRange.only = function(value) {
                        return window.indexedDB.range.only(value);
                    };

                    window.IDBKeyRange.leftBound = function(bound, open) {
                        return window.indexedDB.range.lowerBound(bound, open);
                    };

                    window.IDBKeyRange.rightBound = function(bound, open) {
                        return window.indexedDB.range.upperBound(bound, open);
                    };

                    window.IDBKeyRange.bound = function(left, right, openLeft, openRight) {
                        return window.indexedDB.range.bound(left, right, openLeft, openRight);
                    };

                    window.IDBKeyRange.lowerBound = function(left, openLeft) {
                        return window.IDBKeyRange.leftBound(left, openLeft);
                    };

                    return implementations.MICROSOFTPROTOTYPE;
                } else if (window.shimIndexedDB) {
                    window.indexedDB = window.shimIndexedDB;

                    return implementations.SHIM;
                } else {
                    log("Your browser doesn't support indexedDB.");
                    return implementations.NONE;
                }
            }
        };

        function deferredHandler(handler, request) {
            return linq2indexedDB.prototype.utilities.promiseWrapper(function(pw) {
                try {
                    handler(pw, request);
                } catch(e) {
                    e.type = "exception";
                    pw.error(request, [e.message, e]);
                }
            });
        };

        function IDBSuccessHandler(pw, request) {
            request.onsuccess = function(e) {
                pw.complete(request, [request.result, e]);
            };
        };

        function IDBErrorHandler(pw, request) {
            request.onerror = function(e) {
                pw.error(request, [request.errorCode, e]);
            };
        };

        function IDBAbortHandler(pw, request) {
            request.onabort = function(e) {
                pw.error(request, [request.errorCode, e]);
            };
        };

        function IDBVersionChangeHandler(pw, request) {
            request.onversionchange = function(e) {
                pw.progress(request, [request.result, e]);
            };
        };

        function IDBCompleteHandler(pw, request) {
            request.oncomplete = function(e) {
                pw.complete(request, [request, e]);
            };
        };

        function IDBRequestHandler(pw, request) {
            IDBSuccessHandler(pw, request);
            IDBErrorHandler(pw, request);
        };

        function IDBCursorRequestHandler(pw, request) {
            request.onsuccess = function(e) {
                if (!request.result) {
                    pw.complete(request, [request.result, e]);
                } else {
                    pw.progress(request, [request.result, e]);
                }
            };
            IDBErrorHandler(pw, request);
        };

        function IDBBlockedRequestHandler(pw, request) {
            IDBRequestHandler(pw, request);
            request.onblocked = function (e) {
                pw.progress(request, ["blocked", e]);
            };
        };

        function IDBOpenDbRequestHandler(pw, request) {
            IDBBlockedRequestHandler(pw, request);
            request.onupgradeneeded = function(e) {
                pw.progress(request, [request.transaction, e]);
            };
        };

        function IDBDatabaseHandler(pw, database) {
            IDBAbortHandler(pw, database);
            IDBErrorHandler(pw, database);
            IDBVersionChangeHandler(pw, database);
        };

        function IDBTransactionHandler(pw, txn) {
            IDBCompleteHandler(pw, txn);
            IDBAbortHandler(pw, txn);
            IDBErrorHandler(pw, txn);
        };

    })(window, typeof Windows !== "undefined");
    window.linq2indexedDB = linq2indexedDB;
    if (typeof window.jQuery !== "undefined") {
        $.linq2indexedDB = linq2indexedDB;
    }
} else {
    // Web Worker Thread
    onmessage = function(event) {
        var data = event.data.data;
        var filtersString = event.data.filters || "[]";
        var sortClauses = event.data.sortClauses || [];
        var filters = JSON.parse(filtersString, linq2indexedDB.prototype.utilities.deserialize);
        var returnData = linq2indexedDB.prototype.utilities.filterSort(data, filters, sortClauses);

        postMessage(returnData);
        return;
    };
}

// Extend array for Opera
Array.prototype.contains = function(obj) {
    return this.indexOf(obj) > -1;
};