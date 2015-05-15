#!/bin/dash
# -*- sh -*-

. "./api-functions.sh"

##############################################################################

change_dir "$NOTE_DIR"

DATA=""
for FILE in ??????????????????????.json; do    # note ID = 22 characters
    NOTE_ID="${FILE%.json}"
    check_note_id "$NOTE_ID"

    read_data JSON "$FILE" 2>/dev/null
    check_json "$JSON" "500 Internal Server Error" "note '$NOTE_ID'"

    DATA="$DATA\"$NOTE_ID\":${JSON:-\{\}},"
done

reply "200 OK"
echo "{${DATA%,}}"

##############################################################################

#[eof]
