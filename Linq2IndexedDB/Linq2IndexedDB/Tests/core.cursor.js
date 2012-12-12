$(document).ready(function () {
    module("cursor");
    asyncTest("Cursor - Object Store - only", 3, function () {
        initionalSituationCursor(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.cursor(objArgs[1], linq2indexedDB.core.keyRange.only(cursorData1.id)).then(function (cursorArgs) {
                            equal(cursorArgs[0].length, 1, "Number of results");
                            equal(cursorArgs[0][0].key, cursorData1.id, "Keys equal");
                            deepEqual(cursorArgs[0][0].data, cursorData1, "Data retrieved.");
                        }, function () {
                            ok(false, "Get error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Cursor - Object Store - bound", 3, function () {
        initionalSituationCursor(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.cursor(objArgs[1], linq2indexedDB.core.keyRange.bound(cursorData1.id, cursorData1.id)).then(function (cursorArgs) {
                            equal(cursorArgs[0].length, 1, "Number of results");
                            equal(cursorArgs[0][0].key, cursorData1.id, "Key object 1");
                            deepEqual(cursorArgs[0][0].data, cursorData1, "Data object 1");
                        }, function () {
                            ok(false, "Get error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Cursor - Object Store - upperBound", 3, function () {
        initionalSituationCursor(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.cursor(objArgs[1], linq2indexedDB.core.keyRange.upperBound(cursorData1.id)).then(function (cursorArgs) {
                            equal(cursorArgs[0].length, 1, "Number of results");
                            equal(cursorArgs[0][0].key, cursorData1.id, "Keys equal");
                            deepEqual(cursorArgs[0][0].data, cursorData1, "Data retrieved.");
                        }, function () {
                            ok(false, "Get error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Cursor - Object Store - lowerBound", 3, function () {
        initionalSituationCursor(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.cursor(objArgs[1], linq2indexedDB.core.keyRange.lowerBound(cursorData5.id)).then(function (cursorArgs) {
                            equal(cursorArgs[0].length, 1, "Number of results");
                            equal(cursorArgs[0][0].key, cursorData5.id, "Keys equal");
                            deepEqual(cursorArgs[0][0].data, cursorData5, "Data retrieved.");
                        }, function () {
                            ok(false, "Get error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });

    module("key cursor");
});