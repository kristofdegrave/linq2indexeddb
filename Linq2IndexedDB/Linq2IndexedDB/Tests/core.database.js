$(document).ready(function () {
    module("Database");
    asyncTest("Opening/Creating Database", 3, function () {
        initionalSituation(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                equal(args[0].name, dbName, "Database opened/created");
                // Necessary for indexeddb who work with setVersion
                equal(parseInt(args[0].version), 1, "Database opened/created");
                args[0].close();
                start();
            }, function () {
                ok(false, "Creating database failed");
                start();
            }, function (args) {
                equal(args[1].type, "upgradeneeded", "Upgrading database");
            });
        });
    });
    asyncTest("Opening/Creating Database with version", 5, function () {
        var version = 2;
        initionalSituation(function () {
            linq2indexedDB.core.db(dbName, version).then(function (args) {
                equal(args[0].name, dbName, "Database opened/created");
                equal(args[0].version, version, "Database version");
                args[0].close();
                start();
            }, function () {
                ok(false, "Creating/Opening database failed");
                start();
            }, function (args) {
                equal("upgradeneeded", args[1].type, "Upgrading database");
                equal(args[1].oldVersion, 0, "Old version");
                equal(args[1].newVersion, version, "New version");
            });
        });
    });
    asyncTest("Opening existing Database", 1, function () {
        initionalSituationDatabase(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                equal(args[0].name, dbName, "Database opened/created");
                args[0].close();
                start();
            }, function () {
                ok(false, "Creating/Opening database failed");
                start();
            }, function () {
                ok(false, "Upgrading database");
            });
        });
    });
    asyncTest("Opening existing Database with current version", 2, function () {
        var version = 1;
        initionalSituationDatabase(function () {
            linq2indexedDB.core.db(dbName, version).then(function (args) {
                equal(args[0].name, dbName, "Database opened/created");
                equal(args[0].version, version, "Database version");
                args[0].close();
                start();
            }, function () {
                ok(false, "Creating/Opening database failed");
                start();
            }, function () {
                ok(false, "Upgrading database");
            });
        });
    });
    asyncTest("Opening existing Database with lower version", 1, function () {
        var version = 1;
        initionalSituationDatabaseVersion(function () {
            linq2indexedDB.core.db(dbName, version).then(function (args) {
                ok(false, "Database opened/created");
                args[0].close();
                start();
            }, function (args) {
                equal(args.type, "VersionError", "Creating/Opening database failed");
                start();
            }, function () {
                ok(false, "Upgrading database");
            });
        });
    });
    asyncTest("Opening existing Database with higher version", 5, function () {
        var version = 2;
        initionalSituationDatabase(function () {
            linq2indexedDB.core.db(dbName, version).then(function (args) {
                equal(args[0].name, dbName, "Database opened/created");
                equal(args[0].version, version, "Database version");
                args[0].close();
                start();
            }, function () {
                ok(false, "Creating/Opening database failed");
                start();
            }, function (args) {
                equal("upgradeneeded", args[1].type, "Upgrading database");
                equal(args[1].oldVersion, 1, "Old version");
                equal(args[1].newVersion, version, "New version");
            });
        });
    });
    asyncTest("Deleting existing Database", 1, function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            linq2indexedDB.core.deleteDb(dbName).then(function () {
                ok(true, "Database removed");
                start();
            }, function () {
                ok(false, "Deleting database failed: ");
                start();
            });
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        });
    });
    asyncTest("Deleting non existing Database", 1, function () {
        initionalSituation(function () {
            linq2indexedDB.core.deleteDb(dbName).then(function () {
                ok(true, "Database removed");
                start();
            }, function () {
                ok(false, "Deleting database failed");
                start();
            });
        });
    });
});