/*global $, jQuery */

var rand = function() {
    return Math.random().toString(36).substr(2);
};
var token = function() {
    return rand() + rand(); // to make it longer
};

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
    var notes, menu;

    //////////////////////////////////////////////////////////////////////////
    //
    //  Note Module
    //
    function makeNotes(opt) {
        var noteCache, self;
        opt = {
            afterSet: opt.afterSet || function () { return; },
            poll    : opt.poll     || function () { return; },
            pull    : opt.pull     || function () { return; },
            push    : opt.push     || function () { return; }
        };

        // Cache of notes. Data is filled in by server.
        noteCache = {
            "x5z4leeuflzvvx6rbg3bsosa1vbcsor": {},
            "xgaj3zygtrcnmibf24asiu7rd7k3xr": {},
            "954plbdew1urf6rj04ueprxdz7d5cdi": {}
        };

        function set(id, values) {
            noteCache[id] = noteCache[id] || {};
            $.each(values, function (prop, value) {
                noteCache[id][prop] = value;
            });
        }
        function processPollResponse(noteUpdates) {
            // Refactor: Ignore events caused by self.
            $.each(noteUpdates, function (id, values) {
                self.set(id, values);
            });
        }

        self = {
            getZMax: function () {
                var zMax = 0, that = this;
                this.forEach(function (id) {
                    var z = that.get(id, "z");
                    if (z > zMax) { zMax = z; }
                });
                return zMax;
            },
            json: function (id) {
                return id ?
                        JSON.stringify(noteCache[id]) :
                        JSON.stringify(noteCache, null, 4);
            },
            get: function (id, prop) {
                return noteCache[id][prop];
            },
            set: function (id, values) {
                set(id, values);
                opt.afterSet(id);
                return this;
            },
            push: function (id, values) {          // Set & push to server.
                set(id, values);
                opt.push(id, this.json(id));
                return this;
            },
            forEach: function (callback) {
                Object.keys(noteCache).forEach(callback);
                return this;
            }
        };
        self.forEach(function (id) {              // Pull notes from server.
            opt.pull(id, function (noteData) { self.set(id, noteData); });
        });
        opt.poll(processPollResponse, opt.poll);   // Initiate long polling.
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
        });
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
                        var id = token();
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
                return false;
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

    // Update note with specified ID, or create it, if it doesn't exist.
    function drawNote(id, notes) {
        var noteElement = $('#' + id);
        if (noteElement.length > 0) {
            noteElement.
                setColorClass(notes.get(id, "color")).
                css({
                    "left"      : notes.get(id, "x"),
                    "top"       : notes.get(id, "y"),
                    "z-index"   : notes.get(id, "z")
                }).
                html(notes.get(id, "text"));
        } else {
            noteElement = $("<div>", {
                "class"          : "note",
                "contenteditable": "",
                "html"           : notes.get(id, "text"),
                "spellcheck"     : false,
                "id"             : id
            }).
                setColorClass(notes.get(id, "color")).
                css({
                    "left"      : notes.get(id, "x"),
                    "top"       : notes.get(id, "y"),
                    "z-index"   : notes.get(id, "z"),
                    "transform" : "rotate(" + rnd(-10, 10) + "deg)",
                    "-webkit-transform": "rotate(" + rnd(-10, 10) + "deg)"
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
    notes = makeNotes({
        afterSet: function (id) {
            drawNote(id, notes);
            $('#dump').html('<pre>' + notes.json() + '</pre>');
        },
        poll: function (processResponse, poller) {
            $.ajax({
                url: "poll.cgi",
                success: processResponse,
                complete: function () { poller(processResponse, poller); }
            });
        },
        pull: function (id, setter) {
            $.ajax({ url: "get.cgi?" + id, type: "GET", success: setter });
        },
        push: function (id, json) {
            $.ajax({ url: "put.cgi?" + id, type: "PUT", data: json });
        }
    });

    $("main").on("input", function (event) {
        var element = $(event.target),
            id      = element.prop("id"),
            value   = element.html();
        notes.push(id, { text: value });
    }).
        on("contextmenu", menu.open).
        on("click", menu.close);

}());

//[eof]
