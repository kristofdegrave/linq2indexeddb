import IDBDatabase from "./IDBDatabase";
import Log from "./../common/log";

class IDBTransaction {
    constructor(transation) {
        this._transation = transation;
        this._db = new IDBDatabase(transation.db);
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
        return this.originalTransation.objectStoreNames;
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
        Log.debug("IDBDatabase - added oncomplete callback");
        this._oncomplete = value;
    }
    get onerror() {
        return this._onerror;
    }
    set onerror(value) {
        Log.debug("IDBDatabase - added onerror callback");
        this._onerror = value;
    }
    get onabort() {
        return this._onabort;
    }
    set onabort(value) {
        Log.debug("IDBDatabase - added onabort callback");
        this._onabort = value;
    }
    get originalTransation() {
        return this._transation;
    }
    get promise() {
        return this._promise;
    }
}

export default IDBTransaction;
