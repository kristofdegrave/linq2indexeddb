import IDBDatabase from "./IDBDatabase";

class IDBTransation {
    constructor(transation) {
        this._transation = transation;
        this._promise = new Promise((resolve, reject) => {
            transation.oncomplete = event => {
                resolve(event);
                if (this.oncomplete) {
                    this.oncomplete(event);
                }
            };
            transation.onerror = event => {
                reject(event);
                if (this.onerror) {
                    this.onerror(event);
                }
            };
            transation.onabort = event => {
                reject(event);
                if (this.onabort) {
                    this.onabort(event);
                }
            };
        });
    }

    get objectStoreNames() {
        return this.originalTransation.objectStoreNames;
    }
    get mode() {
        return this.originalTransation.mode;
    }
    get db() {
        return new IDBDatabase(this.originalTransation.db);
    }
    get error() {
        return this.originalTransation.error;
    }
    get oncomplete() {
        return this._oncomplete;
    }
    set oncomplete(value) {
        this._oncomplete = value;
    }
    get onerror() {
        return this._onerror;
    }
    set onerror(value) {
        this._onerror = value;
    }
    get onabort() {
        return this._onabort;
    }
    set onabort(value) {
        this._onabort = value;
    }
    get originalTransation() {
        return this._transation;
    }
    get promise() {
        return this._promise;
    }
}

export default IDBTransation;
