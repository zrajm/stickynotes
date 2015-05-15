#!/bin/dash
# -*- sh -*-

. "./api-functions.sh"

##############################################################################

NOTE_ID="$1"
check_note_id "$NOTE_ID"
FILE="$NOTE_DIR/$NOTE_ID.json"

rm -f "$FILE" 2>/dev/null \
    || reply "500 Internal Server Error" "Failed to delete file"

reply "204 No Content"

##############################################################################

#[eof]
