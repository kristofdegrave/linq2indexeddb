# Linq2indexedDB Core
The linq2indexedDB.core is a wrapper around the indexeddb API. This is needed because not all browsers implement the spec the same way because it is still in draft. Also there is a difference between the versions within one vendor. So the purpouse of this wrapper is to have a maximum support of all browser vendors and provide more clear errors.

Because the IndexedDB API is asynchronous, the linq2indexedDB Framework, make use of promises to handle the results. This means after you call a method, you need to add callback methods to retrieve the result or errors. You do this by calling the then method on the result of the method call. Next you need to provide callback methods: 
* Success
	* called when the operation was successfull or completed
* Error 
	* called when an error occured inside the operation
* Progress 
	* called when you can hook into the operation or get progress results
For more information about promises you can take a look at the [jQuery implementation](http://api.jquery.com/category/deferred-object/) if you are using the linq2IndexedDB framework in a web application and the [WinJS implementation](http://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx) if you are using it for a Windows 8 Metro App. Due the limitations of the WinJS promises who can only handle one parameter passed to the callbacks, this parameter will be an array containing all passed arguments.

{{
promise.then(function(args){
    // Success callback, extra information is included in the args argument
}, function(args){
    // Error callback, extra information is included in the args argument
},function(args){
    // Progress callback, extra information is included in the args argument
});
}}
The linq2indexeddb core contains the following functions:
* [db](db)
* [transaction](transaction)
* [objectStore](objectStore)
* [createObjectStore](createObjectStore)
* [deleteObjectStore](deleteObjectStore)
* [index](index)
* [createIndex](createIndex)
* [deleteIndex](deleteIndex)
* [cursor](cursor)
* [keyCursor](keyCursor)
* [get](get)
* [getKey](getKey)
* [count](count)
* [insert](insert)
* [insertBatch](insertBatch) (new in v1.1.1)
* [update](update)
* [remove](remove)
* [clear](clear)
* [deleteDb](deleteDb)
* [closeConnection](closeConnection)
* [abortTransaction](abortTransaction)
* keyRange
	* [IDBKeyRange](http://www.w3.org/TR/IndexedDB/#idl-def-IDBKeyRange)
The linq2indexeddb core contains the following events:
* dbStructureChanged
	* This event is fired when something changes to the structure of the database.
	* [databaseEvents](databaseEvents) enumeration contains a list with all the different types of events that can occur.
* dbDataChanged
	* This event is fired when something changes to the data inside the database.
	* [dataEvents](dataEvents) enumeration contains a list with all the different types of events that can occur.
The linq2indexeddb core contains the following enumerations:
* [databaseEvents](databaseEvents)
* [dataEvents](dataEvents)
* [implementations](implementations)
* [transactionTypes](transactionTypes)
The linq2indexeddb core contains the following properties:
* implementation
	* Keeps the current implementation of the indexeddb. See [implementations](implementations)
* indexSuffix
	* Defines the the suffix that is added to determine the index name based on the property name.