//////////////////////////////////////////////////////////////////////////////
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
            return (id ?
                JSON.stringify(noteCache[id]) :
                JSON.stringify(noteCache, null, 4)) + "\n";
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

//[eof]
