# LINQ
The linq2indexedDB.linq namespace contains all the methods to retrieve, insert, update and delete data from a database. The only condition to use the linq part, is creating a linq2indexedDB object.

{{
var db = window.linq2indexedDB("dbName");
}} This is the simplest way of creating a new linq2indexedDB object. For more (advanced) ways to create a linq2IndexedDB object look at the documentation [Homepage](http://linq2indexeddb.codeplex.com/documentation)

## Querying
Because the IndexedDB API is asynchronous, it is not possible to assign the result of the query to a variable. That is why the linq2indexedDB Framework, make use of promises to handle the results. This means after you created your query, you need to add callback methods to retrieve the result or errors. You do this by calling the then method on the query. Next you need to provide callback methods:
* The first callback will be called if the query was completed successfully
* The second callback will be called if an error occours
* The third and last callback, is a progress callback. This will be called while executing the query.
{{
db.linq.from("objectStoreName").select().then(function(args){
    // Completed callback, extra information is included in the args argument
}, function(args){
    // Error callback, extra information is included in the args argument
},function(args){
    // Progress callback, extra information is included in the args argument
});
}} For more information about promises you can take a look at the [jQuery implementation](http://api.jquery.com/category/deferred-object/) if you are using the linq2IndexedDB framework in a web application and the [WinJS implementation](http://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx) if you are using it for a Windows 8 Metro App.
### from
If you want to start querying, the first method you need to call is the from method. This method will define which object store you want to query on.
{{
db.linq.from("ObjectStoreName")
}} Once you defined the object store you want to work on, you can start querying on it. The following operations are possible:
* [#get](#get)
* [#select](#select)
* [#insert](#insert)
* [#update](#update)
* [#merge](#merge)
* [#remove](#remove)
* [#clear](#clear)
### get {anchor:get}
With the get method you can retrieve a single object by its key.
{{
db.linq.from("ObjectStoreName").get(1).then(function(args){
    // args = the value with key 1
}, function(args){
    // Error callback, extra information is included in the args argument
});
}}
### select {anchor:select}
Select multiple records from the object store. If you call the select method directly on the from, it will retrieve all records present in the object store ascending on his key. In the select method you can also take advantage of the progress callback. This callback will be called for every object that will be returned in the complete callback. In the complete callback the results are passed as an array of objects.

{{
db.linq.from("ObjectStoreName").select().then(function(args){
    // args = an array with all the values present
}, function(args){
    // Error callback, extra information is included in the args argument
}, function(args){
    // Gets called for every value present
    // args = a value from the object store
});
}} Optionally you can provide an array of property names. In this case only the provide properties will be retrieved inside an new object.

{{
db.linq.from("ObjectStoreName").select(["name", "firstname"](_name_,-_firstname_)).then(function(args){
    // args = an array with new objects with the name and firstname property the values present
    // in the object store
}, function(args){
    // Error callback, extra information is included in the args argument
}, function(args){
    // Gets called for every value present
    // args = a new object with the name and firstname property a value from the object store
});
}} In the select query you are also able to add some [#Filtering](#Filtering)(#Filtering) and [#Sorting](#Sorting)(#Sorting). This can be done by adding extra methods before calling the select method. For more info see the [#Filtering](#Filtering)(#Filtering) and [#Sorting](#Sorting)(#Sorting) section. 
### insert {anchor:insert}
Inserts an object into the object store. 

{{
db.linq.from("ObjectStoreName").insert(object).then(function(args){
    // args = the inserted object (if the objectStore has a keyPath and the autoIncrement flag is on
    // , then the key will be added to the inserted object )
}, function(args){
    // Error callback, extra information is included in the args argument
});
}} If the object store has the autoIncrement flag on, no key may be provided (not inline or external). If the autoIncrement flag is off the key needs to be provided in the object if a keyPath is defined, or added as extra argument if no keyPath is defined.

{{
db.linq.from("ObjectStoreName").insert(object, 1).then(function(args){
    // args = the inserted object 
}, function(args){
    // Error callback, extra information is included in the args argument
});
}}
### update {anchor:update}
Updates an object in the object store. 

{{
db.linq.from("ObjectStoreName").update(object).then(function(args){
    // args = the updated object 
}, function(args){
    // Error callback, extra information is included in the args argument
});
}} If a keyPath is defined, the key needs to be provided inside the object. If no keyPath is defined, the key needs to be provided as an extra argument.

{{
db.linq.from("ObjectStoreName").update(object, 1).then(function(args){
    // args = the updated object 
}, function(args){
    // Error callback, extra information is included in the args argument
});
}} If the key doesn't exist in the object store or isn't provided it the object store has the autoIncrement flag on, then the object will be inserted.
### merge {anchor:merge}
Merges extra data to an existing object in the object store. The first argument keeps the data that has to be added/replaced in the existing object. The second argument is the key of the object you want to update.

{{
db.linq.from("ObjectStoreName").merge({extraInfo: "extraInfo"}, 1).then(function(args){
    // args = the updated object 
}, function(args){
    // Error callback, extra information is included in the args argument
});
}} 
### remove {anchor:remove}
Removes an object from the object store by his key. 

{{
db.linq.from("ObjectStoreName").remove(1).then(function(args){
    // args = the key of the removed object
}, function(args){
    // Error callback, extra information is included in the args argument
});
}}
### clear {anchor:clear}
Removes all objects from the object store. 

{{
db.linq.from("ObjectStoreName").clear().then(function(){
    // clear successfull
}, function(args){
    // Error callback, extra information is included in the args argument
});
}}
## Filtering {anchor:filtering}
If you want filter your data before the operation, then you need to do this before executing your operation. Filtering is done by calling the where method. If you want to add more filters, you can make use of the "and" or "or" method who work simular as the where method.

You can make use of 2 ways to filter data. The first one is by providing a callback method. This method gets for every object that needs to be evaluated. When the callback method gets called, the object that needs to be evaluated gets passed. The return type of the method is a boolean indicating if the provided data is valid.

{{
db.linq.from("objectStoreName").where(function(data) {
    return data.propertyName = "";
}).select().then(function(args){
    // args = an array with all the values that meet the filter
}, function(args){
    // Error callback, extra information is included in the args argument
}, function(args){
    // Gets called for every value that meets the filter
    // args = a value from the object store
});
}} The second way to filter data is by adding a filter to it. In the "where", "and" & "or" method you need to pass the propertyName you want to filter on. The next thing you need to do is calling a filter. This can be a built-in filter or an own created custom filter. For more info about filters see [Filters](Filters). In the example bellow, I make use of the built-in equals-filter.

{{
db.linq.from("objectStoreName").where("propertyName"}).equals("value").select().then(function(args){
    // args = an array with all the values that meet the filter
}, function(args){
    // Error callback, extra information is included in the args argument
}, function(args){
    // Gets called for every value that meets the filter
    // args = a value from the object store
});
}} When working with filters you can also add a not condition.

{{
db.linq.from("objectStoreName").where("propertyName"}).equals("value").and("otherPropertyName").not().equals("otherValue").select().then(function(args){
    // args = an array with all the values that meet the filter
}, function(args){
    // Error callback, extra information is included in the args argument
}, function(args){
    // Gets called for every value that meets the filter
    // args = a value from the object store
});
}} 
## Sorting {anchor:sorting}
For sorting data, there are 2 methods available. One for sorting ascending (orderBy) and one for sorting descending (orderByDesc). If you want to filter data, then it must be added before calling the sort methods.

{{
db.linq.from("objectStoreName").orderBy("propertyName").select().then(function(args){
    // args = an array with all the values sorted ascending on the propertyName
}, function(args){
    // Error callback, extra information is included in the args argument
}, function(args){
    // Gets called for every value in the order defined by the orderBy method
    // args = a value from the object store
});
}} 