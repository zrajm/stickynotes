#!/bin/dash
# -*- sh -*-

NOTE_DIR="notes"

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
        "")          reply "400 Bad Request" "Missing note ID" ;;
        *[!a-z0-9]*) reply "400 Bad Request" "Malformed note ID" ;;
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

##############################################################################
##                                                                          ##
##  Main                                                                    ##
##                                                                          ##
##############################################################################

NOTE_ID="$1";            check_note_id "$NOTE_ID"
FILE="$NOTE_DIR/$NOTE_ID";

read DATA <"$FILE" || {
    [ -e "$FILE" ] || reply "404 Not Found" "Missing file"
    [ -r "$FILE" ] || reply "403 Forbidden" "File read protected"
}
check_json "$DATA" "500 Internal Server Error" "file"

reply "200 OK"
echo "$DATA"

#[eof]
