# abortTransaction
The abortTransaction function closes aborts a transaction the indexedDB database. 
## Parameters
* transaction: 
	* The transaction you want to abort.
## Example
{{
var dbpromise = linq2indexedDB.core.db("name", 1)
linq2indexedDB.core.transaction(dbpromise, "objectstore").then(progress);
function success(args){
   var transaction = args[0](0); 
   linq2indexedDB.core.abortTransaction(transaction);
}
}}