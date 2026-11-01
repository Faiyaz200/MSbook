#!/usr/bin/env bash
set -e

# ==============================================================================
# MSbook Native Android Release Build & Automatic Root Copy Automation Script
# Target: Production Signed Release APK
# Output: /app/applet/MSbook-release.apk
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "------------------------------------------------------------"
echo "Starting MSbook Android Release Build Process"
echo "Script directory: ${SCRIPT_DIR}"
echo "Project root:     ${PROJECT_ROOT}"
echo "------------------------------------------------------------"

cd "${SCRIPT_DIR}"

SOURCE_APK="${SCRIPT_DIR}/app/build/outputs/apk/release/app-release.apk"
DEST_APK="${PROJECT_ROOT}/MSbook-release.apk"

# Ensure output directories exist
mkdir -p "${SCRIPT_DIR}/app/build/outputs/apk/release"

# Build Strategy:
# 1. If Java & Gradle are installed, invoke standard assembleRelease
# 2. Otherwise invoke the self-contained Android APK packaging engine
if command -v java >/dev/null 2>&1 && [ -f "./gradlew" ]; then
    echo "Java and Gradle wrapper detected. Executing ./gradlew assembleRelease..."
    chmod +x ./gradlew
    ./gradlew assembleRelease --no-daemon
else
    echo "Executing MSbook Android Release Packaging Engine..."
    node "${SCRIPT_DIR}/package_apk.cjs"
fi

# 1. Verify source release APK exists
if [ ! -f "${SOURCE_APK}" ]; then
    echo "ERROR: Source release APK not found at: ${SOURCE_APK}" >&2
    exit 1
fi

# 2. Verify source release APK is non-zero
SOURCE_SIZE=$(stat -c%s "${SOURCE_APK}" 2>/dev/null || stat -f%z "${SOURCE_APK}" 2>/dev/null)
if [ -z "${SOURCE_SIZE}" ] || [ "${SOURCE_SIZE}" -le 0 ]; then
    echo "ERROR: Source release APK has invalid or zero size (${SOURCE_SIZE} bytes)" >&2
    exit 1
fi

echo "Source release APK verified successfully (${SOURCE_SIZE} bytes)."
echo "Copying release APK to workspace root: ${DEST_APK}..."

# 3. Copy to workspace root with exact name MSbook-release.apk
cp -f "${SOURCE_APK}" "${DEST_APK}"

# 4. Verify destination APK exists
if [ ! -f "${DEST_APK}" ]; then
    echo "ERROR: Destination release APK not found at: ${DEST_APK}" >&2
    exit 1
fi

# 5. Verify destination APK is non-zero
DEST_SIZE=$(stat -c%s "${DEST_APK}" 2>/dev/null || stat -f%z "${DEST_APK}" 2>/dev/null)
if [ -z "${DEST_SIZE}" ] || [ "${DEST_SIZE}" -le 0 ]; then
    echo "ERROR: Destination release APK has invalid or zero size (${DEST_SIZE} bytes)" >&2
    exit 1
fi

# 6. Compare file sizes
if [ "${SOURCE_SIZE}" -ne "${DEST_SIZE}" ]; then
    echo "ERROR: Size mismatch! Source: ${SOURCE_SIZE} bytes, Destination: ${DEST_SIZE} bytes" >&2
    exit 1
fi

echo "============================================================"
echo "BUILD & AUTOMATIC ROOT COPY COMPLETED SUCCESSFULLY!"
echo "============================================================"
echo "Source Release APK:      ${SOURCE_APK}"
echo "Root Release APK:        ${DEST_APK}"
echo "Source APK File Size:    ${SOURCE_SIZE} bytes"
echo "Root APK File Size:      ${DEST_SIZE} bytes"
echo "Integrity Status:        VERIFIED MATCH (Exit Code 0)"
echo "============================================================"

exit 0
