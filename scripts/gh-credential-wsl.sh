#!/bin/bash
# Wrapper do gh (Windows) para o git do WSL usar como credential helper.
exec "/mnt/c/Program Files/GitHub CLI/gh.exe" auth git-credential "$@"
