#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Build Release Android APK — Novesia Mobile
# Output Target: /Users/suryahalim/IT Surya/NovelUpdate/_draft/Build/APK
# ==============================================================================

PROJECT_DIR="/Users/suryahalim/IT Surya/NovelUpdate/novesia-app"
OUTPUT_DIR="/Users/suryahalim/IT Surya/NovelUpdate/_draft/Build/APK"
VERSION_NAME="1.1.4"
VERSION_CODE="14"

echo "========================================================"
echo "🚀 MEMULAI BUILD RELEASE APK NOVESIA (v${VERSION_NAME} - VC ${VERSION_CODE})"
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

# 4. Bersihkan Cache & Build APK
cd "$PROJECT_DIR/android"

echo ""
echo "🧹 Membersihkan cache build native & .cxx..."
rm -rf app/.cxx app/build build

echo ""
echo "⚙️ Menjalankan assembleRelease (Android APK)..."
./gradlew assembleRelease --no-daemon

# 5. Salin Hasil APK ke Direktori Tujuan (Hanya 1 file versioned, tanpa duplikat)
APK_SRC="$PROJECT_DIR/android/app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_SRC" ]; then
  echo "❌ ERROR: Gagal menemukan file APK di $APK_SRC"
  exit 1
fi

DEST_VERSIONED="$OUTPUT_DIR/novesia-v${VERSION_NAME}-vc${VERSION_CODE}-release.apk"

cp -f "$APK_SRC" "$DEST_VERSIONED"

echo ""
echo "========================================================"
echo "✅ BUILD APK SELESAI & SUKSES 100%!"
echo "========================================================"
ls -lh "$DEST_VERSIONED"
echo ""
echo "📂 Lokasi File:"
echo "   👉 $DEST_VERSIONED"
echo "========================================================"
