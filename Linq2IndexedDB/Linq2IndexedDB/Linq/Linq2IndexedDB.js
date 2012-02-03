/// <reference path="jquery-1.7.1-vsdoc.js" />
/// <reference path="jquery-1.7.1.js" />

(function($){
    $.extend({
        linq2indexeddb: function(databaseConfiguration){

            var logging = true;

            log = function (msg, param1, param2, param3) {            
                var message;            
                if (typeof (window.console) === "undefined" || !logging) {                
                    return;            
                }            
                message = "[" + new Date().toTimeString() + "] linq2indexedDB: " + msg;            
                if (window.console.debug) {
                    if(param1){                
                        if(param2){
                            if(param3){
                                window.console.debug(message, param1, param2, param3);
                            }
                            else{
                                window.console.debug(message, param1, param2);
                            }
                        }
                        else{
                            window.console.debug(message, param1); 
                        }  
                    }      
                    else{
                        window.console.debug(message);   
                    }   
                } 
                else if (window.console.log) {                
                    window.console.log(message);            
                }        
            };

            var prototype = Initialize_IndexedDB();

            var promise = {
                self: function(value){
                    return $.Deferred(function(dfd){ 
                        dfd.resolve(value);
                    });
                },

                db : function(){
                    var version = databaseConfiguration ? databaseConfiguration.version : undefined
                    return promise.dbInternal(version, InitializeDatabse)
                },

                dbInternal: function(databaseVersion, initVersion){
                    return $.Deferred(function(dfd){
                        try {
                            var req;
                            var name = databaseConfiguration ? databaseConfiguration.Name : "Default"
                            
                            if(databaseVersion){
                                req = window.indexedDB.open(name, databaseVersion);
                            }
                            else{
                                req = window.indexedDB.open(name);
                            }

                            req.onsuccess = function (e) {
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                result.onabort = function(e){
                                    log("DB abort", e, result);
                                    result.close();
                                }

                                result.onerror = function(e){
                                    log("DB error", e, result);
                                    result.close();
                                }

                                result.onversionchange = function(e){
                                    log("DB versionchange", e, result);
                                    result.close();
                                }  
                                
                                var dbver = GetDatabaseVersion(result);                      

                                if(databaseVersion && dbver < databaseVersion){
                                    log("DB Promise upgradeneeded", result);
                                     try {
                                        var versionChangePromise = promise.changeDatabaseStructure(promise.self(result), databaseVersion, function (){
                                            log("DB Promise upgradeneeded completed");
                                            $.when(promise.db()).then(function (dbConnection){
                                                    dfd.resolve(dbConnection);
                                                }, dfd.reject);
                                        });

                                        $.when(versionChangePromise).then(function(txn){
                                            initVersion(txn, dbver, databaseVersion);
                                        }, dfd.reject);
                                    }
                                    catch (e) {
                                        log("Upgrade exception", e, result);
                                        dfd.reject(e, result);
                                    }
                                }
                                else{
                                    log("DB Promise resolved", result);
                                    dfd.resolve(result);
                                }
                            }

                            req.onerror = function (e) {
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                log("DB Promise rejected", result);
                                dfd.reject(e, req);
                            }

                            req.onupgradeneeded = function (e){
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                log("DB Promise upgradeneeded", result);
                                
                                req.transaction.oncomplete = function () {
                                    log("DB Promise upgradeneeded completed", req.transaction);
                                    closeDatabaseConnection(req.transaction.db);
                                    $.when(promise.db()).then(function (dbConnection){
                                        dfd.resolve(dbConnection)
                                    }, dfd.reject);
                                }

                                if(initVersion && typeof(initVersion) === 'function'){
                                    initVersion(req.transaction, e.oldVersion, e.newVersion)
                                }
                            }

                            req.onblocked = function (e){
                                var result;

                                if (prototype) result = e.result;
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
                                if(!version)
                                {
                                    version = GetDatabaseVersion(db)
                                }

                                var req = db.setVersion(version);

                                req.onsuccess = function (e) {
                                    var txn;

                                    if (prototype) txn = e.result;
                                    if (req.result) txn = req.result;
                                    
                                    txn.oncomplete = function () {
                                        log("Version Change Transaction transaction completed", txn);
                                        closeDatabaseConnection(txn.db);
                                        if (typeof(onTransactionCompleted) === 'function') onTransactionCompleted();
                                    }

                                    log("Version Change Transaction Promise completed", txn);
                                    dfd.resolve(txn);
                                }

                                req.onerror = function (e) {
                                    var result;

                                    if (prototype) result = e.result;
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
                                    if(!db.objectStoreNames.contains(objectStoreNames[i])){
                                        nonExistingObjectStores.push(objectStoreNames[i]);
                                    }
                                }

                                if(nonExistingObjectStores.length > 0 && (!databaseConfiguration || !databaseConfiguration.objectStoreConfiguration))
                                {
                                    var version = GetDatabaseVersion(db) + 1
                                    log("Transaction Promise database upgrade needed: " + db);
                                    db.close();
                                    log("Close database Connection: " + db);
                                    $.when(promise.dbInternal(version, function(txn){
                                        for (var j = 0; j < nonExistingObjectStores.length; j++) {
                                            promise.createObjectStore(promise.self(txn), nonExistingObjectStores[j])
                                        }
                                    })).then(function(){
                                        $.when(promise.transaction(promise.db(), objectStoreNames, transactionType, onTransactionCompleted)).then(function(txn){
                                            dfd.resolve(txn);
                                        }, dfd.reject);
                                    });
                                }
                                else
                                {
                                    var txn = db.transaction(objectStoreNames, transactionType);
                                    txn.oncomplete = function () {
                                        log("Transaction completed");
                                        closeDatabaseConnection(txn.db);
                                        if (typeof(onTransactionCompleted) === 'function') onTransactionCompleted();
                                    }

                                    log("Transaction Promise completed", txn);
                                    dfd.resolve(txn);
                                }
                            }
                            catch (e) {
                                log("Transaction Promise exception", e);
                                dfd.reject(e, db);
                            }

                        }, dfd.reject);
                    }).promise();
                    ;
                },

                readTransaction: function (dbPromise, objectStoreNames, onTransactionCompleted){
                    return promise.transaction(dbPromise, objectStoreNames, IDBTransaction.READ_ONLY);
                },

                writeTransaction: function (dbPromise, objectStoreNames, onTransactionCompleted){
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
                                log("Error in Object Store Promise", e);
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
                                    var store = txn.db.createObjectStore(objectStoreName, {
                                                    "autoIncrement": objectStoreOptions ? objectStoreOptions.autoIncrement : true,
                                                    "keyPath": objectStoreOptions ? objectStoreOptions.keyPath : "id"
                                                }, objectStoreOptions ? objectStoreOptions.autoIncrement : true);

                                    log("ObjectStore Created", store);
                                    log("createObjectStore Promise completed", store);
                                    dfd.resolve(store, txn);
                                }
                                else {
                                    $.when(promise.objectStore(promise.self(txn), objectStoreName)).then(function(store){
                                        log("ObjectStore Found", store);
                                        log("createObjectStore Promise completed", store);
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
                            log("deleteObjectStore Promise started", changeDatabaseStructurePromise, objectStoreName, objectStoreOptions);
                            try {
                                if (!txn.db.objectStoreNames.contains(objectStoreName)) {
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
                                if(prototype){
                                    index = objectStore.createIndex(propertyName + "-index", propertyName, indexOptions ? indexOptions.IsUnique : false);
                                }
                                else{
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
                                if(objectStore.indexNames.contains(propertyName + "-index")){
                                    var index = objectStore.index(propertyName + "-index");
                                    log("Index Promise compelted", index);
                                    dfd.resolve(index);
                                }
                                else if(!databaseConfiguration || !databaseConfiguration.objectStoreConfiguration){
                                    var version = GetDatabaseVersion(txn.db) + 1
                                    promise.dbInternal(version, function(txn){
                                        $.when(promise.createIndex(propertyName, promise.createObjectStore(promise.self(txn), objectStore.name))).then(function(index){
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

                cursor: function(sourcePromise, range, direction){
                    return $.Deferred(function(dfd){
                        $.when(sourcePromise).then(function(source){
                            log("Cursor Promise Started", source);

                            var req;
                            var returnData = [];

                            if(prototype && typeof(source.openKeyCursor) === 'function') {
                                req = source.openKeyCursor(range || IDBKeyRange.lowerBound(0), direction);
                            }
                            else{
                                req = source.openCursor(range || IDBKeyRange.lowerBound(0), direction);
                            }
                            function handleCursorRequest(e){
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                if(prototype){
                                    result.move(); 

                                    if(result.value)
                                    {
                                        returnData.push(result.value);
                                        req.onsuccess = handleCursorRequest;
                                    }
                                }

                                if (req.result) {
                                    if (result.value) {
                                        returnData.push(result.value);
                                    }
                                    result.continue();
                                }

                                if(!result){
                                    log("Cursor Promise completed", req);
                                    dfd.resolve(returnData, req.transaction);
                                }
                            };

                            req.onsuccess = handleCursorRequest;

                            req.onerror = function(e){
                                log("Cursor Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }, dfd.reject);
                    }).promise();
                },

                keyCursor: function(indexPromise, range, direction){
                    return $.Deferred(function(dfd){
                        $.when(indexPromise).then(function(index){
                            log("keyCursor Promise Started", index);

                            var req;

                            if(prototype) {
                                req = index.openCursor(range || IDBKeyRange.lowerBound(0), direction);
                            }
                            else{
                                req = index.openKeyCursor(range, direction);
                            }
                            function handleCursorRequest(e){
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                if(prototype){
                                    result.move(); 

                                    if(result.value)
                                    {
                                        returnData.push(result.value);
                                        req.onsuccess = handleCursorRequest;
                                    }
                                }

                                if (req.result) {
                                    if (result.value) {
                                        returnData.push(result.value);
                                    }
                                    result.continue();
                                }

                                if(!result){
                                    log("keyCursor Promise completed", req);
                                    dfd.resolve(returnData, req.transaction);
                                }
                            };

                            req.onsuccess = handleCursorRequest;
                            req.onerror = function(e){
                                log("keyCursor Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }, dfd.reject);
                    }).promise();
                },

                get: function(sourcePromise, key){
                    return $.Deferred(function(dfd){
                        $.when(sourcePromise).then(function(source){
                            log("Get Promise Started", source);

                            var req = source.get(key);

                            req.onsuccess = function(e){
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                log("Get Promise completed", req);
                                dfd.resolve(result, req.transaction);
                            };
                            req.onerror = function(e){
                                log("Get Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }, dfd.reject);
                    }).promise();
                },

                getKey: function(indexPromise, key){
                    return $.Deferred(function(dfd){
                        $.when(indexPromise).then(function(index){
                            log("GetKey Promise Started", index);

                            var req = index.getKey(key);

                            req.onsuccess = function(e){
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                log("GetKey Promise completed", req);
                                dfd.resolve(result, req.transaction);
                            };
                            req.onerror = function(e){
                                log("GetKey Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }, dfd.reject);
                    }).promise();
                },

                insert: function(objectStorePromise, data, key){
                    return $.Deferred(function(dfd){
                        $.when(objectStorePromise).then(function(store){
                            log("Insert Promise Started", store);

                            try {
                                var req;

                                if(key /*&& !store.keyPath*/){
                                    req = store.add(data, key);
                                }
                                else{
                                    /*if(key) log("Key can't be provided when a keyPath is defined on the object store", store, key, data);*/
                                    req = store.add(data);
                                }

                                req.onsuccess = function (e) {
                                    if (prototype) result = e.result;
                                    if (req.result) result = req.result;

                                    log("Insert Promise completed", req);
                                    dfd.resolve(result, req.transaction);
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

                update: function(objectStorePromise, data, key){
                    return $.Deferred(function(dfd){
                        $.when(objectStorePromise).then(function(store){
                            log("Update Promise Started", store);

                            try {
                                var req;

                                if(key){
                                    req = store.put(data, key);
                                }
                                else{
                                    req = store.put(data);
                                }
                                req.onsuccess = function (e) {
                                    var result;

                                    if (prototype) result = e.result;
                                    if (req.result) result = req.result;

                                    log("Update Promise completed", req, result);
                                    dfd.resolve(result, req.transaction);
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

                remove: function(objectStorePromise, key){
                    return $.Deferred(function(dfd){
                        $.when(objectStorePromise).then(function(store){
                            log("Remove Promise Started", store);

                            try {
                                var req = store.delete(key);
                                req.onsuccess = function (e) {
                                    var result;

                                    if (prototype) result = e.result;
                                    if (req.result) result = req.result;

                                    log("Remove Promise completed", req);
                                    dfd.resolve(result, req.transaction);
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

                clear: function(objectStorePromise){
                    return $.Deferred(function(dfd){
                        $.when(objectStorePromise).then(function(store){
                            log("Clear Promise Started", store);

                            try {
                                var req = store.clear();
                                req.onsuccess = function (e) {
                                    var result;

                                    if (prototype) result = e.result;
                                    if (req.result) result = req.result;

                                    log("Clear Promise completed", req);
                                    dfd.resolve(result, req.transaction);
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
                }

            };// end of all promise definations

            function closeDatabaseConnection(db) {
                log("Close database Connection: " + db);
                db.close();
            }

            function abortTransaction(transaction) {
                log("Abort transaction: " + transaction);
                transaction.abort();
                closeDatabaseConnection(transaction.db);
            }

            function Initialize_IndexedDB() {
                if (!window.indexedDB) {
                    // Initialising the window.IndexedDB Object for FireFox
                    if (window.mozIndexedDB) {
                        window.indexedDB = window.mozIndexedDB;
                        window.IDBKeyRange = window.IDBKeyRange;
                        window.IDBTransaction = window.IDBTransaction;

                        log("FireFox Initialized", window.indexedDB);
                        return false;
                    }

                    // Initialising the window.IndexedDB Object for Chrome
                    else if (window.webkitIndexedDB) {
                        window.indexedDB = window.webkitIndexedDB;
                        window.IDBKeyRange = window.webkitIDBKeyRange;
                        window.IDBTransaction = window.webkitIDBTransaction;

                        log("Chrome Initialized", window.indexedDB);
                        return false;
                    }

                    // Initialiseing the window.IndexedDB Object for IE 10 preview 3+
                    else if (window.msIndexedDB) {
                        window.indexedDB = window.msIndexedDB;

                        log("IE10+ Initialized", window.indexedDB);
                        return false;
                    }

                    // Initialising the window.IndexedDB Object for IE 8 & 9
                    else if (navigator.appName == 'Microsoft Internet Explorer') {
                        window.indexedDB = new ActiveXObject("SQLCE.Factory.4.0");
                        window.indexedDBSync = new ActiveXObject("SQLCE.FactorySync.4.0");

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

                        return true;
                    }
                }

                if (!window.indexedDB) {
                    alert("Your browser doesn't support IndexedDB.");
                    return false;
                }
            }

            function InitializeDatabse(txn, oldVersion, newVersion){
                if(databaseConfiguration && databaseConfiguration.objectStoreConfiguration)
                {
                    for (var version = oldVersion + 1; version == newVersion; version++) {
                        var data = GetDataByVersion(version, databaseConfiguration.objectStoreConfiguration);
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

                        if(storeConfig.remove){
                            promise.deleteObjectStore(promise.self(txn), storeConfig.name);
                        }
                        else {
                            var storePromise = promise.createObjectStore(promise.self(txn), storeConfig.name, { keyPath: storeConfig.keyPath, autoIncrement: storeConfig.autoIncrement });

                            $.when(storePromise).then(function(store){
                                for (var j = 0; j < storeConfig.Indexes.length; j++) {
                                   var indexConfig = storeConfig.Indexes[j];

                                   if(indexConfig.remove){
                                        promise.deleteIndex(indexConfig.PropertyName, promise.self(store));
                                   }
                                   else {
                                        promise.createIndex(indexConfig.PropertyName, promise.self(store), { unique: indexConfig.IsUnique, multirow: indexConfig.Multirow });
                                   }
                                }

                                if(storeConfig.DefaultData)
                                {
                                    for (var k = 0; k < storeConfig.DefaultData.length; k++) {
                                        promise.insert(promise.self(store), storeConfig.DefaultData[k])
                                    }
                                }
                            })
                        }

                    }
                    catch (e) { 
                        error("createIndex exception: " + e.message);  
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

            function GetDatabaseVersion(db){
                var dbVersion = parseInt(db.version);
                if(isNaN(dbVersion)){
                    return 0
                }
                else {
                    return parseInt(db.version);
                }
            }

            function whereInternal(objectStorePromise, propertyName){
                return {
                    Equals: function(value){
                        var cursorPromis = promise.cursor(promise.index(propertyName,objectStorePromise), IDBKeyRange.only(value));
                        return SelectInternal(cursorPromis)
                    },
                    GreaterThen: function(value, valueIncluded){
                        var cursorPromis =  promise.cursor(promise.index(propertyName, objectStorePromise), IDBKeyRange.lowerBound(value, typeof(valueIncluded) === 'undefined' ? false : valueIncluded));
                        return SelectInternal(cursorPromis)
                    },
                    SmallerThen: function(value, valueIncluded){
                        var cursorPromis =  promise.cursor(promise.index(propertyName, objectStorePromise), IDBKeyRange.upperBound(value, typeof(valueIncluded) === 'undefined' ? false : valueIncluded));
                        return SelectInternal(cursorPromis)
                    },
                    Between: function(minValue, maxValue, minValueIncluded, maxValueIncluded){
                        var cursorPromis =  promise.cursor(promise.index(propertyName, objectStorePromise), IDBKeyRange.bound(minValue, maxValue, typeof(minValueIncluded) === 'undefined' ? false : minValueIncluded), typeof(maxValueIncluded) === 'undefined' ? false : maxValueIncluded);
                        return SelectInternal(cursorPromis)
                    }
                }
            }

            function SelectInternal(cursorPromis) {
                return {
                    Select: function(propertyNames){
                        var properties = undefined
                        if(propertyNames)
                        {
                            if(!$.isArray(propertyNames)){
                                properties = propertyNames
                            }
                        }
                        return {
                            All: function(callback){
                                $.when(cursorPromis).then(function(data){
                                    var returnData = [];

                                    if(propertyNames)
                                    {
                                        for (var i = 0; i < data.length; i++) {
                                            var obj = new Object();
                                            for (var j = 0; j < propertyNames.length; j++) {
                                                obj[propertyName[j]] = data[i][propertyName[j]];
                                            }
                                            returnData.push(obj);
                                        }
                                    }
                                    else {
                                        returnData = data;
                                    }

                                    if(typeof(callback) === 'function'){
                                        callback(returnData);
                                    }
                                });
                            },
                            forEach: function(callback){
                                $.when(cursorPromis).then(function(data){
                                    for (var i = 0; i < data.length; i++) {
                                        var obj;
                                        if(propertyNames)
                                        {
                                            obj = new Object();
                                            for (var j = 0; j < propertyNames.length; j++) {
                                                obj[propertyNames[j]] = data[i][propertyNames[j]];
                                            }
                                        }
                                        else{
                                            obj = data[i];
                                        }

                                        if(typeof(callback) === 'function'){
                                            callback(obj);
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            }

            return{
                Insert: function(data, key){
                    return {
                        Into: function(objectStoreName){
                            return promise.insert(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), data, key)
                        }
                    }
                },

                Update: function(objectStoreName, data, key){
                    return promise.update(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), data, key); 
                },

                Delete: function(objectStoreName, key){
                    return promise.remove(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), key); 
                },

                From: function(objectStoreName){
                    return {
                        Where: function(propertyName, clause){
                            if(propertyName){
                                if(clause){
                                   if (clause.equals) {
                                        return whereInternal(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName), propertyName).Equals(clause.equals);
                                   }
                                   else if (clause.range) {
                                        return whereInternal(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName), propertyName).Between(clause.range[0], clause.range[1], clause.range[2], clause.range[3]);
                                   }
                                }
                                else{
                                    return whereInternal(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName), propertyName);
                                }
                            }
                            else{
                                var cursorPromise = promise.cursor(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName));
                                return SelectInternal(cursorPromise);
                            }
                        },
                        Get: function(key){
                            return promise.get(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName),key);
                        }
                    }
                },

                ReadAll: function(objectStoreName, success, error){
                    var cursorPromise = promise.cursor(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName));
                    $.when(cursorPromise).then(function(returnData, txn){
                        closeDatabaseConnection(txn.db);
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },

                GetData: function(objectStoreName, key, success, error){
                    var getPromise = promise.get(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName), key);
                    $.when(getPromise).then(function(returnData, txn){
                        closeDatabaseConnection(txn.db);
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },

                SearchData: function (objectStoreName, propertyName, searchValue, success, error) {
                    var cursorPromise = promise.cursor(promise.index(propertyName, promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName)), IDBKeyRange.only(searchValue));
                    $.when(cursorPromise).then(function(returnData, txn){
                        closeDatabaseConnection(txn.db);
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },

                InsertData: function(objectStoreName, data, success, error){
                    var insertPromise = promise.insert(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), data);
                    $.when(insertPromise).then(function(returnData, txn){
                        closeDatabaseConnection(txn.db);
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },
  
                UpdateData: function(objectStoreName, data, success, error){
                    var updatePromise = promise.update(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), data);
                    $.when(updatePromise).then(function(returnData, txn){
                        closeDatabaseConnection(txn.db);
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },

                DeleteData: function(objectStoreName, key, success, error){
                    var deletePromise = promise.remove(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), key);
                    $.when(deletePromise).then(function(returnData, txn){
                        closeDatabaseConnection(txn.db);
                        if(typeof(success) === 'function'){
                            success();
                        }
                    }, error);
                },

                Initialize: function(onsuccess, onerror){
                    $.when(promise.db()).then(onsuccess, onerror)
                }
            }
        }
    });
})(jQuery);