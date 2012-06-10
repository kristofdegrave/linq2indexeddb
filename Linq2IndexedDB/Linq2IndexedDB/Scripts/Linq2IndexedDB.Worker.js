/// <reference path="jquery-1.7.2.js" />

onmessage = function (event) {
    var data = event.data.data;
    var filters = event.data.filters || [];
	var sortClauses = event.data.sortClauses || [];
	var returnData = [];

	for (var i = 0; i < data.length; i++) {
		if (isValid(data[i], filters)) {
			returnData = insert(returnData, data[i], sortClauses);
		}
	}

	postMessage(returnData);
	return;
};

// Filtering
function isValid(data, filters){
	// For now only and is supported.
	for (var i = 0; i < filters.length; i++) {
		if(!filterFactory[filters[i].filter.name](data, filters[i])){
			return false;
		}
	}
	return true;
}

// Sorting
function insert(array, data, sortClauses){
	var newArray = [];
	var valueAdded = false;
	if (array.length == 0 || sortClauses.length == 0) {
		newArray = array;
		newArray.push(data);
		valueAdded = true;
	}
	else {
		for (var i = 0; i < array.length; i++) {
			for (var j = 0; j < sortClauses.length; j++) {
				var valueX = array[i];
				var valueY = data;

				if(valueX[sortClauses[j].propertyName] != valueY[sortClauses[j].propertyName]){
					if ((sortClauses[j].descending && valueX[sortClauses[j].propertyName] > valueY[sortClauses[j].propertyName])
						|| (!sortClauses[j].descending && valueX[sortClauses[j].propertyName] < valueY[sortClauses[j].propertyName])) {
						newArray.push(valueX);
					}
					else {
						if (!valueAdded) {
							valueAdded = true;
							newArray.push(valueY);
						}
						newArray.push(valueX);
					}
				}
			}
		}

		// Add at the end
		if (!valueAdded) {
			newArray.push(data);
		}
	}

	return newArray;
}


var filterFactory = {
	equals: function (data, filter) {
		return data[filter.propertyName] == filter.value;
	},
	between: function (data, filter) {
		return (data[filter.propertyName] > filter.minValue || (filter.minValueIncluded && data[filter.propertyName] == filter.minValue))
			&& (data[filter.propertyName] < filter.maxValue || (filter.maxValueIncluded && data[filter.propertyName] == filter.maxValue));
	},
	greaterThan: function (data, filter) {
		return data[filter.propertyName] > filter.value || (filter.valueIncluded && data[filter.propertyName] == filter.value);
	},
	smallerThan:  function (data, filter) {
		return data[filter.propertyName] < filter.value || (filter.valueIncluded && data[filter.propertyName] == filter.value);
	},
	inArray:  function (data, filter) {
		return filter.value.indexOf(data[filter.propertyName]) >= 0;
	},
	like:  function (data, filter) {
		return data[filter.propertyName].indexOf(filter.value) >= 0
	}
}

