# databaseEvents
The following type of database events can occure:
* **objectStoreCreate**
	* Occures when an object store is created.
	* The data property of the event args contains the object store object
* **objectStoreRemoved**
	* Occures when an object store is removed.
	* The data property of the event args contains the object store name
* **indexCreated**
	* Occures when an index is created.
	* The data property of the event args contains the index object
* **indexRemoved**
	* Occures when an index is removed.
	* The data property of the event args contains the index name
* **databaseRemoved**
	* Occures when a database is removed.
* **databaseBlocked**
	* Occures when a database operation is blocked.
* **databaseUpgrade**
	* Occures when a database operation is upgrading to a higher version.
* **databaseOpened**
	* Occures when a database connection is opened.
	* The data property of the event args contains the database connection object