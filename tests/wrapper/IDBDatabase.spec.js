import * as env from "./../../src/_index";

const dbName = "dbname";
const objectStoreName = "store";

describe("IDBDatabase", () => {
    beforeEach(done => {
        var request = env.indexedDB.open(dbName);      
        request.onupgradeneeded = () => {
            console.log("upgrade");
            request.transaction.db.createObjectStore(objectStoreName);
        }
        request.onsuccess = () => {
            console.log("success");
            request.result.close();
            done();
        }  
    });
    afterEach(done => {
        env.indexedDB.deleteDatabase(dbName).promise.then(() =>done());        
    });
    afterAll(() => {
        env.indexedDB.deleteDatabase(dbName);        
    });
    /* Open without version */
    describe("When I have an open a database", () => {
        it("should have a version", done => {
            const request = env.indexedDB.open(dbName);
            request.onsuccess = function(event) {
                expect(request.result.version).toBe(1);
                request.result.close();
                done();
            };
        });
        it("should have a name", done => {
            const request = env.indexedDB.open(dbName);
            request.onsuccess = function(event) {
                expect(request.result.name).toBe(dbName);
                request.result.close();
                done();
            };
        });
        it("should have a list with objectStoreNames", done => {
            const request = env.indexedDB.open(dbName);
            request.onsuccess = function(event) {
                expect(request.result.objectStoreNames.length).toBe(1);
                expect(request.result.objectStoreNames).toContain(objectStoreName);
                request.result.close();
                done();
            };
        });
        describe("and upgrade to a higher version", () =>{
            it("should call onversionchange", done => {
                const request = env.indexedDB.open(dbName);
                request.onsuccess = function(event) {
                    console.log("success", done);
                    const db = request.result;
                    db.onversionchange = event => {
                        console.log("versionchange", done);
                        expect(event.type).toBe("versionchange");
                        expect(event.oldVersion).toBe(db.version);
                        expect(event.newVersion).toBe(db.version + 1);
                        db.close();
                    };
                    env.indexedDB.open(dbName, db.version + 1).promise.then(event => {
                        console.log("success upgrade", done);
                        event.wrappedTarget.result.close();
                        done();
                    });
                };
            });
        });
    });
});