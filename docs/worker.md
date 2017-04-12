# worker
The worker namspace contains functionality for executing the sort and filter functionality for the datacontext that can't be done by the indexedDB. This is async if the worker API is present, otherwise this is executed in the UI worker.
## Properties
### location
The location of the worker file. (This is a reference to the linq2indexeddb.js)
This location is retrieved automatically. If this isn't correct you can overwrite the default location by setting this property.
## function
### worker
This functions filters and sorts an array of data objects. This function is an internal function used by the datacontext and not optimized to call directly.
* The first argument expects the data array you want to filter and sort
* The second argument expects an array with the filters you want to apply. For more information about the filters see [here](filters)
* The third argument expects an array with the sort objects
	* propertyName: this is the name of the property you want to filter
	* descending: boolean value indicating you want to sort descending.
* The forth argument expects an integer value to limit the results
	* Default: undefined