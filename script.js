/*global $ */

// var rand = function() {
//     return Math.random().toString(36).substr(2);
// };
// var token = function() {
//     return rand() + rand(); // to make it longer
// };

(function () {
    'use strict';
    var notes;

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

    var menu = (function () {
        var menu = $("#menu"), deleteChoice = $("#del"), selected;
        function closeMenu() {
            if (selected) {
                selected.removeClass("selected");
                selected = null;
            }
            menu.hide();
        }
        function openMenu(event) {
            var element = $(event.target);
            if (element.closest(menu).length) {    // on menu (abort)
                return false;
            }
            closeMenu();
            if (element.closest(".note").length) { // on note
                selected = element.addClass("selected");
                deleteChoice.show();
            } else {                               // on background
                deleteChoice.hide();
            }
            menu.show().css({                      // place menu under mouse
                left: event.pageX - (menu.outerWidth()  / 2),
                top : event.pageY - (menu.outerHeight() / 2)
            });
            return false;
        }
        return { close: closeMenu, open: openMenu }
    }());

    // Update note with specified ID, or create it, if it doesn't exist.
    function drawNote(id, notes) {
        var noteElement = $('#' + id);
        if (noteElement.length > 0) {
            noteElement.css({
                "left"      : notes.get(id, "x"),
                "top"       : notes.get(id, "y"),
                "z-index"   : notes.get(id, "z"),
                "background": notes.get(id, "color")
            }).html(notes.get(id, "text"));
        } else {
            noteElement = $("<div>", {
                "class"          : "note",
                "contenteditable": "",
                "html"           : notes.get(id, "text"),
                "spellcheck"     : false,
                "id"             : id
            }).css({
                "left"      : notes.get(id, "x"),
                "top"       : notes.get(id, "y"),
                "z-index"   : notes.get(id, "z"),
                "background": notes.get(id, "color"),
                "transform" : "rotate(" + rnd(-10, 10) + "deg)",
                "-webkit-transform": "rotate(" + rnd(-10, 10) + "deg)"
            }).appendTo("main").draggable({
                "containment": "parent",
                "stop"       : stopDragging
            }).mousedown(function () { putNoteOnTop(id); });
        }
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
