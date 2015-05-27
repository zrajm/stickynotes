# -*- sh -*-

NOTE_DIR="../data"
trap reply 0
set -e

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

# http://www.restapitutorial.com/httpstatuscodes.html
http_status_msg() {
    case "$1" in
        200) echo "OK" ;;
        204) echo "No Content" ;;
        400) echo "Bad Request" ;;
        403) echo "Forbidden" ;;
        404) echo "Not Found" ;;
        500) echo "Internal Server Error" ;;
        *)   echo "NO ERROR DESCRIPTION" ;;
    esac
}

# Usage: reply STATUSCODE MSG|BODY
#
# Terminates script and outputs HTTP response. This is the ONLY way you should
# terminate your script. If STATUSCODE is 200-something (= HTTP 'Success') the
# second argument will be used as the response body, otherwise the second
# argument will used in the error message (in Chrome this message is displayed
# in the console).
#
# Use 'reply' as an EXIT trap ('trap reply 0') to make it catch all instances
# where script was terminated by other means ('exit', reaching end of file,
# command returning false under 'set -e' etc). Used this way you'll get a
# proper HTTP error reported even in these instances.
#
reply() {
    local CODE="${1:-$?}" MSG="$2"             # CODE = arg or prev exit status
    trap - 0
    case "$CODE" in
        2??) BODY="$MSG"; MSG="" ;;            # HTTP success
        ???) : ;;                              # HTTP failure
        *) MSG="Exit code $CODE"; CODE=500 ;;  # shell trap
    esac
    echo "Status: $CODE $(http_status_msg "$CODE")${MSG:+: $MSG}"
    echo "Content-Type: application/json"
    echo
    [ -n "$BODY" ] && echo "$BODY"
    exit 0
}

# Usage: STRING VAR1 VAR2[..]
#
# Split STRING on slash, return the various parts in the named variables
# (intended for BOARD/NOTE IDs). If there are more VAR(s) named than there are
# parts in STRING, then the last VAR(s) will be empty. If there are more parts
# in STRING than VAR(s), then the last VAR will continue all the parts that
# remain in STRING.
split_id() {
    local VAR="$1"
    shift 1
    eval "IFS=/ read $*" <<EOF
$VAR
EOF
}

check_id() {
    local ID="$1" TYPE="$2"
    local MSG="in $TYPE ID"                    # 'in board ID' / 'in note ID'
    case "$ID" in
        "")               reply 400 "Missing $TYPE ID" ;;
        *[!a-zA-Z0-9_-]*) reply 400 "Invalid char $MSG" ;;
        ??????????????????????) : ;;           # ID string = 22 characters
        *)                reply 400 "Not 22 characters $MSG" ;;
    esac
}

# Split ID into board & note ID and check them.
check_full_id() {
    local FULL_ID="$1" BOARD_ID NOTE_ID REST
    split_id "$FULL_ID" BOARD_ID NOTE_ID REST
    if [ -n "$REST" ]; then
        reply 400 "Exactly one slash required in parameter"
    fi
    check_id "$BOARD_ID" board
    check_id  "$NOTE_ID" note
}

# Very simplistic check. Only look to see that JSON data starts and ends with
# curly braces.
check_json() {
    local JSON="$1" CODE="$2" MSG="$3"
    case "$JSON" in
        "{"*"}") : ;;
        "") reply "$CODE"   "Missing data${MSG:+ in $MSG}" ;;
        *)  reply "$CODE" "Malformed JSON${MSG:+ in $MSG}" ;;
    esac
}

make_dir() {
    local DIR="$1"
    [ -d "$DIR" ] && return                    # skip if dir already exists
    mkdir -p "$DIR" 2>/dev/null || {
        reply 500 "Failed to create data dir for board"
    }
}

# Usage: read_data VARIABLE FILE
#
# Reads first line of FILE into variable VARIABLE.
read_data() {
    read -r "$1" <"$2" || {
        [ -e "$FILE" ] || reply 404 "File missing"
        [ -r "$FILE" ] || reply 403 "File read protected"
        reply 500 "Failed to read file"
    }
}

# Will not overwrite any previously existing file unless the content has
# actually changed (to avoid triggering `poll.cgi` unless necessary). Any dir
# required will also be created.
write_data() {
    local FILE="$1" DATA="$2"
    read -r PREVIOUS <"$FILE" || :             # ignore non-existing old file
    [ "$DATA" = "$PREVIOUS" ] && return 0      # do nada if data is unchanged
    make_dir "$NOTE_DIR"
    echo "$DATA" >"$FILE" || {
        [ -w "$FILE" ] || reply 403 "File write protected"
        reply 500 "Failed to write file"
    }
}

#[eof]
