# Getting started
Opening a connection to the IndexedDB can simply be done by creating a new Linq2IndexedDB object. The most simple way to do this is by only passing the name of the database you want to adress. If the database doesn't exists, it will be created for you.

{{
var dbContext = new linq2indexedDB.DbContext("dbName");
}} When you only provide a database name, the framework is marked auto create. This means everything you need (object store or index) will be created when called. If it didn't exist already ofcourse.

If you prefere to control the databasestructure, you can do this by adding a database configuration object when you create the database connection. 

{{
var dbContext = new linq2indexedDB.DbContext("dbName", dbConfig);
}} Ways to configure the database can be found in the chapter [Database Configuration](Database-Configuration)

With a third optinal parameter, you can define if you want to make use of the IndexedDB viewer. The viewer allows you to take a look inside your database while debugging. You can see the following information:
* The linq2IndexedDB configuration
* The name of the database
* The current version of the database
* Object stores present in the database (configuration and data)
* Indexes present in the database (configuration and data)
{{
var dbContext = new linq2indexedDB.DbContext("dbName", dbConfig, true);
}} This option is by default set to false, this is because this information needs to be refreshed everytime something changes in the database. For more information about the viewer: [http://www.kristofdegrave.be/2012/07/linq2indexeddb-debugging-indexeddb.html](http://www.kristofdegrave.be/2012/07/linq2indexeddb-debugging-indexeddb.html)

The linq2indexedDB object has the following namespaces
* [linq](linq) (version 1.0.*, obsolete)
* [core](core) (version 1.1.*)
* [DbContext](DbContext) (version 1.1.*)
* [Event](Event) (version 1.1.*)
* [filters](filters) (version 1.1.*)
* [json](json) (version 1.1.*)
* [logging](logging) (version 1.1.*)
* [promises](promises) (version 1.1.*)
* [worker](worker) (version 1.1.*)
Information on how to use the framework can be found on the following blogpost:
[http://www.kristofdegrave.be/2012/05/using-linq-to-indexed-db.html](http://www.kristofdegrave.be/2012/05/using-linq-to-indexed-db.html)