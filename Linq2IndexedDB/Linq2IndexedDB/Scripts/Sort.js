/// <reference path="jquery-1.7.2.js" />

onmessage = function (event) {
    var data = event.data.data;
    var propertyName = event.data.propertyName;
    var desc = event.data.descending;

    //if (!$.isArray(data)) {
    //    data = [data];
    //}

    var returnData = data.sort(JSONComparer(propertyName, desc).sort)
    postMessage(returnData);
    return;
};

function JSONComparer(propertyName, descending) {
    return {
        sort: function (valueX, valueY) {
            if (descending) {
                return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? -1 : 1));
            }
            else {
                return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? 1 : -1));
            }
        }
    }
}