# createIndex
The createIndex function creates a new index on an object store in the indexeddb database. If the index all ready exists, the existing index is retrieved.
## Parameters
* objectStore: 
	* An object store or a object store promise object
* propertyName
	* The name of the property on which the index is based
* indexOptions
	* Extra options for creating an index
		* unique: boolean value that adds an unique constraint for the property
		* multirow: boolean value that adds all individual values inside the array of the given property as key. for more info see [http://www.kristofdegrave.be/2012/09/indexeddb-multientry-explained.html](http___www.kristofdegrave.be_2012_09_indexeddb-multientry-explained.html).
		* indexName: string value that defines the name of the index. (When not present the propertyName + a suffix is used as name.)
	* Optional
		* Default unique: false & multirow: true
## Returns
The function returns a promise object with 2 callbacks
* Success callback
	* The index was created & retrieved successfully
	* The first argument contains transaction.
	* The second argument contains the index
	* The third argument contains the object store
* Error callback
	* Creating the index failed
	* The argument object contains a custom error object.
## Errors
* InvalidStateError:
	* You are trying to create an object store in an non VERSION_CHANGE transaction.
## Example
{{
linq2indexedDB.core.db("name", 1).then(
function (){},
function (){}
function (args){
    var transaction = args[0](0);
    if(args[1](1).type == 'upgradeneeded'){
         var objectStorePromise = linq2indexedDB.core.objectStore(transaction, "objectstore");
         linq2indexedDB.core.index(objectStore, "property").then(success, error);
    }
});

function success(args){
   var transaction= args[0](0);
   var index = args[1](1);
   var objectstore= args[2](2);
}
function error(args){
   var error= args;
}
}}