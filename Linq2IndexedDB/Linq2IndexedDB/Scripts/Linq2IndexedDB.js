/// <reference path="../Scripts/jquery-1.7.1.js" />
/// <reference path="../Scripts/jquery-1.7.1-vsdoc.js" />
/// <reference path="../Scripts/Sort.js"

(function (window, $) {
    /// <param name="$" type="jQuery" />
    "use strict";
    if (typeof Windows == "undefined" && typeof ($) !== "function") {
        // no jQuery!
        throw "linq2indexedDB: no WinJS or JQuery found. Please ensure jQuery is referenced before the linq2indexedDB.js file.";
    }

    if (typeof ($) === "function" && !$.Deferred) {
        // no jQuery!
        throw "linq2indexedDB: jQuery Deferred functionality not found. Please ensure jQuery 1.7 is referenced before the linq2indexedDB.js file.";
    }

    if (!window.JSON) {
        // no JSON!
        throw "linq2indexedDB: No JSON parser found. Please ensure json2.js is referenced before the linq2indexedDB.js file if you need to support clients without native JSON parsing support, e.g. IE<8.";
    }

    var linq2indexedDB,
    events = {},
    implementations = {
        NONE: 0,
        NATIVE: 1,
        MICROSOFT: 2,
        MOZILLA: 3,
        GOOGLE: 4,
        MICROSOFTPROTOTYPE: 5
    },
    enableLogging = false,
    log = function () {
        if (typeof (window.console) === "undefined" || !enableLogging) {
            return false;
        }
        return window.console.log.apply(console, arguments);
    },
    implementation = initializeIndexedDB(),
    connectionCounter = 0,
    connections = [],
    defaultDatabaseName = "Default",
    sortFileLocation = "../Scripts/Sort.js",
    whereFileLocation = "../Scripts/Where.js";

    function initializeIndexedDB() {
        if (window.indexedDB) {
            log("Native implementation", window.indexedDB);
            return implementations.NATIVE;
        }
        else {
            // Initialising the window.indexedDB Object for FireFox
            if (window.mozIndexedDB) {
                window.indexedDB = window.mozIndexedDB;

                log("FireFox Initialized", window.indexedDB);
                return implementations.MOZILLA;
            }

                // Initialising the window.indexedDB Object for Chrome
            else if (window.webkitIndexedDB) {
                if (!window.indexedDB) window.indexedDB = window.webkitIndexedDB;
                if (!window.IDBCursor) window.IDBCursor = webkitIDBCursor
                if (!window.IDBDatabase) window.IDBDatabase = webkitIDBDatabase
                if (!window.IDBDatabaseError) window.IDBDatabaseError = webkitIDBDatabaseError
                if (!window.IDBDatabaseException) window.IDBDatabaseException = webkitIDBDatabaseException
                if (!window.IDBFactory) window.IDBFactory = webkitIDBFactory
                if (!window.IDBIndex) window.IDBIndex = webkitIDBIndex
                if (!window.IDBKeyRange) window.IDBKeyRange = webkitIDBKeyRange
                if (!window.IDBObjectStore) window.IDBObjectStore = webkitIDBObjectStore
                if (!window.IDBRequest) window.IDBRequest = webkitIDBRequest
                if (!window.IDBTransaction) window.IDBTransaction = webkitIDBTransaction

                log("Chrome Initialized", window.indexedDB);
                return implementations.GOOGLE;
            }

                    // Initialiseing the window.indexedDB Object for IE 10 preview 3+
            else if (window.msIndexedDB) {
                window.indexedDB = window.msIndexedDB;

                log("IE10+ Initialized", window.indexedDB);
                return implementations.MICROSOFT;
            }

                    // Initialising the window.indexedDB Object for IE 8 & 9
            else if (navigator.appName == 'Microsoft Internet Explorer') {
                try {
                    window.indexedDB = new ActiveXObject("SQLCE.Factory.4.0");
                    window.indexedDBSync = new ActiveXObject("SQLCE.FactorySync.4.0");
                }
                catch (ex) {
                    log("Initializing IE prototype exception", ex);
                }

                if (window.JSON) {
                    window.indexedDB.json = window.JSON;
                    window.indexedDBSync.json = window.JSON;
                } else {
                    var jsonObject = {
                        parse: function (txt) {
                            if (txt === "[]") return [];
                            if (txt === "{}") return {};
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
                log("Your browser doesn't support indexedDB.");
                return implementations.NONE;
            }
        }
    };

    function JSONComparer(propertyName, descending) {
        return {
            sort: function (valueX, valueY) {
                if (descending) {
                    return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? -1 : 1));
                }
                else {
                    return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? 1 : -1));
                }
            }
        }
    };

    var linq2indexedDB = function (name, configuration, logging) {
        /// <summary>Creates a new or opens an existing database for the given name</summary>
        /// <param name="name" type="String">The name of the database</param>
        /// <param name="configuration" type="Object">
        ///     [Optional] provide comment
        /// </param>
        /// <param name="logging" type="Boolean">
        ///     [Optional] A flag indicating whether connection logging is enabled to the browser
        ///     console/log. Defaults to false.
        /// </param>
        /// <returns type="linq2indexedDB" />

        var dbConfig = {
            name: name ? name : defaultDatabaseName,
            autoGenerateAllowed: true
        };

        if (configuration) {
            if (configuration.version) {
                dbConfig.version = configuration.version
            }
            // From the moment the configuration is provided by the developper, autoGeneration isn't allowed.
            // If this would be allowed, the developper wouldn't be able to determine what to do for which version.
            if (configuration.schema) {
                var version = dbConfig.version || -1;
                for (key in configuration.schema) {
                    version = version > key ? version : key;
                }
                if (version > -1) {
                    dbConfig.autoGenerateAllowed = false;
                    dbConfig.version = version;
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

        enableLogging = logging;

        return {
            linq: linq(dbConfig),
            initialize: function () {
                log("Initialize Started");
                return promiseWrapper(function (pw) {
                    linq2indexedDB.core.db(dbConfig.name, dbConfig.version).then(function (args /*db*/) {
                        var db = args[0];

                        log("Close dbconnection");
                        db.close();
                        log("Initialize Succesfull");
                        pw.complete();
                    }
                    , pw.error
                    , function (args /*txn, e*/) {
                        var txn = args[0];
                        var e = args[1];
                        if (e.type == "upgradeneeded") {
                            if (dbConfig.onupgradeneeded) {
                                dbConfig.onupgradeneeded(txn, e.oldVersion, e.newVersion);
                            }
                            if (dbConfig.oninitializeversion || dbConfig.schema || dbConfig.definition) {
                                for (var version = e.oldVersion + 1; version <= e.newVersion; version++) {
                                    if (dbConfig.schema) {
                                        dbConfig.schema[version](txn)
                                    }
                                    if (dbConfig.definition) {
                                        var versionDefinition = getVersionDefinition(version, dbConfig.definition)
                                        InitializeVersion(txn, versionDefinition);
                                    }
                                    else if (dbConfig.oninitializeversion) {
                                        dbConfig.oninitializeversion(txn, version);
                                    }
                                }
                            }
                        }
                    });
                });
            },
            deleteDatabase: function () {
                return promiseWrapper(function (pw) {
                    linq2indexedDB.core.deleteDb(dbConfig.name).then(function () {
                        pw.complete();
                    }
                    , pw.error);
                });
            }
        };
    }

    window.linq2indexedDB = linq2indexedDB;

    if ($) {
        $.linq2indexedDB = linq2indexedDB;
    }

    linq2indexedDB.prototype.core = linq2indexedDB.core = core();

    linq2indexedDB.prototype.utilities = linq2indexedDB.utilities = {
        self: function (context, args) {
            return promiseWrapper(function (pw) {
                pw.complete(context, args);
            });
        },
        sort: function (data, propertyName, descending) {
            return promiseWrapper(function (pw) {
                var worker = new Worker(sortFileLocation);
                worker.onmessage = function (event) {
                    pw.complete(this, event.data)
                };
                worker.onerror = pw.error;
                worker.postMessage({ data: data, propertyName: propertyName, descending: descending });
            })
        },
        where: function (data, clause) {
            return promiseWrapper(function (pw) {
                var worker = new Worker(whereFileLocation);
                worker.onmessage = function (event) {
                    pw.complete(this, event.data)
                };
                worker.onerror = pw.error;
                worker.postMessage({ data: data, clause: clause });
            })
        }
    };

    function core() {
        function deferredHandler(handler, request) {
            return promiseWrapper(function (pw) {
                try {
                    handler(pw, request);
                } catch (e) {
                    e.type = "exception";
                    pw.error(request, [e.message, e]);
                }
            });
        };

        function IDBSuccessHandler(pw, request) {
            request.onsuccess = function (e) {
                pw.complete(request, [request.result, e]);
            };
        };

        function IDBErrorHandler(pw, request) {
            request.onerror = function (e) {
                pw.error(request, [request.errorCode, e]);
            };
        };

        function IDBAbortHandler(pw, request) {
            request.onabort = function (e) {
                pw.error(request, [request.errorCode, e]);
            };
        };

        function IDBVersionChangeHandler(pw, request) {
            request.onversionchange = function (e) {
                pw.progress(request, [request.result, e]);
            };
        };

        function IDBCompleteHandler(pw, request) {
            request.oncomplete = function (e) {
                pw.complete(request, [request, e]);
            }
        };

        function IDBRequestHandler(pw, request) {
            IDBSuccessHandler(pw, request);
            IDBErrorHandler(pw, request);
        };

        function IDBCursorRequestHandler(pw, request) {
            request.onsuccess = function (e) {
                if (!request.result) {
                    pw.complete(request, [request.result, e]);
                }
                else {
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
        }

        function IDBOpenDBRequestHandler(pw, request) {
            IDBBlockedRequestHandler(pw, request);
            request.onupgradeneeded = function (e) {
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

        var handlers = {
            IDBRequest: function (request) {
                return deferredHandler(IDBRequestHandler, request);
            },
            IDBBlockedRequest: function (request) {
                return deferredHandler(IDBBlockedRequestHandler, request);
            },
            IDBOpenDBRequest: function (request) {
                return deferredHandler(IDBOpenDBRequestHandler, request);
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

        var promise = {
            db: function (name, version) {
                return promiseWrapper(function (pw) {
                    internal.db(pw, name, version);
                });
            },
            transaction: function (db, objectStoreNames, transactionType, autoGenerateAllowed) {
                return promiseWrapper(function (pw){
                    if(db.then){
                        db.then(function(args /*db, e*/){
                            internal.transaction(pw, args[0], objectStoreNames, transactionType, autoGenerateAllowed);
                        },
                        function (args /*error, e*/){
                            pw.error(this, args);
                        },
                        function (args /**/){
                            pw.progress(this, args)
                        });
                    }
                    else{
                        internal.transaction(pw, db, objectStoreNames, transactionType, autoGenerateAllowed);
                    }
                });
            },
            objectStore: function (transaction, objectStoreName) {
                return promiseWrapper(function (pw) {
                    if(transaction.then){
                        transaction.then(function (args /*txn, e*/) {
                            // transaction completed
                            // TODO: what todo in this case?
                        }, function (args /*error, e*/) {
                            pw.error(this, args);
                        }, function (args /*txn, e*/) {
                            internal.objectStore(pw, args[0], objectStoreName);
                        });
                    }
                    else{
                        internal.objectStore(pw, transaction, objectStoreName);
                    }
                })
            },
            createObjectStore: function (transaction, objectStoreName, objectStoreOptions) {
                return promiseWrapper(function (pw) {
                    if(transaction.then){
                        transaction.then(function (args/*txn, e*/) {
                            // txn completed
                            // TODO: what todo in this case?
                        },
                        function (args /*error, e*/) {
                            // txn error or abort
                            pw.error(this, args);
                        },
                        function (args /*txn, e*/) {
                            internal.createObjectStore(pw, args[0], objectStoreName, objectStoreOptions);
                        });
                    }
                    else{
                        internal.createObjectStore(pw, transaction, objectStoreName, objectStoreOptions);
                    }
                })
            },
            deleteObjectStore: function (transaction, objectStoreName) {
                return promiseWrapper(function (pw) {
                    if(transaction.then){
                        changeDatabaseStructurePromise.then(function (args /*txn, e*/) {
                            // txn completed
                            // TODO: what todo in this case?
                        }, function (args /*error, e*/) {
                            // txn error
                            pw.error(this, args);
                        },
                        function (args /*txn, e*/) {
                            internal.deleteObjectStore(pw, args[0], objectStoreName);
                        });
                    }
                    else{
                        internal.deleteObjectStore(pw, transaction, objectStoreName); 
                    }
                })
            },
            index: function (objectStore, propertyName, autoGenerateAllowed) {
                return promiseWrapper(function (pw) {
                    if(objectStore.then){
                        objectStore.then(function (args /*txn, objectStore*/) {
                            internal.index(pw, args[1], propertyName, autoGenerateAllowed);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.index(pw, objectStore, propertyName, autoGenerateAllowed);
                    }
                })
            },
            createIndex: function (objectStore, propertyName, indexOptions) {
                return promiseWrapper(function (pw) {
                    if(objectStore.then){
                        objectStore.then(function (args/*txn, objectStore*/) {
                            internal.createIndex(pw, args[1], propertyName, indexOptions);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.createIndex(pw, objectStore, propertyName, indexOptions);
                    }
                })
            },
            deleteIndex: function (objectStore, propertyName) {
                return promiseWrapper(function (pw) {
                    if(objectStore.then){
                        objectStore.then(function (args/*txn, objectStore*/) {
                            internal.deleteIndex(pw, args[1], propertyName);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.deleteIndex(pw, objectStore, propertyName);
                    }
                })
            },
            cursor: function (source, range, direction) {
                return promiseWrapper(function (pw) {
                    if(source.then){
                        source.then(function (args /*txn, source*/) {
                            internal.cursor(pw, args[1], range, direction);
                        }, function (args /*error, e*/) {
                            // store or index error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.cursor(pw, source, range, direction);
                    }
                })
            },
            keyCursor: function (index, range, direction) {
                return promiseWrapper(function (pw) {
                    if(index.then){
                        index.then(function (args /*txn, index, store*/) {
                            internal.keyCursor(pw, args[1], range, direction);
                        }, function (args /*error, e*/) {
                            // index error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.keyCursor(pw, index, range, direction);
                    }
                })
            },
            get: function (source, key) {
                return promiseWrapper(function (pw) {
                    if(source.then){
                        source.then(function (args /*txn, source*/) {
                            internal.get(pw, args[1], key);
                        }, function (args /*error, e*/) {
                            // store or index error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.get(pw, source, key);
                    }
                })
            },
            getKey: function (index, key) {
                return promiseWrapper(function (pw) {
                    if(index.then){
                        index.then(function (args /*txn, index, objectStore*/) {
                            internal.getKey(pw, args[1], key);
                        }, function (args /*error, e*/) {
                            // index error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.getKey(pw, index, key);
                    }
                })
            },
            insert: function (objectStore, data, key) {
                return promiseWrapper(function (pw) {
                    if(objectStore.then){
                        objectStore.then(function (args /*txn, store*/) {
                            internal.insert(pw, args[1], data, key);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.insert(pw, objectStore, data, key);
                    }
                })
            },
            update: function (objectStore, data, key) {
                return promiseWrapper(function (pw) {
                    if(objectStore.then){
                        objectStore.then(function (args /*txn, store*/) {
                            internal.update(pw, args[1], data, key);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.update(pw, objectStore, data, key);
                    }
                })
            },
            remove: function (objectStore, key) {
                return promiseWrapper(function (pw) {
                    if(objectStore.then){
                        objectStore.then(function (args /*txn, store*/) {
                            internal.remove(pw, args[1], key);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.remove(pw, objectStore, key);
                    }
                })
            },
            clear: function (objectStore) {
                return promiseWrapper(function (pw) {
                    if(objectStore.then){
                        objectStore.then(function (args /*txn, store*/) {
                            internal.clear(pw, args[1]);
                        }, function (args /*error, e*/) {
                            // store error
                            pw.error(this, args);
                        });
                    }
                    else{
                        internal.clear(pw, objectStore);
                    }
                })
            },
            deleteDb: function (name) {
                return promiseWrapper(function (pw) {
                    internal.deleteDb(pw, name);
                });
            },
            closeDatabaseConnection: function (db) {
                log("Close database Connection: ", db);
                db.close();
            },
            abortTransaction: function (transaction) {
                log("Abort transaction: " + transaction);
                // Calling the abort, blocks the database in IE10
                if (implementation != implementations.MICROSOFT) {
                    transaction.abort();
                    promise.closeDatabaseConnection(transaction.db);
                }
            },
        };

        var internal = {
            db: function (pw, name, version) {
                try {
                    // Initializing defaults
                    var req;
                    name = name ? name : defaultDatabaseName;

                    // Creating a new database conection
                    if (version) {
                        log("db opening", name, version);
                        req = handlers.IDBOpenDBRequest(window.indexedDB.open(name, version));
                    }
                    else {
                        log("db opening", name);
                        req = handlers.IDBOpenDBRequest(window.indexedDB.open(name));
                    }

                    // Handle the events of the creation of the database connection
                    req.then(
                        function (args /*db, e*/) {
                            var db = args[0];
                            var e = args[1];
                            // Database connection established

                            // Handle the events on the database.
                            handlers.IDBDatabase(db).then(
                                function (args1 /*result, event*/) {
                                    // No done present.
                                },
                                function (args1/*error, event*/) {
                                    // Database error or abort
                                    promise.closeDatabaseConnection(db);
                                    // When an error occures the result will already be resolved. This way calling the reject won't case a thing
                                },
                                function (args1 /*result, event*/) {
                                var event = args1[1];
                                if (event) {
                                    // Sending a notify won't have any effect because the result is already resolved. There is nothing more to do than close the current connection.
                                    if (event.type === "versionchange") {
                                        if (event.version != db.version) {
                                            // If the version is changed and the current version is different from the requested version, the connection needs to get closed.
                                            promise.closeDatabaseConnection(db);
                                        }
                                    }
                                }
                            });

                            var currentVersion = internal.getDatabaseVersion(db);
                            if (currentVersion < version || (version == -1)) {
                                // Current version deferres from the requested version, database upgrade needed
                                log("DB Promise upgradeneeded", this, db, e, db.connectionId);
                                internal.changeDatabaseStructure(db, version).then(
                                    function (args1 /*txn, event*/) {
                                        var txn = args1[0];
                                        var event = args1[1];

                                        // Fake the onupgrade event.
                                        var context = req;
                                        context.transaction = txn;

                                        var upgardeEvent = event;
                                        upgardeEvent.type = "upgradeneeded";
                                        upgardeEvent.newVersion = version;
                                        upgardeEvent.oldVersion = currentVersion;

                                        pw.progress(context, [txn, upgardeEvent]);

                                        handlers.IDBTransaction(txn).then(function (args2 /*trans, args*/) {
                                            // When the new version is completed, close the db connection, and make a new connection.
                                            promise.closeDatabaseConnection(txn.db);
                                            promise.db(name).then(function (arg3 /*dbConnection, ev*/) {
                                                // Connection resolved
                                                pw.complete(this, args3);
                                            },
                                            function (args3 /*err, ev*/) {
                                                // Database connection error or abort
                                                pw.error(this, args3);
                                            },
                                            function (args3 /*dbConnection, ev*/) {
                                                // Database upgrade or blocked
                                                pw.progress(this, args3);
                                            });
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
                                    pw.progress(this, args1);
                                });
                            }
                            else {
                                // Database Connection resolved.
                                log("DB Promise resolved", db, e);
                                pw.complete(this, [db, e]);
                            }
                        },
                        function (args /*error, e*/) {
                            // Database connection error or abort
                            log("DB Promise rejected", args[0], args[1]);
                            pw.error(this, args);
                        },
                        function (args /*result, e*/) {
                        // Database upgrade + db blocked
                        pw.progress(this, args);
                    }
                    );
                }
                catch (ex) {
                    log("DB exception", this, ex.message, ex);
                    pw.error(this, [ex.message, ex]);
                }
            },
            transaction: function (pw, db, objectStoreNames, transactionType, autoGenerateAllowed) {
                log("Transaction promise started", db, objectStoreNames, transactionType);

                // Initialize defaults
                if (!isArray(objectStoreNames)) objectStoreNames = [objectStoreNames];
                transactionType = transactionType || IDBTransaction.READ_ONLY;

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
                        var version = internal.getDatabaseVersion(db) + 1
                        var dbName = db.name;
                        log("Transaction database upgrade needed: ", db);
                        // Closing the current connections so it won't block the upgrade.
                        promise.closeDatabaseConnection(db);
                        // Open a new connection with the new version
                        promise.db(dbName, version).then(function (args /*dbConnection, event*/) {
                            // When the upgrade is completed, the transaction can be opened.
                            promise.transaction(args[0], objectStoreNames, transactionType, autoGenerateAllowed).then(function (args1 /*txn, ev*/) {
                                // txn completed
                                pw.complete(this, args1);
                            },
                            function (args1 /*error, ev*/) {
                                // txn error or abort
                                pw.error(this, args1);
                            },
                            function (args1 /*txn*/) {
                                // txn created
                                pw.progress(this, args1);
                            });
                        },
                        function (args /*error, event*/) {
                            // When an error occures, bubble up.
                            pw.error(this, args);
                        },
                        function (args /*txn, event*/) {
                            var event = args[1];

                            // When an upgradeneeded event is thrown, create the non-existing object stores
                            if (event.type == "upgradeneeded") {
                                for (var j = 0; j < nonExistingObjectStores.length; j++) {
                                    promise.createObjectStore(args[0], nonExistingObjectStores[j]);
                                }
                            }
                        });
                    }
                    else {
                        // If no non-existing object stores are found, create the transaction.
                        var txn = db.transaction(objectStoreNames, transactionType);

                        // Handle transaction events
                        handlers.IDBTransaction(txn).then(function (args /*result, event*/) {
                            // txn completed
                            pw.complete(this, args);
                        },
                        function (args /*err, event*/) {
                            // txn error or abort
                            pw.error(this, args);
                        });

                        // txn created
                        log("Transaction transaction created.", txn);
                        pw.progress(txn, [txn]);
                    }
                }
                catch (ex) {
                    log("Transaction exception", ex, db);
                    ex.type = "exception";
                    pw.error(this, [ex.message, ex]);
                }
            },
            changeDatabaseStructure: function(db, version) {
                log("changeDatabaseStructure started", db, version);
                handlers.IDBBlockedRequest(setVersion(version)).then(function (args /*txn, event*/) {
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
            },
            objectStore: function (pw, transaction, objectStoreName) {
                log("objectStore started", transaction, objectStoreName);
                try {
                    var store = transaction.objectStore(objectStoreName);
                    log("objectStore completed", transaction, store);
                    pw.complete(store, [transaction, store]);
                }
                catch (ex) {
                    log("objectStore exception", ex, transaction);
                    promise.abortTransaction(transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            createObjectStore: function (pw, transaction, objectStoreName, objectStoreOptions) {
                log("createObjectStore started", transaction, objectStoreName, objectStoreOptions);
                try {
                    if (!transaction.db.objectStoreNames.contains(objectStoreName)) {
                        // If the object store doesn't exists, create it
                        var options = new Object();

                        if (objectStoreOptions) {
                            if (objectStoreOptions.keyPath) options.keyPath = objectStoreOptions.keyPath;
                            options.autoIncrement = objectStoreOptions.autoIncrement;
                        }
                        else {
                            options.autoIncrement = true;
                        }

                        var store = transaction.db.createObjectStore(objectStoreName, options, options.autoIncrement);

                        log("ObjectStore Created", transaction, store);
                        pw.complete(store, [transaction, store]);
                    }
                    else {
                        // If the object store exists, retrieve it
                        promise.objectStore(transaction, objectStoreName).then(function (args /*trans, store*/) {
                            // store resolved
                            log("ObjectStore Found", args[1], objectStoreName);
                            log("createObjectStore Promise", args[0], args[1]);
                            pw.complete(store, args);
                        }, 
                        function (args /*error, event*/) {
                            // store error
                            pw.error(this, args);
                        });
                    }
                }
                catch (ex) {
                    // store exception
                    log("createObjectStore Exception", ex);
                    promise.abortTransaction(transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            deleteObjectStore: function (pw, transaction, objectStoreName) {
                log("deleteObjectStore Promise started", transaction, objectStoreName);
                try {
                    if (transaction.db.objectStoreNames.contains(objectStoreName)) {
                        // store found, delete it
                        transaction.db.deleteObjectStore(objectStoreName)
                        log("ObjectStore Deleted", objectStoreName);
                        log("deleteObjectStore completed", objectStoreName);
                        pw.complete(this, [transaction, objectStoreName]);
                    }
                    else {
                        // store not found, return error
                        log("ObjectStore Not Found", objectStoreName);
                        pw.error(this, ["ObjectStore Not Found" + objectStoreName]);
                    }
                }
                catch (ex) {
                    // store exception
                    log("deleteObjectStore exception", ex);
                    promise.abortTransaction(transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            index: function (pw, objectStore, propertyName, autoGenerateAllowed) {
                log("Index started", objectStore, propertyName, autoGenerateAllowed)
                try {
                    if (objectStore.indexNames.contains(propertyName + "-index")) {
                        // If index exists, resolve it
                        var index = objectStore.index(propertyName + "-index");
                        log("Index completed", objectStore.transaction, index, objectStore);
                        pw.complete(this, [objectStore.transaction, index, objectStore]);
                    }
                    else if (autoGenerateAllowed) {
                        // If index doesn't exists, create it if autoGenerateAllowed
                        var version = internal.getDatabaseVersion(objectStore.transaction.db) + 1
                        var dbName = objectStore.transaction.db.name;
                        var transactionType = objectStore.transaction.mode;
                        var objectStoreNames = [objectStore.name] //transaction.objectStoreNames;
                        var objectStoreName = objectStore.name;
                        // Close the currenct database connections so it won't block
                        promise.closeDatabaseConnection(objectStore.transaction.db);

                        // Open a new connection with the new version
                        promise.db(dbName, version).then(function (args /*dbConnection, event*/) {
                            // When the upgrade is completed, the index can be resolved.
                            promise.transaction(args[0], objectStoreNames, transactionType, autoGenerateAllowed).then(function (args1 /*transaction, ev*/) {
                                // txn completed
                                // TODO: what to do in this case
                            },
                            function (args1 /*error, ev*/) {
                                // txn error or abort
                                pw.error(this, args1);
                            },
                            function (args1 /*transaction*/) {
                                // txn created
                                promise.index(promise.objectStore(args1[0], objectStoreName), propertyName).then(function (args2 /*trans, index, store*/) {
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
                                promise.createIndex(promise.objectStore(trans, objectStore.name), propertyName).then(function (args1 /*index, store, transaction*/) {
                                    // index created
                                },
                                function (args1 /*error, ev*/) {
                                    // When an error occures, bubble up.
                                    pw.error(this, args1);
                                });
                            }
                        });
                    }
                }
                catch (ex) {
                    // index exception
                    log("Exception index", ex);
                    promise.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            createIndex: function (pw, objectStore, propertyName, indexOptions) {
                log("createIndex started", objectStore, propertyName, indexOptions)
                try {
                    var index = objectStore.createIndex(propertyName + "-index", propertyName, { unique: indexOptions ? indexOptions.unique : false/*, multirow: indexOptions ? indexOptions.multirow : false*/ });
                    log("createIndex compelted", objectStore.transaction, index, objectStore);
                    pw.complete(this, [objectStore.transaction, index, objectStore]);
                }
                catch (ex) {
                    log("createIndex Failed", ex);
                    promise.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            deleteIndex: function (pw, objectStore, propertyName) {
                log("deleteIndex started", objectStore, propertyName)
                try {
                    objectStore.deleteIndex(propertyName + "-index");

                    log("deleteIndex completed", objectStore.transaction, propertyName, objectStore);
                    pw.complete(this, [objectStore.transaction, propertyName, objectStore]);
                }
                catch (ex) {
                    log("deleteIndex Failed", ex);
                    promise.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            cursor: function (pw, source, range, direction) {
                log("Cursor Promise Started", source);

                try{
                    var returnData = [];

                    handlers.IDBCursorRequest(source.openCursor(range || IDBKeyRange.lowerBound(0), direction)).then(function (args1 /*result, e*/) {
                        var result = args1[0];
                        var e = args1[1];
                        var txn = source.transaction || source.objectStore.transaction;

                        log("Cursor completed", returnData, txn, e);
                        pw.complete(this, [returnData, txn, e]);
                    },
                    function (args /*error, e*/) {
                        log("Cursor error", args);
                        pw.error(this, args);
                    },
                    function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        log("Cursor progress", result, e);
                        if (result.value) {
                            pw.progress(this, [result.value, e]);
                            returnData.push(result.value);
                        }
                        result["continue"]();
                    });
                }
                catch (ex) {
                    var txn = source.transaction || source.objectStore.transaction;
                    // cursor exception
                    log("Exception cursor", ex);
                    promise.abortTransaction(txn);
                    pw.error(this, [ex.message, ex]);
                }
            },
            keyCursor: function (pw, index, range, direction) {
                log("keyCursor Started", index, range, direction);
                var returnData = [];

                try{
                    handlers.IDBRequest(index.openKeyCursor(range || IDBKeyRange.lowerBound(0), direction)).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        log("keyCursor completed", returnData, index.objectStore.transaction, e);
                        pw.complete(this, [returnData, index.objectStore.transaction, e]);
                    },
                    function (args /*error, e*/) {
                        log("keyCursor error", args);
                        pw.error(this, args);
                    },
                    function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        log("keyCursor progress", result, e);
                        if (result.value) {
                            pw.progress(this, [result.value, e, txn]);
                            returnData.push(result.value);
                        }
                        result["continue"]();
                    });
                }
                catch (ex) {
                    // cursor exception
                    log("Exception keyCursor", ex);
                    promise.abortTransaction(index.objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            get: function (pw, source, key) {
                log("Get Started", source);

                try {
                    handlers.IDBRequest(source.get(key)).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];
                        var txn = source.transaction || source.objectStore.transaction;

                        log("Get completed", result, txn, e);
                        pw.complete(this, [result, txn, e]);
                    }, function (args /*error, e*/) {
                        log("Get error", args);
                        pw.error(this, args);
                    });
                }
                catch (ex) {
                    var txn = source.transaction || source.objectStore.transaction;
                    // get exception
                    log("Exception get", ex);
                    promise.abortTransaction(txn);
                    pw.error(this, [ex.message, ex]);
                }
            },
            getKey: function (pw, index, key) {
                log("GetKey Started", index, key);

                try{
                    handlers.IDBRequest(index.getKey(key)).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        log("GetKey completed", result, index.objectStore.transaction, e);
                        pw.complete(this, [result, index.objectStore.transaction, e]);
                    }, function (args /*error, e*/) {
                        log("GetKey error", args);
                        pw.error(this, args);
                    });
                }
                catch (ex) {
                    // getKey exception
                    log("Exception getKey", ex);
                    promise.abortTransaction(index.objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            insert: function (pw, objectStore, data, key) {
                log("Insert Started", objectStore, data, key);
                try {
                    var req;

                    if (key /*&& !store.keyPath*/) {
                        req = handlers.IDBRequest(objectStore.add(data, key));
                    }
                    else {
                        /*if (key) log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                        req = handlers.IDBRequest(objectStore.add(data));
                    }

                    req.then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        // Add key to the object if a keypath exists
                        if (objectStore.keyPath) {
                            data[objectStore.keyPath] = result;
                        }

                        log("Insert completed", data, objectStore.transaction, e);
                        pw.complete(this, [data, objectStore.transaction, e]);
                    }, function (args /*error, e*/) {
                        log("Insert error", args);
                        pw.error(this, args);
                    });
                }
                catch (ex) {
                    log("Insert exception", ex);
                    promise.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            update: function (pw, objectStore, data, key) {
                log("Update Started", objectStore, data, key);

                try {
                    var req;
                    if (key /*&& !store.keyPath*/) {
                        req = handlers.IDBRequest(objectStore.put(data, key));
                    }
                    else {
                        /*if (key) log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                        req = handlers.IDBRequest(objectStore.put(data));
                    }
                    req.then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        log("Update completed", data, objectStore.transaction, e);
                        pw.complete(this, [data, objectStore.transaction, e]);
                    }, function (args /*error, e*/) {
                        log("Update error", args);
                        pw.error(this, args);
                    });
                }
                catch (ex) {
                    log("Update exception", ex);
                    promise.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            remove: function (pw, objectStore, key) {
                log("Remove Started", objectStore, key);

                try {
                    handlers.IDBRequest(objectStore["delete"](key)).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        log("Remove completed", result, objectStore.transaction, e);
                        pw.complete(this, [result, objectStore.transaction, e]);
                    },
                    function (args /*error, e*/) {
                        log("Remove error", args);
                        pw.error(this, args);
                    });
                }
                catch (ex) {
                    log("Remove exception", ex);
                    promise.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            clear: function (pw, objectStore) {
                log("Clear Started", objectStore);
                try {
                    handlers.IDBRequest(objectStore.clear()).then(function (args /*result, e*/) {
                        var result = args[0];
                        var e = args[1];

                        log("Clear completed", result, objectStore.transaction, e);
                        pw.complete(this, [result, objectStore.transaction, e]);
                    },
                    function (args /*error, e*/) {
                        log("Clear error", args);
                        pw.error(this, args);
                    });
                }
                catch (ex) {
                    log("Clear exception", ex);
                    promise.abortTransaction(objectStore.transaction);
                    pw.error(this, [ex.message, ex]);
                }
            },
            deleteDb: function (pw, name) {
                try {
                    if (typeof (window.indexedDB.deleteDatabase) != "undefined") {

                        handlers.IDBBlockedRequest(window.indexedDB.deleteDatabase(name)).then(function (args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            log("Delete Database Promise completed", result, e, name);
                            pw.complete(this, [result, e, name]);
                        }, function (args /*error, e*/) {
                            var error = args[0];
                            var e = args[1];

                            // added for FF, If a db gets deleted that doesn't exist an errorCode 6 ('NOT_ALLOWED_ERR') is given
                            if (e.currentTarget.errorCode == 6) {
                                pw.complete(this, [error, e, name]);
                            }
                            else {
                                log("Delete Database Promise error", error, e);
                                pw.error(this, [error, e]);
                            }
                        }, function (args /*result, e*/) {

                            log("Delete Database Promise blocked", args /*result*/);
                            pw.progress(this, args /*[result, e]*/);
                        });
                    }
                    else {
                        log("Delete Database function not found", name);
                        // Workaround for older versions of chrome and FireFox
                        // Doesn't delete the database, but clears him
                        linq2indexedDB.core.db(name, -1).then(function (args /*result, e*/) {
                            var result = args[0];
                            var e = args[1];

                            pw.complete(this, [result, e, name]);
                        },
                        function (args /*error, e*/) {
                            log("Clear Promise error", args /*error, e*/);
                            pw.error(this, args /*[error, e]*/);
                        },
                        function (args /*dbConnection, event*/) {
                            var dbConnecetion = args[0];
                            var event = args[1];

                            // When an upgradeneeded event is thrown, create the non-existing object stores
                            if (event.type == "upgradeneeded") {
                                for (var i = 0; i < dbConnection.objectStoreNames.length; i++) {
                                    linq2indexedDB.core.deleteObjectStore(selfTransaction(this, [dbConnection.txn, event]), dbConnection.objectStoreNames[i]);
                                }
                                promise.closeDatabaseConnection(dbConnection);
                            }
                        });
                    }
                }
                catch (ex) {
                    log("Delete Database Promise exception", ex);
                    pw.error(this, [ex.message, ex]);
                }
            },
            getDatabaseVersion: function (db) {
                var dbVersion = parseInt(db.version);
                if (isNaN(dbVersion) || dbVersion < 0) {
                    return 0
                }
                else {
                    return dbVersion
                }
            },
            indexOf: function (array, value, propertyName) {
                for (var i = 0; i < array.length; i++) {
                    if (array[i][propertyName] == value[propertyName]) {
                        return i;
                    }
                }
                return -1;
            }
        };

        return promise;
    }

    function linq(dbConfig) {

        var queryBuilderObj = function (objectStoreName) {
            this.from = objectStoreName;
            this.where = [];
            this.select = [];
            this.orderBy = [];
            this.get = [];
            this.insert = [];
            this.update = [];
            this.remove = [];
            this.clear = false;
        };

        queryBuilderObj.prototype = {
            executeQuery: function () {
                executeQuery(this);
            }
        };

        var whereType = {
            equals: 0,
            between: 1,
            greaterThen: 2,
            smallerThen: 3,
            inArray: 4,
            like: 5
        };

        function from(queryBuilder, objectStoreName) {
            queryBuilder.from = objectStoreName
            return {
                where: function (propertyName, clause) {
                    return where(queryBuilder, propertyName, clause);
                },
                orderBy: function (propertyName) {
                    return orderBy(queryBuilder, propertyName, false);
                },
                orderByDesc: function (propertyName) {
                    return orderBy(queryBuilder, propertyName, true);
                },
                select: function (propertyNames) {
                    return select(queryBuilder, propertyNames);
                },
                insert: function (data, key) {
                    return insert(queryBuilder, data, key);
                },
                update: function (data, key) {
                    return update(queryBuilder, data, key);
                },
                remove: function (key) {
                    return remove(queryBuilder, key);
                },
                clear: function () {
                    return clear(queryBuilder);
                },
                get: function (key) {
                    return get(queryBuilder, key);
                }
            }
        }

        function where(queryBuilder, propertyName, clause) {
            if (clause) {
                if (clause.equals) {
                    return where(queryBuilder, propertyName).equals(clause.equals);
                }
                else if (clause.range) {
                    return where(queryBuilder, propertyName).Between(clause.range[0], clause.range[1], clause.range[2], clause.range[3]);
                }
                else if (clause.inArray) {
                    return where(queryBuilder, propertyName).inArray(clause.inArray);
                }
                else if (clause.like) {
                    return where(queryBuilder, propertyName).inArray(clause.like);
                }
                else {
                    return where(queryBuilder, propertyName);
                }
            }
            else {
                return {
                    equals: function (value) {
                        return whereClause(queryBuilder, { type: whereType.equals, propertyName: propertyName, value: value });
                    },
                    greaterThen: function (value, valueIncluded) {
                        var isValueIncluded = typeof (valueIncluded) === undefined ? false : valueIncluded;
                        return whereClause(queryBuilder, { type: whereType.greaterThen, propertyName: propertyName, value: value, valueIncluded: isValueIncluded });
                    },
                    smallerThen: function (value, valueIncluded) {
                        var isValueIncluded = typeof (valueIncluded) === undefined ? false : valueIncluded;
                        return whereClause(queryBuilder, { type: whereType.smallerThen, propertyName: propertyName, value: value, valueIncluded: isValueIncluded });
                    },
                    between: function (minValue, maxValue, minValueIncluded, maxValueIncluded) {
                        var isMinValueIncluded = typeof (minValueIncluded) === undefined ? false : minValueIncluded;
                        var isMasValueIncluded = typeof (maxValueIncluded) === undefined ? false : maxValueIncluded;
                        return whereClause(queryBuilder, { type: whereType.between, propertyName: propertyName, minValue: minValue, maxValue: maxValue, minValueIncluded: isMinValueIncluded, maxValueIncluded: isMasValueIncluded });
                    },
                    inArray: function (array) {
                        return whereClause(queryBuilder, { type: whereType.inArray, propertyName: propertyName, value: array });
                    },
                    like: function (value) {
                        return whereClause(queryBuilder, { type: whereType.like, propertyName: propertyName, value: value });
                    }
                }
            }
        }

        function whereClause(queryBuilder, clause) {
            queryBuilder.where.push(clause)
            return {
                and: function (propertyName, clause) {
                    return where(queryBuilder, propertyName, clause)
                },
                orderBy: function (propertyName) {
                    return orderBy(queryBuilder, propertyName, false);
                },
                orderByDesc: function (propertyName) {
                    return orderBy(queryBuilder, propertyName, true);
                },
                select: function (propertyNames) {
                    return select(queryBuilder, propertyNames);
                }
            }
        }

        function orderBy(queryBuilder, propertyName, descending) {
            queryBuilder.orderBy.push({ propertyName: propertyName, descending: descending });
            return {
                orderBy: function (propertyName) {
                    return orderBy(queryBuilder, propertyName, false);
                },
                orderByDesc: function (propertyName) {
                    return orderBy(queryBuilder, propertyName, true);
                },
                select: function (propertyNames) {
                    return select(queryBuilder, propertyNames);
                }
            }
        }

        function select(queryBuilder, propertyNames) {
            if (propertyNames) {
                if (!isArray(propertyNames)) {
                    propertyNames = [propertyNames]
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
            return /*promiseWrapperLinq*/promiseWrapper(function (pw) {
                var dbPromis = linq2indexedDB.core.db(dbConfig.name, dbConfig.version);

                dbPromis.then(function (args /* [db, event] */) {
                    if (queryBuilder.insert.length > 0) {
                        executeInsert(queryBuilder, pw, args[0]);
                    }
                    else if (queryBuilder.update.length > 0) {
                        executeUpdate(queryBuilder, pw, args[0]);
                    }
                    else if (queryBuilder.remove.length > 0) {
                        executeRemove(queryBuilder, pw, args[0]);
                    }
                    else if (queryBuilder.clear) {
                        executeClear(queryBuilder, pw, args[0]);
                    }
                    else if (queryBuilder.get.length > 0) {
                        executeGet(queryBuilder, pw, args[0]);
                    }
                    else {
                        executeRead(queryBuilder, pw, args[0]);
                    }
                }, pw.error
                , function (args /*txn, e*/) {
                    var txn = args[0];
                    var e = args[1];

                    if (e.type == "upgradeneeded") {
                        if (dbConfig.onupgradeneeded) {
                            dbConfig.onupgradeneeded(txn, e.oldVersion, e.newVersion);
                        }
                        if (dbConfig.oninitializeversion) {
                            for (var version = e.oldVersion + 1; version <= e.newVersion; version++) {
                                if (dbConfig.schema) {
                                    dbConfig.schema[version](txn)
                                }
                                if (dbConfig.definition) {
                                    var versionDefinition = getVersionDefinition(version, dbConfig.definition)
                                    InitializeVersion(txn, versionDefinition);
                                }
                                else if (dbConfig.oninitializeversion) {
                                    dbConfig.oninitializeversion(txn, version);
                                }
                            }
                        }
                    }
                });
            })
        }

        function executeGet(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_ONLY, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function (args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
            pw.error,
            function (args /* [transaction] */) {
                var getPromis = linq2indexedDB.core.get(linq2indexedDB.core.objectStore(args[0], queryBuilder.from), queryBuilder.get[0].key);
                getPromis.then(function (args /*data*/) {
                    pw.complete(this, args[0] /*[data]*/);
                }
                , pw.error);
            });
        }

        function executeClear(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function (args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
            pw.error,
            function (args /* [transaction] */) {
                var clearPromis = linq2indexedDB.core.clear(linq2indexedDB.core.objectStore(args[0], queryBuilder.from));
                clearPromis.then(function () {
                    pw.complete(this);
                }
                , pw.error);
            });
        }

        function executeRemove(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function (args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
            pw.error,
            function (args /* [transaction] */) {
                var removePromis = linq2indexedDB.core.remove(linq2indexedDB.core.objectStore(args[0], queryBuilder.from), queryBuilder.remove[0].key)
                removePromis.then(function () {
                    pw.complete(this, queryBuilder.remove[0].key /*[queryBuilder.remove[0].key]*/);
                }
                , pw.error);
            });
        }

        function executeUpdate(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function (args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
            pw.error,
            function (args /* [transaction] */) {
                var updatePromis = linq2indexedDB.core.update(linq2indexedDB.core.objectStore(args[0], queryBuilder.from), queryBuilder.update[0].data, queryBuilder.update[0].key);
                updatePromis.then(function (args /*storedData, storedkey*/) {
                    pw.complete(this, args[0] /*[storedData, storedkey]*/);
                }
                , pw.error);
            });
        }

        function executeInsert(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function (args /* [transaction] */) {
                var txn = args[0];
                txn.db.close();
            },
            pw.error,
            function (args /* [transaction] */) {
                var insertPromis = linq2indexedDB.core.insert(linq2indexedDB.core.objectStore(args[0], queryBuilder.from), queryBuilder.insert[0].data, queryBuilder.insert[0].key)
                insertPromis.then(function (args /*storedData, storedkey*/) {
                    pw.complete(this, args[0] /*[storedData, storedkey]*/);
                }
                , pw.error);
            });
        }

        function executeRead(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_ONLY, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function (args /* [txn] */) {
                var txn = args[0];
                txn.db.close();
            },
            pw.error,
            function (args /* [txn] */) {
                try{
                    var objPromise = linq2indexedDB.core.objectStore(args[0], queryBuilder.from);
                    var cursorPromis;
                    var whereClauses = [];
                    var returnData = [];

                    if (queryBuilder.where.length > 0) {
                        // Sorting the where clauses so the most restrictive ones are on top.
                        whereClauses = queryBuilder.where.sort(JSONComparer("type", false).sort);
                        // Only one condition can be passed to IndexedDB API
                        cursorPromis = determineCursorPromis(objPromise, whereClauses[0]);
                    }
                    else {
                        cursorPromis = determineCursorPromis(objPromise);
                    }

                    cursorPromis.then(
                        function (args /*data*/) {
                        var data = args[0];

                        function asyncForWhere(data, i) {
                            if (i < whereClauses.length) {
                                linq2indexedDB.utilities.where(data, whereClauses[i]).then(function (d) {
                                    asyncForWhere(d, ++i);
                                }, pw.error);
                            }
                            else {
                                asyncForSort(data, 0);
                            }
                        }

                        function asyncForSort(data, i) {
                            if (i < queryBuilder.orderBy.length) {
                                linq2indexedDB.utilities.sort(data, queryBuilder.orderBy[i].propertyName, queryBuilder.orderBy[i].descending).then(function (d, e) {
                                    asyncForSort(d, ++i);
                                }, pw.error);
                            }
                            else {
                                // No need to notify again if it allready happend in the onProgress method.
                                if (returnData.length == 0) {
                                    for (var j = 0; j < data.length; j++) {
                                        var obj = SelectData(data[j], queryBuilder.select)
                                        returnData.push(obj);
                                        pw.progress(this, obj /*[obj]*/);
                                    }
                                }
                                pw.complete(this, returnData /*[returnData]*/);
                            }
                        }

                        // Start at 1 because we allready executed the first clause
                        var start = 0;
                        if (whereClauses.length > 0 && (whereClauses[0].type == whereType.equals || whereClauses[0].type == whereType.between || whereClauses[0].type == whereType.smallerThen || whereClauses[0].type == whereType.greaterThen)) {
                            start = 1;
                        }
                        asyncForWhere(data, start);
                    }, 
                        pw.error, 
                        function (args /*data*/) {
                            var data = args[0];

                            // When there are no more where clauses to fulfill and the collection doesn't need to be sorted, the data can be returned.
                            // In the other case let the complete handle it.
                            if (whereClauses.length == 0 && queryBuilder.orderBy.length == 0) {
                                var obj = SelectData(data, queryBuilder.select)
                                returnData.push(obj);
                                pw.progress(this, obj /*[obj]*/);
                            }
                        }
                    );
                }
                catch (ex){
                    // Handle errors like an invalid keyRange.
                    linq2indexedDB.core.abortTransaction(args[0]);
                    pw.error(this, [ex.message, ex]);
                }
            });
        }

        function determineCursorPromis(objPromise, clause) {
            var cursorPromise;
            if (clause) {
                switch (clause.type) {
                    case whereType.equals:
                        cursorPromise = linq2indexedDB.core.cursor(linq2indexedDB.core.index(objPromise, clause.propertyName, dbConfig.autoGenerateAllowed), IDBKeyRange.only(clause.value));
                        break;
                    case whereType.between:
                        cursorPromise = linq2indexedDB.core.cursor(linq2indexedDB.core.index(objPromise, clause.propertyName, dbConfig.autoGenerateAllowed), IDBKeyRange.bound(clause.minValue, clause.maxValue, clause.minValueIncluded, clause.maxValueIncluded));
                        break;
                    case whereType.greaterThen:
                        cursorPromise = linq2indexedDB.core.cursor(linq2indexedDB.core.index(objPromise, clause.propertyName, dbConfig.autoGenerateAllowed), IDBKeyRange.lowerBound(clause.value, clause.valueIncluded));
                        break;
                    case whereType.smallerThen:
                        cursorPromise = linq2indexedDB.core.cursor(linq2indexedDB.core.index(objPromise, clause.propertyName, dbConfig.autoGenerateAllowed), IDBKeyRange.upperBound(clause.value, clause.valueIncluded));
                        break;
                    default:
                        cursorPromise = linq2indexedDB.core.cursor(objPromise);
                        break;
                }
            }
            else {
                cursorPromise = linq2indexedDB.core.cursor(objPromise);
            }

            return cursorPromise;
        }

        function SelectData(data, propertyNames) {
            if (propertyNames && propertyNames.length > 0) {
                if (!isArray(propertyNames)) {
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
            from: function (objectStoreName) {
                return from(new queryBuilderObj(objectStoreName), objectStoreName);
            }
        }
    };

    function getVersionDefinition(version, definitions) {
        var result;
        for (var i = 0; i < definitions.length; i++) {
            if (parseInt(definitions[i].version) == parseInt(version)) {
                result = definitions[i];
            }
        }
        return result;
    }

    function InitializeVersion(txn, definition) {
        try {
            if (definition.objectStores) {
                for (var i = 0; i < definition.objectStores.length; i++) {
                    var objectStoreDefinition = definition.objectStores[i];
                    if (objectStoreDefinition.remove) {
                        linq2indexedDB.core.deleteObjectStore(txn, objectStoreDefinition.name);
                    }
                    else {
                        linq2indexedDB.core.createObjectStore(txn, objectStoreDefinition.name, objectStoreDefinition.objectStoreOptions);
                    }
                }
            }

            if (definition.indexes) {
                for (var i = 0; i < definition.indexes.length; i++) {
                    var indexDefinition = definition.indexes[i];
                    if (indexDefinition.remove) {
                        linq2indexedDB.core.deleteIndex(linq2indexedDB.core.objectStore(txn, indexDefinition.objectStoreName), indexDefinition.propertyName);
                    }
                    else {
                        linq2indexedDB.core.createIndex(linq2indexedDB.core.objectStore(txn, indexDefinition.objectStoreName), indexDefinition.propertyName, indexDefinition.indexOptions);
                    }
                }
            }

            if (definition.defaultData) {
                for (var i = 0; i < definition.defaultData.length; i++) {
                    var defaultDataDefinition = definition.defaultData[i];
                    if (defaultDataDefinition.remove) {
                        linq2indexedDB.core.remove(linq2indexedDB.core.objectStore(txn, defaultDataDefinition.objectStoreName), defaultDataDefinition.key);
                    }
                    else {
                        linq2indexedDB.core.insert(linq2indexedDB.core.objectStore(txn, defaultDataDefinition.objectStoreName), defaultDataDefinition.data, defaultDataDefinition.key);
                    }
                }
            }
        }
        catch (ex) {
            log("initialize version exception: ", ex);
            linq2indexedDB.core.abortTransaction(txn);
        }
    }

    function selfTransaction(context, args) {
        return promiseWrapper(function (pw) {
            var txn = args[0];

            pw.progress(context, args);

            txn.oncomplete = function (args1 /*result, e*/) {
                pw.complete(this, args1 /*[result, e]*/);
            }
        })
    }

    function promiseWrapper(promise) {
        if (typeof Windows != "undefined") {
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
        else if (typeof ($) === "function" && $.Deferred) {
            return $.Deferred(function (dfd) {
                promise({
                    complete: function (context, args) {
                        dfd.resolveWith(context, [args]);
                    },
                    error: function (context, args) {
                        dfd.rejectWith(context, [args]);
                    },
                    progress: function (context, args) {
                        dfd.notifyWith(context, [args]);
                    }
                });
            }).promise();
        }
    }

    function isArray(array) {
        if (array instanceof Array) {
            return true;
        }
        else {
            return false;
        }
    }

})(window, window.jQuery);