#!/bin/dash
#-*- sh -*-

. "./api-functions.sh"

##############################################################################

NOTE_ID="$(inotifywait "$NOTE_DIR" -qre close_write,delete --format=%f)" || {
    if ! which inotifywait >/dev/null; then
        reply "500 Internal Server Error" \
            "Command 'inotifywait' is not installed"
    fi
    reply "500 Internal Server Error" \
        "Command 'inotifywait' returned non-zero"
}
NOTE_ID="${NOTE_ID%.json}"
FILE="$NOTE_DIR/$NOTE_ID.json"

DATA="null"
if [ -e "$FILE" ]; then
    read_data DATA "$FILE" 2>/dev/null
    check_json "$DATA" "500 Internal Server Error" "file"
fi

reply "200 OK"
echo "{\"$NOTE_ID\":$DATA}"

##############################################################################

#[eof]
