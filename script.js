/*global $, jQuery */

// Return a Base64 encoded random string with 22 chars (132 bit). Uses stong
// randomness everywhere possible. Uses RCF4648 version of Base64 encoding
// (file and URL safe) and never includes padding. Characters used are
// [a-zA-z0-9_-] (= 6 bit per character).
var random132BitString = (function() {
    var crypto = (window.crypto || window.msCrypto),
        transl = { "+": "-", "/": "_" };
    return function () {
        // 17 bytes = 136 bit (cut down to 132 bit in the end).
        var string, bytes = new Uint8Array(17);
        // Build array of byte numbers.
        if (crypto && crypto.getRandomValues) {// crypto interface
            crypto.getRandomValues(bytes);     //   good random bytes
        } else {
            for (i = 0; i < 17; i += 1) {      // builtin (insecure)
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }
        string = String.fromCharCode.apply(null, bytes);
        return btoa(string).                   // base64 encode
            slice(0, 22).                      //   22 base64 chars = 132 bit
            replace(/[+\/]/g, function (c) {   //   file & URL safe encoding
                return transl[c];
            });
    };
})();

// Like a .hasClass(), but allows multiple classes. Return true if one or more
// classes matches.
jQuery.fn.hasAnyClass = function (selector) {
    'use strict';
    var i, classes = selector.split(" "), len = classes.length;
    for (i = 0; i < len; i += 1) {
        if (this.hasClass(classes[i])) { return true; }
    }
    return false;
};

function getBoardID() {
    if (!location.hash.match(/^#[a-zA-Z0-9_-]{22}$/)) {
        history.replaceState(null, null, "#" + random132BitString());
    }
    return location.hash.replace(/^#/, "");
}

(function () {
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
    //  Note Module
    //
    function makeNoteCache(opt) {
        var self, noteCache = {}, session = random132BitString(),
            boardPixelSize = {
                x: opt.width  || 0,
                y: opt.height || 0
            };
        opt = {
            afterSet: opt.afterSet || function () { return; },
            delete  : opt.delete   || function () { return; },
            getAll  : opt.getAll   || function () { return; },
            poll    : opt.poll     || function () { return; },
            push    : opt.push     || function () { return; },
            redraw  : opt.redraw   || function () { return; }
        };

        function processPollResponse(noteUpdates) {
            $.each(noteUpdates, function (id, values) {
                if (!values) {                 // no values = always delete
                    self.delete(id);
                    return;
                }
                if (values.by === session) {   // values set by self = skip
                    return;
                }
                self.set(id, values, false, true);
            });
        }

        function percentify(value, maxValue) {
            var percent = (value / maxValue) * 100;
            return +(percent.toFixed(3));      // round off to 3 decimals
        }
        function pixelize(value, maxValue) {
            var pixel = (value * maxValue) / 100;
            return +(pixel.toFixed());         // round off to whole number
        }

        var jqProp = { x: "outerWidth", y: "outerHeight" }
        function getSame(value, prop, id) {
            var boardSize = boardPixelSize[prop],
                // FIXME: Hardcoded note width/height ('150' pixel)
                // (used only when GUI note does not exist yet, i.e. on init)
                noteSize = $("#" + id)[ jqProp[prop] ]() || 150,
                maxValue = boardSize - noteSize;
            return pixelize(value, maxValue);
        }
        function setSame(value, prop, id) {
            var boardSize  = boardPixelSize[prop],
                noteSize = $("#" + id)[ jqProp[prop] ]() || 150,
                maxValue   = boardSize - noteSize;
            return percentify(value, maxValue);
        }
        var getConv = { x: getSame, y: getSame };
        var setConv = { x: setSame, y: setSame };

        self = {
            getZMax: function () {
                var zMax = 0;
                $.each(noteCache, function (id, values) {
                    if (values.z > zMax) { zMax = values.z; }
                });
                return zMax;
            },
            json: function (id) {
                return id ?
                        JSON.stringify(noteCache[id]) :
                        JSON.stringify(noteCache, null, 4);
            },
            get: function (id, prop) {
                var value, note = {};
                if (!noteCache[id]) {          // non-existing = null
                    return null;
                }
                if (prop) {                    // single property
                    value = noteCache[id][prop];
                    return getConv[prop] ?
                        getConv[prop](value, prop, id) :
                        value;
                }                              // whole note
                $.each(noteCache[id], function(prop, value) {
                    note[prop] = getConv[prop] ?
                        getConv[prop](value, prop, id) :
                        value;
                });
                return note;
            },
            set: function (id, values, suppressNoteUpdate, suppressConv) {
                // suppressNoteUpdate -- suppresses note update in GUI
                // suppressConv -- suppresses normalization of note positions
                noteCache[id] = noteCache[id] || {};
                $.each(values, function (prop, value) {
                    if (suppressConv) {
                        noteCache[id][prop] = value;
                    } else {
                        noteCache[id][prop] = setConv[prop] ?
                            setConv[prop](value, prop, id) :
                            value;
                    }
                });
                opt.afterSet(id, suppressNoteUpdate);
                return this;
            },
            // Erase note in note cache and remove it in GUI.
            delete: function (id) {
                delete noteCache[id];
                opt.delete(id);
                opt.afterSet(id);
                return this;
            },
            push: function (id, values, suppressNoteUpdate) {
                values.by = session;
                self.set(id, values, suppressNoteUpdate);
                opt.push(id, this.json(id));
                return this;
            },
            pullAll: function (callback) {
                opt.getAll(function (serverResponse) {
                    callback(serverResponse);
                });
                return this;
            },
            setSize: function (width, height) {
                if (boardPixelSize.x === width && boardPixelSize.y === height
                ) { return this; }
                boardPixelSize = { x: width, y: height };
                $.each(noteCache, function (id, values) {
                    opt.redraw(id, values);
                });
                return this;
            }
        };
        self.pullAll(function () {
            opt.getAll(function (serverResponse) {
                $.each(serverResponse, function (id, values) {
                    self.set(id, values, false, true);
                });
                // Initiate long polling.
                opt.poll(processPollResponse, opt.poll, session);
            });
        });
        return self;
    }

    //////////////////////////////////////////////////////////////////////////
    //
    //  Functions
    //
    // Returns a random number between min (inclusive) and max (exclusive)
    function rnd(min, max) {
        return Math.random() * (max - min) + min;
    }

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
        $('#dump').html('<pre>' + rawText + '</pre>');
    }

    function hideError() { errorElement.hide(); }
    function drawError(jqXHR, textStatus, errorThrown) {
        var errMsg = "<b>" + this.type + " request failed</b>" +
            "<br>Server " + textStatus + ": " + jqXHR.status + " " +
            errorThrown.replace(/:\s+/, " &ndash; ");
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

}());

//[eof]
