export const DEFAULT_NAME = "default";

export class IMPLEMENTATION {
    static get NONE(){
        return 0;
    }
    static get NATIVE(){
        return 1;
    }
    static get MICROSOFT(){
        return 2;
    }
    static get MOZILLA(){
        return 3;
    }
    static get GOOGLE(){
        return 4;
    }
    static get MICROSOFTPROTOTYPE(){
        return 5;
    }
    static get SHIM(){
        return 6;
    }
    static get MOCK(){
        return 7;
    }
};
export class DBEVENTS {
    static get OBJECTSTORE_CREATED(){
        return "Object store created";
    }
    static get OBJECTSTORE_REMOVED(){
        return "Object store removed";
    }
    static get INDEX_CREATED(){
        return "Index created";
    }
    static get INDEX_REMOVED(){
        return "Index removed";
    }
    static get DATABASE_REMOVED(){
        return "Database removed";
    }
    static get DATABASE_BLOCKED(){
        return "Database blocked";
    }
    static get DATABASE_UPGRAVE(){
        return "Database upgrade";
    }
    static get DATABASE_OPENED(){
        return "Database opened";
    }
}
export class DATAEVENTS {
    static get DATA_INSERTED(){
        return "Data inserted";
    }
    static get DATA_UPDATED(){
        return "Data updated";
    }
    static get DATA_REMOVED(){
        return "Data removed";
    }
    static get DATA_CLEARED(){
        return "Object store cleared";
    }$
}