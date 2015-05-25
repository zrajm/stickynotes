// Like a .hasClass(), but allows multiple classes. Return true if one or more
// classes matches.
jQuery.fn.hasAnyClass = function (selector) {
    'use strict';
    var i, classes = selector.split(" "), len = classes.length;
    for (i = 0; i < len; i += 1) {
        if (this.hasClass(classes[i])) { return true; }
    }
    return false;
};

//[eof]
