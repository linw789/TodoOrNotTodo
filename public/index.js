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

function getTodoMetaString(todoItem) {
    let metaText = "priority: " + todoItem["priority"];

    let createDate = new Date(todoItem["st"]);
    metaText += " | created: " + createDate.toDateString();

    if (todoItem["status"] == TD_DONE) {
        let doneDate = new Date(todoItem["et"]);
        metaText += " | done: " + doneDate.toDateString();
    } else if (todoItem["status"] == TD_WONTDO) {
        let abandonDate = new Date(todoItem["et"]);
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

function onHttpRequestLoad_todoDone() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            let todoItem = JSON.parse(this.responseText);
            buildHtml_markTodoItemGrey(todoItem);
        } else {
            console.error("XMLHttpRequest error. Reason: " + this.responseText);
        }
    }
}

function requestHttp_todoDone() {
    let listItemElem = this.closest("li");
    let todoId = listItemElem.id;

    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", onHttpRequestLoad_todoDone);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("POST", "/tododone", true);

    httpReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
    httpReq.send(todoId);
}

function onHttpRequestLoad_todoWontdo() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            let todoItem = JSON.parse(this.responseText);
            buildHtml_markTodoItemGrey(todoItem);
        } else {
            console.error("XMLHttpRequest error. Reason: " + this.responseText);
        }
    }
}

function requestHttp_todoWontdo() {
    let listItemElem = this.closest("li");
    let todoId = listItemElem.id;

    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", onHttpRequestLoad_todoWontdo);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("POST", "/todowontdo", true);

    httpReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
    httpReq.send(todoId);
}

function todoEditButtonClick() {
    let listItemElem = this.closest("li");
    let todoStr = listItemElem.getAttribute("data-raw-text");

    let todoListItemContainerElem = listItemElem.children[0];
    let todoInfoDivElem = todoListItemContainerElem.querySelector(".todo-info-column");
    todoInfoDivElem.style.display = "none";

    let editDivElem = buildHtml_todoEditTextArea(todoStr);
    todoListItemContainerElem.appendChild(editDivElem);
}

function todoEditCancelButtonClick() {
    let listItemElem = this.closest("li");
    let todoListItemContainerElem = listItemElem.children[0];
    let todoEditDivElem = todoListItemContainerElem.getElementsByClassName("todo-edit-text")[0];
    todoListItemContainerElem.removeChild(todoEditDivElem);
    let todoInfoDivElem = todoListItemContainerElem.getElementsByClassName("todo-info-column")[0];
    todoInfoDivElem.style.display = "block";
}

function onHttpRequestLoad_todoEditOk() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            let todoId = this.responseText;
            buildHtml_editTodoText(todoId);
        } else {
            console.error("XMLHttpRequest error. Reason: " + this.responseText);
        }
    }
}

function requestHttp_todoEditOk() {
    let listItemElem = this.closest("li");
    let todoId = listItemElem.id;

    let todoListItemContainerElem = listItemElem.children[0];
    let todoEditDivElem = todoListItemContainerElem.querySelector(".todo-edit-text");
    let textAreaElem = todoEditDivElem.children[0];
    if (textAreaElem.value === "") {
        return;
    }

    let todoData = {
        "st": todoId,
        "desc": textAreaElem.value,
    };
    let todoDataStr = JSON.stringify(todoData);

    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", onHttpRequestLoad_todoEditOk);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("POST", "/todoedit", true);

    httpReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
    httpReq.send(todoDataStr);
}

function onHttpRequestLoad_todoDelete() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            let todoItem = JSON.parse(this.responseText);
            buildHtml_deleteTodoItem(todoItem);
        } else {
            console.error("XMLHttpRequest error. Reason: " + this.responseText);
        }
    }
}

function requestHttp_todoDelete() {
    let listItemElem = this.closest("li");
    let todoId = listItemElem.id;

    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", onHttpRequestLoad_todoDelete);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("POST", "/tododelete", true);

    httpReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
    httpReq.send(todoId);
}

