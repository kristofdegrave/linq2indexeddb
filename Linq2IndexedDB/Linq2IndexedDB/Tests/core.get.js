$(document).ready(function () {
    module("get");
    asyncTest("Get data - Object Store", 1, function () {
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
                        linq2indexedDB.core.get(objArgs[1], insertData.Id).then(function (getArgs) {
                            deepEqual(getArgs[0], insertData, "Data retrieved.");
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
    asyncTest("Get data - Index", 1, function () {
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
                        linq2indexedDB.core.get(indexArgs[1], insertData.name).then(function (getArgs) {
                            deepEqual(getArgs[0], insertData, "Data retrieved.");
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
    asyncTest("Get data - Index invalid key", 2, function () {
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
                        linq2indexedDB.core.get(indexArgs[1], true).then(function (getArgs) {
                            deepEqual(getArgs[0], insertData, "Data retrieved.");
                        }, function (getArgs) {
                            equal(getArgs.type, "DataError", getArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });

    module("key get");
    asyncTest("Get key", 1, function () {
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
                        linq2indexedDB.core.getKey(indexArgs[1], insertData.name).then(function (getArgs) {
                            deepEqual(getArgs[0], insertData.Id, "Data retrieved.");
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
    asyncTest("Get key - invalid key", 2, function () {
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
                        linq2indexedDB.core.getKey(indexArgs[1], true).then(function (getArgs) {
                            deepEqual(getArgs[0], insertData, "Data retrieved.");
                        }, function (getArgs) {
                            equal(getArgs.type, "DataError", getArgs.message);
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