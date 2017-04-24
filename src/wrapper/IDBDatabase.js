import IDBObjectStore from "./IDBObjectStore";
import IDBTransaction from "./IDBTransation";
import IDBTransactionMode from "./IDBTransactionMode";

const zero = 0;

class IDBDatabase {
    constructor(db) {
        this._db = db;
        this._promise = new Promise((resolve, reject) => {
            db.onclose = event => {
                resolve(event);
                if (this.onclose) {
                    this.onclose(event);
                }
            };
            db.onerror = event => {
                reject(event);
                if (this.onerror) {
                    this.onerror(event);
                }
            };
            db.onabort = event => {
                reject(event);
                if (this.onabort) {
                    this.onabort(event);
                }
            };
            db.onversionchange = event => {
                if (this.onversionchange) {
                    this.onversionchange(event);
                }
            };
        });
    }

    get name() {
        return this.originalDb.name;
    }
    get version() {
        return parseInt(this.originalDb.version, 10) || zero;
    }
    get objectStoreNames() {
        return this.originalDb.objectStoreNames;
    }
    get onabort() {
        return this._onabort;
    }
    set onabort(value) {
        this._onabort = value;
    }
    get onclose() {
        return this._onclose;
    }
    set onclose(value) {
        this._onclose = value;
    }
    get onerror() {
        return this._onerror;
    }
    set onerror(value) {
        this._onerror = value;
    }
    get onversionchange() {
        return this._onversionchange;
    }
    set onversionchange(value) {
        this._onversionchange = value;
    }

    get originalDb() {
        return this._db;
    }
    get promise() {
        return this._promise;
    }

    transaction(storenames, mode = IDBTransactionMode.READ_ONLY) {
        return new IDBTransaction(this.originalDb.transaction(storenames, mode));
    }
    close() {
        this.originalDb.close();
    }
    createObjectStore(name,
                      options = {
                          autoIncrement: false,
                          keyPath: null
                      }) {
        // as fallback add autoIncrement option as third parameter
        return new IDBObjectStore(this.originalDb.createObjectStore(name, options, options.autoIncrement));
    }
    deleteObjectStore(name) {
        this.originalDb.deleteObjectStore(name);
    }
}

export default IDBDatabase;
