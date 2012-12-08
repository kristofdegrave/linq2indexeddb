$(document).ready(function () {
    module("ObjectStores");
    asyncTest("Creating ObjectStore", 3, function () {
        initionalSituation(function () {
            linq2indexedDB.core.db(dbName, 1).then(function (args) {
                if (args[0].objectStoreNames.contains(objectStoreName)) {
                    ok(true, "Object store present");
                }
                args[0].close();
                start();
            }, function () {
                ok(false, "Database error");
                start();
            }, function (args) {
                if (args[1].type == "upgradeneeded") {
                    linq2indexedDB.core.createObjectStore(args[0], objectStoreName).then(function (objArgs) {
                        ok(true, "Object store created");
                        equals(objArgs[1].name, objectStoreName);
                    }, function () {
                        ok(false, "Creating object store failed");
                    });
                }
            });
        });
    });
    asyncTest("Creating ObjectStore with options", 5, function () {
        var keyPath = "Id";
        var autoIncrement = true;
        initionalSituation(function () {
            linq2indexedDB.core.db(dbName, 1).then(function (args) {
                if (args[0].objectStoreNames.contains(objectStoreName)) {
                    ok(true, "Object store present");
                }
                args[0].close();
                start();
            }, function () {
                ok(false, "Database error");
                start();
            }, function (args) {
                if (args[1].type == "upgradeneeded") {
                    linq2indexedDB.core.createObjectStore(args[0], objectStoreName, { keyPath: keyPath, autoIncrement: autoIncrement }).then(function (objArgs) {
                        ok(true, "Object store created");
                        equals(objArgs[1].name, objectStoreName, "Object store name");
                        equals(objArgs[1].keyPath, keyPath, "Object store keyPath");
                        if (objArgs[1].autoIncrement) {
                            equals(objArgs[1].autoIncrement, autoIncrement, "Object store autoIncrement");
                        } else {
                            ok(true, "Object store autoIncrement: attribute not implemented");
                        }
                    }, function () {
                        ok(false, "Creating object store failed");
                    });
                }
            });
        });
    });
    asyncTest("Creating ObjectStore in readwrite transaction", 1, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName, 1).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (/*transArgs*/) {
                    //ok(false, "transaction completed");
                    //transArgs[0].db.close();
                    //start();
                }, function () {
                    ok(false, "transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.createObjectStore(transArgs[0], "obj").then(function () {
                        ok(false, "object store created");
                        transArgs[0].db.close();
                        start();
                    }, function (objArgs) {
                        equal(objArgs.type, "InvalidStateError", objArgs.message);
                        transArgs[0].db.close();
                        start();
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Creating ObjectStore with autoIncrement and array with empty string as keyPath", 2, function () {
        initionalSituation(function () {
            linq2indexedDB.core.db(dbName, 1).then(function (args) {
                if (args[0].objectStoreNames.contains(objectStoreName)) {
                    ok(true, "Object store present");
                }
                args[0].close();
                start();
            }, function (args) {
                equal(args.type, "AbortError", args.message);
                start();
            }, function (args) {
                if (args[1].type == "upgradeneeded") {
                    linq2indexedDB.core.createObjectStore(args[0], objectStoreName, { keyPath: [""], autoIncrement: true }).then(function () {
                        ok(false, "Object store created");
                    }, function (objArgs) {
                        equal(objArgs.type, "InvalidAccessError", objArgs.message);
                    });
                }
            });
        });
    });
    asyncTest("Opening ObjectStore", 1, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName, 1).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        ok(true, "Object store open");
                        // Work around for chrome, if nothing gets queried, the transaction gets aborted.
                        //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                        //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                        objArgs[1].get(1);
                        //}
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Opening non existing ObjectStore", 2, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName, 1).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], "anOtherObjectStore").then(function (objArgs) {
                        ok(false, "Object store open");
                        // Work around for chrome, if nothing gets queried, the transaction gets aborted.
                        //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                        //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                        objArgs[1].get(1);
                        //}
                    }, function (objArgs) {
                        equal(objArgs.type, "NotFoundError", objArgs.message);
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Opening ObjectStore not in transaction scope", 2, function () {
        initionalSituation2ObjectStore(function () {
            linq2indexedDB.core.db(dbName, 1).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], anOtherObjectStoreName).then(function (objArgs) {
                        ok(false, "Object store open");
                        // Work around for chrome, if nothing gets queried, the transaction gets aborted.
                        //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                        //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                        objArgs[1].get(1);
                        //}
                    }, function (objArgs) {
                        equal(objArgs.type, "NotFoundError", objArgs.message);
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Deleting ObjectStore", 2, function () {
        initionalSituationObjectStore(function () {
            // Delete database if existing
            linq2indexedDB.core.db(dbName, 2).then(function (args) {
                if (!args[0].objectStoreNames.contains(objectStoreName)) {
                    ok(true, "Object store is no longer present.");
                }
                args[0].close();
                start();
            }, function () {
                ok(false, "Database error");
                start();
            }, function (args) {
                if (args[1].type == "upgradeneeded") {
                    linq2indexedDB.core.deleteObjectStore(args[0], objectStoreName).then(function () {
                        ok(true, "Object store deleted");
                    }, function () {
                        ok(false, "Deleting object store failed");
                    });
                }
            });
        });
    });
    asyncTest("Deleting Non existing objectStore", 2, function () {
        initionalSituation(function () {
            // Delete database if existing
            linq2indexedDB.core.db(dbName, 2).then(function (args) {
                if (!args[0].objectStoreNames.contains(objectStoreName)) {
                    ok(true, "Object store is no longer present.");
                }
                args[0].close();
                start();
            }, function (args) {
                equal(args.type, "AbortError", args.message);
                start();
            }, function (args) {
                if (args[1].type == "upgradeneeded") {
                    linq2indexedDB.core.deleteObjectStore(args[0], objectStoreName).then(function () {
                        ok(false, "Object store deleted");
                    }, function (objArgs) {
                        equal(objArgs.type, "NotFoundError", objArgs.message);
                    });
                }
            });
        });
    });
    asyncTest("Deleting ObjectStore in readwrite transaction", 1, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName, 1).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (/*transArgs*/) {
                    //ok(false, "transaction completed");
                    //transArgs[0].db.close();
                    //start();
                }, function () {
                    ok(false, "transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.deleteObjectStore(transArgs[0], "obj").then(function () {
                        ok(false, "object store deleted");
                        transArgs[0].db.close();
                        start();
                    }, function (objArgs) {
                        equal(objArgs.type, "InvalidStateError", objArgs.message);
                        transArgs[0].db.close();
                        start();
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
});