# Filters
## Built-in filters
The linq2indexedDB library has some built-in filters to filter your data. Some of them will take advantage of the IndexedDB API in some cases. This is when an index for the property you want to filter on exists, it isn't part of an or statement and its the first added filter. In all other cases the filtering will happen on an other thread by using webworkers. It is advised to take advantage of the indexeddb filtering as mutch as possible for performance.

The following filters are available:
* [#equals](#equals) (IndexedDB filter, if it fits the conditions above)
* [#between](#between) (IndexedDB filter, if it fits the conditions above)
* [#greatherThan](#greatherThan) (IndexedDB filter, if it fits the conditions above)
* [#smallerThan](#smallerThan) (IndexedDB filter, if it fits the conditions above)
* [#like](#like)
* [#inArray](#inArray)
* [#isUndefined](#isUndefined)
### equals {anchor:equals}
The equals method exepts a single value as argument. This value will be compared with the value of the property in the object.

{{
db.linq.from("ObjectStoreName").where("name").equals("Kristof")
}}
## Custom filters
You can extend the default list of filters by adding your own. To do this you need to provide 3 parameters to the addFilter method.
# A name for your filter
# The function that contains the filter logic
## The first paramter contains the object on which you apply the filter
## The second paramet contains the filtermetadata (contains the propertyname you are filtering on and own provided fields)
# The filter callback function. This returns a function that calles the previous defined function, but allows you to provide metadata to the filter function
## The first parameter contains the callback method
## The second parameter contains the querybuilder object. (this object is used when executing the query)
## The third parameter contains the filtermetadata object.
{{
linq2indexedDB.linq.addFilter("myFilter", function(data, filter) {
                    return linq2indexedDB.json.getPropertyValue(data, filter.propertyName) == filter.value
                }, function(callback, queryBuilder, filterMetaData) {
                    return function(value) {
                        filterMetaData.value = value;
                        return callback(queryBuilder, filterMetaData);
                    };
                });
}}
Once defined the function can be calles by his name.

{{
db.linq.from("ObjectStoreName").where("name").myFilter("Kristof")
}}