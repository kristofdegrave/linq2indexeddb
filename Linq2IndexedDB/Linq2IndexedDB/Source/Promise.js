(function (linq2indexedDB) {
    "use strict";
    
    function Deferred(func) {
        var tuples = [
				// action, add listener, listener list, final state
				["resolve", "done", jQuery.Callbacks("once memory"), "resolved"],
				["reject", "fail", jQuery.Callbacks("once memory"), "rejected"],
				["notify", "progress", jQuery.Callbacks("memory")]
        ],
			state = "pending",
			promise = {
			    state: function () {
			        return state;
			    },
			    always: function () {
			        deferred.done(arguments).fail(arguments);
			        return this;
			    },
			    then: function ( /* fnDone, fnFail, fnProgress */) {
			        var fns = arguments;
			        return Deferred(function (newDefer) {
			            for (var i = 0; i < tuples.length; i++) {
			                var tuple = tuples[i];
			                var action = tuple[0],
								fn = fns[i];
			                // deferred[ done | fail | progress ] for forwarding actions to newDefer
			                deferred[tuple[1]](typeof (fn) === "function" ?
								function () {
								    var returned = fn.apply(this, arguments);
								    if (returned && typeof (returned.promise) === "function") {
								        returned.promise()
											.done(newDefer.resolve)
											.fail(newDefer.reject)
											.progress(newDefer.notify);
								    } else {
								        newDefer[action + "With"](this === deferred ? newDefer : this, [returned]);
								    }
								} :
								newDefer[action]
							);
			            }

			            //jQuery.each(tuples, function (i, tuple) {
			            //    var action = tuple[0],
						//		fn = fns[i];
			            //    // deferred[ done | fail | progress ] for forwarding actions to newDefer
			            //    deferred[tuple[1]](typeof (fn) === "function" ?
						//		function () {
						//		    var returned = fn.apply(this, arguments);
						//		    if (returned && typeof (returned.promise) === "function") {
						//		        returned.promise()
						//					.done(newDefer.resolve)
						//					.fail(newDefer.reject)
						//					.progress(newDefer.notify);
						//		    } else {
						//		        newDefer[action + "With"](this === deferred ? newDefer : this, [returned]);
						//		    }
						//		} :
						//		newDefer[action]
						//	);
			            //});
			            fns = null;
			        }).promise();
			    },
			    // Get a promise for this deferred
			    // If obj is provided, the promise aspect is added to the object
			    promise: function (obj) {
			        if (obj != null) {
			            for (var name in promise) {
			                if (promise[name] != undefined) {
			                    obj[name] = promise[name];
			                }
			            }
			        }
			        else {
			            return promise;
			        }
			        //return obj != null ? jQuery.extend(obj, promise) : promise;
			    }
			},
			deferred = {};

        // Keep pipe for back-compat
        promise.pipe = promise.then;

        // Add list-specific methods
        for (var i = 0; i < tuples.length; i++) {
            var tuple = tuples[i];
            var list = tuple[2],
				stateString = tuple[3];

            // promise[ done | fail | progress ] = list.add
            promise[tuple[1]] = list.add;

            // Handle state
            if (stateString) {
                list.add(function () {
                    // state = [ resolved | rejected ]
                    state = stateString;

                    // [ reject_list | resolve_list ].disable; progress_list.lock
                }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
            }

            // deferred[ resolve | reject | notify ] = list.fire
            deferred[tuple[0]] = list.fire;
            deferred[tuple[0] + "With"] = list.fireWith;
        }

        //jQuery.each(tuples, function (i, tuple) {
        //    var list = tuple[2],
		//		stateString = tuple[3];

        //    // promise[ done | fail | progress ] = list.add
        //    promise[tuple[1]] = list.add;

        //    // Handle state
        //    if (stateString) {
        //        list.add(function () {
        //            // state = [ resolved | rejected ]
        //            state = stateString;

        //            // [ reject_list | resolve_list ].disable; progress_list.lock
        //        }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
        //    }

        //    // deferred[ resolve | reject | notify ] = list.fire
        //    deferred[tuple[0]] = list.fire;
        //    deferred[tuple[0] + "With"] = list.fireWith;
        //});

        // Make the deferred a promise
        promise.promise(deferred);

        // Call given func if any
        if (func) {
            func.call(deferred, deferred);
        }

        // All done!
        return deferred;
    }

})(linq2indexedDB)