function buildHtml_markTodoItemGrey(todoItem) {
    let todoItemUID = todoItem["st"];
    let todoListItemElem = document.getElementById(todoItemUID);
    if (todoListItemElem !== null) {
        let todoListItemContainerElem = todoListItemElem.children[0];
        todoListItemContainerElem.className += " todo-item-grey";

        // change status symbol
        let statusSymbolPElem = todoListItemContainerElem.querySelector(".todo-status-symbol"); 
        if (todoItem.status === TD_DONE) {
            statusSymbolPElem.textContent = TD_STATUS_SYMBOL_CHECK;
        } else if (todoItem.status === TD_WONTDO) {
            statusSymbolPElem.textContent = TD_STATUS_SYMBOL_CROSS;
        }

        // change to-do meta text
        let todoMetaPElem = todoListItemContainerElem.querySelector(".todo-meta-text");
        todoMetaPElem.textContent = getTodoMetaString(todoItem);

        // remove "done", "won't do" and "edit" buttons
        let todoInfoColumnDivElem = todoListItemContainerElem.querySelector(".todo-info-column");
        let buttonElems = todoInfoColumnDivElem.querySelectorAll("button");
        buttonElems[0].style.display = "none";
        buttonElems[1].style.display = "none";
        buttonElems[2].style.display = "none";
    } else {
        console.error("Request received invalid todo UID");
    }
}

