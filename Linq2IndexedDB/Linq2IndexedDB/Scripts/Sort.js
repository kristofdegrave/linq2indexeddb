﻿/// <reference path="jquery-1.7.1.js" />
/// <reference path="jquery-1.7.1-vsdoc.js" />

onmessage = function (event) {
    var data = event.data.data;
    var propertyName = event.data.propertyName;
    var desc = event.data.descending;

    //if (!$.isArray(data)) {
    //    data = [data];
    //}

    postMessage(data.sort(JSONComparer(propertyName, desc).sort));
    return;
};

function JSONComparer(propertyName, descending) {
    return {
        sort: function (valueX, valueY) {
            if (descending) {
                return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? -1 : 1));
            }
            else{
                return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? 1 : -1));
            }
        }
    }
}