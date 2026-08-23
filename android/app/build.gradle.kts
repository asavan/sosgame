plugins {
    id("com.android.application")
}

android {
    namespace = "ru.asavan.sosgame"
    compileSdk = 37

    defaultConfig {
        applicationId = "ru.asavan.sosgame"
        minSdk = 26
        targetSdk = 37
        versionCode = 26
        versionName = "1.3.0"

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
            optimization {
                enable  = true
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("org.nanohttpd:nanohttpd:2.3.1")
    implementation("org.nanohttpd:nanohttpd-websocket:2.3.1")
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.3")
    implementation("com.luigivampa92:ndefemulation-android:1.0.0")
    implementation("androidx.webkit:webkit:1.17.0")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
}
