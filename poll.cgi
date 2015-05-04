#!/bin/dash
#-*- sh -*-

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

NOTE_ID="$(inotifywait notes/ -qre close_write,delete --format=%f)"
FILE="$NOTE_DIR/$NOTE_ID";

if [ -e "$FILE" ]; then
    read DATA <"$FILE" || {
        [ -r "$FILE" ] || reply "403 Forbidden" "File read protected"
    }
    check_json "$DATA" "500 Internal Server Error" "file"
fi

reply "200 OK"
echo "{\"$NOTE_ID\":${DATA:-null}}"

#[eof]
