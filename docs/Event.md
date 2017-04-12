# Event
The event object creates a new event.
## Functions
* AddListener
	* Adds a listener for an event of a certain type
	* The first argument accepts the type of the event
	* The second argument accepts a callback that is called when an event of the type occures
* fire
	* Triggers an event
	* The first argument contains the eventdata, including the type as property
* RemoveListener
	* Removes a listener for an event of a certain type
	* The first argument accepts the type of the event
	* The second argument accepts the callback you want to remove