/**
 * https://w3c.github.io/IndexedDB/#idbrequest
 */
import IDBDatabase from "./IDBDatabase";
import Log from "./../common/log";

class IDBRequest {
    constructor(request) {
        this._setRequest(request);
    }
    get result() {
        return this._result; // new IDBDatabase(this.originalRequest.result);
    }
    get error() {
        return this.originalRequest.error;
    }
    get source() {
        return this._source; //this.originalRequest.source;
    }
    get transaction() {
        return this._transaction; //this.originalRequest.transaction;
    }
    get readyState() {
        return this.originalRequest.readyState;
    }
    get onsuccess() {
        return this._onsuccess;
    }
    set onsuccess(value) {
        Log.debug("IDBRequest - added onsuccess callback");
        this._onsuccess = value;
    }
    get onerror() {
        return this._onerror;
    }
    set onerror(value) {
        Log.debug("IDBRequest - added onerror callback");
        this._onerror = value;
    }
    get originalRequest() {
        return this._request;
    }
    get promise() {
        return this._promise;
    }
    _setRequest(request) {
        this._request = request;
        this._promise = new Promise((resolve, reject) => {
            try {
                request.onsuccess = event => {
                    Log.debug("IDBRequest - onsuccess triggered");
                    this._result = new IDBDatabase(request.result);
                    event.wrappedTarget = this;
                    if (this.onsuccess) {
                        this.onsuccess(event);
                    }
                    resolve(event);
                };
                request.onerror = event => {
                    Log.debug("IDBRequest - onerror triggered");
                    event.wrappedTarget = this;
                    if (this.onerror) {
                        this.onerror(event);
                    }
                    reject(event);
                };
            } catch (error) {
                Log.exception("IDBRequest - exception", error);
                reject(error);
            }
        });
    }
}

export default IDBRequest;
