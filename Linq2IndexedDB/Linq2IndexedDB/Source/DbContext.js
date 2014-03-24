/// <reference path="_references.js" />

// Initializes the linq2indexeddb object.
// ReSharper disable InconsistentNaming
(function (linq2indexedDB) {
// ReSharper restore InconsistentNaming
    "use strict";

    function dbContext(name, configuration, enableDebugging) {
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
                for (var key in configuration.schema) {
                    if (!isNaN(key)) {
                        appVersion = dbConfig.version > key ? dbConfig.version : key;
                    }
                }
                if (appVersion > -1) {
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

        //return returnObject;
        Object.defineProperty(this, "dbConfig", { value: dbConfig, writable: false });
        linq2indexedDB.logging.debug(enableDebugging);
        this.initialize();
        this.viewer = viewer(dbConfig);
    }

    dbContext.prototype = function () {
        var queryBuilderObj = function (objectStoreName, dbConfig) {
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
            this.limit;
            this.dbConfig = dbConfig;
        };

        queryBuilderObj.prototype = {
            executeQuery: function () {
                executeQuery(this);
            }
        };

        function from(objectStoreName) {
            var self = this;
            return {
                where: function (filter) {
                    /// <summary>Filters the selected data.</summary>
                    /// <param name="filter">
                    /// The filter argument can be a string (In this case the string represents the property name you want to filter on) or a function.
                    /// (In this case the function will be used to filter the data. This callback function is called with 1 parameter: data
                    /// ,this argument holds the data that has to be validated. The return type of the function must be a boolean.)
                    ///</param>
                    return where(new queryBuilderObj(objectStoreName, self.dbConfig), filter, true, false);
                },
                orderBy: function (propertyName) {
                    /// <summary>Sorts the selected data ascending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(new queryBuilderObj(objectStoreName, self.dbConfig), propertyName, false);
                },
                orderByDesc: function (propertyName) {
                    /// <summary>Sorts the selected data descending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(new queryBuilderObj(objectStoreName, self.dbConfig), propertyName, true);
                },
                select: function (propertyNames, limit) {
                    /// <summary>Selects the data.</summary>
                    /// <param name="propertyNames" type="Array">
                    /// A list of the names of the properties you want to select. 
                    /// Passing undifined or an empty array returns all properties
                    /// </param>
                    /// <param name="limit" type="int">limits the number of results returned</param>
                    /// <returns type="Array">A list with the selected objects.</returns>
                    return select(new queryBuilderObj(objectStoreName, self.dbConfig), propertyNames, limit);
                },
                insert: function (data, key) {
                    /// <summary>inserts data.</summary>
                    /// <param name="data" type="Object">The object you want to insert.</param>
                    /// <param name="key" type="Object">
                    ///     [Optional] The key of the data you want to insert.
                    /// </param>
                    /// <returns type="Object">The object that was inserted.</returns>
                    return insert(new queryBuilderObj(objectStoreName, self.dbConfig), data, key);
                },
                update: function (data, key) {
                    /// <summary>updates data.</summary>
                    /// <param name="data" type="Object">The object you want to update.</param>
                    /// <param name="key" type="Object">
                    ///     [Optional] The key of the data you want to update.
                    /// </param>
                    /// <returns type="Object">The object that was updated.</returns>
                    return update(new queryBuilderObj(objectStoreName, self.dbConfig), data, key);
                },
                merge: function (data, key) {
                    /// <summary>merges data.</summary>
                    /// <param name="data" type="Object">The data you want to merge.</param>
                    /// <param name="key" type="Object">
                    ///     The key of the data you want to update.
                    /// </param>
                    /// <returns type="Object">The object that was updated.</returns>
                    return merge(new queryBuilderObj(objectStoreName, self.dbConfig), data, key);
                },
                remove: function (key) {
                    /// <summary>Removes data from the objectstore by his key.</summary>
                    /// <param name="key" type="Object">The key of the object you want to remove.</param>
                    return remove(new queryBuilderObj(objectStoreName, self.dbConfig), key);
                },
                clear: function () {
                    /// <summary>Removes all data from the objectstore.</summary>
                    return clear(new queryBuilderObj(objectStoreName, self.dbConfig));
                },
                get: function (key) {
                    /// <summary>Gets an object by his key.</summary>
                    /// <param name="key" type="Object">The key of the object you want to retrieve.</param>
                    /// <returns type="Object">The object that has the provided key.</returns>
                    return get(new queryBuilderObj(objectStoreName, self.dbConfig), key);
                },
                //databind: function (provider, bindingList) {
                //    return databind(new queryBuilderObj(objectStoreName, self.dbConfig), provider, bindingList);
                //}
            };
        }

        function where(queryBuilder, filter, isAndClause, isOrClause, isNotClause) {
            var whereClauses = {};
            var filterMetaData;

            if (isNotClause === "undefined") {
                whereClauses.not = function () {
                    return where(queryBuilder, filter, isAndClause, isOrClause, true);
                };
            }

            if (typeof filter === "function") {
                filterMetaData = {
                    propertyName: filter,
                    isOrClause: isOrClause,
                    isAndClause: isAndClause,
                    isNotClause: (isNotClause === "undefined" ? false : isNotClause),
                    filter: linq2indexedDB.linq.createFilter("anonymous" + queryBuilder.where.length, filter, null)
                };
                return whereClause(queryBuilder, filterMetaData);
            } else if (typeof filter === "string") {
                // Builds up the where filter methodes
                for (var filterName in linq2indexedDB.linq.filters) {
                    filterMetaData = {
                        propertyName: filter,
                        isOrClause: isOrClause,
                        isAndClause: isAndClause,
                        isNotClause: (typeof isNotClause === "undefined" ? false : isNotClause),
                        filter: linq2indexedDB.linq.filters[filterName]
                    };
                    if (typeof linq2indexedDB.linq.filters[filterName].filter !== "function") {
                        throw "Linq2IndexedDB: a filter methods needs to be provided for the filter '" + filterName + "'";
                    }
                    if (typeof linq2indexedDB.linq.filters[filterName].name === "undefined") {
                        throw "Linq2IndexedDB: a filter name needs to be provided for the filter '" + filterName + "'";
                    }

                    whereClauses[linq2indexedDB.linq.filters[filterName].name] = linq2indexedDB.linq.filters[filterName].filter(whereClause, queryBuilder, filterMetaData);
                }
            }
            return whereClauses;
        }

        function whereClause(queryBuilder, filterMetaData) {
            queryBuilder.where.push(filterMetaData);
            return {
                and: function (filter) {
                    /// <summary>Adds an extra filter.</summary>
                    /// <param name="filter">
                    /// The filter argument can be a string (In this case the string represents the property name you want to filter on) or a function.
                    /// (In this case the function will be used to filter the data. This callback function is called with 1 parameter: data
                    /// ,this argument holds the data that has to be validated. The return type of the function must be a boolean.)
                    ///</param>
                    return where(queryBuilder, filter, true, false);
                },
                or: function (filter) {
                    /// <summary>Adds an extra filter.</summary>
                    /// <param name="filter">
                    /// The filter argument can be a string (In this case the string represents the property name you want to filter on) or a function.
                    /// (In this case the function will be used to filter the data. This callback function is called with 1 parameter: data
                    /// ,this argument holds the data that has to be validated. The return type of the function must be a boolean.)
                    ///</param>
                    return where(queryBuilder, filter, false, true);
                },
                orderBy: function (propertyName) {
                    /// <summary>Sorts the selected data ascending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, false);
                },
                orderByDesc: function (propertyName) {
                    /// <summary>Sorts the selected data descending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, true);
                },
                select: function (propertyNames, limit) {
                    /// <summary>Selects the data.</summary>
                    /// <param name="propertyNames" type="Array">
                    /// A list of the names of the properties you want to select. 
                    /// Passing undifined or an empty array returns all properties
                    /// </param>
                    /// <param name="limit" type="int">limits the number of results returned</param>
                    /// <returns type="Array">A list with the selected objects.</returns>
                    return select(queryBuilder, propertyNames, limit);
                },
                remove: function () {
                    return remove(queryBuilder);
                },
                merge: function (data) {
                    return merge(queryBuilder, data);
                }
            };
        }

        function orderBy(queryBuilder, propName, descending) {
            queryBuilder.sortClauses.push({ propertyName: propName, descending: descending });
            return {
                orderBy: function (propertyName) {
                    /// <summary>Sorts the selected data ascending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, false);
                },
                orderByDesc: function (propertyName) {
                    /// <summary>Sorts the selected data descending.</summary>
                    /// <param name="propertyName" type="String">The name of the property you want to sort on.</param>
                    return orderBy(queryBuilder, propertyName, true);
                },
                select: function (propertyNames, limit) {
                    /// <summary>Selects the data.</summary>
                    /// <param name="propertyNames" type="Array">
                    /// A list of the names of the properties you want to select. 
                    /// Passing undifined or an empty array returns all properties
                    /// </param>
                    /// <param name="limit" type="int">limits the number of results returned</param>
                    /// <returns type="Array">A list with the selected objects.</returns>
                    return select(queryBuilder, propertyNames, limit);
                }
            };
        }

        function select(queryBuilder, propertyNames, limit) {
            queryBuilder.limit = limit;

            if (propertyNames) {
                if (!linq2indexedDB.util.isArray(propertyNames)) {
                    propertyNames = [propertyNames];
                }

                for (var i = 0; i < propertyNames.length; i++) {
                    queryBuilder.select.push(propertyNames[i]);
                }
            }
            return linq2indexedDB.promises.promise(function (pw) {
                var returnData = [];
                executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, executeWhere).then(function () {
                    pw.complete(this, returnData);
                }, pw.error, function (args) {
                    var obj = selectData(args[0].data, queryBuilder.select);
                    returnData.push(obj);
                    pw.progress(this, obj /*[obj]*/);
                });
            });
        }

        function insert(queryBuilder, data, key) {
            queryBuilder.insert.push({ data: data, key: key });
            return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function (qb, pw, transaction) {
                var objectStorePromis = linq2indexedDB.core.objectStore(transaction, qb.from);
                if (linq2indexedDB.util.isArray(qb.insert[0].data) && !qb.insert[0].key) {
                    var returnData = [];
                    linq2indexedDB.core.insertBatch(objectStorePromis, qb.insert[0].data).then(function (args /*results*/) {
                        pw.complete(this, returnData);
                    },
                    pw.error,
                    function (args /*storedData, storedkey*/) {
                        pw.progress(this, { object: args[0], key: args[1] }/*[storedData, storedkey]*/);
                        returnData.push({ object: args[0], key: args[1] });
                    });

                    //var returnData = [];
                    //for (var i = 0; i < qb.insert[0].data.length; i++) {
                    //    linq2indexedDB.core.insert(objectStorePromis, qb.insert[0].data[i]).then(function (args /*storedData, storedkey*/) {
                    //        pw.progress(this, { object: args[0], key: args[1] }/*[storedData, storedkey]*/);
                    //        returnData.push({ object: args[0], key: args[1] });
                    //        if (returnData.length == qb.insert[0].data.length) {
                    //            pw.complete(this, returnData);
                    //        }
                    //    }, pw.error);
                    //}
                }
                else {
                    linq2indexedDB.core.insert(objectStorePromis, qb.insert[0].data, qb.insert[0].key).then(function (args /*storedData, storedkey*/) {
                        pw.complete(this, { object: args[0], key: args[1] } /*[storedData, storedkey]*/);
                    }, pw.error);
                }
            });
        }

        function update(queryBuilder, data, key) {
            queryBuilder.update.push({ data: data, key: key });
            return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function (qb, pw, transaction) {
                linq2indexedDB.core.update(linq2indexedDB.core.objectStore(transaction, qb.from), qb.update[0].data, qb.update[0].key).then(function (args /*storedData, storedkey*/) {
                    pw.complete(this, { object: args[0], key: args[1] } /*[storedData, storedkey]*/);
                }, pw.error);
            });
        }

        function merge(queryBuilder, data, key) {
            queryBuilder.merge.push({ data: data, key: key });
            if (key) {
                return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function (qb, pw, transaction) {
                    var objectStore = linq2indexedDB.core.objectStore(transaction, qb.from);
                    var obj = null;
                    linq2indexedDB.core.cursor(objectStore, linq2indexedDB.core.IDBKeyRange.only(qb.merge[0].key)).then(function () {
                    }, pw.error, function (args /*data*/) {
                        obj = args[0].data;
                        for (var prop in qb.merge[0].data) {
                            obj[prop] = qb.merge[0].data[prop];
                        }

                        args[0].update(obj);
                        pw.complete(this, obj);
                    }, pw.error);
                });
            }
            else {
                var returnData = [];
                return linq2indexedDB.promises.promise(function (pw) {
                    executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, executeWhere).then(function (args) {
                        if (returnData.length > 0) {
                            pw.complete(this, returnData);
                        }
                        else {
                            executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function (qb, promise, transaction) {
                                linq2indexedDB.core.objectStore(transaction, qb.from).then(function (objectStoreArgs) {
                                    for (var i = 0; i < args.length; i++) {
                                        var obj = args[i];
                                        for (var prop in queryBuilder.merge[0].data) {
                                            obj[prop] = queryBuilder.merge[0].data[prop];
                                        }
                                        linq2indexedDB.core.update(objectStoreArgs[1], obj).then(function (args1 /*data*/) {
                                            pw.progress(this, args1[0] /*[data]*/);
                                            returnData.push(args1[0]);
                                            if (returnData.length == args.length) {
                                                promise.complete(this, returnData);
                                            }
                                        }, promise.error);
                                    }
                                }, promise.error);
                            }).then(pw.complete, pw.error, pw.progress);
                        }
                    }, null, function (args) {
                        if (args[0].update) {
                            var obj = args[0].data;
                            for (var prop in queryBuilder.merge[0].data) {
                                obj[prop] = queryBuilder.merge[0].data[prop];
                            }

                            args[0].update(obj);
                            pw.progress(this, obj);
                            returnData.push(obj);
                        }
                    });
                });
            }
        }

        function remove(queryBuilder, key) {
            if (key) {
                queryBuilder.remove.push({ key: key });
                return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function (qb, pw, transaction) {
                    linq2indexedDB.core.remove(linq2indexedDB.core.objectStore(transaction, qb.from), qb.remove[0].key).then(function () {
                        pw.complete(this, queryBuilder.remove[0].key /*[queryBuilder.remove[0].key]*/);
                    }, pw.error);
                });
            }
            else {
                var cursorDelete = false;
                return linq2indexedDB.promises.promise(function (pw) {
                    executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, executeWhere).then(function (data) {
                        if (cursorDelete) {
                            pw.complete(this);
                        }
                        else {
                            executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function (qb, promise, transaction) {
                                linq2indexedDB.core.objectStore(transaction, qb.from).then(function (objectStoreArgs) {
                                    var itemsDeleted = 0;
                                    for (var i = 0; i < data.length; i++) {
                                        linq2indexedDB.core.remove(objectStoreArgs[1], linq2indexedDB.json.getPropertyValue(data[i], objectStoreArgs[1].keyPath)).then(function (args1 /*data*/) {
                                            pw.progress(this, args1[0] /*[data]*/);
                                            if (++itemsDeleted == data.length) {
                                                promise.complete(this);
                                            }
                                        }, promise.error);
                                    }
                                }, promise.error);
                            }).then(pw.complete, pw.error, pw.progress);
                        }
                    }, null, function (args) {
                        if (args[0].remove) {
                            args[0].remove();
                            pw.progress(this);
                            cursorDelete = true;
                        }
                    });
                });
            }
        }

        function clear(queryBuilder) {
            queryBuilder.clear = true;
            return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function (qb, pw, transaction) {
                linq2indexedDB.core.clear(linq2indexedDB.core.objectStore(transaction, qb.from)).then(function () {
                    pw.complete(this);
                }, pw.error);
            });
        }

        function get(queryBuilder, key) {
            queryBuilder.get.push({ key: key });
            return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_ONLY, function (qb, pw, transaction) {
                linq2indexedDB.core.get(linq2indexedDB.core.objectStore(transaction, qb.from), qb.get[0].key).then(function (args /*data*/) {
                    pw.complete(this, args[0] /*[data]*/);
                }, pw.error);
            });
        }

        //function databind(queryBuilder, provider, bindingList) {
        //    var operations = {
        //        insert: function (data) {
        //            insert(queryBuilder, data);
        //        },
        //        update: function (data) {
        //            update(queryBuilder, data);
        //        },
        //        remove: function (/*data*/) {
        //            //remove(queryBuilder, data);
        //        }
        //    };

        //    var list = provider(bindingList, operations);

        //    select(queryBuilder).then(function (data) {
        //        provider.populate(data);
        //    });

        //    return list;
        //}

        function executeQuery(queryBuilder, transactionType, callBack) {
            return linq2indexedDB.promises.promise(function (pw) {
                // Create DB connection
                linq2indexedDB.core.db(queryBuilder.dbConfig.name, queryBuilder.dbConfig.version).then(function (args /* [db, event] */) {
                    // Opening a transaction
                    linq2indexedDB.core.transaction(args[0], queryBuilder.from, transactionType, queryBuilder.dbConfig.autoGenerateAllowed).then(function (transactionArgs /* [transaction] */) {
                        var txn = transactionArgs[0];
                        linq2indexedDB.core.closeDatabaseConnection(txn);
                        // call complete if it isn't called already
                        //pw.complete();
                    },
                    pw.error,
                    function (transactionArgs /* [transaction] */) {
                        callBack(queryBuilder, pw, transactionArgs[0]);
                    });
                }
                , pw.error
                , function (args /*txn, e*/) {
                    var txn = args[0];
                    var e = args[1];

                    // Upgrading the database to the correct version
                    if (e.type == "upgradeneeded") {
                        upgradeDatabase(queryBuilder.dbConfig, e.oldVersion, e.newVersion, txn);
                    }
                });
            });
        }

        function executeWhere(queryBuilder, pw, transaction) {
            linq2indexedDB.core.objectStore(transaction, queryBuilder.from).then(function (objArgs) {
                try {
                    var objectStore = objArgs[1];
                    var whereClauses = queryBuilder.where || [];
                    var returnData = [];
                    var cursorPromise = determineCursor(objectStore, whereClauses, queryBuilder.dbConfig);

                    cursorPromise.then(
                        function (args1 /*data*/) {
                            var data = args1[0];
                            
                            if (returnData.length == 0) {
                                linq2indexedDB.workers.worker(data, whereClauses, queryBuilder.sortClauses, queryBuilder.limit).then(function (d) {
                                    // No need to notify again if it allready happend in the onProgress method of the cursor.
                                    for (var j = 0; j < d.length; j++) {
                                        pw.progress(this, [d[j]] /*[obj]*/);
                                    }
                                    pw.complete(this, d /*[returnData]*/);
                                });
                            }
                            else {
                                pw.complete(this, returnData);
                            }
                        },
                        pw.error,
                        function (args1 /*data*/) {

                            // When there are no more where clauses to fulfill and the collection doesn't need to be sorted, the data can be returned.
                            // In the other case let the complete handle it.
                            if (whereClauses.length == 0 && queryBuilder.sortClauses.length == 0) {
                                returnData.push({ data: args1[0].data, key: args1[0].key });
                                pw.progress(this, args1 /*[obj]*/);
                                if (queryBuilder.limit && returnData.length == queryBuilder.limit)
                                {
                                    pw.complete(this, returnData);
                                    linq2indexedDB.core.abortTransaction(args1[2].currentTarget.transaction);
                                }
                            }
                        }
                    );
                } catch (ex) {
                    // Handle errors like an invalid keyRange.
                    linq2indexedDB.core.abortTransaction(objArgs[0]);
                    pw.error(this, [ex.message, ex]);
                }
            }, pw.error);
        }

        function determineCursor(objectStore, whereClauses, dbConfig) {
            var cursorPromise;

            // Checks if an indexeddb filter can be used
            if (whereClauses.length > 0
                && !whereClauses[0].isNotClause
                && whereClauses[0].filter.indexeddbFilter
                && (whereClauses.length == 1 || (whereClauses.length > 1 && !whereClauses[1].isOrClause))) {
                var source = objectStore;
                var indexPossible = dbConfig.autoGenerateAllowed || objectStore.indexNames.contains(whereClauses[0].propertyName + linq2indexedDB.core.indexSuffix);
                // Checks if we can use an index
                if (whereClauses[0].propertyName != objectStore.keyPath && indexPossible) {
                    source = linq2indexedDB.core.index(objectStore, whereClauses[0].propertyName, dbConfig.autoGenerateAllowed);
                }
                // Checks if we can use indexeddb filter
                if (whereClauses[0].propertyName == objectStore.keyPath
                    || indexPossible) {
                    // Gets the where clause + removes it from the collection
                    var clause = whereClauses.shift();
                    switch (clause.filter) {
                        case linq2indexedDB.linq.filters.equals:
                            cursorPromise = linq2indexedDB.core.cursor(source, linq2indexedDB.core.keyRange.only(clause.value));
                            break;
                        case linq2indexedDB.linq.filters.between:
                            cursorPromise = linq2indexedDB.core.cursor(source, linq2indexedDB.core.keyRange.bound(clause.minValue, clause.maxValue, clause.minValueIncluded, clause.maxValueIncluded));
                            break;
                        case linq2indexedDB.linq.filters.greaterThan:
                            cursorPromise = linq2indexedDB.core.cursor(source, linq2indexedDB.core.keyRange.lowerBound(clause.value, clause.valueIncluded));
                            break;
                        case linq2indexedDB.linq.filters.smallerThan:
                            cursorPromise = linq2indexedDB.core.cursor(source, linq2indexedDB.core.keyRange.upperBound(clause.value, clause.valueIncluded));
                            break;
                        default:
                            cursorPromise = linq2indexedDB.core.cursor(source);
                            break;
                    }
                } else {
                    // Get everything if the index can't be used
                    cursorPromise = linq2indexedDB.core.cursor(source);
                }
            } else {
                // Get's everything, manually filter data
                cursorPromise = linq2indexedDB.core.cursor(objectStore);
            }
            return cursorPromise;
        }

        function selectData(data, propertyNames) {
            if (propertyNames && propertyNames.length > 0) {
                if (!linq2indexedDB.util.isArray(propertyNames)) {
                    propertyNames = [propertyNames];
                }

                var obj = new Object();
                for (var i = 0; i < propertyNames.length; i++) {
                    linq2indexedDB.json.setPropertyValue(obj, propertyNames[i], linq2indexedDB.json.getPropertyValue(data, propertyNames[i]));
                }
                return obj;
            }
            return data;
        }

        function initialize() {
            var self = this;
            var dbConfig = self.dbConfig;
            if (typeof (dbConfig.definition) !== "undefined") {
                var definitions = dbConfig.definition.sort(linq2indexedDB.json.comparer("version", false).sort);
                for (var i = 0; i < definitions.length; i++) {
                    var def = definitions[i];
                    for (var j = 0; j < def.objectStores.length; j++) {
                        var objStore = def.objectStores[j];
                        if (objStore.remove) {
                            self[objStore.name] = undefined;
                        }
                        else {

                            self[objStore.name] = self.from(objStore.name);
                        }
                    }
                }
            }

            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Initialize Started");
            return linq2indexedDB.promises.promise(function (pw) {
                linq2indexedDB.core.db(dbConfig.name, dbConfig.version).then(function (args) /*db*/ {
                    var db = args[0];
                    for (var k = 0; k < db.objectStoreNames.length; k++) {
                        var name = db.objectStoreNames[k];
                        self[name] = self.from(name);
                    }
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Close dbconnection");
                    db.close();
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Initialize Succesfull");
                    pw.complete();
                }, pw.error, function (args) /*txn, e*/ {
                    var txn = args[0];
                    var e = args[1];
                    if (e.type == "upgradeneeded") {
                        upgradeDatabase(dbConfig, e.oldVersion, e.newVersion, txn);
                    }
                });
            });
        }

        function deleteDatabase() {
            var dbConfig = this.dbConfig;
            return linq2indexedDB.promises.promise(function (pw) {
                linq2indexedDB.core.deleteDb(dbConfig.name).then(function () {
                    pw.complete();
                }, pw.error);
            });
        }

        var returnObj = {
            deleteDatabase: deleteDatabase,
            initialize: initialize,
            from: from
        };

        return returnObj;
    }();

    function viewer(dbConfig) {
        var dbView = {};
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

        dbView.refresh = function () {
            refresh = true;
            refreshInternal();
        };

        linq2indexedDB.core.dbStructureChanged.addListener(linq2indexedDB.core.databaseEvents.databaseUpgrade, function () {
            refresh = true;
        });
        linq2indexedDB.core.dbStructureChanged.addListener(linq2indexedDB.core.databaseEvents.databaseOpened, function () {
            refreshInternal();
        });
        linq2indexedDB.core.dbStructureChanged.addListener(linq2indexedDB.core.databaseEvents.databaseRemoved, function () {
            dbView.name = null;
            dbView.version = null;
            dbView.ObjectStores = [];
            refresh = false;
        });
        linq2indexedDB.core.dbDataChanged.addListener([linq2indexedDB.core.dataEvents.dataInserted, linq2indexedDB.core.dataEvents.dataRemoved, linq2indexedDB.core.dataEvents.dataUpdated, linq2indexedDB.core.dataEvents.objectStoreCleared], function () {
            dbView.refresh();
        });

        return dbView;
    }

    function getDbInformation(dbView, dbConfig) {
        linq2indexedDB.core.db(dbConfig.name).then(function () {
            var connection = arguments[0][0];
            dbView.name = connection.name;
            dbView.version = connection.version;
            dbView.ObjectStores = [];

            linq2indexedDB.core.dbStructureChanged.addListener(linq2indexedDB.core.databaseEvents.databaseBlocked, function () {
                linq2indexedDB.core.closeDatabaseConnection(connection);
            });

            var objectStoreNames = [];
            for (var k = 0; k < connection.objectStoreNames.length; k++) {
                objectStoreNames.push(connection.objectStoreNames[k]);
            }

            if (objectStoreNames.length > 0) {
                linq2indexedDB.core.transaction(connection, objectStoreNames, linq2indexedDB.core.transactionTypes.READ_ONLY, false).then(null, null, function () {
                    var transaction = arguments[0][0];

                    for (var i = 0; i < connection.objectStoreNames.length; i++) {
                        linq2indexedDB.core.objectStore(transaction, connection.objectStoreNames[i]).then(function () {
                            var objectStore = arguments[0][1];
                            var indexes = [];
                            var objectStoreData = [];

                            for (var j = 0; j < objectStore.indexNames.length; j++) {
                                linq2indexedDB.core.index(objectStore, objectStore.indexNames[j], false).then(function () {
                                    var index = arguments[0][1];
                                    var indexData = [];

                                    linq2indexedDB.core.cursor(index).then(null, null, function () {
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

                            linq2indexedDB.core.cursor(objectStore).then(null, null, function () {
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
        }, null, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.abortTransaction(args[0]);
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
                        linq2indexedDB.core.deleteObjectStore(txn, objectStoreDefinition.name);
                    } else {
                        linq2indexedDB.core.createObjectStore(txn, objectStoreDefinition.name, objectStoreDefinition.objectStoreOptions);
                    }
                }
            }

            if (definition.indexes) {
                for (var j = 0; j < definition.indexes.length; j++) {
                    var indexDefinition = definition.indexes[j];
                    if (indexDefinition.remove) {
                        var indexName = indexDefinition.propertyName;
                        if (indexDefinition.indexOptions && indexDefinition.indexOptions.indexName) indexName = indexDefinition.indexOptions.indexName;

                        linq2indexedDB.core.deleteIndex(linq2indexedDB.core.objectStore(txn, indexDefinition.objectStoreName), indexName);
                    } else {
                        linq2indexedDB.core.createIndex(linq2indexedDB.core.objectStore(txn, indexDefinition.objectStoreName), indexDefinition.propertyName, indexDefinition.indexOptions);
                    }
                }
            }

            if (definition.defaultData) {
                for (var k = 0; k < definition.defaultData.length; k++) {
                    var defaultDataDefinition = definition.defaultData[k];
                    if (defaultDataDefinition.remove) {
                        linq2indexedDB.core.remove(linq2indexedDB.core.objectStore(txn, defaultDataDefinition.objectStoreName), defaultDataDefinition.key);
                    } else {
                        linq2indexedDB.core.update(linq2indexedDB.core.objectStore(txn, defaultDataDefinition.objectStoreName), defaultDataDefinition.data, defaultDataDefinition.key);
                    }
                }
            }
        } catch (ex) {
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.exception, "initialize version exception: ", ex);
            linq2indexedDB.core.abortTransaction(txn);
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

    linq2indexedDB.DbContext = dbContext;
})(linq2indexedDB);

