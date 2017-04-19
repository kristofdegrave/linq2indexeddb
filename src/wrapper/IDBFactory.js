/**
 * https://w3c.github.io/IndexedDB/#idbfactory
 */
import OpenDBRequest from "./OpenDBRequest";
import IDBOpenDBRequest from "./IDBOpenDBRequest";
import { IMPLEMENTATION } from "./../common/enums";
import Log from "./../common/log";

const minuseone = -1;

class IDBFactory {
    constructor(implementation){
        this._implementation = implementation;
        switch (implementation){
        case IMPLEMENTATION.MICROSOFTPROTOTYPE:
            try {
                this._indexedDB = new ActiveXObject("SQLCE.Factory.4.0");
            } catch (ex) {
                Log.exception("Initializing IE prototype exception", ex);
            }
            break;
        case IMPLEMENTATION.MOCK:
            this._indexedDB = window.indexedDBmock;
            break;
        case IMPLEMENTATION.GOOGLE:
            this._indexedDB = window.webkitIndexedDB;
            break;
        case IMPLEMENTATION.MICROSOFT:
            this._indexedDB = window.msIndexedDB;
            break;
        case IMPLEMENTATION.MOZILLA:
            this._indexedDB = window.mozIndexedDB;
            break;
        case IMPLEMENTATION.NATIVE:
            this._indexedDB = window.indexedDB;
            break;
        default:
            break;
        }
    }
    cmp(key1, key2){
        return this._indexedDB.cmp(key1, key2);
    }
    deleteDatabase(name){
        if (typeof this._indexedDB.deleteDatabase !== "undefined") {
            return new IDBOpenDBRequest(this._indexedDB.deleteDatabase(name));
        }

        return new OpenDBRequest(this._indexedDB.open(name, minuseone), minuseone);
    }
    open(name, version){
        if (version) {
            return new OpenDBRequest(this._indexedDB.open(name, version), version);
        }

        return new OpenDBRequest(this._indexedDB.open(name));
    }
}

export default IDBFactory;
