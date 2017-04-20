const IDBFactory = require("./../../src/wrapper/IDBFactory");

const dbName = "dbname";

describe("IDBFactory", function(){
    beforeEach(function(done) {
        debugger;
        var request = IDBFactory.deleteDatabase(dbName);
        request.onsuccess = function(){
            done();
        }
        request.onerror = function(){
            done();
        }
    });

    it("Should create a database", function (done){
        var request = IDBFactory.open(dbName);
        spyOn(request, "onblocked");
        spyOn(request, "onupgradeneeded");
        request.onsuccess = function(event){
            const db = e.target.result;
            expect(db.name).toBe(dbName);
            expect(parseInt(db.version, 10)).toBe(1);
            expect(request.onupgradeneeded).toHaveBeenCalled();
            expect(request.onblocked).not.toHaveBeenCalled();
            db.close();
            done();
        }
        request.onerror = function(){
            done();
        };
        request.onupgradeneeded = function(event){
            expect(event.type).toBe("upgradeneeded");
            expect(event.newVersion).toBe(1);
            expect(event.oldVersion).toBeNull;
        };
    });
});