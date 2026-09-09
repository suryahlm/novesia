#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Build Release Android App Bundle (AAB) — Novesia Mobile
# Output Target: /Users/suryahalim/IT Surya/NovelUpdate/_draft/Build/AAB
# ==============================================================================

PROJECT_DIR="/Users/suryahalim/IT Surya/NovelUpdate/novesia-app"
OUTPUT_DIR="/Users/suryahalim/IT Surya/NovelUpdate/_draft/Build/AAB"
VERSION_NAME="1.1.1"
VERSION_CODE="11"

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

echo ""
echo "🧹 Membersihkan cache build native & .cxx..."
rm -rf app/.cxx app/build build

echo ""
echo "⚙️ Menjalankan bundleRelease (Google Play App Bundle)..."
./gradlew bundleRelease --no-daemon

# 5. Salin Hasil AAB ke Direktori Tujuan
AAB_SRC="$PROJECT_DIR/android/app/build/outputs/bundle/release/app-release.aab"

if [ ! -f "$AAB_SRC" ]; then
  echo "❌ ERROR: Gagal menemukan file AAB di $AAB_SRC"
  exit 1
fi

DEST_VERSIONED="$OUTPUT_DIR/novesia-v${VERSION_NAME}-vc${VERSION_CODE}-release.aab"
DEST_LATEST="$OUTPUT_DIR/novesia-release-latest.aab"

cp -f "$AAB_SRC" "$DEST_VERSIONED"
cp -f "$AAB_SRC" "$DEST_LATEST"

echo ""
echo "========================================================"
echo "✅ BUILD AAB SELESAI & SUKSES 100%!"
echo "========================================================"
ls -lh "$DEST_VERSIONED"
ls -lh "$DEST_LATEST"
echo ""
echo "📂 Lokasi File:"
echo "   1. $DEST_VERSIONED"
echo "   2. $DEST_LATEST"
echo "========================================================"
