"use strict";

const TD_CREATED = 0;
const TD_DONE = 1;
const TD_WONTDO = 2;

const TD_STATUS_SYMBOL_CLOCK = "\u25f7";
const TD_STATUS_SYMBOL_ELLIPSIS = "\u22ef";
const TD_STATUS_SYMBOL_CHECK = "\u2713";
const TD_STATUS_SYMBOL_CROSS = "\u2715";

function debugLog(test) {
    console.log("client debug linw: " + test);
}

function getTodoMetaString(todoitem) {
    let metaText = "priority: " + todoitem["priority"];

    let createDate = new Date(todoitem["st"]);
    metaText += " | created: " + createDate.toDateString();

    if (todoitem["status"] == TD_DONE) {
        let doneDate = new Date(todoitem["et"]);
        metaText += " | done: " + doneDate.toDateString();
    } else if (todoitem["status"] == TD_WONTDO) {
        let abandonDate = new Date(todoitem["et"]);
        metaText += " | won't do: " + abandonDate.toDateString();
    }
    
    return metaText;
}

function onHttpRequestError() {
    console.error("XMLHttpRequest error: " + this.statusText);
}

function onHttpRequestAbort() {
    console.error("XMLHttpRequest abort");
}

function buildHtml_markTodoItemGrey(todoitem) {
    let todoItemUID = todoitem["st"];
    let todoListItemElem = document.getElementById(todoItemUID);
    if (todoListItemElem !== null) {
        let todoListItemContainerElem = todoListItemElem.children[0];
        todoListItemContainerElem.className += " todo-item-grey";

        // change status symbol
        let statusSymbolPElem = todoListItemContainerElem.getElementsByClassName("todo-status-symbol"); 
        if (todoitem["status"] === TD_DONE) {
            statusSymbolPElem[0].textContent = TD_STATUS_SYMBOL_CHECK;
        } else if (todoitem["status"] === TD_WONTDO) {
            statusSymbolPElem[0].textContent = TD_STATUS_SYMBOL_CROSS;
        }

        // change to-do meta text
        let todoMetaPElem = todoListItemContainerElem.getElementsByClassName("todo-meta-text");
        todoMetaPElem[0].textContent = getTodoMetaString(todoitem);

        // remove "done", "won't do" and "edit" buttons
        let todoInfoColumnDivElem = todoListItemContainerElem.getElementsByClassName("todo-info-column")[0];
        let buttonElems = todoInfoColumnDivElem.getElementsByClassName("todo-button");
        todoInfoColumnDivElem.removeChild(buttonElems[0]);
        todoInfoColumnDivElem.removeChild(buttonElems[0]);
        todoInfoColumnDivElem.removeChild(buttonElems[0]);
    } else {
        console.error("Request received invalid todo UID");
    }
}

function buildHtml_deleteTodoItem(todoId) {
    let todoListItemElem = document.getElementById(todoId);
    if (todoListItemElem !== null) {
        let todoListElem = document.getElementById("todos");
        todoListElem.removeChild(todoListItemElem);
    } else {
        console.error("Request received invalid todo UID");
    }
}

function onHttpRequestLoad_todoDone() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            let todoitem = JSON.parse(this.responseText);
            buildHtml_markTodoItemGrey(todoitem);
        } else {
            console.error("XMLHttpRequest error. Reason: " + this.responseText);
        }
    }
}

function requestHttp_todoDone() {
    let listItemElem = this.closest("li");
    let todoUID = listItemElem.id;

    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", onHttpRequestLoad_todoDone);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("POST", "/tododone", true);

    httpReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
    httpReq.send(todoUID);
}

function onHttpRequestLoad_todoWontdo() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            let todoitem = JSON.parse(this.responseText);
            buildHtml_markTodoItemGrey(todoitem);
        } else {
            console.error("XMLHttpRequest error. Reason: " + this.responseText);
        }
    }
}

