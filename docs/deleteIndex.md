# deleteIndex
The deleteIndex function deletes an index on an object store in the indexeddb database.
## Parameters
* objectStore: 
	* A object store or a object store promise object
* indexName
	* The name of the index or The name of the property on which the index is based
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The index was deleted successfully
	* The first argument contains transaction.
	* The second argument contains the indexName
	* The third argument contains the object store
* Error callback
	* Deleting the index failed
	* The argument object contains a custom error object.
## Errors
* InvalidStateError:
	* You are trying to delete an index in a non VERSION_CHANGE transaction.
* NotFoundError
	* The index you are trying to delete wasn't found
## Example
{{
linq2indexedDB.core.db("name", 1).then(
function (){},
function (){}
function (args){
    var transaction = args[0](0);
    if(args[1](1).type == 'upgradeneeded'){
         var objectStorePromise = linq2indexedDB.core.objectStore(transaction, "objectstore");
         linq2indexedDB.core.deleteIndex(objectStorePromise, "propertyname").then(success, error);
    }
});

function success(args){
   var transaction= args[0](0);
   var indexname= args[1](1);
   var objectstore = args[2](2);
}
function error(args){
   var error= args;
}
}}