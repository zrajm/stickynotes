#!/bin/dash
# -*- sh -*-

. "./api-functions.sh"

##############################################################################

NOTE_ID="$1"
check_note_id "$NOTE_ID"
FILE="$NOTE_DIR/$NOTE_ID.json"

[ -t 0 ] || read DATA
check_json "$DATA" "400 Bad Request" "request body"
write_data "$FILE" "$DATA" 2>/dev/null

reply "204 No Content"

##############################################################################

#[eof]
