/**
 * https://w3c.github.io/IndexedDB/#idbfactory
 */
import Enviroment from "./../core/enviroment";
import IDBOpenDBRequest from "./IDBOpenDBRequest";
import Log from "./../common/log";

const minuseone = -1;

class IDBFactory {
    constructor() {
        this._indexedDB = Enviroment.indexedDB;
        this._connections = {};
    }
    cmp(key1, key2) {
        return this._indexedDB.cmp(key1, key2);
    }
    deleteDatabase(name) {
        Log.debug("IDBFactory - delete database", name );
        let request;

        try {
            if ("deleteDatabase" in this._indexedDB) {
                // todo review firefox does something wrong
                request = new IDBOpenDBRequest(this._indexedDB.deleteDatabase(name), null, this._connections[name] || []);
            } else {
                request = new IDBOpenDBRequest(this._indexedDB.open(name, minuseone), minuseone, this._connections[name] || []);
            }
            request.promise.then(() => {
                this._connections[name] = null;
            }, () => { /* Handle to avoid unhandled promise rejection */ });
        } catch (ex) {
            Log.error("IDBFactory - delete database error", ex, name);
        } 

        return request;
    }
    open(name, version) {
        Log.debug("IDBFactory - open database", name, version);
        try {
            let request;

            if (isNaN(version)) {
                request = new IDBOpenDBRequest(this._indexedDB.open(name));
            } else {
                request = new IDBOpenDBRequest(this._indexedDB.open(name, version), version, this._connections[name] || []);
            }
            request.promise.then(event => {
                const db = event.wrappedTarget.result;

                if (!this._connections[name]) {
                    this._connections[name] = [];
                }

                this._connections[name].push(db);
                db.promise.then(() => {
                    const index = this._connections[name].indexOf(db);

                    if (index >= 0) {
                        this._connections[name].splice(index, 1);
                    }
                }, () => { /* Handle to avoid unhandled promise rejection */ });
            }, () => { /* Handle to avoid unhandled promise rejection */ });

            return request;
        } catch (ex) {
            Log.error("IDBFactory - open database error", ex, name, version);
            if (ex && ex.name === "InvalidAccessError") {
                throw new {
                    message: ex.message,
                    name: "TypeError"
                }();
            } else {
                throw ex;
            }
        }      
    }
}

export default IDBFactory;
