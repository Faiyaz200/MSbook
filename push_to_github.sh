#!/usr/bin/env bash
set -e

# ==============================================================================
# MSbook: GitHub Repository Connect & Push Helper
# Usage: ./push_to_github.sh <YOUR_GITHUB_REPO_URL>
# Example: ./push_to_github.sh https://github.com/faiyazv97/msbook.git
# ==============================================================================

if [ -z "$1" ]; then
    echo "======================================================================"
    echo "MSbook GitHub Pusher"
    echo "======================================================================"
    echo "Usage: ./push_to_github.sh <YOUR_GITHUB_REPO_URL>"
    echo ""
    echo "Example:"
    echo "  ./push_to_github.sh https://github.com/your-username/MSbook.git"
    echo "======================================================================"
    exit 1
fi

REPO_URL="$1"

echo "Configuring remote origin: ${REPO_URL}..."
if git remote | grep -q "origin"; then
    git remote set-url origin "${REPO_URL}"
else
    git remote add origin "${REPO_URL}"
fi

echo "Verifying remote..."
git remote -v

echo "Pushing branch 'main' to GitHub..."
git push -u origin main

echo ""
echo "======================================================================"
echo "SUCCESS! Code pushed to ${REPO_URL}"
echo "GitHub Actions will now automatically build your installable .apk!"
echo "Check your repository's 'Actions' tab on GitHub to download the APK."
echo "======================================================================"
