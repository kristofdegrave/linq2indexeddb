# logging
The logging namspace contains functionality for logging information to the console.
## Properties
### enabled
Indicates if the logging is enabled
### severity
Enumeration indecation the severity of the items you want to log. Values:
* information
* warning
* error
* exception
## function
### debug
This function enables or disables the logging.
* The first argument accepts a boolean value indicating if logging should be enabled.
### log
This function logs something to the console.
* The first argument accepts the severity
* All following arguments are written to the console.
### logError
This functions logs an error to the console
* The first argument accepts an error object.