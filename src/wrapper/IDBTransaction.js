import IDBDatabase from "./IDBDatabase";
import IDBObjectStore from "./IDBObjectStore";
import Log from "./../common/log";

class IDBTransaction {
    constructor(transation, objectStoreNames, db) {
        this._transation = transation;
        this._db = db || new IDBDatabase(transation.db);
        // Not supported in IE & Edge
        this._objectStoreNames = objectStoreNames;
        if (this.mode === "versionchange" && this.db) {
            this._objectStoreNames = this.db.objectStoreNames;
        }
        this._promise = new Promise((resolve, reject) => {
            try {
                transation.oncomplete = event => {
                    Log.debug("IDBTransaction - oncomplete triggered");
                    event.wrappedTarget = this;
                    if (this.oncomplete) {
                        this.oncomplete(event);
                    }
                    resolve(event);
                };
                transation.onerror = event => {
                    Log.debug("IDBTransaction - onerror triggered");
                    event.wrappedTarget = this;
                    if (this.onerror) {
                        this.onerror(event);
                    }
                    reject(event);
                };
                transation.onabort = event => {
                    Log.debug("IDBTransaction - onabort triggered");
                    event.wrappedTarget = this;
                    if (this.onabort) {
                        this.onabort(event);
                    }
                    reject(event);
                };
            } catch (error) {
                Log.error("IDBTransaction - exception", error);
                reject(error);
            }
        });
    }

    get objectStoreNames() {
        if (this._hasObjectStoreNames) {
            return this.originalTransation.objectStoreNames;
        }

        return this._objectStoreNames;
    }
    get mode() {
        return this.originalTransation.mode;
    }
    get db() {
        return this._db; // new IDBDatabase(this.originalTransation.db);
    }
    get error() {
        return this.originalTransation.error;
    }
    get oncomplete() {
        return this._oncomplete;
    }
    set oncomplete(value) {
        Log.debug("IDBTransaction - added oncomplete callback");
        this._oncomplete = value;
    }
    get onerror() {
        return this._onerror;
    }
    set onerror(value) {
        Log.debug("IDBTransaction - added onerror callback");
        this._onerror = value;
    }
    get onabort() {
        return this._onabort;
    }
    set onabort(value) {
        Log.debug("IDBTransaction - added onabort callback");
        this._onabort = value;
    }
    get originalTransation() {
        return this._transation;
    }
    get promise() {
        return this._promise;
    }

    objectStore(name) {
        Log.debug("IDBTransaction - objectStore", name);

        return new IDBObjectStore(this.originalTransation.objectStore(name));
    }
    abort() {
        Log.debug("IDBTransaction - abort");
        this.originalTransation.abort();
    }

    get _hasObjectStoreNames() {
        return this.originalTransation && "objectStoreNames" in this.originalTransation;
    }
}

export default IDBTransaction;
