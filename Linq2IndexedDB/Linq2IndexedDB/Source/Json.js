// ReSharper disable InconsistentNaming
(function (linq2indexedDB) {
// ReSharper restore InconsistentNaming
    "use strict";

    function jsonComparer(propertyName, descending) {
        return {
            sort: function (valueX, valueY) {
                if (descending) {
                    return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? -1 : 1));
                } else {
                    return ((valueX[propertyName] == valueY[propertyName]) ? 0 : ((valueX[propertyName] > valueY[propertyName]) ? 1 : -1));
                }
            }
        };
    }

    function serialize(key, value) {
        if (typeof value === 'function') {
            return value.toString();
        }
        //if (value instanceof Date){
        //    return "/Date(" + value.getTime() + ")/"
        //}
        return value;
    }

    function deserialize(key, value) {
        if (value && typeof value === "string" && value.substr(0, 8) == "function") {
            var startBody = value.indexOf('{') + 1;
            var endBody = value.lastIndexOf('}');
            var startArgs = value.indexOf('(') + 1;
            var endArgs = value.indexOf(')');

            return new Function(value.substring(startArgs, endArgs), value.substring(startBody, endBody));
        }
        if(/^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/.test(value)){
            return new Date(value);
        }

        return value;
    }

    function getPropertyValue(data, propertyName) {
        var structure = propertyName.split(".");
        var value = data;
        for (var i = 0; i < structure.length; i++) {
            if (value) {
                value = value[structure[i]];
            }
        }
        return value;
    }

    function setPropertyValue(data, propertyName, value) {
        var structure = propertyName.split(".");
        var obj = data;
        for (var i = 0; i < structure.length; i++) {
            if (i != (structure.length - 1)) {
                obj[structure[i]] = {};
                obj = obj[structure[i]];
            }
            else {
                obj[structure[i]] = value;
            }
        }
        return obj;
    }

    linq2indexedDB.json = {
        comparer: jsonComparer,
        serialize: serialize,
        deserialize: deserialize,
        getPropertyValue: getPropertyValue,
        setPropertyValue: setPropertyValue
    };
})(linq2indexedDB);