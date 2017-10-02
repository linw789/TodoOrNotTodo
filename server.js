"use strict";

const fs = require("fs");
const express = require("express");
const todorw = require("./todorw.js");

let app = express();
app.use(express.static("public"));

function simpleRespond(res, errCode, errMessage) {
    res.writeHead(errCode);
    res.end(errMessage);
}

app.get("/", function(req, res) {
    fs.readFile('index.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': data.length});
        res.write(data);
        res.end();
    });
});

app.get("/favicon.ico", function(req, res) {
    simpleRespond(res, 404, "No Favorite Icon.");
});

app.get("/todoslist.json", function(req, res) {
    let and = todorw.readTodosList();
    and.done(function onFulfilled(todosStr) {
        res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': todosStr.length});
        res.write(todosStr);
        res.end();
    }, function onRejected(err) {
        simpleRespond(res, 500, err.message);
    });
});

app.post("/addnewtodo", function(req, res) {
    let reqbody = [];
    req.on("data", (chunk) => {
        // TODO: Test body length for overflow.
        reqbody.push(chunk);
    });

    req.on("end", () => {
        reqbody = Buffer.concat(reqbody).toString();
        if (reqbody === "") {
            simpleRespond(res, 400, "empty request body");
            return;
        }

        let and = todorw.add(reqbody);
        and.done(function onFulfilled(timestamp) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain");
            let timestampStr = timestamp.toString();
            res.setHeader("Context-Length", timestampStr.length);
            res.write(timestampStr);
            res.end();
        }, function onRejected(err) {
            simpleRespond(res, 500, err.message);
        });
    });
});

app.post("/tododone", function(req, res) {
    let reqbody = [];
    req.on("data", (chunk) => {
        // TODO: Test body length for overflow.
        reqbody.push(chunk);
    });

    req.on("end", () => {
        reqbody = Buffer.concat(reqbody).toString();
        if (reqbody === "") {
            simpleRespond(res, 400, "empty request body");
            return;
        }

        let and = todorw.done(reqbody);
        and.done(function onFulfilled(todoChanged) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            let todoitemStr = JSON.stringify(todoChanged);
            res.setHeader("Context-Length", todoitemStr.length);
            res.write(todoitemStr);
            res.end();
        }, function onRejected(err) {
            simpleRespond(res, 500, err.message);
        });
    });
});

app.post("/todowontdo", function(req, res) {
    let reqbody = [];
    req.on("data", (chunk) => {
        // TODO: Test body length for overflow.
        reqbody.push(chunk);
    });

    req.on("end", () => {
        reqbody = Buffer.concat(reqbody).toString();
        if (reqbody === "") {
            simpleRespond(res, 400, "empty request body");
            return;
        }

        let and = todorw.wontdo(reqbody);
        and.done(function onFulfilled(todoChanged) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            let todoitemStr = JSON.stringify(todoChanged);
            res.setHeader("Context-Length", todoitemStr.length);
            res.write(todoitemStr);
            res.end();
        }, function onRejected(err) {
            simpleRespond(res, 500, err.message);
        });
    });
});

app.post("/tododelete", function(req, res) {
    let reqbody = [];
    req.on("data", (chunk) => {
        // TODO: Test body length for overflow.
        reqbody.push(chunk);
    });

    req.on("end", () => {
        reqbody = Buffer.concat(reqbody).toString();
        if (reqbody === "") {
            simpleRespond(res, 400, "empty request body");
            return;
        }

        let and = todorw.del(reqbody);
        and.done(function onFulfilled(todoIdStr) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Context-Length", todoIdStr.length);
            res.write(todoIdStr);
            res.end();
        }, function onRejected(err) {
            simpleRespond(res, 500, err.message);
        });
    });
});

const port = process.env.PORT || 1337;
app.listen(port);
