#!/bin/dash
# -*- sh -*-

NOTE_DIR="notes"

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
[ ! -t 0 ] && read JSON; check_json "$JSON" "400 Bad Request" "request body"
write_data "$NOTE_ID" "$JSON" \
    || reply "403 Forbidden" "File write protected"
reply "204 No Content"

#[eof]
