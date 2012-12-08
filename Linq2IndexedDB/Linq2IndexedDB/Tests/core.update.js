$(document).ready(function () {
    module("Update");
    asyncTest("Updating data", 2, function () {
        var data = { test: "test" };
        initionalSituationObjectStoreNoAutoIncrementWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data).then(function () {
                            ok(false, "data updated");
                        }, function (updateArgs) {
                            equal(updateArgs.type, "DataError", updateArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data with external key", 6, function () {
        var data = { test: "test" };
        var key = 1;
        initionalSituationObjectStoreNoAutoIncrementWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data, key).then(function (updateArgs) {
                            ok(true, "data updated");
                            equal(updateArgs[1], insertData.Id, "Key of the original data");
                            notEqual(updateArgs[0], insertData, "Original data deferres from the current data");
                            equal(updateArgs[0], data, "Data ok");
                            equal(updateArgs[1], key, "Key ok");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 1, "Count ok");
                            });
                        }, function () {
                            ok(false, "update error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data - objectstore autoincrement", 3, function () {
        var data = { test: "test" };
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
                        linq2indexedDB.core.update(objArgs[1], data).then(function (updateArgs) {
                            ok(true, "data inserted");
                            equal(updateArgs[0], data, "Data ok");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 2, "Count ok");
                            });
                        }, function () {
                            ok(false, "update error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data with external key - objectstore autoincrement", 6, function () {
        var data = { test: "test" };
        var key = 1;
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
                        linq2indexedDB.core.update(objArgs[1], data, key).then(function (updateArgs) {
                            ok(true, "data updated");
                            equal(updateArgs[1], insertData.Id, "Key of the original data");
                            notEqual(updateArgs[0], insertData, "Original data deferres from the current data");
                            equal(updateArgs[0], data, "Data ok");
                            equal(updateArgs[1], key, "Key ok");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 1, "Count ok");
                            });
                        }, function () {
                            ok(false, "update error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data - objectstore keyPath", 2, function () {
        var data = { test: "test" };
        initionalSituationObjectStoreKeyPathWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data).then(function () {
                            ok(false, "data updated");
                        }, function (updateArgs) {
                            equal(updateArgs.type, "DataError", updateArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data with inline key - objectstore keyPath", 6, function () {
        var data = { test: "test", Id: 1 };
        initionalSituationObjectStoreKeyPathWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data).then(function (updateArgs) {
                            ok(true, "data updated");
                            equal(updateArgs[1], insertData.Id, "Key of the original data");
                            notEqual(updateArgs[0], insertData, "Original data deferres from the current data");
                            equal(updateArgs[0], data, "Data ok");
                            equal(updateArgs[1], data.Id, "Key ok");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 1, "Count ok");
                            });
                        }, function () {
                            ok(false, "update error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data with external key - objectstore keyPath", 2, function () {
        var data = { test: "test" };
        var key = 1;
        initionalSituationObjectStoreKeyPathWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data, key).then(function () {
                            ok(false, "data updated");
                        }, function (updateArgs) {
                            equal(updateArgs.type, "DataError", updateArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data - objectstore keyPath autoincrement", 4, function () {
        var data = { test: "test" };
        initionalSituationObjectStoreKeyPathAutoIncrementWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data).then(function (updateArgs) {
                            ok(true, "data inserted");
                            equal(updateArgs[0], data, "Data ok");
                            equal(updateArgs[1], updateArgs[0].Id, "Key ok (key inserted into the object)");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 2, "Count ok");
                            });
                        }, function () {
                            ok(false, "update error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data with inline key - objectstore keyPath autoincrement", 6, function () {
        var data = { test: "test", Id: 1 };
        initionalSituationObjectStoreKeyPathAutoIncrementWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data).then(function (updateArgs) {
                            ok(true, "data updated");
                            equal(updateArgs[1], insertData.Id, "Key of the original data");
                            notEqual(updateArgs[0], insertData, "Original data deferres from the current data");
                            equal(updateArgs[0], data, "Data ok");
                            equal(updateArgs[1], data.Id, "Key ok");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 1, "Count ok");
                            });
                        }, function () {
                            ok(false, "update error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data with external key - objectstore keyPath autoincrement", 2, function () {
        var data = { test: "test" };
        var key = 1;
        initionalSituationObjectStoreKeyPathWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data, key).then(function () {
                            ok(false, "data updated");
                        }, function (updateArgs) {
                            equal(updateArgs.type, "DataError", updateArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data with non existing external key", 4, function () {
        var data = { test: "test" };
        var key = 1;
        initionalSituationObjectStoreNoAutoIncrement(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data, key).then(function (updateArgs) {
                            ok(true, "data inserted");
                            equal(updateArgs[0], data, "Data ok");
                            equal(updateArgs[1], key, "Key ok");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 1, "Count ok");
                            });
                        }, function () {
                            ok(false, "update error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data with non existing inline key", 4, function () {
        var data = { test: "test", Id: 1 };
        initionalSituationObjectStoreKeyPath(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.update(objArgs[1], data).then(function (updateArgs) {
                            ok(true, "data inserted");
                            equal(updateArgs[0], data, "Data ok");
                            equal(updateArgs[1], data.Id, "Key ok");
                            linq2indexedDB.core.count(objArgs[1]).then(function (countArgs) {
                                equal(countArgs[0], 1, "Count ok");
                            });
                        }, function () {
                            ok(false, "update error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data with invalid key", 2, function () {
        var data = { test: "test" };
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
                        linq2indexedDB.core.update(objArgs[1], data, data).then(function () {
                            ok(false, "data updated");
                        }, function (updateArgs) {
                            equal(updateArgs.type, "DataError", updateArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Updating data - readonly transaction", 2, function () {
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
                        linq2indexedDB.core.insert(objArgs[1], insertData).then(function () {
                            ok(false, "data inserted");
                        }, function (updateArgs) {
                            equal(updateArgs.type, "ReadOnlyError", updateArgs.message);
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