function requestHttp_todoWontdo() {
    let listItemElem = this.closest("li");
    let todoUID = listItemElem.id;

    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", onHttpRequestLoad_todoWontdo);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("POST", "/todowontdo", true);

    httpReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
    httpReq.send(todoUID);
}

function onHttpRequestLoad_todoDelete() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            let todoitem = JSON.parse(this.responseText);
            buildHtml_deleteTodoItem(todoitem);
        } else {
            console.error("XMLHttpRequest error. Reason: " + this.responseText);
        }
    }
}

function requestHttp_todoDelete() {
    let listItemElem = this.closest("li");
    let todoUID = listItemElem.id;

    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", onHttpRequestLoad_todoDelete);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("POST", "/tododelete", true);

    httpReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
    httpReq.send(todoUID);
}

function buildHtml_todoListItem(todoitem) {
    let listLiElem = document.createElement("li");
    // take the creation UTC timestamp as UID for each to-do-list item
    listLiElem.id = todoitem["st"];

    let isTodoClosed = (todoitem["status"] > TD_CREATED);

    // div layout container
    let containerDivElem = document.createElement("div");
    if (isTodoClosed) {
        containerDivElem.className = "todo-list-item-container todo-item-grey";
    } else {
        containerDivElem.className = "todo-list-item-container";
    }

    // left status column
    let todoStatusDivElem = document.createElement("div");
    todoStatusDivElem.className = "todo-status-column";

    let todoStatusSymbolPElem = document.createElement("p");
    todoStatusSymbolPElem.className = "todo-status-symbol";
    let symbolTextNode;
    switch (todoitem["status"]) {
        case TD_CREATED: {
            symbolTextNode = document.createTextNode(TD_STATUS_SYMBOL_CLOCK);
        } break;
        case TD_DONE: {
            symbolTextNode = document.createTextNode(TD_STATUS_SYMBOL_CHECK);
        } break;
        case TD_WONTDO: {
            symbolTextNode = document.createTextNode(TD_STATUS_SYMBOL_CROSS);
        } break;
        default: {
            symbolTextNode = document.createTextNode(TD_STATUS_SYMBOL_ELLIPSIS);
        } break;
    }
    todoStatusSymbolPElem.appendChild(symbolTextNode);
    todoStatusDivElem.appendChild(todoStatusSymbolPElem);

    containerDivElem.appendChild(todoStatusDivElem);

    // middle to-do info column
    let todoInfoDivElem = document.createElement("div");
    todoInfoDivElem.className = "todo-info-column";

    let todoDescPElem = document.createElement("p");
    todoDescPElem.className = "todo-desc-text";
    let todoDescTextNode = document.createTextNode(todoitem["desc"]);
    todoDescPElem.appendChild(todoDescTextNode);

    todoInfoDivElem.appendChild(todoDescPElem);

    let todoMetaPElem = document.createElement("p");
    todoMetaPElem.className = "todo-meta-text";
    let todoMetaTextNode = document.createTextNode(getTodoMetaString(todoitem));
    todoMetaPElem.appendChild(todoMetaTextNode);

    todoInfoDivElem.appendChild(todoMetaPElem);

    // add todo buttons
    if (!isTodoClosed) {
        let todoDoneButton = document.createElement("button");
        todoDoneButton.className = "todo-button";
        let todoDoneButtonTextNode = document.createTextNode("done");
        todoDoneButton.appendChild(todoDoneButtonTextNode);
        todoDoneButton.addEventListener("click", requestHttp_todoDone);
        todoInfoDivElem.appendChild(todoDoneButton);

        let todoWontdoButton = document.createElement("button");
        todoWontdoButton.className = "todo-button";
        let todoWontdoButtonTextNode = document.createTextNode("won't do");
        todoWontdoButton.appendChild(todoWontdoButtonTextNode);
        todoWontdoButton.addEventListener("click", requestHttp_todoWontdo);
        todoInfoDivElem.appendChild(todoWontdoButton);

        let todoEditButton = document.createElement("button");
        todoEditButton.className = "todo-button";
        let todoEditButtonTextNode = document.createTextNode("edit");
        todoEditButton.appendChild(todoEditButtonTextNode);
        todoInfoDivElem.appendChild(todoEditButton);
    }

    let todoDeleteButton = document.createElement("button");
    todoDeleteButton.className = "todo-button";
    let todoDeleteButtonTextNode = document.createTextNode("delete");
    todoDeleteButton.appendChild(todoDeleteButtonTextNode);
    todoDeleteButton.addEventListener("click", requestHttp_todoDelete);
    todoInfoDivElem.appendChild(todoDeleteButton);

    containerDivElem.appendChild(todoInfoDivElem);

    listLiElem.appendChild(containerDivElem);

    return listLiElem;
}

