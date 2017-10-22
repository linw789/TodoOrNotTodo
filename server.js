"use strict";

const express = require("express");
const fs = require("fs");
const mongoose = require('mongoose');
const Item = require('./model/item');

// todo item status
const TD_CREATED = 0;
const TD_DONE = 1;
const TD_WONTDO = 2;

const app = express();
app.use(express.static("public"));

mongoose.connect('mongodb://garyzhan:Yuwe1Zh2nm@ds127105.mlab.com:27105/todoornottodo');

function simpleRespond(res, errCode, errMessage) {
    res.writeHead(errCode);
    res.end(errMessage);
}

app.get("/", function(req, res) {
    fs.readFile('index.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    });
});

app.get("/favicon.ico", function(req, res) {
    simpleRespond(res, 404, "No Favorite Icon.");
});

app.get('/api/todo', (req, res) => {
    Item.find((err, items) => {
        if (err) {
            res.send(err);
        }
        res.json(items);
    });
});

app.post("/api/todo", function(req, res) {
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

        const item = new Item();
        item.description = reqbody;
        item.status = TD_CREATED;
        item.priority = 0;
        item.startTime = Date.now();
        item.endTime = 0;

        item.save((err) => {
            if (err) {
                res.send(err);
            }
            res.send(item.startTime.toString());
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
            res.write(todoitemStr);
            res.end();
        }, function onRejected(err) {
            simpleRespond(res, err.statusCode, err.message);
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
            res.write(todoitemStr);
            res.end();
        }, function onRejected(err) {
            simpleRespond(res, err.statusCode, err.message);
        });
    });
});

app.post("/todoedit", function(req, res) {
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

        let data = JSON.parse(reqbody);
        let todoIdStr = data["st"];
        let todoStr = data["desc"];

        let and = todorw.edit(todoIdStr, todoStr);
        and.done(function onFulfilled(todoIdStr) {
            res.statusCode = 200;
            res.write(todoIdStr);
            res.end();
        }, function onRejected(err) {
            simpleRespond(res, err.statusCode, err.message);
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
            res.write(todoIdStr);
            res.end();
        }, function onRejected(err) {
            simpleRespond(res, err.statusCode, err.message);
        });
    });
});

const port = process.env.PORT || 1337;
app.listen(port);
