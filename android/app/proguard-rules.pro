# Keep AndroidGPS interface for JavaScript access
-keep class com.euscagency.itrack.AndroidGPS {
    public *;
}

# Keep all methods annotated with @JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep MainActivity
-keep class com.euscagency.itrack.MainActivity {
    public *;
}

# Keep all public methods in our GPS classes
-keep class com.euscagency.itrack.** {
    public *;
}

# Disable obfuscation for debugging
-dontobfuscate