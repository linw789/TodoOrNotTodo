"use strict";

//==========================================
// A custom, incomplete implementation of Javascript Promise/A+, named And.
// Mostly inspired by the article "Javascript Promises ... In Wicked Detail" (http://www.mattgreer.org/articles/promises-in-wicked-detail/).
//==========================================

const AND_STATE_PENDING = 0;
const AND_STATE_FULFILLED = 1;
const AND_STATE_REJECTED = 2;

function noop() {}

let AndId = 0;

function And(fn) {
    if (typeof this !== "object") {
        throw new TypeError("And must be constructed via new.");
    }
    if (typeof fn !== "function") {
        throw new TypeError("And constructor's argument is not a function.");
    }

    this._state = AND_STATE_PENDING;
    this._result = undefined;
    this._id = ++AndId; // for debugging
    this._deferred = null;

    if (fn === noop) {
        return;
    }

    let me = this;
    fn(function fulfill(val) {
        _fulfill(me, val);
    }, function reject(reason) {
        _reject(me, reason);
    });
}

function _resolve(and, deferred_) {
    if (and._state === AND_STATE_PENDING) {
        and._deferred = deferred_;
    } else {
        setImmediate(function() {
            let deferredCallback = null;
            if (and._state === AND_STATE_FULFILLED) {
                deferredCallback = deferred_.onFulfilled;
            } else {
                deferredCallback = deferred_.onRejected;
            }

            if (typeof deferredCallback !== "function") {
                if (and._state === AND_STATE_REJECTED) {
                    _reject(deferred_.chainedAnd, and._result);
                } else {
                    _fulfill(deferred_.chainedAnd, and._result);
                }
                return;
            }

            let val;
            try {
                val = deferredCallback(and._result);
            } catch (e) {
                if (deferred_.chainedAnd) {
                    _reject(deferred_.chainedAnd, e);
                } else {
                    throw e;
                }
                return;
            }

            if (!deferred_.chainedAnd) {
                return;
            }

            if (and._state === AND_STATE_FULFILLED) {
                _fulfill(deferred_.chainedAnd, val);
            } else if (val && val.recovered === true) {
                _fulfill(deferred_.chainedAnd, val.newVal);
            } else {
                _reject(deferred_.chainedAnd, val);
            }
        }, 0);
    }
}

function _fulfill(and, val) {
    if (val && typeof val.then === "function") {
        val.then(function onFulfilled(val) {
            _fulfill(and, val);
        }, function onRejected(reason) {
            _reject(and, reason);
        });
    } else {
        and._state = AND_STATE_FULFILLED;
        and._result = val;
        if (and._deferred) {
            _resolve(and, and._deferred);
        }
    }
}

function _reject(and, reason) {
    and._state = AND_STATE_REJECTED;
    and._result = reason;
    if (and._deferred) {
        _resolve(and, and._deferred);
    }
}

And.prototype.then = function(onFulfilled, onRejected) {
    let and = new And(noop);
    let deferred = { onFulfilled: onFulfilled, onRejected: onRejected, chainedAnd: and };
    _resolve(this, deferred);
    return and;
}

And.prototype.done = function(onFulfilled, onRejected) {
    let deferred = { onFulfilled: onFulfilled, onRejected: onRejected };
    _resolve(this, deferred);
}

module.exports = And;
