import { IMPLEMENTATION } from "./../common/enums";
import IndexedDBImplementation from "./IndexedDBImplementation";

class IDBTransactionMode {
    static READ_ONLY() {
        switch (IndexedDBImplementation.Implementation) {
        case IMPLEMENTATION.MICROSOFTPROTOTYPE:
            return 0;
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
            return "readonly";
        }
    }
    static READ_WRITE() {
        switch (IndexedDBImplementation.Implementation) {
        case IMPLEMENTATION.MICROSOFTPROTOTYPE:
            return 1;
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
            return "readwrite";
        }
    }
    static VERSION_CHANGE() {
        switch (IndexedDBImplementation.Implementation) {
        case IMPLEMENTATION.MICROSOFTPROTOTYPE:
            return 2;
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
            return "versionchange";
        }
    }
}

export default IDBTransactionMode;
