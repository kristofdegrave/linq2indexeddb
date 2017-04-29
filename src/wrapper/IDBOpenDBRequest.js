/**
 * https://w3c.github.io/IndexedDB/#idbrequest
 */
import IDBDatabase from "./IDBDatabase";
import IDBRequest from "./IDBRequest";
import IDBTransaction from "./IDBTransaction";
import Log from "./../common/log";

const zero = 0;
const minusone = -1;
const one = 1;

class IDBOpenDBRequest extends IDBRequest {
    constructor(request, version, connections = []) {
        super(request);
        this._connections = connections;
        this._version = version;
    }
    get onupgradeneeded() {
        return this._onupgradeneeded;
    }
    set onupgradeneeded(value) {
        Log.debug("IDBOpenDBRequest - added onupgradeneeded callback");
        this._onupgradeneeded = value;
    }
    get onblocked() {
        return this._onblocked;
    }
    set onblocked(value) {
        Log.debug("IDBOpenDBRequest - added onblocked callback");
        this._onblocked = value;
    }
    get onsuccess() {
        return this._onsuccess;
    }
    set onsuccess(value) {
        Log.debug("IDBOpenDBRequest - added onsuccess callback");
        this._onsuccess = value;
    }
    get onerror() {
        return this._onerror;
    }
    set onerror(value) {
        Log.debug("IDBOpenDBRequest - added onerror callback");
        this._onerror = value;
    }


    _setRequest(request) {
        this._request = request;
        this._promise = new Promise((resolve, reject) => {
            try {
                request.onsuccess = event => {
                    // if (this._version === zero) {
                    //    throw new {
                    //        message: "The version of the database can't be zero.",
                    //        name: "TypeError"
                    //    };
                    // }
                    if (!this._handelUpgradeVersion(request.result, resolve, reject)) {
                        Log.debug("IDBOpenRequest - onsuccess triggered");
                        if (request.result) {
                            this._result = new IDBDatabase(request.result);
                        }

                        event.wrappedTarget = this;
                        if (this.onsuccess) {
                            this.onsuccess(event);
                        }
                        resolve(event);
                    }
                };
                request.onerror = event => {
                    Log.debug("IDBOpenDBRequest - onerror triggered");
                    event.wrappedTarget = this;
                    this._result = null;
                    if (this.onerror) {
                        this.onerror(event);
                    }
                    reject(event);
                };
                request.onblocked = event => {
                    Log.debug("IDBOpenDBRequest - onblocked triggered");
                    this._connections.forEach(connection => connection._triggerVersionChange(this._version));
                    event.wrappedTarget = this;
                    this._result = null;
                    if (this.onblocked) {
                        if (!("oldVersion" in event)) {
                            event.oldVersion = this._connections[0].version;
                        }
                        if (!("newVersion" in event)) {
                            event.newVersion = this._version || null;
                        }
                        this.onblocked(event);
                    }
                };
                request.onupgradeneeded = event => {
                    Log.debug("IDBOpenDBRequest - onupgradeneeded triggered");
                    if (request.result) {
                        this._result = new IDBDatabase(request.result);
                    } 
                    this._transaction = new IDBTransaction(request.transaction);
                    this._transaction.promise.then(() => {
                        this._transaction = null;
                    });
                    event.wrappedTarget = this;
                    if (this.onupgradeneeded) {
                        this.onupgradeneeded(event);
                    }
                };
            } catch (ex) {
                Log.exception("IDBOpenDBRequest - exception", ex);
                reject(ex);
            }
        });
    }
    _handelUpgradeVersion(db, resolve, reject) {
        if (db && db.setVersion) {
            Log.debug("IDBOpenDBRequest - setVersion present");
            let dbVersion = parseInt(db.version, 10);

            if (isNaN(dbVersion) || dbVersion < zero) {
                dbVersion = zero;
            }
            if (dbVersion < this._version || this._version === minusone || db.version === "") {
                Log.debug("IDBOpenDBRequest - setVersion triggered");
                const request = new IDBOpenDBRequest(db.setVersion(this._version || one));

                request.onsuccess = event => {
                    const idb = new IDBDatabase(event.target);

                    if (this._version === minusone) {
                        for (let index = 0; index < idb.objectStoreNames.length; index++) {
                            idb.deleteObjectStore(idb.objectStoreNames[index]);
                        }
                        idb.close();
                    } else if (this.onupgradeneeded) {
                        Log.debug("IDBOpenDBRequest - onupgradeneeded triggered");
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
                    Log.debug("IDBOpenDBRequest - onblocked triggered");
                    event.wrappedTarget = this;
                    if (this.onblocked) {
                        this.onblocked(event);
                    }
                };
                request.onerror = event => {
                    Log.debug("IDBOpenDBRequest - onerror triggered");
                    event.wrappedTarget = this;
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
