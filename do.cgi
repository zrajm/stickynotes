#!/bin/dash

NOTE_DIR="notes"
LOG_FILE="index.log"

debug() { echo "$@" >>"$LOG_FILE"; }

##############################################################################

NOTE_ID="$1"

# Note ID must only contain alphanumeric characters.
case "$NOTE_ID" in
    *[!a-z0-9]*)
        debug "!!! $NOTE_ID -- Non-alphanumeric note ID"
        exit 2 ;;
esac

##############################################################################

FILE="$NOTE_DIR/$NOTE_ID";
case "$REQUEST_METHOD" in
    PUT)
        read OLD_PAYLOAD <"$FILE"
        read NEW_PAYLOAD
        if [ "$NEW_PAYLOAD" != "$OLD_PAYLOAD" ]; then
            debug "PUT $NOTE_ID -- $NEW_PAYLOAD"
            echo "$NEW_PAYLOAD" >"$FILE"
        fi
        echo "Content-Type: application/JSON\n" ;;
    GET)
        read PAYLOAD <"$FILE"
        debug "GET $NOTE_ID -- $PAYLOAD"
        echo "Content-Type: application/json\n"
        echo $PAYLOAD ;;
    DELETE)                                    # FIXME: Not tested
        debug "DEL $NOTE_ID"
        echo "Content-Type: application/json\n"
        rm -f "$FILE" ;;
    "") echo "This is a CGI script, it can't be run from the command line" >&2 ;;
    *)  echo "Unknown request method '$REQUEST_METHOD'" >&2 ;;
esac

#[eof]
