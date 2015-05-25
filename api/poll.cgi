#!/bin/dash
#-*- sh -*-

. "./api-functions.sh"

##############################################################################
# Accept one parameter (all other silently ignored):
#
#   * <BOARD_ID> -- long poll for any changes a board
#
# If no data directory exists for the specified board, then one is created

##############################################################################

BOARD_ID="$1"
check_id "$BOARD_ID" board
NOTE_DIR="$NOTE_DIR/$BOARD_ID"
make_dir "$NOTE_DIR"

NOTE_ID="$(inotifywait "$NOTE_DIR" -qre close_write,delete --format=%f)" || {
    if ! which inotifywait >/dev/null; then
        reply 500 "Command 'inotifywait' is not installed"
    fi
    reply 500 "Command 'inotifywait' returned non-zero"
}
NOTE_ID="${NOTE_ID%.json}"
FILE="$NOTE_DIR/$NOTE_ID.json"

DATA="null"
if [ -e "$FILE" ]; then
    read_data DATA "$FILE" 2>/dev/null
    check_json "$DATA" 500 "file"
fi

reply 200 "{\"$NOTE_ID\":$DATA}"

##############################################################################

#[eof]
