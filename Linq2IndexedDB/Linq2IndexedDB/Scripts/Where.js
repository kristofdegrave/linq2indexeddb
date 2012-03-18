/// <reference path="../Scripts/jquery-1.7.1.js" />
/// <reference path="../Scripts/jquery-1.7.1-vsdoc.js" />

var whereType = {
    equals: 0,
    between: 1,
    greaterThen: 2,
    smallerThen: 3,
    inArray: 4,
    like: 5
};

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
                case whereType.inArray:
                    if (clause.value.indexOf(data[i][clause.propertyName]) >= 0) {
                        returnData.push(data[i]);
                    }
                    break;
                case whereType.like:
                    if (data[i][clause.propertyName].contains(clause.value)) {
                        returnData.push(data[i]);
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