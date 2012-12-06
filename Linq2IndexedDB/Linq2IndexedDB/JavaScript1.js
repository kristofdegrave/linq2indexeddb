var w = typeof window !== "undefined" ? window : undefined;

function test(window) {
    if (typeof window === "undefined") {
        onmessage = function (event) {
            postMessage(event.data);
            return;
        };
    }
    else {
        var worker = new Worker("JavaScript1.js");
        worker.onmessage = function (event) {
            alert(event.data)
            worker.terminate();
        };
        worker.postMessage("test");
    }

}

test(w);