$(document).ready(function () {
    module("Indexes");
    asyncTest("Creating Index", 4, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName, 2).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        // Work around for chrome, if nothing gets queried, the transaction gets aborted.

                        //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                        //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                        objArgs[1].get(1);
                        //}
                        if (objArgs[1].indexNames.contains(indexProperty + linq2indexedDB.core.indexSuffix)) {
                            ok(true, "Index present");
                        }
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            }, function (args) {
                if (args[1].type == "upgradeneeded") {
                    linq2indexedDB.core.createIndex(linq2indexedDB.core.objectStore(args[0], objectStoreName), indexProperty).then(function (indexArgs) {
                        ok(true, "Index created");
                        equals(indexArgs[1].name, indexProperty + linq2indexedDB.core.indexSuffix);
                        equals(indexArgs[1].keyPath, indexProperty);
                    }, function () {
                        ok(false, "Creating index failed");
                    });
                }
            });
        });
    });
    asyncTest("Creating Index with options", 6, function () {
        var unique = true;
        var multiEntry = true;
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName, 2).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        // Work around for chrome, if nothing gets queried, the transaction gets aborted.

                        //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                        //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                        objArgs[1].get(1);
                        //}
                        if (objArgs[1].indexNames.contains(indexProperty + linq2indexedDB.core.indexSuffix)) {
                            ok(true, "Index present");
                        }
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            }, function (args) {
                if (args[1].type == "upgradeneeded") {
                    linq2indexedDB.core.createIndex(linq2indexedDB.core.objectStore(args[0], objectStoreName), indexProperty, { unique: unique, multiEntry: multiEntry }).then(function (indexArgs) {
                        ok(true, "Index created");
                        equals(indexArgs[1].name, indexProperty + linq2indexedDB.core.indexSuffix, "index name");
                        equals(indexArgs[1].keyPath, indexProperty, "index keyPath");
                        if (indexArgs[1].unique) {
                            equals(indexArgs[1].unique, unique, "index unique attribute");
                        }
                        else {
                            ok(true, "Index unique: attribute not implemented");
                        }
                        if (indexArgs[1].multiEntry || indexArgs[1].multiRow) {
                            equals(indexArgs[1].multiEntry || indexArgs[1].multiRow, multiEntry, "index multiEntry attribute");
                        }
                        else {
                            ok(true, "Index multiEntry: attribute not implemented");
                        }
                    }, function () {
                        ok(false, "Creating index failed");
                    });
                }
            });
        });
    });
    asyncTest("Opening Index", 1, function () {
        initionalSituationIndex(function () {
            // Delete database if existing
            linq2indexedDB.core.db(dbName, 2).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.index(objArgs[1], indexProperty).then(function (indexArgs) {
                            ok(true, "Index open");

                            //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                            //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                            indexArgs[1].get(1);
                            //}
                        }, function () {
                            ok(false, "Index error");
                            start();
                        });
                    }, function () {
                        ok(false, "Object store error");
                        start();
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Opening Index - non existing index", 2, function () {
        var anotherIndex = "anotherIndex";
        initionalSituationIndex(function () {
            // Delete database if existing
            linq2indexedDB.core.db(dbName, 2).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.index(objArgs[1], anotherIndex).then(function () {
                            ok(false, "Index open");
                            start();
                        }, function () {
                            ok(true, "Index error");
                            start();
                        });
                    }, function () {
                        ok(false, "Object store error");
                        start();
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Opening Index - non existing index - autoGenerateAllowed", 1, function () {
        var anotherIndex = "anotherIndex";
        initionalSituationIndex(function () {
            // Delete database if existing
            linq2indexedDB.core.db(dbName, 2).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function () {
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        linq2indexedDB.core.index(objArgs[1], anotherIndex, true).then(function (indexArgs) {
                            ok(true, "Index open");

                            //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                            //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                            indexArgs[1].get(1);
                            // }

                            indexArgs[0].db.close();
                            start();
                        }, function () {
                            ok(false, "Index error");
                            start();
                        });
                    }, function () {
                        ok(false, "Object store error");
                        start();
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Deleting Index", 2, function () {
        initionalSituationIndex(function () {
            // Delete database if existing
            linq2indexedDB.core.db(dbName, 2).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    start();
                }, function (transArgs) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        // Work around for chrome, if nothing gets queried, the transaction gets aborted.
                        //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                        //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                        objArgs[1].get(1);
                        //}
                        if (!objArgs[1].indexNames.contains(indexProperty + linq2indexedDB.core.indexSuffix)) {
                            ok(true, "Index is no longer present");
                        }
                    });
                });
            }, function () {
                ok(false, "Database error");
                start();
            }, function (args) {
                if (args[1].type == "upgradeneeded") {
                    linq2indexedDB.core.deleteIndex(linq2indexedDB.core.objectStore(args[0], objectStoreName), indexProperty).then(function () {
                        ok(true, "Index deleted");
                    }, function () {
                        ok(false, "Deleting index failed");
                    });
                }
            });
        });
    });
});