"use strict";
var linq2indexedDB = linq2indexedDB || {},
    win = typeof(window) !== "undefined" ? window : undefined,
    $ = typeof(window) !== "undefined" && typeof(window.jQuery) !== "undefined" ? window.jQuery : undefined;
Array.prototype.contains = function(obj)
{
    return this.indexOf(obj) > -1
};
(function(linq2indexedDB)
{
    linq2indexedDB.about = {
        version: "1.1.0", author: "Kristof Degrave", license: "http://linq2indexeddb.codeplex.com/license", sources: "http://linq2indexeddb.codeplex.com/"
    }
})(linq2indexedDB);
(function(linq2indexedDB)
{
    function eventTarget()
    {
        this._listeners = {}
    }
    eventTarget.prototype = {
        constructor: eventTarget, addListener: function(type, listener)
            {
                if (!linq2indexedDB.util.isArray(type))
                    type = [type];
                for (var i = 0; i < type.length; i++)
                {
                    if (typeof this._listeners[type[i]] == "undefined")
                        this._listeners[type[i]] = [];
                    this._listeners[type[i]].push(listener)
                }
            }, fire: function(event)
            {
                if (typeof event == "string")
                    event = {type: event};
                if (!event.target)
                    event.target = this;
                if (!event.type)
                    throw new Error("Event object missing 'type' property.");
                if (this._listeners[event.type] instanceof Array)
                {
                    var listeners = this._listeners[event.type];
                    for (var i = 0, len = listeners.length; i < len; i++)
                        listeners[i].call(this, event)
                }
            }, removeListener: function(type, listener)
            {
                if (!linq2indexedDB.util.isArray(type))
                    type = [type];
                for (var j = 0; j < type[j].length; j++)
                    if (this._listeners[type[j]] instanceof Array)
                    {
                        var listeners = this._listeners[type[j]];
                        for (var i = 0, len = listeners.length; i < len; i++)
                            if (listeners[i] === listener)
                            {
                                listeners.splice(i, 1);
                                break
                            }
                    }
            }
    };
    linq2indexedDB.Event = eventTarget
})(linq2indexedDB);
(function(linq2indexedDB)
{
    var severityEnum = {
            information: 0, warning: 1, error: 2, exception: 3
        };
    var undefined = "undefined";
    if (typeof(console) !== undefined)
    {
        if (typeof(console.warning) === undefined)
            if (typeof(console.warn) === undefined)
                console.warning = console.log;
            else
                console.warning = console.warn;
        if (typeof(console.error) === undefined)
            console.error = console.log;
        if (typeof(console.exception) === undefined)
            console.exception = console.error
    }
    function log(severity)
    {
        if (typeof(console) === undefined || !linq2indexedDB.logging.enabled)
            return false;
        var currtime = (function()
            {
                var time = new Date;
                return time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + '.' + time.getMilliseconds()
            })();
        var args = [];
        args.push(currtime);
        for (var i = 1; i < arguments.length; i++)
            args.push(arguments[i]);
        switch (severity)
        {
            case severityEnum.exception:
                args[0] += ' Linq2IndexedDB Exception: ';
                console.exception.apply(console, args);
                break;
            case severityEnum.error:
                args[0] += ' Linq2IndexedDB Error: ';
                console.error.apply(console, args);
                break;
            case severityEnum.warning:
                args[0] += ' Linq2IndexedDB Warning: ';
                console.warning.apply(console, args);
                break;
            case severityEnum.information:
                args[0] += ' Linq2IndexedDB Info: ';
                console.log.apply(console, args);
                break;
            default:
                args[0] += ' Linq2IndexedDB: ';
                console.log.apply(console, args)
        }
        return true
    }
    function logError(error)
    {
        return log(error.severity, error.message, error.type, error.method, error.orignialError)
    }
    linq2indexedDB.logging = {
        debug: function(enable)
        {
            this.enabled = !!enable;
            this.log(severityEnum.warning, "Debugging enabled: be carefull when using in production enviroment. Complex objects get written to  the log and may cause memory leaks.")
        }, log: log, logError: logError, severity: severityEnum, enabled: false
    }
})(linq2indexedDB);
(function(linq2indexedDB)
{
    function jsonComparer(propertyName, descending)
    {
        return {sort: function(valueX, valueY)
                {
                    if (descending)
                        return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? -1 : 1));
                    else
                        return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? 1 : -1))
                }}
    }
    function serialize(key, value)
    {
        if (typeof value === 'function')
            return value.toString();
        return value
    }
    function deserialize(key, value)
    {
        if (value && typeof value === "string" && value.substr(0, 8) == "function")
        {
            var startBody = value.indexOf('{') + 1;
            var endBody = value.lastIndexOf('}');
            var startArgs = value.indexOf('(') + 1;
            var endArgs = value.indexOf(')');
            return new Function(value.substring(startArgs, endArgs), value.substring(startBody, endBody))
        }
        return value
    }
    function getPropertyValue(data, propertyName)
    {
        var structure = propertyName.split(".");
        var value = data;
        for (var i = 0; i < structure.length; i++)
            if (value)
                value = value[structure[i]];
        return value
    }
    function setPropertyValue(data, propertyName, value)
    {
        var structure = propertyName.split(".");
        var obj = data;
        for (var i = 0; i < structure.length; i++)
            if (i != (structure.length - 1))
            {
                obj[structure[i]] = {};
                obj = obj[structure[i]]
            }
            else
                obj[structure[i]] = value;
        return obj
    }
    linq2indexedDB.json = {
        comparer: jsonComparer, serialize: serialize, deserialize: deserialize, getPropertyValue: getPropertyValue, setPropertyValue: setPropertyValue
    }
})(linq2indexedDB);
(function(linq2indexedDB)
{
    function isArray(array)
    {
        if (array instanceof Array)
            return true;
        else
            return false
    }
    linq2indexedDB.util = {isArray: isArray}
})(linq2indexedDB);
(function(window, $, linq2indexedDB)
{
    if (typeof(window) !== "undefined" && (typeof($) === "undefined" || typeof($.Deferred) === "undefined"))
        throw"linq2indexedDB: No jQuery framework that supports promises found. Please ensure jQuery is referenced before the linq2indexedDB.js file and the version is higher then 1.7.1";
    function jQueryPromise(promise)
    {
        return $.Deferred(function(dfd)
            {
                promise({
                    complete: function(context, args)
                    {
                        dfd.resolveWith(context, [args])
                    }, error: function(context, args)
                        {
                            dfd.rejectWith(context, [args])
                        }, progress: function(context, args)
                        {
                            dfd.notifyWith(context, [args])
                        }
                })
            }).promise()
    }
    linq2indexedDB.promises = {promise: jQueryPromise}
})(win, $, linq2indexedDB);
(function(window, linq2indexedDB, isMetroApp, undefined)
{
    var defaultDatabaseName = "Default";
    var implementations = {
            NONE: 0, NATIVE: 1, MICROSOFT: 2, MOZILLA: 3, GOOGLE: 4, MICROSOFTPROTOTYPE: 5, SHIM: 6
        };
    var transactionTypes = {
            READ_ONLY: "readonly", READ_WRITE: "readwrite", VERSION_CHANGE: "versionchange"
        };
    var implementation = initializeIndexedDb();
    var handlers = {
            IDBRequest: function(request)
            {
                return deferredHandler(IDBRequestHandler, request)
            }, IDBBlockedRequest: function(request)
                {
                    return deferredHandler(IDBBlockedRequestHandler, request)
                }, IDBOpenDBRequest: function(request)
                {
                    return deferredHandler(IDBOpenDbRequestHandler, request)
                }, IDBDatabase: function(database)
                {
                    return deferredHandler(IDBDatabaseHandler, database)
                }, IDBTransaction: function(txn)
                {
                    return deferredHandler(IDBTransactionHandler, txn)
                }, IDBCursorRequest: function(request)
                {
                    return deferredHandler(IDBCursorRequestHandler, request)
                }
        };
    var dbEvents = {
            objectStoreCreated: "Object store created", objectStoreRemoved: "Object store removed", indexCreated: "Index created", indexRemoved: "Index removed", databaseRemoved: "Database removed", databaseBlocked: "Database blocked", databaseUpgrade: "Database upgrade", databaseOpened: "Database opened"
        };
    var dataEvents = {
            dataInserted: "Data inserted", dataUpdated: "Data updated", dataRemoved: "Data removed", objectStoreCleared: "Object store cleared"
        };
    var upgradingDatabase = false;
    var async = {
            db: function(pw, name, version)
            {
                var req;
                try
                {
                    name = name ? name : defaultDatabaseName;
                    if (version)
                    {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "db opening", name, version);
                        req = window.indexedDB.open(name, version)
                    }
                    else
                    {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "db opening", name);
                        req = window.indexedDB.open(name)
                    }
                    handlers.IDBOpenDBRequest(req).then(function(args)
                    {
                        var db = args[0];
                        var e = args[1];
                        handlers.IDBDatabase(db).then(function(){}, function(args1)
                        {
                            closeConnection(args1[1].target)
                        }, function(args1)
                        {
                            var event = args1[1];
                            if (event)
                                if (event.type === "versionchange")
                                    if (event.version != event.target.version)
                                        closeConnection(event.target)
                        });
                        var currentVersion = getDatabaseVersion(db);
                        if (db.setVersion && (currentVersion < version || (version == -1) || currentVersion == ""))
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "DB Promise upgradeneeded", this, db, e);
                            async.changeDatabaseStructure(db, version || 1).then(function(args1)
                            {
                                var txn = args1[0];
                                var event = args1[1];
                                var context = txn.db;
                                context.transaction = txn;
                                var upgardeEvent = {};
                                upgardeEvent.type = "upgradeneeded";
                                upgardeEvent.newVersion = version;
                                upgardeEvent.oldVersion = currentVersion;
                                upgardeEvent.originalEvent = event;
                                core.dbStructureChanged.fire({
                                    type: dbEvents.databaseUpgrade, data: upgardeEvent
                                });
                                pw.progress(context, [txn, upgardeEvent]);
                                handlers.IDBTransaction(txn).then(function()
                                {
                                    pw.complete(this, args)
                                }, function(args2)
                                {
                                    pw.error(this, args2)
                                })
                            }, function(args1)
                            {
                                pw.error(this, args1)
                            }, function(args1)
                            {
                                core.dbStructureChanged.fire({
                                    type: dbEvents.databaseBlocked, data: args1
                                });
                                pw.progress(this, args1)
                            })
                        }
                        else if (version && version < currentVersion)
                        {
                            closeConnection(db);
                            var err = {
                                    severity: linq2indexedDB.logging.severity.error, type: "VersionError", message: "You are trying to open the database in a lower version (" + version + ") than the current version of the database", method: "db"
                                };
                            linq2indexedDB.logging.logError(err);
                            pw.error(this, err)
                        }
                        else
                        {
                            core.dbStructureChanged.fire({
                                type: dbEvents.databaseOpened, data: db
                            });
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "DB Promise resolved", db, e);
                            pw.complete(this, [db, e])
                        }
                    }, function(args)
                    {
                        var err = wrapError(args[1], "db");
                        if (args[1].target && args[1].target.errorCode == 12)
                            err.type = "VersionError";
                        if (err.type == "VersionError")
                            err.message = "You are trying to open the database in a lower version (" + version + ") than the current version of the database";
                        if (args[1].target && args[1].target.errorCode == 8)
                            err.type = "AbortError";
                        if (err.type == "AbortError")
                            err.message = "The VERSION_CHANGE transaction was aborted.";
                        linq2indexedDB.logging.logError(err);
                        pw.error(this, err)
                    }, function(args)
                    {
                        if (args[1].type == "blocked")
                            core.dbStructureChanged.fire({
                                type: dbEvents.databaseBlocked, data: args
                            });
                        else if (args[1].type == "upgradeneeded")
                            core.dbStructureChanged.fire({
                                type: dbEvents.databaseUpgrade, data: args
                            });
                        pw.progress(this, args)
                    })
                }
                catch(ex)
                {
                    var error = wrapException(ex, "db");
                    if ((ex.INVALID_ACCESS_ERR && ex.code == ex.INVALID_ACCESS_ERR) || ex.name == "InvalidAccessError")
                    {
                        error.type = "InvalidAccessError";
                        error.message = "You are trying to open a database with a negative version number."
                    }
                    linq2indexedDB.logging.logError(error);
                    pw.error(this, error)
                }
            }, transaction: function(pw, db, objectStoreNames, transactionType, autoGenerateAllowed)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction promise started", db, objectStoreNames, transactionType);
                    if (!linq2indexedDB.util.isArray(objectStoreNames))
                        objectStoreNames = [objectStoreNames];
                    transactionType = transactionType || transactionTypes.READ_ONLY;
                    var nonExistingObjectStores = [];
                    try
                    {
                        for (var i = 0; i < objectStoreNames.length; i++)
                            if (!db.objectStoreNames || !db.objectStoreNames.contains(objectStoreNames[i]))
                                nonExistingObjectStores.push(objectStoreNames[i]);
                        if (nonExistingObjectStores.length > 0 && autoGenerateAllowed)
                            setTimeout(function(con)
                            {
                                upgradingDatabase = true;
                                var version = getDatabaseVersion(db) + 1;
                                var dbName = con.name;
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction database upgrade needed: ", con);
                                closeConnection(con);
                                core.db(dbName, version).then(function(args)
                                {
                                    upgradingDatabase = false;
                                    var txn = args[0].transaction(objectStoreNames, transactionType);
                                    handlers.IDBTransaction(txn).then(function(args1)
                                    {
                                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction completed.", txn);
                                        pw.complete(this, args1)
                                    }, function(args1)
                                    {
                                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Transaction error/abort.", args1);
                                        pw.error(this, args1)
                                    });
                                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction created.", txn);
                                    pw.progress(txn, [txn])
                                }, function(args)
                                {
                                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Transaction error.", args);
                                    pw.error(this, args)
                                }, function(args)
                                {
                                    var event = args[1];
                                    if (event.type == "upgradeneeded")
                                        for (var j = 0; j < nonExistingObjectStores.length; j++)
                                            core.createObjectStore(args[0], nonExistingObjectStores[j], {
                                                keyPath: "Id", autoIncrement: true
                                            })
                                })
                            }, upgradingDatabase ? 10 : 1, db);
                        else
                        {
                            var transaction = db.transaction(objectStoreNames, transactionType);
                            handlers.IDBTransaction(transaction).then(function(args)
                            {
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction completed.", args);
                                pw.complete(this, args)
                            }, function(args)
                            {
                                var err = wrapError(args[1], "transaction");
                                if (args[1].type == "abort" || (args[1].target && args[1].target.error && args[1].target.error.name == "AbortError"))
                                {
                                    err.type = "abort";
                                    err.severity = "abort";
                                    err.message = "Transaction was aborted"
                                }
                                if (args[1].target && args[1].target.errorCode == 4)
                                    err.type = "ConstraintError";
                                if (err.type == "ConstraintError")
                                    err.message = "A mutation operation in the transaction failed. For more details look at the error on the instert, update, remove or clear statement.";
                                linq2indexedDB.logging.logError(err);
                                pw.error(this, err)
                            });
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Transaction transaction created.", transaction);
                            pw.progress(transaction, [transaction])
                        }
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "transaction");
                        if ((ex.INVALID_ACCESS_ERR && ex.code == ex.INVALID_ACCESS_ERR) || ex.name == "InvalidAccessError")
                        {
                            error.type = "InvalidAccessError";
                            error.message = "You are trying to open a transaction without providing an object store as scope."
                        }
                        if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError" || ex.type == "property_not_function")
                        {
                            var objectStores = "";
                            for (var m = 0; m < nonExistingObjectStores.length; m++)
                            {
                                if (m > 0)
                                    objectStores += ", ";
                                objectStores += nonExistingObjectStores[m]
                            }
                            error.type = "NotFoundError";
                            error.message = "You are trying to open a transaction for object stores (" + objectStores + "), that doesn't exist."
                        }
                        if ((ex.QUOTA_ERR && ex.code == ex.QUOTA_ERR) || ex.name == "QuotaExceededError")
                        {
                            error.type = "QuotaExceededError";
                            error.message = "The size quota of the indexedDB database is reached."
                        }
                        if ((ex.UNKNOWN_ERR && ex.code == ex.UNKNOWN_ERR) || ex.name == "UnknownError")
                        {
                            error.type = "UnknownError";
                            error.message = "An I/O exception occured."
                        }
                        linq2indexedDB.logging.logError(error);
                        pw.error(this, error)
                    }
                }, changeDatabaseStructure: function(db, version)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "changeDatabaseStructure started", db, version);
                            handlers.IDBBlockedRequest(db.setVersion(version)).then(function(args)
                            {
                                pw.complete(this, args)
                            }, function(args)
                            {
                                pw.error(this, args)
                            }, function(args)
                            {
                                pw.progress(this, args)
                            })
                        })
                }, objectStore: function(pw, transaction, objectStoreName)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "objectStore started", transaction, objectStoreName);
                    try
                    {
                        var store = transaction.objectStore(objectStoreName);
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "objectStore completed", transaction, store);
                        pw.complete(store, [transaction, store])
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "objectStore");
                        if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError")
                        {
                            error.type = "NotFoundError";
                            error.message = "You are trying to open an object store (" + objectStoreName + "), that doesn't exist or isn't in side the transaction scope."
                        }
                        if (ex.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to open an object store (" + objectStoreName + ") outside a transaction."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(transaction);
                        pw.error(this, error)
                    }
                }, createObjectStore: function(pw, transaction, objectStoreName, objectStoreOptions)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "createObjectStore started", transaction, objectStoreName, objectStoreOptions);
                    try
                    {
                        if (!transaction.db.objectStoreNames.contains(objectStoreName))
                        {
                            var options = new Object;
                            if (objectStoreOptions)
                            {
                                if (objectStoreOptions.keyPath)
                                    options.keyPath = objectStoreOptions.keyPath;
                                options.autoIncrement = objectStoreOptions.autoIncrement
                            }
                            else
                                options.autoIncrement = true;
                            var store = transaction.db.createObjectStore(objectStoreName, options, options.autoIncrement);
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "ObjectStore Created", transaction, store);
                            core.dbStructureChanged.fire({
                                type: dbEvents.objectStoreCreated, data: store
                            });
                            pw.complete(store, [transaction, store])
                        }
                        else
                            core.objectStore(transaction, objectStoreName).then(function(args)
                            {
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "ObjectStore Found", args[1], objectStoreName);
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "createObjectStore Promise", args[0], args[1]);
                                pw.complete(store, args)
                            }, function(args)
                            {
                                pw.error(this, args)
                            })
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "createObjectStore");
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to create an object store in a readonly or readwrite transaction."
                        }
                        if ((ex.INVALID_ACCESS_ERR && ex.code == ex.INVALID_ACCESS_ERR) || ex.name == "InvalidAccessError")
                        {
                            error.type = "InvalidAccessError";
                            error.message = "The object store can't have autoIncrement on and an empty string or an array with an empty string as keyPath."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "InvalidStateError")
                            abortTransaction(transaction);
                        pw.error(this, error)
                    }
                }, deleteObjectStore: function(pw, transaction, objectStoreName)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "deleteObjectStore Promise started", transaction, objectStoreName);
                    try
                    {
                        transaction.db.deleteObjectStore(objectStoreName);
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "ObjectStore Deleted", objectStoreName);
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "deleteObjectStore completed", objectStoreName);
                        core.dbStructureChanged.fire({
                            type: dbEvents.objectStoreRemoved, data: objectStoreName
                        });
                        pw.complete(this, [transaction, objectStoreName])
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "deleteObjectStore");
                        if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError")
                        {
                            error.type = "NotFoundError";
                            error.message = "You are trying to delete an object store (" + objectStoreName + "), that doesn't exist."
                        }
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to delete an object store in a readonly or readwrite transaction."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "InvalidStateError")
                            abortTransaction(transaction);
                        pw.error(this, error)
                    }
                }, index: function(pw, objectStore, propertyName, autoGenerateAllowed)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Index started", objectStore, propertyName, autoGenerateAllowed);
                    var indexName = propertyName;
                    if (propertyName.indexOf(core.indexSuffix) == -1)
                        indexName = indexName + core.indexSuffix;
                    try
                    {
                        if (!objectStore.indexNames.contains(indexName) && autoGenerateAllowed)
                            setTimeout(function(objStore)
                            {
                                upgradingDatabase = true;
                                var version = getDatabaseVersion(objStore.transaction.db) + 1;
                                var dbName = objStore.transaction.db.name;
                                var transactionType = objStore.transaction.mode;
                                var objectStoreNames = [objStore.name];
                                var objectStoreName = objStore.name;
                                closeConnection(objStore);
                                core.db(dbName, version).then(function(args)
                                {
                                    upgradingDatabase = false;
                                    core.transaction(args[0], objectStoreNames, transactionType, autoGenerateAllowed).then(function(){}, function(args1)
                                    {
                                        pw.error(this, args1)
                                    }, function(args1)
                                    {
                                        core.index(linq2indexedDB.core.objectStore(args1[0], objectStoreName), propertyName).then(function(args2)
                                        {
                                            pw.complete(this, args2)
                                        }, function(args2)
                                        {
                                            pw.error(this, args2)
                                        })
                                    })
                                }, function(args)
                                {
                                    pw.error(this, args)
                                }, function(args)
                                {
                                    var trans = args[0];
                                    var event = args[1];
                                    if (event.type == "upgradeneeded")
                                        core.createIndex(linq2indexedDB.core.objectStore(trans, objectStoreName), propertyName).then(function(){}, function(args1)
                                        {
                                            pw.error(this, args1)
                                        })
                                })
                            }, upgradingDatabase ? 10 : 1, objectStore);
                        else
                        {
                            var index = objectStore.index(indexName);
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Index completed", objectStore.transaction, index, objectStore);
                            pw.complete(this, [objectStore.transaction, index, objectStore])
                        }
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "index");
                        var txn = objectStore.transaction;
                        if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError")
                        {
                            error.type = "NotFoundError";
                            error.message = "You are trying to open an index (" + indexName + "), that doesn't exist."
                        }
                        if (ex.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to open an index (" + indexName + ") outside a transaction."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, createIndex: function(pw, objectStore, propertyName, indexOptions)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "createIndex started", objectStore, propertyName, indexOptions);
                    try
                    {
                        var indexName = propertyName;
                        if (propertyName.indexOf(core.indexSuffix) == -1)
                            indexName = indexName + core.indexSuffix;
                        if (!objectStore.indexNames.contains(indexName))
                        {
                            var index = objectStore.createIndex(indexName, propertyName, {
                                    unique: indexOptions ? indexOptions.unique : false, multiRow: indexOptions ? indexOptions.multirow : false, multiEntry: indexOptions ? indexOptions.multirow : false
                                });
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "createIndex completed", objectStore.transaction, index, objectStore);
                            core.dbStructureChanged.fire({
                                type: dbEvents.indexCreated, data: index
                            });
                            pw.complete(this, [objectStore.transaction, index, objectStore])
                        }
                        else
                            core.index(objectStore, propertyName, false).then(function(args)
                            {
                                pw.complete(this, args)
                            })
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "createIndex");
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to create an index in a readonly or readwrite transaction."
                        }
                        if (error.type != "InvalidStateError")
                            abortTransaction(objectStore.transaction);
                        linq2indexedDB.logging.logError(error);
                        pw.error(this, error)
                    }
                }, deleteIndex: function(pw, objectStore, propertyName)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "deleteIndex started", objectStore, propertyName);
                    var indexName = propertyName;
                    if (propertyName.indexOf(core.indexSuffix) == -1)
                        indexName = indexName + core.indexSuffix;
                    try
                    {
                        objectStore.deleteIndex(indexName);
                        core.dbStructureChanged.fire({
                            type: dbEvents.indexRemoved, data: indexName
                        });
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "deleteIndex completed", objectStore.transaction, propertyName, objectStore);
                        pw.complete(this, [objectStore.transaction, propertyName, objectStore])
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "deleteIndex");
                        if ((ex.NOT_FOUND_ERR && ex.code == ex.NOT_FOUND_ERR) || ex.name == "NotFoundError")
                        {
                            error.type = "NotFoundError";
                            error.message = "You are trying to delete an index (" + indexName + ", propertyName: " + propertyName + " ), that doesn't exist."
                        }
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to delete an index in a readonly or readwrite transaction."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "InvalidStateError")
                            abortTransaction(objectStore.transaction);
                        pw.error(this, error)
                    }
                }, cursor: function(pw, source, range, direction)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor Promise Started", source);
                    var keyRange;
                    var returnData = [];
                    var request;
                    var txn = source.transaction || source.objectStore.transaction;
                    try
                    {
                        keyRange = range;
                        if (!keyRange)
                            if (implementation != implementations.GOOGLE)
                                keyRange = core.keyRange.lowerBound(0);
                            else
                                keyRange = core.keyRange.lowerBound(parseFloat(0));
                        if (direction)
                            request = handlers.IDBCursorRequest(source.openCursor(keyRange, direction));
                        else if (keyRange)
                            request = handlers.IDBCursorRequest(source.openCursor(keyRange));
                        else
                            request = handlers.IDBCursorRequest(source.openCursor());
                        request.then(function(args1)
                        {
                            var e = args1[1];
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor completed", returnData, txn, e);
                            pw.complete(this, [returnData, txn, e])
                        }, function(args)
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Cursor error", args);
                            pw.error(this, args)
                        }, function(args)
                        {
                            var result = args[0];
                            var e = args[1];
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor progress", result, e);
                            if (result.value)
                            {
                                var progressObj = {
                                        data: result.value, key: result.primaryKey, skip: function(number)
                                            {
                                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor skip", result, e);
                                                try
                                                {
                                                    result.advance(number)
                                                }
                                                catch(advanceEx)
                                                {
                                                    var advanceErr = wrapException(advanceEx, "cursor - skip");
                                                    if ((advanceEx.DATA_ERR && advanceEx.code == advanceEx.DATA_ERR) || advanceEx.name == "DataError")
                                                    {
                                                        advanceErr.type = "DataError";
                                                        advanceErr.message = "The provided range parameter isn't a valid key or key range."
                                                    }
                                                    if (advanceEx.name == "TypeError")
                                                    {
                                                        advanceErr.type = "TypeError";
                                                        advanceErr.message = "The provided count parameter is zero or a negative number."
                                                    }
                                                    if ((advanceEx.INVALID_STATE_ERR && advanceEx.code == advanceEx.INVALID_STATE_ERR) || advanceEx.name == "InvalidStateError")
                                                    {
                                                        advanceErr.type = "InvalidStateError";
                                                        advanceErr.message = "You are trying to skip data on a removed object store."
                                                    }
                                                    linq2indexedDB.logging.logError(advanceErr);
                                                    abortTransaction(txn);
                                                    pw.error(this, advanceErr)
                                                }
                                            }, update: function(obj)
                                            {
                                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor update", result, e);
                                                try
                                                {
                                                    result.update(obj)
                                                }
                                                catch(updateEx)
                                                {
                                                    var updateError = wrapException(updateEx, "cursor - update");
                                                    if ((updateEx.DATA_ERR && updateEx.code == updateEx.DATA_ERR) || updateEx.name == "DataError")
                                                    {
                                                        updateError.type = "DataError";
                                                        updateError.message = "The underlying object store uses in-line keys and the property in value at the object store's key path does not match the key in this cursor's position."
                                                    }
                                                    if ((updateEx.READ_ONLY_ERR && updateEx.code == updateEx.READ_ONLY_ERR) || updateEx.name == "ReadOnlyError")
                                                    {
                                                        updateError.type = "ReadOnlyError";
                                                        updateError.message = "You are trying to update data in a readonly transaction."
                                                    }
                                                    if (updateEx.name == "TransactionInactiveError")
                                                    {
                                                        updateError.type = "TransactionInactiveError";
                                                        updateError.message = "You are trying to update data on an inactieve transaction. (The transaction was already aborted or committed)"
                                                    }
                                                    if ((updateEx.DATA_CLONE_ERR && updateEx.code == updateEx.DATA_CLONE_ERR) || updateEx.name == "DataCloneError")
                                                    {
                                                        updateError.type = "DataCloneError";
                                                        updateError.message = "The data you are trying to update could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to update the data."
                                                    }
                                                    if ((updateEx.INVALID_STATE_ERR && updateEx.code == updateEx.INVALID_STATE_ERR) || updateEx.name == "InvalidStateError")
                                                    {
                                                        updateError.type = "InvalidStateError";
                                                        updateError.message = "You are trying to update data on a removed object store."
                                                    }
                                                    linq2indexedDB.logging.logError(updateError);
                                                    if (error.type != "TransactionInactiveError")
                                                        abortTransaction(txn);
                                                    pw.error(this, updateError)
                                                }
                                            }, remove: function()
                                            {
                                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Cursor remove", result, e);
                                                try
                                                {
                                                    result["delete"]()
                                                }
                                                catch(deleteEx)
                                                {
                                                    var deleteError = wrapException(deleteEx, "cursor - delete");
                                                    if ((deleteEx.READ_ONLY_ERR && deleteEx.code == deleteEx.READ_ONLY_ERR) || deleteEx.name == "ReadOnlyError")
                                                    {
                                                        deleteError.type = "ReadOnlyError";
                                                        deleteError.message = "You are trying to remove data in a readonly transaction."
                                                    }
                                                    if (deleteEx.name == "TransactionInactiveError")
                                                    {
                                                        deleteError.type = "TransactionInactiveError";
                                                        deleteError.message = "You are trying to remove data on an inactieve transaction. (The transaction was already aborted or committed)"
                                                    }
                                                    if ((deleteEx.INVALID_STATE_ERR && deleteEx.code == deleteEx.INVALID_STATE_ERR) || deleteEx.name == "InvalidStateError")
                                                    {
                                                        deleteError.type = "InvalidStateError";
                                                        deleteError.message = "You are trying to remove data on a removed object store."
                                                    }
                                                    linq2indexedDB.logging.logError(deleteError);
                                                    if (error.type != "TransactionInactiveError")
                                                        abortTransaction(txn);
                                                    pw.error(this, deleteError)
                                                }
                                            }
                                    };
                                pw.progress(this, [progressObj, result, e]);
                                returnData.push({
                                    data: progressObj.data, key: progressObj.key
                                })
                            }
                            result["continue"]()
                        })
                    }
                    catch(exception)
                    {
                        var error = wrapException(exception, "cursor");
                        if ((exception.DATA_ERR && error.code == exception.DATA_ERR) || exception.name == "DataError")
                        {
                            error.type = "DataError";
                            error.message = "The provided range parameter isn't a valid key or key range."
                        }
                        if (exception.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to retrieve data on an inactieve transaction. (The transaction was already aborted or committed)"
                        }
                        if (exception.name == "TypeError")
                        {
                            error.type = "TypeError";
                            error.message = "The provided directory parameter is invalid"
                        }
                        if ((exception.INVALID_STATE_ERR && exception.code == exception.INVALID_STATE_ERR) || (exception.NOT_ALLOWED_ERR && exception.code == exception.NOT_ALLOWED_ERR) || exception.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to insert data on a removed object store."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, keyCursor: function(pw, index, range, direction)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor Started", index, range, direction);
                    var returnData = [];
                    var txn = index.objectStore.transaction;
                    try
                    {
                        var request;
                        var keyRange = range;
                        if (!keyRange)
                            keyRange = core.keyRange.lowerBound(0);
                        if (direction)
                            request = handlers.IDBCursorRequest(index.openKeyCursor(keyRange, direction));
                        else
                            request = handlers.IDBCursorRequest(index.openKeyCursor(keyRange));
                        request.then(function(args)
                        {
                            var e = args[1];
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor completed", returnData, txn, e);
                            pw.complete(this, [returnData, txn, e])
                        }, function(args)
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "keyCursor error", args);
                            pw.error(this, args)
                        }, function(args)
                        {
                            var result = args[0];
                            var e = args[1];
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor progress", result, e);
                            if (result.value)
                            {
                                var progressObj = {
                                        key: result.key, primaryKey: result.primaryKey, skip: function(number)
                                            {
                                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor skip", result, e);
                                                try
                                                {
                                                    result.advance(number)
                                                }
                                                catch(advanceEx)
                                                {
                                                    var advanceErr = wrapException(advanceEx, "keyCursor - skip");
                                                    if ((advanceEx.DATA_ERR && advanceEx.code == advanceEx.DATA_ERR) || advanceEx.name == "DataError")
                                                    {
                                                        advanceErr.type = "DataError";
                                                        advanceErr.message = "The provided range parameter isn't a valid key or key range."
                                                    }
                                                    if (advanceEx.name == "TypeError")
                                                    {
                                                        advanceErr.type = "TypeError";
                                                        advanceErr.message = "The provided count parameter is zero or a negative number."
                                                    }
                                                    if ((advanceEx.INVALID_STATE_ERR && advanceEx.code == advanceEx.INVALID_STATE_ERR) || advanceEx.name == "InvalidStateError")
                                                    {
                                                        advanceErr.type = "InvalidStateError";
                                                        advanceErr.message = "You are trying to skip data on a removed object store."
                                                    }
                                                    linq2indexedDB.logging.logError(advanceErr);
                                                    abortTransaction(index.objectStore.transaction);
                                                    pw.error(this, advanceErr)
                                                }
                                            }, update: function(obj)
                                            {
                                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor update", result, e);
                                                try
                                                {
                                                    result.update(obj)
                                                }
                                                catch(updateEx)
                                                {
                                                    var updateError = wrapException(updateEx, "keyCursor - update");
                                                    if ((updateEx.DATA_ERR && updateEx.code == updateEx.DATA_ERR) || updateEx.name == "DataError")
                                                    {
                                                        updateError.type = "DataError";
                                                        updateError.message = "The underlying object store uses in-line keys and the property in value at the object store's key path does not match the key in this cursor's position."
                                                    }
                                                    if ((updateEx.READ_ONLY_ERR && updateEx.code == updateEx.READ_ONLY_ERR) || updateEx.name == "ReadOnlyError")
                                                    {
                                                        updateError.type = "ReadOnlyError";
                                                        updateError.message = "You are trying to update data in a readonly transaction."
                                                    }
                                                    if (updateEx.name == "TransactionInactiveError")
                                                    {
                                                        updateError.type = "TransactionInactiveError";
                                                        updateError.message = "You are trying to update data on an inactieve transaction. (The transaction was already aborted or committed)"
                                                    }
                                                    if ((updateEx.DATA_CLONE_ERR && updateEx.code == updateEx.DATA_CLONE_ERR) || updateEx.name == "DataCloneError")
                                                    {
                                                        updateError.type = "DataCloneError";
                                                        updateError.message = "The data you are trying to update could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to update the data."
                                                    }
                                                    if ((updateEx.INVALID_STATE_ERR && updateEx.code == updateEx.INVALID_STATE_ERR) || updateEx.name == "InvalidStateError")
                                                    {
                                                        updateError.type = "InvalidStateError";
                                                        updateError.message = "You are trying to update data on a removed object store."
                                                    }
                                                    linq2indexedDB.logging.logError(updateError);
                                                    if (error.type != "TransactionInactiveError")
                                                        abortTransaction(txn);
                                                    pw.error(this, updateError)
                                                }
                                            }, remove: function()
                                            {
                                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "keyCursor remove", result, e);
                                                try
                                                {
                                                    result["delete"]()
                                                }
                                                catch(deleteEx)
                                                {
                                                    var deleteError = wrapException(deleteEx, "keyCursor - delete");
                                                    if ((deleteEx.READ_ONLY_ERR && deleteEx.code == deleteEx.READ_ONLY_ERR) || deleteEx.name == "ReadOnlyError")
                                                    {
                                                        deleteError.type = "ReadOnlyError";
                                                        deleteError.message = "You are trying to remove data in a readonly transaction."
                                                    }
                                                    if (deleteEx.name == "TransactionInactiveError")
                                                    {
                                                        deleteError.type = "TransactionInactiveError";
                                                        deleteError.message = "You are trying to remove data on an inactieve transaction. (The transaction was already aborted or committed)"
                                                    }
                                                    if ((deleteEx.INVALID_STATE_ERR && deleteEx.code == deleteEx.INVALID_STATE_ERR) || deleteEx.name == "InvalidStateError")
                                                    {
                                                        deleteError.type = "InvalidStateError";
                                                        deleteError.message = "You are trying to remove data on a removed object store."
                                                    }
                                                    linq2indexedDB.logging.logError(deleteError);
                                                    if (error.type != "TransactionInactiveError")
                                                        abortTransaction(txn);
                                                    pw.error(this, deleteError)
                                                }
                                            }
                                    };
                                pw.progress(this, [progressObj, result, e]);
                                returnData.push(progressObj.data)
                            }
                            result["continue"]()
                        })
                    }
                    catch(exception)
                    {
                        var error = wrapException(exception, "keyCursor");
                        if ((exception.DATA_ERR && error.code == exception.DATA_ERR) || exception.name == "DataError")
                        {
                            error.type = "DataError";
                            error.message = "The provided range parameter isn't a valid key or key range."
                        }
                        if (exception.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to retrieve data on an inactieve transaction. (The transaction was already aborted or committed)"
                        }
                        if (exception.name == "TypeError")
                        {
                            error.type = "TypeError";
                            error.message = "The provided directory parameter is invalid"
                        }
                        if ((exception.INVALID_STATE_ERR && exception.code == exception.INVALID_STATE_ERR) || (exception.NOT_ALLOWED_ERR && exception.code == exception.NOT_ALLOWED_ERR) || exception.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to insert data on a removed object store."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, get: function(pw, source, key)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Get Started", source);
                    try
                    {
                        handlers.IDBRequest(source.get(key)).then(function(args)
                        {
                            var result = args[0];
                            var e = args[1];
                            var transaction = source.transaction || source.objectStore.transaction;
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Get completed", result, transaction, e);
                            pw.complete(this, [result, transaction, e])
                        }, function(args)
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Get error", args);
                            pw.error(this, args)
                        })
                    }
                    catch(ex)
                    {
                        var txn = source.transaction || source.objectStore.transaction;
                        var error = wrapException(ex, "get");
                        if (error.code == ex.DATA_ERR || ex.name == "DataError")
                        {
                            error.type = "DataError";
                            error.message = "The provided key isn't a valid key (must be an array, string, date or number)."
                        }
                        if (ex.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to retrieve data on an inactieve transaction. (The transaction was already aborted or committed)"
                        }
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to retrieve data on a removed object store."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, count: function(pw, source, key)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Count Started", source);
                    try
                    {
                        var req;
                        if (key)
                            req = source.count(key);
                        else
                            req = source.count();
                        handlers.IDBRequest(req).then(function(args)
                        {
                            var result = args[0];
                            var e = args[1];
                            var transaction = source.transaction || source.objectStore.transaction;
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Count completed", result, transaction, e);
                            pw.complete(this, [result, transaction, e])
                        }, function(args)
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Count error", args);
                            pw.error(this, args)
                        })
                    }
                    catch(ex)
                    {
                        var txn = source.transaction || source.objectStore.transaction;
                        var error = wrapException(ex, "count");
                        if (error.code == ex.DATA_ERR || ex.name == "DataError")
                        {
                            error.type = "DataError";
                            error.message = "The provided key isn't a valid key or keyRange."
                        }
                        if (ex.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to count data on an inactieve transaction. (The transaction was already aborted or committed)"
                        }
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to count data on a removed object store."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, getKey: function(pw, index, key)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "GetKey Started", index, key);
                    try
                    {
                        handlers.IDBRequest(index.getKey(key)).then(function(args)
                        {
                            var result = args[0];
                            var e = args[1];
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "GetKey completed", result, index.objectStore.transaction, e);
                            pw.complete(this, [result, index.objectStore.transaction, e])
                        }, function(args)
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "GetKey error", args);
                            pw.error(this, args)
                        })
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "getKey");
                        var txn = index.objectStore.transaction;
                        if (error.code == ex.DATA_ERR || ex.name == "DataError")
                        {
                            error.type = "DataError";
                            error.message = "The provided key isn't a valid key or keyRange."
                        }
                        if (ex.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to getKey data on an inactieve transaction. (The transaction was already aborted or committed)"
                        }
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to getKey data on a removed object store."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, insert: function(pw, objectStore, data, key)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Insert Started", objectStore, data, key);
                    try
                    {
                        var req;
                        if (key)
                            req = handlers.IDBRequest(objectStore.add(data, key));
                        else
                            req = handlers.IDBRequest(objectStore.add(data));
                        req.then(function(args)
                        {
                            var result = args[0];
                            var e = args[1];
                            if (objectStore.keyPath)
                                data[objectStore.keyPath] = result;
                            core.dbDataChanged.fire({
                                type: dataEvents.dataInserted, data: data, objectStore: objectStore
                            });
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Insert completed", data, result, objectStore.transaction, e);
                            pw.complete(this, [data, result, objectStore.transaction, e])
                        }, function(args)
                        {
                            var err = wrapError(args[1], "insert");
                            if (args[1].target && args[1].target.errorCode == 4)
                                err.type = "ConstraintError";
                            if (err.type == "ConstraintError")
                            {
                                var duplicateKey = key;
                                if (!duplicateKey && objectStore.keyPath)
                                    duplicateKey = data[objectStore.keyPath];
                                err.message = "A record for the key (" + duplicateKey + ") already exists in the database or one of the properties of the provided data has a unique index declared."
                            }
                            abortTransaction(objectStore.transaction);
                            linq2indexedDB.logging.logError(err);
                            pw.error(this, err)
                        })
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "insert");
                        var txn = objectStore.transaction;
                        if (error.code == ex.DATA_ERR || ex.name == "DataError")
                        {
                            error.type = "DataError";
                            var possibleKey = key;
                            if (!possibleKey && objectStore.keyPath)
                                possibleKey = data[objectStore.keyPath];
                            if (!possibleKey)
                                error.message = "There is no key provided for the data you want to insert for an object store without autoIncrement.";
                            else if (key && objectStore.keyPath)
                                error.message = "An external key is provided while the object store expects a keyPath key.";
                            else if (typeof possibleKey !== "string" && typeof possibleKey !== "number" && typeof possibleKey !== "Date" && !linq2indexedDB.util.isArray(possibleKey))
                                error.message = "The provided key isn't a valid key (must be an array, string, date or number)."
                        }
                        if ((ex.READ_ONLY_ERR && ex.code == ex.READ_ONLY_ERR) || ex.name == "ReadOnlyError")
                        {
                            error.type = "ReadOnlyError";
                            error.message = "You are trying to insert data in a readonly transaction."
                        }
                        if (ex.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to insert data on an inactieve transaction. (The transaction was already aborted or committed)"
                        }
                        if ((ex.DATA_CLONE_ERR && ex.code == ex.DATA_CLONE_ERR) || ex.name == "DataCloneError")
                        {
                            error.type = "DataCloneError";
                            error.message = "The data you are trying to insert could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to insert the data."
                        }
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to insert data on a removed object store."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, update: function(pw, objectStore, data, key)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Update Started", objectStore, data, key);
                    try
                    {
                        var req;
                        if (key)
                            req = handlers.IDBRequest(objectStore.put(data, key));
                        else
                            req = handlers.IDBRequest(objectStore.put(data));
                        req.then(function(args)
                        {
                            var result = args[0];
                            var e = args[1];
                            if (objectStore.keyPath && data[objectStore.keyPath] === undefined)
                                data[objectStore.keyPath] = result;
                            core.dbDataChanged.fire({
                                type: dataEvents.dataUpdated, data: data, objectStore: objectStore
                            });
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Update completed", data, result, objectStore.transaction, e);
                            pw.complete(this, [data, result, objectStore.transaction, e])
                        }, function(args)
                        {
                            var err = wrapError(args[1], "update");
                            abortTransaction(objectStore.transaction);
                            linq2indexedDB.logging.logError(err);
                            pw.error(this, err)
                        })
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "update");
                        var txn = objectStore.transaction;
                        if (error.code == ex.DATA_ERR || ex.name == "DataError")
                        {
                            error.type = "DataError";
                            var possibleKey = key;
                            if (!possibleKey && objectStore.keyPath)
                                possibleKey = data[objectStore.keyPath];
                            if (!possibleKey)
                                error.message = "There is no key provided for the data you want to update for an object store without autoIncrement.";
                            else if (key && objectStore.keyPath)
                                error.message = "An external key is provided while the object store expects a keyPath key.";
                            else if (typeof possibleKey !== "string" && typeof possibleKey !== "number" && typeof possibleKey !== "Date" && !linq2indexedDB.util.isArray(possibleKey))
                                error.message = "The provided key isn't a valid key (must be an array, string, date or number)."
                        }
                        if ((ex.READ_ONLY_ERR && ex.code == ex.READ_ONLY_ERR) || ex.name == "ReadOnlyError")
                        {
                            error.type = "ReadOnlyError";
                            error.message = "You are trying to update data in a readonly transaction."
                        }
                        if (ex.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to update data on an inactieve transaction. (The transaction was already aborted or committed)"
                        }
                        if ((ex.DATA_CLONE_ERR && ex.code == ex.DATA_CLONE_ERR) || ex.name == "DataCloneError")
                        {
                            error.type = "DataCloneError";
                            error.message = "The data you are trying to update could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to update the data."
                        }
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to update data on a removed object store."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, remove: function(pw, objectStore, key)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Remove Started", objectStore, key);
                    try
                    {
                        handlers.IDBRequest(objectStore["delete"](key)).then(function(args)
                        {
                            var result = args[0];
                            var e = args[1];
                            core.dbDataChanged.fire({
                                type: dataEvents.dataRemoved, data: key, objectStore: objectStore
                            });
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Remove completed", result, objectStore.transaction, e);
                            pw.complete(this, [result, objectStore.transaction, e])
                        }, function(args)
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Remove error", args);
                            pw.error(this, args)
                        })
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "delete");
                        var txn = objectStore.transaction;
                        if ((ex.READ_ONLY_ERR && ex.code == ex.READ_ONLY_ERR) || ex.name == "ReadOnlyError")
                        {
                            error.type = "ReadOnlyError";
                            error.message = "You are trying to remove data in a readonly transaction."
                        }
                        if (ex.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to remove data on an inactieve transaction. (The transaction was already aborted or committed)"
                        }
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to remove data on a removed object store."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, clear: function(pw, objectStore)
                {
                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Clear Started", objectStore);
                    try
                    {
                        handlers.IDBRequest(objectStore.clear()).then(function(args)
                        {
                            var result = args[0];
                            var e = args[1];
                            core.dbDataChanged.fire({
                                type: dataEvents.objectStoreCleared, objectStore: objectStore
                            });
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Clear completed", result, objectStore.transaction, e);
                            pw.complete(this, [result, objectStore.transaction, e])
                        }, function(args)
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Clear error", args);
                            pw.error(this, args)
                        })
                    }
                    catch(ex)
                    {
                        var error = wrapException(ex, "clear");
                        var txn = objectStore.transaction;
                        if ((ex.READ_ONLY_ERR && ex.code == ex.READ_ONLY_ERR) || ex.name == "ReadOnlyError")
                        {
                            error.type = "ReadOnlyError";
                            error.message = "You are trying to clear data in a readonly transaction."
                        }
                        if (ex.name == "TransactionInactiveError")
                        {
                            error.type = "TransactionInactiveError";
                            error.message = "You are trying to clear data on an inactieve transaction. (The transaction was already aborted or committed)"
                        }
                        if ((ex.INVALID_STATE_ERR && ex.code == ex.INVALID_STATE_ERR) || (ex.NOT_ALLOWED_ERR && ex.code == ex.NOT_ALLOWED_ERR) || ex.name == "InvalidStateError")
                        {
                            error.type = "InvalidStateError";
                            error.message = "You are trying to clear data on a removed object store."
                        }
                        linq2indexedDB.logging.logError(error);
                        if (error.type != "TransactionInactiveError")
                            abortTransaction(txn);
                        pw.error(this, error)
                    }
                }, deleteDb: function(pw, name)
                {
                    try
                    {
                        if (typeof(window.indexedDB.deleteDatabase) != "undefined")
                            handlers.IDBBlockedRequest(window.indexedDB.deleteDatabase(name)).then(function(args)
                            {
                                var result = args[0];
                                var e = args[1];
                                core.dbStructureChanged.fire({type: dbEvents.databaseRemoved});
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Delete Database Promise completed", result, e, name);
                                pw.complete(this, [result, e, name])
                            }, function(args)
                            {
                                var error = args[0];
                                var e = args[1];
                                if (e.currentTarget && e.currentTarget.errorCode == 6)
                                {
                                    core.dbStructureChanged.fire({type: dbEvents.databaseRemoved});
                                    pw.complete(this, [error, e, name])
                                }
                                else if (implementation == implementations.SHIM && e.message == "Database does not exist")
                                {
                                    core.dbStructureChanged.fire({type: dbEvents.databaseRemoved});
                                    pw.complete(this, [error, e, name])
                                }
                                else
                                {
                                    linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Delete Database Promise error", error, e);
                                    pw.error(this, [error, e])
                                }
                            }, function(args)
                            {
                                if (args[0] == "blocked")
                                    core.dbStructureChanged.fire({type: dbEvents.databaseBlocked});
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Delete Database Promise blocked", args);
                                pw.progress(this, args)
                            });
                        else
                        {
                            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Delete Database function not found", name);
                            core.db(name, -1).then(function(args)
                            {
                                var result = args[0];
                                var e = args[1];
                                core.dbStructureChanged.fire({type: dbEvents.databaseRemoved});
                                pw.complete(this, [result, e, name])
                            }, function(args)
                            {
                                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.error, "Clear Promise error", args);
                                pw.error(this, args)
                            }, function(args)
                            {
                                var dbConnection = args[0];
                                var event = args[1];
                                if (event.type == "upgradeneeded")
                                {
                                    for (var i = 0; i < dbConnection.objectStoreNames.length; i++)
                                        core.deleteObjectStore(dbConnection.txn, dbConnection.objectStoreNames[i]);
                                    closeConnection(dbConnection)
                                }
                            })
                        }
                    }
                    catch(ex)
                    {
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.exception, "Delete Database Promise exception", ex);
                        pw.error(this, [ex.message, ex])
                    }
                }
        };
    var core = {
            db: function(name, version)
            {
                return linq2indexedDB.promises.promise(function(pw)
                    {
                        async.db(pw, name, version)
                    })
            }, transaction: function(db, objectStoreNames, transactionType, autoGenerateAllowed)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (db.then)
                                db.then(function(args)
                                {
                                    if (isMetroApp)
                                        setTimeout(function()
                                        {
                                            async.transaction(pw, args[0], objectStoreNames, transactionType, autoGenerateAllowed)
                                        }, 1);
                                    else
                                        async.transaction(pw, args[0], objectStoreNames, transactionType, autoGenerateAllowed)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                }, function(args)
                                {
                                    pw.progress(this, args)
                                });
                            else if (isMetroApp)
                                setTimeout(function()
                                {
                                    async.transaction(pw, db, objectStoreNames, transactionType, autoGenerateAllowed)
                                }, 1);
                            else
                                async.transaction(pw, db, objectStoreNames, transactionType, autoGenerateAllowed)
                        })
                }, objectStore: function(transaction, objectStoreName)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (transaction.then)
                                transaction.then(function(){}, function(args)
                                {
                                    pw.error(this, args)
                                }, function(args)
                                {
                                    async.objectStore(pw, args[0], objectStoreName)
                                });
                            else
                                async.objectStore(pw, transaction, objectStoreName)
                        })
                }, createObjectStore: function(transaction, objectStoreName, objectStoreOptions)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (transaction.then)
                                transaction.then(function(){}, function(args)
                                {
                                    pw.error(this, args)
                                }, function(args)
                                {
                                    async.createObjectStore(pw, args[0], objectStoreName, objectStoreOptions)
                                });
                            else
                                async.createObjectStore(pw, transaction, objectStoreName, objectStoreOptions)
                        })
                }, deleteObjectStore: function(transaction, objectStoreName)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (transaction.then)
                                transaction.then(function(){}, function(args)
                                {
                                    pw.error(this, args)
                                }, function(args)
                                {
                                    async.deleteObjectStore(pw, args[0], objectStoreName)
                                });
                            else
                                async.deleteObjectStore(pw, transaction, objectStoreName)
                        })
                }, index: function(objectStore, propertyName, autoGenerateAllowed)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (objectStore.then)
                                objectStore.then(function(args)
                                {
                                    async.index(pw, args[1], propertyName, autoGenerateAllowed)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.index(pw, objectStore, propertyName, autoGenerateAllowed)
                        })
                }, createIndex: function(objectStore, propertyName, indexOptions)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (objectStore.then)
                                objectStore.then(function(args)
                                {
                                    async.createIndex(pw, args[1], propertyName, indexOptions)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.createIndex(pw, objectStore, propertyName, indexOptions)
                        })
                }, deleteIndex: function(objectStore, propertyName)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (objectStore.then)
                                objectStore.then(function(args)
                                {
                                    async.deleteIndex(pw, args[1], propertyName)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.deleteIndex(pw, objectStore, propertyName)
                        })
                }, cursor: function(source, range, direction)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (source.then)
                                source.then(function(args)
                                {
                                    async.cursor(pw, args[1], range, direction)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.cursor(pw, source, range, direction)
                        })
                }, keyCursor: function(index, range, direction)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (index.then)
                                index.then(function(args)
                                {
                                    async.keyCursor(pw, args[1], range, direction)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.keyCursor(pw, index, range, direction)
                        })
                }, get: function(source, key)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (source.then)
                                source.then(function(args)
                                {
                                    async.get(pw, args[1], key)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.get(pw, source, key)
                        })
                }, count: function(source, key)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (source.then)
                                source.then(function(args)
                                {
                                    async.count(pw, args[1], key)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.count(pw, source, key)
                        })
                }, getKey: function(index, key)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (index.then)
                                index.then(function(args)
                                {
                                    async.getKey(pw, args[1], key)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.getKey(pw, index, key)
                        })
                }, insert: function(objectStore, data, key)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (objectStore.then)
                                objectStore.then(function(args)
                                {
                                    async.insert(pw, args[1], data, key)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.insert(pw, objectStore, data, key)
                        })
                }, update: function(objectStore, data, key)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (objectStore.then)
                                objectStore.then(function(args)
                                {
                                    async.update(pw, args[1], data, key)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.update(pw, objectStore, data, key)
                        })
                }, remove: function(objectStore, key)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (objectStore.then)
                                objectStore.then(function(args)
                                {
                                    async.remove(pw, args[1], key)
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.remove(pw, objectStore, key)
                        })
                }, clear: function(objectStore)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            if (objectStore.then)
                                objectStore.then(function(args)
                                {
                                    async.clear(pw, args[1])
                                }, function(args)
                                {
                                    pw.error(this, args)
                                });
                            else
                                async.clear(pw, objectStore)
                        })
                }, deleteDb: function(name)
                {
                    return linq2indexedDB.promises.promise(function(pw)
                        {
                            async.deleteDb(pw, name)
                        })
                }, closeDatabaseConnection: closeConnection, abortTransaction: abortTransaction, transactionTypes: transactionTypes, dbStructureChanged: new linq2indexedDB.Event, dbDataChanged: new linq2indexedDB.Event, databaseEvents: dbEvents, dataEvents: dataEvents, implementation: implementation, implementations: implementations, indexSuffix: "_Index", keyRange: (typeof(window) !== "undefined") ? window.IDBKeyRange : undefined
        };
    function getDatabaseVersion(db)
    {
        var dbVersion = parseInt(db.version);
        if (isNaN(dbVersion) || dbVersion < 0)
            return 0;
        else
            return dbVersion
    }
    function wrapException(exception, method)
    {
        return {
                code: exception.code, severity: linq2indexedDB.logging.severity.exception, orignialError: exception, method: method, type: "unknown"
            }
    }
    function wrapError(error, method)
    {
        return {
                severity: linq2indexedDB.logging.severity.error, orignialError: error, type: (error.target && error.target.error && error.target.error.name) ? error.target.error.name : "unknown", method: method
            }
    }
    function closeConnection(target)
    {
        var db;
        if (target instanceof window.IDBCursor)
            target = target.source;
        if (target instanceof window.IDBDatabase)
            db = target;
        else if (target instanceof window.IDBTransaction)
            db = target.db;
        else if (target instanceof window.IDBObjectStore || target instanceof window.IDBRequest)
            db = target.transaction.db;
        else if (target instanceof window.IDBIndex)
            db = target.objectStore.transaction.db;
        if (typeof(db) !== "undefined" && db != null && typeof(db.close) != "undefined")
        {
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Close database Connection: ", db);
            db.close()
        }
    }
    {};
    function abortTransaction(transaction)
    {
        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Abort transaction: " + transaction);
        if (implementation != implementations.MICROSOFT)
        {
            transaction.abort();
            closeConnection(transaction)
        }
    }
    function initializeIndexedDb()
    {
        if (typeof(window) === "undefined")
            return implementations.NONE;
        if (window.indexedDB)
        {
            if (!window.IDBObjectStore && window.webkitIDBObjectStore)
                window.IDBObjectStore = window.webkitIDBObjectStore;
            if (!window.IDBRequest && window.webkitIDBRequest)
                window.IDBRequest = window.webkitIDBRequest;
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Native implementation", window.indexedDB);
            return implementations.NATIVE
        }
        else if (window.mozIndexedDB)
        {
            window.indexedDB = window.mozIndexedDB;
            if (typeof window.IDBTransaction.READ_ONLY === "number" && typeof window.IDBTransaction.READ_WRITE === "number" && typeof window.IDBTransaction.VERSION_CHANGE === "number")
            {
                transactionTypes.READ_ONLY = window.IDBTransaction.READ_ONLY;
                transactionTypes.READ_WRITE = window.IDBTransaction.READ_WRITE;
                transactionTypes.VERSION_CHANGE = window.IDBTransaction.VERSION_CHANGE
            }
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "FireFox Initialized", window.indexedDB);
            return implementations.MOZILLA
        }
        else if (window.webkitIndexedDB)
        {
            if (!window.indexedDB)
                window.indexedDB = window.webkitIndexedDB;
            if (!window.IDBCursor)
                window.IDBCursor = window.webkitIDBCursor;
            if (!window.IDBDatabase)
                window.IDBDatabase = window.webkitIDBDatabase;
            if (!window.IDBDatabaseException)
                window.IDBDatabaseException = window.webkitIDBDatabaseException;
            if (!window.IDBFactory)
                window.IDBFactory = window.webkitIDBFactory;
            if (!window.IDBIndex)
                window.IDBIndex = window.webkitIDBIndex;
            if (!window.IDBKeyRange)
                window.IDBKeyRange = window.webkitIDBKeyRange;
            if (!window.IDBObjectStore)
                window.IDBObjectStore = window.webkitIDBObjectStore;
            if (!window.IDBRequest)
                window.IDBRequest = window.webkitIDBRequest;
            if (!window.IDBTransaction)
                window.IDBTransaction = window.webkitIDBTransaction;
            if (!window.IDBOpenDBRequest)
                window.IDBOpenDBRequest = window.webkitIDBOpenDBRequest;
            if (typeof window.IDBTransaction.READ_ONLY === "number" && typeof window.IDBTransaction.READ_WRITE === "number" && typeof window.IDBTransaction.VERSION_CHANGE === "number")
            {
                transactionTypes.READ_ONLY = window.IDBTransaction.READ_ONLY;
                transactionTypes.READ_WRITE = window.IDBTransaction.READ_WRITE;
                transactionTypes.VERSION_CHANGE = window.IDBTransaction.VERSION_CHANGE
            }
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Chrome Initialized", window.indexedDB);
            return implementations.GOOGLE
        }
        else if (window.msIndexedDB)
        {
            window.indexedDB = window.msIndexedDB;
            transactionTypes.READ_ONLY = 0;
            transactionTypes.READ_WRITE = 1;
            transactionTypes.VERSION_CHANGE = 2;
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "IE10+ Initialized", window.indexedDB);
            return implementations.MICROSOFT
        }
        else if (navigator.appName == 'Microsoft Internet Explorer')
        {
            try
            {
                window.indexedDB = new ActiveXObject("SQLCE.Factory.4.0");
                window.indexedDBSync = new ActiveXObject("SQLCE.FactorySync.4.0")
            }
            catch(ex)
            {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Initializing IE prototype exception", ex)
            }
            if (window.JSON)
            {
                window.indexedDB.json = window.JSON;
                window.indexedDBSync.json = window.JSON
            }
            else
            {
                var jsonObject = {parse: function(txt)
                        {
                            if (txt === "[]")
                                return [];
                            if (txt === "{}")
                                return {};
                            throw{message: "Unrecognized JSON to parse: " + txt};
                        }};
                window.indexedDB.json = jsonObject;
                window.indexedDBSync.json = jsonObject
            }
            window.IDBDatabaseException = {
                UNKNOWN_ERR: 0, NON_TRANSIENT_ERR: 1, NOT_FOUND_ERR: 2, CONSTRAINT_ERR: 3, DATA_ERR: 4, NOT_ALLOWED_ERR: 5, SERIAL_ERR: 11, RECOVERABLE_ERR: 21, TRANSIENT_ERR: 31, TIMEOUT_ERR: 32, DEADLOCK_ERR: 33
            };
            window.IDBKeyRange = {
                SINGLE: 0, LEFT_OPEN: 1, RIGHT_OPEN: 2, LEFT_BOUND: 4, RIGHT_BOUND: 8
            };
            window.IDBRequest = {
                INITIAL: 0, LOADING: 1, DONE: 2
            };
            window.IDBTransaction = {
                READ_ONLY: 0, READ_WRITE: 1, VERSION_CHANGE: 2
            };
            transactionTypes.READ_ONLY = 0;
            transactionTypes.READ_WRITE = 1;
            transactionTypes.VERSION_CHANGE = 2;
            window.IDBKeyRange.only = function(value)
            {
                return window.indexedDB.range.only(value)
            };
            window.IDBKeyRange.leftBound = function(bound, open)
            {
                return window.indexedDB.range.lowerBound(bound, open)
            };
            window.IDBKeyRange.rightBound = function(bound, open)
            {
                return window.indexedDB.range.upperBound(bound, open)
            };
            window.IDBKeyRange.bound = function(left, right, openLeft, openRight)
            {
                return window.indexedDB.range.bound(left, right, openLeft, openRight)
            };
            window.IDBKeyRange.lowerBound = function(left, openLeft)
            {
                return window.IDBKeyRange.leftBound(left, openLeft)
            };
            return implementations.MICROSOFTPROTOTYPE
        }
        else
        {
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Your browser doesn't support indexedDB.");
            return implementations.NONE
        }
    }
    {};
    function deferredHandler(handler, request)
    {
        return linq2indexedDB.promises.promise(function(pw)
            {
                try
                {
                    handler(pw, request)
                }
                catch(e)
                {
                    e.type = "exception";
                    pw.error(request, [e.message, e])
                }
                finally
                {
                    request = null
                }
            })
    }
    {};
    function IDBSuccessHandler(pw, request)
    {
        request.onsuccess = function(e)
        {
            pw.complete(e.target, [e.target.result, e])
        }
    }
    {};
    function IDBErrorHandler(pw, request)
    {
        request.onerror = function(e)
        {
            if (e)
                pw.error(e.target, [e.target.errorCode, e]);
            else
                pw.error(this, [this, this])
        }
    }
    {};
    function IDBAbortHandler(pw, request)
    {
        request.onabort = function(e)
        {
            if (e)
                pw.error(e.target, [e.target.errorCode, e]);
            else
                pw.error(this, [this, this])
        }
    }
    {};
    function IDBVersionChangeHandler(pw, request)
    {
        request.onversionchange = function(e)
        {
            pw.progress(e.target, [e.target.result, e])
        }
    }
    {};
    function IDBCompleteHandler(pw, request)
    {
        request.oncomplete = function(e)
        {
            if (!e)
                pw.complete(this, [this]);
            else
                pw.complete(e.target, [e.target, e])
        }
    }
    {};
    function IDBRequestHandler(pw, request)
    {
        IDBSuccessHandler(pw, request);
        IDBErrorHandler(pw, request)
    }
    {};
    function IDBCursorRequestHandler(pw, request)
    {
        request.onsuccess = function(e)
        {
            if (!e.target.result)
                pw.complete(e.target, [e.target.result, e]);
            else
                pw.progress(e.target, [e.target.result, e])
        };
        IDBErrorHandler(pw, request)
    }
    {};
    function IDBBlockedRequestHandler(pw, request)
    {
        IDBRequestHandler(pw, request);
        request.onblocked = function(e)
        {
            pw.progress(e.target, ["blocked", e])
        }
    }
    {};
    function IDBOpenDbRequestHandler(pw, request)
    {
        IDBBlockedRequestHandler(pw, request);
        request.onupgradeneeded = function(e)
        {
            pw.progress(e.target, [e.target.transaction, e])
        }
    }
    {};
    function IDBDatabaseHandler(pw, database)
    {
        IDBAbortHandler(pw, database);
        IDBErrorHandler(pw, database);
        IDBVersionChangeHandler(pw, database)
    }
    {};
    function IDBTransactionHandler(pw, txn)
    {
        IDBCompleteHandler(pw, txn);
        IDBAbortHandler(pw, txn);
        IDBErrorHandler(pw, txn)
    }
    {};
    linq2indexedDB.core = core
})(win, linq2indexedDB, typeof Windows !== "undefined");
(function(linq2indexedDB)
{
    function dbContext(name, configuration, enableDebugging)
    {
        var dbConfig = {autoGenerateAllowed: true};
        if (name)
            dbConfig.name = name;
        if (configuration)
        {
            if (configuration.version)
                dbConfig.version = configuration.version;
            if (configuration.schema)
            {
                var appVersion = dbConfig.version || -1;
                for (var key in configuration.schema)
                    if (!isNaN(key))
                        appVersion = dbConfig.version > key ? dbConfig.version : key;
                if (appVersion > -1)
                {
                    dbConfig.autoGenerateAllowed = false;
                    dbConfig.version = appVersion;
                    dbConfig.schema = configuration.schema
                }
            }
            if (configuration.definition)
            {
                dbConfig.autoGenerateAllowed = false;
                dbConfig.definition = configuration.definition
            }
            if (configuration.onupgradeneeded)
            {
                dbConfig.autoGenerateAllowed = false;
                dbConfig.onupgradeneeded = configuration.onupgradeneeded
            }
            if (configuration.oninitializeversion)
            {
                dbConfig.autoGenerateAllowed = false;
                dbConfig.oninitializeversion = configuration.oninitializeversion
            }
        }
        Object.defineProperty(this, "dbConfig", {
            value: dbConfig, writable: false
        });
        linq2indexedDB.logging.debug(enableDebugging);
        this.initialize();
        this.viewer = viewer(dbConfig)
    }
    dbContext.prototype = function()
    {
        var queryBuilderObj = function(objectStoreName, dbConfig)
            {
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
                this.dbConfig = dbConfig
            };
        queryBuilderObj.prototype = {executeQuery: function()
            {
                executeQuery(this)
            }};
        function from(objectStoreName)
        {
            var self = this;
            return {
                    where: function(filter)
                    {
                        return where(new queryBuilderObj(objectStoreName, self.dbConfig), filter, true, false)
                    }, orderBy: function(propertyName)
                        {
                            return orderBy(new queryBuilderObj(objectStoreName, self.dbConfig), propertyName, false)
                        }, orderByDesc: function(propertyName)
                        {
                            return orderBy(new queryBuilderObj(objectStoreName, self.dbConfig), propertyName, true)
                        }, select: function(propertyNames)
                        {
                            return select(new queryBuilderObj(objectStoreName, self.dbConfig), propertyNames)
                        }, insert: function(data, key)
                        {
                            return insert(new queryBuilderObj(objectStoreName, self.dbConfig), data, key)
                        }, update: function(data, key)
                        {
                            return update(new queryBuilderObj(objectStoreName, self.dbConfig), data, key)
                        }, merge: function(data, key)
                        {
                            return merge(new queryBuilderObj(objectStoreName, self.dbConfig), data, key)
                        }, remove: function(key)
                        {
                            return remove(new queryBuilderObj(objectStoreName, self.dbConfig), key)
                        }, clear: function()
                        {
                            return clear(new queryBuilderObj(objectStoreName, self.dbConfig))
                        }, get: function(key)
                        {
                            return get(new queryBuilderObj(objectStoreName, self.dbConfig), key)
                        }
                }
        }
        function where(queryBuilder, filter, isAndClause, isOrClause, isNotClause)
        {
            var whereClauses = {};
            var filterMetaData;
            if (isNotClause === "undefined")
                whereClauses.not = function()
                {
                    return where(queryBuilder, filter, isAndClause, isOrClause, true)
                };
            if (typeof filter === "function")
            {
                filterMetaData = {
                    propertyName: filter, isOrClause: isOrClause, isAndClause: isAndClause, isNotClause: (isNotClause === "undefined" ? false : isNotClause), filter: linq2indexedDB.linq.createFilter("anonymous" + queryBuilder.where.length, filter, null)
                };
                return whereClause(queryBuilder, filterMetaData)
            }
            else if (typeof filter === "string")
                for (var filterName in linq2indexedDB.linq.filters)
                {
                    filterMetaData = {
                        propertyName: filter, isOrClause: isOrClause, isAndClause: isAndClause, isNotClause: (typeof isNotClause === "undefined" ? false : isNotClause), filter: linq2indexedDB.linq.filters[filterName]
                    };
                    if (typeof linq2indexedDB.linq.filters[filterName].filter !== "function")
                        throw"Linq2IndexedDB: a filter methods needs to be provided for the filter '" + filterName + "'";
                    if (typeof linq2indexedDB.linq.filters[filterName].name === "undefined")
                        throw"Linq2IndexedDB: a filter name needs to be provided for the filter '" + filterName + "'";
                    whereClauses[linq2indexedDB.linq.filters[filterName].name] = linq2indexedDB.linq.filters[filterName].filter(whereClause, queryBuilder, filterMetaData)
                }
            return whereClauses
        }
        function whereClause(queryBuilder, filterMetaData)
        {
            queryBuilder.where.push(filterMetaData);
            return {
                    and: function(filter)
                    {
                        return where(queryBuilder, filter, true, false)
                    }, or: function(filter)
                        {
                            return where(queryBuilder, filter, false, true)
                        }, orderBy: function(propertyName)
                        {
                            return orderBy(queryBuilder, propertyName, false)
                        }, orderByDesc: function(propertyName)
                        {
                            return orderBy(queryBuilder, propertyName, true)
                        }, select: function(propertyNames)
                        {
                            return select(queryBuilder, propertyNames)
                        }, remove: function()
                        {
                            return remove(queryBuilder)
                        }, merge: function(data)
                        {
                            return merge(queryBuilder, data)
                        }
                }
        }
        function orderBy(queryBuilder, propName, descending)
        {
            queryBuilder.sortClauses.push({
                propertyName: propName, descending: descending
            });
            return {
                    orderBy: function(propertyName)
                    {
                        return orderBy(queryBuilder, propertyName, false)
                    }, orderByDesc: function(propertyName)
                        {
                            return orderBy(queryBuilder, propertyName, true)
                        }, select: function(propertyNames)
                        {
                            return select(queryBuilder, propertyNames)
                        }
                }
        }
        function select(queryBuilder, propertyNames)
        {
            if (propertyNames)
            {
                if (!linq2indexedDB.util.isArray(propertyNames))
                    propertyNames = [propertyNames];
                for (var i = 0; i < propertyNames.length; i++)
                    queryBuilder.select.push(propertyNames[i])
            }
            return linq2indexedDB.promises.promise(function(pw)
                {
                    var returnData = [];
                    executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, executeWhere).then(function()
                    {
                        pw.complete(this, returnData)
                    }, pw.error, function(args)
                    {
                        var obj = selectData(args[0].data, queryBuilder.select);
                        returnData.push(obj);
                        pw.progress(this, obj)
                    })
                })
        }
        function insert(queryBuilder, data, key)
        {
            queryBuilder.insert.push({
                data: data, key: key
            });
            return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function(qb, pw, transaction)
                {
                    var objectStorePromis = linq2indexedDB.core.objectStore(transaction, qb.from);
                    if (linq2indexedDB.util.isArray(qb.insert[0].data) && !qb.insert[0].key)
                    {
                        var returnData = [];
                        for (var i = 0; i < qb.insert[0].data.length; i++)
                            linq2indexedDB.core.insert(objectStorePromis, qb.insert[0].data[i]).then(function(args)
                            {
                                pw.progress(this, {
                                    object: args[0], key: args[1]
                                });
                                returnData.push({
                                    object: args[0], key: args[1]
                                });
                                if (returnData.length == qb.insert[0].data.length)
                                    pw.complete(this, returnData)
                            }, pw.error)
                    }
                    else
                        linq2indexedDB.core.insert(objectStorePromis, qb.insert[0].data, qb.insert[0].key).then(function(args)
                        {
                            pw.complete(this, {
                                object: args[0], key: args[1]
                            })
                        }, pw.error)
                })
        }
        function update(queryBuilder, data, key)
        {
            queryBuilder.update.push({
                data: data, key: key
            });
            return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function(qb, pw, transaction)
                {
                    linq2indexedDB.core.update(linq2indexedDB.core.objectStore(transaction, qb.from), qb.update[0].data, qb.update[0].key).then(function(args)
                    {
                        pw.complete(this, {
                            object: args[0], key: args[1]
                        })
                    }, pw.error)
                })
        }
        function merge(queryBuilder, data, key)
        {
            queryBuilder.merge.push({
                data: data, key: key
            });
            if (key)
                return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function(qb, pw, transaction)
                    {
                        var objectStore = linq2indexedDB.core.objectStore(transaction, qb.from);
                        var obj = null;
                        linq2indexedDB.core.cursor(objectStore, linq2indexedDB.core.IDBKeyRange.only(qb.merge[0].key)).then(function(){}, pw.error, function(args)
                        {
                            obj = args[0].data;
                            for (var prop in qb.merge[0].data)
                                obj[prop] = qb.merge[0].data[prop];
                            args[0].update(obj);
                            pw.complete(this, obj)
                        }, pw.error)
                    });
            else
            {
                var returnData = [];
                return linq2indexedDB.promises.promise(function(pw)
                    {
                        executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, executeWhere).then(function(args)
                        {
                            if (returnData.length > 0)
                                pw.complete(this, returnData);
                            else
                                executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function(qb, promise, transaction)
                                {
                                    linq2indexedDB.core.objectStore(transaction, qb.from).then(function(objectStoreArgs)
                                    {
                                        for (var i = 0; i < args.length; i++)
                                        {
                                            var obj = args[i];
                                            for (var prop in queryBuilder.merge[0].data)
                                                obj[prop] = queryBuilder.merge[0].data[prop];
                                            linq2indexedDB.core.update(objectStoreArgs[1], obj).then(function(args1)
                                            {
                                                pw.progress(this, args1[0]);
                                                returnData.push(args1[0]);
                                                if (returnData.length == args.length)
                                                    promise.complete(this, returnData)
                                            }, promise.error)
                                        }
                                    }, promise.error)
                                }).then(pw.complete, pw.error, pw.progress)
                        }, null, function(args)
                        {
                            if (args[0].update)
                            {
                                var obj = args[0].data;
                                for (var prop in queryBuilder.merge[0].data)
                                    obj[prop] = queryBuilder.merge[0].data[prop];
                                args[0].update(obj);
                                pw.progress(this, obj);
                                returnData.push(obj)
                            }
                        })
                    })
            }
        }
        function remove(queryBuilder, key)
        {
            if (key)
            {
                queryBuilder.remove.push({key: key});
                return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function(qb, pw, transaction)
                    {
                        linq2indexedDB.core.remove(linq2indexedDB.core.objectStore(transaction, qb.from), qb.remove[0].key).then(function()
                        {
                            pw.complete(this, queryBuilder.remove[0].key)
                        }, pw.error)
                    })
            }
            else
            {
                var cursorDelete = false;
                return linq2indexedDB.promises.promise(function(pw)
                    {
                        executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, executeWhere).then(function(data)
                        {
                            if (cursorDelete)
                                pw.complete(this);
                            else
                                executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function(qb, promise, transaction)
                                {
                                    linq2indexedDB.core.objectStore(transaction, qb.from).then(function(objectStoreArgs)
                                    {
                                        var itemsDeleted = 0;
                                        for (var i = 0; i < data.length; i++)
                                            linq2indexedDB.core.remove(objectStoreArgs[1], linq2indexedDB.json.getPropertyValue(data[i], objectStoreArgs[1].keyPath)).then(function(args1)
                                            {
                                                pw.progress(this, args1[0]);
                                                if (++itemsDeleted == data.length)
                                                    promise.complete(this)
                                            }, promise.error)
                                    }, promise.error)
                                }).then(pw.complete, pw.error, pw.progress)
                        }, null, function(args)
                        {
                            if (args[0].remove)
                            {
                                args[0].remove();
                                pw.progress(this);
                                cursorDelete = true
                            }
                        })
                    })
            }
        }
        function clear(queryBuilder)
        {
            queryBuilder.clear = true;
            return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_WRITE, function(qb, pw, transaction)
                {
                    linq2indexedDB.core.clear(linq2indexedDB.core.objectStore(transaction, qb.from)).then(function()
                    {
                        pw.complete(this)
                    }, pw.error)
                })
        }
        function get(queryBuilder, key)
        {
            queryBuilder.get.push({key: key});
            return executeQuery(queryBuilder, linq2indexedDB.core.transactionTypes.READ_ONLY, function(qb, pw, transaction)
                {
                    linq2indexedDB.core.get(linq2indexedDB.core.objectStore(transaction, qb.from), qb.get[0].key).then(function(args)
                    {
                        pw.complete(this, args[0])
                    }, pw.error)
                })
        }
        function executeQuery(queryBuilder, transactionType, callBack)
        {
            return linq2indexedDB.promises.promise(function(pw)
                {
                    linq2indexedDB.core.db(queryBuilder.dbConfig.name, queryBuilder.dbConfig.version).then(function(args)
                    {
                        linq2indexedDB.core.transaction(args[0], queryBuilder.from, transactionType, queryBuilder.dbConfig.autoGenerateAllowed).then(function(transactionArgs)
                        {
                            var txn = transactionArgs[0];
                            linq2indexedDB.core.closeDatabaseConnection(txn)
                        }, pw.error, function(transactionArgs)
                        {
                            callBack(queryBuilder, pw, transactionArgs[0])
                        })
                    }, pw.error, function(args)
                    {
                        var txn = args[0];
                        var e = args[1];
                        if (e.type == "upgradeneeded")
                            upgradeDatabase(queryBuilder.dbConfig, e.oldVersion, e.newVersion, txn)
                    })
                })
        }
        function executeWhere(queryBuilder, pw, transaction)
        {
            linq2indexedDB.core.objectStore(transaction, queryBuilder.from).then(function(objArgs)
            {
                try
                {
                    var objectStore = objArgs[1];
                    var whereClauses = queryBuilder.where || [];
                    var returnData = [];
                    var cursorPromise = determineCursor(objectStore, whereClauses, queryBuilder.dbConfig);
                    cursorPromise.then(function(args1)
                    {
                        var data = args1[0];
                        linq2indexedDB.workers.worker(data, whereClauses, queryBuilder.sortClauses).then(function(d)
                        {
                            if (returnData.length == 0)
                                for (var j = 0; j < d.length; j++)
                                    pw.progress(this, [d[j]]);
                            pw.complete(this, d)
                        })
                    }, pw.error, function(args1)
                    {
                        if (whereClauses.length == 0 && queryBuilder.sortClauses.length == 0)
                        {
                            returnData.push({
                                data: args1[0].data, key: args1[0].key
                            });
                            pw.progress(this, args1)
                        }
                    })
                }
                catch(ex)
                {
                    linq2indexedDB.core.abortTransaction(objArgs[0]);
                    pw.error(this, [ex.message, ex])
                }
            }, pw.error)
        }
        function determineCursor(objectStore, whereClauses, dbConfig)
        {
            var cursorPromise;
            if (whereClauses.length > 0 && !whereClauses[0].isNotClause && whereClauses[0].filter.indexeddbFilter && (whereClauses.length == 1 || (whereClauses.length > 1 && !whereClauses[1].isOrClause)))
            {
                var source = objectStore;
                var indexPossible = dbConfig.autoGenerateAllowed || objectStore.indexNames.contains(whereClauses[0].propertyName + linq2indexedDB.core.indexSuffix);
                if (whereClauses[0].propertyName != objectStore.keyPath && indexPossible)
                    source = linq2indexedDB.core.index(objectStore, whereClauses[0].propertyName, dbConfig.autoGenerateAllowed);
                if (whereClauses[0].propertyName == objectStore.keyPath || indexPossible)
                {
                    var clause = whereClauses.shift();
                    switch (clause.filter)
                    {
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
                            break
                    }
                }
                else
                    cursorPromise = linq2indexedDB.core.cursor(source)
            }
            else
                cursorPromise = linq2indexedDB.core.cursor(objectStore);
            return cursorPromise
        }
        function selectData(data, propertyNames)
        {
            if (propertyNames && propertyNames.length > 0)
            {
                if (!linq2indexedDB.util.isArray(propertyNames))
                    propertyNames = [propertyNames];
                var obj = new Object;
                for (var i = 0; i < propertyNames.length; i++)
                    linq2indexedDB.json.setPropertyValue(obj, propertyNames[i], linq2indexedDB.json.getPropertyValue(data, propertyNames[i]));
                return obj
            }
            return data
        }
        function initialize()
        {
            var self = this;
            var dbConfig = self.dbConfig;
            if (typeof(dbConfig.definition) !== "undefined")
            {
                var definitions = dbConfig.definition.sort(linq2indexedDB.json.comparer("version", false).sort);
                for (var i = 0; i < definitions.length; i++)
                {
                    var def = definitions[i];
                    for (var j = 0; j < def.objectStores.length; j++)
                    {
                        var objStore = def.objectStores[j];
                        if (objStore.remove)
                            self[objStore.name] = undefined;
                        else
                            self[objStore.name] = self.from(objStore.name)
                    }
                }
            }
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Initialize Started");
            return linq2indexedDB.promises.promise(function(pw)
                {
                    linq2indexedDB.core.db(dbConfig.name, dbConfig.version).then(function(args)
                    {
                        var db = args[0];
                        for (var k = 0; k < db.objectStoreNames.length; k++)
                        {
                            var name = db.objectStoreNames[k];
                            self[name] = self.from(name)
                        }
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Close dbconnection");
                        db.close();
                        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Initialize Succesfull");
                        pw.complete()
                    }, pw.error, function(args)
                    {
                        var txn = args[0];
                        var e = args[1];
                        if (e.type == "upgradeneeded")
                            upgradeDatabase(dbConfig, e.oldVersion, e.newVersion, txn)
                    })
                })
        }
        function deleteDatabase()
        {
            var dbConfig = this.dbConfig;
            return linq2indexedDB.promises.promise(function(pw)
                {
                    linq2indexedDB.core.deleteDb(dbConfig.name).then(function()
                    {
                        pw.complete()
                    }, pw.error)
                })
        }
        var returnObj = {
                deleteDatabase: deleteDatabase, initialize: initialize, from: from
            };
        return returnObj
    }();
    function viewer(dbConfig)
    {
        var dbView = {};
        var refresh = true;
        function refreshInternal()
        {
            if (refresh)
            {
                refresh = false;
                getDbInformation(dbView, dbConfig)
            }
        }
        dbView.Configuration = {
            name: dbConfig.name, version: dbConfig.version, autoGenerateAllowed: dbConfig.autoGenerateAllowed, schema: dbConfig.schema, definition: dbConfig.definition, onupgradeneeded: dbConfig.onupgradeneeded, oninitializeversion: dbConfig.oninitializeversion
        };
        dbView.refresh = function()
        {
            refresh = true;
            refreshInternal()
        };
        linq2indexedDB.core.dbStructureChanged.addListener(linq2indexedDB.core.databaseEvents.databaseUpgrade, function()
        {
            refresh = true
        });
        linq2indexedDB.core.dbStructureChanged.addListener(linq2indexedDB.core.databaseEvents.databaseOpened, function()
        {
            refreshInternal()
        });
        linq2indexedDB.core.dbStructureChanged.addListener(linq2indexedDB.core.databaseEvents.databaseRemoved, function()
        {
            dbView.name = null;
            dbView.version = null;
            dbView.ObjectStores = []
        });
        linq2indexedDB.core.dbDataChanged.addListener([linq2indexedDB.core.dataEvents.dataInserted, linq2indexedDB.core.dataEvents.dataRemoved, linq2indexedDB.core.dataEvents.dataUpdated, linq2indexedDB.core.dataEvents.objectStoreCleared], function()
        {
            dbView.refresh()
        });
        return dbView
    }
    function getDbInformation(dbView, dbConfig)
    {
        linq2indexedDB.core.db(dbConfig.name).then(function()
        {
            var connection = arguments[0][0];
            dbView.name = connection.name;
            dbView.version = connection.version;
            dbView.ObjectStores = [];
            linq2indexedDB.core.dbStructureChanged.addListener(linq2indexedDB.core.databaseEvents.databaseBlocked, function()
            {
                linq2indexedDB.core.closeDatabaseConnection(connection)
            });
            var objectStoreNames = [];
            for (var k = 0; k < connection.objectStoreNames.length; k++)
                objectStoreNames.push(connection.objectStoreNames[k]);
            if (objectStoreNames.length > 0)
                linq2indexedDB.core.transaction(connection, objectStoreNames, linq2indexedDB.core.transactionTypes.READ_ONLY, false).then(null, null, function()
                {
                    var transaction = arguments[0][0];
                    for (var i = 0; i < connection.objectStoreNames.length; i++)
                        linq2indexedDB.core.objectStore(transaction, connection.objectStoreNames[i]).then(function()
                        {
                            var objectStore = arguments[0][1];
                            var indexes = [];
                            var objectStoreData = [];
                            for (var j = 0; j < objectStore.indexNames.length; j++)
                                linq2indexedDB.core.index(objectStore, objectStore.indexNames[j], false).then(function()
                                {
                                    var index = arguments[0][1];
                                    var indexData = [];
                                    linq2indexedDB.core.cursor(index).then(null, null, function()
                                    {
                                        var data = arguments[0][0];
                                        var key = arguments[0][1].primaryKey;
                                        indexData.push({
                                            key: key, data: data
                                        })
                                    });
                                    indexes.push({
                                        name: index.name, keyPath: index.keyPath, multiEntry: index.multiEntry, data: indexData
                                    })
                                });
                            linq2indexedDB.core.cursor(objectStore).then(null, null, function()
                            {
                                var data = arguments[0][0];
                                var key = arguments[0][1].primaryKey;
                                objectStoreData.push({
                                    key: key, data: data
                                })
                            });
                            dbView.ObjectStores.push({
                                name: objectStore.name, keyPath: objectStore.keyPath, autoIncrement: objectStore.autoIncrement, indexes: indexes, data: objectStoreData
                            })
                        })
                })
        }, null, function(args)
        {
            if (args[1].type == "upgradeneeded")
                linq2indexedDB.core.abortTransaction(args[0])
        })
    }
    function getVersionDefinition(version, definitions)
    {
        var result = null;
        for (var i = 0; i < definitions.length; i++)
            if (parseInt(definitions[i].version) == parseInt(version))
                result = definitions[i];
        return result
    }
    function initializeVersion(txn, definition)
    {
        try
        {
            if (definition.objectStores)
                for (var i = 0; i < definition.objectStores.length; i++)
                {
                    var objectStoreDefinition = definition.objectStores[i];
                    if (objectStoreDefinition.remove)
                        linq2indexedDB.core.deleteObjectStore(txn, objectStoreDefinition.name);
                    else
                        linq2indexedDB.core.createObjectStore(txn, objectStoreDefinition.name, objectStoreDefinition.objectStoreOptions)
                }
            if (definition.indexes)
                for (var j = 0; j < definition.indexes.length; j++)
                {
                    var indexDefinition = definition.indexes[j];
                    if (indexDefinition.remove)
                        linq2indexedDB.core.deleteIndex(linq2indexedDB.core.objectStore(txn, indexDefinition.objectStoreName), indexDefinition.propertyName);
                    else
                        linq2indexedDB.core.createIndex(linq2indexedDB.core.objectStore(txn, indexDefinition.objectStoreName), indexDefinition.propertyName, indexDefinition.indexOptions)
                }
            if (definition.defaultData)
                for (var k = 0; k < definition.defaultData.length; k++)
                {
                    var defaultDataDefinition = definition.defaultData[k];
                    if (defaultDataDefinition.remove)
                        linq2indexedDB.core.remove(linq2indexedDB.core.objectStore(txn, defaultDataDefinition.objectStoreName), defaultDataDefinition.key);
                    else
                        linq2indexedDB.core.update(linq2indexedDB.core.objectStore(txn, defaultDataDefinition.objectStoreName), defaultDataDefinition.data, defaultDataDefinition.key)
                }
        }
        catch(ex)
        {
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.exception, "initialize version exception: ", ex);
            linq2indexedDB.core.abortTransaction(txn)
        }
    }
    function upgradeDatabase(dbConfig, oldVersion, newVersion, txn)
    {
        if (dbConfig.onupgradeneeded)
            dbConfig.onupgradeneeded(txn, oldVersion, newVersion);
        if (dbConfig.oninitializeversion || dbConfig.schema || dbConfig.definition)
            for (var version = oldVersion + 1; version <= newVersion; version++)
            {
                if (dbConfig.schema)
                    dbConfig.schema[version](txn);
                if (dbConfig.definition)
                {
                    var versionDefinition = getVersionDefinition(version, dbConfig.definition);
                    if (versionDefinition)
                        initializeVersion(txn, versionDefinition)
                }
                else if (dbConfig.oninitializeversion)
                    dbConfig.oninitializeversion(txn, version)
            }
    }
    linq2indexedDB.DbContext = dbContext
})(linq2indexedDB);
(function(linq2indexedDB)
{
    var filters = {};
    var equalsFilter = createFilter("equals", true, 0, function(data, filter)
        {
            return linq2indexedDB.json.getPropertyValue(data, filter.propertyName) == filter.value
        }, function(callback, queryBuilder, filterMetaData)
        {
            return function(value)
                {
                    if (typeof(value) === "undefined")
                        throw"linq2indexedDB: value needs to be provided to the equal clause";
                    filterMetaData.value = value;
                    return callback(queryBuilder, filterMetaData)
                }
        });
    var betweenFilter = createFilter("between", true, 1, function(data, filter)
        {
            var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
            return (value > filter.minValue || (filter.minValueIncluded && value == filter.minValue)) && (value < filter.maxValue || (filter.maxValueIncluded && value == filter.maxValue))
        }, function(callback, queryBuilder, filterMetaData)
        {
            return function(minValue, maxValue, minValueIncluded, maxValueIncluded)
                {
                    var isMinValueIncluded = typeof(minValueIncluded) === "undefined" ? false : minValueIncluded;
                    var isMasValueIncluded = typeof(maxValueIncluded) === "undefined" ? false : maxValueIncluded;
                    if (typeof(minValue) === "undefined")
                        throw"linq2indexedDB: minValue needs to be provided to the between clause";
                    if (typeof(maxValue) === "undefined")
                        throw"linq2indexedDB: maxValue needs to be provided to the between clause";
                    filterMetaData.minValue = minValue;
                    filterMetaData.maxValue = maxValue;
                    filterMetaData.minValueIncluded = isMinValueIncluded;
                    filterMetaData.maxValueIncluded = isMasValueIncluded;
                    return callback(queryBuilder, filterMetaData)
                }
        });
    var greaterThenFilter = createFilter("greaterThan", true, 2, function(data, filter)
        {
            var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
            return value > filter.value || (filter.valueIncluded && value == filter.value)
        }, function(callback, queryBuilder, filterMetaData)
        {
            return function(value, valueIncluded)
                {
                    if (typeof(value) === "undefined")
                        throw"linq2indexedDB: value needs to be provided to the greatherThan clause";
                    var isValueIncluded = typeof(valueIncluded) === "undefined" ? false : valueIncluded;
                    filterMetaData.value = value;
                    filterMetaData.valueIncluded = isValueIncluded;
                    return callback(queryBuilder, filterMetaData)
                }
        });
    var smallerThanFilter = createFilter("smallerThan", true, 2, function(data, filter)
        {
            var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
            return value < filter.value || (filter.valueIncluded && value == filter.value)
        }, function(callback, queryBuilder, filterMetaData)
        {
            return function(value, valueIncluded)
                {
                    if (typeof(value) === "undefined")
                        throw"linq2indexedDB: value needs to be provided to the smallerThan clause";
                    var isValueIncluded = typeof(valueIncluded) === "undefined" ? false : valueIncluded;
                    filterMetaData.value = value;
                    filterMetaData.valueIncluded = isValueIncluded;
                    return callback(queryBuilder, filterMetaData)
                }
        });
    var inArrayFilter = createFilter("inArray", false, 3, function(data, filter)
        {
            var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
            if (value)
                return filter.value.indexOf(value) >= 0;
            else
                return false
        }, function(callback, queryBuilder, filterMetaData)
        {
            return function(array)
                {
                    if (typeof(array) === "undefined" || array.push === "undefined")
                        throw"linq2indexedDB: array needs to be provided to the inArray clause";
                    filterMetaData.value = array;
                    return callback(queryBuilder, filterMetaData)
                }
        });
    var likeFilter = createFilter("like", false, 4, function(data, filter)
        {
            var value = linq2indexedDB.json.getPropertyValue(data, filter.propertyName);
            if (value)
                return value.indexOf(filter.value) >= 0;
            else
                return false
        }, function(callback, queryBuilder, filterMetaData)
        {
            return function(value)
                {
                    if (typeof(value) === "undefined")
                        throw"linq2indexedDB: value needs to be provided to the like clause";
                    filterMetaData.value = value;
                    return callback(queryBuilder, filterMetaData)
                }
        });
    var isUndefinedFilter = createFilter("isUndefined", false, 5, function(data, filter)
        {
            return linq2indexedDB.json.getPropertyValue(data, filter.propertyName) === undefined
        }, function(callback, queryBuilder, filterMetaData)
        {
            return function()
                {
                    return callback(queryBuilder, filterMetaData)
                }
        });
    function createFilter(name, indexeddbFilter, sortOrder, isValid, filterCallback)
    {
        if (typeof name === 'undefined')
            throw"linq2IndexedDB: No name argument provided to the addFilter method.";
        if (typeof name !== 'string')
            throw"linq2IndexedDB: The name argument provided to the addFilterObject method must be a string.";
        if (typeof isValid === 'undefined')
            throw"linq2IndexedDB: No isValid argument provided to the addFilter method.";
        if (typeof isValid !== 'function')
            throw"linq2IndexedDB: The isValid argument provided to the addFilterObject method must be a function.";
        if (typeof filterCallback === 'undefined')
            throw"linq2IndexedDB: No filterCallback argument provided to the addFilter method.";
        return {
                name: name, indexeddbFilter: indexeddbFilter, sortOrder: sortOrder, isValid: isValid, filter: filterCallback
            }
    }
    function addFilter(filter)
    {
        if (typeof(filters[filter.name]) !== 'undefined')
            throw"linq2IndexedDB: A filter with the name '" + filter.name + "' already exists.";
        filters[filter.name] = filter
    }
    addFilter(equalsFilter);
    addFilter(betweenFilter);
    addFilter(greaterThenFilter);
    addFilter(smallerThanFilter);
    addFilter(inArrayFilter);
    addFilter(likeFilter);
    addFilter(isUndefinedFilter);
    linq2indexedDB.linq = {
        addFilter: function(name, isValid, filterCallback)
        {
            addFilter(this.createFilter(name, isValid, filterCallback))
        }, createFilter: function(name, isValid, filterCallback)
            {
                return createFilter(name, false, 99, isValid, filterCallback)
            }, filters: filters
    }
})(linq2indexedDB);
(function(window, linq2indexedDB, JSON)
{
    var defaultFileLocationWorker = "";
    if (typeof(window) !== "undefined")
        for (var i = 0; i < window.document.scripts.length; i++)
            if (window.document.scripts[i].src.indexOf("Linq2IndexedDB") > -1)
            {
                defaultFileLocationWorker = window.document.scripts[i].src;
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Worker location set to: ", defaultFileLocationWorker);
                break
            }
    if (typeof(window) === "undefined")
        self.onmessage = function(event)
        {
            var data = event.data.data;
            var filtersString = event.data.filters || "[]";
            var sortClauses = event.data.sortClauses || [];
            var filters = JSON.parse(filtersString, linq2indexedDB.json.deserialize);
            var returnData = filterSort(data, filters, sortClauses);
            postMessage(returnData);
            return
        };
    function worker(data, filters, sortClauses)
    {
        return linq2indexedDB.promises.promise(function(pw)
            {
                if (typeof(window) !== "undefined" && typeof(window.Worker) !== "undefined")
                {
                    var webworker = new Worker(linq2indexedDB.workers.location);
                    webworker.onmessage = function(event)
                    {
                        pw.complete(this, event.data);
                        webworker.terminate()
                    };
                    webworker.onerror = pw.error;
                    var filtersString = JSON.stringify(filters, linq2indexedDB.json.serialize);
                    webworker.postMessage({
                        data: data, filters: filtersString, sortClauses: sortClauses
                    })
                }
                else
                    pw.complete(this, filterSort(data, filters, sortClauses))
            })
    }
    function filterSort(data, filters, sortClauses)
    {
        var returnData = [];
        for (var i = 0; i < data.length; i++)
            if (isDataValid(data[i].data, filters))
                returnData = addToSortedArray(returnData, data[i], sortClauses);
        return returnData
    }
    function isDataValid(data, filters)
    {
        var isValid = true;
        for (var i = 0; i < filters.length; i++)
        {
            var filterValid = filters[i].filter.isValid(data, filters[i]);
            if (filters[i].isNotClause)
                filterValid = !filterValid;
            if (filters[i].isAndClause)
                isValid = isValid && filterValid;
            else if (filters[i].isOrClause)
                isValid = isValid || filterValid
        }
        return isValid
    }
    function addToSortedArray(array, data, sortClauses)
    {
        var newArray = [];
        if (array.length == 0 || sortClauses.length == 0)
        {
            newArray = array;
            newArray.push(data)
        }
        else
        {
            var valueAdded = false;
            for (var i = 0; i < array.length; i++)
            {
                var valueX = array[i].data;
                var valueY = data.data;
                for (var j = 0; j < sortClauses.length; j++)
                {
                    var sortPropvalueX = linq2indexedDB.json.getPropertyValue(valueX, sortClauses[j].propertyName);
                    var sortPropvalueY = linq2indexedDB.json.getPropertyValue(valueY, sortClauses[j].propertyName);
                    if (sortPropvalueX != sortPropvalueY)
                        if ((sortClauses[j].descending && sortPropvalueX > sortPropvalueY) || (!sortClauses[j].descending && sortPropvalueX < sortPropvalueY))
                            newArray.push(array[i]);
                        else
                        {
                            if (!valueAdded)
                            {
                                valueAdded = true;
                                newArray.push(data)
                            }
                            newArray.push(array[i])
                        }
                    else if (j == (sortClauses.length - 1))
                        newArray.push(array[i])
                }
            }
            if (!valueAdded)
                newArray.push(data)
        }
        return newArray
    }
    linq2indexedDB.workers = {
        location: defaultFileLocationWorker, worker: worker
    }
})(win, linq2indexedDB, JSON);