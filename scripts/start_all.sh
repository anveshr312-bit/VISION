#!/usr/bin/env bash
# VISION - Master Launcher for Git Bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

echo "==============================================================================="
echo "VISION: Vital Intelligence for System Integrity, Observation & Nostics"
echo "Master Launcher (Git Bash / Windows)"
echo "==============================================================================="

cmd.exe /c "scripts\\start_all.bat"

