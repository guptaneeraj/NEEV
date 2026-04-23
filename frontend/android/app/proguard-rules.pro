# React Native common rules
-keep class com.facebook.react.bridge.CatalystInstanceImpl { *; }
-keep class com.facebook.react.bridge.WritableNativeMap { *; }
-keep class com.facebook.react.bridge.WritableNativeArray { *; }
-keep class com.facebook.react.bridge.Arguments { *; }
-keep class com.facebook.react.bridge.ReadableNativeMap { *; }
-keep class com.facebook.react.bridge.ReadableNativeArray { *; }
-keep class com.facebook.react.bridge.ProxyJavaScriptExecutor { *; }
-keep class com.facebook.react.bridge.JavaScriptExecutor { *; }
-keep class com.facebook.react.bridge.Callback { *; }
-keep class com.facebook.react.bridge.JavaScriptModule { *; }
-keep class com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.react.bridge.ReactContext { *; }
-keep class com.facebook.react.bridge.ReactContextBaseJavaModule { *; }
-keep class com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter { *; }
-keep class com.facebook.react.uimanager.UIImplementation { *; }
-keep class com.facebook.react.uimanager.UIManagerModule { *; }
-keep class com.facebook.react.uimanager.events.RCTEventEmitter { *; }
-keep class com.facebook.react.uimanager.ReactPointerEventsView { *; }
-keep class com.facebook.react.views.view.ReactViewGroup { *; }
-keep class com.facebook.react.views.slider.ReactSlider { *; }
-keep class com.facebook.react.views.text.ReactTextView { *; }

# Notifee
-keep class io.invertase.notifee.** { *; }

# Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.core.TurboModuleManager { *; }

# Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# Screens
-keep class com.swmansion.rnscreens.** { *; }

# Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# SVG
-keep class com.horcrux.svg.** { *; }

# Video
-keep class com.brentvatne.exoplayer.** { *; }
-keep class com.brentvatne.react.** { *; }
-keep class com.google.android.exoplayer2.** { *; }

# WebView
-keep class com.reactnativecommunity.webview.** { *; }

# Nitro Modules
-keep class com.margelo.nitro.** { *; }

# OkHttp
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Axios/Networking
-keep class com.facebook.react.modules.network.** { *; }

# Gifted Charts
-keep class com.horcrux.svg.** { *; }
-keep class com.giftedcharts.** { *; }

# Keep filenames and line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable
