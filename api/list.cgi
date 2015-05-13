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

# Usage: read_data VARIABLE FILE
#
# Reads first line of FILE into variable VARIABLE.
read_data() {
    read "$1" <"$2" || {
        [ -e "$FILE" ] || reply "404 Not Found" "Missing file"
        [ -r "$FILE" ] || reply "403 Forbidden" "File read protected"
        reply "500 Internal Server Error" "Failed to read file"
    }
}

##############################################################################
##                                                                          ##
##  Main                                                                    ##
##                                                                          ##
##############################################################################

#[ -r "$NOTE_DIR" ] || reply "403 Forbidden" "Data directory is read protected"
cd "$NOTE_DIR" 2>/dev/null || {
    [ -e "$NOTE_DIR" ] || reply "404 Not Found" "Data directory is missing"
    [ -x "$NOTE_DIR" ] || reply "403 Forbidden" "Data directory is access protected"
    reply "500 Internal Server Error"
}

for FILE in ??????????????????????.json; do    # note ID = 22 characters
    NOTE_ID="${FILE%.json}"
    FILE="$NOTE_DIR/$NOTE_ID.json"
    case "$NOTE_ID" in
        *[!a-zA-Z0-9_-]*) : ;;
        *)
            read_data JSON "$FILE" 2>/dev/null
            DATA="$DATA\"$NOTE_ID\":${JSON:-\{\}}," ;;
    esac
done

reply "200 OK"
echo "{${DATA%,}}"

#[eof]
