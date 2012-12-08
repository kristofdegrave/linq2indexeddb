$(document).ready(function () {
    module("count");
    asyncTest("Count data - Object Store", 1, function () {
        initionalSituationObjectStoreWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                            equal(countArgs[0], 1, "Count ok");
                        }, function () {
                            ok(false, "Count error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Count data - Object Store key range", 1, function () {
        initionalSituationObjectStoreWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.count(objArgs[1], linq2indexedDB.core.keyRange.only(-1)).then(function (countArgs) {
                            equal(countArgs[0], 0, "Count ok");
                        }, function () {
                            ok(false, "Count error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Count data - Index", 1, function () {
        initionalSituationIndexWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.index(linq2indexedDB.core.objectStore(transArgs[0], objectStoreName), indexProperty, false).then(function (indexArgs) {
                        linq2indexedDB.core.count(indexArgs[1], insertData.name).then(function (countArgs) {
                            equal(countArgs[0], 1, "Count ok");
                        }, function () {
                            ok(false, "Count error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Count data - Index non existing key value", 1, function () {
        initionalSituationIndexWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.index(linq2indexedDB.core.objectStore(transArgs[0], objectStoreName), indexProperty).then(function (indexArgs) {
                        linq2indexedDB.core.count(indexArgs[1], "non existing value").then(function (countArgs) {
                            equal(countArgs[0], 0, "Count ok");
                        }, function () {
                            ok(false, "Count error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Count data - Index invalid key", 2, function () {
        initionalSituationIndexWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.index(linq2indexedDB.core.objectStore(transArgs[0], objectStoreName), indexProperty, false).then(function (indexArgs) {
                        linq2indexedDB.core.count(indexArgs[1], true).then(function (countArgs) {
                            ok(false, "Count successfull.");
                        }, function (countArgs) {
                            equal(countArgs.type, "DataError", countArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
});