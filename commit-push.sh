#!/bin/bash

# CRAFT 2.0 - Quick Commit and Push Script
# Usage: ./commit-push.sh [commit message]

set -e

# Get current timestamp
timestamp=$(date "+%Y-%m-%d %H:%M:%S")

# Default commit message if none provided
if [ -z "$1" ]; then
    commit_message="Update: $timestamp

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
else
    commit_message="$1

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

echo "🔍 Checking git status..."
git status

echo ""
echo "📦 Adding all changes..."
git add .

echo ""
echo "💭 Committing with message:"
echo "\"$commit_message\""
git commit -m "$commit_message"

echo ""
echo "🚀 Pushing to remote repository..."
git push origin main

echo ""
echo "✅ Successfully committed and pushed to remote repository!"
echo "🌐 Repository: https://github.com/Vimal-ZP/CRAFT2.0"