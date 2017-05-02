import * as env from "./../../src/_index";

const dbName = "dbname";
const objectStoreName = "store";

/*env.log.setDebugLevel();
env.log.logger = console;*/

describe("IDBDatabase", () => {
    beforeEach(done => {
        var request = env.indexedDB.open(dbName);      
        request.onupgradeneeded = () => {
            request.transaction.db.createObjectStore(objectStoreName);
        }
        request.onsuccess = () => {
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
    describe("When I create a transaction", () => {
        it("should have a mode", done => {
            const request = env.indexedDB.open(dbName);
            request.onsuccess = function(event) {
                const transaction = request.result.transaction([objectStoreName]);
                expect(transaction.mode).toBe("readonly");
                request.result.close();
                done();
            };
        });
        it("should have a list with objectStoreNames", done => {
            const request = env.indexedDB.open(dbName);
            request.onsuccess = function(event) {
                const transaction = request.result.transaction([objectStoreName]);
                expect(transaction.objectStoreNames).toContain(objectStoreName);
                request.result.close();
                done();
            };
        });
        it("should have a database", done => {
            const request = env.indexedDB.open(dbName);
            request.onsuccess = function(event) {
                const transaction = request.result.transaction([objectStoreName]);
                expect(transaction.db).toBe(request.result);                
                request.result.close();
                done();
            };
        });
        
    });
});