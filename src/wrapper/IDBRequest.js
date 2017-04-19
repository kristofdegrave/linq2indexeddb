/**
 * https://w3c.github.io/IndexedDB/#idbrequest
 */
class IDBRequest {
    constructor(request) {
        this._setRequest(request);
    }
    get result() {
        return this.originalRequest.result;
    }
    get error() {
        return this.originalRequest.error;
    }
    get source() {
        return this.originalRequest.source;
    }
    get transation() {
        return this.originalRequest.transation;
    }
    get readyState() {
        return this.originalRequest.readyState;
    }
    get onsuccess() {
        return this._onsuccess;
    }
    set onsuccess(value) {
        this._onsuccess = value;
    }
    get onerror() {
        return this._onerror;
    }
    set onerror(value) {
        this._onerror = value;
    }
    get originalRequest() {
        return this._request;
    }
    get promise(){
        return this._promise;
    }
    _setRequest(request) {
        this._request = request;
        this.promise = new Promise((resolve, reject) => {
            request.onsuccess = event => {
                resolve(event);
                if (this.onsuccess) {
                    this.onsuccess(event);
                }
            };
            request.onerror = event => {
                reject(event);
                if (this.onerror) {
                    this.onerror(event);
                }
            };
        });
    }
}

export default IDBRequest;
