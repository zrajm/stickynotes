#!/bin/dash
# -*- sh -*-

. "./api-functions.sh"

##############################################################################
# Accept one parameter (all other silently ignored):
#
#   * <BOARD_ID>/<NOTE_ID> -- delete a single note
#
##############################################################################

FULL_ID="$1"
check_full_id "$FULL_ID"
FILE="$NOTE_DIR/$FULL_ID.json"

# Intentionally ignoring "missing file" errors (since delete will be invoked
# even on self-created long polls, where no 'by' field can be passed).
rm -f "$FILE" 2>/dev/null || reply 500 "Failed to delete file"

reply 204

##############################################################################

#[eof]
