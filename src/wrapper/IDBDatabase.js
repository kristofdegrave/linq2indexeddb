import IDBObjectStore from "./IDBObjectStore";
import IDBTransaction from "./IDBTransaction";
import IDBTransactionMode from "./IDBTransactionMode";
import Log from "./../common/log";

// const zero = 0;

class IDBDatabase {
    constructor(db) {
        this._db = db;
        this._closeInternal = () => {};

        this._promise = new Promise((resolve, reject) => {
            try {
                this._closeInternal = () => {
                    resolve(this);
                };
                db.onerror = event => {
                    Log.debug("IDBDatabase - onerror triggered");
                    event.wrappedTarget = this;
                    if (this.onerror) {
                        this.onerror(event);
                    }
                    reject(event);
                };
                if (this._hasOnclose) {
                    db.onclose = event => {
                        Log.debug("IDBDatabase - onclose triggered");
                        event.wrappedTarget = this;
                        if (this.onclose) {
                            this.onclose(event);
                        }
                    };
                }
                if (this._hasOnabort) {
                    db.onabort = event => {
                        Log.debug("IDBDatabase - onabort triggered");
                        event.wrappedTarget = this;
                        if (this.onabort) {
                            this.onabort(event);
                        }
                        reject(event);
                    };
                }
                if (this._hasOnversionchange) {
                    db.onversionchange = event => {
                        event.wrappedTarget = this;
                        Log.debug("IDBDatabase - onversionchange triggered");
                        if (this.onversionchange) {
                            this.onversionchange(event);
                        }
                    };
                }
            } catch (error) {
                Log.error("IDBDatabase - exception", error);
                reject(error);
            }
        });
    }

    get name() {
        return this.originalDb.name;
    }
    get version() {
        return this.originalDb.version; // parseInt(this.originalDb.version, 10) || zero;
    }
    get objectStoreNames() {
        return this.originalDb.objectStoreNames;
    }
    get onabort() {
        return this._onabort;
    }
    set onabort(value) {
        Log.debug("IDBDatabase - added onabort callback");
        this._onabort = value;
    }
    get onclose() {
        return this._onclose;
    }
    set onclose(value) {
        Log.debug("IDBDatabase - added onclose callback");
        this._onclose = value;
    }
    get onerror() {
        return this._onerror;
    }
    set onerror(value) {
        Log.debug("IDBDatabase - added onerror callback");
        this._onerror = value;
    }
    get onversionchange() {
        return this._onversionchange;
    }
    set onversionchange(value) {
        Log.debug("IDBDatabase - added onversionchange callback");
        this._onversionchange = value;
    }

    get originalDb() {
        return this._db;
    }
    get promise() {
        return this._promise;
    }

    transaction(storenames, mode = IDBTransactionMode.READ_ONLY) {
        Log.debug("IDBDatabase - transaction");
        return new IDBTransaction(this.originalDb.transaction(storenames, mode));
    }
    close() {
        Log.debug("IDBDatabase - close");
        this.originalDb.close();
        this._closeInternal();
    }
    createObjectStore(name,
                      options = {
                          autoIncrement: false /*,
                          keyPath: undefined*/
                      }) {
        Log.debug("IDBDatabase - createObjectStore");
        // as fallback add autoIncrement option as third parameter
        try {
            return new IDBObjectStore(this.originalDb.createObjectStore(name, options, options.autoIncrement));
        } catch (ex) {
            Log.error("IDBDatabase - createObjectStore exception", ex);
        }
    }
    deleteObjectStore(name) {
        Log.debug("IDBDatabase - deleteObjectStore");
        this.originalDb.deleteObjectStore(name);
    }

    get _hasOnabort() {
        return this.originalD && "onabort" in this.originalDb;
    }
    get _hasOnclose() {
        return this.originalD && "onclose" in this.originalDb;
    }
    get _hasOnversionchange() {
        return this.originalD && "onversionchange" in this.originalDb;
    }
    _triggerVersionChange(version) {
        if (!this._hasOnversionchange && this.onversionchange) {
            Log.debug("IDBDatabase - onversionchange triggered");
            this.onversionchange({
                newVersion: version,
                oldVersion: this.version,
                type: "versionchange"
            });
        }
    }
    
}

export default IDBDatabase;
