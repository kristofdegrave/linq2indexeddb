# transaction
The transaction function creates a new transaction on the indexeddb database.
## Parameters
* db: 
	* A database connection or a db promise object
* objectStoreNames
	* A list of object store names which will be inside the scope of the transaction. Only the object stores defined can be accessed inside the transaction.
* transactionType
	* The mode of the transaction. (See [transactionTypes](transactionTypes))
	* Optional
		* Default is READ_ONLY
* autoGenerateAllowed
	* Boolean value indicating if non existing object stores passed in the objectStoreNames parameter may be created.
	* Optional
		* Default is false
## Returns
The function returns a promise object with 3 callbacks
* Success callback
	* The transaction was closed successfully
	* The first argument contains transaction.
	* The second argument contains the original indexeddb event arguments
* Error callback
	* Opening transaction failed
	* The argument object contains a custom error object.
* Progress callback
	* The transaction is opened.
	* The first argument contains the transaction.
## Errors
* AbortError
	* The transaction was aborted.
* ConstraintError
	* A mutation operation in the transaction failed.
* InvalidAccessError
	* You are trying to open a transaction without providing an object store as scope
* NotFoundError
	* You are trying to open a transaction for object stores that don't exist.
* QuotaExceededError
	* The size quota of the indexedDB database is reached.
* UnknownError
	* An I/O exception occured.
## Example
{{
var dbpromise = linq2indexedDB.core.db("name", 1);
linq2indexedDB.core.transaction(dbpromise, ["objectstore"](_objectstore_)).then(success, error, progress);
function success(args){
   var transaction= args[0](0);
   var originalEvent = args[1](1);
}
function error(args){
   var error= args;
}
function progress(args){
   var transaction= args[0](0);
}
}}