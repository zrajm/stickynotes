#!/bin/dash
# -*- sh -*-

. "./api-functions.sh"

##############################################################################
# Accept one parameter (all other silently ignored):
#
#   * <BOARD_ID>/<NOTE_ID> -- return a single note to return
#   * <BOARD_ID>           -- return all notes on a board
#
# If no data directory exists for the specified board, then an empty JSON
# structure is retuned (appropriate since the board is empty).
##############################################################################

split_id "$1" BOARD_ID NOTE_ID REST
if [ -n "$REST" ]; then
    reply 400 "Exactly one slash required in parameter"
fi

check_id "$BOARD_ID" board
DIR="$NOTE_DIR/$BOARD_ID"
if [ -n "$NOTE_ID" ]; then
    set -- "$DIR/$NOTE_ID.json"                # put filename into $@
else
    set -- "$DIR/"*.json                       # expand glob into $@
    [ "$1" = "$DIR/*.json" ] && shift          # remove glob if not matching
fi

DATA=""
for FILE; do                                   # loop over $@
    NOTE_ID="${FILE#$DIR/}"                    #   strip path
    NOTE_ID="${NOTE_ID%.json}"                 #   strip ext
    check_id "$NOTE_ID" note

    read_data JSON "$FILE" 2>/dev/null
    check_json "$JSON" 500 "note '$NOTE_ID'"

    DATA="$DATA\"$NOTE_ID\":${JSON:-\{\}},"
done

reply 200 "{${DATA%,}}"

##############################################################################

#[eof]
