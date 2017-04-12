# createObjectStore
The createObjectStore function creates a new objectStore on the indexeddb database. If the object store all ready exists, the existing object store is retrieved.
## Parameters
* transaction: 
	* A transaction or a transaction promise object
* objectStoreName
	* The name of the object store you want to create
* objectStoreOptions
	* Extra options for creating an object store
		* keyPath: string value that defines the name of the property that keeps the key
		* autoIncrement: boolean value that enables auto creation of the key (numeric)
	* Optional
		* Default keyPath: undefined & autoIncrement: true
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The object store was created & retrieved successfully
	* The first argument contains transaction.
	* The second argument contains the object store
* Error callback
	* Creating the object store failed
	* The argument object contains a custom error object.
## Errors
* InvalidStateError:
	* You are trying to create an object store in an non VERSION_CHANGE transaction.
* InvalidAccessError
	* The object store can't have autoIncrement on and an empty string or an array with an empty string as keyPath.
## Example
{{
linq2indexedDB.core.db("name", 1).then(
function (){},
function (){}
function (args){
    var transaction = args[0](0);
    if(args[1](1).type == 'upgradeneeded'){
         linq2indexedDB.core.createObjectStore(transaction, "objectstore").then(success, error);
    }
});

function success(args){
   var transaction= args[0](0);
   var objectstore= args[1](1);
}
function error(args){
   var error= args;
}
}}