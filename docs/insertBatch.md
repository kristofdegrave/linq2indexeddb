# insertBatch
The insertBatch function adds an array of data to an object store in the indexeddb database.
## Parameters
* object store: 
	* An object store or an object store promise object.
* data
	* An array of objects you want to store
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The array of objects is stored successfully
	* The first argument contains the object with the primarykey (if the object store is defined with a keyPath).
	* The Second argument contains the transaction.
* Error callback
	* Retrieving data failed
	* The argument object contains a custom error object.
* Progress callback
	* An object of the array of objects is stored successfully
	* The first argument contains the object with the primarykey (if the object store is defined with a keyPath).
	* The second argument contains the primarykey for the object.
	* The third argument contains the transaction.
	* The forth argument contains the original indexeddb event arguments.
## Errors
* Constraint error
	* The given key already exists in the database or one of the properties has a unique index defined an you are trying to save a duplicate value for that property
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
linq2indexedDB.core.insertBatch(objectStorePromise, [{}, {}, {}]({},-{},-{})).then(success, error, progress);
function success(args){
   var dataArray = args[0](0); 
   var transaction= args[1](1);
}
function error(args){
   var error= args;
}
function progress(args){
   var data = args[0](0); 
   var primaryKey= args[1](1); 
   var transaction= args[2](2);
   var orignalevent = args[3](3);
}
}}