#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Build Release Android App Bundle (AAB) — Novesia Mobile
# Output Target: /Users/suryahalim/IT Surya/NovelUpdate/_draft/Build/AAB
# ==============================================================================

PROJECT_DIR="/Users/suryahalim/IT Surya/NovelUpdate/novesia-app"
OUTPUT_DIR="/Users/suryahalim/IT Surya/NovelUpdate/_draft/Build/AAB"
VERSION_NAME="1.1.5"
VERSION_CODE="15"

echo "========================================================"
echo "🚀 MEMULAI BUILD RELEASE AAB NOVESIA (v${VERSION_NAME} - VC ${VERSION_CODE})"
echo "========================================================"

# 1. Pastikan Environment SDK & JDK Terpasang
export ANDROID_HOME="${ANDROID_HOME:-/Users/suryahalim/Library/Android/sdk}"
export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "📍 JAVA_HOME    : $JAVA_HOME"
echo "📍 ANDROID_HOME : $ANDROID_HOME"

# 2. Validasi Keystore Release
KEYSTORE_PATH="$PROJECT_DIR/keystores/novesia-release.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "❌ ERROR: File keystore release tidak ditemukan di $KEYSTORE_PATH"
  exit 1
fi
echo "🔑 Keystore     : Terverifikasi ($KEYSTORE_PATH)"

# 3. Siapkan Output Directory
mkdir -p "$OUTPUT_DIR"

# 4. Bersihkan Cache & Build AAB
cd "$PROJECT_DIR/android"

# Pastikan google-services.json ada di lokasi yang dicari Gradle plugin
if [ -f "$PROJECT_DIR/google-services.json" ]; then
  cp -f "$PROJECT_DIR/google-services.json" "$PROJECT_DIR/android/app/google-services.json"
  echo "📋 google-services.json disalin ke android/app/"
fi

echo ""
echo "⚙️ Menjalankan build bundleRelease (Google Play App Bundle)..."
./gradlew bundleRelease --no-daemon

# 5. Salin Hasil AAB ke Direktori Tujuan
AAB_SRC="$PROJECT_DIR/android/app/build/outputs/bundle/release/app-release.aab"

if [ ! -f "$AAB_SRC" ]; then
  echo "❌ ERROR: Gagal menemukan file AAB di $AAB_SRC"
  exit 1
fi

DEST_VERSIONED="$OUTPUT_DIR/novesia-v${VERSION_NAME}-vc${VERSION_CODE}-release.aab"

cp -f "$AAB_SRC" "$DEST_VERSIONED"

echo ""
echo "========================================================"
echo "✅ BUILD AAB SELESAI & SUKSES 100%!"
echo "========================================================"
ls -lh "$DEST_VERSIONED"
echo ""
echo "📂 Lokasi File:"
echo "   👉 $DEST_VERSIONED"
echo "========================================================"
