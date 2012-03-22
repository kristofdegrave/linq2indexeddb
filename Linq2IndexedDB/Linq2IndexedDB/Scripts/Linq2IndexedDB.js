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
        if (typeof (window.console) === undefined || !enableLogging) {
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
                var version = dbConfig.version || - 1;
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
                    linq2indexedDB.core.db(dbConfig.name, dbConfig.version).then(function (db) {
                        log("Close dbconnection");
                        db.close();
                        log("Initialize Succesfull");
                        pw.complete();
                    }
                    , pw.error
                    , function(txn, e){
                        if(e.type == "upgradeneeded"){
                            if(dbConfig.onupgradeneeded){
                                dbConfig.onupgradeneeded(txn, e.oldVersion, e.newVersion);
                            }
                            if (dbConfig.oninitializeversion || dbConfig.schema || dbConfig.definition) {
                                for (var version = e.oldVersion + 1; version <= e.newVersion; version++) {
                                    if (dbConfig.schema) {
                                        dbConfig.schema[version](txn)
                                    } 
                                    if(dbConfig.definition){
                                        var versionDefinition = getVersionDefinition(version, dbConfig.definition)
                                        InitializeVersion(txn, versionDefinition);
                                    }
                                    else if(dbConfig.oninitializeversion) {
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
                    pw.complete(this, [event.data])
                };
                worker.onerror = pw.error;
                worker.postMessage({ data: data, propertyName: propertyName, descending: descending });
            })
        },
        where: function (data, clause) {
            return promiseWrapper(function (pw) {
                var worker = new Worker(whereFileLocation);
                worker.onmessage = function (event) {
                    pw.complete(this, [event.data])
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
        }

        function IDBSuccessHandler(pw, request) {
            request.onsuccess = function (e) {
                pw.complete(request, [request.result, e]);
            };
        }

        function IDBErrorHandler(pw, request) {
            request.onerror = function (e) {
                pw.error(request, [request.errorCode, e]);
            };
        }

        function IDBAbortHandler(pw, request) {
            request.onabort = function (e) {
                pw.error(request, [request.errorCode, e]);
            };
        }

        function IDBVersionChangeHandler(pw, request) {
            request.onversionchange = function (e) {
                pw.progress(request, [request.result, e]);
            };
        }

        function IDBCompleteHandler(pw, request) {
            request.oncomplete = function (e) {
                pw.complete(request, [request, e]);
            }
        }

        function IDBRequestHandler(pw, request) {
            IDBSuccessHandler(pw, request);
            IDBErrorHandler(pw, request);
        }

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
        }

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
        }

        function IDBDatabaseHandler(pw, database) {
            IDBAbortHandler(pw, database);
            IDBErrorHandler(pw, database);
            IDBVersionChangeHandler(pw, database);
        }

        function IDBTransactionHandler(pw, txn) {
            IDBCompleteHandler(pw, txn);
            IDBAbortHandler(pw, txn);
            IDBErrorHandler(pw, txn);
        }

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
        }

        var promise = {
            db: function (name, version) {
                return promiseWrapper(function (pw) {
                    try{
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
                            req = handlers.IDBRequest(window.indexedDB.open(name));
                        }

                        // Handle the events of the creation of the database connection
                        req.then(function (db, e) {
                            // Database connection established

                            // Handle the events on the database.
                            handlers.IDBDatabase(db).then(function (result, event) {
                                // No done present.
                            },
                            function (error, event) {
                                // Database error or abort
                                closeDatabaseConnection(db);

                                // When an error occures the result will already be resolved. This way calling the reject won't case a thing
                                //pw.error(this, [error, e]);
                            },
                            function (result, event) {
                                if (event) {
                                    // Sending a notify won't have any effect because the result is already resolved. There is nothing more to do than close the current connection.
                                    //pw.progress(this, [result, e]);

                                    if (event.type === "versionchange") {
                                        if (event.version != this.version) {
                                            // If the version is changed and the current version is different from the requested version, the connection needs to get closed.
                                            closeDatabaseConnection(this);
                                        }
                                    }
                                }
                            });

                            var currentVersion = GetDatabaseVersion(db);
                            if (currentVersion < version || (version == -1)) {
                                // Current version deferres from the requested version, database upgrade needed
                                log("DB Promise upgradeneeded", this, db, e, db.connectionId);
                                var versionChangePromise = changeDatabaseStructure(linq2indexedDB.utilities.self(this, [db, e]), version);

                                versionChangePromise.then(function (txn, event) {
                                    // Fake the onupgrade event.
                                    var context = req;
                                    context.transaction = txn;

                                    var upgardeEvent = event;
                                    upgardeEvent.type = "upgradeneeded";
                                    upgardeEvent.newVersion = version;
                                    upgardeEvent.oldVersion = currentVersion;

                                    pw.progress(context, [txn, upgardeEvent]);

                                    handlers.IDBTransaction(txn).then(function (trans, args) {
                                        // When the new version is completed, close the db connection, and make a new connection.
                                        closeDatabaseConnection(txn.db);
                                        linq2indexedDB.core.db(name).then(function (dbConnection, ev) {
                                            // Connection resolved
                                            pw.complete(this, [dbConnection, ev])
                                        },
                                        function (err, ev) {
                                            // Database connection error or abort
                                            pw.error(this, [err, ev]);
                                        },
                                        function (dbConnection, ev) {
                                            // Database upgrade or blocked
                                            pw.progress(this, [dbConnection, ev]);
                                        });
                                    }
                                    , function (err, ev) {
                                        //txn error or abort
                                        pw.error(this, [err, ev]);
                                    });
                                },
                                function (err, event) {
                                    // txn error or abort
                                    pw.error(this, [err, event]);
                                },
                                function (result, event) {
                                    // txn blocked
                                    pw.progress(this, [result, event]);
                                });
                            }
                            else {
                                // Database Connection resolved.
                                log("DB Promise resolved", this, db, e);
                                pw.complete(this, [db, e]);
                            }
                        },
                        function (error, e) {
                            // Database connection error or abort
                            log("DB Promise rejected", this, error, e);
                            pw.error(this, [error, e]);
                        },
                        function (result, e) {
                            // Database upgrade + db blocked
                            pw.progress(this, [result, e]);
                        });
                    }
                    catch (ex) {
                        log("DB Promise exception", this, ex.message, ex);
                        pw.error(this, [ex.message, ex]);
                    }
                })
            },
            transaction: function (dbPromise, objectStoreNames, transactionType, autoGenerateAllowed) {
                return promiseWrapper(function (pw) {
                    // Initialize defaults
                    if (!isArray(objectStoreNames)) objectStoreNames = [objectStoreNames];
                    transactionType = transactionType || IDBTransaction.READ_ONLY;

                    dbPromise.then(function (db, e) {
                        // db connection resolved
                        log("Transaction promise started", db, objectStoreNames, transactionType);
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
                                var version = GetDatabaseVersion(db) + 1
                                var dbName = db.name;
                                log("Transaction Promise database upgrade needed: ", db);
                                // Closing the current connections so it won't block the upgrade.
                                closeDatabaseConnection(db);
                                // Open a new connection with the new version
                                linq2indexedDB.core.db(dbName, version).then(function (dbConnection, event) {
                                    // When the upgrade is completed, the transaction can be opened.
                                    linq2indexedDB.core.transaction(linq2indexedDB.utilities.self(this, [dbConnection, event]), objectStoreNames, transactionType, autoGenerateAllowed).then(function (txn, ev) {
                                        // txn completed
                                        pw.complete(this, [txn, ev]);
                                    },
                                    function (error, ev) {
                                        // txn error or abort
                                        pw.error(this, [error, ev])
                                    },
                                    function (txn) {
                                        // txn created
                                        pw.progress(this, [txn]);
                                    });
                                },
                                function (error, event) {
                                    // When an error occures, bubble up.
                                    pw.error(this, [error, event])
                                },
                                function (txn, event) {
                                    // When an upgradeneeded event is thrown, create the non-existing object stores
                                    if (event.type == "upgradeneeded") {
                                        for (var j = 0; j < nonExistingObjectStores.length; j++) {
                                            linq2indexedDB.core.createObjectStore(selfTransaction(this, [txn, event]), nonExistingObjectStores[j])
                                        }
                                    }
                                });
                            }
                            else {
                                // If no non-existing object stores are found, create the transaction.
                                var txn = db.transaction(objectStoreNames, transactionType);

                                // Handle transaction events
                                handlers.IDBTransaction(txn).then(function (result, event) {
                                    // txn completed
                                    pw.complete(this, [result, event]);
                                },
                                function (err, event) {
                                    // txn error or abort
                                    pw.error(this, [err, event]);
                                });

                                // txn created
                                log("Transaction Promise transaction created.", txn);
                                pw.progress(txn, [txn]);
                            }
                        }
                        catch (ex) {
                            log("Transaction Promise exception", ex, db);
                            ex.type = "exception";
                            pw.error(this, [ex.message, ex]);
                        }
                    },
                    function (err, e) {
                        // db err
                        pw.error(this, [err, e])
                    });
                })
            },
            objectStore: function (transactionPromise, objectStoreName) {
                return promiseWrapper(function (pw) {
                    transactionPromise.then(function (txn, e) {
                        //txn completed
                        // TODO: what todo in this case?
                    }, function (error, e) {
                        pw.error(this, [error, e]);
                    }, function (txn, e) {
                        // txn created
                        log("ObjectStore Promise started", transactionPromise, objectStoreName);
                        try {
                            var store = txn.objectStore(objectStoreName);
                            log("ObjectStore Promise completed", store);
                            // Object store resolved.
                            pw.complete(store, [txn, store]);
                        }
                        catch (ex) {
                            log("Error in Object Store Promise", ex, txn);
                            // Resolving objectstore failed.
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    });
                })
            },
            createObjectStore: function (changeDatabaseStructurePromise, objectStoreName, objectStoreOptions) {
                return promiseWrapper(function (pw) {
                    changeDatabaseStructurePromise.then(function (txn, e) {
                        // txn completed
                        // TODO: what todo in this case?
                    }, function (error, e) {
                        // txn error or abort
                        pw.error(this, [error, e]);
                    },
                    function (txn, e) {
                        // txn created
                        log("createObjectStore Promise started", changeDatabaseStructurePromise, objectStoreName, objectStoreOptions);
                        try {
                            if (!txn.db.objectStoreNames.contains(objectStoreName)) {
                                // If the object store doesn't exists, create it
                                var options = new Object();

                                if (objectStoreOptions) {
                                    if (objectStoreOptions.keyPath) options.keyPath = objectStoreOptions.keyPath;
                                    options.autoIncrement = objectStoreOptions.autoIncrement;
                                }
                                else {
                                    options.autoIncrement = true;
                                }

                                var store = txn.db.createObjectStore(objectStoreName, options, options.autoIncrement);

                                log("ObjectStore Created", store, objectStoreName);
                                log("createObjectStore Promise completed", store, objectStoreName);
                                pw.complete(store, [txn, store]);
                            }
                            else {
                                // If the object store exists, retrieve it
                                linq2indexedDB.core.objectStore(selfTransaction(this, [txn, e]), objectStoreName).then(function (trans, store) {
                                    // store resolved
                                    log("ObjectStore Found", store, objectStoreName);
                                    log("createObjectStore Promise completed", store, objectStoreName);
                                    pw.complete(store, [trans, store]);
                                }, function (error, event) {
                                    // store error
                                    pw.error(this, [error, event]);
                                });
                            }
                        }
                        catch (ex) {
                            // store exception
                            log("Error in createObjectStore Promise", ex);
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    });
                })
            },
            deleteObjectStore: function (changeDatabaseStructurePromise, objectStoreName) {
                return promiseWrapper(function (pw) {
                    changeDatabaseStructurePromise.then(function (txn, e) {
                        // txn completed
                        // TODO: what todo in this case?
                    }, function (error, e) {
                        // txn error
                        pw.error(this, [error, e]);
                    },
                    function (txn, e) {
                        // txn created
                        log("deleteObjectStore Promise started", changeDatabaseStructurePromise, objectStoreName);
                        try {
                            if (txn.db.objectStoreNames.contains(objectStoreName)) {
                                // store found, delete it
                                store = txn.db.deleteObjectStore(objectStoreName)
                                log("ObjectStore Deleted", objectStoreName);
                                log("deleteObjectStore Promise completed", objectStoreName);
                                pw.complete(this, [txn, objectStoreName]);
                            }
                            else {
                                // store not found, return error
                                log("ObjectStore Not Found", objectStoreName);
                                pw.error(this, ["ObjectStore Not Found" + objectStoreName]);
                            }
                        }
                        catch (ex) {
                            // store exception
                            log("Error in deleteObjectStore Promise", ex);
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    });
                })
            },
            index: function (propertyName, objectStorePromise, autoGenerateAllowed) {
                return promiseWrapper(function (pw) {
                    objectStorePromise.then(function (txn, objectStore) {
                        // store resolved
                        log("Index Promise started", objectStore)
                        try {
                            if (objectStore.indexNames.contains(propertyName + "-index")) {
                                // If index exists, resolve it
                                var index = objectStore.index(propertyName + "-index");
                                log("Index Promise compelted", index);
                                pw.complete(this, [txn, index, objectStore]);
                            }
                            else if (autoGenerateAllowed) {
                                // If index doesn't exists, create it if autoGenerateAllowed
                                var version = GetDatabaseVersion(txn.db) + 1
                                var dbName = txn.db.name;
                                var transactionType = txn.mode;
                                var objectStoreNames = [objectStore.name] //txn.objectStoreNames;
                                var objectStoreName = objectStore.name;
                                // Close the currenct database connections so it won't block
                                closeDatabaseConnection(txn.db);

                                // Open a new connection with the new version
                                linq2indexedDB.core.db(dbName, version).then(function (dbConnection, event) {
                                    // When the upgrade is completed, the index can be resolved.
                                    linq2indexedDB.core.transaction(linq2indexedDB.utilities.self(this, [dbConnection, event]), objectStoreNames, transactionType, autoGenerateAllowed).then(function (transaction, ev) {
                                        // txn completed
                                        // TODO: what to do in this case
                                    },
                                    function (error, ev) {
                                        // txn error or abort
                                        pw.error(this, [error, ev])
                                    },
                                    function (transaction) {
                                        // txn created
                                        linq2indexedDB.core.index(propertyName, linq2indexedDB.core.objectStore(selfTransaction(this,[transaction, event]), objectStoreName)).then(function (trans, index, store) {
                                            pw.complete(this, [trans, index, store]);
                                        }, function (error, ev) {
                                            // txn error or abort
                                            pw.error(this, [error, ev]);
                                        });
                                    });
                                },
                                function (error, event) {
                                    // When an error occures, bubble up.
                                    pw.error(this, [error, event]);
                                },
                                function (trans, event) {
                                    // When an upgradeneeded event is thrown, create the non-existing object stores
                                    if (event.type == "upgradeneeded") {
                                        linq2indexedDB.core.createIndex(propertyName, linq2indexedDB.core.createObjectStore(selfTransaction(this, [trans, event]), objectStore.name)).then(function (index, store, transaction) {
                                            // index created
                                        },
                                        function (error, ev) {
                                            // When an error occures, bubble up.
                                            pw.error(this, [error, ev]);
                                        });
                                    }
                                });
                            }
                        }
                        catch (ex) {
                            // index exception
                            log("Error in index Promise", ex);
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        pw.error(this, [error, e]);
                    });
                })
            },
            createIndex: function (propertyName, createObjectStorePromise, indexOptions) {
                return promiseWrapper(function (pw) {
                    createObjectStorePromise.then(function (txn, objectStore) {
                        log("createIndex Promise started", objectStore)
                        try {
                            var index = objectStore.createIndex(propertyName + "-index", propertyName, { unique: indexOptions ? indexOptions.unique : false/*, multirow: indexOptions ? indexOptions.multirow : false*/ });
                            log("createIndex Promise compelted", index);
                            pw.complete(this, [txn, index, objectStore]);
                        }
                        catch (ex) {
                            log("createIndex Promise Failed", ex);
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        pw.error(this, [error, e]);
                    });
                })
            },
            deleteIndex: function (propertyName, createObjectStorePromise) {
                return promiseWrapper(function (pw) {
                    createObjectStorePromise.then(function (txn, objectStore) {
                        log("deleteIndex Promise started", objectStore, txn)
                        try {
                            objectStore.deleteIndex(propertyName + "-index");

                            log("deleteIndex Promise compelted", propertyName);
                            pw.complete(this, [txn, propertyName, store]);
                        }
                        catch (ex) {
                            log("deleteIndex Promise Failed", ex);
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        pw.error(this, [error, e]);
                    });
                })
            },
            cursor: function (sourcePromise, range, direction) {
                return promiseWrapper(function (pw) {
                    sourcePromise.then(function (txn, source) {
                        log("Cursor Promise Started", source);

                        var returnData = [];

                        handlers.IDBCursorRequest(source.openCursor(range || IDBKeyRange.lowerBound(0), direction)).then(function (result, e) {
                            log("Cursor Promise completed", result);
                            pw.complete(this, [returnData, e]);
                        },
                        function (error, e) {
                            log("Cursor Promise error", e, req);
                            pw.error(this, [error, e]);
                        },
                        function (result, e){
                            if (result.value) {
                                pw.progress(this, [result.value, e]);
                                returnData.push(result.value);
                            }
                            result["continue"]();
                        });

                    }, function (error, e) {
                        // store or index error
                        pw.error(this, [error, e]);
                    });
                })
            },
            keyCursor: function (indexPromise, range, direction) {
                return promiseWrapper(function (pw) {
                    indexPromise.then(function (txn, index, store) {
                        log("keyCursor Promise Started", index);
                        var returnData = [];

                        handlers.IDBRequest(index.openKeyCursor(range || IDBKeyRange.lowerBound(0), direction)).then(function (result, e) {
                            log("keyCursor Promise completed", req);
                            pw.complete(this, [returnData, e, txn]);
                        },
                        function (error, e) {
                            log("keyCursor Promise error", error, e);
                            pw.error(this, [error, e]);
                        },
                        function (result, e) {
                            if (result.value) {
                                pw.progress(this, [result.value, e, txn]);
                                returnData.push(result.value);
                            }
                            result["continue"]();
                        });
                    }, function (error, e) {
                        // index error
                        pw.error(this, [error, e]);
                    });
                })
            },
            get: function (sourcePromise, key) {
                return promiseWrapper(function (pw) {
                    sourcePromise.then(function (txn, source) {
                        log("Get Promise Started", source);

                        handlers.IDBRequest(source.get(key)).then(function (result, e) {
                            log("Get Promise completed", result);
                            pw.complete(this, [result, e, txn]);
                        }, function (error, e) {
                            log("Get Promise error", e, error);
                            pw.error(this, [error, e]);
                        });
                    }, function (error, e) {
                        // store or index error
                        pw.error(this, [error, e]);
                    });
                })
            },
            getKey: function (indexPromise, key) {
                return promiseWrapper(function (pw) {
                    indexPromise.then(function (txn, index, objectStore) {
                        log("GetKey Promise Started", index);

                        handlers.IDBRequest(index.getKey(key)).then(function (result, e) {
                            log("GetKey Promise completed", result);
                            pw.complete(this, [result, e, txn]);
                        }, function (error, e) {
                            log("GetKey Promise error", error, e);
                            pw.error(this, [error, e]);
                        });
                    }, function (error, e) {
                        // index error
                        pw.error(this, [error, e]);
                    });
                })
            },
            insert: function (objectStorePromise, data, key) {
                return promiseWrapper(function (pw) {
                    objectStorePromise.then(function (txn, store) {
                        log("Insert Promise Started", store);
                        try {
                            var req;

                            if (key /*&& !store.keyPath*/) {
                                req = handlers.IDBRequest(store.add(data, key));
                            }
                            else {
                                /*if (key) log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                                req = handlers.IDBRequest(store.add(data));
                            }

                            req.then(function (result, e) {

                                // Add key to the object if a keypath exists
                                if (store.keyPath) {
                                    data[store.keyPath] = result;
                                }

                                log("Insert Promise completed", data, req, result);
                                pw.complete(this, [data, result, e, txn]);
                                //pw.complete(result, req.transaction);
                            }, function (error, e) {
                                log("Insert Promise error", error, e);
                                pw.error(this, [error, e]);
                            });
                        }
                        catch (ex) {
                            log("Insert Promise exception", ex);
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        pw.error(this, [error, e]);
                    });
                })
            },
            update: function (objectStorePromise, data, key) {
                return promiseWrapper(function (pw) {
                    objectStorePromise.then(function (txn, store) {
                        log("Update Promise Started", store);

                        try {
                            var req;

                            if (key /*&& !store.keyPath*/) {
                                req = handlers.IDBRequest(store.put(data, key));
                            }
                            else {
                                /*if (key) log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                                req = handlers.IDBRequest(store.put(data));
                            }
                            req.then(function (result, e) {
                                log("Update Promise completed", data, req, result);
                                pw.complete(this, [data, result, e, txn]);
                                //pw.complete(result, req.transaction);
                            }, function (error, e) {
                                log("Update Promise error", error, e);
                                pw.error(this, [error, e]);
                            });
                        }
                        catch (ex) {
                            log("Update Promise exception", ex);
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        pw.error(this, [error, e]);
                    });
                })
            },
            remove: function (objectStorePromise, key) {
                return promiseWrapper(function (pw) {
                    objectStorePromise.then(function (txn, store) {
                        log("Remove Promise Started", store);

                        try {
                            handlers.IDBRequest(store["delete"](key)).then(function (result, e) {
                                log("Remove Promise completed", req, result);
                                pw.complete(this, [result, e, txn]);
                            },
                            function (error, e) {
                                log("Remove Promise error", error, e);
                                pw.error(this, [error, e]);
                            });
                        }
                        catch (ex) {
                            log("Remove Promise exception", ex);
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        pw.error(this, [error, e]);
                    });
                })
            },
            clear: function (objectStorePromise) {
                return promiseWrapper(function (pw) {
                    objectStorePromise.then(function (txn, store) {
                        log("Clear Promise Started", store);
                        try {
                            handlers.IDBRequest(store.clear()).then(function (result, e) {
                                log("Clear Promise completed", result, e);
                                pw.complete(this, [result, e, txn]);
                            },
                            function (error, e) {
                                log("Clear Promise error", error, e);
                                pw.error(this, [error, e]);
                            });
                        }
                        catch (ex) {
                            log("Clear Promise exception", ex);
                            abortTransaction(txn);
                            pw.error(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        pw.error(this, [error, e]);
                    });
                })
            },
            deleteDb: function (name) {
                return promiseWrapper(function (pw) {
                    try {
                        if (typeof (window.indexedDB.deleteDatabase) != "undefined") {

                            handlers.IDBBlockedRequest(window.indexedDB.deleteDatabase(name)).then(function (result, e) {
                                log("Delete Database Promise completed", result, e, name);
                                pw.complete(this, [result, e, name]);
                            }, function (error, e) {
                                // added for FF, If a db gets deleted that doesn't exist an errorCode 6 ('NOT_ALLOWED_ERR') is given
                                if (e.currentTarget.errorCode == 6) {
                                    pw.complete(this, [error, e, name]);
                                }
                                else {
                                    log("Delete Database Promise error", error, e);
                                    pw.error(this, [error, e]);
                                }
                            }, function (result, e) {

                                log("Delete Database Promise blocked", result);
                                pw.progress(this, [result, e]);
                            });
                        }
                        else {
                            log("Delete Database function not found", name);
                            // Workaround for older versions of chrome and FireFox
                            // Doesn't delete the database, but clears him
                            linq2indexedDB.core.db(name, -1).then(function (result, e) {
                                pw.complete(this, [result, e, name]);
                            },
                            function (error, e) {
                                log("Clear Promise error", error, e);
                                pw.error(this, [error, e]);
                            },
                            function (dbConnection, event) {
                                // When an upgradeneeded event is thrown, create the non-existing object stores
                                if (event.type == "upgradeneeded") {
                                    for (var i = 0; i < dbConnection.objectStoreNames.length; i++) {
                                        linq2indexedDB.core.deleteObjectStore(selfTransaction(this, [dbConnection.txn, event]), dbConnection.objectStoreNames[i]);
                                    }
                                    closeDatabaseConnection(dbConnection);
                                }
                            });
                        }
                    }
                    catch (ex) {
                        log("Delete Database Promise exception", ex);
                        pw.error(this, [ex.message, ex]);
                    }
                });
            }
        };

        function changeDatabaseStructure(dbPromise, version) {
            return promiseWrapper(function (pw) {
                dbPromise.then(function (db, e) {
                    log("Version Change Transaction Promise started", db, version);
                    handlers.IDBBlockedRequest(setVersion(version)).then(function (txn, event) {
                        // txn created
                        pw.complete(this, [txn, event]);
                    },
                    function (error, event) {
                        // txn error or abort
                        pw.error(this, [error, event]);
                    },
                    function (txn, event) {
                        // txn blocked
                        pw.progress(this, [txn, event]);
                    });
                }, function (error, event) {
                    // db error or abort
                    pw.error(this, [error, event]);
                });
            })
        }

        function closeDatabaseConnection(db) {
            log("Close database Connection: ", db);
            db.close();
        }

        function indexOf(array, value, propertyName) {
            for (var i = 0; i < array.length; i++) {
                if (array[i][propertyName] == value[propertyName]) {
                    return i;
                }
            }
            return -1;
        }

        function abortTransaction(transaction) {
            log("Abort transaction: " + transaction);
            // Calling the abort, blocks the database in IE10
            if (implementation != implementations.MICROSOFT) {
                transaction.abort();
                closeDatabaseConnection(transaction.db);
            }
        }

        function GetDatabaseVersion(db) {
            var dbVersion = parseInt(db.version);
            if (isNaN(dbVersion) || dbVersion < 0) {
                return 0
            }
            else {
                return dbVersion
            }
        }

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
            queryBuilder.remove.push({key: key });
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
            return promiseWrapper(function (pw) {
                var dbPromis = linq2indexedDB.core.db(dbConfig.name, dbConfig.version);

                dbPromis.then(null, null, function(txn, e){
                    if(e.type == "upgradeneeded"){
                        if(dbConfig.onupgradeneeded){
                            dbConfig.onupgradeneeded(txn, e.oldVersion, e.newVersion);
                        }
                        if(dbConfig.oninitializeversion){
                            for (var version = e.oldVersion + 1; version <= e.newVersion; version++) {
                                if (dbConfig.schema) {
                                    dbConfig.schema[version](txn)
                                } 
                                if(dbConfig.definition){
                                    var versionDefinition = getVersionDefinition(version, dbConfig.definition)
                                    InitializeVersion(txn, versionDefinition);
                                }
                                else if(dbConfig.oninitializeversion) {
                                    dbConfig.oninitializeversion(txn, version);
                                }
                            }
                        }
                    }
                });

                if (queryBuilder.insert.length > 0) {
                    executeInsert(queryBuilder, pw, dbPromis);
                }
                else if (queryBuilder.update.length > 0) {
                    executeUpdate(queryBuilder, pw, dbPromis);
                }
                else if (queryBuilder.remove.length > 0) {
                    executeRemove(queryBuilder, pw, dbPromis);
                }
                else if (queryBuilder.clear) {
                    executeClear(queryBuilder, pw, dbPromis);
                }
                else if (queryBuilder.get.length > 0) {
                    executeGet(queryBuilder, pw, dbPromis);
                }
                else {
                    executeRead(queryBuilder, pw, dbPromis);
                }
            })
        }

        function executeGet(queryBuilder, pw, dbPromise) {
            var getPromis = linq2indexedDB.core.get(linq2indexedDB.core.objectStore(linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_ONLY, dbConfig.autoGenerateAllowed), queryBuilder.from), queryBuilder.get[0].key);
            getPromis.then(function (data) {
                pw.complete(this, [data]);
            }
            , pw.error);
        }

        function executeClear(queryBuilder, pw, dbPromise) {
            var clearPromis = linq2indexedDB.core.clear(linq2indexedDB.core.objectStore(linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_WRITE, dbConfig.autoGenerateAllowed), queryBuilder.from));
            clearPromis.then(function () {
                pw.complete(this);
            }
            , pw.error);
        }

        function executeRemove(queryBuilder, pw, dbPromise) {
            var removePromis = linq2indexedDB.core.remove(linq2indexedDB.core.objectStore(linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_WRITE, dbConfig.autoGenerateAllowed), queryBuilder.from), queryBuilder.remove[0].key)
            removePromis.then(function () {
                pw.complete(this, [key]);
            }
            , pw.error);
        }

        function executeUpdate(queryBuilder, pw, dbPromise) {
            var updatePromis = linq2indexedDB.core.update(linq2indexedDB.core.objectStore(linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_WRITE, dbConfig.autoGenerateAllowed), queryBuilder.from), queryBuilder.update[0].data, queryBuilder.update[0].key);
            updatePromis.then(function (storedData, storedkey) {
                pw.complete(this, [storedData, storedkey]);
            }
            , pw.error);
        }

        function executeInsert(queryBuilder, pw, dbPromise) {
            var transactionPromise = linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_WRITE, dbConfig.autoGenerateAllowed);

            transactionPromise.then(function (result, e) {
                log("Close db connection");
                result.db.close();
            });

            var insertPromis = linq2indexedDB.core.insert(linq2indexedDB.core.objectStore(transactionPromise, queryBuilder.from), queryBuilder.insert[0].data, queryBuilder.insert[0].key)
            insertPromis.then(function (storedData, storedkey) {
                pw.complete(this, [storedData, storedkey]);
            }
            , pw.error);
        }

        function executeRead(queryBuilder, pw, dbPromise){
            var objPromise = linq2indexedDB.core.objectStore(linq2indexedDB.core.transaction(dbPromise, queryBuilder.from, IDBTransaction.READ_ONLY, dbConfig.autoGenerateAllowed), queryBuilder.from);
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

            cursorPromis.then(onComplete, pw.error, onProgress);

            function onComplete(data) {
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
                        linq2indexedDB.utilities.sort(data, queryBuilder.orderBy[i].propertyName, queryBuilder.orderBy[i].descending).then(function (d,e) {
                            asyncForSort(d, ++i);
                        }, pw.error);
                    }
                    else {
                        // No need to notify again if it allready happend in the onProgress method.
                        if (returnData.length == 0) {
                            for (var j = 0; j < data.length; j++) {
                                var obj = SelectData(data[j], queryBuilder.select)
                                returnData.push(obj);
                                pw.progress(this, [obj]);
                            }
                        }
                        pw.complete(this, [returnData]);
                    }
                }

                // Start at 1 because we allready executed the first clause
                var start = 0;
                if (whereClauses.length > 0 && (whereClauses[0].type == whereType.equals || whereClauses[0].type == whereType.between || whereClauses[0].type == whereType.smallerThen || whereClauses[0].type == whereType.greaterThen)) {
                    start = 1;
                }
                asyncForWhere(data, start);
            }

            function onProgress(data) {
                // When there are no more where clauses to fulfill and the collection doesn't need to be sorted, the data can be returned.
                // In the other case let the complete handle it.
                if (whereClauses.length == 0 && queryBuilder.orderBy.length == 0) {
                    var obj = SelectData(data, queryBuilder.select)
                    returnData.push(obj);
                    pw.progress(this, [obj]);
                }
            }
        }

        function determineCursorPromis(objPromise, clause) {
            var cursorPromise;
            if (clause) {
                switch (clause.type) {
                    case whereType.equals:
                        cursorPromise = linq2indexedDB.core.cursor(linq2indexedDB.core.index(clause.propertyName, objPromise, dbConfig.autoGenerateAllowed), IDBKeyRange.only(clause.value));
                        break;
                    case whereType.between:
                        cursorPromise = linq2indexedDB.core.cursor(linq2indexedDB.core.index(clause.propertyName, objPromise, dbConfig.autoGenerateAllowed), IDBKeyRange.bound(clause.minValue, clause.maxValue, clause.minValueIncluded, clause.maxValueIncluded));
                        break;
                    case whereType.greaterThen:
                        cursorPromise = linq2indexedDB.core.cursor(linq2indexedDB.core.index(clause.propertyName, objPromise, dbConfig.autoGenerateAllowed), IDBKeyRange.lowerBound(clause.value, clause.valueIncluded));
                        break;
                    case whereType.smallerThen:
                        cursorPromise = linq2indexedDB.core.cursor(linq2indexedDB.core.index(clause.propertyName, objPromise, dbConfig.autoGenerateAllowed), IDBKeyRange.upperBound(clause.value, clause.valueIncluded));
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
                        linq2indexedDB.core.deleteObjectStore(selfTransaction(null, [txn]), objectStoreDefinition.name);
                    }
                    else {
                        linq2indexedDB.core.createObjectStore(selfTransaction(null, [txn]), objectStoreDefinition.name, objectStoreDefinition.objectStoreOptions);
                    }
                }
            }

            if (definition.indexes) {
                for (var i = 0; i < definition.indexes.length; i++) {
                    var indexDefinition = definition.indexes[i];
                    if (indexDefinition.remove) {
                        linq2indexedDB.core.deleteIndex(indexDefinition.propertyName, linq2indexedDB.core.objectStore(selfTransaction(null, [txn]), indexDefinition.objectStoreName));
                    }
                    else {
                        linq2indexedDB.core.createIndex(indexDefinition.propertyName, linq2indexedDB.core.objectStore(selfTransaction(null, [txn]), indexDefinition.objectStoreName), indexDefinition.indexOptions);
                    }
                }
            }

            if (definition.defaultData) {
                for (var i = 0; i < definition.defaultData.length; i++) {
                    var defaultDataDefinition = definition.defaultData[i];
                    if (defaultDataDefinition.remove) {
                        linq2indexedDB.core.remove(linq2indexedDB.core.objectStore(selfTransaction(null, [txn]), defaultDataDefinition.objectStoreName), defaultDataDefinition.key);
                    }
                    else {
                        linq2indexedDB.core.insert(linq2indexedDB.core.objectStore(selfTransaction(null, [txn]), defaultDataDefinition.objectStoreName), defaultDataDefinition.data, defaultDataDefinition.key);
                    }
                }
            }
        }
        catch (ex) {
            log("initialize version exception: ", ex);
            abortTransaction(txn);
        }
    }

    function selfTransaction(context, args) {
        return promiseWrapper(function (pw) {
            var txn = args[0];

            pw.progress(context, args);

            txn.oncomplete = function (result, e) {
                pw.complete(this, [result, e]);
            }
        })
    }

    function promiseWrapper(promise) {
        if (typeof Windows != "undefined")
        {
            return new WinJS.Promise(function (complete, error, progress) {
                promise({
                    complete: function (context, args) {
                        complete(args);
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
                        dfd.resolveWith(context, args);
                    },
                    error: function (context, args) {
                        dfd.rejectWith(context, args);
                    },
                    progress: function (context, args) {
                        dfd.notifyWith(context, args);
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

