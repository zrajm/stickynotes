
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
Object.keys(noteCache).forEach(function(id) {
    pullNote(id, function (noteData) {
        noteCache[id] = noteData;
        drawNote(id, noteData);
    });
});

////////////////////////////////////////////////////////////////////////////////

// After note has been dragged, push new data to server.
function stopEvent(event, ui) {
    var id = ui.helper.prop("id");
    noteCache[id].x = ui.offset.left;          // x
    noteCache[id].y = ui.offset.top;           // y

    // Refactor: Remove the need for this loop
    //
    // The jQuery UI 'stack' option causes z-index to be set for all notes,
    // which is really bad cause then we'll have to sync all of them (and not
    // only the dragged one) to the server. Not good when we're later on going
    // to push those events to clients as well.
    $(".note").each(function (_, element) {    // z (of all notes)
        var element = $(element);
        var id = element.prop("id");
        noteCache[id].z = element.css("z-index");
        pushNote(id);
    });
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

// Update note with newest note data from server.
function pullNote(id, success) {
    success = success || function () { };
    $.ajax({
        url: "do.cgi?" + id,
        success: success,
    });
    showNotesData();
}

// Push one note to the server.
function pushNote(id) {
    $.ajax("do.cgi?" + id, {
        type: "PUT",
        data: JSON.stringify(noteCache[id]),
    });
    showNotesData();
}

// Update note with specified ID, or create it, if it doesn't exist.
function drawNote(id, noteData) {
    var noteElement = $('#' + id);
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
            "stop"       : stopEvent,
            "stack"      : "*"
        });
    }
    showNotesData();
}

//[eof]
