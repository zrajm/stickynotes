# -*- sh -*-

NOTE_DIR="../data"

# This script modifies the strings passed with the HTTP status code in order
# to give more intelligeble output in the Chrome console. As far as I know
# this is in accordance with the HTTP stardard. For a fuller discussion see
# the following thread on stackoverflow:
# http://stackoverflow.com/questions/8102208 "Is it acceptable to modify the
# text sent with the HTTP status code?"

##############################################################################
##                                                                          ##
##  Functions                                                               ##
##                                                                          ##
##############################################################################

reply() {
    local STATUS="$1" DETAILS="$2"
    echo "Status: $STATUS${DETAILS:+: $DETAILS}"
    echo "Content-Type: application/json"
    echo
    case "$STATUS" in                          # exit on non-2xx status
        2*) :    ;;
        *)  exit ;;
    esac
}

check_id() {
    local ID="$1" TYPE="$2"
    local MSG="in $TYPE ID"                    # 'in board ID' / 'in note ID'
    case "$ID" in
        "")               reply "400 Bad Request" "Missing $TYPE ID" ;;
        *[!a-zA-Z0-9_-]*) reply "400 Bad Request" "Invalid char $MSG" ;;
        ??????????????????????) : ;;           # ID string = 22 characters
        *)                reply "400 Bad Request" "Not 22 chars long $MSG" ;;
    esac
}

# Split ID into board & note ID and check them.
check_full_id() {
    local IFS="/"
    set -- $1                                  # split on slash into $@
    [ $# -eq 2 ] \
        || reply "400 Bad Request" "Exactly one slash required in parameter"
    local BOARD_ID="$1" NOTE_ID="$2"
    check_id "$BOARD_ID" board
    check_id  "$NOTE_ID" note
}

# Very simplistic check. Only look to see that JSON data starts and ends with
# curly braces.
check_json() {
    local JSON="$1" ERROR="$2" MSG="$3"
    case "$JSON" in
        "{"*"}") : ;;
        "") reply "$ERROR"   "Missing data${MSG:+ in $MSG}" ;;
        *)  reply "$ERROR" "Malformed JSON${MSG:+ in $MSG}" ;;
    esac
}

make_dir() {
    local DIR="$1"
    [ -d "$DIR" ] && return                    # skip if dir already exists
    mkdir -p "$DIR" 2>/dev/null || {
        reply "500 Internal Server Error" \
            "Failed to create data dir for board"
    }
}

# Usage: read_data VARIABLE FILE
#
# Reads first line of FILE into variable VARIABLE.
read_data() {
    read -r "$1" <"$2" || {
        [ -e "$FILE" ] || reply "404 Not Found" "File missing"
        [ -r "$FILE" ] || reply "403 Forbidden" "File read protected"
        reply "500 Internal Server Error" "Failed to read file"
    }
}

# Will not overwrite any previously existing file unless the content has
# actually changed (to avoid triggering `poll.cgi` unless necessary). Any dir
# required will also be created.
write_data() {
    local FILE="$1" DATA="$2"
    read -r PREVIOUS <"$FILE"                  # (one line of file)
    [ "$DATA" = "$PREVIOUS" ] && return 0      # do nada if data is unchanged
    make_dir "$NOTE_DIR"
    echo "$DATA" >"$FILE" || {
        [ -w "$FILE" ] || reply "403 Forbidden" "File write protected"
        reply "500 Internal Server Error" "Failed to write file"
    }
}

#[eof]
