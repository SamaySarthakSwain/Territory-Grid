# ProGuard Rules for Territory Grid
-keepattributes *Annotation*
-dontwarn javax.annotation.**
-keepclassmembers class * {
    @com.google.firebase.firestore.PropertyName <fields>;
    @com.google.firebase.firestore.PropertyName <methods>;
}
-keep class com.yourname.territorygrid.domain.model.** { *; }
