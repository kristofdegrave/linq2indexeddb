# promises
The linq2indexedDB.promises exposes an object which is a wrapper around a given promise object. This can be [jQuery implementation](http://api.jquery.com/category/deferred-object/) or [WinJS implementation](http://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx). More information can be found on this [blogpost](http://www.kristofdegrave.be/2012/08/promises-jquery-deferred-object-vs.html).

It is also possible to plugin your own promise object.
## Own promise provider
# Extend the linq2indexedDB.promises namespace with a promise function accepting a callback function.
# Create a new Promise of your own promise
# Invoke the callback function inside the yout own promise. And provide an object with the following functions. All functions have 2 parameters, the context and an array args containing all arguments passed.
## complete: calls the complete callback of your own promise inside.
## error: calls the error callback of your own promise inside.
## progrress: calls the progress callback of your own promise inside.

{{
function customPromise(callback) {
     return new CustomPromise(function(completed, error, progress) {
         callback({
             complete: function(context, args) {
                 completed(args);
             },
             error: function(context, args) {
                 error(args);
             },
             progress: function(context, args) {
                 progress(args);
             }
         });
     });
}

linq2indexedDB.promises = {
     promise: customPromise
};
}}