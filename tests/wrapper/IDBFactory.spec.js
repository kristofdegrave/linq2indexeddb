import * as env from "./../../src/_index";

const dbName = "dbname";

env.log.setDebugLevel();
env.log.logger = console;

describe("IDBFactory", () => {
    afterEach(done => {
        env.indexedDB.deleteDatabase(dbName).promise.then(() => {
            done(); 
        });     
    });
    afterAll(done => {
        env.indexedDB.deleteDatabase(dbName);        
    });

    /* Open without version */
    describe("When I open a non-existing database without a version", () => {
        it("should call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName);

            request.onupgradeneeded = function(event) {
                expect(event.type).toBe("upgradeneeded");
                expect(event.newVersion).toBe(1);
                expect(event.oldVersion).toBe(0);
                expect(request.transaction).toBeDefined();
                expect(request.transaction.mode).toBe("versionchange");
            };
            request.onsuccess = function(event) {
                request.result.close();
                done();
            };
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName);

            request.onsuccess = function(event) {
                const db = request.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName).promise.then(event => {
                const db = event.wrappedTarget.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            });
        });
    });

    describe("When I open an existing database without a version", () => {
        beforeEach(done => {
            var request = env.indexedDB.open(dbName);

            request.onsuccess = function(event) {
                request.result.close();
                done();
            };
        });
        it("shouldn't call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName);

            request.onupgradeneeded = function() {};
            request.onsuccess = function() {
                expect(request.onupgradeneeded).not.toHaveBeenCalled();
                request.result.close();
                done();
            };
            spyOn(request, "onupgradeneeded");
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName);

            request.onsuccess = function(event) {
                const db = request.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName).promise.then(event => {
                const db = event.wrappedTarget.result;
                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            });
        });
    });

    /* Open with version */
    describe("When I open a non-existing database with a version", () => {
        const version = 2;
        it("should call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onupgradeneeded = function(event) {
                expect(event.type).toBe("upgradeneeded");
                expect(event.newVersion).toBe(version);
                expect(event.oldVersion).toBe(0);
                expect(request.transaction).toBeDefined();
                expect(request.transaction.mode).toBe("versionchange");
            };
            request.onsuccess = function(event) {
                request.result.close();
                done();
            };
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onsuccess = function(event) {
                const db = request.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName, version).promise.then(event => {
                const db = event.wrappedTarget.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            });
        });
    });
    describe("When I open a non-existing database with version 0", () => {
        const version = 0;
        it("should throw a TypeError", done => {
            try {
                const request = env.indexedDB.open(dbName, version);
            } catch (error) {
                expect(error.name).toBe("TypeError");
                done();
            }
        });
    });
    describe("When I open a non-existing database with a negative version", () => {
        const version = -1;
        it("should throw a TypeError", done => {
            try {
                const request = env.indexedDB.open(dbName, version);
            } catch (error) {
                expect(error.name).toBe("TypeError");
                done();
            }
        });
    });

    describe("When I open an existing database with a higher version ", () => {
        const version = 2;
        beforeEach(done => {
            var request = env.indexedDB.open(dbName);

            request.onsuccess = function(event) {
                request.result.close();
                done();
            };
        });
        it("should call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName, version);
            request.onupgradeneeded = function(event) {
                expect(event.type).toBe("upgradeneeded");
                expect(event.newVersion).toBe(version);
                expect(event.oldVersion).toBe(1);
                expect(request.transaction).toBeDefined();
                expect(request.transaction.mode).toBe("versionchange");
            };
            request.onsuccess = function(event) {
                request.result.close();
                done();
            };
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onsuccess = function(event) {
                const db = request.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName, version).promise.then(event => {
                const db = event.wrappedTarget.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            });
        });
        describe("with an open connection", () => {
            let db;
            beforeEach(done => {
                const request = env.indexedDB.open(dbName);

                request.onsuccess = function(event) {
                    db = request.result;
                    done();
                };
            });
            it("should call onblocked", done => {
                const request = env.indexedDB.open(dbName, version);

                request.onblocked = function(event) {
                    expect(event.type).toBe("blocked");
                    expect(event.newVersion).toBe(version);
                    expect(event.oldVersion).toBe(1);
                    db.close();
                };
                request.onsuccess = function(event) {
                    request.result.close();
                    done();
                };
            });
        });
    });
    describe("When I open an existing database with the same version", () => {
        const version = 1;

        beforeEach(done => {
            var request = env.indexedDB.open(dbName, version);

            request.onsuccess = function(event) {
                request.result.close();
                done();
            };
        });
        it("shouldn't call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onupgradeneeded = function() {};
            request.onsuccess = function(event) {
                expect(request.onupgradeneeded).not.toHaveBeenCalled();
                request.result.close();
                done();
            };
            spyOn(request, "onupgradeneeded");
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onsuccess = function(event) {
                const db = request.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName, version).promise.then(event => {
                const db = event.wrappedTarget.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            });
        });
    });
    // Firefox crashes on this
    /*describe("When I open an existing database with a lower version", () => {
        const version = 2;

        beforeEach(done => {
            var request = env.indexedDB.open(dbName, version);
            request.onsuccess = function(event) {
                request.result.close();
                done();
            };
        });
        it("should throw a VersionError", done => {
            const request = env.indexedDB.open(dbName, 1);
            request.onerror = function(error) {
                expect(request.error.name).toBe("VersionError");
                done();
            };
        });
        it("should reject a promise", done => {
            env.indexedDB.open(dbName, 1).promise.then(() => {}, event => {
                expect(event.wrappedTarget.error.name).toBe("VersionError");
                done();
            });
        });
    });*/

    /* Delete database */
    describe("When I delete an existing database", () => {
        beforeEach(done => {
            var request = env.indexedDB.open(dbName);

            request.onsuccess = function(event) {
                request.result.close();
                done();
            };
        });
        it("should call onsuccess", done => {
            const request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function(event) {
                expect(request.result).toBe(undefined);
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.deleteDatabase(dbName).promise.then(event => {
                const db = event.wrappedTarget.result;
                expect(db).toBe(undefined);
                done();
            });
        });
        describe("with an open connection", () => {
            let db;
            beforeEach(done => {
                const request = env.indexedDB.open(dbName);

                request.onsuccess = function(event) {
                    db = request.result;
                    done();
                };
            });
            it("should call onblocked", done => {
                const request = env.indexedDB.deleteDatabase(dbName);

                request.onblocked = function(event) {
                    expect(event.type).toBe("blocked");
                    expect(event.newVersion).toBeNull();
                    expect(event.oldVersion).toBe(1);
                    db.close();
                };
                request.onsuccess = function(event) {
                    done();
                };
            });
        });
    });
    describe("When I delete a non-existing database", () => {
        beforeEach(done => {
            var request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        it("should call onsuccess", done => {
            const request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function(event) {
                expect(event.target.result).toBe(undefined);
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.deleteDatabase(dbName).promise.then(event => {
                const db = event.wrappedTarget.result;
                expect(db).toBe(undefined);
                done();
            });
        });
    });
});
