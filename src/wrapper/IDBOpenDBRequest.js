/**
 * https://w3c.github.io/IndexedDB/#idbrequest
 */
import IDBRequest from "./IDBRequest";
import IDBDatabase from "./IDBDatabase";

const zero = 0;
const minusone = -1;

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
        this.promise = new Promise((resolve, reject) => {
            request.onsuccess = event => {
                if (event &&
                    event.target &&
                    event.target.result &&
                    event.target.result.setVersion) {
                    let dbVersion = parseInt(event.target.result.version, 10);

                    if (isNaN(dbVersion) || dbVersion < zero) {
                        dbVersion = zero;
                    }
                    if (dbVersion < this._version || this._version === minusone || event.target.result.version === ""){
                        const setVersionRequest = new IDBOpenDBRequest(event.target.result.setVersion(this._version || 1));
                        
                        setVersionRequest.onsuccess = ev => {
                            const idb = new IDBDatabase(ev.target);

                            if (this._version === minusone) {
                                for (let index = 0; index < idb.objectStoreNames.length; index++) {
                                    idb.deleteObjectStore(idb.objectStoreNames[index]);
                                }
                                idb.close();
                            } else if (this.onupgradeneeded) {
                                const upgardeEvent = {
                                    newVersion: this._verion || zero,
                                    oldVersion: dbVersion,
                                    originalEvent: ev,
                                    target: idb,
                                    type: "upgradeneeded"
                                };
                                        
                                this.onupgradeneeded(upgardeEvent);
                            }
                        }
                        setVersionRequest.onblocked = ev => {
                            if (this.onblocked) {
                                this.onblocked(ev);
                            }
                        };
                        setVersionRequest.onerror = ev => {
                            reject(ev);
                            if (this.onerror) {
                                this.onerror(ev);
                            }
                        };
                    } else {
                        event.target = new IDBDatabase(event.target);
                        resolve(event);
                        if (this.onsuccess) {
                            this.onsuccess(event);
                        }
                    }
                } else {
                    resolve(event);
                    if (this.onsuccess) {
                        this.onsuccess(event);
                    }
                }
            };
            request.onerror = event => {
                reject(event);
                if (this.onerror) {
                    this.onerror(event);
                }
            };
        });
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
    }
}

export default IDBOpenDBRequest;
