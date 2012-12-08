$(document).ready(function () {
    module("Insert");
    asyncTest("Inserting data", 2, function () {
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
                        linq2indexedDB.core.insert(objArgs[1], data).then(function () {
                            ok(false, "data inserted");
                        }, function (insertArgs) {
                            equal(insertArgs.type, "DataError", insertArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with external key", 3, function () {
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
                        linq2indexedDB.core.insert(objArgs[1], data, key).then(function (insertArgs) {
                            ok(true, "data inserted");
                            equal(insertArgs[0], data, "Data ok");
                            equal(insertArgs[1], key, "Key ok");
                        }, function () {
                            ok(false, "insert error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data - objectstore autoincrement", 2, function () {
        var data = { test: "test" };
        initionalSituationObjectStore(function () {

            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], data).then(function (insertArgs) {
                            ok(true, "data inserted");
                            equal(insertArgs[0], data, "Data ok");
                        }, function () {
                            ok(false, "insert error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with external key- objectstore autoincrement", 3, function () {
        var data = { test: "test" };
        var key = 1;
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], data, key).then(function (insertArgs) {
                            ok(true, "data inserted");
                            equal(insertArgs[0], data, "Data ok");
                            equal(insertArgs[1], key, "Key ok");
                        }, function () {
                            ok(false, "insert error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data - objectstore keyPath", 2, function () {
        var data = { test: "test" };
        initionalSituationObjectStoreKeyPath(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], data).then(function () {
                            ok(false, "data inserted");
                        }, function (insertArgs) {
                            equal(insertArgs.type, "DataError", insertArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with inline key - objectstore keyPath", 3, function () {
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
                        linq2indexedDB.core.insert(objArgs[1], data).then(function (insertArgs) {
                            ok(true, "data inserted");
                            equal(insertArgs[0], data, "Data ok");
                            equal(insertArgs[1], data.Id, "Key ok");
                        }, function () {
                            ok(false, "insert error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with external key - objectstore keyPath", 2, function () {
        var data = { test: "test" };
        var key = 1;
        initionalSituationObjectStoreKeyPath(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], data, key).then(function () {
                            ok(false, "data inserted");
                        }, function (insertArgs) {
                            equal(insertArgs.type, "DataError", insertArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data - objectstore keyPath autoIncrement", 3, function () {
        var data = { test: "test" };
        initionalSituationObjectStoreKeyPathAutoIncrement(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], data).then(function (insertArgs) {
                            ok(true, "data inserted");
                            equal(insertArgs[0], data, "Data ok");
                            equal(insertArgs[1], insertArgs[0].Id, "Key ok (key inserted into the object)");
                        }, function () {
                            ok(false, "insert error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with inline key - objectstore keyPath autoincrement", 3, function () {
        var data = { test: "test", Id: 1 };
        initionalSituationObjectStoreKeyPathAutoIncrement(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], data).then(function (insertArgs) {
                            ok(true, "data inserted");
                            equal(insertArgs[0], data, "Data ok");
                            equal(insertArgs[1], data.Id, "Key ok");
                        }, function () {
                            ok(false, "insert error");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with external key - objectstore keyPath autoincrement", 2, function () {
        var data = { test: "test" };
        var key = 1;
        initionalSituationObjectStoreKeyPath(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", "Transaction aborted");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], data, key).then(function () {
                            ok(false, "data inserted");
                        }, function (insertArgs) {
                            equal(insertArgs.type, "DataError", "Insert failed");
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with existing external key", 2, function () {
        initionalSituationObjectStoreNoAutoIncrementWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "ConstraintError", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], insertData, insertData.Id).then(function () {
                            ok(false, "data inserted");
                        }, function (insertArgs) {
                            equal(insertArgs.type, "ConstraintError", insertArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with existing inline key", 2, function () {
        initionalSituationObjectStoreKeyPathWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "ConstraintError", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], insertData).then(function () {
                            ok(false, "data inserted");
                        }, function (insertArgs) {
                            equal(insertArgs.type, "ConstraintError", insertArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with existing index key - index unique", 2, function () {
        initionalSituationObjectStoreIndexUniqueWithData(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "ConstraintError", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], insertData).then(function () {
                            ok(false, "data inserted");
                        }, function (insertArgs) {
                            equal(insertArgs.type, "ConstraintError", insertArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data with invalid key", 2, function () {
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
                        linq2indexedDB.core.insert(objArgs[1], data, data).then(function () {
                            ok(false, "data inserted");
                        }, function (insertArgs) {
                            equal(insertArgs.type, "DataError", insertArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data - readonly transaction", 2, function () {
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
                        }, function (insertArgs) {
                            equal(insertArgs.type, "ReadOnlyError", insertArgs.message);
                        });
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Inserting data - DataCloneError", 2, function () {
        var data = {
            test: "test", Id: 1, toString: function () {
                return true;
            }
        };
        initionalSituationObjectStoreKeyPath(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transactionArgs) {
                    equal(transactionArgs.type, "abort", transactionArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.insert(objArgs[1], data).then(function () {
                            ok(false, "data inserted");
                        }, function (insertArgs) {
                            equal(insertArgs.type, "DataCloneError", insertArgs.message);
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