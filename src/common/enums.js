export const DEFAULT_NAME = "default";

const NONE = 0;
const NATIVE = 1;
const MICROSOFT = 2;
const MOZILLA = 3;
const GOOGLE = 4;
const SHIM = 5;
const MOCK = 6;

export class IMPLEMENTATION {
    static get NONE() {
        return NONE;
    }
    static get NATIVE() {
        return NATIVE;
    }
    static get MICROSOFT() {
        return MICROSOFT;
    }
    static get MOZILLA() {
        return MOZILLA;
    }
    static get GOOGLE() {
        return GOOGLE;
    }
    static get SHIM() {
        return SHIM;
    }
    static get MOCK() {
        return MOCK;
    }
}
export class DBEVENTS {
    static get OBJECTSTORE_CREATED() {
        return "Object store created";
    }
    static get OBJECTSTORE_REMOVED() {
        return "Object store removed";
    }
    static get INDEX_CREATED() {
        return "Index created";
    }
    static get INDEX_REMOVED() {
        return "Index removed";
    }
    static get DATABASE_REMOVED() {
        return "Database removed";
    }
    static get DATABASE_BLOCKED() {
        return "Database blocked";
    }
    static get DATABASE_UPGRAVE() {
        return "Database upgrade";
    }
    static get DATABASE_OPENED() {
        return "Database opened";
    }
}
export class DATAEVENTS {
    static get DATA_INSERTED() {
        return "Data inserted";
    }
    static get DATA_UPDATED() {
        return "Data updated";
    }
    static get DATA_REMOVED() {
        return "Data removed";
    }
    static get DATA_CLEARED() {
        return "Object store cleared";
    }
}
