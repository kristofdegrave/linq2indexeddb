var dbName = "TestDatabase";
var objectStoreName = "objectStore";
var anOtherObjectStoreName = "anOtherObjectStoreName";
var indexProperty = "name";
var insertData = { test: "insertData", name: "name", Id: 1 };
var msgCreatingInitialSituationFailed = "Creating initial situation failed";

var cursorData1 = { id: 1, string: "string1", numeric: 1, array: ["value1", "value11"], object: { property: "property1" }, date: Date.now() };
var cursorData2 = { id: 2, string: "string2", numeric: 2, array: ["value2", "value12"], object: { property: "property1" }, date: Date.now() };
var cursorData3 = { id: 3, string: "string3", numeric: 3, array: ["value3", "value13"], object: { property: "property1" }, date: Date.now() };
var cursorData4 = { id: 4, string: "string4", numeric: 4, array: ["value4", "value14"], object: { property: "property1" }, date: Date.now() };
var cursorData5 = { id: 5, string: "string5", numeric: 5, array: ["value5", "value15"], object: { property: "property1" }, date: Date.now() };

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
function initionalSituationCursor(callBack) {
    linq2indexedDB.core.deleteDb(dbName).then(function () {
        linq2indexedDB.core.db(dbName).then(function (args) {
            args[0].close();
            callBack();
        }, function () {
            ok(false, msgCreatingInitialSituationFailed);
            start();
        }, function (args) {
            if (args[1].type == "upgradeneeded") {
                linq2indexedDB.core.createObjectStore(args[0], objectStoreName, { autoIncrement: false, keyPath: "id" }).then(function (objectStoreArgs) {
                    linq2indexedDB.core.insert(objectStoreArgs[1], cursorData1);
                    linq2indexedDB.core.insert(objectStoreArgs[1], cursorData2);
                    linq2indexedDB.core.insert(objectStoreArgs[1], cursorData3);
                    linq2indexedDB.core.insert(objectStoreArgs[1], cursorData4);
                    linq2indexedDB.core.insert(objectStoreArgs[1], cursorData5);
                    linq2indexedDB.core.createIndex(objectStoreArgs[1], "string");
                    linq2indexedDB.core.createIndex(objectStoreArgs[1], "numeric");
                    linq2indexedDB.core.createIndex(objectStoreArgs[1], "array");
                    linq2indexedDB.core.createIndex(objectStoreArgs[1], "object");
                    linq2indexedDB.core.createIndex(objectStoreArgs[1], "date");
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
