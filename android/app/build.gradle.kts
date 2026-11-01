plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.msbook.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.msbook.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            val keyFile = file("${rootDir}/release.keystore")
            if (keyFile.exists()) {
                storeFile = keyFile
                storePassword = "msbook123"
                keyAlias = "msbook"
                keyPassword = "msbook123"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            val releaseSign = signingConfigs.getByName("release")
            if (releaseSign.storeFile?.exists() == true) {
                signingConfig = releaseSign
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.webkit)
    implementation(libs.androidx.activity.ktx)
}
