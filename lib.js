//////////////////////////////////////////////////////////////////////////
//                                                                      //
//  Non-GUI Functions                                                   //
//                                                                      //
//////////////////////////////////////////////////////////////////////////
//
// These are all self-contained functions, which do not depend on any kind
// of global state, nor on the DOM.
//

// Return a Base64 encoded random string with 22 chars (132 bit). Uses stong
// randomness everywhere possible. Uses RCF4648 version of Base64 encoding
// (file and URL safe) and never includes padding. Characters used are
// [a-zA-z0-9_-] (= 6 bit per character).
var random132BitString = (function() {
    var crypto = (window.crypto || window.msCrypto),
        transl = { "+": "-", "/": "_" };
    return function () {
        // 17 bytes = 136 bit (cut down to 132 bit in the end).
        var string, bytes = new Uint8Array(17);
        // Build array of byte numbers.
        if (crypto && crypto.getRandomValues) {// crypto interface
            crypto.getRandomValues(bytes);     //   good random bytes
        } else {
            for (i = 0; i < 17; i += 1) {      // builtin (insecure)
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }
        string = String.fromCharCode.apply(null, bytes);
        return btoa(string).                   // base64 encode
            slice(0, 22).                      //   22 base64 chars = 132 bit
            replace(/[+\/]/g, function (c) {   //   file & URL safe encoding
                return transl[c];
            });
    };
})();

//////////////////////////////////////////////////////////////////////////

var COORD = {
    percentify: function(value, maxValue) {
        var percent = (value / maxValue) * 100;
        return +(percent.toFixed(3));      // round off to 3 decimals
    },
    pixelize: function(value, maxValue) {
        var pixel = (value * maxValue) / 100;
        return +(pixel.toFixed());         // round off to whole number
    }
};

//////////////////////////////////////////////////////////////////////////

// Returns a random number between min (inclusive) and max (exclusive)
function rnd(min, max) {
    return Math.random() * (max - min) + min;
}

//////////////////////////////////////////////////////////////////////////

//[eof]
