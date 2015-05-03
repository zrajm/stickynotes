
// var rand = function() {
//     return Math.random().toString(36).substr(2);
// };
// var token = function() {
//     return rand() + rand(); // to make it longer
// };

////////////////////////////////////////////////////////////////////////////////

function makeNotes(opt) {
    var noteCache, notes;
    opt = {
        afterSet: opt.afterSet || function () {},
        poll    : opt.poll     || function () {},
        pull    : opt.pull     || function () {},
        push    : opt.push     || function () {},
    };

    // Cache of notes. Data is filled in by server.
    noteCache = {
        "x5z4leeuflzvvx6rbg3bsosa1vbcsor": {},
        "xgaj3zygtrcnmibf24asiu7rd7k3xr": {},
        "954plbdew1urf6rj04ueprxdz7d5cdi": {},
    };

    function set(id, values) {
        $.each(values, function (prop, value) {
            noteCache[id][prop] = value;
        });
    }
    function processPollResponse(noteUpdates) {
        // Refactor: Ignore events caused by self.
        $.each(noteUpdates, function (id, values) {
            notes.set(id, values);
        });
    }

    notes = {
        getZMax: function () {
            var id, zMax = 0, that = this;
            this.forEach(function (id) {
                var z = that.get(id, "z");
                if (z > zMax) { zMax = z; }
            });
            return zMax;
        },
        json: function (id) {
            return id
                ? JSON.stringify(noteCache[id])
                : JSON.stringify(noteCache, null, 4);
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
        },
    };
    notes.forEach(function (id) {              // Pull notes from server.
        opt.pull(id, function (noteData) { notes.set(id, noteData); });
    });
    opt.poll(processPollResponse, opt.poll);   // Initiate long polling.
    return notes;
}

var notes = makeNotes({
    afterSet: function (id) {
        drawNote(id);
        $('#dump').html('<pre>' + notes.json() + '</pre>');
    },
    poll: function (processResponse, poller) {
        $.ajax({ url: "poll.cgi", success: processResponse,
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
