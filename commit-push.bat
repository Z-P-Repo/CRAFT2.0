@echo off
REM CRAFT 2.0 - Quick Commit and Push Script for Windows
REM Usage: commit-push.bat [commit message]

setlocal enabledelayedexpansion

REM Get current timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=!dt:~0,4!-!dt:~4,2!-!dt:~6,2! !dt:~8,2!:!dt:~10,2!:!dt:~12,2!"

REM Default commit message if none provided
if "%~1"=="" (
    set "commit_message=Update: !timestamp!"
) else (
    set "commit_message=%~1"
)

REM Add signature
set "commit_message=!commit_message!

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo 🔍 Checking git status...
git status

echo.
echo 📦 Adding all changes...
git add .

echo.
echo 💭 Committing with message:
echo "!commit_message!"
git commit -m "!commit_message!"

echo.
echo 🚀 Pushing to remote repository...
git push origin main

echo.
echo ✅ Successfully committed and pushed to remote repository!
echo 🌐 Repository: https://github.com/Vimal-ZP/CRAFT2.0

pause