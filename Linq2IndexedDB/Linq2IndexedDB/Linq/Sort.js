/// <reference path="../Scripts/jquery-1.7.1.js" />
/// <reference path="../Scripts/jquery-1.7.1-vsdoc.js" />
/// <reference path="../Linq/Linq2IndexedDB.js" />

importScripts('../Linq/Linq2IndexedDB.js');

onmessage = function (event) {
    var data = event.data.data;
    var propertyName = event.data.propertyName;
    var desc = event.data.descending;

    //if (!$.isArray(data)) {
    //    data = [data];
    //}

    var returnData = data.sort($.linq2indexedDB.fn.JSONComparer(propertyName, desc).sort)
    postMessage(returnData);
    return;
};