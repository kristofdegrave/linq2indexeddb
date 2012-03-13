(function (window) {
    function EventTarget() {
        this._listeners = {};
    }

    EventTarget.prototype = {
        constructor: EventTarget,
        addListener: function (type, listener) {
            if (typeof this._listeners[type] == "undefined") {
                this._listeners[type] = [];
            }
            this._listeners[type].push(listener);
        },
        fire: function (event) {
            if (typeof event == "string") {
                event = { type: event };
            }
            if (!event.target) {
                event.target = this;
            }
            if (!event.type) {  //falsy
                throw new Error("Event object missing 'type' property.");
            }
            if (this._listeners[event.type] instanceof Array) {
                var listeners = this._listeners[event.type];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].call(this, event);
                }
            }
        },
        removeListener: function (type, listener) {
            if (this._listeners[type] instanceof Array) {
                var listeners = this._listeners[type];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i] === listener) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
        }
    };

    var indexedDBAdapter = function (enableLogging) {
        var events = {
            onConnected: "onConnected",
            onDatabaseOpenError: "onDatabaseOpenError",
            onVersionChanged: "onVersionChanged",
            onDatabaseOpenBlocked: "onDatabaseOpenBlocked",
            onUpgradeNeeded: "onUpgradeNeeded"
        },
        eventListeners = EventTarget(),
        implementations = {
            NONE: 0,
            NATIVE: 1,
            MICROSOFT: 2,
            MOZILLA: 3,
            GOOGLE: 4
        },
        log = function () {
            if (typeof (window.console) === undefined || !enableLogging) {
                return false;
            }
            return window.console.log.apply(console, arguments);
        },
        implementation = initializeIndexedDB(),
        defaultDatabaseName = "Default"

        return {
            db: function (name, version) {
                var request;
                name = name ? name : defaultDatabaseName;

                // Creating a new database conection
                if (version) {
                    log("db opening without version", name, version);
                    request = window.indexedDB.open(name, version);
                }
                else {
                    log("db opening with version", dbName);
                    request = window.indexedDB.open(name);
                }

                request.onsuccess = function (e) {
                    var db = request.result;

                    db.onversionchange = function (event) {
                        // Database version changed.
                        var versionChangedEvent = {
                            type: events.onVersionChanged,
                            target: db,
                            innerEvent: event
                        };

                        log("DB version changed", versionChangedEvent);
                        eventListeners.fire(versionChangedEvent);
                    }

                    var currentVersion = GetDatabaseVersion(db);
                    if (currentVersion < version || (version == -1)) {
                        var upgradeRequest = db.setVersion(version);

                        upgradeRequest.onsuccess = function (event) {
                            var txn = upgradeRequest.result

                            txn.oncomplete = function (event) {
                                closeDatabaseConnection(txn.db);
                                // Not sure if this will work.
                                // Reconnect is necessary to work with the lates version.
                                indexedDBAdapter(enableLogging).db(name, version);
                            }

                            // Database connection upgradeneeded.
                            var upgradeEvent = {
                                type: events.onUpgradeNeeded,
                                target: upgradeRequest,
                                innerEvent: event,
                                db: txn.db,
                                oldVersion: version,
                                newVersion: currentVersion
                            };

                            log("DB connection upgradeneeded", upgradeEvent);
                            eventListeners.fire(upgradeEvent);
                        }

                        upgradeRequest.onerror = function (event) {
                            // Database connection error.
                            var errorEvent = {
                                type: events.onDatabaseOpenError,
                                target: upgradeRequest,
                                innerEvent: event,
                                error: upgradeRequest.errorCode
                            };

                            log("DB upgrade error", errorEvent);
                            eventListeners.fire(errorEvent);
                        };

                        upgradeRequest.onblocked = function (event) {
                            // Database connection blocked.
                            var blockedEvent = {
                                type: events.onDatabaseOpenBlocked,
                                target: upgradeRequest,
                                innerEvent: event
                            };

                            log("DB connection blocked", blockedEvent);
                            eventListeners.fire(blockedEvent);
                        };

                        // Current version deferres from the requested version, database upgrade needed
                        log("DB connection upgradeneeded", this, db, e, db.connectionId);

                        //versionChangePromise.then(function (txn, event) {
                        //    // When the new version is initialized, close the db connection, and make a new connection.
                        //    closeDatabaseConnection(txn.db);
                        //    linq2indexedDB.core.db(name).then(function (dbConnection, ev) {
                        //        // Connection resolved
                        //        dfd.resolveWith(this, [dbConnection, ev])
                        //    },
                        //        function (err, ev) {
                        //            // Database connection error or abort
                        //            dfd.rejectWith(this, [err, ev]);
                        //        },
                        //        function (dbConnection, ev) {
                        //            // Database upgrade
                        //            dfd.notifyWith(this, [dbConnection, ev]);
                        //        });
                        //},
                        //    function (err, event) {
                        //        // txn error or abort
                        //        dfd.rejectWith(this, [err, event]);
                        //    },
                        //    function (txn, event) {
                        //        // txn created
                        //        // Fake the onupgrade event.
                        //        var context = req;
                        //        context.transaction = txn;

                        //        var upgardeEvent = event;
                        //        upgardeEvent.type = "upgradeneeded";
                        //        upgardeEvent.newVersion = version;
                        //        upgardeEvent.oldVersion = currentVersion;

                        //        dfd.notifyWith(context, [txn.db, upgardeEvent]);
                        //    });
                    }
                    else {
                        // Database Connection estabished.
                        var connectedEvent = {
                            type: events.onConnected,
                            target: request,
                            innerEvent: e,
                            db: db
                        };

                        log("DB connection estabished", connectedEvent);
                        eventListeners.fire(connectedEvent);
                    }
                };

                request.onerror = function (e) {
                    // Database connection error.
                    var errorEvent = {
                        type: events.onDatabaseOpenError,
                        target: request,
                        innerEvent: e,
                        error: request.errorCode
                    };

                    log("DB connection error", errorEvent);
                    eventListeners.fire(errorEvent);
                };

                request.onblocked = function (e) {
                    // Database connection blocked.
                    var blockedEvent = {
                        type: events.onDatabaseOpenBlocked,
                        target: request,
                        innerEvent: e
                    };

                    log("DB connection blocked", blockedEvent);
                    eventListeners.fire(blockedEvent);
                };

                request.onupgradeneeded = function (e) {
                    // Database connection upgradeneeded.
                    var upgradeEvent = {
                        type: events.onUpgradeNeeded,
                        target: request,
                        innerEvent: e,
                        db: request.result,
                        oldVersion: e.oldVersion,
                        newVersion: e.newVersion
                    };

                    log("DB connection upgradeneeded", upgradeEvent);
                    eventListeners.fire(upgradeEvent);
                };

                return {
                    onConnected: function (callback) {
                        var connection = this;
                        eventListeners.addListener(events.onConnected, function (e) {
                            callback.call(connection, [e, e.dbConnection]);
                        });
                        return connection;
                    },
                    onError: function (callback) {
                        var connection = this;
                        eventListeners.addListener(events.onDatabaseOpenError, function (e, error) {
                            callback.call(connection, [error, e]);
                        });
                        return connection;
                    },
                    onAbort: function (callback) {
                        var connection = this;
                        eventListeners.addListener(events.onDatabaseOpenAbort, function (e, error) {
                            callback.call(connection, [error, e]);
                        });
                        return connection;
                    },
                    onVersionChanged: function (callback) {
                        var connection = this;
                        eventListeners.addListener(events.onVersionChanged, function (e, dbConnection) {
                            callback.call(connection, [dbConnection, e]);
                        });
                        return connection;
                    },
                    onBlocked: function (callback) {
                        var connection = this;
                        eventListeners.addListener(events.onDatabaseOpenBlocked, function (e, dbConnection) {
                            callback.call(connection, [dbConnection, e]);
                        });
                        return connection;
                    },
                    onUpgradeNeeded: function (callback) {
                        var connection = this;
                        eventListeners.addListener(events.onUpgradeNeeded, function (e, dbConnection) {
                            callback.call(connection, [dbConnection, e]);
                        });
                        return connection;
                    }
                };
            }
        }
    }

    window.indexedDBAdapter = indexedDBAdapter;
})(window);