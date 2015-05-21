#!/bin/dash
# -*- sh -*-

. "./api-functions.sh"

##############################################################################
# Accept one parameter (all other silently ignored):
#
#   * <BOARD_ID>/<NOTE_ID> -- write a single note
#
# If no data directory exists for the specified board, then one is created
# before attempting to write note data.
##############################################################################

FULL_ID="$1"                                   # BOARD_ID/NOTE_ID
check_full_id "$FULL_ID"
FILE="$NOTE_DIR/$FULL_ID.json"

[ -t 0 ] || read -r DATA
check_json "$DATA" "400 Bad Request" "request body"
write_data "$FILE" "$DATA" 2>/dev/null

reply "204 No Content"

##############################################################################

#[eof]
