/// <reference path="../Scripts/jquery-1.7.1.js" />
/// <reference path="../Scripts/jquery-1.7.1-vsdoc.js" />
/// <reference path="Sort.js"


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
    enableLogging = true,
    log = function () {
        if (typeof (window.console) === "undefined" || !enableLogging) {
            return false;
        }
        return window.console.log.apply(console, arguments);
    },
    implementation = initializeIndexedDB(),
    promise;

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
        return new linq2indexedDB.fn.init(name, configuration, logging);
    }

    linq2indexedDB.fn = linq2indexedDB.prototype = {
        init: function (name, configuration, logging) {
            enableLogging = logging;
            promise = core(name, configuration);
        },
        linq: function () {
            return linq();
        },
        initialize: function () {
            return $.Deferred(function (dfd) {
                var returnData = [];
                $.when(promise.db()).then(function () {
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

    linq2indexedDB.fn.init.prototype = linq2indexedDB.fn;

    function core(name, configuration) {
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
                        var worker = new Worker("../Linq/Sort.js");
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
                    var worker = new Worker("../Linq/Where.js");
                    worker.onmessage = function (event) {
                        dfd.resolve(event.data)
                    };
                    worker.onerror = dfd.reject;
                    worker.postMessage({ data: data, clause: clause });
                });
            }
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

    function linq() {
        var queryBuilder = {
            from: "",
            where: [],
            select: [],
            orderBy: []
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
                            $.when(promise.where(data, whereClauses[i])).then(function (d) {
                                asyncForWhere(d, ++i);
                            }, dfd.reject);
                        }
                        else {
                            asyncForSort(data, 0);
                        }
                    }

                    function asyncForSort(data, i) {
                        if (i < queryBuilder.orderBy.length) {
                            $.when(promise.sort(data, queryBuilder.orderBy[i].propertyName, queryBuilder.orderBy[i].descending)).then(function (d) {
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
                return from(queryBuilder, objectStoreName);
            }
        }
    }

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
    }

    $.linq2indexedDB = linq2indexedDB;

})(window.jQuery, window);

