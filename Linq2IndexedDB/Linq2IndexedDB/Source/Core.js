//if (typeof window !== "undefined") {
    // UI Thread 

    // Namespace linq2indexedDB.core
// ReSharper disable InconsistentNaming
    (function (window, linq2indexedDB, isMetroApp) {
// ReSharper restore InconsistentNaming
        "use strict"; 

        // Region variables
        var defaultDatabaseName = "Default";
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
            IDBRequest: function (request) {
                return deferredHandler(IDBRequestHandler, request);
            },
            IDBBlockedRequest: function (request) {
                return deferredHandler(IDBBlockedRequestHandler, request);
            },
            IDBOpenDBRequest: function (request) {
                return deferredHandler(IDBOpenDbRequestHandler, request);
            },
            IDBDatabase: function (database) {
                return deferredHandler(IDBDatabaseHandler, database);
            },
            IDBTransaction: function (txn) {
                return deferredHandler(IDBTransactionHandler, txn);
            },
            IDBCursorRequest: function (request) {
                return deferredHandler(IDBCursorRequestHandler, request);
            }
        };
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
        var upgradingDatabase = false;

        var async = {
            db: function (pw, name, version) {
                var req;
                try {
                    // Initializing defaults
                    name = name ? name : defaultDatabaseName;

                    // Creating a new database conection
                    if (version) {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "db opening", name, version);
                        req = window.indexedDB.open(name, version);
                    } else {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "db opening", name);
                        req = window.indexedDB.open(name);
                    }

                    // Handle the events of the creation of the database connection
                    handlers.IDBOpenDBRequest(req).then(
                        function (args /*db, e*/) {
                            var db = args[0];
                            var e = args[1];
                            // Database connection established

                            // Handle the events on the database.
                            handlers.IDBDatabase(db).then(
                                function (/*result, event*/) {
                                    // No done present.
                                },
                                function (args1/*error, event*/) {
                                    // Database error or abort
                                    closeConnection(args1[1].target);
                                    // When an error occures the result will already be resolved. This way calling the reject won't case a thing
                                },
                                function (args1 /*result, event*/) {
                                    var event = args1[1];
                                    if (event) {
                                        // Sending a notify won't have any effect because the result is already resolved. There is nothing more to do than close the current connection.
                                        if (event.type === "versionchange") {
                                            if (event.version != event.target.version) {
                                                // If the version is changed and the current version is different from the requested version, the connection needs to get closed.
                                                closeConnection(event.target);
                                            }
                                        }
                                    }
                                });

                            var currentVersion = getDatabaseVersion(db);
                            if (db.setVersion && (currentVersion < version || (version == -1) || currentVersion == "")) {
                                // Current version deferres from the requested version, database upgrade needed
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "DB Promise upgradeneeded", this, db, e);
                                async.changeDatabaseStructure(db, version || 1).then(
                                    function (args1 /*txn, event*/) {
                                        var txn = args1[0];
                                        var event = args1[1];

                                        // Fake the onupgrade event.
                                        var context = txn.db;
                                        context.transaction = txn;

                                        var upgardeEvent = {};
                                        upgardeEvent.type = "upgradeneeded";
                                        upgardeEvent.newVersion = version;
                                        upgardeEvent.oldVersion = currentVersion;
                                        upgardeEvent.originalEvent = event;

                                        core.dbStructureChanged.fire({ type: dbEvents.databaseUpgrade, data: upgardeEvent });
                                        pw.progress(context, [txn, upgardeEvent]);

                                        handlers.IDBTransaction(txn).then(function (/*trans, args*/) {
                                            // When completed return the db + event of the original request.
                                            pw.complete(this, args);
                                        },
                                        function (args2 /*err, ev*/) {
                                            //txn error or abort
                                            pw.error(this, args2);
                                        });
                                    },
                                    function (args1 /*err, event*/) {
                                        // txn error or abort
                                        pw.error(this, args1);
                                    },
                                    function (args1 /*result, event*/) {
                                        // txn blocked
                                        core.dbStructureChanged.fire({ type: dbEvents.databaseBlocked, data: args1 });
                                        pw.progress(this, args1);
                                    });
                            } else if (version && version < currentVersion) {
                                closeConnection(db);
                                var err = {
                                    severity: linq2indexedDB.logging.severity.error,
                                    type: "VersionError",
                                    message: "You are trying to open the database in a lower version (" + version + ") than the current version of the database",
                                    method: "db"
                                };
                                linq2indexedDB.logging.logError(err);
                                pw.error(this, err);
                            }
                            else {
                                // Database Connection resolved.
                                core.dbStructureChanged.fire({ type: dbEvents.databaseOpened, data: db });
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "DB Promise resolved", db, e);
                                pw.complete(this, [db, e]);
                            }
                        },
                        function (args /*error, e*/) {
                            // Database connection error or abort
                            var err = wrapError(args[1], "db");

                            // Fix for firefox & chrome
                            if (args[1].target && args[1].target.errorCode == 12) {
                                err.type = "VersionError";
                            }

                            if (err.type == "VersionError") {
                                err.message = "You are trying to open the database in a lower version (" + version + ") than the current version of the database";
                            }

                            // Fix for firefox & chrome
                            if (args[1].target && args[1].target.errorCode == 8) {
                                err.type = "AbortError";
                            }

                            if (err.type == "AbortError") {
                                err.message = "The VERSION_CHANGE transaction was aborted.";
                            }
                            // For old firefox implementations
                            linq2indexedDB.logging.logError(err);
                            pw.error(this, err);
                        },
                        function (args /*result, e*/) {
                            // Database upgrade + db blocked
                            if (args[1].type == "blocked") {
                                core.dbStructureChanged.fire({ type: dbEvents.databaseBlocked, data: args });
                            } else if (args[1].type == "upgradeneeded") {
                                core.dbStructureChanged.fire({ type: dbEvents.databaseUpgrade, data: args });
                            }
                            pw.progress(this, args);
                        }
                    );
                } catch (ex) {
                    var error = wrapException(ex, "db");
                    if ((ex.INVALID_ACCESS_ERR && ex.code == ex.INVALID_ACCESS_ERR) || ex.name == "InvalidAccessError") {
                        error.type = "InvalidAccessError";
                        error.message = "You are trying to open a database with a negative version number.";
                    }
                    linq2indexedDB.logging.logError(error);
                    pw.error(this, error);
                }
            },
            transaction: function (pw, db, objectStoreNames, transactionType, autoGenerateAllowed) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction promise started", db, objectStoreNames, transactionType);

                // Initialize defaults
                if (!linq2indexedDB.util.isArray(objectStoreNames)) { objectStoreNames = [objectStoreNames]; }
                transactionType = transactionType || transactionTypes.READ_ONLY;
                
                var nonExistingObjectStores = [];

                try {
                    // Check for non-existing object stores
                    for (var i = 0; i < objectStoreNames.length; i++) {
                        if (!db.objectStoreNames || !db.objectStoreNames.contains(objectStoreNames[i])) {
                            nonExistingObjectStores.push(objectStoreNames[i]);
                        }
                    }

                    // When non-existing object stores are found and the autoGenerateAllowed is true.
                    // Then create these object stores
                    if (nonExistingObjectStores.length > 0 && autoGenerateAllowed) {
                        // setTimeout is necessary when multiple request to generate an index come together.
                        // This can result in a deadlock situation, there for the setTimeout
                        setTimeout(function (con) {
                            upgradingDatabase = true;
                            var version = getDatabaseVersion(db) + 1;
                            var dbName = con.name;
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction database upgrade needed: ", con);
                            // Closing the current connections so it won't block the upgrade.
                            closeConnection(con);
                            // Open a new connection with the new version
                            core.db(dbName, version).then(function (args /*dbConnection, event*/) {
                                upgradingDatabase = false;
                                // Necessary for getting it work in WIN 8, WinJS promises have troubles with nesting promises
                                var txn = args[0].transaction(objectStoreNames, transactionType);

                                // Handle transaction events
                                handlers.IDBTransaction(txn).then(function (args1 /*result, event*/) {
                                    // txn completed
                                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction completed.", txn);
                                    pw.complete(this, args1);
                                },
                                    function (args1 /*err, event*/) {
                                        // txn error or abort
                                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Transaction error/abort.", args1);
                                        pw.error(this, args1);
                                    });

                                // txn created
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction created.", txn);
                                pw.progress(txn, [txn]);
                            },
                                function (args /*error, event*/) {
                                    // When an error occures, bubble up.
                                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Transaction error.", args);
                                    pw.error(this, args);
                                },
                                function (args /*txn, event*/) {
                                    var event = args[1];

                                    // When an upgradeneeded event is thrown, create the non-existing object stores
                                    if (event.type == "upgradeneeded") {
                                        for (var j = 0; j < nonExistingObjectStores.length; j++) {
                                            core.createObjectStore(args[0], nonExistingObjectStores[j], { keyPath: "Id", autoIncrement: true });
                                        }
                                    }
                                });
                        }, upgradingDatabase ? 10 : 1, db);
                    } else {
                        // If no non-existing object stores are found, create the transaction.
                        var transaction = db.transaction(objectStoreNames, transactionType);

                        // Handle transaction events
                        handlers.IDBTransaction(transaction).then(function (args /*result, event*/) {
                            // txn completed
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction completed.", args);
                            pw.complete(this, args);
                        },
                            function (args /*err, event*/) {
                                var err = wrapError(args[1], "transaction");
                                if (args[1].type == "abort" || (args[1].target && args[1].target.error && args[1].target.error.name == "AbortError")) {
                                    err.type = "abort";
                                    err.severity = "abort";
                                    err.message = "Transaction was aborted";
                                }

                                // Fix for firefox & chrome
                                if (args[1].target && args[1].target.errorCode == 4) {
                                    err.type = "ConstraintError";
                                }

                                if (err.type == "ConstraintError") {
                                    err.message = "A mutation operation in the transaction failed. For more details look at the error on the instert, update, remove or clear statement.";
                                }
                                // txn error or abort
                                linq2indexedDB.logging.logError(err);
                                pw.error(this, err);
                            });

                        // txn created
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction transaction created.", transaction);
                        pw.progress(transaction, [transaction]);
                    }
                }
                catch (ex) {
                    var error = wrapException(ex, "transaction");
                    if ((ex.INVALID_ACCESS_ERR && ex.code == ex.INVALID_ACCESS_ERR) || ex.name == "InvalidAccessError") {
                        error.type = "InvalidAccessError";
                        error.message = "You are trying to open a transaction without providing an object store as scope.";
                    }
                    if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError" || ex.type == "property_not_function") {
                        var objectStores = "";
                        for (var m = 0; m < nonExistingObjectStores.length; m++) {
                            if (m > 0) {
                                objectStores += ", ";
                            }
                            objectStores += nonExistingObjectStores[m];
                        }
                        error.type = "NotFoundError";
                        error.message = "You are trying to open a transaction for object stores (" + objectStores + "), that doesn't exist.";
                    }
                    if ((ex.QUOTA_ERR && ex.code == ex.QUOTA_ERR) || ex.name == "QuotaExceededError") {
                        error.type = "QuotaExceededError";
                        error.message = "The size quota of the indexedDB database is reached.";
                    }
                    if ((ex.UNKNOWN_ERR && ex.code == ex.UNKNOWN_ERR) || ex.name == "UnknownError") {
                        error.type = "UnknownError";
                        error.message = "An I/O exception occured.";
                    }
                    linq2indexedDB.logging.logError(error);
                    pw.error(this, error);
                }
            },
            changeDatabaseStructure: function (db, version) {
                return linq2indexedDB.promises.promise(function (pw) {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "changeDatabaseStructure started", db, version);
                    handlers.IDBBlockedRequest(db.setVersion(version)).then(function (args /*txn, event*/) {
                        // txn created
                        pw.complete(this, args);
                    },
                        function (args /*error, event*/) {
                            // txn error or abort
                            pw.error(this, args);
                        },
                        function (args /*txn, event*/) {
                            // txn blocked
                            pw.progress(this, args);
                        });
                });
            },
            objectStore: function (pw, transaction, objectStoreName) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "objectStore started", transaction, objectStoreName);
                try {
                    var store = transaction.objectStore(objectStoreName);
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "objectStore completed", transaction, store);
                    pw.complete(store, [transaction, store]);
                } catch (ex) {
                    var error = wrapException(ex, "objectStore");
                    if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError") {
                        error.type = "NotFoundError";
                        error.message = "You are trying to open an object store (" + objectStoreName + "), that doesn't exist or isn't in side the transaction scope.";
                    }
                    if (ex.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to open an object store (" + objectStoreName + ") outside a transaction.";
                    }

                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(transaction);
                    }
                    pw.error(this, error);
                }
            },
            createObjectStore: function (pw, transaction, objectStoreName, objectStoreOptions) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "createObjectStore started", transaction, objectStoreName, objectStoreOptions);
                try {
                    if (!transaction.db.objectStoreNames.contains(objectStoreName)) {
                        // If the object store doesn't exists, create it
                        var options = new Object();

                        if (objectStoreOptions) {
                            if (objectStoreOptions.keyPath) { options.keyPath = objectStoreOptions.keyPath; }
                            options.autoIncrement = objectStoreOptions.autoIncrement;
                        } else {
                            options.autoIncrement = true;
                        }

                        var store = transaction.db.createObjectStore(objectStoreName, options, options.autoIncrement);

                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "ObjectStore Created", transaction, store);
                        core.dbStructureChanged.fire({ type: dbEvents.objectStoreCreated, data: store });
                        pw.complete(store, [transaction, store]);
                    } else {
                        // If the object store exists, retrieve it
                        core.objectStore(transaction, objectStoreName).then(function (args /*trans, store*/) {
                            // store resolved
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "ObjectStore Found", args[1], objectStoreName);
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "createObjectStore Promise", args[0], args[1]);
                            pw.complete(store, args);
                        },
                            function (args /*error, event*/) {
                                // store error
                                pw.error(this, args);
                            });
                    }
                } catch (ex) {
                    // store exception
                    var error = wrapException(ex, "createObjectStore");
                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to create an object store in a readonly or readwrite transaction.";
                    }
                    if ((ex.INVALID_ACCESS_ERR && ex.code == ex.INVALID_ACCESS_ERR) || ex.name == "InvalidAccessError") {
                        error.type = "InvalidAccessError";
                        error.message = "The object store can't have autoIncrement on and an empty string or an array with an empty string as keyPath.";
                    }
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "InvalidStateError") {
                        abortTransaction(transaction);
                    }
                    pw.error(this, error);
                }
            },
            deleteObjectStore: function (pw, transaction, objectStoreName) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "deleteObjectStore Promise started", transaction, objectStoreName);
                try {
                    transaction.db.deleteObjectStore(objectStoreName);
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "ObjectStore Deleted", objectStoreName);
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "deleteObjectStore completed", objectStoreName);
                    core.dbStructureChanged.fire({ type: dbEvents.objectStoreRemoved, data: objectStoreName });
                    pw.complete(this, [transaction, objectStoreName]);
                } catch (ex) {
                    var error = wrapException(ex, "deleteObjectStore");
                    if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError") {
                        error.type = "NotFoundError";
                        error.message = "You are trying to delete an object store (" + objectStoreName + "), that doesn't exist.";
                    }
                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to delete an object store in a readonly or readwrite transaction.";
                    }
                    // store exception
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "InvalidStateError") {
                        abortTransaction(transaction);
                    }
                    pw.error(this, error);
                }
            },
            index: function (pw, objectStore, propertyName, autoGenerateAllowed) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Index started", objectStore, propertyName, autoGenerateAllowed);
                var indexName = propertyName;
                if (propertyName.indexOf(core.indexSuffix) == -1) {
                    indexName = indexName + core.indexSuffix;
                }

                try {
                    if (!objectStore.indexNames.contains(indexName) && autoGenerateAllowed) {
                        // setTimeout is necessary when multiple request to generate an index come together.
                        // This can result in a deadlock situation, there for the setTimeout
                        setTimeout(function (objStore) {
                            upgradingDatabase = true;
                            // If index doesn't exists, create it if autoGenerateAllowed
                            var version = getDatabaseVersion(objStore.transaction.db) + 1;
                            var dbName = objStore.transaction.db.name;
                            var transactionType = objStore.transaction.mode;
                            var objectStoreNames = [objStore.name]; //transaction.objectStoreNames;
                            var objectStoreName = objStore.name;
                            // Close the currenct database connections so it won't block
                            closeConnection(objStore);

                            // Open a new connection with the new version
                            core.db(dbName, version).then(function (args /*dbConnection, event*/) {
                                upgradingDatabase = false;
                                // When the upgrade is completed, the index can be resolved.
                                core.transaction(args[0], objectStoreNames, transactionType, autoGenerateAllowed).then(function (/*transaction, ev*/) {
                                    // txn completed
                                    // TODO: what to do in this case
                                },
                                    function (args1 /*error, ev*/) {
                                        // txn error or abort
                                        pw.error(this, args1);
                                    },
                                    function (args1 /*transaction*/) {
                                        // txn created
                                        core.index(linq2indexedDB.core.objectStore(args1[0], objectStoreName), propertyName).then(function (args2 /*trans, index, store*/) {
                                            pw.complete(this, args2);
                                        }, function (args2 /*error, ev*/) {
                                            // txn error or abort
                                            pw.error(this, args2);
                                        });
                                    });
                            },
                                function (args /*error, event*/) {
                                    // When an error occures, bubble up.
                                    pw.error(this, args);
                                },
                                function (args /*trans, event*/) {
                                    var trans = args[0];
                                    var event = args[1];

                                    // When an upgradeneeded event is thrown, create the non-existing object stores
                                    if (event.type == "upgradeneeded") {
                                        core.createIndex(linq2indexedDB.core.objectStore(trans, objectStoreName), propertyName).then(function (/*index, store, transaction*/) {
                                            // index created
                                        },
                                        function (args1 /*error, ev*/) {
                                            // When an error occures, bubble up.
                                            pw.error(this, args1);
                                        });
                                    }
                                });
                        }, upgradingDatabase ? 10 : 1, objectStore);
                    } else {
                        // If index exists, resolve it
                        var index = objectStore.index(indexName);
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Index completed", objectStore.transaction, index, objectStore);
                        pw.complete(this, [objectStore.transaction, index, objectStore]);
                    }
                } catch (ex) {
                    var error = wrapException(ex, "index");
                    var txn = objectStore.transaction;
                    if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError") {
                        error.type = "NotFoundError";
                        error.message = "You are trying to open an index (" + indexName + "), that doesn't exist.";
                    }
                    if (ex.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to open an object store (" + indexName + ") outside a transaction.";
                    }
                    // index exception
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            createIndex: function (pw, objectStore, propertyName, indexOptions) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "createIndex started", objectStore, propertyName, indexOptions);
                try {
                    var indexName = propertyName;
                    if (propertyName.indexOf(core.indexSuffix) == -1) {
                        indexName = indexName + core.indexSuffix;
                    }

                    if (!objectStore.indexNames.contains(indexName)) {
                        var index = objectStore.createIndex(indexName, propertyName, { unique: indexOptions ? indexOptions.unique : false, multiRow: indexOptions ? indexOptions.multirow : false, multiEntry: indexOptions ? indexOptions.multirow : false });
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "createIndex completed", objectStore.transaction, index, objectStore);
                        core.dbStructureChanged.fire({ type: dbEvents.indexCreated, data: index });
                        pw.complete(this, [objectStore.transaction, index, objectStore]);
                    } else {
                        // if the index exists retrieve it
                        core.index(objectStore, propertyName, false).then(function (args) {
                            pw.complete(this, args);
                        });
                    }
                } catch (ex) {
                    // store exception
                    var error = wrapException(ex, "createIndex");
                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to create an index in a readonly or readwrite transaction.";
                    }
                    if (error.type != "InvalidStateError") {
                        abortTransaction(objectStore.transaction);
                    }
                    linq2indexedDB.logging.logError(error);
                    pw.error(this, error);
                }
            },
            deleteIndex: function (pw, objectStore, propertyName) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "deleteIndex started", objectStore, propertyName);
                var indexName = propertyName;
                if (propertyName.indexOf(core.indexSuffix) == -1) {
                    indexName = indexName + core.indexSuffix;
                }

                try {
                    objectStore.deleteIndex(indexName);
                    core.dbStructureChanged.fire({ type: dbEvents.indexRemoved, data: indexName });
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "deleteIndex completed", objectStore.transaction, propertyName, objectStore);
                    pw.complete(this, [objectStore.transaction, propertyName, objectStore]);
                } catch (ex) {
                    var error = wrapException(ex, "deleteIndex");
                    if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError") {
                        error.type = "NotFoundError";
                        error.message = "You are trying to delete an index (" + indexName + ", propertyName: " + propertyName + " ), that doesn't exist.";
                    }
                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to delete an index in a readonly or readwrite transaction.";
                    }
                    // store exception
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "InvalidStateError") {
                        abortTransaction(objectStore.transaction);
                    }
                    pw.error(this, error);
                }
            },
            cursor: function (pw, source, range, direction) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor Promise Started", source);
                var keyRange;
                var returnData = [];
                var request;
                var txn = source.transaction || source.objectStore.transaction;

                try {

                    keyRange = range;

                    if (!keyRange) {
                        if (implementation != implementations.GOOGLE) {
                            keyRange = core.keyRange.lowerBound(0);
                        } else {
                            keyRange = core.keyRange.lowerBound(parseFloat(0));
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

                    request.then(function (args1 /*result, e*/) {
                        var e = args1[1];

                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor completed", returnData, txn, e);
                        pw.complete(this, [returnData, txn, e]);
                    },
                        function (args /*error, e*/) {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Cursor error", args);
                            pw.error(this, args);
                        },
                        function (args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor progress", result, e);
                            if (result.value) {
                                var progressObj = {
                                    data: result.value,
                                    key: result.primaryKey,
                                    skip: function (number) {
                                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor skip", result, e);
                                        try {
                                            result.advance(number);
                                        }
                                        catch (advanceEx) {
                                            var advanceErr = wrapException(advanceEx, "cursor - skip");

                                            if ((advanceEx.DATA_ERR && advanceEx.code == advanceEx.DATA_ERR) || advanceEx.name == "DataError") {
                                                advanceErr.type = "DataError";
                                                advanceErr.message = "The provided range parameter isn't a valid key or key range.";
                                            }

                                            if (advanceEx.name == "TypeError") {
                                                advanceErr.type = "TypeError";
                                                advanceErr.message = "The provided count parameter is zero or a negative number.";
                                            }

                                            if ((advanceEx.INVALID_STATE_ERR && advanceEx.code == advanceEx.INVALID_STATE_ERR) || advanceEx.name == "InvalidStateError") {
                                                advanceErr.type = "InvalidStateError";
                                                advanceErr.message = "You are trying to skip data on a removed object store.";
                                            }
                                            linq2indexedDB.logging.logError(advanceErr);
                                            abortTransaction(txn);
                                            pw.error(this, advanceErr);
                                        }
                                    },
                                    update: function (obj) {
                                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor update", result, e);
                                        try {
                                            result.update(obj);
                                        }
                                        catch (updateEx) {
                                            var updateError = wrapException(updateEx, "cursor - update");

                                            if ((updateEx.DATA_ERR && updateEx.code == updateEx.DATA_ERR) || updateEx.name == "DataError") {
                                                updateError.type = "DataError";
                                                updateError.message = "The underlying object store uses in-line keys and the property in value at the object store's key path does not match the key in this cursor's position.";
                                            }

                                            if ((updateEx.READ_ONLY_ERR && updateEx.code == updateEx.READ_ONLY_ERR) || updateEx.name == "ReadOnlyError") {
                                                updateError.type = "ReadOnlyError";
                                                updateError.message = "You are trying to update data in a readonly transaction.";
                                            }

                                            if (updateEx.name == "TransactionInactiveError") {
                                                updateError.type = "TransactionInactiveError";
                                                updateError.message = "You are trying to update data on an inactieve transaction. (The transaction was already aborted or committed)";
                                            }

                                            if ((updateEx.DATA_CLONE_ERR && updateEx.code == updateEx.DATA_CLONE_ERR) || updateEx.name == "DataCloneError") {
                                                updateError.type = "DataCloneError";
                                                updateError.message = "The data you are trying to update could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to update the data.";
                                            }

                                            if ((updateEx.INVALID_STATE_ERR && updateEx.code == updateEx.INVALID_STATE_ERR) || updateEx.name == "InvalidStateError") {
                                                updateError.type = "InvalidStateError";
                                                updateError.message = "You are trying to update data on a removed object store.";
                                            }

                                            linq2indexedDB.logging.logError(updateError);
                                            if (error.type != "TransactionInactiveError") {
                                                abortTransaction(txn);
                                            }
                                            pw.error(this, updateError);
                                        }
                                    },
                                    remove: function () {
                                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor remove", result, e);
                                        try {
                                            result["delete"]();
                                        }
                                        catch (deleteEx) {
                                            var deleteError = wrapException(deleteEx, "cursor - delete");

                                            if ((deleteEx.READ_ONLY_ERR && deleteEx.code == deleteEx.READ_ONLY_ERR) || deleteEx.name == "ReadOnlyError") {
                                                deleteError.type = "ReadOnlyError";
                                                deleteError.message = "You are trying to remove data in a readonly transaction.";
                                            }

                                            if (deleteEx.name == "TransactionInactiveError") {
                                                deleteError.type = "TransactionInactiveError";
                                                deleteError.message = "You are trying to remove data on an inactieve transaction. (The transaction was already aborted or committed)";
                                            }

                                            if ((deleteEx.INVALID_STATE_ERR && deleteEx.code == deleteEx.INVALID_STATE_ERR) || deleteEx.name == "InvalidStateError") {
                                                deleteError.type = "InvalidStateError";
                                                deleteError.message = "You are trying to remove data on a removed object store.";
                                            }

                                            linq2indexedDB.logging.logError(deleteError);
                                            if (error.type != "TransactionInactiveError") {
                                                abortTransaction(txn);
                                            }
                                            pw.error(this, deleteError);
                                        }
                                    }
                                };

                                pw.progress(this, [progressObj, result, e]);
                                returnData.push({ data: progressObj.data, key: progressObj.key });
                            }
                            result["continue"]();
                        });
                } catch (exception) {
                    var error = wrapException(exception, "cursor");

                    if ((exception.DATA_ERR && error.code == exception.DATA_ERR) || exception.name == "DataError") {
                        error.type = "DataError";
                        error.message = "The provided range parameter isn't a valid key or key range.";
                    }

                    if (exception.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to retrieve data on an inactieve transaction. (The transaction was already aborted or committed)";
                    }

                    if (exception.name == "TypeError") {
                        error.type = "TypeError";
                        error.message = "The provided directory parameter is invalid";
                    }

                    if ((exception.INVALID_STATE_ERR && exception.code == exception.INVALID_STATE_ERR) || (exception.NOT_ALLOWED_ERR && exception.code == exception.NOT_ALLOWED_ERR) || exception.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to insert data on a removed object store.";
                    }
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            keyCursor: function (pw, index, range, direction) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor Started", index, range, direction);
                var returnData = [];
                var txn = index.objectStore.transaction;

                try {
                    var request;
                    var keyRange = range;

                    if (!keyRange) {
                        keyRange = core.keyRange.lowerBound(0);
                    }

                    // direction can not be null when passed.
                    if (direction) {
                        request = handlers.IDBCursorRequest(index.openKeyCursor(keyRange, direction));
                    } else {
                        request = handlers.IDBCursorRequest(index.openKeyCursor(keyRange));
                    }

                    request.then(function (args /*result, e*/) {
                        var e = args[1];

                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor completed", returnData, txn, e);
                        pw.complete(this, [returnData, txn, e]);
                    },
                        function (args /*error, e*/) {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "keyCursor error", args);
                            pw.error(this, args);
                        },
                        function (args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor progress", result, e);
                            if (result.value) {
                                var progressObj = {
                                    data: result.value,
                                    key: result.primaryKey,
                                    skip: function (number) {
                                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor skip", result, e);
                                        try {
                                            result.advance(number);
                                        }
                                        catch (advanceEx) {
                                            var advanceErr = wrapException(advanceEx, "keyCursor - skip");

                                            if ((advanceEx.DATA_ERR && advanceEx.code == advanceEx.DATA_ERR) || advanceEx.name == "DataError") {
                                                advanceErr.type = "DataError";
                                                advanceErr.message = "The provided range parameter isn't a valid key or key range.";
                                            }

                                            if (advanceEx.name == "TypeError") {
                                                advanceErr.type = "TypeError";
                                                advanceErr.message = "The provided count parameter is zero or a negative number.";
                                            }

                                            if ((advanceEx.INVALID_STATE_ERR && advanceEx.code == advanceEx.INVALID_STATE_ERR) || advanceEx.name == "InvalidStateError") {
                                                advanceErr.type = "InvalidStateError";
                                                advanceErr.message = "You are trying to skip data on a removed object store.";
                                            }
                                            linq2indexedDB.logging.logError(advanceErr);
                                            abortTransaction(index.objectStore.transaction);
                                            pw.error(this, advanceErr);
                                        }
                                    },
                                    update: function (obj) {
                                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor update", result, e);
                                        try {
                                            result.update(obj);
                                        }
                                        catch (updateEx) {
                                            var updateError = wrapException(updateEx, "keyCursor - update");

                                            if ((updateEx.DATA_ERR && updateEx.code == updateEx.DATA_ERR) || updateEx.name == "DataError") {
                                                updateError.type = "DataError";
                                                updateError.message = "The underlying object store uses in-line keys and the property in value at the object store's key path does not match the key in this cursor's position.";
                                            }

                                            if ((updateEx.READ_ONLY_ERR && updateEx.code == updateEx.READ_ONLY_ERR) || updateEx.name == "ReadOnlyError") {
                                                updateError.type = "ReadOnlyError";
                                                updateError.message = "You are trying to update data in a readonly transaction.";
                                            }

                                            if (updateEx.name == "TransactionInactiveError") {
                                                updateError.type = "TransactionInactiveError";
                                                updateError.message = "You are trying to update data on an inactieve transaction. (The transaction was already aborted or committed)";
                                            }

                                            if ((updateEx.DATA_CLONE_ERR && updateEx.code == updateEx.DATA_CLONE_ERR) || updateEx.name == "DataCloneError") {
                                                updateError.type = "DataCloneError";
                                                updateError.message = "The data you are trying to update could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to update the data.";
                                            }

                                            if ((updateEx.INVALID_STATE_ERR && updateEx.code == updateEx.INVALID_STATE_ERR) || updateEx.name == "InvalidStateError") {
                                                updateError.type = "InvalidStateError";
                                                updateError.message = "You are trying to update data on a removed object store.";
                                            }

                                            linq2indexedDB.logging.logError(updateError);
                                            if (error.type != "TransactionInactiveError") {
                                                abortTransaction(txn);
                                            }
                                            pw.error(this, updateError);
                                        }
                                    },
                                    remove: function () {
                                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor remove", result, e);
                                        try {
                                            result["delete"]();
                                        }
                                        catch (deleteEx) {
                                            var deleteError = wrapException(deleteEx, "keyCursor - delete");

                                            if ((deleteEx.READ_ONLY_ERR && deleteEx.code == deleteEx.READ_ONLY_ERR) || deleteEx.name == "ReadOnlyError") {
                                                deleteError.type = "ReadOnlyError";
                                                deleteError.message = "You are trying to remove data in a readonly transaction.";
                                            }

                                            if (deleteEx.name == "TransactionInactiveError") {
                                                deleteError.type = "TransactionInactiveError";
                                                deleteError.message = "You are trying to remove data on an inactieve transaction. (The transaction was already aborted or committed)";
                                            }

                                            if ((deleteEx.INVALID_STATE_ERR && deleteEx.code == deleteEx.INVALID_STATE_ERR) || deleteEx.name == "InvalidStateError") {
                                                deleteError.type = "InvalidStateError";
                                                deleteError.message = "You are trying to remove data on a removed object store.";
                                            }

                                            linq2indexedDB.logging.logError(deleteError);
                                            if (error.type != "TransactionInactiveError") {
                                                abortTransaction(txn);
                                            }
                                            pw.error(this, deleteError);
                                        }
                                    }
                                };

                                pw.progress(this, [progressObj, result, e]);
                                returnData.push(progressObj.data);
                            }
                            result["continue"]();
                        });
                } catch (exception) {
                    var error = wrapException(exception, "keyCursor");

                    if ((exception.DATA_ERR && error.code == exception.DATA_ERR) || exception.name == "DataError") {
                        error.type = "DataError";
                        error.message = "The provided range parameter isn't a valid key or key range.";
                    }

                    if (exception.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to retrieve data on an inactieve transaction. (The transaction was already aborted or committed)";
                    }

                    if (exception.name == "TypeError") {
                        error.type = "TypeError";
                        error.message = "The provided directory parameter is invalid";
                    }

                    if ((exception.INVALID_STATE_ERR && exception.code == exception.INVALID_STATE_ERR) || (exception.NOT_ALLOWED_ERR && exception.code == exception.NOT_ALLOWED_ERR) || exception.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to insert data on a removed object store.";
                    }
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            get: function (pw, source, key) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Get Started", source);

                try {
                    handlers.IDBRequest(source.get(key)).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];
                        var transaction = source.transaction || source.objectStore.transaction;

                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Get completed", result, transaction, e);
                        pw.complete(this, [result, transaction, e]);
                    }, function (args /*error, e*/) {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Get error", args);
                        pw.error(this, args);
                    });
                } catch (ex) {
                    var txn = source.transaction || source.objectStore.transaction;
                    var error = wrapException(ex, "get");

                    if (error.code == ex.DATA_ERR || ex.name == "DataError") {
                        error.type = "DataError";
                        error.message = "The provided key isn't a valid key (must be an array, string, date or number).";
                    }

                    if (ex.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to retrieve data on an inactieve transaction. (The transaction was already aborted or committed)";
                    }

                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to retrieve data on a removed object store.";
                    }
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            count: function (pw, source, key) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Count Started", source);

                try {
                    var req;

                    if (key) {
                        req = source.count(key);
                    }
                    else {
                        req = source.count();
                    }

                    handlers.IDBRequest(req).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];
                        var transaction = source.transaction || source.objectStore.transaction;

                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Count completed", result, transaction, e);
                        pw.complete(this, [result, transaction, e]);
                    }, function (args /*error, e*/) {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Count error", args);
                        pw.error(this, args);
                    });
                } catch (ex) {
                    var txn = source.transaction || source.objectStore.transaction;
                    var error = wrapException(ex, "count");

                    if (error.code == ex.DATA_ERR || ex.name == "DataError") {
                        error.type = "DataError";
                        error.message = "The provided key isn't a valid key or keyRange.";
                    }

                    if (ex.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to count data on an inactieve transaction. (The transaction was already aborted or committed)";
                    }

                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to count data on a removed object store.";
                    }
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            getKey: function (pw, index, key) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "GetKey Started", index, key);

                try {
                    handlers.IDBRequest(index.getKey(key)).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "GetKey completed", result, index.objectStore.transaction, e);
                        pw.complete(this, [result, index.objectStore.transaction, e]);
                    }, function (args /*error, e*/) {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "GetKey error", args);
                        pw.error(this, args);
                    });
                } catch (ex) {
                    var error = wrapException(ex, "getKey");
                    var txn = index.objectStore.transaction;

                    if (error.code == ex.DATA_ERR || ex.name == "DataError") {
                        error.type = "DataError";
                        error.message = "The provided key isn't a valid key or keyRange.";
                    }

                    if (ex.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to getKey data on an inactieve transaction. (The transaction was already aborted or committed)";
                    }

                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to getKey data on a removed object store.";
                    }
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            insert: function (pw, objectStore, data, key) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Insert Started", objectStore, data, key);
                try {
                    var req;

                    if (key /*&& !store.keyPath*/) {
                        req = handlers.IDBRequest(objectStore.add(data, key));
                    } else {
                        /*if (key) linq2indexedDB.logging.log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                        req = handlers.IDBRequest(objectStore.add(data));
                    }

                    req.then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        // Add key to the object if a keypath exists
                        if (objectStore.keyPath) {
                            data[objectStore.keyPath] = result;
                        }

                        core.dbDataChanged.fire({ type: dataEvents.dataInserted, data: data, objectStore: objectStore });
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Insert completed", data, result, objectStore.transaction, e);
                        pw.complete(this, [data, result, objectStore.transaction, e]);
                    }, function (args /*error, e*/) {
                        var err = wrapError(args[1], "insert");

                        // Fix for firefox & chrome
                        if (args[1].target && args[1].target.errorCode == 4) {
                            err.type = "ConstraintError";
                        }

                        if (err.type == "ConstraintError") {
                            var duplicateKey = key;
                            if (!duplicateKey && objectStore.keyPath) {
                                duplicateKey = data[objectStore.keyPath];
                            }
                            err.message = "A record for the key (" + duplicateKey + ") already exists in the database or one of the properties of the provided data has a unique index declared.";
                        }
                        abortTransaction(objectStore.transaction);
                        linq2indexedDB.logging.logError(err);
                        pw.error(this, err);
                    });
                } catch (ex) {
                    var error = wrapException(ex, "insert");
                    var txn = objectStore.transaction;

                    if (error.code == ex.DATA_ERR || ex.name == "DataError") {
                        error.type = "DataError";
                        var possibleKey = key;
                        if (!possibleKey && objectStore.keyPath) {
                            possibleKey = data[objectStore.keyPath];
                        }
                        if (!possibleKey) {
                            error.message = "There is no key provided for the data you want to insert for an object store without autoIncrement.";
                        } else if (key && objectStore.keyPath) {
                            error.message = "An external key is provided while the object store expects a keyPath key.";
                        } else if (typeof possibleKey !== "string"
                            && typeof possibleKey !== "number"
                            && typeof possibleKey !== "Date"
                            && !linq2indexedDB.util.isArray(possibleKey)) {
                            error.message = "The provided key isn't a valid key (must be an array, string, date or number).";
                        }
                    }

                    if ((ex.READ_ONLY_ERR && ex.code == ex.READ_ONLY_ERR) || ex.name == "ReadOnlyError") {
                        error.type = "ReadOnlyError";
                        error.message = "You are trying to insert data in a readonly transaction.";
                    }

                    if (ex.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to insert data on an inactieve transaction. (The transaction was already aborted or committed)";
                    }

                    if ((ex.DATA_CLONE_ERR && ex.code == ex.DATA_CLONE_ERR) || ex.name == "DataCloneError") {
                        error.type = "DataCloneError";
                        error.message = "The data you are trying to insert could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to insert the data.";
                    }

                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to insert data on a removed object store.";
                    }
                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            update: function (pw, objectStore, data, key) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Update Started", objectStore, data, key);

                try {
                    var req;
                    if (key /*&& !store.keyPath*/) {
                        req = handlers.IDBRequest(objectStore.put(data, key));
                    } else {
                        /*if (key) linq2indexedDB.logging.log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                        req = handlers.IDBRequest(objectStore.put(data));
                    }
                    req.then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        if (objectStore.keyPath && data[objectStore.keyPath] === undefined) {
                            data[objectStore.keyPath] = result;
                        }

                        core.dbDataChanged.fire({ type: dataEvents.dataUpdated, data: data, objectStore: objectStore });
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Update completed", data, result, objectStore.transaction, e);
                        pw.complete(this, [data, result, objectStore.transaction, e]);
                    }, function (args /*error, e*/) {
                        var err = wrapError(args[1], "update");
                        abortTransaction(objectStore.transaction);
                        linq2indexedDB.logging.logError(err);
                        pw.error(this, err);
                    });
                } catch (ex) {
                    var error = wrapException(ex, "update");
                    var txn = objectStore.transaction;

                    if (error.code == ex.DATA_ERR || ex.name == "DataError") {
                        error.type = "DataError";
                        var possibleKey = key;
                        if (!possibleKey && objectStore.keyPath) {
                            possibleKey = data[objectStore.keyPath];
                        }
                        if (!possibleKey) {
                            error.message = "There is no key provided for the data you want to update for an object store without autoIncrement.";
                        } else if (key && objectStore.keyPath) {
                            error.message = "An external key is provided while the object store expects a keyPath key.";
                        } else if (typeof possibleKey !== "string"
                            && typeof possibleKey !== "number"
                            && typeof possibleKey !== "Date"
                            && !linq2indexedDB.util.isArray(possibleKey)) {
                            error.message = "The provided key isn't a valid key (must be an array, string, date or number).";
                        }
                    }

                    if ((ex.READ_ONLY_ERR && ex.code == ex.READ_ONLY_ERR) || ex.name == "ReadOnlyError") {
                        error.type = "ReadOnlyError";
                        error.message = "You are trying to update data in a readonly transaction.";
                    }

                    if (ex.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to update data on an inactieve transaction. (The transaction was already aborted or committed)";
                    }

                    if ((ex.DATA_CLONE_ERR && ex.code == ex.DATA_CLONE_ERR) || ex.name == "DataCloneError") {
                        error.type = "DataCloneError";
                        error.message = "The data you are trying to update could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to update the data.";
                    }

                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to update data on a removed object store.";
                    }

                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            remove: function (pw, objectStore, key) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Remove Started", objectStore, key);

                try {
                    handlers.IDBRequest(objectStore["delete"](key)).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        core.dbDataChanged.fire({ type: dataEvents.dataRemoved, data: key, objectStore: objectStore });
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Remove completed", result, objectStore.transaction, e);
                        pw.complete(this, [result, objectStore.transaction, e]);
                    },
                        function (args /*error, e*/) {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Remove error", args);
                            pw.error(this, args);
                        });
                } catch (ex) {
                    var error = wrapException(ex, "delete");
                    var txn = objectStore.transaction;

                    if ((ex.READ_ONLY_ERR && ex.code == ex.READ_ONLY_ERR) || ex.name == "ReadOnlyError") {
                        error.type = "ReadOnlyError";
                        error.message = "You are trying to remove data in a readonly transaction.";
                    }

                    if (ex.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to remove data on an inactieve transaction. (The transaction was already aborted or committed)";
                    }

                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to remove data on a removed object store.";
                    }

                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            clear: function (pw, objectStore) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Clear Started", objectStore);
                try {
                    handlers.IDBRequest(objectStore.clear()).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        core.dbDataChanged.fire({ type: dataEvents.objectStoreCleared, objectStore: objectStore });
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Clear completed", result, objectStore.transaction, e);
                        pw.complete(this, [result, objectStore.transaction, e]);
                    },
                        function (args /*error, e*/) {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Clear error", args);
                            pw.error(this, args);
                        });
                } catch (ex) {
                    var error = wrapException(ex, "clear");
                    var txn = objectStore.transaction;

                    if ((ex.READ_ONLY_ERR && ex.code == ex.READ_ONLY_ERR) || ex.name == "ReadOnlyError") {
                        error.type = "ReadOnlyError";
                        error.message = "You are trying to clear data in a readonly transaction.";
                    }

                    if (ex.name == "TransactionInactiveError") {
                        error.type = "TransactionInactiveError";
                        error.message = "You are trying to clear data on an inactieve transaction. (The transaction was already aborted or committed)";
                    }

                    if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError") {
                        error.type = "InvalidStateError";
                        error.message = "You are trying to clear data on a removed object store.";
                    }

                    linq2indexedDB.logging.logError(error);
                    if (error.type != "TransactionInactiveError") {
                        abortTransaction(txn);
                    }
                    pw.error(this, error);
                }
            },
            deleteDb: function (pw, name) {
                try {
                    if (typeof (window.indexedDB.deleteDatabase) != "undefined") {

                        handlers.IDBBlockedRequest(window.indexedDB.deleteDatabase(name)).then(function (args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            core.dbStructureChanged.fire({ type: dbEvents.databaseRemoved });
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Delete Database Promise completed", result, e, name);
                            pw.complete(this, [result, e, name]);
                        }, function (args /*error, e*/) {
                            var error = args[0];
                            var e = args[1];

                            // added for FF, If a db gets deleted that doesn't exist an errorCode 6 ('NOT_ALLOWED_ERR') is given
                            if (e.currentTarget && e.currentTarget.errorCode == 6) {
                                core.dbStructureChanged.fire({ type: dbEvents.databaseRemoved });
                                pw.complete(this, [error, e, name]);
                            } else if (implementation == implementations.SHIM
                                && e.message == "Database does not exist") {
                                core.dbStructureChanged.fire({ type: dbEvents.databaseRemoved });
                                pw.complete(this, [error, e, name]);
                            } else {
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Delete Database Promise error", error, e);
                                pw.error(this, [error, e]);
                            }
                        }, function (args /*result, e*/) {
                            if (args[0] == "blocked") {
                                core.dbStructureChanged.fire({ type: dbEvents.databaseBlocked });
                            }
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Delete Database Promise blocked", args /*result*/);
                            pw.progress(this, args /*[result, e]*/);
                        });
                    } else {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Delete Database function not found", name);
                        // Workaround for older versions of chrome and FireFox
                        // Doesn't delete the database, but clears him
                        core.db(name, -1).then(function (args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            core.dbStructureChanged.fire({ type: dbEvents.databaseRemoved });
                            pw.complete(this, [result, e, name]);
                        },
                            function (args /*error, e*/) {
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Clear Promise error", args /*error, e*/);
                                pw.error(this, args /*[error, e]*/);
                            },
                            function (args /*dbConnection, event*/) {
                                var dbConnection = args[0];
                                var event = args[1];

                                // When an upgradeneeded event is thrown, create the non-existing object stores
                                if (event.type == "upgradeneeded") {
                                    for (var i = 0; i < dbConnection.objectStoreNames.length; i++) {
                                        core.deleteObjectStore(dbConnection.txn, dbConnection.objectStoreNames[i]);
                                    }
                                    closeConnection(dbConnection);
                                }
                            });
                    }
                } catch (ex) {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.exception, "Delete Database Promise exception", ex);
                    pw.error(this, [ex.message, ex]);
                }
            }
        };

        var core = {
            db: function (name, version) {
                return linq2indexedDB.promises.promise(function (pw) {
                    async.db(pw, name, version);
                });
            },
            transaction: function (db, objectStoreNames, transactionType, autoGenerateAllowed) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (db.then) {
                        db.then(function (args /*db, e*/) {
                            // Timeout necessary for letting it work on win8. If not, progress event triggers before listeners are coupled
                            if (isMetroApp) {
                                setTimeout(function () {
                                    async.transaction(pw, args[0], objectStoreNames, transactionType, autoGenerateAllowed);
                                }, 1);
                            } else {
                                async.transaction(pw, args[0], objectStoreNames, transactionType, autoGenerateAllowed);
                            }
                        },
                            function (args /*error, e*/) {
                                pw.error(this, args);
                            },
                            function (args /**/) {
                                pw.progress(this, args);
                            });
                    } else {
                        if (isMetroApp) {
                            // Timeout necessary for letting it work on win8. If not, progress event triggers before listeners are coupled
                            setTimeout(function () {
                                async.transaction(pw, db, objectStoreNames, transactionType, autoGenerateAllowed);
                            }, 1);
                        } else {
                            async.transaction(pw, db, objectStoreNames, transactionType, autoGenerateAllowed);
                        }
                    }
                });
            },
            objectStore: function (transaction, objectStoreName) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (transaction.then) {
                        transaction.then(function (/*txn, e*/) {
                            // transaction completed
                            // TODO: what todo in this case?
                        }, function (args /*error, e*/) {
                            pw.error(this, args);
                        }, function (args /*txn, e*/) {
                            async.objectStore(pw, args[0], objectStoreName);
                        });
                    } else {
                        async.objectStore(pw, transaction, objectStoreName);
                    }
                });
            },
            createObjectStore: function (transaction, objectStoreName, objectStoreOptions) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (transaction.then) {
                        transaction.then(function (/*txn, e*/) {
                            // txn completed
                            // TODO: what todo in this case?
                        },
                            function (args /*error, e*/) {
                                // txn error or abort
                                pw.error(this, args);
                            },
                            function (args /*txn, e*/) {
                                async.createObjectStore(pw, args[0], objectStoreName, objectStoreOptions);
                            });
                    } else {
                        async.createObjectStore(pw, transaction, objectStoreName, objectStoreOptions);
                    }
                });
            },
            deleteObjectStore: function (transaction, objectStoreName) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (transaction.then) {
                        transaction.then(function (/*txn, e*/) {
                            // txn completed
                            // TODO: what todo in this case?
                        }, function (args /*error, e*/) {
                            // txn error
                            pw.error(this, args);
                        },
                            function (args /*txn, e*/) {
                                async.deleteObjectStore(pw, args[0], objectStoreName);
                            });
                    } else {
                        async.deleteObjectStore(pw, transaction, objectStoreName);
                    }
                });
            },
            index: function (objectStore, propertyName, autoGenerateAllowed) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (objectStore.then) {
                        objectStore.then(function (args /*txn, objectStore*/) {
                            async.index(pw, args[1], propertyName, autoGenerateAllowed);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        async.index(pw, objectStore, propertyName, autoGenerateAllowed);
                    }
                });
            },
            createIndex: function (objectStore, propertyName, indexOptions) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (objectStore.then) {
                        objectStore.then(function (args/*txn, objectStore*/) {
                            async.createIndex(pw, args[1], propertyName, indexOptions);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        async.createIndex(pw, objectStore, propertyName, indexOptions);
                    }
                });
            },
            deleteIndex: function (objectStore, propertyName) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (objectStore.then) {
                        objectStore.then(function (args/*txn, objectStore*/) {
                            async.deleteIndex(pw, args[1], propertyName);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        async.deleteIndex(pw, objectStore, propertyName);
                    }
                });
            },
            cursor: function (source, range, direction) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (source.then) {
                        source.then(function (args /*txn, source*/) {
                            async.cursor(pw, args[1], range, direction);
                        }, function (args /*error, e*/) {
                            // store or index error
                            pw.error(this, args);
                        });
                    } else {
                        async.cursor(pw, source, range, direction);
                    }
                });
            },
            keyCursor: function (index, range, direction) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (index.then) {
                        index.then(function (args /*txn, index, store*/) {
                            async.keyCursor(pw, args[1], range, direction);
                        }, function (args /*error, e*/) {
                            // index error
                            pw.error(this, args);
                        });
                    } else {
                        async.keyCursor(pw, index, range, direction);
                    }
                });
            },
            get: function (source, key) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (source.then) {
                        source.then(function (args /*txn, source*/) {
                            async.get(pw, args[1], key);
                        }, function (args /*error, e*/) {
                            // store or index error
                            pw.error(this, args);
                        });
                    } else {
                        async.get(pw, source, key);
                    }
                });
            },
            count: function (source, key) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (source.then) {
                        source.then(function (args /*txn, source*/) {
                            async.count(pw, args[1], key);
                        }, function (args /*error, e*/) {
                            // store or index error
                            pw.error(this, args);
                        });
                    } else {
                        async.count(pw, source, key);
                    }
                });
            },
            getKey: function (index, key) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (index.then) {
                        index.then(function (args /*txn, index, objectStore*/) {
                            async.getKey(pw, args[1], key);
                        }, function (args /*error, e*/) {
                            // index error
                            pw.error(this, args);
                        });
                    } else {
                        async.getKey(pw, index, key);
                    }
                });
            },
            insert: function (objectStore, data, key) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (objectStore.then) {
                        objectStore.then(function (args /*txn, store*/) {
                            async.insert(pw, args[1], data, key);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        async.insert(pw, objectStore, data, key);
                    }
                });
            },
            update: function (objectStore, data, key) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (objectStore.then) {
                        objectStore.then(function (args /*txn, store*/) {
                            async.update(pw, args[1], data, key);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        async.update(pw, objectStore, data, key);
                    }
                });
            },
            remove: function (objectStore, key) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (objectStore.then) {
                        objectStore.then(function (args /*txn, store*/) {
                            async.remove(pw, args[1], key);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        async.remove(pw, objectStore, key);
                    }
                });
            },
            clear: function (objectStore) {
                return linq2indexedDB.promises.promise(function (pw) {
                    if (objectStore.then) {
                        objectStore.then(function (args /*txn, store*/) {
                            async.clear(pw, args[1]);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    } else {
                        async.clear(pw, objectStore);
                    }
                });
            },
            deleteDb: function (name) {
                return linq2indexedDB.promises.promise(function (pw) {
                    async.deleteDb(pw, name);
                });
            },
            closeDatabaseConnection: closeConnection,
            abortTransaction: abortTransaction,
            transactionTypes: transactionTypes,
            dbStructureChanged: new linq2indexedDB.Event(),
            dbDataChanged: new linq2indexedDB.Event(),
            databaseEvents: dbEvents,
            dataEvents: dataEvents,
            implementation: implementation,
            implementations: implementations,
            indexSuffix: "_Index",
            keyRange: window.IDBKeyRange
        };

        // Region Functions

        function getDatabaseVersion(db) {
            var dbVersion = parseInt(db.version);
            if (isNaN(dbVersion) || dbVersion < 0) {
                return 0;
            } else {
                return dbVersion;
            }
        }

        function wrapException(exception, method) {
            return {
                code: exception.code,
                severity: linq2indexedDB.logging.severity.exception,
                orignialError: exception,
                method: method,
                type: "unknown"
            };
        }

        function wrapError(error, method) {
            return {
                severity: linq2indexedDB.logging.severity.error,
                orignialError: error,
                type: (error.target && error.target.error && error.target.error.name) ? error.target.error.name : "unknown",
                method: method
            };
        }

        function closeConnection(target) {
            var db;
            if (target instanceof window.IDBCursor) {
                target = target.source;
            }

            if (target instanceof window.IDBDatabase) {
                db = target;
            } else if (target instanceof window.IDBTransaction) {
                db = target.db;
            } else if (target instanceof window.IDBObjectStore || target instanceof window.IDBRequest) {
                db = target.transaction.db;
            } else if (target instanceof window.IDBIndex) {
                db = target.objectStore.transaction.db;
            }

            if (typeof (db) !== "undefined" && db != null && typeof (db.close) != "undefined") {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Close database Connection: ", db);
                db.close();
            }
        };

        function abortTransaction (transaction) {
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Abort transaction: " + transaction);
            // Calling the abort, blocks the database in IE10
            if (implementation != implementations.MICROSOFT) {
                transaction.abort();
                closeConnection(transaction);
            }
        }

        function initializeIndexedDb() {
            if (typeof(window) === "undefined") {
                return implementations.NONE;
            }

            if (window.indexedDB) {
                // Necessary for chrome native implementation
                if (!window.IDBObjectStore && window.webkitIDBObjectStore) { window.IDBObjectStore = window.webkitIDBObjectStore; }
                if (!window.IDBRequest && window.webkitIDBRequest) { window.IDBRequest = window.webkitIDBRequest; }

                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Native implementation", window.indexedDB);
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

                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "FireFox Initialized", window.indexedDB);
                    return implementations.MOZILLA;
                }

                // Initialising the window.indexedDB Object for Chrome
                else if (window.webkitIndexedDB) {
                    if (!window.indexedDB) { window.indexedDB = window.webkitIndexedDB; }
                    if (!window.IDBCursor) { window.IDBCursor = window.webkitIDBCursor; }
                    if (!window.IDBDatabase) { window.IDBDatabase = window.webkitIDBDatabase; } //if (!window.IDBDatabaseError) window.IDBDatabaseError = window.webkitIDBDatabaseError
                    if (!window.IDBDatabaseException) { window.IDBDatabaseException = window.webkitIDBDatabaseException; }
                    if (!window.IDBFactory) { window.IDBFactory = window.webkitIDBFactory; }
                    if (!window.IDBIndex) { window.IDBIndex = window.webkitIDBIndex; }
                    if (!window.IDBKeyRange) { window.IDBKeyRange = window.webkitIDBKeyRange; }
                    if (!window.IDBObjectStore) { window.IDBObjectStore = window.webkitIDBObjectStore; }
                    if (!window.IDBRequest) { window.IDBRequest = window.webkitIDBRequest; }
                    if (!window.IDBTransaction) { window.IDBTransaction = window.webkitIDBTransaction; }
                    if (!window.IDBOpenDBRequest) { window.IDBOpenDBRequest = window.webkitIDBOpenDBRequest; }
                    if (typeof window.IDBTransaction.READ_ONLY === "number"
                        && typeof window.IDBTransaction.READ_WRITE === "number"
                        && typeof window.IDBTransaction.VERSION_CHANGE === "number") {
                        transactionTypes.READ_ONLY = window.IDBTransaction.READ_ONLY;
                        transactionTypes.READ_WRITE = window.IDBTransaction.READ_WRITE;
                        transactionTypes.VERSION_CHANGE = window.IDBTransaction.VERSION_CHANGE;
                    }

                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Chrome Initialized", window.indexedDB);
                    return implementations.GOOGLE;
                }

                // Initialiseing the window.indexedDB Object for IE 10 preview 3+
                else if (window.msIndexedDB) {
                    window.indexedDB = window.msIndexedDB;

                    transactionTypes.READ_ONLY = 0;
                    transactionTypes.READ_WRITE = 1;
                    transactionTypes.VERSION_CHANGE = 2;

                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "IE10+ Initialized", window.indexedDB);
                    return implementations.MICROSOFT;
                }

                // Initialising the window.indexedDB Object for IE 8 & 9
                else if (navigator.appName == 'Microsoft Internet Explorer') {
                    try {
                        window.indexedDB = new ActiveXObject("SQLCE.Factory.4.0");
                        window.indexedDBSync = new ActiveXObject("SQLCE.FactorySync.4.0");
                    } catch (ex) {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Initializing IE prototype exception", ex);
                    }

                    if (window.JSON) {
                        window.indexedDB.json = window.JSON;
                        window.indexedDBSync.json = window.JSON;
                    } else {
                        var jsonObject = {
                            parse: function (txt) {
                                if (txt === "[]") { return []; }
                                if (txt === "{}") { return {}; }
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

                    window.IDBKeyRange.only = function (value) {
                        return window.indexedDB.range.only(value);
                    };

                    window.IDBKeyRange.leftBound = function (bound, open) {
                        return window.indexedDB.range.lowerBound(bound, open);
                    };

                    window.IDBKeyRange.rightBound = function (bound, open) {
                        return window.indexedDB.range.upperBound(bound, open);
                    };

                    window.IDBKeyRange.bound = function (left, right, openLeft, openRight) {
                        return window.indexedDB.range.bound(left, right, openLeft, openRight);
                    };

                    window.IDBKeyRange.lowerBound = function (left, openLeft) {
                        return window.IDBKeyRange.leftBound(left, openLeft);
                    };

                    return implementations.MICROSOFTPROTOTYPE;
                }

                else {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Your browser doesn't support indexedDB.");
                    return implementations.NONE;
                }
            }
        };

        function deferredHandler(handler, request) {
            return linq2indexedDB.promises.promise(function (pw) {
                try {
                    handler(pw, request);
                } catch (e) {
                    e.type = "exception";
                    pw.error(request, [e.message, e]);
                }
                finally {
                    request = null;
                }
            });
        };

// ReSharper disable InconsistentNaming
        function IDBSuccessHandler(pw, request) {
// ReSharper restore InconsistentNaming
            request.onsuccess = function (e) {
                pw.complete(e.target, [e.target.result, e]);
            };
        };

// ReSharper disable InconsistentNaming
        function IDBErrorHandler(pw, request) {
// ReSharper restore InconsistentNaming
            request.onerror = function (e) {
                if (e) {
                    pw.error(e.target, [e.target.errorCode, e]);
                }
                else {
                    pw.error(this, [this, this]);
                }
            };
        };

// ReSharper disable InconsistentNaming
        function IDBAbortHandler(pw, request) {
// ReSharper restore InconsistentNaming
            request.onabort = function (e) {
                if (e) {
                    pw.error(e.target, [e.target.errorCode, e]);
                }
                else {
                    pw.error(this, [this, this]);
                }
            };
        };

// ReSharper disable InconsistentNaming
        function IDBVersionChangeHandler(pw, request) {
// ReSharper restore InconsistentNaming
            request.onversionchange = function (e) {
                pw.progress(e.target, [e.target.result, e]);
            };
        };

// ReSharper disable InconsistentNaming
        function IDBCompleteHandler(pw, request) {
// ReSharper restore InconsistentNaming
            request.oncomplete = function (e) {
                if (!e) {
                    pw.complete(this, [this]);
                }
                else {
                    pw.complete(e.target, [e.target, e]);
                }
            };
        };

// ReSharper disable InconsistentNaming
        function IDBRequestHandler(pw, request) {
// ReSharper restore InconsistentNaming
            IDBSuccessHandler(pw, request);
            IDBErrorHandler(pw, request);
        };

// ReSharper disable InconsistentNaming
        function IDBCursorRequestHandler(pw, request) {
// ReSharper restore InconsistentNaming
            request.onsuccess = function (e) {
                if (!e.target.result) {
                    pw.complete(e.target, [e.target.result, e]);
                } else {
                    pw.progress(e.target, [e.target.result, e]);
                }
            };
            IDBErrorHandler(pw, request);
        };

// ReSharper disable InconsistentNaming
        function IDBBlockedRequestHandler(pw, request) {
// ReSharper restore InconsistentNaming
            IDBRequestHandler(pw, request);
            request.onblocked = function (e) {
                pw.progress(e.target, ["blocked", e]);
            };
        };

// ReSharper disable InconsistentNaming
        function IDBOpenDbRequestHandler(pw, request) {
// ReSharper restore InconsistentNaming
            IDBBlockedRequestHandler(pw, request);
            request.onupgradeneeded = function (e) {
                pw.progress(e.target, [e.target.transaction, e]);
            };
        };

// ReSharper disable InconsistentNaming
        function IDBDatabaseHandler(pw, database) {
// ReSharper restore InconsistentNaming
            IDBAbortHandler(pw, database);
            IDBErrorHandler(pw, database);
            IDBVersionChangeHandler(pw, database);
        };

// ReSharper disable InconsistentNaming
        function IDBTransactionHandler(pw, txn) {
// ReSharper restore InconsistentNaming
            IDBCompleteHandler(pw, txn);
            IDBAbortHandler(pw, txn);
            IDBErrorHandler(pw, txn);
        };

        linq2indexedDB.core = core;

    })(win, linq2indexedDB, typeof Windows !== "undefined");
//}