function buildHtml_editTodoText(todoId) {
    let listItemElem = document.getElementById(todoId);
    let todoListItemContainerElem = listItemElem.children[0];
    let todoEditDivElem = todoListItemContainerElem.querySelector(".todo-edit-text");
    let textAreaElem = todoEditDivElem.children[0];
    let newTodoText = textAreaElem.value;
    listItemElem.setAttribute("data-raw-text", newTodoText);
    todoListItemContainerElem.removeChild(todoEditDivElem);
    let todoInfoDivElem = todoListItemContainerElem.querySelector(".todo-info-column");
    let todoDescTextElem = todoInfoDivElem.querySelector(".todo-desc-text");
    todoDescTextElem.innerHTML = window.showdownMarker.makeHtml(newTodoText);
    todoInfoDivElem.style.display = "block";
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

function buildHtml_todoEditTextArea(todoStr) {
    if (!('content' in document.createElement("template"))) {
        console.error("DOM template is not supported on this browser.");
    }

    let template = document.querySelector("#template-todo-edit-div");
    let clone = document.importNode(template.content, true);
    let editDivElem = clone.querySelector("div");

    let textAreaElem = editDivElem.querySelector("textarea");
    const minRows = 6;
    const maxRows = 15;
    let rows = (todoStr.match(/\r?\n/g) || "").length + 1;
    rows = (rows > maxRows ? maxRows : rows) < minRows ? minRows : rows;
    textAreaElem.rows = rows;
    textAreaElem.value = todoStr;

    let editButtonElems = editDivElem.querySelectorAll("button");
    editButtonElems[0].textContent = "ok";
    editButtonElems[0].addEventListener("click", requestHttp_todoEditOk);
    editButtonElems[1].textContent = "cancel";
    editButtonElems[1].addEventListener("click", todoEditCancelButtonClick);

    return editDivElem;
}

function buildHtml_todoListItem(todoItem) {
    // check if DOM 'template' is supported 
    if (!('content' in document.createElement("template"))) {
        console.error("DOM template is not supported on this browser.");
    }

    let template = document.querySelector("#template-todo-list-item");
    let clone = document.importNode(template.content, true);
    let listLiElem = clone.querySelector("li");

    // take the creation UTC timestamp as UID for each to-do-list item
    listLiElem.id = todoItem.st;
    // we want to preserve the original text after it being rendered into marked html
    listLiElem.setAttribute("data-raw-text", todoItem.desc);

    let isTodoGrey = (todoItem.status > TD_CREATED);
    let containerDivElem = listLiElem.querySelector(".todo-list-item-container");
    if (isTodoGrey) {
        containerDivElem.className += " todo-item-grey";
    } 

    let todoStatusDivElem = containerDivElem.querySelector(".todo-status-column");
    let todoStatusSymbolPElem = todoStatusDivElem.querySelector("p");
    switch (todoItem.status) {
        case TD_CREATED: {
            todoStatusSymbolPElem.textContent = TD_STATUS_SYMBOL_CLOCK;
        } break;
        case TD_DONE: {
            todoStatusSymbolPElem.textContent = TD_STATUS_SYMBOL_CHECK;
        } break;
        case TD_WONTDO: {
            todoStatusSymbolPElem.textContent = TD_STATUS_SYMBOL_CROSS;
        } break;
        default: {
            todoStatusSymbolPElem.textContent = TD_STATUS_SYMBOL_ELLIPSIS;
        } break;
    }

    let todoInfoDivElem = listLiElem.querySelector(".todo-info-column");
    
    let todoDescDivElem = todoInfoDivElem.querySelector(".todo-desc-text");
    todoDescDivElem.innerHTML = window.showdownMarker.makeHtml(todoItem.desc);

    let todoMetaPElem = todoInfoDivElem.querySelector(".todo-meta-text");
    todoMetaPElem.textContent = getTodoMetaString(todoItem); 

    // Shallow cloning loses all event listeners, so set them after cloning.
    let todoButtonElems = listLiElem.querySelectorAll("button");
    if (isTodoGrey) {
        for (let i = 0; i < 3; ++i) {
            todoButtonElems[i].style.display = "none";
        }
    } else {
        todoButtonElems[0].textContent = "done";
        todoButtonElems[0].addEventListener("click", requestHttp_todoDone);
        todoButtonElems[1].textContent = "won't do";
        todoButtonElems[1].addEventListener("click", requestHttp_todoWontdo);
        todoButtonElems[2].textContent = "edit";
        todoButtonElems[2].addEventListener("click", todoEditButtonClick);
    }
    todoButtonElems[3].textContent = "delete";
    todoButtonElems[3].addEventListener("click", requestHttp_todoDelete);

    return listLiElem;
}

function buildHtml_todosList(todos) {
    let todoListElem = document.querySelector("#todos");

    for (let i = 0; i < todos.length; ++i) {
        let item = todos[i];
        let todoListItemElem = buildHtml_todoListItem(item)
        todoListElem.appendChild(todoListItemElem);
    }
}

function buildHtml_addTodoItem(timestamp) {
    let todoTextAreaElem = document.querySelector("#new-todo-textarea");

    let todoItem = {
        "desc" : todoTextAreaElem.value,
        "status" : TD_CREATED,
        "priority" : 0,
        "st" : timestamp,
        "et" : 0
    };
    let todoListItemElem = buildHtml_todoListItem(todoItem);

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

function onHttpRequestLoad_addNewTodo() {
    if (this.readyState === 4) {
        if (this.status === 200) {
            let st = parseInt(this.responseText);
            if (st === NaN) {
            } else {
                buildHtml_addTodoItem(st);
                let todoTextAreaElem = document.getElementById("new-todo-textarea");
                todoTextAreaElem.value = "";
            }
        } else {
            console.error("XMLHttpRequest error: " + this.statusText + ". Reason: " + this.responseText);
        }
    }
}

function requestHttp_addNewTodo(evt) {
    // evt.preventDefault(); // this only needed for buttons of html form element

    let todoTextAreaElem = document.getElementById("new-todo-textarea");
    if (todoTextAreaElem.value === '') {
        console.log("No todo description!");
        return;
    }

    let httpReq = new XMLHttpRequest();

    httpReq.addEventListener("load", onHttpRequestLoad_addNewTodo);
    httpReq.addEventListener("error", onHttpRequestError);
    httpReq.addEventListener("abort", onHttpRequestAbort);

    httpReq.open("POST", "/addnewtodo", true);

    httpReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
    httpReq.send(todoTextAreaElem.value);
}

let addButton = document.getElementById("todo_add_button");
addButton.onclick = requestHttp_addNewTodo;
