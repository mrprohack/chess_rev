#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f android/settings.gradle.kts && ! -f android/settings.gradle ]]; then
  flutter create --platforms=android --org com.reviewchess --project-name reviewchess .
fi

if [[ -f android/app/build.gradle.kts ]]; then
  sed -i 's/com\.reviewchess\.reviewchess/com.reviewchess.app/g' android/app/build.gradle.kts
elif [[ -f android/app/build.gradle ]]; then
  sed -i 's/com\.reviewchess\.reviewchess/com.reviewchess.app/g' android/app/build.gradle
fi

rm -rf android/app/src/main/kotlin/com/reviewchess/reviewchess
mkdir -p android/app/src/main/kotlin/com/reviewchess/app
cp tool/android/MainActivity.kt android/app/src/main/kotlin/com/reviewchess/app/MainActivity.kt
cp tool/android/AndroidManifest.xml android/app/src/main/AndroidManifest.xml
