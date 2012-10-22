$(document).ready(function() {
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
                   , indexOptions: { unique: false, multirow: false }}
              ]
  }];

  db = window.linq2indexedDB("testDB", dbConfig, false);

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
  db.linq.from("tester").update(data);

  var bd = document.getElementById("addsomething");

  bd.addEventListener("click", function() {
    db.linq.from("tester").where("tabid").equals(4).select().then();
  }, false);
});



//MemoryLeakChecker = {


//    uniq_id: (new Date()).getTime(),
//    checked: 1,
//    is_seen: [],


//    checkLeaks: function (obj) {
//        var self = MemoryLeakChecker


//        if (!obj || (typeof obj == 'function') || self.checked > 20000)
//            return;


//        if ((self._isArray(obj) || self._isObject(obj))) {
//            if (self._isArray(obj)) {
//                self._logTooBig(obj, obj.length)
//                for (var i = 0; i < obj.length; i++) {
//                    self._checkIfNeeded(obj[i])
//                }
//            }
//            else if (self._isObject(obj)) {
//                self._logTooBig(obj, self._keys(obj).length)


//                for (var key in obj) {
//                    self._checkIfNeeded(obj[key])
//                }
//            }
//        }
//    },


//    _checkIfNeeded: function (obj) {
//        if (!obj)
//            return;


//        var self = MemoryLeakChecker;
//        self.checked++


//        if ((self._isArray(obj) || self._isObject(obj))) {
//            if (obj.__leaks_checked == self.uniq_id)
//                return;
//            if (obj.__leaks_checked)
//            obj.__leaks_checked = self.uniq_id


//            setTimeout(self._partial(self.checkLeaks, obj), 5);
//        }
//    },


//    _logTooBig: function (obj, limit) {
//        if (limit > 200) {
//            console.log('Object too big, memory leak? [size: ' + limit + ']')
//            console.log(obj)
//            console.log('-------')
//        }
//    },


//    _keys: function (obj) {
//        var rval = [], prop
//        for (prop in obj)
//            rval.push(prop)
//        return rval
//    },


//    _isArray: function (obj) {
//        try {
//            return obj instanceof Array
//        }
//        catch (e) {
//            return false
//        }
//    },


//    _isObject: function (obj) {
//        return (typeof obj == 'object')
//    },


//    _partial: function (fn) {
//        var args = Array.prototype.slice.call(arguments)
//        args.shift()
//        return function () {
//            var new_args = Array.prototype.slice.call(arguments)
//            args = args.concat(new_args)
//            return fn.apply(window, args)
//        }
//    }
//}


//MemoryLeakChecker.checkLeaks(window);

