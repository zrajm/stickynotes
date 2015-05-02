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

##############################################################################
##                                                                          ##
##  Main                                                                    ##
##                                                                          ##
##############################################################################

NOTE_ID="$1";            check_note_id "$NOTE_ID"
FILE="$NOTE_DIR/$NOTE_ID";

read DATA <"$FILE" \
    || reply "404 Not Found" "Failed to read data"

reply "200 OK"
echo "$DATA"

#[eof]
