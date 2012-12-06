/// <reference path="Scripts/Linq2IndexedDB.js" />

$(document).ready(function () {
  var db;

  var dbConfig = new Object();
  dbConfig.version = 1;

  dbConfig.definition= [{
     version: 1,
     objectStores: [{ name: "tester"
                        , objectStoreOptions: { autoIncrement: false
                                              , keyPath: "url" }
                    }],
     indexes: [{ objectStoreName: "tester"
                   , propertyName: "tabid"
                   , indexOptions: { unique: false, multirow: false }},
                { objectStoreName: "tester"
                   , propertyName: "session"
                   , indexOptions: { unique: false, multirow: false }},
                { objectStoreName: "tester"
                   , propertyName: "project"
                   , indexOptions: { unique: false, multirow: false }},
                { objectStoreName: "tester"
                   , propertyName: "timeStamp"
                   , indexOptions: { unique: false, multirow: false }},
              ]
  }];

  db = new linq2indexedDB.DbContext("testDB", dbConfig, false);

  var urls = ["google", "bing", "yahoo", "reddit", "msn", "aol"];

  var data = {
  "url": "blue",
  "title": "title",
  "tabid": 4,
  "timeStamp": new Date().getTime(),
  "session": new Date().toDateString(),
  "project": -1,
  "accessTime": 0
  };
  db.tester.update(data);

  var bd = document.getElementById("addsomething");

  bd.addEventListener("click", function() {
    db.tester.where("tabid").equals(4).select().then();
  }, false);
});
