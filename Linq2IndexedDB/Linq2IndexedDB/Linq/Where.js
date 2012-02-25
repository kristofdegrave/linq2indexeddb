/// <reference path="../Scripts/jquery-1.7.1.js" />
/// <reference path="../Scripts/jquery-1.7.1-vsdoc.js" />

var whereType = {
    equals: 0,
    between: 1,
    greaterThen: 2,
    smallerThen: 3
}

onmessage = function (event) {
    var data = event.data.data;
    var clause = event.data.clause;
    var returnData = [];

    for (var i = 0; i < data.length; i++) {
        if (clause) {
            switch (clause.type) {
                case whereType.equals:
                    if (data[i][clause.propertyName] == clause.value) {
                        returnData.push(data[i]);
                    }
                    break;
                case whereType.between:
                    var add = false;

                    if (clause.minValueIncluded) {
                        if (data[i][clause.propertyName] >= clause.minValue) {
                            add = true;
                        }
                    }
                    else {
                        if (data[i][clause.propertyName] > clause.minValue) {
                            add = true;
                        }
                    }

                    if (add) {
                        if (clause.maxValueIncluded) {
                            if (data[i][clause.propertyName] <= clause.maxValue) {
                                returnData.push(data[i]);
                            }
                        }
                        else {
                            if (data[i][clause.propertyName] < clause.maxValue) {
                                returnData.push(data[i]);
                            }
                        }
                    }

                    break;
                case whereType.greaterThen:
                    if (clause.valueIncluded) {
                        if (data[i][clause.propertyName] >= clause.value) {
                            returnData.push(data[i]);
                        }
                    }
                    else {
                        if (data[i][clause.propertyName] > clause.value) {
                            returnData.push(data[i]);
                        }
                    }
                    break;
                case whereType.smallerThen:
                    if (clause.valueIncluded) {
                        if (data[i][clause.propertyName] <= clause.value) {
                            returnData.push(data[i]);
                        }
                    }
                    else {
                        if (data[i][clause.propertyName] < clause.value) {
                            returnData.push(data[i]);
                        }
                    }
                    break;
                default:
                    returnData.push(data[i]);
                    break;
            }
        }
        else {
            returnData.push(data[i]);
        }
    }

    postMessage(returnData);
    return;
};