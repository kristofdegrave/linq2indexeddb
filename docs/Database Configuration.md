# Database Configuration
The first thing the configuration object needs is a version. This version is used to determine in which version the database must work.

{{
var dbConfig = { version: 1 } 
}}
The second thing you need is a way to create/define the database structure. For this there are 4 ways:
* onupgradeneeded event
* schema object
* definition object
* onversion change event
## onupgradeneeded
This a function that gets called when the database needs to get updated to the most recent version you provided in the configuration object. 3 parameters are passed to this function:
* Transaction: on this transaction you can create/delete object stores and indexes 
* The current version of the database 
* The version the database is upgrading to.
{{
dbConfig.onupgradeneeded = function (transaction, oldVersion, newVersion){   
    // Code to upgrade the db structure   
}
}}
This event can't be used in combination with the other configuration options. For more info how to create your structure see chapter [core](core)
## schema
The schema is an object which defines the several versions as a key/value. The key keeps the version it targets and in the value an upgrade function. In this function you can add your code to upgrade the database to the version given in the key. The upgrade function has one parameter: 
* Transaction: on this transaction you can create/delete object stores and indexes
{{
dbConfig.schema = {
    1: function (transaction){   
            // Code to upgrade the db structure to version 1   
       } 
    2: function (transaction){   
           // Code to upgrade the db structure to version 2  
       }  
}
}}
Note: If the database needs to upgrade from version 0 to 2, the upgrade function of version 1 gets called first. When the upgrade to version 1 is done, the upgrade function of version 2 gets called.
## definition
The definition object is the only way to define your database structure without having to write upgrade code. The object keeps a collection of objects which describe what needs to be added or removed for a version. Each object exists out of the following properties:
* Version: The version where for the definitions are. 
* objectStores: Collection of objects that define an object store 
	* name: the name of the object store 
	* objectStoreOptions 
		* autoincrement: defines if the key is handled by the database 
		* keyPath: the name of the property that keeps the key for the object store
			* If a keyPath is defined and the autoIncrement is set to true, then the key will be added to the data as value of the keyPath property when inserting data.
	* remove: indicates if the object store must be removed
* indexes: Collection of objects that define an index 
	* objectStoreName: the name of the object store where the index needs to be created on 
	* propertyName: the name of the property where for we want to add an index 
	* indexOptions 
		* unique: defines if the value of this property needs to be unique 
		* multirow: Defines the way keys are handled that have an array value in the key
		* indexName: The name of the index
	* remove: indicates if the index must be removed
* defaultData: Collection of default data that needs to be added in the version 
	* objectStoreName: the name of the object store where we want to add the data 
	* data: the data we want to add 
	* key: the key of the data 
	* remove: indicates if the data needs to be removed
{{
dbConfig.definition= [{ 
    version: 1,
    objectStores: [{ name: "ObjectStoreName"
                         , objectStoreOptions: { autoIncrement: false, keyPath: "Id" } }]
    indexes: [{ objectStoreName: "ObjectStoreName"
                  , propertyName: "PropertyName"
                  , indexOptions: { unique: false, multirow: false } }], 
defaultData: [{ objectStoreName: ObjectStoreName
                    , data: { Id: 1, Description: "Description1" 
                    , remove: false },  
                    { objectStoreName: ObjectStoreName
                    , data: { Id: 2, Description: "Description2" }
                    , remove: false }, 
                   { objectStoreName: ObjectStoreName
                   , data: { Id: 3, Description: "Description3" }
                   , remove: false }]
}];
}}
## onversionchange
This a function that gets called when the database needs to get updated to the most recent version you provided in the configuration object. But in contrast to the onupgradeneeded callback, this function can be called multiple times. For example if an database is upgrading from version 0 to version 2, the onversionchange will be called 2 times. Once for version 1 and once for version 2.  2 parameters are passed to the function:
* Transaction: on this transaction you can create/delete object stores and indexes 
* The version of the database it is upgrading to.
{{
dbConfig.onversionchange = function (transaction, version){  
    // Code to upgrade the db structure
}
}}