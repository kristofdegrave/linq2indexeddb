import * as env from "./../../src/_index";

const dbName = "dbname";
const objectStoreName = "store";

describe("IDBFactory", () => {
    beforeEach(done => {
        var request = env.indexedDB.open(dbName);      
        request.onupgradeneeded = () => {
            request.result.createObjectStore(objectStoreName);
        }      
        request.onsuccess = () => {
            request.result.close();
            done();
        }  
    });
    afterEach(done => {
        env.indexedDB.deleteDatabase(dbName).promise.then(() =>done());        
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
                expect(request.result.objectStoreNames).toContain(objectStoreName);
                request.result.close();
                done();
            };
        });
    });
});