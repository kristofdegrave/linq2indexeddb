/**
 * https://w3c.github.io/IndexedDB/#idbfactory
 */
import Enviroment from "./../core/enviroment";
import IDBOpenDBRequest from "./IDBOpenDBRequest";
import { IMPLEMENTATION } from "./../common/enums";

const minuseone = -1;

class IDBFactory {
    constructor(){
        this._indexedDB = Enviroment.indexedDB;
    }
    cmp(key1, key2){
        return this._indexedDB.cmp(key1, key2);
    }
    deleteDatabase(name){
        if (typeof this._indexedDB.deleteDatabase !== "undefined") {
            return new IDBOpenDBRequest(this._indexedDB.deleteDatabase(name));
        }

        return new IDBOpenDBRequest(this._indexedDB.open(name, minuseone), minuseone);
    }
    open(name, version){
        if (version) {
            return new IDBOpenDBRequest(this._indexedDB.open(name, version), version);
        }

        return new IDBOpenDBRequest(this._indexedDB.open(name));
    }
}

export default new IDBFactory();
