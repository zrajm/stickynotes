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

check_note_id() {
    local NOTE_ID="$1"
    case "$NOTE_ID" in
        "")               reply "400 Bad Request" "Missing note ID" ;;
        *[!a-zA-Z0-9_-]*) reply "400 Bad Request" "Malformed note ID" ;;
        ??????????????????????) : ;;           # note ID = 22 characters
        *)                reply "400 Bad Request" "Note ID must be 22 chars" ;;
    esac
}

# Very simplistic check. Only look to see that JSON data starts and ends with
# curly braces.
check_json() {
    local JSON="$1" ERROR="$2" MSG="$3"
    case "$JSON" in
        "{"*"}") : ;;
        "") reply "$ERROR"   "Missing data${MSG:+ in $MSG}" ;;
        *)  reply "$ERROR" "Malformed JSON${MSG:+ in $MSG}" ;;
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

NOTE_ID="$1"; check_note_id "$NOTE_ID"
FILE="$NOTE_DIR/$NOTE_ID.json"

read_data DATA "$FILE" 2>/dev/null
check_json "$DATA" "500 Internal Server Error" "file"

reply "200 OK"
echo "$DATA"

#[eof]
