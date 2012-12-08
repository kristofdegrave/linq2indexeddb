$(document).ready(function () {
    module("Transaction");
    asyncTest("Opening transaction", 3, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], objectStoreName).then(function (transArgs) {
                    ok(true, "Transaction commited");
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    args[0].close();
                    start();
                }, function (transArgs) {
                    ok(true, "Transaction open");

                    if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE) {
                        equal(transArgs[0].mode, "readonly");
                    } else {
                        equal(transArgs[0].mode, linq2indexedDB.core.transactionTypes.READ_ONLY);
                    }

                    // Work around for chrome, if nothing gets queried, the transaction gets aborted.
                    //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                    //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        objArgs[1].get(1);
                    });
                    //} 
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Opening readonly transaction", 3, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_ONLY).then(function (transArgs) {
                    ok(true, "Transaction commited");
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    args[0].close();
                    start();
                }, function (transArgs) {
                    ok(true, "Transaction open");
                    // Work around for chrome, if nothing gets queried, the transaction gets aborted.

                    if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE) {
                        equal(transArgs[0].mode, "readonly");
                    } else {
                        equal(transArgs[0].mode, linq2indexedDB.core.transactionTypes.READ_ONLY);
                    }

                    //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                    //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        objArgs[1].get(1);
                    });
                    //} 
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Opening readwrite transaction", 3, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName], linq2indexedDB.core.transactionTypes.READ_WRITE).then(function (transArgs) {
                    ok(true, "Transaction commited");
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    args[0].close();
                    start();
                }, function (transArgs) {
                    ok(true, "Transaction open");

                    if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE) {
                        equal(transArgs[0].mode, "readwrite");
                    } else {
                        equal(transArgs[0].mode, linq2indexedDB.core.transactionTypes.READ_WRITE);
                    }

                    // Work around for chrome, if nothing gets queried, the transaction gets aborted.
                    //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                    //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        objArgs[1].get(1);
                    });
                    //} 
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Aborting transaction", 2, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [objectStoreName]).then(function (transArgs) {
                    ok(false, "Transaction commited");
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "abort", transArgs.message);
                    args[0].close();
                    start();
                }, function (transArgs) {
                    ok(true, "Transaction open");
                    if (transArgs[0].__active) {
                        linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                            objArgs[1].get(1);
                        });
                    }
                    transArgs[0].abort();

                });
                start();
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Opening transaction - without objectStore", 1, function () {
        initionalSituationObjectStore(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], []).then(function (transArgs) {
                    ok(false, "Transaction commited");
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "InvalidAccessError", transArgs.message);
                    args[0].close();
                    start();
                }, function (transArgs) {
                    ok(false, "Transaction open");
                    // Work around for chrome, if nothing gets queried, the transaction gets aborted.
                    //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                    //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                    linq2indexedDB.core.objectStore(transArgs[0], objectStoreName).then(function (objArgs) {
                        objArgs[1].get(1);
                    });
                    //} 
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Opening transaction - non existing objectStore", 1, function () {
        var anOtherObjectStore = "anOtherObjectStore";
        initionalSituation(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [anOtherObjectStore]).then(function (transArgs) {
                    ok(false, "Transaction commited");
                    transArgs[0].db.close();
                    start();
                }, function (transArgs) {
                    equal(transArgs.type, "NotFoundError", transArgs.message);
                    args[0].close();
                    start();
                }, function () {
                    ok(false, "Transaction open");
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
    asyncTest("Opening transaction - non existing objectStore - autoGenerateAllowed", 3, function () {
        var anOtherObjectStore = "anOtherObjectStore";
        initionalSituation(function () {
            linq2indexedDB.core.db(dbName).then(function (args) {
                linq2indexedDB.core.transaction(args[0], [anOtherObjectStore], linq2indexedDB.core.transactionTypes.READ_ONLY, true).then(function (transArgs) {
                    ok(true, "Transaction commited");
                    transArgs[0].db.close();
                    start();
                }, function () {
                    ok(false, "Transaction error");
                    args[0].close();
                    start();
                }, function (transArgs) {
                    ok(true, "Transaction open");

                    if (transArgs[0].db.objectStoreNames.contains(anOtherObjectStore)) {
                        ok(true, "Object store present");
                    }

                    // Work around for chrome, if nothing gets queried, the transaction gets aborted.
                    //if (linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.GOOGLE
                    //    || linq2indexedDB.core.implementation == linq2indexedDB.core.implementations.SHIM) {
                    linq2indexedDB.core.objectStore(transArgs[0], anOtherObjectStore).then(function (objArgs) {
                        objArgs[1].get(1);
                    });
                    //}
                });
            }, function () {
                ok(false, "Database error");
                start();
            });
        });
    });
});



