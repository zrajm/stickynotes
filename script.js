
var notes = {
    "x5z4leeuflzvvx6rbg3bsosa1vbcsor": {
        x: 400,
        y: 400,
        color: "#E98813",
        text: "Sorem ipsadia GG"
    },
    "xgaj3zygtrcnmibf24asiu7rd7k3xr": {
        x: 600,
        y: 0,
        color: "#88C134",
        text: "Sorem ipsadia GG"
    },
    "954plbdew1urf6rj04ueprxdz7d5cdi": {
        x: 110,
        y: 110,
        color: "#D2315D",
        text: "Sorem ipsadia GG"
    }
};
Object.keys(notes).forEach(function(id) {
    var note = notes[id];
    console.log(note.id);
    $("<div>", {
        class: "note",
        contenteditable: "",
        text: note.text
    })
    .data({ id: id })
        .css({ left: note.x, top: note.y, background: note.color })
    .appendTo("main");
});

// var notelist = [
//      "x5z4leeuflzvvx6rbg3bsosa1vbcsor",
//      "xgaj3zygtrcnmibf24asiu7rd7k3xr",
//      "954plbdew1urf6rj04ueprxdz7d5cdi",
// ];

// notelist.forEach(function(id) {
//     var note = notes[id];
//     console.log(note.id);
//     $("<div>", {
//         class: "note",
//         contenteditable: "",
//         text: note.text
//     })
//         .data({ id: id })
//         .css({ left: note.x, top: note.y, background: note.color })
//         .appendTo("main");
// });






var rand = function() {
    return Math.random().toString(36).substr(2);
};
var token = function() {
    return rand() + rand(); // to make it longer
};

function stopEvent(event, ui) {
    var id = ui.helper.data("id"), x = ui.offset.left, y = ui.offset.top;

    //notes.move(id, x, y);

    notes[id].x = x;
    notes[id].y = y;
    put(id);
}

function showNotesData() {
    $('#dump').html('<pre>' + JSON.stringify(notes, null, 4) + '</pre>');
}

var main = $("main");


$("main").on("input", function (event) {
    var element = $(event.target),
        id      = element.data("id"),
        value   = element.html();
    notes[id].text = value;
    put(id);
});


$(".note").draggable({
    containment: "parent",
    stop: stopEvent,
    stack: "*"
});


// function get(id, do) {
//     $.ajax({
//             url: "do.cgi?" + id,
//             success: function (data) {
//         notes
//     });
//     showNotesData();
// }

function put(id) {
    // $.ajax("do.cgi?" + id, {
    //     type: "PUT",
    //     data: JSON.stringify(notes[id]),
    // });
    showNotesData();
}

//[eof]
