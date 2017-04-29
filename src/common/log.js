const Log = {
    debug() { console.debug(arguments); },
    error() { console.error(arguments); },
    exception() { console.error(arguments); },
    info() { console.log(arguments); },
    warn() { console.warn(arguments); }
};

export default Log;
