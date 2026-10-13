#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_URL="${1:-${NOTE_FOREST_URL:-https://note-forest.pages.dev}}"
APP_VERSION="${NOTE_FOREST_VERSION:-1.0.0}"
if [[ "$APP_URL" != https://* ]]; then
  echo "Use an HTTPS app URL, for example https://note-forest.pages.dev" >&2
  exit 1
fi

OUTPUT_DIR="$PROJECT_ROOT/dist/macos"
TEMP_DIR="$(mktemp -d)"
APP_PATH="$OUTPUT_DIR/Note Forest.app"
STAGE_DIR="$TEMP_DIR/Note Forest Installer"
ICON_TIFF="$TEMP_DIR/note-forest-icon.tiff"
DMG_PATH="$OUTPUT_DIR/note-forest-macos.dmg"

cleanup() { rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

rm -rf "$APP_PATH"
mkdir -p "$OUTPUT_DIR" "$APP_PATH/Contents/MacOS" "$APP_PATH/Contents/Resources" "$STAGE_DIR"

SDKROOT="$(xcrun --sdk macosx --show-sdk-path)"
for ARCH in arm64 x86_64; do
  swiftc -O -parse-as-library -target "$ARCH-apple-macosx13.0" -sdk "$SDKROOT" \
    -module-cache-path "$TEMP_DIR/ModuleCache-$ARCH" -framework Cocoa -framework WebKit \
    "$PROJECT_ROOT/macos/NoteForest/App.swift" \
    -o "$TEMP_DIR/NoteForest-$ARCH"
done
lipo -create "$TEMP_DIR/NoteForest-arm64" "$TEMP_DIR/NoteForest-x86_64" \
  -output "$APP_PATH/Contents/MacOS/NoteForest"

swiftc -O -module-cache-path "$TEMP_DIR/ModuleCache" -framework Cocoa \
  "$PROJECT_ROOT/macos/NoteForest/MakeIcon.swift" \
  -o "$TEMP_DIR/MakeIcon"
"$TEMP_DIR/MakeIcon" "$ICON_TIFF"
tiff2icns "$ICON_TIFF" "$APP_PATH/Contents/Resources/NoteForest.icns" >/dev/null

cat > "$APP_PATH/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key><string>ko</string>
  <key>CFBundleExecutable</key><string>NoteForest</string>
  <key>CFBundleIconFile</key><string>NoteForest</string>
  <key>CFBundleIdentifier</key><string>kr.yyyerin.noteforest</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>Note Forest</string>
  <key>CFBundleDisplayName</key><string>노트숲</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.productivity</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key><string>NSApplication</string>
  <key>NoteForestURL</key><string>https://note-forest.pages.dev</string>
</dict>
</plist>
PLIST

/usr/libexec/PlistBuddy -c "Set :NoteForestURL $APP_URL" "$APP_PATH/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $APP_VERSION" "$APP_PATH/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $APP_VERSION" "$APP_PATH/Contents/Info.plist"
codesign --force --deep --sign - "$APP_PATH"

cp -R "$APP_PATH" "$STAGE_DIR/Note Forest.app"
ln -s /Applications "$STAGE_DIR/Applications"
rm -f "$DMG_PATH"
hdiutil create -volname "노트숲 설치" -srcfolder "$STAGE_DIR" -ov -format UDZO "$DMG_PATH" >/dev/null

echo "Created: $DMG_PATH"
echo "App URL: $APP_URL"
