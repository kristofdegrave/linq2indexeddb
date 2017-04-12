# index
The index function retrieves an index on an object store in the indexeddb database.
## Parameters
* objectStore: 
	* An object store or a object store promise object
* propertyName
	* The name of the property on which the index is based
* autoGenerateAllowed
	* Boolean value indicating if non existing index may be created.
	* Optional
		* Default: false
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The index was retrieved successfully
	* The first argument contains transaction.
	* The second argument contains the index.
	* The third argument contains the object store.
* Error callback
	* Retrieving the index failed
	* The argument object contains a custom error object.
## Errors
* NotFoundError
	* The index with the given name wasn't found.
* TransactionInactiveError
	* You are trying to open an index outside or on an inactive transaction.
## Example
{{
var dbpromise = linq2indexedDB.core.db("name", 1);
var transactionPromise = linq2indexedDB.core.transaction(dbpromise, ["objectstore"](_objectstore_));
var objectStorePromise = linq2indexedDB.core.objectStore(transactionPromise, "objectstore");
linq2indexedDB.core.index(objectStorePromise, "property").then(success, error);
function success(args){
   var transaction= args[0](0);
   var index = args[1](1);
   var objectstore= args[2](2);
}
function error(args){
   var error= args;
}
}}