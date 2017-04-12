# keyCursor
The keyCursor function opens a cursor for retrieving keys out of the indexeddb database.
## Parameters
* index: 
	* An index or an index promise object
* range
	* A filter for narowing the results. See [keyRange](keyRange) for more information
	* Optional
		* Default: keyRange.lowerBoud(0)
* Direction
	* The direction the cursor must move trough the results. See [w3](http://www.w3.org/TR/IndexedDB/#dfn-cursor) for more information.
	* Optional
		* Default: undefined
## Returns
The function returns a promise object with 3 callbacks
* Success callback
	* The object were retrieved successfully
	* The first argument contains an array with all objects that match the given filter.
		* key
		* primaryKey
	* The second argument contains the transaction.
	* The third argument contains the original indexeddb event arguments
* Error callback
	* Retrieving data failed
	* The argument object contains a custom error object.
* Progress callback
	* Called every time an object matches the given filter
	* The first argument contains an object with the data and possible operations on the data
		* key
			* contains the retrieved key value of the index
		* primaryKey
			* contains the primary key of the object
		* skip
			* function that skips a given number of results 
			* skip(5)
		* update
			* function that updates the current object with the given object
			* update({})
		* remove
			* function that removes the current object
			* remove()
	* The second argument contains the result object
	* The third argument contains the original indexeddb event arguments
## Errors
* DataError
	* The provided range parameter isn't a valid key or key range.
* TransactionInactiveError
	* You are trying to open a cursor outside or on an inactive transaction.
* TypeError
	* The provided directory parameter is invalid.
* InvalidStateError
	* You are trying to modify data on a removed object store.
### skip method
* DataError
	* The provided range parameter isn't a valid key or key range.
* TypeError
	* The provided count parameter is zero or a negative number.
* InvalidStateError
	* You are trying to skip data on a removed object store.
### update method
* DataError
	* The underlying object store uses in-line keys and the property in value at the object store's key path does not match the key in this cursor's position.
* ReadOnlyError
	* You are trying to update data in a readonly transaction.
* TransactionInactiveError
	* You are trying to update data outside or on an inactive transaction.
* DataCloneError
	* The data you are trying to update could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to update the data.
* InvalidStateError
	* You are trying to update data on a removed object store.
### remove method
* ReadOnlyError
	* You are trying to remove data in a readonly transaction.
* TransactionInactiveError
	* You are trying to delete data outside or on an inactive transaction.
* InvalidStateError
	* You are trying to remove data on a removed object store.
## Example
{{
var dbpromise = linq2indexedDB.core.db("name", 1);
var transactionPromise = linq2indexedDB.core.transaction(dbpromise, ["objectstore"](_objectstore_));
var objectStorePromise = linq2indexedDB.core.objectStore(transactionPromise, "objectstore");
var indexPromise = linq2indexedDB.core.objectStore(objectStorePromise , "propertyname");
linq2indexedDB.core.keyCursor(indexPromise ).then(success, error, progress);
function success(args){
   var data = args[0](0); // Array of objects [{key: "y", primaryKey: 1 }]({key_-_y_,-primaryKey_-1-})
   var transaction= args[1](1);
   var orignalevent = args[2](2);
}
function error(args){
   var error= args;
}
function progress(args){
   var data = args[0](0); // Single object {key: "x", primaryKey: 1, skip: function (number){}, update: function(obj){}, remove: function(){} }
   var result= args[1](1);
   var orignalevent = args[2](2);
}
}}