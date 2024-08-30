#!/usr/bin/bash

DOWNLOAD_ENDPOINT=${DOWNLOAD_ENDPOINT:-https://github.com/beyond-all-reason/spring/releases/download}
BAR_VERSION=${BAR_VERSION:-BAR105}
ENGINE_VERSION=${ENGINE_VERSION:-105.1.1-2414-g91273e4}
PLATFORM=${PLATFORM:-linux}


TMPDIR=${TMPDIR:-/tmp}
FILENAME="spring_bar_.${BAR_VERSION}.${ENGINE_VERSION}_${PLATFORM}-64-minimal-portable.7z"
URL="${DOWNLOAD_ENDPOINT}/spring_bar_%7B${BAR_VERSION}%7D${ENGINE_VERSION}/${FILENAME}"

echo "downloading ${URL} to ${TMPDIR}/${FILENAME}"
wget ${URL} -P ${TMPDIR}
mkdir -p engine
echo "extracting to folder engine"
7za x "${TMPDIR}/${FILENAME}" -oengine
