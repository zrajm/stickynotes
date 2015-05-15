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

// Lika .hasClass() allows multiple classes. Returns true if at least one class
// matches.
jQuery.fn.hasAnyClass = function (selector) {
    'use strict';
    var i, classes = selector.split(" "), l = classes.length;
    for (i = 0; i < l; i += 1) {
        if (this.hasClass(classes[i])) { return true; }
    }
    return false;
};

(function () {
    'use strict';
    var notes, menu, mainElement = $("main"), errorElement = $("#error");

    //////////////////////////////////////////////////////////////////////////
    //
    //  Note Module
    //
    function makeNoteCache(opt) {
        var self, noteCache = {}, session = random132BitString();
        opt = {
            afterSet: opt.afterSet || function () { return; },
            delete  : opt.delete   || function () { return; },
            getAll  : opt.getAll   || function () { return; },
            poll    : opt.poll     || function () { return; },
            pull    : opt.pull     || function () { return; },
            push    : opt.push     || function () { return; }
        };

        function processPollResponse(noteUpdates) {
            $.each(noteUpdates, function (id, values) {
                if (!values) {                 // no values = always delete
                    self.delete(id);
                } else if (values.by !== session) {
                    self.set(id, values);      // only set if from non-self
                }
            });
        }

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
                return prop ? noteCache[id][prop] : noteCache[id];
            },
            set: function (id, values, suppressNoteUpdate) {
                noteCache[id] = noteCache[id] || {};
                $.each(values, function (prop, value) {
                    noteCache[id][prop] = value;
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
            }
        };
        self.pullAll(function () {
            opt.getAll(function (serverResponse) {
                $.each(serverResponse, function (id, values) {
                    self.set(id, values);
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
                        // Refactor: Check that id does not already exist.
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
            if (element.closest(menuElement).length) {// on menu (abort)
                return true;
            }
            closeMenu();
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
        if (noteElement.length > 0) {          // modify existing note in GUI
            noteElement.
                setColorClass(note.color).
                css({ left: note.x, top: note.y, zIndex: note.z }).
                html(note.text);
        } else {                               // create new note in GUI
            angle = rnd(-10, 10) + "deg";
            noteElement = $("<div>", {
                "class"          : "note",
                "contenteditable": "",
                "html"           : note.text,
                "spellcheck"     : false,
                "id"             : id
            }).
                setColorClass(note.color).
                css({
                    left           : note.x,
                    top            : note.y,
                    zIndex         : note.z,
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
        return noteElement;
    }

    //////////////////////////////////////////////////////////////////////////
    //
    //  Main
    //
    notes = makeNoteCache({
        afterSet: function (id, suppressNoteUpdate) {
            if (!suppressNoteUpdate) { drawNote(id, notes); }
            drawDump(notes.json());
        },
        // Refactor: Ajax calls here should use promises instead of args.
        // (Use .done()/.fail()/.always() instead of success/error/complete.)
        // Refactor: Polling trouble should be shown in the GUI.
        delete: function (id) {
            $.ajax({
                type: "DELETE",
                url: "api/delete.cgi?" + id,
                success: hideError,
                error: drawError
            });
        },
        getAll: function (processor) {
            $.ajax({
                type: "GET",
                url: "api/list.cgi",
                success: processor,
                error: drawError,
                complete: function () { drawDump(notes.json()); }
            });
        },
        poll: function (processResponse, poller, session) {
            $.ajax({
                // Refactor: Make something that works on FF (other?) too.
                // 'session' arg is a dummy which makes long polling work in
                // Chrome (but not FF). See 'Polling broken' in TODO.txt
                url: "api/poll.cgi?" + session,
                success: processResponse,
                error: drawError,
                complete: function () {
                    poller(processResponse, poller, session);
                }
            });
        },
        pull: function (id, setter) {
            $.ajax({
                type: "GET",
                url: "api/get.cgi?" + id,
                success: setter,
                error: drawError
            });
        },
        push: function (id, json) {
            $.ajax({
                type: "PUT",
                url: "api/put.cgi?" + id,
                data: json,
                success: hideError,
                error: drawError
            });
        }
    });

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
