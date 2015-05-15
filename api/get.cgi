#!/bin/dash
# -*- sh -*-

. "./api-functions.sh"

##############################################################################

NOTE_ID="$1"
check_note_id "$NOTE_ID"
FILE="$NOTE_DIR/$NOTE_ID.json"

read_data DATA "$FILE" 2>/dev/null
check_json "$DATA" "500 Internal Server Error" "file"

reply "200 OK"
echo "$DATA"

##############################################################################

#[eof]