function buildHtml_todosList(todos) {
    let todoListElem = document.getElementById("todos");

    for (let i = 0; i < todos.length; ++i) {
        let item = todos[i];
        let todoListItemElem = buildHtml_todoListItem(item)
        todoListElem.appendChild(todoListItemElem);
    }
}

function buildHtml_addTodoItem(timestamp) {
    let todoText = document.getElementById("new_todo_text");

    let todoitem = {
        "desc" : todoText.value,
        "status" : TD_CREATED,
        "priority" : 0,
        "st" : timestamp,
        "et" : 0
    };
    let todoListItemElem = buildHtml_todoListItem(todoitem);

    let todoListElem = document.getElementById("todos");
    todoListElem.insertBefore(todoListItemElem, todoListElem.childNodes[0]);
}

function todoSortCompare(a, b) {
    let statusA = a["status"];
    statusA = statusA > 1 ? 1 : statusA;
    let statusB = b["status"];
    statusB = statusB > 1 ? 1 : statusB;
    let statusDiff = statusA - statusB;

    let priorityA = a["priority"];
    let priorityB = b["priority"];
    let priorityDiff = priorityB - priorityA;

    let stA = a["st"];
    let stB = b["st"];
    let stDiff = stA - stB;

    let etA = a["et"];
    let etB = b["et"];
    let etDiff = etB - etA;

    if (statusDiff === 0) {
        if (statusA === 0) {
            if (priorityDiff !== 0) {
                return priorityDiff;
            } else {
                return stDiff;
            }
        } else {
            return etDiff;
        }
    } else {
        return statusDiff;
    }
}

function httpReq_loadTodosJson_load() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            if (this.responseText === "") {
                return;
            } 
            let todos = JSON.parse(this.responseText);
            if (Array.isArray(todos)) {
                todos.sort(todoSortCompare);
                buildHtml_todosList(todos);
            } else {
                // todo log
            }
        } else {
            console.error("XMLHttpRequest error: " + this.statusText + ". Reason: " + this.responseText);
        }
    }
}

function requestHttp_loadTodosJson() {
    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", httpReq_loadTodosJson_load);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("GET", "/todoslist.json", true);
    httpReq.send();
}

window.onload = requestHttp_loadTodosJson;

let todoText = document.getElementById("new_todo_text");

function onHttpRequestLoad_addNewTodo() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            let st = parseInt(this.responseText);
            if (st === NaN) {
            } else {
                buildHtml_addTodoItem(st);
                todoText.value = "";
            }
        } else {
            console.error("XMLHttpRequest error: " + this.statusText + ". Reason: " + this.responseText);
        }
    }
}

function requestHttp_addNewTodo(evt) {
    // evt.preventDefault(); // this only needed for buttons of html form element

    if (todoText.value === '') {
        console.log("No todo description!");
        return;
    }

    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", onHttpRequestLoad_addNewTodo);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("POST", "/addnewtodo", true);

    httpReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
    httpReq.send(todoText.value);
}

let addButton = document.getElementById("todo_add_button");
addButton.onclick = requestHttp_addNewTodo;
