plugins {
    id("com.android.application")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(24))
    }
}

android {
    namespace = "ru.asavan.sosgame"
    compileSdk = 36

    defaultConfig {
        applicationId = "ru.asavan.sosgame"
        minSdk = 24
        targetSdk = 36
        versionCode = 22
        versionName = "1.1.3"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    packaging {
        jniLibs {
            pickFirsts += "META-INF/nanohttpd/*"
        }
        resources {
            pickFirsts += "META-INF/nanohttpd/*"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

dependencies {
    implementation("org.nanohttpd:nanohttpd:2.3.1")
    implementation("org.nanohttpd:nanohttpd-websocket:2.3.1")
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.6.2")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
}
