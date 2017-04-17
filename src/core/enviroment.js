import { IMPLEMENTATION } from "./../common/enums";
import Log from "./../common/log"

class Enviroment {
    constructor(){
        this._implementation = this._initialize();
    }

    get implementation(){
        return this._implementation;
    }
    get indexedDB(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
            try {
                return new ActiveXObject("SQLCE.Factory.4.0");
            } catch (ex) {
                Log.exception("Initializing IE prototype exception", ex);
            }
            case IMPLEMENTATION.MOCK:
                return window.indexedDBmock;
            case IMPLEMENTATION.GOOGLE:
                return window.webkitIndexedDB;
            case IMPLEMENTATION.MICROSOFT:
                return window.msIndexedDB;
            case IMPLEMENTATION.MOZILLA:
                return window.mozIndexedDB;
            case IMPLEMENTATION.NATIVE:
                return window.indexedDB;
            default:
            return;
        }
    }
    get IDBCursor(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
                // TODO
                return window.IDBCursor;
            case IMPLEMENTATION.MOCK:
                return window.IDBCursormock;
            case IMPLEMENTATION.GOOGLE:
                return window.IDBCursor || window.webkitIDBCursor;
            case IMPLEMENTATION.MICROSOFT:
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBCursor;
            default:
            return;
        }
    }
    get IDBDatabase(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
                // TODO
                return window.IDBDatabase;
            case IMPLEMENTATION.MOCK:
                return window.IDBDatabasemock;
            case IMPLEMENTATION.GOOGLE:
                return window.IDBDatabase || window.webkitIDBDatabase;
            case IMPLEMENTATION.MICROSOFT:
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBDatabase;
            default:
            return;
        }
    }
    get IDBDatabaseException(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
            case IMPLEMENTATION.MOCK:
                return {
                    UNKNOWN_ERR: 0,
                    NON_TRANSIENT_ERR: 1,
                    NOT_FOUND_ERR: 2,
                    CONSTRAINT_ERR: 3,
                    DATA_ERR: 4,
                    NOT_ALLOWED_ERR: 5,
                    SERIAL_ERR: 11,
                    RECOVERABLE_ERR: 21,
                    TRANSIENT_ERR: 31,
                    TIMEOUT_ERR: 32,
                    DEADLOCK_ERR: 33
                };
            case IMPLEMENTATION.GOOGLE:
                return window.IDBDatabaseException || window.webkitIDBDatabaseException;
            case IMPLEMENTATION.MICROSOFT:
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBDatabaseException;
            default:
            return;
        }
    }
    get IDBFactory(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
            case IMPLEMENTATION.MOCK:
                // TODO
                return window.IDBFactory;
            case IMPLEMENTATION.GOOGLE:
                return window.IDBFactory || window.webkitIDBFactory;
            case IMPLEMENTATION.MICROSOFT:
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBFactory;
            default:
            return;
        }
    }
    get IDBIndex(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
                // TODO
                return window.IDBIndex;
            case IMPLEMENTATION.MOCK:
                return window.IDBIndexmock;
            case IMPLEMENTATION.GOOGLE:
                return window.IDBIndex || window.webkitIDBIndex;
            case IMPLEMENTATION.MICROSOFT:
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBIndex;
            default:
            return;
        }
    }
    get IDBKeyRange(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
                return {
                    SINGLE: 0,
                    LEFT_OPEN: 1,
                    RIGHT_OPEN: 2,
                    LEFT_BOUND: 4,
                    RIGHT_BOUND: 8,
                    only(value) {
                        return enviroment.indexedDB.range.only(value);
                    },
                    leftBound(bound, open) {
                        return enviroment.indexedDB.range.lowerBound(bound, open);
                    },
                    rightBound(bound, open) {
                        return enviroment.indexedDB.range.upperBound(bound, open);
                    },
                    bound(left, right, openLeft, openRight) {
                        return enviroment.indexedDB.range.bound(left, right, openLeft, openRight);
                    }
                };
            case IMPLEMENTATION.MOCK:
                //TODO
                return;
            case IMPLEMENTATION.GOOGLE:
                return window.IDBKeyRange || window.webkitIDBKeyRange;
            case IMPLEMENTATION.MICROSOFT:
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBKeyRange;
            default:
            return;
        }
    }
    get IDBObjectStore(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
                // TODO
                return window.IDBObjectStore;
            case IMPLEMENTATION.MOCK:
                return window.IDBObjectStoremock;
            case IMPLEMENTATION.GOOGLE:
                return window.IDBObjectStore || window.webkitIDBObjectStore;
            case IMPLEMENTATION.MICROSOFT:
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBObjectStore;
            default:
            return;
        }
    }
    get IDBRequest(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
                return {
                    INITIAL: 0,
                    LOADING: 1,
                    DONE: 2
                };
            case IMPLEMENTATION.MOCK:
                return window.IDBRequestmock;
            case IMPLEMENTATION.GOOGLE:
                return window.IDBRequest || window.webkitIDBRequest;
            case IMPLEMENTATION.MICROSOFT:
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBRequest;
            default:
            return;
        }
    }
    get IDBTransaction(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
                return {
                    READ_ONLY: 0,
                    READ_WRITE: 1,
                    VERSION_CHANGE: 2
                };
            case IMPLEMENTATION.MOCK:
                return window.IDBTransactionmock;
            case IMPLEMENTATION.GOOGLE:
                return window.IDBTransaction || window.webkitIDBTransaction;
            case IMPLEMENTATION.MICROSOFT:
                return window.IDBTransaction || {
                    READ_ONLY: 0,
                    READ_WRITE: 1,
                    VERSION_CHANGE: 2
                };
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBTransaction;
            default:
            return;
        }
    }
    get IDBOpenDBRequest(){
        switch(this.implementation){
            case IMPLEMENTATION.MICROSOFTPROTOTYPE:
            case IMPLEMENTATION.MOCK:
                // TODO
                return this.IDBRequest;
            case IMPLEMENTATION.GOOGLE:
                return window.IDBOpenDBRequest || window.webkitIDBOpenDBRequest;
            case IMPLEMENTATION.MICROSOFT:
            case IMPLEMENTATION.MOZILLA:
            case IMPLEMENTATION.NATIVE:
                return window.IDBOpenDBRequest;
            default:
            return;
        }
    }

    _initialize(){
        if(typeof (window) === "undefined"){
            Log.info("No window element present!");
            return IMPLEMENTATION.NONE;
        }
        if(window.indexedDBmock){
            Log.info("Mock implementation");
            return IMPLEMENTATION.MOCK;
        }
        if(window.indexedDB){
            Log.info("Native implementation");
            return IMPLEMENTATION.NATIVE;
        }
        if(window.mozIndexedDB){
            Log.info("Mozilla implementation");
            return IMPLEMENTATION.MOZILLA;
        }
        if(window.webkitIndexedDB){
            Log.info("Google implementation");
            return IMPLEMENTATION.GOOGLE;
        }
        if(window.msIndexedDB){
            Log.info("Microsoft implementation");
            return IMPLEMENTATION.MICROSOFT;
        }
        if(navigator.appName == 'Microsoft Internet Explorer'){
            window.indexedDB.json = window.JSON || {
                parse: function (txt) {
                    if (txt === "[]") { return []; }
                    if (txt === "{}") { return {}; }
                    throw { message: "Unrecognized JSON to parse: " + txt };
                }
            };

            Log.info("Microsoft prototype implementation");
            return IMPLEMENTATION.MICROSOFTPROTOTYPE;
        }
        return IMPLEMENTATION.NONE;
    }
}

