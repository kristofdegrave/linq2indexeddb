/// <reference path="jquery-1.7.1-vsdoc.js" />
/// <reference path="jquery-1.7.1.js" />

(function ($, window) {
    /// <param name="$" type="jQuery" />    
    "use strict";

    if (typeof ($) !== "function") {
        // no jQuery!        
        throw "indexedDB: jQuery not found. Please ensure jQuery is referenced before the indexedDB.js file.";
    }

    if (!window.JSON) {
        // no JSON!        
        throw "indexedDB: No JSON parser found. Please ensure json2.js is referenced before the indexedDB.js file if you need to support clients without native JSON parsing support, e.g. IE<8.";
    }

    var indexedDB,
        events = {},
        implementations = {
            NONE: 0,
            NATIVE: 1,
            MICROSOFT: 2,
            MOZILLA: 3,
            GOOGLE: 4,
            MICROSOFTPROTOTYPE: 5
        },
        enableLogging = true,
        log = function () {
            if (typeof (window.console) === "undefined" || !enableLogging) {
                return false;
            }
            return window.console.log.apply(console, arguments);
        },
        implementation = InitializeIndexedDB(),
        promise;

    indexedDB = function (name, configuration, logging) {
        /// <summary>Creates a new or opens an existing database for the given name</summary>        
        /// <param name="name" type="String">The name of the database</param>        
        /// <param name="configuration" type="Object">        
        ///     [Optional] provide comment      
        /// </param>        
        /// <param name="logging" type="Boolean">        
        ///     [Optional] A flag indicating whether connection logging is enabled to the browser        
        ///     console/log. Defaults to false.        
        /// </param>        
        /// <returns type="indexedDB" />
        return new indexedDB.fn.init(name, configuration, logging);
    }

    indexedDB.fn = indexedDB.prototype = {
        init: function (name, configuration, logging) {
            enableLogging = logging;
            promise = core(name, configuration, logging);
        },
        linq: function () {
            return linq();
        },
        initialize: function (onsuccess, onerror) {
            $.when(promise.db()).then(onsuccess, onerror)
        },
        deleteDatabase: function (onsuccess, onerror) {
            $.when(promise.deleteDb()).then(onsuccess, onerror)
        }
    };

    indexedDB.fn.init.prototype = indexedDB.fn;

    function core(name, configuration, logging) {
        var dbName = "Default";
        var dbVersion;

        if (name) {
            dbName = name;
        }

        if (configuration) {
            dbVersion = configuration.version;
        }

        return {
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
                            req = window.indexedDB.open(dbName, version);
                        }
                        else {
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

                            var currentVersion = GetDatabaseVersion(result);

                            if (currentVersion < version || (version == -1)) {
                                log("DB Promise upgradeneeded", result);
                                try {
                                    var versionChangePromise = promise.changeDatabaseStructure(promise.self(result), version, function () {
                                        log("DB Promise upgradeneeded completed");
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
                                log("DB Promise resolved", result);
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
                            var result;

                            if (e.result) result = e.result; // IE 8/9 prototype 
                            if (req.result) result = req.result;

                            log("DB Promise upgradeneeded", result);

                            req.transaction.oncomplete = function () {
                                log("DB Promise upgradeneeded completed", req.transaction);
                                closeDatabaseConnection(req.transaction.db);
                                $.when(promise.db()).then(function (dbConnection) {
                                    dfd.resolve(dbConnection)
                                }, dfd.reject);
                            }

                            if (initVersion && typeof (initVersion) === 'function') {
                                initVersion(req.transaction, e.oldVersion, e.newVersion, configuration)
                            }
                        }

                        req.onblocked = function (e) {
                            var result;

                            if (e.result) result = e.result; // IE 8/9 prototype 
                            if (req.result) result = req.result;

                            log("DB Promise blocked", result);
                            dfd.reject(e, req);
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

                                txn.oncomplete = function () {
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
                                db.close();
                                log("Close database Connection: ", db);
                                $.when(promise.dbInternal(version, function (txn) {
                                    for (var j = 0; j < nonExistingObjectStores.length; j++) {
                                        promise.createObjectStore(promise.self(txn), nonExistingObjectStores[j])
                                    }
                                })).then(function () {
                                    $.when(promise.transaction(promise.db(), objectStoreNames, transactionType, onTransactionCompleted)).then(function (txn) {
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
                                dfd.reject(e, dbName);
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
            },
            sort: function (dataPromise, propertyName, descending) {
                return $.Deferred(function (dfd) {
                    $.when(dataPromise).then(function (data) {
                        var worker = new Worker("../Scripts/Sort.js");
                        worker.onmessage = function (event) { dfd.resolve(event.data) };
                        worker.onerror = dfd.reject;
                        worker.postMessage({ data: data, propertyName: propertyName, descending: descending });
                    }, dfd.reject);
                });
            }
        }
    };

    function InitializeIndexedDB() {
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

    function closeDatabaseConnection(db) {
        log("Close database Connection: " + db);
        db.close();
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

    function whereInternal(objectStorePromise, propertyName) {
        return {
            equals: function (value) {
                var cursorPromis = promise.cursor(promise.index(propertyName, objectStorePromise), IDBKeyRange.only(value));
                return SelectInternal(cursorPromis)
            },
            greaterThen: function (value, valueIncluded) {
                var cursorPromis = promise.cursor(promise.index(propertyName, objectStorePromise), IDBKeyRange.lowerBound(value, typeof (valueIncluded) === 'undefined' ? false : valueIncluded));
                return SelectInternal(cursorPromis)
            },
            smallerThen: function (value, valueIncluded) {
                var cursorPromis = promise.cursor(promise.index(propertyName, objectStorePromise), IDBKeyRange.upperBound(value, typeof (valueIncluded) === 'undefined' ? false : valueIncluded));
                return SelectInternal(cursorPromis)
            },
            between: function (minValue, maxValue, minValueIncluded, maxValueIncluded) {
                var cursorPromis = promise.cursor(promise.index(propertyName, objectStorePromise), IDBKeyRange.bound(minValue, maxValue, typeof (minValueIncluded) === 'undefined' ? false : minValueIncluded), typeof (maxValueIncluded) === 'undefined' ? false : maxValueIncluded);
                return SelectInternal(cursorPromis)
            }
        }
    }

    function OrderInternal(cursorPromis) {
        return {
            orderBy: function (propertyName) {
                $.when(cursorPromis).then(function (data) {
                    return SelectInternal(promise.sort(data, propertyName, false));
                }
                        , function () { /*error handler*/ });
            },
            orderByDesc: function (propertyName) {
                $.when(cursorPromis).then(function (data) {
                    return SelectInternal(promise.sort(data, propertyName, true));
                }
                        , function () { /*error handler*/ });
            }
        }
    }

    function SelectData(data, propertyNames) {
        if (propertyNames) {
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

    function SelectInternal(cursorPromis) {
        return {
            select: function (propertyNames) {
                return {
                    all: function (callback) {
                        var returnData = [];
                        var notificationCalled = false;
                        $.when(cursorPromis).then(function (data) {
                            if (typeof (callback) === 'function') {
                                if (!notificationCalled) returnData = data;
                                callback(returnData);
                            }
                        }
                                , function () { /*error handler*/ }
                                , function (data, req) {
                                    returnData.push(SelectData(data, propertyNames));
                                    notificationCalled = true;
                                });
                    },
                    forEach: function (callback) {
                        var notificationCalled = false;
                        $.when(cursorPromis).then(function (data) {
                            /* complete */
                            if (!notificationCalled) {
                                for (var i = 0; i < data.length; i++) {
                                    callback(SelectData(data[i], propertyNames));
                                }
                            }

                        }
                                , function () { /* Error handler */ }
                                , function (data, req) {
                                    if (typeof (callback) === 'function') {
                                        callback(SelectData(data, propertyNames));
                                    }
                                    notificationCalled = true;
                                });
                    }
                }
            }
        }
    }

    function linq() {
        return {
            from: function (objectStoreName) {
                return {
                    where: function (propertyName, clause) {
                        if (propertyName) {
                            if (clause) {
                                if (clause.equals) {
                                    return whereInternal(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName), propertyName).Equals(clause.equals);
                                }
                                else if (clause.range) {
                                    return whereInternal(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName), propertyName).Between(clause.range[0], clause.range[1], clause.range[2], clause.range[3]);
                                }
                            }
                            else {
                                return whereInternal(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName), propertyName);
                            }
                        }
                        else {
                            return SelectInternal(promise.cursor(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName)));
                        }
                    },
                    orderBy: function (propertyName) {
                        return SelectInternal(promise.sort(promise.cursor(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName)), propertyName, false));
                    },
                    select: function (propertyNames) {
                        return SelectInternal(promise.cursor(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName))).select(propertyNames);
                    },
                    insert: function (data, key, onsuccess, onerror) {
                        $.when(promise.insert(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), data, key)).then(onsuccess, onerror);
                    },
                    update: function (data, key, onsuccess, onerror) {
                        $.when(promise.update(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), data, key)).then(onsuccess, onerror);
                    },
                    remove: function (key, onsuccess, onerror) {
                        $.when(promise.remove(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), key)).then(onsuccess, onerror);
                    },
                    clear: function (onsuccess, onerror) {
                        $.when(promise.clear(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName))).then(onsuccess, onerror);
                    }
                }
            }
        }
    }

    $.indexedDB = indexedDB;

    //    $.extend({
    //        indexedDB: function (databaseConfiguration) {

    //            // QueryBuilder tryout
    //            function query() {
    //                this.whereClause = [];
    //                this.selectClause = [];
    //                this.orderByClause = [];
    //                this.fromClause = "";
    //            }

    //            function linq2() {
    //                var query = new query();
    //                return {
    //                    from: function (objectStoreName) {
    //                        return {
    //                            where: function (propertyName, clause) {
    //                                if (clause) {
    //                                    where2(query, propertyName, clause);
    //                                }
    //                                else {

    //                                }
    //                            },
    //                            orderBy: function (propertyName, descending) {
    //                                orderBy2(query, propertyName, descending);
    //                            },
    //                            select: function (propertyNames) {
    //                                select2(query, propertyNames);
    //                            }
    //                        }
    //                    }
    //                }
    //            }

    //            function test(a) { alert(a); }

    //            function select2(query, propertyNames) {
    //                for (var propertyName in propertyNames) {
    //                    var x = propertyName.split('.')
    //                    if (x.length == 1) {
    //                        query.selectClause.push({ objectStore: query.from, propertyName: x[0] });
    //                    }
    //                    else if (x.length == 2) {
    //                        query.selectClause.push({ objectStore: x[0], propertyName: x[1] });
    //                    }
    //                }
    //            }

    //            function orderBy2(query, propertyName, desceding) {
    //                if (descending) {
    //                    query.orderByClause.push({ propertyName: propertyName, descending: descending });
    //                }
    //                else {
    //                    query.orderByClause.push({ propertyName: propertyName, descending: false });
    //                }
    //            }

    //            function where2(query, propertyName, clause) {
    //                query.whereClause.push({ propertyName: propertyName, clause: clause })
    //            }

    //        }
    //    });
})(window.jQuery, window);