# getKey
The getKey function retrieves the primary key for a given key on an index out of the indexeddb database.
## Parameters
* index: 
	* An index or an index promise object
* key:
	* A key or [keyRange](keyRange) as filter on an index. 
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The object was retrieved successfully
	* The first argument contains the primaryKey for the given key.
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
var indexPromise = linq2indexedDB.core.objectStore(objectStorePromise , "prop");
linq2indexedDB.core.getKey(objectStorePromise, "propvalue").then(success, error);
function success(args){
   var primaryKey= args[0](0); 
   var transaction= args[1](1);
   var orignalevent = args[2](2);
}
function error(args){
   var error= args;
}
}}