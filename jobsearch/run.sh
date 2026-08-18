#!/bin/bash
# Daily remote-job scan. Invoked by launchd (com.spiraldev.jobsearch) each morning.
# Runs the DAILY_JOB_SEARCH.md prompt headless and logs the transcript.

set -uo pipefail

REPO="/Users/mattgraf/dev/srv/my-custom-tailwind-resume"
CLAUDE="/Users/mattgraf/.local/bin/claude"
LOG_DIR="$REPO/jobsearch/logs"
STAMP="$(date +%Y-%m-%d)"

export PATH="/Users/mattgraf/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$LOG_DIR" "$REPO/jobsearch/reports" "$REPO/jobsearch/state"
[ -f "$REPO/jobsearch/state/seen.json" ] || echo "[]" > "$REPO/jobsearch/state/seen.json"

cd "$REPO" || exit 1

{
  echo "=== job scan start $(date) ==="
  "$CLAUDE" -p "$(cat "$REPO/jobsearch/DAILY_JOB_SEARCH.md")" \
    --permission-mode acceptEdits \
    --allowed-tools "Read,Write,Edit,Glob,Grep,Bash,WebSearch,WebFetch,mcp__claude_ai_Indeed__search_jobs,mcp__claude_ai_Indeed__get_job_details,mcp__claude_ai_Slack__slack_send_message"
  echo "=== job scan end   $(date) (exit $?) ==="
} >> "$LOG_DIR/$STAMP.log" 2>&1

# Keep two weeks of logs.
find "$LOG_DIR" -name '*.log' -mtime +14 -delete 2>/dev/null

exit 0
