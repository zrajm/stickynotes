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

# Make sure file name(s) are in $@.
case "$1" in
    */*)                                       # BOARD_ID/NOTE_ID
        FULL_ID="$1"
        check_full_id "$FULL_ID"
        set -- "$NOTE_DIR/$FULL_ID.json" ;;    #   add path & extension in $@
    *)                                         # BOARD_ID only
        BOARD_ID="$1"
        check_id "$BOARD_ID" board
        set -- "$NOTE_DIR/$BOARD_ID/"*.json    #   expand glob into $@
        [ "$1" = "$NOTE_DIR/$BOARD_ID/*.json" ] \
            && shift ;;                        #   remove glob if no match
esac

DATA=""
for FILE; do                                   # loop over $@
    NOTE_ID="${FILE##*/}"                      #   strip path
    NOTE_ID="${NOTE_ID%.json}"                 #   strip ext
    check_id "$NOTE_ID" note

    read_data JSON "$FILE" 2>/dev/null
    check_json "$JSON" 500 "note '$NOTE_ID'"

    DATA="$DATA\"$NOTE_ID\":${JSON:-\{\}},"
done

reply 200 "{${DATA%,}}"

##############################################################################

#[eof]
