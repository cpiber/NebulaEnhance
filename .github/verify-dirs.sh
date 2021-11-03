#!/bin/bash

locales=$(find extension-dist/_locales -not -name "*.json" -type f)
scripts=$(find extension-dist/scripts -not -name "*.js" -type f)
styles=$(find extension-dist/styles -not -name "*.css" -not -name "*.woff2" -type f)
if [ -n "$locales" ] || [ -n "$scripts" ] || [ -n "$styles" ]; then
  echo "::group::Files found"
  echo -e "\nIn _locales"
  echo "$locales"
  echo -e "\nIn scripts"
  echo "$scripts"
  echo -e "\nIn styles"
  echo "$styles"
  echo "::endgroup::"
  echo "::error ::Found files that do not belong!"
  exit 1
fi