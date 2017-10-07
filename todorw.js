"use strict";

//==========================================
// Todo json file reader and writer
//==========================================

const fs = require("fs");
const And = require("./and.js");

const S3 = require("aws-sdk/clients/s3");

let keys = JSON.parse(fs.readFileSync("aws_keys.json"));
const s3 = new S3({ apiVersion: "2006-03-01", region: "us-west-1", accessKeyId: keys.key, secretAccessKey: keys.secretKey});

// todo item status
const TD_CREATED = 0;
const TD_DONE = 1;
const TD_WONTDO = 2;

let TodoRWStatic = {
    _s3: s3,
    _bucketName: "todo-or-not-todo",
    _todoJsonFilename: "todoslist.json",
    _todoTempJsonFilename: "todoslist.json.temp",
    _localhost: false,
};

let todorw = {};

function _todorw_read() {
    if (TodoRWStatic._localhost) {
        let and = new And(function(fulfill, reject) {
            fs.readFile(TodoRWStatic._todoJsonFilename, "utf8", function(err, data) {
                if (err) {
                    if (err.code === "ENOENT") {
                        fulfill("");
                    } else {
                        reject(err);
                    }
                } else {
                    fulfill(data);
                }
            });
        });
        return and;
    } else {
        let params = {
            Bucket: TodoRWStatic._bucketName,
            Key: TodoRWStatic._todoJsonFilename,
        };

        let and = new And(function(fulfill, reject) {
            TodoRWStatic._s3.getObject(params, function(err, data) {
                if (err) {
                    if (err.code === "NoSuchKey") {
                        fulfill("");
                    } else {
                        reject(err);
                    }
                } else {
                    fulfill(data.Body.toString());
                }
            });
        });
        return and;
    }
}

function _todorw_write(todosArray, passAlong) {
    if (TodoRWStatic._localhost) {
        let and = new And(function(fulfill, reject) {
            fs.writeFile(TodoRWStatic._todoJsonFilename, JSON.stringify(todosArray), "utf8", function(err) {
                if (err) {
                    reject(err);
                } else {
                    fulfill(passAlong);
                }
            });
        });
        return and;
    } else {
        let todosJsonStr = JSON.stringify(todosArray);
        let params = {
            Body: todosJsonStr,
            Bucket: TodoRWStatic._bucketName,
            Key: TodoRWStatic._todoJsonFilename,
        };

        let and = new And(function(fulfill, reject) {
            TodoRWStatic._s3.putObject(params, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    fulfill(passAlong);
                }
            });
        });
        return and;
    }
}

/**
 * @param {Array} todos
 * @param {number} id
 * @return number
 */
function _todorw_getById(todos, id) {
    for (let i = 0; i < todos.length; ++i) {
        let todoItem = todos[i];
        if (todoItem["st"] === id) {
            return i;
        }
    }
    return -1;
}

function _todorw_stringToArray(todosStr) {
    let todosArray = [];
    if (todosStr !== "") {
        todosArray = JSON.parse(todosStr);
    }
    return todosArray;
}

function _todorw_changeStatus(todosArray, idStr, newStatus) {
    let and = new And(function(fulfill, reject) {
        if (newStatus !== TD_DONE && newStatus !== TD_WONTDO) {
            let err = new Error("Invalid status to change");
            err.statusCode = 500;
            reject(err);
            return;
        }

        let todoId = parseInt(idStr);
        let todoIndex = _todorw_getById(todosArray, todoId);
        if (todoIndex >= 0) {
            let todoItem = todosArray[todoIndex];
            todoItem["status"] = newStatus;
            todoItem["et"] = Date.now();

            let todoChanged = {
                "status": todoItem["status"],
                "priority": todoItem["priority"],
                "st": todoItem["st"],
                "et": todoItem["et"]
            };
            let result = {
                "todos": todosArray,
                "todoChanged": todoChanged
            }
            fulfill(result);
        } else {
            let err = new Error("No todo item with id " + todoId + " is found.");
            err.statusCode = 500;
            reject(err);
        }
    });
    return and;
}

todorw.readTodosList = function() {
    let and = _todorw_read();
    return and;
}

todorw.add = function(todoStr) {
    let and = _todorw_read().then(function onFulfilled(todosStr) {
        let todosArray = _todorw_stringToArray(todosStr);
        let st = Date.now();
        let newTodoItem = {
            "desc": todoStr,
            "status": TD_CREATED,
            "priority": 0,
            "st": st,
            "et": 0
        };
        todosArray.push(newTodoItem);
        return {"todos": todosArray, "timestamp": st};
    }).then(function onFulfilled(result) {
        let writeAnd = _todorw_write(result.todos, result.timestamp);
        return writeAnd;
    });
    return and;
}

todorw.done = function(idStr) {
    let and = _todorw_read().then(function onFulfilled(todosStr) {
        let todosArray = _todorw_stringToArray(todosStr);
        let result = _todorw_changeStatus(todosArray, idStr, TD_DONE);
        return result;
    }).then(function onFulfilled(result) {
        let writeAnd = _todorw_write(result.todos, result.todoChanged);
        return writeAnd;
    });
    return and;
}

todorw.wontdo = function(idStr) {
    let and = _todorw_read().then(function onFulfilled(todosStr) {
        let todosArray = _todorw_stringToArray(todosStr);
        let result = _todorw_changeStatus(todosArray, idStr, TD_WONTDO);
        return result;
    }).then(function onFulfilled(result) {
        let writeAnd = _todorw_write(result.todos, result.todoChanged);
        return writeAnd;
    });
    return and;
}

todorw.edit = function(todoIdStr, todoStr) {
    let and = _todorw_read().then(function onFulfilled(todosStr) {
        let todosArray = _todorw_stringToArray(todosStr);
        let todoId = parseInt(todoIdStr);
        let todoIndex = _todorw_getById(todosArray, todoId);
        if (todoIndex >= 0) {
            let todoItem = todosArray[todoIndex];
            todoItem.desc = todoStr;
            return {"todos": todosArray, "todoId": todoIdStr};
        } else {
            let err = new Error("No todo item with id " + todoId + " is found.");
            err.statusCode = 500;
            throw err;
        }
    }).then(function onFulfilled(result) {
        let writeAnd = _todorw_write(result.todos, result.todoId);
        return writeAnd;
    });
    return and;
}

todorw.del = function(idStr) {
    let and = _todorw_read().then(function onFulfilled(todosStr) {
        let todosArray = _todorw_stringToArray(todosStr);
        let todoId = parseInt(idStr);
        let todoIndex = _todorw_getById(todosArray, todoId);
        if (todoIndex >= 0) {
            todosArray.splice(todoIndex, 1);
            return {"todos": todosArray, "todoId": idStr};
        } else {
            let err = new Error("No todo item with id " + todoId + " is found.");
            err.statusCode = 500;
            throw err;
        }
    }).then(function onFulfilled(result) {
        let writeAnd = _todorw_write(result.todos, result.todoId);
        return writeAnd;
    });
    return and;
}

module.exports = todorw;
