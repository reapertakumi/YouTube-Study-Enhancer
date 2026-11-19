#!/bin/bash
# Renders icon.svg to icon16/48/128.png (transparent) via headless Chrome + PIL downscale.
cd "$(dirname "$0")"
D="$(pwd -W)"
cat > _wrap.html <<H
<html><body style="margin:0;background:transparent"><img src="icon.svg" style="width:1024px;height:1024px;display:block"></body></html>
H
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
  --default-background-color=00000000 --user-data-dir="$TEMP/yse-icon-profile" --force-device-scale-factor=1 \
  --window-size=1024,1024 --screenshot="$D/_big.png" "file:///$D/_wrap.html" 2>/dev/null
py - <<P
from PIL import Image
big = Image.open('_big.png').convert('RGBA')
for s in (128, 48, 16):
    big.resize((s, s), Image.LANCZOS).save(f'icon{s}.png')
P
rm -f _wrap.html _big.png
echo done
