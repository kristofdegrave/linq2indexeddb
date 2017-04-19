import { IMPLEMENTATION } from "./../common/enums";
import Log from "./../common/log";

class IndexedDBImplementation {
    constructor(){
        this._implementation = this._initialize();
    }
    get Implementation(){
        return this._implementation;
    }

    _initialize() {
        if (typeof window === "undefined") {
            Log.info("No window element present!");
            this._implementation = IMPLEMENTATION.NONE;
        } else if ( window.indexedDBmock){
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
        } else if (window.msIndexedDB){
            Log.info("Microsoft implementation");
            this._implementation = IMPLEMENTATION.MICROSOFT;
        } else if (navigator.appName === "Microsoft Internet Explorer"){
            window.indexedDB.json = window.JSON || {
                parse(txt) {
                    if (txt === "[]") { 
                        return [];
                    }
                    if (txt === "{}") { 
                        return {};
                    }
                    throw {message: `Unrecognized JSON to parse: ${txt}`};
                }
            };

            Log.info("Microsoft prototype implementation");
            this._implementation = IMPLEMENTATION.MICROSOFTPROTOTYPE;
        }
        this._implementation = IMPLEMENTATION.NONE;
    }
}

const indexeDBImp = new IndexedDBImplementation();

export default indexeDBImp;