export default new Enviroment();

/*
function initializeIndexedDb() {
    if (typeof(global) === "undefined") {
        indexedDB = null;
        return implementations.NONE;
    }

    if(global.indexedDBmock)
    {
        indexedDB = global.indexedDBmock;
        global.IDBCursor = global.IDBCursormock;
        global.IDBDatabase = global.IDBDatabasemock;
        global.IDBTransaction = global.IDBTransactionmock;
        global.IDBObjectStore = global.IDBObjectStoremock;
        global.IDBRequest = global.IDBRequestmock;
        global.IDBIndex = global.IDBIndexmock;

        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Mock implementation", global.indexedDBmock);
        return implementations.MOCK;
    }

    if (global.indexedDB) {
        // Necessary for chrome native implementation
        if (!global.IDBObjectStore && global.webkitIDBObjectStore) { global.IDBObjectStore = global.webkitIDBObjectStore; }
        if (!global.IDBRequest && global.webkitIDBRequest) { global.IDBRequest = global.webkitIDBRequest; }
        indexedDB = global.indexedDB;

        linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Native implementation", global.indexedDB);
        return implementations.NATIVE;
    } else {
        // Initialising the window.indexedDB Object for FireFox
        if (global.mozIndexedDB) {
            global.indexedDB = global.mozIndexedDB;

            if (typeof global.IDBTransaction.READ_ONLY === "number" && typeof global.IDBTransaction.READ_WRITE === "number" && typeof global.IDBTransaction.VERSION_CHANGE === "number") {
                transactionTypes.READ_ONLY = global.IDBTransaction.READ_ONLY;
                transactionTypes.READ_WRITE = global.IDBTransaction.READ_WRITE;
                transactionTypes.VERSION_CHANGE = global.IDBTransaction.VERSION_CHANGE;
            }
            indexedDB = global.indexedDB;

            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "FireFox Initialized", global.indexedDB);
            return implementations.MOZILLA;
        }

        // Initialising the window.indexedDB Object for Chrome
        else if (global.webkitIndexedDB) {
            if (!global.indexedDB) { global.indexedDB = global.webkitIndexedDB; }
            if (!global.IDBCursor) { global.IDBCursor = global.webkitIDBCursor; }
            if (!global.IDBDatabase) { global.IDBDatabase = global.webkitIDBDatabase; } //if (!global.IDBDatabaseError) global.IDBDatabaseError = global.webkitIDBDatabaseError
            if (!global.IDBDatabaseException) { global.IDBDatabaseException = global.webkitIDBDatabaseException; }
            if (!global.IDBFactory) { global.IDBFactory = global.webkitIDBFactory; }
            if (!global.IDBIndex) { global.IDBIndex = global.webkitIDBIndex; }
            if (!global.IDBKeyRange) { global.IDBKeyRange = global.webkitIDBKeyRange; }
            if (!global.IDBObjectStore) { global.IDBObjectStore = global.webkitIDBObjectStore; }
            if (!global.IDBRequest) { global.IDBRequest = global.webkitIDBRequest; }
            if (!global.IDBTransaction) { global.IDBTransaction = global.webkitIDBTransaction; }
            if (!global.IDBOpenDBRequest) { global.IDBOpenDBRequest = global.webkitIDBOpenDBRequest; }
            if (typeof global.IDBTransaction.READ_ONLY === "number" && typeof global.IDBTransaction.READ_WRITE === "number" && typeof global.IDBTransaction.VERSION_CHANGE === "number") {
                transactionTypes.READ_ONLY = global.IDBTransaction.READ_ONLY;
                transactionTypes.READ_WRITE = global.IDBTransaction.READ_WRITE;
                transactionTypes.VERSION_CHANGE = global.IDBTransaction.VERSION_CHANGE;
            }
            indexedDB = global.indexedDB;

            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Chrome Initialized", global.indexedDB);
            return implementations.GOOGLE;
        }

        // Initialiseing the window.indexedDB Object for IE 10 preview 3+
        else if (global.msIndexedDB) {
            global.indexedDB = global.msIndexedDB;

            transactionTypes.READ_ONLY = 0;
            transactionTypes.READ_WRITE = 1;
            transactionTypes.VERSION_CHANGE = 2;
            indexedDB = global.indexedDB;

            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "IE10+ Initialized", global.indexedDB);
            return implementations.MICROSOFT;
        }

        // Initialising the window.indexedDB Object for IE 8 & 9
        else if (navigator.appName == 'Microsoft Internet Explorer') {
            try {
                global.indexedDB = new ActiveXObject("SQLCE.Factory.4.0");
                global.indexedDBSync = new ActiveXObject("SQLCE.FactorySync.4.0");
            } catch (ex) {
                linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Initializing IE prototype exception", ex);
            }

            if (global.JSON) {
                global.indexedDB.json = global.JSON;
                global.indexedDBSync.json = global.JSON;
            } else {
                var jsonObject = {
                    parse: function (txt) {
                        if (txt === "[]") { return []; }
                        if (txt === "{}") { return {}; }
                        throw { message: "Unrecognized JSON to parse: " + txt };
                    }
                };
                global.indexedDB.json = jsonObject;
                global.indexedDBSync.json = jsonObject;
            }

            // Add some interface-level constants and methods.
            global.IDBDatabaseException = {
                UNKNOWN_ERR: 0,
                NON_TRANSIENT_ERR: 1,
                NOT_FOUND_ERR: 2,
                CONSTRAINT_ERR: 3,
                DATA_ERR: 4,
                NOT_ALLOWED_ERR: 5,
                SERIAL_ERR: 11,
                RECOVERABLE_ERR: 21,
                TRANSIENT_ERR: 31,
                TIMEOUT_ERR: 32,
                DEADLOCK_ERR: 33
            };

            global.IDBKeyRange = {
                SINGLE: 0,
                LEFT_OPEN: 1,
                RIGHT_OPEN: 2,
                LEFT_BOUND: 4,
                RIGHT_BOUND: 8
            };

            global.IDBRequest = {
                INITIAL: 0,
                LOADING: 1,
                DONE: 2
            };

            global.IDBTransaction = {
                READ_ONLY: 0,
                READ_WRITE: 1,
                VERSION_CHANGE: 2
            };

            transactionTypes.READ_ONLY = 0;
            transactionTypes.READ_WRITE = 1;
            transactionTypes.VERSION_CHANGE = 2;

            global.IDBKeyRange.only = function (rightBound) {
                return global.indexedDB.range.only(value);
            };

            global.IDBKeyRange.leftBound = function (bound, open) {
                return global.indexedDB.range.lowerBound(bound, open);
            };

            global.IDBKeyRange.rightBound = function (bound, open) {
                return global.indexedDB.range.upperBound(bound, open);
            };

            global.IDBKeyRange.bound = function (left, right, openLeft, openRight) {
                return global.indexedDB.range.bound(left, right, openLeft, openRight);
            };

            indexedDB = global.indexedDB;

            return implementations.MICROSOFTPROTOTYPE;
        }

        else {
            linq2indexedDB.logging.log(linq2indexedDB.logging.severity.information, "Your browser doesn't support indexedDB.");
            return implementations.NONE;
        }
    }
}*/