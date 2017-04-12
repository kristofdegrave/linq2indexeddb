# Linq2indexedDB Core
The core of the Linq2IndexedDB library is a wrapper around the current indexedDB functionality. This is necessary because not all browsers implement the indexedDB API the same way. Also in most browsers the exception thrown aren't very clear. Better errors and a uniform cross browser implementation are the main goals of this wrapper.

All functions inside the wrapper return a promise object with 2 and sometimes 3 callback methods:
* Success (called when the operation was successfull)
* Error (called when an error occured inside the operation)
* Progress (called when you can hook into the operation or get progress results)

{{
promise.then(success, error, progress);
}}

The linq2indexeddb core contains the following functions:
* [linq2indexedDB.core.db](linq2indexedDB.core.db)
* [linq2indexedDB.core.transaction](linq2indexedDB.core.transaction)
* [linq2indexedDB.core.objectStore](linq2indexedDB.core.objectStore)
* [linq2indexedDB.core.createObjectStore](linq2indexedDB.core.createObjectStore)
* [linq2indexedDB.core.deleteObjectStore](linq2indexedDB.core.deleteObjectStore)
* [linq2indexedDB.core.index](linq2indexedDB.core.index)
* [linq2indexedDB.core.createIndex](linq2indexedDB.core.createIndex)
* [linq2indexedDB.core.deleteIndex](linq2indexedDB.core.deleteIndex)
* [linq2indexedDB.core.cursor](linq2indexedDB.core.cursor)
* [linq2indexedDB.core.keyCursor](linq2indexedDB.core.keyCursor)
* [linq2indexedDB.core.get](linq2indexedDB.core.get)
* [linq2indexedDB.core.getKey](linq2indexedDB.core.getKey)
* [linq2indexedDB.core.count](linq2indexedDB.core.count)
* [linq2indexedDB.core.insert](linq2indexedDB.core.insert)
* [linq2indexedDB.core.update](linq2indexedDB.core.update)
* [linq2indexedDB.core.remove](linq2indexedDB.core.remove)
* [linq2indexedDB.core.clear](linq2indexedDB.core.clear)
* [linq2indexedDB.core.deleteDb](linq2indexedDB.core.deleteDb)
* [linq2indexedDB.core.closeConnection](linq2indexedDB.core.closeConnection)
* [linq2indexedDB.core.abortTransaction](linq2indexedDB.core.abortTransaction)
* [linq2indexedDB.core.keyRange](linq2indexedDB.core.keyRange)

The linq2indexeddb core contains the following events:
* [linq2indexedDB.core.dbStructureChanged](linq2indexedDB.core.dbStructureChanged)
* [linq2indexedDB.core.dbDataChanged](linq2indexedDB.core.dbDataChanged)

The linq2indexeddb core contains the following enumerations:
* [linq2indexedDB.core.databaseEvents](linq2indexedDB.core.databaseEvents)
* [linq2indexedDB.core.dataEvents](linq2indexedDB.core.dataEvents)
* [linq2indexedDB.core.implementations](linq2indexedDB.core.implementations)

The linq2indexeddb core contains the following properties:
* [linq2indexedDB.core.implementation](linq2indexedDB.core.implementation)
* [linq2indexedDB.core.indexSuffix](linq2indexedDB.core.indexSuffix)
