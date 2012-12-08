var dbName = "TestDatabase";
var objectStoreName = "objectStore";
var anOtherObjectStoreName = "anOtherObjectStoreName";
var indexProperty = "name";
var insertData = { test: "insertData", name: "name", Id: 1 };
var msgCreatingInitialSituationFailed = "Creating initial situation failed";

function initionalSituation(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        callBack();
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationDatabase(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName, 1).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationDatabaseVersion(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName, 2).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationObjectStore(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName, 1).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName).then(function () {
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituation2ObjectStore(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName).then(function () {
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
                linq2indexedDB.core.createObjectStore(args[0], anOtherObjectStoreName).then(function () {
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationObjectStoreNoAutoIncrement(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName, { autoIncrement: false }).then(function () {
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationObjectStoreKeyPath(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName, { autoIncrement: false, keyPath: "Id" }).then(function () {
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationObjectStoreKeyPathAutoIncrement(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName, { autoIncrement: true, keyPath: "Id" }).then(function () {
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationObjectStoreWithData(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName).then(function (objectStoreArgs) {
                    linq2indexedDB.core.insert(objectStoreArgs[1], insertData);
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationObjectStoreNoAutoIncrementWithData(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName, { autoIncrement: false }).then(function (objectStoreArgs) {
                    linq2indexedDB.core.insert(objectStoreArgs[1], insertData, insertData.Id);
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationObjectStoreKeyPathWithData(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName, { autoIncrement: false, keyPath: "Id" }).then(function (objectStoreArgs) {
                    linq2indexedDB.core.insert(objectStoreArgs[1], insertData);
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationObjectStoreKeyPathAutoIncrementWithData(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName, { autoIncrement: true, keyPath: "Id" }).then(function (objectStoreArgs) {
                    linq2indexedDB.core.insert(objectStoreArgs[1], insertData);
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationObjectStoreIndexUniqueWithData(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName).then(function (objectStoreArgs) {
                    linq2indexedDB.core.createIndex(objectStoreArgs[1], indexProperty, { unique: true }).then(function () {
                        linq2indexedDB.core.insert(objectStoreArgs[1], insertData);
                    }, function () {
                        ok(false, msgCreatingInitialSituationFailed);
                        start();
                    });
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });

            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationIndex(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createIndex(linq2indexedDB.core.createObjectStore(args[0], objectStoreName), indexProperty).then(function () {
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}
function initionalSituationIndexWithData(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createIndex(linq2indexedDB.core.createObjectStore(args[0], objectStoreName), indexProperty).then(function (indexArgs) {
                    linq2indexedDB.core.insert(indexArgs[2], insertData);
                }, function () {
                    ok(false, msgCreatingInitialSituationFailed);
                    start();
                });
            }
        });
    }, function () {
        ok(false, msgCreatingInitialSituationFailed);
        start();
    });
}