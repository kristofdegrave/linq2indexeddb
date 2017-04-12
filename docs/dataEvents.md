# dataEvents
The following type of data events can occure:
* **dataInserted**
	* Occures when data is inserted to an object store.
	* The data property of the event args contains the data that is inserted
	* The objectstore property contains the objectstore where the data is inserted
* **dataUpdated**
	* Occures when data is updated in an object store.
	* The data property of the event args contains the data that is updated
	* The objectstore property contains the objectstore where the data is updated
* **dataRemoved**
	* Occures when data is removed in an object store.
	* The data property of the event args contains the key of the data that was removed
	* The objectstore property contains the objectstore where the data is removed
* **objectStoreCleared**
	* Occures when an object store is cleared.
	* The objectstore property contains the objectstore which is cleared