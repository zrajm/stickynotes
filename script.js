
// var rand = function() {
//     return Math.random().toString(36).substr(2);
// };
// var token = function() {
//     return rand() + rand(); // to make it longer
// };

////////////////////////////////////////////////////////////////////////////////

// Cache of notes. Data is filled in by server.
var noteCache = {
     "x5z4leeuflzvvx6rbg3bsosa1vbcsor": {},
     "xgaj3zygtrcnmibf24asiu7rd7k3xr": {},
     "954plbdew1urf6rj04ueprxdz7d5cdi": {},
};

// Fetch notedata from server, redraw screen.
maxZ = 0;
Object.keys(noteCache).forEach(function(id) {
    pullNote(id, function (noteData) {
        noteCache[id] = noteData;
        if (maxZ < noteData.z) { maxZ = noteData.z; }
        drawNote(id);
    });
});

function putNoteOnTop(id) {
    var z = noteCache[id].z, element = $("#" + id);
    if (z < maxZ) {
        maxZ += 1;
        noteCache[id].z = maxZ;
        pushNote(id);
        element.zIndex(maxZ);
        showNotesData();
    }
}

////////////////////////////////////////////////////////////////////////////////

// Poll updates from server.
function poll() {
    $.ajax({
        url: "poll.cgi",
        success: function (noteUpdates) {
            var id;
            for (id in noteUpdates) {
                noteCache[id] = noteUpdates[id];
                drawNote(id);
            }
        },
        complete: poll
    });
}

// After note has been dragged, push new data to server.
function stopDragging(_, ui) {
    var id = ui.helper.prop("id");
    noteCache[id].x = ui.offset.left;          // x
    noteCache[id].y = ui.offset.top;           // y
    pushNote(id);
}

function showNotesData() {
    $('#dump').html('<pre>' + JSON.stringify(noteCache, null, 4) + '</pre>');
}

var main = $("main");
$("main").on("input", function (event) {
    var element = $(event.target),
        id      = element.prop("id"),
        value   = element.html();
    noteCache[id].text = value;
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
    var noteData = noteCache[id],
        json     = JSON.stringify(noteData);
    $.ajax({"url": "put.cgi?" + id, "type": "PUT", "data": json});
    showNotesData();
}

// Update note with specified ID, or create it, if it doesn't exist.
function drawNote(id) {
    var noteData    = noteCache[id],
        noteElement = $('#' + id);
    if (noteElement.length > 0) {
        console.log("MODIFYING " + id);
        noteElement.css({
            "left"      : noteData.x,
            "top"       : noteData.y,
            "z-index"   : noteData.z,
            "background": noteData.color
        }).html(noteData.text);
    } else {
        console.log("CREATING " + id);
        noteElement = $("<div>", {
            "class"          : "note",
            "contenteditable": "",
            "text"           : noteData.text,
            "id"             : id
        }).css({
            "left"      : noteData.x,
            "top"       : noteData.y,
            "z-index"   : noteData.z,
            "background": noteData.color
        }).appendTo("main").draggable({
            "containment": "parent",
            "stop"       : stopDragging,
        }).mousedown(function () { putNoteOnTop(id); });
    }
    showNotesData();
}

//[eof]
