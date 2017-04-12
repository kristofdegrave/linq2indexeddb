# implementations
An enumeration containing the different indexeddb implementation:
* **NONE**
	* No indexeddb implementation was found
* **NATIVE**
	* The native unprefixed implementation of the indexedDB is used.
* **MICROSOFT**
	* The Microsoft prefixed implementation of the indexedDB is used. (msIndexedDB)
* **MOZILLA**
	* The Mozilla prefixed implementation of the indexedDB is used. (mozIndexedDB)
* **GOOGLE**
	* The Google prefixed implementation of the indexedDB is used. (webkitIndexedDB)
* **MICROSOFTPROTOTYPE**
	* The microsoft prototype implementation of the indexedDB is used. (ie 8 & 9)
* **SHIM**
	* The indexeddb shim is used. (based on websql, support for safari, Opera)
	* [http://nparashuram.com/IndexedDBShim/](http___nparashuram.com_IndexedDBShim_)