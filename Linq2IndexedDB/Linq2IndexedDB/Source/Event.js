/// <reference path="_references.js" />

// ReSharper disable InconsistentNaming
(function (linq2indexedDB) {
// ReSharper restore InconsistentNaming
    //Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
    //MIT License
    function eventTarget() {
        this._listeners = {};
    }

    eventTarget.prototype = {
        constructor: eventTarget,
        addListener: function (type, listener) {
            if (!linq2indexedDB.util.isArray(type)) {
                type = [type];
            }

            for (var i = 0; i < type.length; i++) {
                if (typeof this._listeners[type[i]] == "undefined") {
                    this._listeners[type[i]] = [];
                }

                this._listeners[type[i]].push(listener);
            }
        },
        fire: function (event) {
            if (typeof event == "string") {
                event = { type: event };
            }
            if (!event.target) {
                event.target = this;
            }

            if (!event.type) { //false
                throw new Error("Event object missing 'type' property.");
            }

            if (this._listeners[event.type] instanceof Array) {
                var listeners = this._listeners[event.type];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].call(this, event);
                }
            }
        },
        removeListener: function (type, listener) {
            if (!linq2indexedDB.util.isArray(type)) {
                type = [type];
            }

            for (var j = 0; j < type[j].length; j++) {
                if (this._listeners[type[j]] instanceof Array) {
                    var listeners = this._listeners[type[j]];
                    for (var i = 0, len = listeners.length; i < len; i++) {
                        if (listeners[i] === listener) {
                            listeners.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
    };
    // End copyright

    linq2indexedDB.Event = eventTarget;
})(linq2indexedDB);