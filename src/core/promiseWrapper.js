export default class PromiseWrapper {
    static IDBRequest(request){
        return new Promise((resolve, reject) => {
            request.onsuccess = function (e) {
                resolve(e.target.result, e);
            };
            request.onerror = function (e) {
                if (e) {
                    reject(e.target.errorCode, e);
                }
                else {
                    reject(this, this);
                }
            };
        });
    }
    static IDBBlockedRequest(request, onBlockedCallback = () => {}){
        return new Promise((resolve, reject) => {
            request.onsuccess = function (e) {
                resolve(e.target.result, e);
            };
            request.onerror = function (e) {
                if (e) {
                    reject(e.target.errorCode, e);
                }
                else {
                    reject(this, this);
                }
            };
            request.onblocked = function (e) {
                onBlockedCallback(e)
            };
        });
    }
    static IDBOpenDBRequest(request, onUpgradeCallback = () => {}, onBlockedCallback = () => {}){
        return new Promise((resolve, reject) => {
            request.onsuccess = function (e) {
                resolve(e.target.result, e);
            };
            request.onerror = function (e) {
                if (e) {
                    reject(e.target.errorCode, e);
                }
                else {
                    reject(this, this);
                }
            };
            request.onupgradeneeded = function (e) {
                onUpgradeCallback(e.target.transaction, e)
            };
            request.onblocked = function (e) {
                onBlockedCallback(e)
            };
        });
        
    }
    static IDBDatabase(request, onVersionChangedCallback = () => {}){
        return new Promise((resolve, reject) => {
            request.onclose = function (e) {
                // todo review
                resolve(e/*.target.result*/, e);
            };
            request.onerror = function (e) {
                if (e) {
                    reject(e.target.errorCode, e);
                }
                else {
                    reject(this, this);
                }
            };
            request.onabort = function (e) {
                if (e) {
                    reject(e.target.errorCode, e);
                }
                else {
                    reject(this, this);
                }
            };
            request.onversionchange = function (e) {
                onVersionChangedCallback(e.target.result, e);
            };
        });
    }
    static IDBTransaction(request){
        return new Promise((resolve, reject) => {
            request.oncomplete = function (e) {
                if (!e) {
                    reslove(this);
                }
                else {
                    resolve(e.target, e);
                }
            };
            request.onerror = function (e) {
                if (e) {
                    reject(e.target.errorCode, e);
                }
                else {
                    reject(this, this);
                }
            };
            request.onabort = function (e) {
                if (e) {
                    reject(e.target.errorCode, e);
                }
                else {
                    reject(this, this);
                }
            };
        });
    }
    static IDBCursorRequest(request, onResultFoundCallback = () => {}){
        return new Promise((resolve, reject) => {
            request.onsuccess = function (e) {
                if (!e.target.result) {
                    resolve(e.target.result, e);
                } else {
                    onResultFoundCallback(e.target.result, e);
                }
            };
            request.onerror = function (e) {
                if (e) {
                    reject(e.target.errorCode, e);
                }
                else {
                    reject(this, this);
                }
            };
        });
    }
}


/*var handlers = {
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
}

// ReSharper disable InconsistentNaming
function IDBSuccessHandler(pw, request) {
// ReSharper restore InconsistentNaming
    request.onsuccess = function (e) {
        pw.complete(e.target, [e.target.result, e]);
    };
}

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
}

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
}

// ReSharper disable InconsistentNaming
function IDBVersionChangeHandler(pw, request) {
// ReSharper restore InconsistentNaming
    request.onversionchange = function (e) {
        pw.progress(e.target, [e.target.result, e]);
    };
}

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
}

// ReSharper disable InconsistentNaming
function IDBRequestHandler(pw, request) {
// ReSharper restore InconsistentNaming
    new IDBSuccessHandler(pw, request);
    new IDBErrorHandler(pw, request);
}

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
    new IDBErrorHandler(pw, request);
}

// ReSharper disable InconsistentNaming
function IDBBlockedRequestHandler(pw, request) {
// ReSharper restore InconsistentNaming
    new IDBRequestHandler(pw, request);
    request.onblocked = function (e) {
        pw.progress(e.target, ["blocked", e]);
    };
}

// ReSharper disable InconsistentNaming
function IDBOpenDbRequestHandler(pw, request) {
// ReSharper restore InconsistentNaming
    new IDBBlockedRequestHandler(pw, request);
    request.onupgradeneeded = function (e) {
        pw.progress(e.target, [e.target.transaction, e]);
    };
}

// ReSharper disable InconsistentNaming
function IDBDatabaseHandler(pw, database) {
// ReSharper restore InconsistentNaming
    new IDBAbortHandler(pw, database);
    new IDBErrorHandler(pw, database);
    new IDBVersionChangeHandler(pw, database);
}

// ReSharper disable InconsistentNaming
function IDBTransactionHandler(pw, txn) {
// ReSharper restore InconsistentNaming
    new IDBCompleteHandler(pw, txn);
    new IDBAbortHandler(pw, txn);
    new IDBErrorHandler(pw, txn);
}*/