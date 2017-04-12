# deleteDb
The deleteDb function removes the indexeddb database. 
## Parameters
* name: 
	* The name of the database.
## Returns
The function returns a promise object with 3 callbacks
* Success callback
	* The database is removed successfully
	* The first argument contains the result
	* The second argument contains the original indexeddb event arguments.
	* The third argument contains the name of the database
* Error callback
	* Retrieving data failed
	* The argument object contains a custom error object.
* Progress callback
	* The remove of the database is blocked.
	* The first argument contains the type ("blocked")
	* The second argument contains the original indexeddb event arguments.
## Errors
## Example
{{
var dbpromise = linq2indexedDB.core.deleteDb("name").then(success, error, progress);
function success(args){
   var result = args[0](0); 
   var orignalevent = args[1](1);
   var name = args[2](2);
}
function error(args){
   var error= args;
}
function progress(args){
   var type= args[0](0);
   var orignalevent = args[1](1);
}
}}