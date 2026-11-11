# ProGuard Rules for Territory Grid
-keepattributes *Annotation*
-dontwarn javax.annotation.**
-keepclassmembers class * {
    @com.google.firebase.firestore.PropertyName <fields>;
    @com.google.firebase.firestore.PropertyName <methods>;
}
-keep class com.yourname.territorygrid.domain.model.** { *; }

# Keep Firebase Serialization and Listeners
-keepattributes Signature
-keepattributes InnerClasses
-keepclassmembers enum * { *; }

# Keep Hilt generated classes
-keep,allowobfuscation,allowshrinking interface *
-keep class dagger.hilt.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager$FragmentContextWrapper { *; }
