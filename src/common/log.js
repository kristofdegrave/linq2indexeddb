const NONE = 0;
const ERROR = 1;
const WARN = 2;
const INFO = 3;
const DEBUG = 4;

class Logger {
    static get NONE() {
        return NONE;
    }
    static get ERROR() {
        return ERROR;
    }
    static get WARN() {
        return WARN;
    }
    static get INFO() {
        return INFO;
    }
    static get DEBUG() {
        return DEBUG;
    }
    static get noLogger() {
        return {
            debug() { },
            error() { },
            info() { },
            warn() { }
        };
    }
    constructor() {
        this.reset();
    }

    reset() {
        this._level = Logger.INFO;
        this._logger = Logger.noLogger;
    }

    get level() {
        return this._level;
    }
    set level(value) {
        if (Logger.NONE <= value && value <= Logger.DEBUG) {
            this._level = value;
        } else {
            throw new Error("Invalid log level");
        }
    }

    get logger() {
        return this._logger;
    }
    set logger(value) {
        if (!value.debug && value.info) {
            value.debug = value.info;
        }

        if (value.debug && value.info && value.warn && value.error){
            this._logger = value;
        }
        else {
            throw new Error("Invalid logger");
        }
    }
    /*get currentTime(){
        const time = new Date();

        return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`;
    }*/

    debug(...args) {
        if (this.level >= Logger.DEBUG) {
            Reflect.apply(this.logger.debug, this.logger, Array.from(args));
        }
    }
    info(...args) {
        if (this.level >= Logger.INFO) {
            Reflect.apply(this.logger.info, this.logger, [...args]);
        }
    }
    warn(...args) {
        if (this.level >= Logger.WARN) {
            Reflect.apply(this.logger.warn, this.logger, [...args]);
        }
    }
    error(...args) {
        if (this.level >= Logger.ERROR) {
            Reflect.apply(this.logger.error, this.logger, [...args]);
        }
    }
    setDebugLevel() {
        this.level = Logger.DEBUG;
    }
    setErrorLevel() {
        this.level = Logger.ERROR;
    }
    setInfoLevel() {
        this.level = Logger.INFO;
    }
    setWarnLevel() {
        this.level = Logger.WARN;
    }
}

const Log = new Logger();

export default Log;
