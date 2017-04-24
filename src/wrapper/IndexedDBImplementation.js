import {IMPLEMENTATION} from "./../common/enums";
import Log from "./../common/log";

class IndexedDBImplementation {
    constructor() {
        this._implementation = this._initialize();
    }
    get Implementation() {
        return this._implementation;
    }

    _initialize() {
        if (typeof window === "undefined") {
            Log.info("No window element present!");
            this._implementation = IMPLEMENTATION.NONE;
        } else if (window.indexedDBmock) {
            Log.info("Mock implementation");
            this._implementation = IMPLEMENTATION.MOCK;
        } else if (window.indexedDB) {
            Log.info("Native implementation");
            this._implementation = IMPLEMENTATION.NATIVE;
        } else if (window.mozIndexedDB) {
            Log.info("Mozilla implementation");
            this._implementation = IMPLEMENTATION.MOZILLA;
        } else if (window.webkitIndexedDB) {
            Log.info("Google implementation");
            this._implementation = IMPLEMENTATION.GOOGLE;
        } else if (window.msIndexedDB) {
            Log.info("Microsoft implementation");
            this._implementation = IMPLEMENTATION.MICROSOFT;
        }
        this._implementation = IMPLEMENTATION.NONE;
    }
}

const indexeDBImp = new IndexedDBImplementation();

export default indexeDBImp;
