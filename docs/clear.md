# clear
The clear function removes all data in an object store in the indexeddb database. 
## Parameters
* objectstore: 
	* An object store or an object store promise object.
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The object is removed successfully
	* The first argument contains the result.
	* The second argument contains the transaction.
	* The third argument contains the original indexeddb event arguments
* Error callback
	* Retrieving data failed
	* The argument object contains a custom error object.
## Errors
* ReadOnlyError
	* You are trying to remove data in a readonly transaction.
* TransactionInactiveError
	* You are trying to open a cursor outside or on an inactive transaction.
* InvalidStateError
	* You are trying to modify data on a removed object store.
## Example
{{
var dbpromise = linq2indexedDB.core.db("name", 1);
var transactionPromise = linq2indexedDB.core.transaction(dbpromise, ["objectstore"](_objectstore_));
var objectStorePromise = linq2indexedDB.core.objectStore(transactionPromise, "objectstore");
linq2indexedDB.core.clear(objectStorePromise,).then(success, error);
function success(args){
   var result= args[0](0); 
   var transaction= args[1](1);
   var orignalevent = args[2](2);
}
function error(args){
   var error= args;
}
}}