#!/usr/bin/env bash

set -euo pipefail

DIST="dist"
REPOSITORY="git@github.com:isweibin/ratchet-meds.git"
BRANCH="gh-pages"

if [ ! -f "$DIST/index.html" ]; then
    echo "Error: '$DIST/index.html' does not exist."
    exit 1
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

cp -a "$DIST"/. "$tmp"

pushd "$tmp" > /dev/null

git init
git branch -M "$BRANCH"
git remote add origin "$REPOSITORY"

git add .
git commit -m "deploy: update site"

git push -f origin "$BRANCH"

popd > /dev/null