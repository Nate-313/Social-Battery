#!/bin/sh
# Builds the single-file demo: index.html (for GitHub Pages) and, if given, an artifact copy without the document skeleton.
cd "$(dirname "$0")"
JS="src/data.js src/core.js src/scene.js src/ui.js src/session.js src/map.js src/chats.js src/stats.js src/misc.js"
{ cat src/head.html; cat src/body.html; echo "<script>"; cat $JS; echo "</script>"; } > .content.html
{ echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#FDF0FF"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box;height:100%}*,*::before,*::after{box-sizing:border-box}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'; cat .content.html; echo '</body></html>'; } > index.html
[ -n "$1" ] && cp .content.html "$1"
rm .content.html
