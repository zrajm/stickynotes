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
    esac
}

##############################################################################
##                                                                          ##
##  Main                                                                    ##
##                                                                          ##
##############################################################################

NOTE_ID="$1"; check_note_id "$NOTE_ID"
FILE="$NOTE_DIR/$NOTE_ID";

rm -f "$FILE" || reply "403 Forbidden" "Failed to delete file"
reply "204 No Content"

#[eof]
