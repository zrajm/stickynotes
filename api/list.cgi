#!/bin/dash
# -*- sh -*-

NOTE_DIR="../data"

# This script modifies the strings passed with the HTTP status code in order to
# give more intelligeble output in the Chrome console. As far as I know this is
# in accordance with the HTTP stardard. For a fuller discussion see the
# following thread on stackoverflow: http://stackoverflow.com/questions/8102208
# "Is it acceptable to modify the text sent with the HTTP status code?"

##############################################################################
##                                                                          ##
##  Functions                                                               ##
##                                                                          ##
##############################################################################

reply() {
    local STATUS="$1" DETAILS="$2"
    echo "Status: $STATUS${DETAILS:+: $DETAILS}"
    echo "Content-Type: application/json"
    echo
    case "$STATUS" in                          # exit on non-2xx status
        2*) :    ;;
        *)  exit ;;
    esac
}

##############################################################################
##                                                                          ##
##  Main                                                                    ##
##                                                                          ##
##############################################################################

[ -r "$NOTE_DIR" ] || reply "403 Forbidden" "Data dir is read protected"
cd "$NOTE_DIR" 2>/dev/null || {
    [ -e "$NOTE_DIR" ] || reply "404 Not Found" "Data dir is missing"
    [ -x "$NOTE_DIR" ] || reply "403 Forbidden" "Data dir is access protected"
    reply "500 Internal Server Error"
}

for FILE in ??????????????????????.json; do    # note ID = 22 characters
    FILE="${FILE%.json}"
    case "$FILE" in
        *[!a-zA-Z0-9_-]*) : ;;
        *) DATA="$DATA\"$FILE\","
    esac
done

reply "200 OK"
echo "{\"list\":[${DATA%,}]}"

#[eof]
