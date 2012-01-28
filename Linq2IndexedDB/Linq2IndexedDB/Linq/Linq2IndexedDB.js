/// <reference path="jquery-1.7.1-vsdoc.js" />
/// <reference path="jquery-1.7.1.js" />


(function($){
    $.extend({
        linq2indexeddb: function(databaseName, databaseVersion, objectStores){
            var prototype = Initialize_IndexedDB();
            var currentVersion;
            var debugging = true;

            var promise = {
                self: function(value){
                    return $.Deferred(function(dfd){ 
                        dfd.resolve(value);
                    });
                },

                db: function(){
                    return $.Deferred(function(dfd){
                        try {
                            var req = window.indexedDB.open(databaseName, databaseVersion);

                            req.onsuccess = function (event) {
                                var dbConnection;

                                if (prototype) dbConnection = event.result;
                                if (req.result) dbConnection = req.result;

                                dbConnection.onabort = function(){
                                    alert('onabort');
                                }

                                dbConnection.onerror = function(){
                                    alert('error');
                                }

                                dbConnection.onversionchange = function(){
                                    alert('onversionchange');
                                }  
                                
                                var dbver = parseInt(dbConnection.version)  
                                
                                if(isNaN(dbver)){
                                    dbver = 0;
                                }                        

                                if(dbver < databaseVersion){
                                    if (debugging) console.debug("DB Promise upgradeneeded", dbConnection);
                                    upgradeNeeded(dbConnection, parseInt(databaseVersion), dfd);
                                }
                                else{
                                    if (debugging) console.debug("DB Promise resolved", dbConnection);
                                    dfd.resolve(dbConnection);
                                }
                            }

                            req.onerror = function (e) {
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                if (debugging) console.debug("DB Promise rejected", result);
                                dfd.reject(e, req);
                            }

                            req.onupgradeneeded = function (e){
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                if (debugging) console.debug("DB Promise upgradeneeded", result);
                                
                                InitializeVersion(result, req.transaction, e.oldVersion, e.newVersion);
                            }

                            req.onblocked = function (e){
                                var result;

                                if (prototype) result = e.result;
                                if (req.result) result = req.result;

                                if (debugging) console.debug("DB Promise blocked", result);
                                dfd.reject(e, req);
                            }
                        }
                        catch (e) {
                            if (debugging) console.debug("DB Promise exception", req.result);
                            dfd.reject(e);
                        }
                    }).promise();
                },

                changeDatabaseStructure: function (dbPromise, version) {
                    return $.Deferred(function (dfd) {
                        $.when(dbPromise).then(function (db) {
                            try {
                                if(!version)
                                {
                                    var dbVersion = parseInt(db.version);
                                    if(isNaN(dbVersion)){
                                        version = 0
                                    }
                                    else {
                                        version = parseInt(db.version);
                                    }

                                    //version += 0.001;
                                }

                                var req = db.setVersion(version);

                                req.onsuccess = function (event) {
                                    var txn;

                                    if (prototype) txn = event.result;
                                    if (req.result) txn = req.result;

                                    if (debugging) console.debug("Version Change Transaction Promise completed", txn);
                                    
                                    txn.oncomplete = function () {
                                        if (debugging) console.debug("Version Change Transaction transaction completed", txn);
                                        closeDatabaseConnection(txn);
                                    }
                                    dfd.resolve(txn);
                                }

                                req.onerror = function (e) {
                                    var result;

                                    if (prototype) result = event.result;
                                    if (req.result) result = req.result;

                                    if(debugging) console.debug("Version Change Transaction Promise error", e);
                                    dfd.reject(e, result);
                                }

                                req.onblocked = function (event) {
                                    if (debugging) console.debug("Version Change Transaction Promise blocked", e);
                                    dfd.reject(e, req);
                                }
                            }
                            catch (e) {
                                if (debugging) console.debug("Version Change Transaction Promise exception", e);
                                dfd.reject(e, req);
                            }
                        }, dfd.reject);
                    }).promise();
                },

                transaction: function (dbPromise, objectStoreNames, transactionType, onTransactionComplete) {
                    return $.Deferred(function (dfd) {
                        if (!$.isArray(objectStoreNames)) objectStoreNames = [objectStoreNames];
                        $.when(dbPromise).then(function (db) {
                            if(debugging) console.debug("Transaction Promise started", db, objectStoreNames, transactionType);
                            try {
                                var txn = db.transaction(objectStoreNames, transactionType);
                                txn.oncomplete = function () {
                                    if (debugging) console.debug("Transaction completed");
                                    if (typeof(onTransactionComplete) === 'function') onTransactionComplete();
                                    closeDatabaseConnection(txn);
                                }

                                if (debugging) console.debug("Transaction Promise completed", txn);
                                dfd.resolve(txn);
                            }
                            catch (e) {
                                if (debugging) console.debug("Transaction Promise exception");
                                dfd.reject(e, db);
                            }

                        }, dfd.reject);
                    }).promise();
                    ;
                },

                readTransaction: function (dbPromise, objectStoreNames, onTransactionComplete){
                    return promise.transaction(dbPromise, objectStoreNames, IDBTransaction.READ_ONLY);
                },

                writeTransaction: function (dbPromise, objectStoreNames, onTransactionComplete){
                    return promise.transaction(dbPromise, objectStoreNames, IDBTransaction.READ_WRITE, onTransactionComplete);
                },

                objectStore: function (transactionPromise, objectStoreName) {
                    return $.Deferred(function (dfd) {
                        $.when(transactionPromise).then(function (transaction) {
                            if (debugging) console.debug("ObjectStore Promise started", transactionPromise, objectStoreName);
                            try {
                                var objectStore = transaction.objectStore(objectStoreName);
                                if (debugging) console.debug("ObjectStore Promise completed", objectStore);
                                dfd.resolve(objectStore);
                            }
                            catch (e) {
                                if (debugging) console.debug("Error in Object Store Promise", e);
                                abortTransaction(transaction);
                                dfd.reject(e, transaction.db);
                            }
                        }, dfd.reject);
                    }).promise();
                },

                createObjectStore: function (changeDatabaseStructurePromise, objectStoreName, objectStoreOptions) {
                    return $.Deferred(function (dfd) {
                        $.when(changeDatabaseStructurePromise).then(function (transaction) {
                            if(debugging) console.debug("createObjectStore Promise started", changeDatabaseStructurePromise, objectStoreName, objectStoreOptions);
                            try {
                                var store;
                                if (!transaction.db.objectStoreNames.contains(objectStoreName)) {
                                    store = transaction.db.createObjectStore(objectStoreName, {
                                        "autoIncrement": objectStoreOptions ? objectStoreOptions.autoIncrement : true,
                                        "keyPath": objectStoreOptions ? objectStoreOptions.keyPath : "id"
                                    }, objectStoreOptions ? objectStoreOptions.autoIncrement : true);

                                    if (debugging) console.debug("ObjectStore Created", store);
                                }
                                else {
                                    store = transaction.db.objectStore(objectStoreName);

                                    if (debugging) console.debug("ObjectStore Found", store);
                                }

                                if (debugging) console.debug("createObjectStore Promise completed", store);
                                dfd.resolve(store);
                            }
                            catch (e) {
                                if (debugging) console.debug("Error in createObjectStore Promise", e);
                                abortTransaction(transaction);
                                dfd.reject(e, transaction.db);
                            }
                        }, dfd.reject);
                    }).promise();
                },
                
                deleteObjectStore: function (changeDatabaseStructurePromise, objectStoreName) {
                    return $.Deferred(function (dfd) {
                        $.when(changeDatabaseStructurePromise).then(function (transaction) {
                            if(debugging) console.debug("deleteObjectStore Promise started", changeDatabaseStructurePromise, objectStoreName, objectStoreOptions);
                            try {
                                if (!transaction.db.objectStoreNames.contains(objectStoreName)) {
                                    store = transaction.db.deleteObjectStore(objectStoreName)
                                    if (debugging) console.debug("ObjectStore Deleted", objectStoreName);
                                }
                                else {
                                    if (debugging) console.debug("ObjectStore Not Found", objectStoreName);
                                }

                                if (debugging) console.debug("deleteObjectStore Promise completed", objectStoreName);
                                dfd.resolve(store);
                            }
                            catch (e) {
                                if (debugging) console.debug("Error in deleteObjectStore Promise", e);
                                abortTransaction(transaction);
                                dfd.reject(e, transaction.db);
                            }
                        }, dfd.reject);
                    }).promise();
                },

                createIndex: function (propertyName, createObjectStorePromise, indexOptions) {
                    return $.Deferred(function (dfd) {
                        $.when(createObjectStorePromise).then(function (objectStore) {
                            if(debugging) console.debug("createIndex Promise started", objectStore)
                            try {
                                var index;
                                if(prototype){
                                    index = objectStore.createIndex(propertyName + "-index", propertyName, { unique: indexOptions.IsUnique/*, multirow: indexOptions.Multirow*/ });
                                }
                                else{
                                    index = objectStore.createIndex(propertyName + "-index", propertyName, indexOptions.IsUnique);
                                }

                                if(debugging) console.debug("createIndex Promise compelted", index);
                                dfd.resolve(index);
                            }
                            catch (e) {
                                if(debugging) console.debug("createIndex Promise Failed", e);
                                abortTransaction(objectStore.transaction);
                                dfd.reject(e, objectStore.transaction);
                            }
                        }, dfd.reject);
                    }).promise();
                },

                deleteIndex: function (propertyName, createObjectStorePromise) {
                    return $.Deferred(function (dfd) {
                        $.when(createObjectStorePromise).then(function (objectStore) {
                            if(debugging) console.debug("deleteIndex Promise started", objectStore)
                            try {
                                objectStore.deleteIndex(propertyName + "-index");
                                
                                if(debugging) console.debug("deleteIndex Promise compelted", propertyName);
                                dfd.resolve(index);
                            }
                            catch (e) {
                                if(debugging) console.debug("deleteIndex Promise Failed", e);
                                abortTransaction(objectStore.transaction);
                                dfd.reject(e, objectStore.transaction);
                            }
                        }, dfd.reject);
                    }).promise();
                },

                index: function (propertyName, objectStorePromise) {
                    return $.Deferred(function (dfd) {
                        $.when(objectStorePromise).then(function (objectStore) {
                            if(debugging) console.debug("Index Promise started", objectStore)
                            try {
                                var index = objectStore.index(propertyName + "-index");
                                if(debugging) console.debug("Index Promise compelted", index);
                                dfd.resolve(index);
                            }
                            catch (e) {
                                var name = objectStore.transaction.db.name;
                                abortTransaction(objectStore.transaction);
                                
                                if(debugging) console.debug("Index doesn't exist, creating one is necessary.");
                                $.when(promise.createIndex(propertyName, promise.createObjectStore(promise.changeDatabaseStructure(promise.db(name)), objectStore.name))).then(function (index) {
                                    dfd.resolve(index);
                                }, dfd.reject);
                            }
                        }, dfd.reject);
                    }).promise();
                },

                cursor: function(sourcePromise, range, direction){
                    return $.Deferred(function(dfd){
                        $.when(sourcePromise).then(function(source){
                            if(debugging) console.debug("Cursor Promise Started", source);

                            var req;
                            var returnData = [];

                            if(prototype && typeof(source.openKeyCursor) === 'function') {
                                req = source.openKeyCursor(range || IDBKeyRange.lowerBound(0), direction);
                            }
                            else{
                                req = source.openCursor(range || IDBKeyRange.lowerBound(0), direction);
                            }
                            function handleCursorRequest(event){
                                var result;

                                if (prototype) result = event.result;
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
                                    if(debugging) console.debug("Cursor Promise completed", req);
                                    dfd.resolve(returnData);
                                }
                            };

                            req.onsuccess = handleCursorRequest;

                            req.onerror = function(e){
                                if(debugging) console.debug("Cursor Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }, dfd.reject);
                    }).promise();
                },

                keyCursor: function(indexPromise, range, direction){
                    return $.Deferred(function(dfd){
                        $.when(indexPromise).then(function(index){
                            if(debugging) console.debug("keyCursor Promise Started", index);

                            var req;

                            if(prototype) {
                                req = index.openCursor(range || IDBKeyRange.lowerBound(0), direction);
                            }
                            else{
                                req = index.openKeyCursor(range, direction);
                            }
                            function handleCursorRequest(event){
                                var result;

                                if (prototype) result = event.result;
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
                                    if(debugging) console.debug("keyCursor Promise completed", req);
                                    dfd.resolve(returnData);
                                }
                            };

                            req.onsuccess = handleCursorRequest;
                            req.onerror = function(e){
                                if(debugging) console.debug("keyCursor Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }, dfd.reject);
                    }).promise();
                },

                get: function(sourcePromise, key){
                    return $.Deferred(function(dfd){
                        $.when(sourcePromise).then(function(source){
                            if(debugging) console.debug("Get Promise Started", source);

                            var req = source.get(key);

                            req.onsuccess = function(e){
                                var result;

                                if (prototype) result = event.result;
                                if (req.result) result = req.result;

                                if(debugging) console.debug("Get Promise completed", req);
                                dfd.resolve(result);
                            };
                            req.onerror = function(e){
                                if(debugging) console.debug("Get Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }, dfd.reject);
                    }).promise();
                },

                getKey: function(indexPromise, key){
                    return $.Deferred(function(dfd){
                        $.when(indexPromise).then(function(index){
                            if(debugging) console.debug("GetKey Promise Started", index);

                            var req = index.getKey(key);

                            req.onsuccess = function(e){
                                var result;

                                if (prototype) result = event.result;
                                if (req.result) result = req.result;

                                if(debugging) console.debug("GetKey Promise completed", req);
                                dfd.resolve(result);
                            };
                            req.onerror = function(e){
                                if(debugging) console.debug("GetKey Promise error", e, req);
                                dfd.reject(e, req);
                            };
                        }, dfd.reject);
                    }).promise();
                },

                insert: function(objectStorePromise, data, key){
                    return $.Deferred(function(dfd){
                        $.when(objectStorePromise).then(function(store){
                            if(debugging) console.debug("Insert Promise Started", store);

                            try {
                                var req;

                                if(key){
                                    req = store.add(data, key);
                                }
                                else{
                                    req = store.add(data);
                                }

                                req.onsuccess = function (event) {
                                    if (prototype) result = event.result;
                                    if (req.result) result = req.result;

                                    if(debugging) console.debug("Insert Promise completed", req);
                                    dfd.resolve(result);
                                };
                                req.onerror = function (e) {
                                    if(debugging) console.debug("Insert Promise error", e, req);
                                    dfd.reject(e, req);
                                };
                            }
                            catch (e) {
                                if(debugging) console.debug("Insert Promise exception", e, req);
                                dfd.reject(e, req);
                            }
                        }, dfd.reject);
                    }).promise();
                },

                update: function(objectStorePromise, data, key){
                    return $.Deferred(function(dfd){
                        $.when(objectStorePromise).then(function(store){
                            if(debugging) console.debug("Update Promise Started", store);

                            try {
                                var req;

                                if(key){
                                    req = store.put(data, key);
                                }
                                else{
                                    req = store.put(data);
                                }
                                req.onsuccess = function (event) {
                                    if (prototype) result = event.result;
                                    if (req.result) result = req.result;

                                    if(debugging) console.debug("Update Promise completed", req);
                                    dfd.resolve(result);
                                };
                                req.onerror = function (e) {
                                    if(debugging) console.debug("Update Promise error", e, req);
                                    dfd.reject(e, req);
                                };
                            }
                            catch (e) {
                                if(debugging) console.debug("Update Promise exception", e, req);
                                dfd.reject(e, req);
                            }
                        }, dfd.reject);
                    }).promise();
                },

                remove: function(objectStorePromise, key){
                    return $.Deferred(function(dfd){
                        $.when(objectStorePromise).then(function(store){
                            if(debugging) console.debug("Remove Promise Started", store);

                            try {
                                var req = store.delete(key);
                                req.onsuccess = function (event) {
                                    var result;

                                    if (prototype) result = event.result;
                                    if (req.result) result = req.result;

                                    if(debugging) console.debug("Remove Promise completed", req);
                                    dfd.resolve(result);
                                };
                                req.onerror = function (e) {
                                    if(debugging) console.debug("Remove Promise error", e, req);
                                    dfd.reject(e, req);
                                };
                            }
                            catch (e) {
                                if(debugging) console.debug("Remove Promise exception", e, req);
                                dfd.reject(e, req);
                            }
                        }, dfd.reject);
                    }).promise();
                },

                clear: function(objectStorePromise){
                    return $.Deferred(function(dfd){
                        $.when(objectStorePromise).then(function(store){
                            if(debugging) console.debug("Clear Promise Started", store);

                            try {
                                var req = store.clear();
                                req.onsuccess = function (event) {
                                    var result;

                                    if (prototype) result = event.result;
                                    if (req.result) result = req.result;

                                    if(debugging) console.debug("Clear Promise completed", req);
                                    dfd.resolve(result);
                                };
                                req.onerror = function (e) {
                                    if(debugging) console.debug("Clear Promise error", e, req);
                                    dfd.reject(e, req);
                                };
                            }
                            catch (e) {
                                if(debugging) console.debug("Clear Promise exception", e, req);
                                dfd.reject(e, req);
                            }
                        }, dfd.reject);
                    }).promise();
                }

            };// end of all promise definations

            function closeDatabaseConnection(transaction) {
                transaction.db.close();
            }

            function abortTransaction(transaction) {
                transaction.abort();
                closeDatabaseConnection(transaction);
            }

            function Initialize_IndexedDB() {
                if (!window.indexedDB) {
                    // Initialising the window.IndexedDB Object for FireFox
                    if (window.mozIndexedDB) {
                        window.indexedDB = window.mozIndexedDB;
                        window.IDBKeyRange = window.IDBKeyRange;
                        window.IDBTransaction = window.IDBTransaction;

                        return false;
                    }

                    // Initialising the window.IndexedDB Object for Chrome
                    else if (window.webkitIndexedDB) {
                        window.indexedDB = window.webkitIndexedDB;
                        window.IDBKeyRange = window.webkitIDBKeyRange;
                        window.IDBTransaction = window.webkitIDBTransaction;

                        return false;
                    }

                    // Initialiseing the window.IndexedDB Object for IE 10 preview 3+
                    else if (window.msIndexedDB) {
                        window.indexedDB = window.msIndexedDB;

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

            function upgradeNeeded(dbConnection, version, dfd){
                try {
                    var req = dbConnection.setVersion(version);

                    req.onsuccess = function (event) {
                        var txn;

                        if (prototype) txn = event.result;
                        if (req.result) txn = req.result;

                        InitializeVersion(dbConnection, txn, parseInt(dbConnection.version), version)
                                    
                        txn.oncomplete = function () {
                            if (debugging) console.debug("Upgrade transaction completed", txn);
                            closeDatabaseConnection(txn);
                            $.when(promise.db()).then(function (dbConnection){
                                dfd.resolve(dbConnection)
                            }, dfd.reject);
                        }
                    }

                    req.onerror = function (e) {
                        var result;

                        if (prototype) result = event.result;
                        if (req.result) result = req.result;

                        if(debugging) console.debug("Upgrade error", e);
                        dfd.reject(e, result);
                    }

                    req.onblocked = function (e) {
                        if (debugging) console.debug("Upgrade blocked", e);
                        dfd.reject(e, result);
                    }
                }
                catch (e) {
                    if (debugging) console.debug("Upgrade exception", e);
                    dfd.reject(e, result);
                }
            }

            function InitializeDatabse(dbConnection, txn, oldVersion, newVersion){
                for (var version = oldVersion + 1; version == newVersion; a++) {
                    if(true){
                        
                    }
                    else{
                        var data = GetDataByVersion(version, objectStores);
                        InitializeVersion(dbConnection, txn, version)
                    }
                }
                
            }

            function InitializeVersion(dbConnection, txn, version) {
                for (var i = 0; i < data.length; i++) {
                    try {
                        var storeConfig = data[i];
                        var storePromise = promise.createObjectStore(promise.self(txn), storeConfig.name, { keyPath: storeConfig.keyPath, autoIncrement: storeConfig.autoIncrement });

                        $.when(storePromise).then(function(store){
                            for (var j = 0; j < storeConfig.Indexes.length; j++) {
                               var indexConfig = storeConfig.Indexes[j];
                               promise.createIndex(indexConfig.PropertyName, promise.self(store), { unique: indexConfig.IsUnique, multirow: indexConfig.Multirow });
                            }

                            var indexNames = store.indexNames

                            for (var k = indexNames.length - 1; k == 0; k--) {
                                var exists = false;
                                for (var l = 0; l < storeConfig.Indexes.length; l++) {
                                    if (indexNames[k] == storeConfig.Indexes[l].PropertyName + "-index") {
                                        exists = true;
                                        break;
                                    }
                                }
                                if (!exists) {
                                    promise.deleteIndex(indexNames[k], promise.self(store));
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
                    catch (e) { 
                        error("createIndex exception: " + e.message);  
                        txn.abort();  
                    }
                }

                var databaseObjectStoresNames = dbConnection.objectStoreNames

                for (var k = databaseObjectStoresNames.length - 1; k == 0; k--) {
                    var exists = false;
                    for (var l = 0; l < objectStores.length; l++) {
                        if (databaseObjectStoresNames[k] == objectStores[l].name) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        promise.deleteObjectStore(promise.self(txn), databaseObjectStoresNames[k]);
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

            return{
                From: function(objectStoreName){
                    return {
                        Insert: function(data, key){
                            return promise.insert(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), data, key);
                        },
                        Get: function(key){
                            return promise.get(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName),key);
                        }
                    }
                },

                CreateObjectStore: function(name, objectStoreOptions){
                    return promise.createObjectStore(promise.changeDatabaseStructure(promise.db()),name,objectStoreOptions);
                },

                CreateIndex: function(properyName, ObjectStoreName, indexOptions){
                    return promise.createIndex(properyName, promise.createObjectStore(promise.changeDatabaseStructure(promise.db()),name), indexOptions);
                },

                ReadAll: function(objectStoreName, success, error){
                    var cursorPromise = promise.cursor(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName));
                    $.when(cursorPromise).then(function(returnData){
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },

                GetData: function(objectStoreName, key, success, error){
                    var getPromise = promise.get(promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName), key);
                    $.when(getPromise).then(function(returnData){
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },

                SearchData: function (objectStoreName, propertyName, searchValue, success, error) {
                    var cursorPromise = promise.cursor(promise.index(propertyName, promise.objectStore(promise.readTransaction(promise.db(), objectStoreName), objectStoreName)), IDBKeyRange.only(searchValue));
                    $.when(cursorPromise).then(function(returnData){
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },

                InsertData: function(objectStoreName, data, success, error){
                    var insertPromise = promise.insert(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), data);
                    $.when(insertPromise).then(function(returnData){
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },
  
                UpdateData: function(objectStoreName, data, success, error){
                    var updatePromise = promise.update(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), data);
                    $.when(updatePromise).then(function(returnData){
                        if(typeof(success) === 'function'){
                            success(returnData);
                        }
                    }, error);
                },

                DeleteData: function(objectStoreName, key, success, error){
                    var deletePromise = promise.remove(promise.objectStore(promise.writeTransaction(promise.db(), objectStoreName), objectStoreName), key);
                    $.when(deletePromise).then(function(returnData){
                        if(typeof(success) === 'function'){
                            success();
                        }
                    }, error);
                }
            }
        }
    });
})(jQuery);