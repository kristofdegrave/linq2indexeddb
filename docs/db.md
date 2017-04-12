# db
The db function creates a new connection to the indexeddb database. If the given name doesn't exists, it creates a new database.
## Parameters
* databasename: 
	* The name of the database you want to connect.
* version: 
	* Optional
	* The version of the database you want to open. 
		* If no version is provided the database will be opend in the current version. 
		* If version is higher than the current version, an onupgradeneeded callback will be called before opening
		* If version is lower than the current version, a version error will be thrown. (VersionError)
## Returns
The function returns a promise object with 3 callbacks
* Success callback
	* Opening the database connection was successfull
	* The first argument contains the database object.
	* The second argument contains the original indexeddb event arguments
* Error callback
	* Opening the database connection failed
	* The argument object contains a custom error object.
* Progress callback
	* Opening the dabaseconnection throw a upgradeneeded or blocked event
	* The first argument contains the VERSION_CHANGE transaction if the upgradeneeded event is thrown
	* The second argument contains the Original indexeddb event args. (contains the type of the event) 
## Errors
* VersionError
	* You are trying to open the database in a lower version than the current version
* AbortError
	* The VERSION_CHANGE transaction was aborted.
* InvalidAccessError
	* You are trying to open a database with a negative version number
## Example
{{
linq2indexedDB.core.db("name", 1).then(success, error, progress);
function success(args){
   var db = args[0](0);
   var originalEvent = args[1](1);
}
function error(args){
   var error= args;
}
function progress(args){
   var transaction= args[0](0);
   var originalEvent = args[1](1);
   var type = originalEvent.type;
}
}}