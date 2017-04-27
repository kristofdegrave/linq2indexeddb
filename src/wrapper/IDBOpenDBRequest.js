/**
 * https://w3c.github.io/IndexedDB/#idbrequest
 */
import IDBDatabase from "./IDBDatabase";
import IDBRequest from "./IDBRequest";
import Log from "./../common/log";

const zero = 0;
const minusone = -1;
const one = 1;

class IDBOpenDBRequest extends IDBRequest {
    constructor(request, version) {
        super(request);
        this._version = version;
    }
    get onupgradeneeded() {
        return this._onupgradeneeded;
    }
    set onupgradeneeded(value) {
        this._onupgradeneeded = value;
    }
    get onblocked() {
        return this._onblocked;
    }
    set onblocked(value) {
        this._onblocked = value;
    }
    _setRequest(request) {
        this._request = request;
        this._promise = new Promise((resolve, reject) => {
            request.onsuccess = event => {
                // if (this._version === zero) {
                //    throw new {
                //        message: "The version of the database can't be zero.",
                //        name: "TypeError"
                //    };
                // }
                if (!this._handelUpgradeVersion(event.target.result, resolve, reject)) {
                    if (this.onsuccess) {
                        this.onsuccess(event);
                    }
                    resolve(event);
                }
            };
            request.onerror = event => {
                if (this.onerror) {
                    this.onerror(event);
                }
                reject(event);
            };
            request.onblocked = event => {
                if (this.onblocked) {
                    this.onblocked(event);
                }
            };
            request.onupgradeneeded = event => {
                if (this.onupgradeneeded) {
                    this.onupgradeneeded(event);
                }
            };
        });
        this.promise.catch(error => Log.error(error));
    };
    _handelUpgradeVersion(db, resolve, reject) {
        if (db && db.setVersion) {
            let dbVersion = parseInt(db.version, 10);

            if (isNaN(dbVersion) || dbVersion < zero) {
                dbVersion = zero;
            }
            if (dbVersion < this._version || this._version === minusone || db.version === "") {
                const request = new IDBOpenDBRequest(db.setVersion(this._version || one));

                request.onsuccess = event => {
                    const idb = new IDBDatabase(event.target);

                    if (this._version === minusone) {
                        for (let index = 0; index < idb.objectStoreNames.length; index++) {
                            idb.deleteObjectStore(idb.objectStoreNames[index]);
                        }
                        idb.close();
                    } else if (this.onupgradeneeded) {
                        const upgardeEvent = {
                            newVersion: this._version || one,
                            oldVersion: dbVersion,
                            originalEvent: event,
                            target: idb,
                            type: "upgradeneeded"
                        };

                        this.onupgradeneeded(upgardeEvent);
                    }
                };
                request.onblocked = event => {
                    if (this.onblocked) {
                        this.onblocked(event);
                    }
                };
                request.onerror = event => {
                    if (this.onerror) {
                        this.onerror(event);
                    }
                    reject(event);
                };

                return true;
            }
        }

        return false;
    }
}

export default IDBOpenDBRequest;
