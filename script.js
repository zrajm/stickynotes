
// var rand = function() {
//     return Math.random().toString(36).substr(2);
// };
// var token = function() {
//     return rand() + rand(); // to make it longer
// };

////////////////////////////////////////////////////////////////////////////////

function makeNotes(opt) {
    var push     = (opt.push     || function () {}),
        pull     = (opt.pull     || function () {}),
        afterSet = (opt.afterSet || function () {});

    // Cache of notes. Data is filled in by server.
    var noteCache = {
        "x5z4leeuflzvvx6rbg3bsosa1vbcsor": {},
        "xgaj3zygtrcnmibf24asiu7rd7k3xr": {},
        "954plbdew1urf6rj04ueprxdz7d5cdi": {},
    };

    function set(id, values) {
        $.each(values, function (prop, value) {
            noteCache[id][prop] = value;
        });
    }

    return {
        getZMax: function () {
            var that = this, zMax = 0;
            that.forEach(function (id) {
                var z = that.get(id, "z");
                if (z > zMax) { zMax = z; }
            });
            return zMax;
        },
        getJSON: function (id) {
            if (id) {
                return JSON.stringify(noteCache[id]);
            } else {
                return JSON.stringify(noteCache, null, 4);
            }
        },
        get: function (id, prop) {
            return noteCache[id][prop];
        },
        set: function (id, values, redraw) {
            set(id, values);
            afterSet(id);
        },
        // Set values and push them to server.
        push: function (id, values) {
            set(id, values);
            push(id, this.getJSON(id));
        },
        forEach: function (callback) {
            Object.keys(noteCache).forEach(callback);
        },
        init: function () {
            var that = this;
            that.forEach(function (id) {
                pull(id, function (noteData) {
                    that.set(id, noteData);
                });
            });
        }
    };
}

var notes = makeNotes({
    afterSet: function (id) {
        drawNote(id);
        $('#dump').html('<pre>' + notes.getJSON() + '</pre>');
    },
    pull: function (id, setter) {
        $.ajax({ url: "get.cgi?" + id, type: "GET", success: setter });
    },
    push: function (id, json) {
        $.ajax({ url: "put.cgi?" + id, type: "PUT", data: json });
    }
});
notes.init();

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

// Returns a random number between min (inclusive) and max (exclusive)
function rnd(min, max) {
    return Math.random() * (max - min) + min;
}

////////////////////////////////////////////////////////////////////////////////

// Poll updates from server.
function poll() {
    $.ajax({
        url: "poll.cgi",
        success: function (noteUpdates) {
            var id;
            for (id in noteUpdates) {
                notes.set(id, noteUpdates[id]);
            }
        },
        complete: poll
    });
}

// After note has been dragged, push new data to server.
function stopDragging(_, ui) {
    var id = ui.helper.prop("id");
    notes.push(id, {
        x: Math.round(ui.offset.left),
        y: Math.round(ui.offset.top)
    });
}

var main = $("main");
$("main").on("input", function (event) {
    var element = $(event.target),
        id      = element.prop("id"),
        value   = element.html();
    notes.push(id, { text: value });
});
poll();

// Update note with specified ID, or create it, if it doesn't exist.
function drawNote(id) {
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
            "stop"       : stopDragging,
        }).mousedown(function () { putNoteOnTop(id); });
    }
}

//[eof]
