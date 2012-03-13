/// <reference path="../Scripts/jquery-1.7.1.js" />
/// <reference path="../Scripts/jquery-1.7.1-vsdoc.js" />
/// <reference path="../Scripts/Sort.js"

(function ($, window) {
    /// <param name="$" type="jQuery" />    
    "use strict";

    if (typeof ($) !== "function") {
        // no jQuery!        
        throw "linq2indexedDB: jQuery not found. Please ensure jQuery is referenced before the linq2indexedDB.js file.";
    }

    if (numericjQueryVersion() < 170) {
        // no jQuery!        
        throw "linq2indexedDB: jQuery Deferred functionality not found. Please ensure jQuery 1.7 is referenced before the linq2indexedDB.js file.";
    }

    if (!window.JSON) {
        // no JSON!        
        throw "linq2indexedDB: No JSON parser found. Please ensure json2.js is referenced before the linq2indexedDB.js file if you need to support clients without native JSON parsing support, e.g. IE<8.";
    }

    function numericjQueryVersion() {
        var version = $.fn.jquery.split('.');
        var strippedVersion = "";
        for (var i = 0; i < version.length; i++) {
            strippedVersion += version[i];
        }
        return parseInt(strippedVersion);
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

    linq2indexedDB = function (name, configuration, logging) {
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

        enableLogging = logging;
        var promise = core(name, configuration);

        return {
            core: promise,
            utilities: linq2indexedDB.utilities,
            linq: linq(promise),
            initialize: function () {
                log("Initialize Started");
                return $.Deferred(function (dfd) {
                    $.when(promise.db()).then(function (db) {
                        db.close();
                        log("Initialize Succesfull");
                        dfd.resolve();
                    }
            , dfd.reject);
                });
            },
            deleteDatabase: function () {
                return $.Deferred(function (dfd) {
                    var returnData = [];
                    $.when(promise.deleteDb()).then(function () {
                        dfd.resolve();
                    }
            , dfd.reject);
                });
            }
        };
    }

    linq2indexedDB.prototype.utilities = linq2indexedDB.utilities = {
        self: function (value) {
            return $.Deferred(function (dfd) {
                dfd.resolve(value);
            });
        },
        sort: function (dataPromise, propertyName, descending) {
            return $.Deferred(function (dfd) {
                $.when(dataPromise).then(function (data) {
                    var worker = new Worker(sortFileLocation);
                    worker.onmessage = function (event) {
                        dfd.resolve(event.data)
                    };
                    worker.onerror = dfd.reject;
                    worker.postMessage({ data: data, propertyName: propertyName, descending: descending });
                }, dfd.reject);
            });
        },
        where: function (data, clause) {
            return $.Deferred(function (dfd) {
                var worker = new Worker(whereFileLocation);
                worker.onmessage = function (event) {
                    dfd.resolve(event.data)
                };
                worker.onerror = dfd.reject;
                worker.postMessage({ data: data, clause: clause });
            });
        }
    };

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

                //                if (window.JSON) {
                window.indexedDB.json = window.JSON;
                window.indexedDBSync.json = window.JSON;
                //                } else {
                //                    var jsonObject = {
                //                        parse: function (txt) {
                //                            if (txt === "[]") return [];
                //                            if (txt === "{}") return {};
                //                            throw { message: "Unrecognized JSON to parse: " + txt };
                //                        }
                //                    };
                //                    window.indexedDB.json = jsonObject;
                //                    window.indexedDBSync.json = jsonObject;
                //                }

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

    function core(name, configuration) {
        var dbName = "Default";
        var dbVersion;

        if (name) {
            dbName = name;
        }

        if (configuration) {
            dbVersion = configuration.version;
        }

        var promise = {
            self: function (value) {
                return $.Deferred(function (dfd) {
                    dfd.resolve(value);
                });
            },
            db: function () {
                return promise.dbInternal(dbVersion, InitializeDatabse)
            },
            dbInternal: function (version, initVersion) {
                return $.Deferred(function (dfd) {
                    try {
                        var req;

                        if (version) {
                            log("db opening", dbName, version);
                            req = window.indexedDB.open(dbName, version);
                        }
                        else {
                            log("db opening", dbName);
                            req = window.indexedDB.open(dbName);
                        }

                        req.onsuccess = function (e) {
                            var result;

                            if (e.result) result = e.result; // IE 8/9 prototype 
                            if (req.result) result = req.result;

                            result.onabort = function (e) {
                                log("DB abort", e, result);
                                result.close();
                            }

                            result.onerror = function (e) {
                                log("DB error", e, result);
                                result.close();
                            }

                            result.onversionchange = function (e) {
                                log("DB versionchange", e, result);
                                result.close();
                            }

                            // Add a connection id to the connection
                            result.connectionId = connectionCounter++;
                            var currentVersion = GetDatabaseVersion(result);

                            connections.push(result);

                            log("DB connection opened", result, result.connectionId);

                            if (currentVersion < version || (version == -1)) {
                                log("DB Promise upgradeneeded", result);
                                try {
                                    var versionChangePromise = promise.changeDatabaseStructure(promise.self(result), version, function () {
                                        log("DB Promise upgradeneeded completed");
                                        closeDatabaseConnection(result);
                                        $.when(promise.db()).then(function (dbConnection) {
                                            dfd.resolve(dbConnection);
                                        }, dfd.reject);
                                    });

                                    $.when(versionChangePromise).then(function (txn) {
                                        initVersion(txn, currentVersion, version, configuration);
                                    }, dfd.reject);
                                }
                                catch (e) {
                                    log("Upgrade exception", e, result);
                                    dfd.reject(e, result);
                                }
                            }
                            else {
                                log("DB Promise resolved", result, result.connectionId);
                                dfd.resolve(result);
                            }
                        }

                        req.onerror = function (e) {
                            var result;

                            if (e.result) result = e.result; // IE 8/9 prototype 
                            if (req.result) result = req.result;

                            log("DB Promise rejected", result);
                            dfd.reject(e, req);
                        }

                        req.onupgradeneeded = function (e) {
                            log("DB Promise upgradeneeded", req.result);

                            req.transaction.oncomplete = function () {
                                log("DB Promise upgradeneeded completed", req.transaction);
                                // Not necessary in the onupgrade event of the IDBDatabseFactory
                                //closeDatabaseConnection(req.transaction.db);
                                //$.when(promise.db()).then(function (dbConnection) {
                                //    dfd.resolve(dbConnection)
                                //}, dfd.reject);
                            }

                            if (initVersion && typeof (initVersion) === 'function') {
                                initVersion(req.transaction, e.oldVersion, e.newVersion, configuration)
                            }
                        }

                        req.onblocked = function (e) {
                            var result;

                            log("DB Promise blocked", req);

                            // Close all connections who block the update of the database
                            // Fix for IE 10 Preview 5
                            for (var i = connections.length - 1; i >= 0; i--) {
                                var connection = connections[i];
                                if (connection.version != version) {
                                    closeDatabaseConnection(connection);
                                }
                            }

                            //dfd.reject(e, req);
                        }
                    }
                    catch (e) {
                        log("DB Promise exception", e);
                        dfd.reject(e);
                    }
                }).promise();
            },
            changeDatabaseStructure: function (dbPromise, version, onTransactionCompleted) {
                return $.Deferred(function (dfd) {
                    $.when(dbPromise).then(function (db) {
                        try {
                            log("Version Change Transaction Promise started", db, version);
                            var req = db.setVersion(version);

                            req.onsuccess = function (e) {
                                var txn;

                                if (e.result) txn = e.result; // IE 8/9 prototype 
                                if (req.result) txn = req.result;

                                txn.oncomplete = function (event) {
                                    log("Version Change Transaction transaction completed", txn);
                                    closeDatabaseConnection(txn.db);
                                    if (typeof (onTransactionCompleted) === 'function') onTransactionCompleted();
                                }

                                log("Version Change Transaction Promise completed", txn);
                                dfd.resolve(txn);
                            }

                            req.onerror = function (e) {
                                var result;

                                if (e.result) result = e.result; // IE 8/9 prototype 
                                if (req.result) result = req.result;

                                log("Version Change Transaction Promise error", e);
                                dfd.reject(e, result);
                            }

                            req.onblocked = function (e) {
                                log("Version Change Transaction Promise blocked", e);
                            }
                        }
                        catch (e) {
                            log("Version Change Transaction Promise exception", e);
                            dfd.reject(e, req);
                        }
                    }, dfd.reject);
                }).promise();
            },
            transaction: function (dbPromise, objectStoreNames, transactionType, onTransactionCompleted) {
                return $.Deferred(function (dfd) {
                    if (!$.isArray(objectStoreNames)) objectStoreNames = [objectStoreNames];

                    $.when(dbPromise).then(function (db) {
                        log("Transaction Promise started", db, objectStoreNames, transactionType);
                        try {
                            var nonExistingObjectStores = [];

                            for (var i = 0; i < objectStoreNames.length; i++) {
                                if (!db.objectStoreNames || !db.objectStoreNames.contains(objectStoreNames[i])) {
                                    nonExistingObjectStores.push(objectStoreNames[i]);
                                }
                            }

                            if (nonExistingObjectStores.length > 0 && (!configuration || !configuration.objectStoreConfiguration)) {
                                var version = GetDatabaseVersion(db) + 1
                                log("Transaction Promise database upgrade needed: ", db);
                                closeDatabaseConnection(db);
                                $.when(promise.dbInternal(version, function (txn) {
                                    for (var j = 0; j < nonExistingObjectStores.length; j++) {
                                        promise.createObjectStore(promise.self(txn), nonExistingObjectStores[j])
                                    }
                                })).then(function (dbConnection) {
                                    $.when(promise.transaction(promise.self(dbConnection), objectStoreNames, transactionType, onTransactionCompleted)).then(function (txn) {
                                        dfd.resolve(txn);
                                    }, dfd.reject);
                                });
                            }
                            else {
                                var txn = db.transaction(objectStoreNames, transactionType);
                                txn.oncomplete = function () {
                                    log("Transaction completed", txn);
                                    closeDatabaseConnection(txn.db);
                                    if (typeof (onTransactionCompleted) === 'function') onTransactionCompleted();
                                }

                                log("Transaction Promise completed", txn);
                                dfd.resolve(txn);
                            }
                        }
                        catch (e) {
                            log("Transaction Promise exception", e, db);
                            dfd.reject(e, db);
                        }

                    }, dfd.reject);
                }).promise();
                ;
            },
            readTransaction: function (dbPromise, objectStoreNames, onTransactionCompleted) {
                return promise.transaction(dbPromise, objectStoreNames, IDBTransaction.READ_ONLY);
            },
            writeTransaction: function (dbPromise, objectStoreNames, onTransactionCompleted) {
                return promise.transaction(dbPromise, objectStoreNames, IDBTransaction.READ_WRITE, onTransactionCompleted);
            },
            objectStore: function (transactionPromise, objectStoreName) {
                return $.Deferred(function (dfd) {
                    $.when(transactionPromise).then(function (txn) {
                        log("ObjectStore Promise started", transactionPromise, objectStoreName);
                        try {
                            var store = txn.objectStore(objectStoreName);
                            log("ObjectStore Promise completed", store);
                            dfd.resolve(store, txn);
                        }
                        catch (e) {
                            log("Error in Object Store Promise", e, txn);
                            abortTransaction(txn);
                            dfd.reject(e, txn.db);
                        }
                    }, dfd.reject);
                }).promise();
            },
            createObjectStore: function (changeDatabaseStructurePromise, objectStoreName, objectStoreOptions) {
                return $.Deferred(function (dfd) {
                    $.when(changeDatabaseStructurePromise).then(function (txn) {
                        log("createObjectStore Promise started", changeDatabaseStructurePromise, objectStoreName, objectStoreOptions);
                        try {

                            if (!txn.db.objectStoreNames.contains(objectStoreName)) {
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
                                dfd.resolve(store, txn);
                            }
                            else {
                                $.when(promise.objectStore(promise.self(txn), objectStoreName)).then(function (store) {
                                    log("ObjectStore Found", store, objectStoreName);
                                    log("createObjectStore Promise completed", store, objectStoreName);
                                    dfd.resolve(store, txn);
                                }, dfd.reject);
                            }
                        }
                        catch (e) {
                            log("Error in createObjectStore Promise", e);
                            abortTransaction(txn);
                            dfd.reject(e, txn.db);
                        }
                    }, dfd.reject);
                }).promise();
            },
            deleteObjectStore: function (changeDatabaseStructurePromise, objectStoreName) {
                return $.Deferred(function (dfd) {
                    $.when(changeDatabaseStructurePromise).then(function (txn) {
                        log("deleteObjectStore Promise started", changeDatabaseStructurePromise, objectStoreName);
                        try {
                            if (txn.db.objectStoreNames.contains(objectStoreName)) {
                                store = txn.db.deleteObjectStore(objectStoreName)
                                log("ObjectStore Deleted", objectStoreName);
                            }
                            else {
                                log("ObjectStore Not Found", objectStoreName);
                            }

                            log("deleteObjectStore Promise completed", objectStoreName);
                            dfd.resolve(store);
                        }
                        catch (e) {
                            log("Error in deleteObjectStore Promise", e);
                            abortTransaction(txn);
                            dfd.reject(e, txn.db);
                        }
                    }, dfd.reject);
                }).promise();
            },
            createIndex: function (propertyName, createObjectStorePromise, indexOptions) {
                return $.Deferred(function (dfd) {
                    $.when(createObjectStorePromise).then(function (objectStore) {
                        log("createIndex Promise started", objectStore)
                        try {
                            var index;
                            if (implementation == implementations.MICROSOFTPROTOTYPE) {
                                index = objectStore.createIndex(propertyName + "-index", propertyName, indexOptions ? indexOptions.IsUnique : false);
                            }
                            else {
                                index = objectStore.createIndex(propertyName + "-index", propertyName, { unique: indexOptions ? indexOptions.IsUnique : false/*, multirow: indexOptions ? indexOptions.Multirow : false*/ });
                            }

                            log("createIndex Promise compelted", index);
                            dfd.resolve(index);
                        }
                        catch (e) {
                            log("createIndex Promise Failed", e);
                            dfd.reject(e, objectStore);
                        }
                    }, dfd.reject);
                }).promise();
            },
            deleteIndex: function (propertyName, createObjectStorePromise) {
                return $.Deferred(function (dfd) {
                    $.when(createObjectStorePromise).then(function (objectStore) {
                        log("deleteIndex Promise started", objectStore)
                        try {
                            objectStore.deleteIndex(propertyName + "-index");

                            log("deleteIndex Promise compelted", propertyName);
                            dfd.resolve(index);
                        }
                        catch (e) {
                            log("deleteIndex Promise Failed", e);
                            dfd.reject(e, objectStore);
                        }
                    }, dfd.reject);
                }).promise();
            },
            index: function (propertyName, objectStorePromise) {
                return $.Deferred(function (dfd) {
                    $.when(objectStorePromise).then(function (objectStore, txn) {
                        log("Index Promise started", objectStore)
                        try {
                            if (objectStore.indexNames.contains(propertyName + "-index")) {
                                var index = objectStore.index(propertyName + "-index");
                                log("Index Promise compelted", index);
                                dfd.resolve(index);
                            }
                            else if (!configuration || !configuration.objectStoreConfiguration) {
                                var version = GetDatabaseVersion(txn.db) + 1
                                closeDatabaseConnection(txn.db);
                                promise.dbInternal(version, function (txn) {
                                    $.when(promise.createIndex(propertyName, promise.createObjectStore(promise.self(txn), objectStore.name))).then(function (index) {
                                        log("Index Promise compelted", index);
                                        dfd.resolve(index);
                                    });
                                });
                            }
                        }
                        catch (e) {
                            log("Index Promise exception", e);
                            dfd.reject(e, propertyName)
                        }
                    }, dfd.reject);
                }).promise();
            },
            cursor: function (sourcePromise, range, direction) {
                return $.Deferred(function (dfd) {
                    $.when(sourcePromise).then(function (source) {
                        log("Cursor Promise Started", source);

                        var req;
                        var returnData = [];

                        if (implementation == implementations.MICROSOFTPROTOTYPE && typeof (source.openKeyCursor) === 'function') {
                            req = source.openKeyCursor(range || IDBKeyRange.lowerBound(0), direction);
                        }
                        else {
                            req = source.openCursor(range || IDBKeyRange.lowerBound(0), direction);
                        }
                        function handleCursorRequest(e) {
                            var result;

                            if (e.result) result = e.result; // IE 8/9 prototype 
                            if (req.result) result = req.result;

                            if (implementation == implementations.MICROSOFTPROTOTYPE) {
                                result.move();

                                if (result.value) {
                                    dfd.notify(result.value, req);
                                    returnData.push(result.value);
                                    req.onsuccess = handleCursorRequest;
                                }
                            }

                            if (req.result) {
                                if (result.value) {
                                    dfd.notify(result.value, req);
                                    returnData.push(result.value);
                                }
                                result["continue"]();
                            }

                            if (!result) {
                                log("Cursor Promise completed", req);
                                dfd.resolve(returnData, req.transaction);
                            }
                        };

                        req.onsuccess = handleCursorRequest;

                        req.onerror = function (e) {
                            log("Cursor Promise error", e, req);
                            dfd.reject(e, req);
                        };
                    }, dfd.reject);
                }).promise();
            },
            keyCursor: function (indexPromise, range, direction) {
                return $.Deferred(function (dfd) {
                    $.when(indexPromise).then(function (index) {
                        log("keyCursor Promise Started", index);

                        var req;

                        if (implementation == implementations.MICROSOFTPROTOTYPE) {
                            req = index.openCursor(range || IDBKeyRange.lowerBound(0), direction);
                        }
                        else {
                            req = index.openKeyCursor(range, direction);
                        }
                        function handleCursorRequest(e) {
                            var result;

                            if (e.result) result = e.result; // IE 8/9 prototype 
                            if (req.result) result = req.result;

                            if (implementation == implementations.MICROSOFTPROTOTYPE) {
                                result.move();

                                if (result.value) {
                                    dfd.notify(result.value, req);
                                    returnData.push(result.value);
                                    req.onsuccess = handleCursorRequest;
                                }
                            }

                            if (req.result) {
                                if (result.value) {
                                    dfd.notify(result.value, req);
                                    returnData.push(result.value);
                                }
                                result["continue"]();
                            }

                            if (!result) {
                                log("keyCursor Promise completed", req);
                                dfd.resolve(returnData, req.transaction);
                            }
                        };

                        req.onsuccess = handleCursorRequest;
                        req.onerror = function (e) {
                            log("keyCursor Promise error", e, req);
                            dfd.reject(e, req);
                        };
                    }, dfd.reject);
                }).promise();
            },
            get: function (sourcePromise, key) {
                return $.Deferred(function (dfd) {
                    $.when(sourcePromise).then(function (source) {
                        log("Get Promise Started", source);

                        var req = source.get(key);

                        req.onsuccess = function (e) {
                            var result;

                            if (e.result) result = e.result; // IE 8/9 prototype 
                            if (req.result) result = req.result;

                            log("Get Promise completed", req);
                            dfd.resolve(result, req.transaction);
                        };
                        req.onerror = function (e) {
                            log("Get Promise error", e, req);
                            dfd.reject(e, req);
                        };
                    }, dfd.reject);
                }).promise();
            },
            getKey: function (indexPromise, key) {
                return $.Deferred(function (dfd) {
                    $.when(indexPromise).then(function (index) {
                        log("GetKey Promise Started", index);

                        var req = index.getKey(key);

                        req.onsuccess = function (e) {
                            var result;

                            if (e.result) result = e.result; // IE 8/9 prototype 
                            if (req.result) result = req.result;

                            log("GetKey Promise completed", req);
                            dfd.resolve(result, req.transaction);
                        };
                        req.onerror = function (e) {
                            log("GetKey Promise error", e, req);
                            dfd.reject(e, req);
                        };
                    }, dfd.reject);
                }).promise();
            },
            insert: function (objectStorePromise, data, key) {
                return $.Deferred(function (dfd) {
                    $.when(objectStorePromise).then(function (store) {
                        log("Insert Promise Started", store);

                        try {
                            var req;

                            if (key /*&& !store.keyPath*/) {
                                req = store.add(data, key);
                            }
                            else {
                                /*if (key) log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                                req = store.add(data);
                            }

                            req.onsuccess = function (e) {
                                var result;

                                if (e.result) result = e.result; // IE 8/9 prototype 
                                if (req.result) result = req.result;

                                // Add key to the object if a keypath exists
                                if (store.keyPath) {
                                    data[store.keyPath] = result;
                                }

                                log("Insert Promise completed", data, req, result);
                                dfd.resolve(data, result);
                                //dfd.resolve(result, req.transaction);
                            };
                            req.onerror = function (e) {
                                log("Insert Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }
                        catch (e) {
                            log("Insert Promise exception", e, req);
                            dfd.reject(e, req);
                        }
                    }, dfd.reject);
                }).promise();
            },
            update: function (objectStorePromise, data, key) {
                return $.Deferred(function (dfd) {
                    $.when(objectStorePromise).then(function (store) {
                        log("Update Promise Started", store);

                        try {
                            var req;

                            if (key /*&& !store.keyPath*/) {
                                req = store.put(data, key);
                            }
                            else {
                                /*if (key) log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                                req = store.put(data);
                            }
                            req.onsuccess = function (e) {
                                var result;

                                if (e.result) result = e.result; // IE 8/9 prototype 
                                if (req.result) result = req.result;

                                log("Update Promise completed", data, req, result);
                                dfd.resolve(data, result);
                                //dfd.resolve(result, req.transaction);
                            };
                            req.onerror = function (e) {
                                log("Update Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }
                        catch (e) {
                            log("Update Promise exception", e, req);
                            dfd.reject(e, req);
                        }
                    }, dfd.reject);
                }).promise();
            },
            remove: function (objectStorePromise, key) {
                return $.Deferred(function (dfd) {
                    $.when(objectStorePromise).then(function (store) {
                        log("Remove Promise Started", store);

                        try {
                            var req = store["delete"](key);
                            req.onsuccess = function (e) {
                                var result;

                                if (e.result) result = e.result; // IE 8/9 prototype 
                                if (req.result) result = req.result;

                                log("Remove Promise completed", req, result);
                                dfd.resolve();
                                //dfd.resolve(result, req.transaction);
                            };
                            req.onerror = function (e) {
                                log("Remove Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }
                        catch (e) {
                            log("Remove Promise exception", e, req);
                            dfd.reject(e, req);
                        }
                    }, dfd.reject);
                }).promise();
            },
            clear: function (objectStorePromise) {
                return $.Deferred(function (dfd) {
                    $.when(objectStorePromise).then(function (store) {
                        log("Clear Promise Started", store);

                        try {
                            var req = store.clear();
                            req.onsuccess = function (e) {
                                var result;

                                if (e.result) result = e.result; // IE 8/9 prototype 
                                if (req.result) result = req.result;

                                log("Clear Promise completed", req, result);
                                dfd.resolve();
                                //dfd.resolve(result, req.transaction);
                            };
                            req.onerror = function (e) {
                                log("Clear Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }
                        catch (e) {
                            log("Clear Promise exception", e, req);
                            dfd.reject(e, req);
                        }
                    }, dfd.reject);
                }).promise();
            },
            deleteDb: function () {
                return $.Deferred(function (dfd) {
                    try {
                        if (typeof (window.indexedDB.deleteDatabase) != "undefined") {

                            var dbreq = window.indexedDB.deleteDatabase(dbName);
                            dbreq.onsuccess = function (e) {
                                log("Delete Database Promise completed", e, dbName);
                                dfd.resolve(e, dbName);
                            }
                            dbreq.onerror = function (e) {
                                log("Delete Database Promise error", e, dbName);
                                // added for FF, If a db gets deleted that doesn't exist an errorCode 6 ('NOT_ALLOWED_ERR') is given
                                if (e.currentTarget.errorCode == 6) {
                                    dfd.resolve(e, dbName);
                                }
                                else {
                                    dfd.reject(e, dbName);
                                }
                            }
                            dbreq.onblocked = function (e) {
                                var result;

                                //if (e.result) result = e.result; // IE 8/9 prototype
                                //if (req.result) result = req.result;

                                log("Delete Database Promise blocked", dbreq);

                                // Close all connections who block the update of the database
                                // Fix for IE 10 Preview 5
                                for (var i = connections.length - 1; i >= 0; i--) {
                                    var connection = connections[i];
                                    closeDatabaseConnection(connection);
                                }

                                //dfd.reject(e, req);
                            }
                        }
                        else {
                            //log("Delete Database function not found", dbName);
                            //dfd.reject(dbName);
                            // Workaround for older versions of chrome and FireFox
                            // Doesn't delete the database, but clears him
                            $.when(promise.dbInternal(-1, function (txn) {
                                for (var i = 0; i < txn.db.objectStoreNames.length; i++) {
                                    promise.deleteObjectStore(promise.self(txn), txn.db.objectStoreNames[i]);
                                }
                                closeDatabaseConnection(txn.db);
                            })).then(dfd.resolve, dfd.reject);
                        }
                    }
                    catch (e) {
                        log("Delete Database Promise exception", e, dbName);
                        dfd.reject(e, dbName);
                    }
                });
            }
        };

        function closeDatabaseConnection(db) {
            log("Close database Connection: ", db, db.connectionId);
            connections.splice(indexOf(connections, db, "connectionId"), 1);
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
            transaction.abort();
            closeDatabaseConnection(transaction.db);
        }

        function InitializeDatabse(txn, oldVersion, newVersion, configuration) {
            if (configuration && configuration.objectStoreConfiguration) {
                for (var version = oldVersion + 1; version == newVersion; version++) {
                    var data = GetDataByVersion(version, configuration.objectStoreConfiguration);
                    InitializeVersion(txn, data)
                    // Provide a function so the developpers can handle a version change.
                    // This is the place where conversion scripts are possible.
                    // onVersionInitialized(txn, oldVersion, newVersion)
                }
            }
        }

        function InitializeVersion(txn, data) {
            for (var i = 0; i < data.length; i++) {
                try {
                    var storeConfig = data[i];

                    if (storeConfig.remove) {
                        promise.deleteObjectStore(promise.self(txn), storeConfig.name);
                    }
                    else {
                        var storePromise = promise.createObjectStore(promise.self(txn), storeConfig.name, { keyPath: storeConfig.keyPath, autoIncrement: storeConfig.autoIncrement });

                        $.when(storePromise).then(function (store) {
                            for (var j = 0; j < storeConfig.Indexes.length; j++) {
                                var indexConfig = storeConfig.Indexes[j];

                                if (indexConfig.remove) {
                                    promise.deleteIndex(indexConfig.PropertyName, promise.self(store));
                                }
                                else {
                                    promise.createIndex(indexConfig.PropertyName, promise.self(store), { unique: indexConfig.IsUnique, multirow: indexConfig.Multirow });
                                }
                            }

                            if (storeConfig.DefaultData) {
                                for (var k = 0; k < storeConfig.DefaultData.length; k++) {
                                    promise.insert(promise.self(store), storeConfig.DefaultData[k])
                                }
                            }
                        })
                    }

                }
                catch (e) {
                    log("createIndex exception: ", e);
                    abortTransaction(txn);
                }
            }
        }

        function GetDataByVersion(version, data) {
            var result = [];
            for (var i = 0; i < data.length; i++) {
                if (parseInt(data[i].Version) == parseInt(version)) {
                    result[result.length] = data[i];
                }
            }
            return result;
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
    };

    function linq(promise) {

        var queryBuilderObj = function (objectStoreName) {
            this.from = objectStoreName;
            this.where = [];
            this.select = [];
            this.orderBy = [];
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
            smallerThen: 3
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
                if (!$.isArray(propertyNames)) {
                    propertyNames = [propertyNames]
                }

                for (var i = 0; i < propertyNames.length; i++) {
                    queryBuilder.select.push(propertyNames[i]);
                }
            }
            return executeQuery(queryBuilder);
        }

        function insert(queryBuilder, data, key) {
            var insertPromis = promise.insert(promise.objectStore(promise.writeTransaction(promise.db(), queryBuilder.from), queryBuilder.from), data, key)
            return $.Deferred(function (dfd) {
                $.when(insertPromis).then(function (storedData, storedkey) {
                    dfd.resolve(storedData, storedkey);
                }
            , dfd.reject);
            });
        }

        function update(queryBuilder, data, key) {
            var updatePromis = promise.update(promise.objectStore(promise.writeTransaction(promise.db(), queryBuilder.from), queryBuilder.from), data, key)
            return $.Deferred(function (dfd) {
                $.when(updatePromis).then(function (storedData, storedkey) {
                    dfd.resolve(storedData, storedkey);
                }
            , dfd.reject);
            });
        }

        function remove(queryBuilder, key) {
            var removePromis = promise.remove(promise.objectStore(promise.writeTransaction(promise.db(), queryBuilder.from), queryBuilder.from), key)
            return $.Deferred(function (dfd) {
                $.when(removePromis).then(function () {
                    dfd.resolve(key);
                }
            , dfd.reject);
            });
        }

        function clear(queryBuilder) {
            var clearPromis = promise.clear(promise.objectStore(promise.writeTransaction(promise.db(), queryBuilder.from), queryBuilder.from))
            return $.Deferred(function (dfd) {
                $.when(clearPromis).then(function () {
                    dfd.resolve();
                }
            , dfd.reject);
            });
        }

        function get(queryBuilder, key) {
            var getPromis = promise.get(promise.objectStore(promise.writeTransaction(promise.db(), queryBuilder.from), queryBuilder.from), key)
            return $.Deferred(function (dfd) {
                $.when(getPromis).then(function (data) {
                    dfd.resolve(data);
                }
            , dfd.reject);
            });
        }

        function executeQuery(queryBuilder) {
            return $.Deferred(function (dfd) {
                var objPromise = promise.objectStore(promise.readTransaction(promise.db(), queryBuilder.from), queryBuilder.from);
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

                $.when(cursorPromis).then(onComplete, dfd.reject, onProgress);

                function onComplete(data) {
                    function asyncForWhere(data, i) {
                        if (i < whereClauses.length) {
                            $.when(linq2indexedDB.prototype.utilities.where(data, whereClauses[i])).then(function (d) {
                                asyncForWhere(d, ++i);
                            }, dfd.reject);
                        }
                        else {
                            asyncForSort(data, 0);
                        }
                    }

                    function asyncForSort(data, i) {
                        if (i < queryBuilder.orderBy.length) {
                            $.when(linq2indexedDB.prototype.utilities.sort(data, queryBuilder.orderBy[i].propertyName, queryBuilder.orderBy[i].descending)).then(function (d) {
                                asyncForSort(d, ++i);
                            }, dfd.reject);
                        }
                        else {
                            // No need to notify again if it allready happend in the onProgress method.
                            if (returnData.length == 0) {
                                for (var j = 0; j < data.length; j++) {
                                    var obj = SelectData(data[j], queryBuilder.select)
                                    returnData.push(obj);
                                    dfd.notify(obj);
                                }
                            }
                            dfd.resolve(returnData);
                        }
                    }

                    // Start at 1 because we allready executed the first clause
                    asyncForWhere(data, 1);
                }

                function onProgress(data) {
                    // When there are no more where clauses to fulfill and the collection doesn't need to be sorted, the data can be returned.
                    // In the other case let the complete handle it.
                    if (whereClauses.length <= 1 && queryBuilder.orderBy.length == 0) {
                        var obj = SelectData(data, queryBuilder.select)
                        returnData.push(obj);
                        dfd.notify(obj);
                    }
                }
            });
        }

        function determineCursorPromis(objPromise, clause) {
            var cursorPromise;
            if (clause) {
                switch (clause.type) {
                    case whereType.equals:
                        cursorPromise = promise.cursor(promise.index(clause.propertyName, objPromise), IDBKeyRange.only(clause.value));
                        break;
                    case whereType.between:
                        cursorPromise = promise.cursor(promise.index(clause.propertyName, objPromise), IDBKeyRange.bound(clause.minValue, clause.maxValue, clause.minValueIncluded, clause.maxValueIncluded));
                        break;
                    case whereType.greaterThen:
                        cursorPromise = promise.cursor(promise.index(clause.propertyName, objPromise), IDBKeyRange.lowerBound(clause.value, clause.valueIncluded));
                        break;
                    case whereType.smallerThen:
                        cursorPromise = promise.cursor(promise.index(clause.propertyName, objPromise), IDBKeyRange.upperBound(clause.value, clause.valueIncluded));
                        break;
                    default:
                        cursorPromise = promise.cursor(objPromise);
                        break;
                }
            }
            else {
                cursorPromise = promise.cursor(objPromise);
            }

            return cursorPromise;
        }

        function SelectData(data, propertyNames) {
            if (propertyNames && propertyNames.length > 0) {
                if (!$.isArray(propertyNames)) {
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

    $.linq2indexedDB = linq2indexedDB;

    var linq2indexedDB2 = function (name, configuration, logging) {
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
            autoGenerateAllowed: false
        };

        if (configuration) {
            // From the moment the configuration is provided by the developper, autoGeneration isn't allowed.
            // If this would be allowed, the developper wouldn't be able to determine what to do for which version.
            if (configuration.schema) {
                var version = -1;
                for (key in configuration.schema) {
                    version = version > key ? version : key;
                }
                if (version > -1) {
                    dbConfig.autoGenerateAllowed = true;
                    dbConfig.version = version;
                    dbConfig.schema = configuration.schema;
                }
            }
            if (configuration.definition) {
                dbConfig.autoGenerateAllowed = true;
                dbConfig.definition = configuration.definition;
            }
            if (configuration.onupgradeneeded) {
                dbConfig.autoGenerateAllowed = true;
                dbConfig.onupgradeneeded = configuration.onupgradeneeded;
            }
            if (configuration.oninitializeversion) {
                dbConfig.autoGenerateAllowed = true;
                dbConfig.oninitializeversion = configuration.oninitializeversion;
            }
        }

        var databaseDefinition = [{
            version: 1,
            objectStores: [{ name: "", objectStoreOptions: { autoIncrement: true, keyPath: "Id"}}],
            indexes: [{ objectStoreName: "", propertyName: "", indexOptions: { unique: false, multirow: false}}],
            defaultData: [{ objectStoreName: "", data: []}]
        }];

        enableLogging = logging;
        var promise = core2();

        return {
            core: promise,
            linq: linq(promise),
            initialize: function () {
                log("Initialize Started");
                return $.Deferred(function (dfd) {
                    $.when(promise.db()).then(function (db) {
                        db.close();
                        log("Initialize Succesfull");
                        dfd.resolve();
                    }
            , dfd.reject);
                });
            },
            deleteDatabase: function () {
                return $.Deferred(function (dfd) {
                    var returnData = [];
                    $.when(promise.deleteDb()).then(function () {
                        dfd.resolve();
                    }
            , dfd.reject);
                });
            }
        };
    }

    linq2indexedDB.prototype.core = linq2indexedDB.core = core2();

    function core2() {
        function deferredHandler(handler, request) {
            return $.Deferred(function (dfd) {
                try {
                    handler(dfd, request);
                } catch (e) {
                    e.type = "exception";
                    dfd.rejectWith(request, [e.message, e]);
                }
            });
        }

        function IDBSuccessHandler(dfd, request) {
            request.onsuccess = function (e) {
                dfd.resolveWith(request, [request.result, e]);
            };
        }

        function IDBErrorHandler(dfd, request) {
            request.onerror = function (e) {
                dfd.rejectWith(request, [request.errorCode, e]);
            };
        }

        function IDBAbortHandler(dfd, request) {
            request.onabort = function (e) {
                dfd.notifyWith(request, [request.errorCode, e]);
            };
        }

        function IDBVersionChangeHandler(dfd, request) {
            database.onversionchange = function (e) {
                dfd.notifyWith(request, [request.result, e]);
            };
        }

        function IDBCompleteHandler(dfd, request) {
            request.oncomplete = function (e) {
                dfd.resolveWith(request, [request.result, e]);
            }
        }

        function IDBRequestHandler(dfd, request) {
            IDBSuccessHandler(dfd, request);
            IDBErrorHandler(dfd, request);
        }

        function IDBBlockedRequestHandler(dfd, request) {
            IDBRequestHandler(dfd, request);
            request.onblocked = function (e) {
                dfd.notifyWith(request, ["blocked", e]);
            };
        }

        function IDBOpenDBRequestHandler(dfd, request) {
            IDBBlockedRequestHandler(dfd, request);
            request.onupgradeneeded = function (e) {
                dfd.notifyWith(request, [request.result, e]);
            };
        }

        function IDBDatabaseHandler(dfd, database) {
            IDBAbortHandler(dfd, database);
            IDBErrorHandler(dfd, database);
            IDBVersionChangeHandler(dfd, database);
        }

        function IDBTransactionHandler(dfd, txn) {
            IDBCompleteHandler(dfd, txn);
            IDBAbortHandler(dfd, txn);
            IDBErrorHandler(dfd, txn);
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
                return IDBTransactionHandler(IDBDatabaseHandler, txn);
            }
        }

        var promise = {
            db: function (name, version) {
                return $.Deferred(function (dfd) {
                    // Initializing defaults
                    var req;
                    var name = name ? name : defaultDatabaseName;

                    // Creating a new database conection
                    if (version) {
                        log("db opening", name, version);
                        req = handlers.IDBOpenDBRequest(window.indexedDB.open(name, version));
                    }
                    else {
                        log("db opening", dbName);
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
                            //dfd.rejectWith(this, [error, e]);
                        },
                        function (result, event) {
                            if (event) {
                                // Sending a notify won't have any effect because the result is already resolved. There is nothing more to do than close the current connection.
                                //dfd.notifyWith(this, [result, e]);

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
                            var versionChangePromise = changeDatabaseStructure(linq2indexedDB.utilities.self(db), version);

                            versionChangePromise.then(function (txn, event) {
                                // When the new version is initialized, close the db connection, and make a new connection.
                                closeDatabaseConnection(txn.db);
                                linq2indexedDB.core.db(name).then(function (dbConnection, ev) {
                                    // Connection resolved
                                    dfd.resolveWith(this, [dbConnection, ev])
                                },
                                function (err, ev) {
                                    // Database connection error or abort
                                    dfd.rejectWith(this, [err, ev]);
                                },
                                function (dbConnection, ev) {
                                    // Database upgrade
                                    dfd.notifyWith(this, [dbConnection, ev]);
                                });
                            },
                            function (err, event) {
                                // txn error or abort
                                dfd.rejectWith(this, [err, event]);
                            },
                            function (txn, event) {
                                // txn created
                                // Fake the onupgrade event.
                                var context = req;
                                context.transaction = txn;

                                var upgardeEvent = event;
                                upgardeEvent.type = "upgradeneeded";
                                upgardeEvent.newVersion = version;
                                upgardeEvent.oldVersion = currentVersion;

                                dfd.notifyWith(context, [txn.db, upgardeEvent]);
                            });
                        }
                        else {
                            // Database Connection resolved.
                            log("DB Promise resolved", this, db, e, db.connectionId);
                            dfd.resolveWith(this, [db, e]);
                        }
                    },
                    function (error, e) {
                        // Database connection error or abort
                        log("DB Promise rejected", this, error, e);
                        dfd.reject(error, e);
                    },
                    function (result, e) {
                        // Database upgrade + db blocked
                        dfd.notifyWith(this, [result, e]);
                    });
                }).promise();
            },
            transaction: function (dbPromise, objectStoreNames, transactionType, autoGenerateAllowed) {
                return $.Deferred(function (dfd) {
                    // Initialize defaults
                    if (!$.isArray(objectStoreNames)) objectStoreNames = [objectStoreNames];
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
                                log("Transaction Promise database upgrade needed: ", db);
                                // Closing the current connections so it won't block the upgrade.
                                closeDatabaseConnection(db);
                                // Open a new connection with the new version
                                linq2indexedDB.core.db(db.name, version).then(function (dbConnection, event) {
                                    // When the upgrade is completed, the transaction can be opened.
                                    linq2indexedDB.core.transaction(linq2indexedDB.utilities.self(dbConnection), objectStoreNames, transactionType).then(function (txn, ev) {
                                        // txn completed
                                        dfd.resolveWith(this, [txn, ev]);
                                    },
                                    function (error, ev) {
                                        // txn error or abort
                                        dfd.rejectWith(this, [error, ev])
                                    },
                                    function (txn) {
                                        // txn created
                                        dfd.notifyWith(this, [txn]);
                                    });
                                },
                                function (error, event) {
                                    // When an error occures, bubble up.
                                    dfd.rejectWith(this, [error, event])
                                },
                                function (dbConnection, event) {
                                    // When an upgradeneeded event is thrown, create the non-existing object stores
                                    if (event.type == "upgradeneeded") {
                                        for (var j = 0; j < nonExistingObjectStores.length; j++) {
                                            linq2indexedDB.core.createObjectStore(linq2indexedDB.utilities.self(dbConnection.transaction), nonExistingObjectStores[j])
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
                                    dfd.resolveWith(this, [result, event]);
                                },
                                function (err, event) {
                                    // txn error or abort
                                    dfd.rejectWith(this, [err, event]);
                                });

                                // txn created
                                log("Transaction Promise transaction created.", txn);
                                dfd.notifyWith(txn, [txn]);
                            }
                        }
                        catch (ex) {
                            log("Transaction Promise exception", ex, db);
                            ex.type = "exception";
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    },
                    function (err, e) {
                        // db err
                        dfd.rejectWith(this, [err, e])
                    });
                }).promise();
            },
            objectStore: function (transactionPromise, objectStoreName) {
                return $.Deferred(function (dfd) {
                    transactionPromise.then(function (txn, e) {
                        //txn completed
                        // TODO: what todo in this case?
                    }, function (error, e) {
                        dfd.rejectWith(this, [error, e]);
                    }, function (txn, e) {
                        // txn created
                        log("ObjectStore Promise started", transactionPromise, objectStoreName);
                        try {
                            var store = txn.objectStore(objectStoreName);
                            log("ObjectStore Promise completed", store);
                            // Object store resolved.
                            dfd.resolveWith(store, [txn, store]);
                        }
                        catch (ex) {
                            log("Error in Object Store Promise", ex, txn);
                            // Resolving objectstore failed.
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    });
                }).promise();
            },
            createObjectStore: function (changeDatabaseStructurePromise, objectStoreName, objectStoreOptions) {
                return $.Deferred(function (dfd) {
                    changeDatabaseStructurePromise.then(function (txn, e) {
                        // txn completed
                        // TODO: what todo in this case?
                    }, function (error, e) {
                        // txn error or abort
                        dfd.rejectWith(this, [error, e]);
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
                                dfd.resolveWith(store, [txn, store]);
                            }
                            else {
                                // If the object store exists, retrieve it
                                $.when(promise.objectStore(promise.self(txn), objectStoreName)).then(function (store) {
                                    // store resolved
                                    log("ObjectStore Found", store, objectStoreName);
                                    log("createObjectStore Promise completed", store, objectStoreName);
                                    dfd.resolveWith(store, [store]);
                                }, function (error, event) {
                                    // store error
                                    dfd.rejectWith(this, [error, event]);
                                });
                            }
                        }
                        catch (ex) {
                            // store exception
                            log("Error in createObjectStore Promise", ex);
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    });
                }).promise();
            },
            deleteObjectStore: function (changeDatabaseStructurePromise, objectStoreName) {
                return $.Deferred(function (dfd) {
                    changeDatabaseStructurePromise.then(function (txn, e) {
                        // txn completed
                        // TODO: what todo in this case?
                    }, function (error, e) {
                        // txn error
                        dfd.rejectWith(this, [error, e]);
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
                                dfd.resolveWith(this, [txn, objectStoreName]);
                            }
                            else {
                                // store not found, return error
                                log("ObjectStore Not Found", objectStoreName);
                                dfd.rejectWith(this, ["ObjectStore Not Found" + objectStoreName]);
                            }
                        }
                        catch (ex) {
                            // store exception
                            log("Error in deleteObjectStore Promise", ex);
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    });
                }).promise();
            },
            index: function (propertyName, objectStorePromise, autoGeneratedAllowed) {
                return $.Deferred(function (dfd) {
                    objectStorePromise.then(function (txn, objectStore) {
                        // store resolved
                        log("Index Promise started", objectStore)
                        try {
                            if (objectStore.indexNames.contains(propertyName + "-index")) {
                                // If index exists, resolve it
                                var index = objectStore.index(propertyName + "-index");
                                log("Index Promise compelted", index);
                                dfd.resolveWith(this, [txn, index, store]);
                            }
                            else if (autoGeneratedAllowed) {
                                // If index doesn't exists, create it if autoGeneratedAllowed
                                var version = GetDatabaseVersion(txn.db) + 1
                                // Close the currenct database connections so it won't block
                                closeDatabaseConnection(txn.db);

                                var transactionType = txn.mode;
                                var objectStoreNames = txn.objectStoreNames;
                                var objectStoreName = objectStore.name;

                                // Open a new connection with the new version
                                linq2indexedDB.core.db(txn.db.name, version).then(function (dbConnection, event) {
                                    // When the upgrade is completed, the index can be resolved.
                                    linq2indexedDB.core.transaction(linq2indexedDB.utilities.self(dbConnection), objectStoreNames, transactionType).then(function (transaction, ev) {
                                        // txn completed
                                        // TODO: what to do in this case
                                    },
                                    function (error, ev) {
                                        // txn error or abort
                                        dfd.rejectWith(this, [error, ev])
                                    },
                                    function (transaction) {
                                        // txn created
                                        linq2indexedDB.core.index(propertyName, linq2indexedDB.core.objectStore(linq2indexedDB.utilities.self(transaction), objectStoreName)).then(function (trans, index, store) {
                                            dfd.resolveWith(this, [trans, index, store]);
                                        }, function (error, ev) {
                                            // txn error or abort
                                            dfd.rejectWith(this, [error, ev]);
                                        });
                                    });
                                },
                                function (error, event) {
                                    // When an error occures, bubble up.
                                    dfd.rejectWith(this, [error, event]);
                                },
                                function (dbConnection, event) {
                                    // When an upgradeneeded event is thrown, create the non-existing object stores
                                    if (event.type == "upgradeneeded") {
                                        for (var j = 0; j < nonExistingObjectStores.length; j++) {
                                            linq2indexedDB.core.createIndex(propertyName, promise.createObjectStore(promise.self(txn), objectStore.name)).then(function (index, store, transaction) {
                                                // index created
                                            },
                                            function (error, ev) {
                                                // When an error occures, bubble up.
                                                dfd.rejectWith(this, [error, ev]);
                                            });
                                        }
                                    }
                                });
                            }
                        }
                        catch (ex) {
                            // index exception
                            log("Error in index Promise", ex);
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            createIndex: function (propertyName, createObjectStorePromise, indexOptions) {
                return $.Deferred(function (dfd) {
                    $.when(createObjectStorePromise).then(function (txn, objectStore) {
                        log("createIndex Promise started", objectStore)
                        try {
                            var index = objectStore.createIndex(propertyName + "-index", propertyName, { unique: indexOptions ? indexOptions.IsUnique : false/*, multirow: indexOptions ? indexOptions.Multirow : false*/ });
                            log("createIndex Promise compelted", index);
                            dfd.resolveWith(this, [txn, index, store]);
                        }
                        catch (ex) {
                            log("createIndex Promise Failed", ex);
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            deleteIndex: function (propertyName, createObjectStorePromise) {
                return $.Deferred(function (dfd) {
                    $.when(createObjectStorePromise).then(function (txn, objectStore) {
                        log("deleteIndex Promise started", objectStore, txn)
                        try {
                            objectStore.deleteIndex(propertyName + "-index");

                            log("deleteIndex Promise compelted", propertyName);
                            dfd.resolveWith(this, [txn, propertyName, store]);
                        }
                        catch (ex) {
                            log("deleteIndex Promise Failed", ex);
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            cursor: function (sourcePromise, range, direction) {
                return $.Deferred(function (dfd) {
                    $.when(sourcePromise).then(function (txn, source) {
                        log("Cursor Promise Started", source);

                        var returnData = [];

                        handlers.IDBRequest(source.openCursor(range || IDBKeyRange.lowerBound(0), direction)).then(function (result, e) {
                            if (!result) {
                                log("Cursor Promise completed", req);
                                dfd.resolveWith(this, [returnData, e]);
                            }
                            else {
                                if (result.value) {
                                    dfd.notifyWith(this, [result.value, e]);
                                    returnData.push(result.value);
                                }
                                result["continue"]();
                            }
                        },
                        function (error, e) {
                            log("Cursor Promise error", e, req);
                            dfd.rejectWith(this, [error, e]);
                        });

                    }, function (error, e) {
                        // store or index error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            keyCursor: function (indexPromise, range, direction) {
                return $.Deferred(function (dfd) {
                    indexPromise.then(function (txn, index, store) {
                        log("keyCursor Promise Started", index);
                        var returnData = [];

                        handlers.IDBRequest(index.openKeyCursor(range || IDBKeyRange.lowerBound(0), direction)).then(function (result, e) {
                            if (!result) {
                                log("keyCursor Promise completed", req);
                                dfd.resolve(this, [returnData, e, txn]);
                            }
                            else {
                                if (result.value) {
                                    dfd.notifyWith(this, [result.value, e, txn]);
                                    returnData.push(result.value);
                                }
                                result["continue"]();
                            }
                        },
                        function (error, e) {
                            log("keyCursor Promise error", error, e);
                            dfd.rejectWith(this, [error, e]);
                        });
                    }, function (error, e) {
                        // index error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            get: function (sourcePromise, key) {
                return $.Deferred(function (dfd) {
                    sourcePromise.then(function (txn, source) {
                        log("Get Promise Started", source);

                        handlers.IDBRequest(source.get(key)).then(function (result, e) {
                            log("Get Promise completed", result);
                            dfd.resolveWith(this, [result, e, txn]);
                        }, function (error, e) {
                            log("Get Promise error", e, error);
                            dfd.rejectWith(this, [error, e]);
                        });
                    }, function (error, e) {
                        // store or index error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            getKey: function (indexPromise, key) {
                return $.Deferred(function (dfd) {
                    indexPromise.then(function (txn, index, objectStore) {
                        log("GetKey Promise Started", index);

                        handlers.IDBRequest(index.getKey(key)).then(function (result, e) {
                            log("GetKey Promise completed", result);
                            dfd.resolveWith(this, [result, e, txn]);
                        }, function (error, e) {
                            log("GetKey Promise error", error, e);
                            dfd.rejectWith(this, [error, e]);
                        });
                    }, function (error, e) {
                        // index error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            insert: function (objectStorePromise, data, key) {
                return $.Deferred(function (dfd) {
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
                                dfd.resolveWith(this, [data, result, e, txn]);
                                //dfd.resolve(result, req.transaction);
                            }, function (error, e) {
                                log("Insert Promise error", error, e);
                                dfd.rejectWith(this, [error, e]);
                            });
                        }
                        catch (ex) {
                            log("Insert Promise exception", ex);
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            update: function (objectStorePromise, data, key) {
                return $.Deferred(function (dfd) {
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
                                dfd.resolve(this, [data, result, e, txn]);
                                //dfd.resolve(result, req.transaction);
                            }, function (error, e) {
                                log("Update Promise error", error, e);
                                dfd.reject(this, [error, e]);
                            });
                        }
                        catch (ex) {
                            log("Update Promise exception", ex);
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            remove: function (objectStorePromise, key) {
                return $.Deferred(function (dfd) {
                    objectStorePromise.then(function (txn, store) {
                        log("Remove Promise Started", store);

                        try {
                            handlers.IDBRequest(store["delete"](key)).then(function (result, e) {
                                log("Remove Promise completed", req, result);
                                dfd.resolveWith(this, [result, e, txn]);
                            },
                            function (error, e) {
                                log("Remove Promise error", error, e);
                                dfd.reject(this, [error, e]);
                            });
                        }
                        catch (ex) {
                            log("Remove Promise exception", ex);
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            clear: function (objectStorePromise) {
                return $.Deferred(function (dfd) {
                    objectStorePromise.then(function (store, txn) {
                        log("Clear Promise Started", store);
                        try {
                            handlers.IDBRequest(store.clear()).then(function (result, e) {
                                log("Clear Promise completed", result, e);
                                dfd.resolveWith(this, [result, e, txn]);
                            },
                            function (error, e) {
                                log("Clear Promise error", error, e);
                                dfd.reject(this, [error, e]);
                            });
                        }
                        catch (ex) {
                            log("Clear Promise exception", ex);
                            abortTransaction(txn);
                            dfd.rejectWith(this, [ex.message, ex]);
                        }
                    }, function (error, e) {
                        // store error
                        dfd.rejectWith(this, [error, e]);
                    });
                }).promise();
            },
            deleteDb: function (name) {
                return $.Deferred(function (dfd) {
                    try {
                        if (typeof (window.indexedDB.deleteDatabase) != "undefined") {

                            handlers.IDBBlockedRequest(window.indexedDB.deleteDatabase(name)).then(function (result, e) {
                                log("Delete Database Promise completed", result, e, name);
                                dfd.resolveWith(this, [result, e, name]);
                            }, function (error, e) {
                                // added for FF, If a db gets deleted that doesn't exist an errorCode 6 ('NOT_ALLOWED_ERR') is given
                                if (e.currentTarget.errorCode == 6) {
                                    dfd.resolveWith(this, [error, e, name]);
                                }
                                else {
                                    log("Delete Database Promise error", error, e);
                                    dfd.rejectWith(this, [error, e]);
                                }
                            }, function (result, e) {

                                log("Delete Database Promise blocked", dbreq);
                                dfd.resolveWith(this, [result, e]);
                            });
                        }
                        else {
                            log("Delete Database function not found", name);
                            // Workaround for older versions of chrome and FireFox
                            // Doesn't delete the database, but clears him
                            promise.db(name, -1).then(function (result, e) {
                                dfd.resolveWith(this, [result, e, name]);
                            },
                            function (error, e) {
                                log("Clear Promise error", error, e);
                                dfd.reject(this, [error, e]);
                            },
                            function (dbConnection, event) {
                                // When an upgradeneeded event is thrown, create the non-existing object stores
                                if (event.type == "upgradeneeded") {
                                    for (var i = 0; i < dbConnection.objectStoreNames.length; i++) {
                                        linq2indexedDB.core.deleteObjectStore(promise.self(dbConnection.txn), dbConnection.objectStoreNames[i]);
                                    }
                                    closeDatabaseConnection(dbConnection);
                                }
                            });
                        }
                    }
                    catch (ex) {
                        log("Delete Database Promise exception", ex);
                        dfd.rejectWith(this, [ex.message, ex]);
                    }
                });
            }
        };

        function changeDatabaseStructure(dbPromise, version, onTransactionCompleted) {
            return $.Deferred(function (dfd) {
                dbPromise.then(function (db, e) {
                    log("Version Change Transaction Promise started", db, version);
                    handlers.IDBBlockedRequest(setVersion(version)).then(function (txn, event) {
                        // txn completed
                        dfd.resolveWith(this, [txn, event]);
                    },
                    function (error, event) {
                        // txn error or abort
                        dfd.rejectWith(this, [error, event]);
                    },
                    function (result, event) {
                        // txn created
                        dfd.notifyWith(this, [result, event]);
                    });
                }, function (error, event) {
                    // db error or abort
                    dfd.rejectWith(this, [error, event]);
                });
            }).promise();
        }

        function closeDatabaseConnection(db) {
            log("Close database Connection: ", db, db.connectionId);
            connections.splice(indexOf(connections, db, "connectionId"), 1);
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
            transaction.abort();
            closeDatabaseConnection(transaction.db);
        }

        return promise;
    }


})(window.jQuery, window);

