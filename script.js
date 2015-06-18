/*global $, jQuery */

function getBoardID() {
    var boardID = location.hash.replace(/^#?/, "");
    if (boardID === "") {                      // no board name = create one
        history.replaceState(null, null, "#" + random132BitString());
        boardID = location.hash.replace(/^#?/, "");
    }
    return boardID;
}

'use strict';
var notes, menu, mainElement = $("main"), errorElement = $("#error"),
    noteCacheOpts, boardID;

function redrawBoard() {
    $("> .note", mainElement).remove();    // remove all notes
    boardID = getBoardID();
    notes = makeNoteCache(noteCacheOpts).
        setSize(mainElement.width(), mainElement.height());
}

//////////////////////////////////////////////////////////////////////////
//
//  Functions
//

// After note has been dragged, push new data to server.
function stopDragging(event, ui) {
    /*jslint unparam:true */
    var id = ui.helper.prop("id");
    notes.push(id, {
        x: Math.round(ui.offset.left),
        y: Math.round(ui.offset.top)
    }, true);
}

function putNoteOnTop(id) {
    var z       = notes.get(id, "z"),
        zMax    = notes.getZMax(),
        element = $("#" + id);
    if (z < zMax) {
        zMax += 1;
        notes.push(id, { z: zMax });
        element.zIndex(zMax);
    }
}

// jQuery extensions for handling color classes.
(function () {
    var colorClasses = "yellow orange red green teal violet";
    jQuery.fn.hasColorClass = function () {
        return this.hasAnyClass(colorClasses);
    };
    jQuery.fn.setColorClass = function (color) {
        return this.removeClass(colorClasses).addClass(color);
    };
}());

menu = (function () {
    var menuElement = $("#menu"), deleteChoice = $("#del"), selected;
    function closeMenu(event) {
        var id, color, element = (event ? $(event.target) : null);
        if (event && element.closest(menuElement).length) {// on menu
            if (element.hasColorClass()) {
                color = element.prop("class");
                if (selected) {            // change existing note
                    id = selected.prop("id");
                    selected.setColorClass(color);
                    notes.push(id, { color: color });
                } else {                   // create new note
                    var id = random132BitString();
                    notes.push(id, {
                        // Refactor: Width/height should come from CSS rule.
                        x: (event.pageX - 75),
                        y: (event.pageY - 75),
                        z: (notes.getZMax() + 1),
                        text: "",
                        color: color
                    });
                    drawNote(id, notes).focus();
                }
            } else if (element.closest(deleteChoice).length) {
                id = selected.prop("id");
                notes.delete(id);
            }
        }
        if (selected) {
            selected.removeClass("selected");
            selected = null;
        }
        menuElement.hide();
    }
    function openMenu(event) {
        var element = $(event.target);
        closeMenu();
        if (element.closest(menuElement).length) {// on menu (abort)
            return true;
        }
        if (element.closest(".note").length) {    // on sticky note
            selected = element.addClass("selected");
            deleteChoice.show();
        } else {                                  // on background
            deleteChoice.hide();
        }
        menuElement.show().css({                  // place menu under mouse
            left: event.pageX - (menuElement.outerWidth()  / 2),
            top : event.pageY - (menuElement.outerHeight() / 2)
        });
        return false;
    }
    return { close: closeMenu, open: openMenu };
}());

function drawDump(rawText) {
    //$('#dump').html('<pre>' + rawText + '</pre>');
}

function hideError() { errorElement.hide(); }
function drawError(jqXHR, textStatus, errorThrown) {
    var error = jqXHR.responseJSON;
    var errMsg = "<b>" + this.type + " request failed</b>" +
        "<br>Server " + textStatus + ": " + error.code + " " +
        error.message.replace(/:\s+/, " &ndash; ");
    errorElement.html(errMsg).show();
}

// Update note with specified ID, or create it, if it doesn't exist.
function drawNote(id, notes) {
    var angle, note = notes.get(id), noteElement = $('#' + id);
    if (!note) {                           // note has been deleted
        return noteElement.remove();       //   remove any note in GUI
    }
    if (noteElement.length === 0) {        // create new GUI note
        angle = rnd(-10, 10) + "deg";
        noteElement = $("<div>", {
            "class"          : "note",
            "contenteditable": "",
            "spellcheck"     : false,
            "id"             : id
        }).
            css({
                transform      : "rotate(" + angle + ")",
                WebkitTransform: "rotate(" + angle + ")"
            }).
            appendTo("main").
            draggable({
                "containment": "parent",
                "stop"       : stopDragging
            }).
            mousedown(function () { putNoteOnTop(id); });
    }
    return noteElement.                    // modify new or existing note
        setColorClass(note.color).
        html(note.text || "<br>").
        css({
            left  : note.x,
            top   : note.y,
            zIndex: note.z
        });
}

var request = (function () {
    var requests = {
        DELETE: { type: "DELETE", url: "api/delete.cgi" },
        GET   : { type: "GET",    url: "api/get.cgi"    },
        POLL  : { type: "GET",    url: "api/poll.cgi"   },
        PUT   : { type: "PUT",    url: "api/put.cgi"    }
    };
    return function (req, boardID, noteID, data) {
        var arg, opt = {
            type: requests[req].type,
            url:  requests[req].url
        };
        if (data) { opt.data = data; }     // request body
        if (boardID) {                     // add board + note ID to URL
            arg = boardID + (noteID ? "/" + noteID : "");
            if (arg) { opt.url += "?" + arg; }
        }
        return $.ajax(opt).fail(drawError);
    }
}());

//////////////////////////////////////////////////////////////////////////
//
//  Main
//
noteCacheOpts = {
    afterSet: function (id, suppressNoteUpdate) {
        if (!suppressNoteUpdate) { drawNote(id, notes); }
        drawDump(notes.json());
    },
    delete: function (id) {
        request("DELETE", boardID, id).
            done(hideError);
    },
    getAll: function (processor) {
        request("GET", boardID).
            done(processor).
            always(function () { drawDump(notes.json()); });
    },
    poll: function (processResponse, poller, session) {
        request("POLL", boardID).
            done(processResponse).
            always(function () {
                poller(processResponse, poller, session);
            });
    },
    push: function (id, json) {
        request("PUT", boardID, id, json).
            done(hideError);
    },
    redraw: function (id, note) {
        /*jslint unparam:true */
        drawNote(id, notes);
    }
};

redrawBoard();

// Recalculate board size & redraw notes on window size change.
$(window).resize(function () {
    notes.setSize(mainElement.width(), mainElement.height());
}).on('hashchange', redrawBoard);


mainElement.on("input", function (event) {
    var element = $(event.target),
        id      = element.prop("id"),
        value   = element.html();
    notes.push(id, { text: value }, true);
}).
    on("contextmenu", menu.open).
    on("click", menu.close);

//[eof]
