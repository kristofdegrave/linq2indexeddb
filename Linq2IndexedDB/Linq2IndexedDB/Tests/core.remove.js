$(document).ready(function () {
    module("remove");
    asyncTest("Remove data", 2, function () {
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
                        linq2indexedDB.core.remove(objArgs[1], insertData.Id).then(function () {
                            ok(true, "data removed");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 0, "Count ok");
                            });
                        }, function () {
                            ok(false, "remove error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Remove data - non existing key", 2, function () {
        var nonExistingKey = 9999;
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
                        linq2indexedDB.core.remove(objArgs[1], nonExistingKey).then(function () {
                            ok(true, "remove success");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 1, "Count ok");
                            });
                        }, function () {
                            ok(false, "remove error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Remove data - key range", 2, function () {
        var keyRange = IDBKeyRange.only(insertData.Id);
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
                        linq2indexedDB.core.remove(objArgs[1], keyRange).then(function () {
                            ok(true, "remove success");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 0, "Count ok");
                            });
                        }, function () {
                            ok(false, "remove error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Remove data with invalid key", 2, function () {
        var invalidKey = { test: "test" };
        initionalSituationObjectStoreNoAutoIncrement(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], invalidKey).then(function () {
                            ok(false, "data removed");
                        }, function (removeArgs) {
                            equal(removeArgs.type, "DataError", removeArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("removing data - readonly transaction", 2, function () {
        initionalSituationObjectStoreKeyPathWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], insertData.Id).then(function () {
                            ok(false, "data removed");
                        }, function (removeArgs) {
                            equal(removeArgs.type, "ReadOnlyError", removeArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    
    module("clear");
    asyncTest("Clear data", 2, function () {
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
                        linq2indexedDB.core.clear(objArgs[1]).then(function () {
                            ok(true, "data cleared");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 0, "Count ok");
                            });
                        }, function () {
                            ok(false, "Clear error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Clear data - readonly transaction", 2, function () {
        initionalSituationObjectStoreKeyPathWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.clear(objArgs[1]).then(function () {
                            ok(false, "data cleared");
                        }, function (clearArgs) {
                            equal(clearArgs.type, "ReadOnlyError", clearArgs.message);
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