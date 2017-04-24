import IDBFactory from "./../../src/wrapper/IDBFactory";

const dbName = "dbname";

describe("IDBFactory", function(){
    beforeAll(function(done) {
        const request = IDBFactory.deleteDatabase(dbName);
        request.onsuccess = function(){
            done();
        }
        request.onerror = function(){
            done();
        }
    });

    afterAll(function(done) {
        const request = IDBFactory.deleteDatabase(dbName);
        request.onsuccess = function(){
            done();
        }
        request.onerror = function(){
            done();
        }
    });
    
    describe("When I open a non-existing database without a version", function(){
        afterEach(function(done) {
            const request = IDBFactory.deleteDatabase(dbName);
            request.onsuccess = function(){
                done();
            }
            request.onerror = function(){
                done();
            }
        });
        it("should call onupgradeneeded", function(done){
            const request = IDBFactory.open(dbName);
            request.onupgradeneeded = function(event){
                expect(event.type).toBe("upgradeneeded");
                expect(event.newVersion).toBe(1);
                expect(event.oldVersion).toBe(0);
            };
            request.onsuccess = function(event){
                event.target.result.close();
                done();
            }
        }); 
        it("should open a connection", function(done){
            const request = IDBFactory.open(dbName);
            request.onsuccess = function(event){
                const db = event.target.result; 
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            }
        });
        it("should resolve a promise", function(done){
            IDBFactory.open(dbName).promise.then(function(event){
                const db = event.target.result; 
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            });
        });
    });
    describe("When I open a non-existing database with a version", function(){
        const version = 2;
        afterEach(function(done) {
            const request = IDBFactory.deleteDatabase(dbName);
            request.onsuccess = function(){
                done();
            }
            request.onerror = function(){
                done();
            }
            request.onblocked = function(){
            }
        });
        it("should call onupgradeneeded", function(done){
            const request = IDBFactory.open(dbName, version);
            request.onupgradeneeded = function(event){
                expect(event.type).toBe("upgradeneeded");
                expect(event.newVersion).toBe(version);
                expect(event.oldVersion).toBe(0);
            };
            request.onsuccess = function(event){
                event.target.result.close();
                done();
            }
        }); 
        it("should open a connection", function(done){
            const request = IDBFactory.open(dbName, version);
            request.onsuccess = function(event){
                const db = event.target.result;
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            }
        });
        it("should resolve a promise", function(done){
            IDBFactory.open(dbName, version).promise.then(function(event){
                const db = event.target.result; 
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            });
        });
    });
    describe("When I open a non-existing database with version 0", function(){
        const version = 0;
        afterEach(function(done) {
            const request = IDBFactory.deleteDatabase(dbName);
            request.onsuccess = function(){
                done();
            }
            request.onerror = function(){
                done();
            }
        });
        it("should throw a TypeError", function(done){
            try {
                const request = IDBFactory.open(dbName, version);
                request.onsuccess = function(){
                    done();
                }
                request.onerror = function(){
                    done();
                }
            } catch (error) {
                expect(error.name).toBe("TypeError");
                done();
            }
        });
    });
    describe("When I open a non-existing database with a negative version", function(){
        const version = -1;
        afterEach(function(done) {
            const request = IDBFactory.deleteDatabase(dbName);
            request.onsuccess = function(){
                done();
            }
            request.onerror = function(){
                done();
            }
        });
        it("should throw a TypeError", function(done){
            try {
                const request = IDBFactory.open(dbName, version);
                request.onsuccess = function(){
                    done();
                }
                request.onerror = function(){
                    done();
                }
            } catch (error) {
                expect(error.name).toBe("TypeError");
                done();
            }
        });
    });
    describe("When I open a existing database without a version", function(){
        beforeAll(function(done) {
            var request = IDBFactory.open(dbName);
            request.onsuccess = function(){
                done();
            }
            request.onerror = function(){
                done();
            }
        });
        afterAll(function(done) {
            var request = IDBFactory.deleteDatabase(dbName);
            request.onsuccess = function(){
                done();
            }
            request.onerror = function(){
                done();
            }
        });
        it("shouldn't call onupgradeneeded", function(done){
            const request = IDBFactory.open(dbName);
            request.onupgradeneeded = function() {};
            request.onsuccess = function(event){
                expect(request.onupgradeneeded).not.toHaveBeenCalled();
                event.target.result.close();
                done();
            }
            spyOn(request, "onupgradeneeded");
        }); 
        it("should open a connection", function(done){
            const request = IDBFactory.open(dbName);
            request.onsuccess = function(event){
                const db = event.target.result; 
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            }
        });
        it("should resolve a promise", function(done){
            IDBFactory.open(dbName).promise.then(function(event){
                const db = event.target.result; 
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            });
        });
    });
    describe("When I open a existing database with a higher version", function(){
        const version = 2;
        beforeAll(function(done) {
            var request = IDBFactory.open(dbName);
            request.onsuccess = function(event){
                event.target.result.close(); 
                done();
            }
            request.onerror = function(){
                done();
            }
        });
        afterAll(function(done) {
            var request = IDBFactory.deleteDatabase(dbName);
            request.onsuccess = function(){
                done();
            }
            request.onerror = function(){
                done();
            }
        });
        it("should call onupgradeneeded", function(done){
            const request = IDBFactory.open(dbName, version);
            request.onupgradeneeded = function(event){
                expect(event.type).toBe("upgradeneeded");
                expect(event.newVersion).toBe(version);
                expect(event.oldVersion).toBe(1);
            };
            request.onsuccess = function(event){
                event.target.result.close(); 
                done();
            }
        }); 
        it("should open a connection", function(done){
            const request = IDBFactory.open(dbName, version);
            request.onsuccess = function(event){
                const db = event.target.result; 
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            }
        });
        it("should resolve a promise", function(done){
            IDBFactory.open(dbName, version).promise.then(function(event){
                const db = event.target.result; 
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            });
        });
    });
    describe("When I open a existing database with the same version", function(){
        const version = 1;
        beforeAll(function(done) {
            var request = IDBFactory.open(dbName, version);
            request.onsuccess = function(event){
                event.target.result.close(); 
                done();
            }
            request.onerror = function(){
                done();
            }
        });
        afterAll(function(done) {
            var request = IDBFactory.deleteDatabase(dbName);
            request.onsuccess = function(){
                done();
            }
            request.onerror = function(){
                done();
            }
        });
        it("shouldn't call onupgradeneeded", function(done){
            const request = IDBFactory.open(dbName, version);
            request.onupgradeneeded = function() {};
            request.onsuccess = function(event){
                expect(request.onupgradeneeded).not.toHaveBeenCalled();
                event.target.result.close();
                done();
            }
            spyOn(request, "onupgradeneeded");
        }); 
        it("should open a connection", function(done){
            const request = IDBFactory.open(dbName, version);
            request.onsuccess = function(event){
                const db = event.target.result; 
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            }
        });
        it("should resolve a promise", function(done){
            IDBFactory.open(dbName, version).promise.then(function(event){
                const db = event.target.result;
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            });
        });
    });
});