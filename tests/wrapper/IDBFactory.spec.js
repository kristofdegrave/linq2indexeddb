import * as env from "./../../src/_index";

const dbName = "dbname";

describe("IDBFactory", () => {
    beforeAll(done => {
        const request = env.indexedDB.deleteDatabase(dbName);

        request.onsuccess = function() {
            done();
        };
        request.onerror = function() {
            done();
        };
    });

    afterAll(done => {
        const request = env.indexedDB.deleteDatabase(dbName);

        request.onsuccess = function() {
            done();
        };
        request.onerror = function() {
            done();
        };
    });

    /* Open without version */
    describe("When I open a non-existing database without a version", () => {
        afterEach(done => {
            const request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        it("should call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName);

            request.onupgradeneeded = function(event) {
                expect(event.type).toBe("upgradeneeded");
                expect(event.newVersion).toBe(1);
                expect(event.oldVersion).toBe(0);
            };
            request.onsuccess = function(event) {
                event.target.result.close();
                done();
            };
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName);

            request.onsuccess = function(event) {
                const db = event.target.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName).promise.then(event => {
                const db = event.target.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            });
        });
    });

    describe("When I open a existing database without a version", () => {
        beforeAll(done => {
            var request = env.indexedDB.open(dbName);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        afterAll(done => {
            var request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        it("shouldn't call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName);

            request.onupgradeneeded = function() {};
            request.onsuccess = function(event) {
                expect(request.onupgradeneeded).not.toHaveBeenCalled();
                event.target.result.close();
                done();
            };
            spyOn(request, "onupgradeneeded");
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName);

            request.onsuccess = function(event) {
                const db = event.target.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(1);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName).promise.then(event => {
                const db = event.target.result;

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

        afterEach(done => {
            const request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function() {
                done();
            };
            request.onblocked = function() {
            };
        });
        it("should call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onupgradeneeded = function(event) {
                expect(event.type).toBe("upgradeneeded");
                expect(event.newVersion).toBe(version);
                expect(event.oldVersion).toBe(0);
            };
            request.onsuccess = function(event) {
                event.target.result.close();
                done();
            };
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onsuccess = function(event) {
                const db = event.target.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName, version).promise.then(event => {
                const db = event.target.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            });
        });
    });
    describe("When I open a non-existing database with version 0", () => {
        const version = 0;

        afterEach(done => {
            const request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        it("should throw a TypeError", done => {
            try {
                const request = env.indexedDB.open(dbName, version);

                request.onsuccess = function() {
                    done();
                };
                request.onerror = function() {
                    done();
                };
            } catch (error) {
                expect(error.name).toBe("TypeError");
                done();
            }
        });
    });
    describe("When I open a non-existing database with a negative version", () => {
        const version = -1;

        afterEach(done => {
            const request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        it("should throw a TypeError", done => {
            try {
                const request = env.indexedDB.open(dbName, version);

                request.onsuccess = function() {
                    done();
                };
                request.onerror = function() {
                    done();
                };
            } catch (error) {
                expect(error.name).toBe("TypeError");
                done();
            }
        });
    });

    describe("When I open a existing database with a higher version ", () => {
        const version = 2;

        beforeAll(done => {
            var request = env.indexedDB.open(dbName);

            request.onsuccess = function(event) {
                event.target.result.close();
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        afterAll(done => {
            var request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        it("should call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onupgradeneeded = function(event) {
                expect(event.type).toBe("upgradeneeded");
                expect(event.newVersion).toBe(version);
                expect(event.oldVersion).toBe(1);
            };
            request.onsuccess = function(event) {
                event.target.result.close();
                done();
            };
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onsuccess = function(event) {
                const db = event.target.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName, version).promise.then(event => {
                const db = event.target.result;

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
                    db = event.target.result;
                    done();
                };
                request.onerror = function() {
                    done();
                };
            });
            afterEach(done => {
                if(db){
                    db.close();
                }
                var request = env.indexedDB.deleteDatabase(dbName);

                request.onsuccess = function() {
                    done();
                };
                request.onerror = function() {
                    done();
                };
            });
            it("should call onblocked", done => {
                const request = env.indexedDB.open(dbName, version);

                request.onblocked = function(event) {
                    expect(event.type).toBe("onblocked");
                    expect(event.newVersion).toBe(version);
                    expect(event.oldVersion).toBe(1);
                    db.close();
                };
                request.onsuccess = function(event) {
                    event.target.result.close();
                    done();
                };
            });
        });
    });
    describe("When I open a existing database with the same version", () => {
        const version = 1;

        beforeAll(done => {
            var request = env.indexedDB.open(dbName, version);

            request.onsuccess = function(event) {
                event.target.result.close();
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        afterAll(done => {
            var request = env.indexedDB.deleteDatabase(dbName);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        it("shouldn't call onupgradeneeded", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onupgradeneeded = function() {};
            request.onsuccess = function(event) {
                expect(request.onupgradeneeded).not.toHaveBeenCalled();
                event.target.result.close();
                done();
            };
            spyOn(request, "onupgradeneeded");
        });
        it("should open a connection", done => {
            const request = env.indexedDB.open(dbName, version);

            request.onsuccess = function(event) {
                const db = event.target.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            };
        });
        it("should resolve a promise", done => {
            env.indexedDB.open(dbName, version).promise.then(event => {
                const db = event.target.result;

                expect(db.name).toBe(dbName);
                expect(db.version).toBe(version);
                db.close();
                done();
            });
        });
    });
    describe("When I open a existing database with a lower version", () => {
        const version = 2;

        beforeAll(done => {
            var request = env.indexedDB.open(dbName, version);

            request.onsuccess = function(event) {
                event.target.result.close();
                done();
            };
            request.onerror = function() {
                done();
            };
        });
        it("should throw a VersionError", done => {
            const request = env.indexedDB.open(dbName, 1);

            request.onsuccess = function() {
                done();
            };
            request.onerror = function(error) {
                console.log("er", error);
                expect(error.target.error.name).toBe("VersionError");
                done();
            };
        });
    });
});
