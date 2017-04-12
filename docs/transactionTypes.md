# transactionTypes
An enumeration with the different types of a transaction
* **READ_ONLY**
	* Defines a read only transaction. 
	* Only read operations can be preformed in this type of transaction
* **READ_WRITE**
	* Defines a read write transaction
	* Read and write operation can be preformed in this type of transaction
* **VERSION_CHANGE**
	* Defines a version change transaction
	* Changes to the database structure can be preformed in this type of transaction
	* This transaction can't be created manually. This type of transaction is created when a database is upgrading to a higher version.