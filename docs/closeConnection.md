# closeConnection
The closeConnection function closes the connection to the indexedDB database. 
## Parameters
* target: 
	* A cursor object (IDBCursor)
	* A database object (IDBDatabase)
	* A transaction object (IDBTransaction)
	* An object store object (IDBObjectStore)
	* An index object (IDBIndex)
	* A dbRequest object (IDBRequest)
## Example
{{
var dbpromise = linq2indexedDB.core.db("name", 1).then(success);
function success(args){
   var db = args[0](0); 
   linq2indexedDB.core.closeConnection(db);
}
}}