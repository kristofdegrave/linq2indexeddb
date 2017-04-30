/*import Log from "./log";

export default class Event {

    constructor(name) {
        this._name = name;
        this._callbacks = [];
    }

    addHandler(cb) {
        this._callbacks.push(cb);
    }

    removeHandler(cb) {
        const idx = this._callbacks.findIndex(item => item === cb);

        if (idx >= 0) {
            this._callbacks.splice(idx, 1);
        }
    }

    raise(...params) {
        Log.debug('Raising event: ' + this._name);
        for (let cb of this._callbacks) {
            cb(...params);
        }
    }
}*/