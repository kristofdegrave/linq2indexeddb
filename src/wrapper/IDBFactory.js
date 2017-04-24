/**
 * https://w3c.github.io/IndexedDB/#idbfactory
 */
import Enviroment from "./../core/enviroment";
import IDBOpenDBRequest from "./IDBOpenDBRequest";

const minuseone = -1;

class IDBFactory {
    constructor() {
        this._indexedDB = Enviroment.indexedDB;
    }
    cmp(key1, key2) {
        return this._indexedDB.cmp(key1, key2);
    }
    deleteDatabase(name) {
        if (typeof this._indexedDB.deleteDatabase !== "undefined") {
            return new IDBOpenDBRequest(this._indexedDB.deleteDatabase(name));
        }

        return new IDBOpenDBRequest(this._indexedDB.open(name, minuseone), minuseone);
    }
    open(name, version) {
        if (isNaN(version)) {
            return new IDBOpenDBRequest(this._indexedDB.open(name));
        }
        try {
            return new IDBOpenDBRequest(this._indexedDB.open(name, version), version);
        } catch (ex) {
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
