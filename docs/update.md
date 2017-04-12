# update
The update function updates data in an object store in the indexeddb database. If the primaryKey value doesn't exist yet, the data will get inserted.
## Parameters
* objectstore: 
	* An object store or an object store promise object.
* data
	* The object you want to store
* key:
	* The primary key for the object of no keyPath is defined and autoincrement is turned off on the object store.
	* Optional
		* Default: undefined 
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The object is updated successfully
	* The first argument contains the object with the primarykey (if the object store is defined with a keyPath).
	* The second argument contains the primarykey for the object.
	* The third argument contains the transaction.
	* The forth argument contains the original indexeddb event arguments
* Error callback
	* Retrieving data failed
	* The argument object contains a custom error object.
## Errors
* DataError
	* The provided key isn't a valid key or key range.
	* Or an external key is provided while the object store expects a keyPath key
	* Or the provided key isn't a valid key (must be an array, string, date or number).
* ReadOnlyError
	* You are trying to remove data in a readonly transaction.
* TransactionInactiveError
	* You are trying to open a cursor outside or on an inactive transaction.
* DataCloneError
	* The data you are trying to insert could not be cloned. Your data probably contains a function which can not be cloned by default. Try using the serialize method to insert the data.
* InvalidStateError
	* You are trying to modify data on a removed object store.
## Example
{{
var dbpromise = linq2indexedDB.core.db("name", 1);
var transactionPromise = linq2indexedDB.core.transaction(dbpromise, ["objectstore"](_objectstore_));
var objectStorePromise = linq2indexedDB.core.objectStore(transactionPromise, "objectstore");
linq2indexedDB.core.update(objectStorePromise, {}, 1).then(success, error);
function success(args){
   var data = args[0](0); 
   var primaryKey= args[1](1); 
   var transaction= args[2](2);
   var orignalevent = args[3](3);
}
function error(args){
   var error= args;
}
}}