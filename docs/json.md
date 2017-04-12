# json
The json namespace contains helper functions for json objects
## Functions
### comparer
The comparer method creates a new comparer for sorting a list of objects by a property. 
* The first argument accepts the name of the property you want to sort on.
* The second argument accepts a boolean indicating if the sort must be descending
* Returns a sort function

{{
array.sort(linq2indexDB.json.comparer("property", false).sort)
}}
### serialize
The serialize method is a json replacer method for serializing javascript function. For more information see [mdn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

{{
var jsonObj = {
   func: function(){ return ""; }
}
var function = JSON.stringify(jsonObj, linq2indexedDB.json.serialize)
}}
### deserialize
The deserialize method is a json reviver method for deserializing javascript function. For more information see [mdn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)

{{
var jsonString = "{ func: function(){ return ""; } }"
var function = JSON.parse(jsonString, linq2indexedDB.json.serialize)
}}
### getPropertyValue
The getPropertyValue method gets a property value of an object.
* The first argument accepts the object
* The second argument accepts the propertyname
	* By using a "." you can address properties of an property that is an object

{{
var data = {
    obj: { name: "indexedDB" }
}
var value = linq2indexedDB.json.getPropertyValue(data, "obj.name")
}}
### setPropertyValue
The setPropertyValue method sets a property value on an object.
* The first argument accepts the object
* The second argument accepts the propertyname
	* By using a "." you can address properties of an property that is an objet
* The third argument accepts the value you want to set

{{
var data = {
    obj: { name: "" }
}
var object = linq2indexedDB.json.setPropertyValue(data, "obj.name", "indexedDB")
}}