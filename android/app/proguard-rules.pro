# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo modules & React Native ViewManagers/NativeModules
-keep class expo.modules.** { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod <methods>; }
-keep class com.swmansion.rnscreens.** { *; }

# Google Mobile Ads (AdMob)
-keep class com.google.android.gms.ads.** { *; }
-keep interface com.google.android.gms.ads.** { *; }

# Google Play Core (In-App Updates)
-keep class com.google.android.play.core.** { *; }
-keep interface com.google.android.play.core.** { *; }

# Google Sign-In & Play Services Auth
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep interface com.google.android.gms.common.** { *; }

# React Native Gesture Handler & Worklets
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.worklets.** { *; }

# Expo Updates
-keep class expo.modules.updates.** { *; }

# OkHttp & Network Warnings
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**

# Preserve source file & line numbers for crash analysis
-keepattributes SourceFile,LineNumberTable

