
// var rand = function() {
//     return Math.random().toString(36).substr(2);
// };
// var token = function() {
//     return rand() + rand(); // to make it longer
// };

////////////////////////////////////////////////////////////////////////////////

var notes = (function () {
    // Cache of notes. Data is filled in by server.
    var noteCache = {
        "x5z4leeuflzvvx6rbg3bsosa1vbcsor": {},
        "xgaj3zygtrcnmibf24asiu7rd7k3xr": {},
        "954plbdew1urf6rj04ueprxdz7d5cdi": {},
    };

    return {
        getJSON: function () {
            return JSON.stringify(noteCache, null, 4);
        },
        getNoteJSON: function (id) {
            return JSON.stringify(noteCache[id]);
        },
        get: function (id, prop) {
            return (prop === undefined) ? noteCache[id] : noteCache[id][prop];
        },
        set: function (id, values) {
            $.each(values, function (prop, value) {
                noteCache[id][prop] = value;
            });
        },
        forEach: function (callback) {
            Object.keys(noteCache).forEach(callback);
        }
    };
}());

// Fetch notedata from server, redraw screen.
maxZ = 0;
notes.forEach(function(id) {
    pullNote(id, function (noteData) {
        if (maxZ < noteData.z) { maxZ = noteData.z; }
        notes.set(id, noteData);
        drawNote(id);
    });
});

function putNoteOnTop(id) {
    var z = notes.get(id, "z"), element = $("#" + id);
    if (z < maxZ) {
        maxZ += 1;
        notes.set(id, { z: maxZ });
        pushNote(id);
        element.zIndex(maxZ);
        showNotesData();
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
                drawNote(id);
            }
        },
        complete: poll
    });
}

// After note has been dragged, push new data to server.
function stopDragging(_, ui) {
    var id = ui.helper.prop("id");
    notes.set(id, {
        x: Math.round(ui.offset.left),
        y: Math.round(ui.offset.top)
    });
    pushNote(id);
}

function showNotesData() {
    $('#dump').html('<pre>' + notes.getJSON() + '</pre>');
}

var main = $("main");
$("main").on("input", function (event) {
    var element = $(event.target),
        id      = element.prop("id"),
        value   = element.html();
    notes.set(id, { text: value });
    pushNote(id);
});
poll();

// Update note with newest note data from server.
function pullNote(id, success) {
    $.ajax({"url": "get.cgi?" + id, "type": "GET", "success": success});
    showNotesData();
}

// Push one note to the server.
function pushNote(id) {
    $.ajax({
        "url" : "put.cgi?" + id,
        "type": "PUT",
        "data": notes.getNoteJSON(id)
    });
    showNotesData();
}

// Update note with specified ID, or create it, if it doesn't exist.
function drawNote(id) {
    var noteElement = $('#' + id);
    if (noteElement.length > 0) {
        console.log("MODIFYING " + id);
        noteElement.css({
            "left"      : notes.get(id, "x"),
            "top"       : notes.get(id, "y"),
            "z-index"   : notes.get(id, "z"),
            "background": notes.get(id, "color")
        }).html(notes.get(id, "text"));
    } else {
        console.log("CREATING " + id);
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
    showNotesData();
}

//[eof]
