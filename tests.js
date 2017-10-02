"use strict"

const And = require("./and.js");

function assertPrint(expected, actual) {
    if (expected !== actual) {
        console.log("test failed.\nexpected:");
        console.log(expected);
        console.log("actual: ");
        console.log(actual);
        console.trace();
    }
}

let andTests = { };

andTests.test_and_thenAfterResolve = function() {
    let and = new And(function(fulfill, reject) {
        fulfill(17);
    });
    and.then(function(val) {
        assertPrint(17, val);
    });
}

andTests.test_and_thenBeforeResolve = function() {
    let and = new And(function(fulfill, reject) {
        setTimeout(function() {
            fulfill(17);
        }, 0);
    });
    and.then(function(val) {
        assertPrint(17, val);
    });
}

andTests.test_and_chainThen = function() {
    new And(function(fulfill, reject) {
        fulfill(17);
    }).then(function(val) {
        assertPrint(17, val);
        return 17 * 2;
    }).then(function(val) {
        assertPrint(34, val);
        return 34 * 2;
    }).then(function(val) {
        assertPrint(68, val);
    });
}

andTests.test_and_returnNewAndInThen = function() {
    let and1 = new And(function(fulfill) {
        fulfill(13);
    });
    let and2 = and1.then(function(val) {
        let and3 = new And(function(fulfill, reject) {
            setTimeout(function() { let val2 = val * 2; fulfill(val2); }, 0);
        });
        return and3;
    });
    and2.then(function onFulfilled(val) {
        assertPrint(26, val);
    });
}

andTests.test_and_noCallbackForThen = function() {
    let and = new And(function(fulfill, reject) {
        fulfill(13);
    });
    and.then().then(function onFulfilled(val) {
        assertPrint(13, val);
    });
}

andTests.test_and_reject = function() {
    let and = new And(function(fulfill, reject) {
        let result = {error: 404};
        reject(result);
    });
    and.then(function onFulfilled(val) {
        
    }, function onRejected(reason) {
        assertPrint(404, reason.error);
    });
}

andTests.test_and_chainReject = function() {
    function resolve(fulfill, reject) {
        let result = {error: 404};
        reject(result);
    }
    let and = new And(resolve);
    and.then(function onFulfilled(val) {

    }, function onRejected(reason) {
        reason.error += 1;
        return reason;
    }). then(function onFulfilled(val) {

    }, function onRejected(reason) {
        assertPrint(405, reason.error);
    });
}

andTests.test_and_doneOnFulfilled = function() {
    let and = new And(function(fulfill, reject) {
        fulfill(13);
    });
    and.done(function onFulfilled(val) {
        assertPrint(13, val);
    });
}

andTests.test_and_doneThrowException = function() {
    let and = new And(function(fulfill, reject) {
        fulfill(13);
    });
    try {
        and.done(function onFulfilled(val) {
            let e = val + 1;
            throw e;
        });
    } catch (e) {
        assertPrint(14, e);
    }
}

andTests.test_and_recoverFromReject = function() {
    let and = new And(function(fulfill, reject) {
        reject(13);
    });
    and.then(function onFulfilled(val) {

    }, function onRejected(reason) {
        let res = { newVal: 13 + 1, recovered: true };
        return res;
    }).then(function onFulfilled(val) {
        assertPrint(14, val);
    });;
}

for (let fn in andTests) {
    andTests[fn]();
}
