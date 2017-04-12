# deleteObjectStore
The deleteObjectStore function deletes anobjectStore on the indexeddb database.
## Parameters
* transaction: 
	* A transaction or a transaction promise object
* objectStoreName
	* The name of the object store you want to create
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The object store was deleted successfully
	* The first argument contains transaction.
	* The second argument contains the objectStoreName
* Error callback
	* Deleting the object store failed
	* The argument object contains a custom error object.
## Errors
* InvalidStateError:
	* You are trying to delete an object store in a non VERSION_CHANGE transaction.
* NotFoundError
	* The object store you are trying to delete wasn't found
## Example
{{
linq2indexedDB.core.db("name", 1).then(
function (){},
function (){}
function (args){
    var transaction = args[0](0);
    if(args[1](1).type == 'upgradeneeded'){
         linq2indexedDB.core.deleteObjectStore(transaction, "objectstore").then(success, error);
    }
});

function success(args){
   var transaction= args[0](0);
   var objectstorename= args[1](1);
}
function error(args){
   var error= args;
}
}}