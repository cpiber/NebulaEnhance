#!/bin/bash

dev=$(grep --color=always -n "devClone\|devExport\|(()=>{})" $(find extension-dist -name "*.js"))
if [ -n "$dev" ]; then
  echo "::group::Invalid statements"
  echo "$dev"
  echo "::endgroup::"
  echo "::error ::Found statements that shouldn't be in the production build!"
  exit 1
fi
exit 0