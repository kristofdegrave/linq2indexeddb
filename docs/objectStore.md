# objectStore
The objectStore function opens an object store in the indexeddb database.
## Parameters
* transaction: 
	* A transaction or a transaction promise object
* objectStoreName
	* The name of the object store you want to retrieve
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The object store was retrieved successfully
	* The first argument contains transaction.
	* The second argument contains the object store
* Error callback
	* Opening the object store failed
	* The argument object contains a custom error object.
## Errors
* NotFoundError
	* The object store with the given name wasn't found.
* TransactionInactiveError
	* You are trying to open an object store outside or on an inactive transaction.
## Example
{{
var dbpromise = linq2indexedDB.core.db("name", 1);
var transactionPromise = linq2indexedDB.core.transaction(dbpromise, ["objectstore"](_objectstore_));
linq2indexedDB.core.objectStore(transactionPromise, "objectstore").then(success, error);
function success(args){
   var transaction= args[0](0);
   var objectstore= args[1](1);
}
function error(args){
   var error= args;
}
}}