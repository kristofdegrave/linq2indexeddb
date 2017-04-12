# get
The get function retrieves data for a given key out of the indexeddb database.
## Parameters
* source: 
	* An object store, an object store promise object, an index or an index promise object
* key:
	* A key or [keyRange](keyRange) as filter on an index. 
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The object was retrieved successfully
	* The first argument contains the object fot the given key.
	* The second argument contains the transaction.
	* The third argument contains the original indexeddb event arguments
* Error callback
	* Retrieving data failed
	* The argument object contains a custom error object.
## Errors
* DataError
	* The provided key isn't a valid key or key range.
* TransactionInactiveError
	* You are trying to open a cursor outside or on an inactive transaction.
* InvalidStateError
	* You are trying to modify data on a removed object store.
## Example
{{
var dbpromise = linq2indexedDB.core.db("name", 1);
var transactionPromise = linq2indexedDB.core.transaction(dbpromise, ["objectstore"](_objectstore_));
var objectStorePromise = linq2indexedDB.core.objectStore(transactionPromise, "objectstore");
linq2indexedDB.core.get(objectStorePromise, 1).then(success, error);
function success(args){
   var data = args[0](0); 
   var transaction= args[1](1);
   var orignalevent = args[2](2);
}
function error(args){
   var error= args;
}
}}