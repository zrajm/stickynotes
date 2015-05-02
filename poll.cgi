#!/bin/dash
#-*- sh -*-

DIR="notes"

NOTE_ID="$(inotifywait notes/ -qre close_write --format=%f)"
read EVENT <"$DIR/$NOTE_ID"

echo "Content-Type: application/json"
echo
echo "{\"$NOTE_ID\":$EVENT}"

#[eof]
