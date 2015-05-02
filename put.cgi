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
check_payload() {
    local PAYLOAD="$1"
    case "$PAYLOAD" in
        "")      reply "400 Bad Request" "Missing request body" ;;
        "{"*"}") : ;;
        *)       reply "400 Bad Request" "Malformed JSON in request body" ;;
    esac
}

write_data() {
    local ID="$1" DATA="$2"
    local FILE="$NOTE_DIR/$NOTE_ID";
    read PREVIOUS <"$FILE"                     # (one line of file)
    [ "$DATA" = "$PREVIOUS" ] && return 0      # do nada if data is unchanged
    echo "$DATA" >"$FILE"
}

##############################################################################
##                                                                          ##
##  Main                                                                    ##
##                                                                          ##
##############################################################################

NOTE_ID="$1";            check_note_id "$NOTE_ID"
[ ! -t 0 ] && read JSON; check_payload "$JSON"
write_data "$NOTE_ID" "$JSON" \
    || reply "403 Forbidden" "Failed to write data"
reply "204 No Content"

#[eof]
