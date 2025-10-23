package com.carzbazzar

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import org.devio.rn.splashscreen.SplashScreen  // Uncomment if using react-native-splash-screen

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "carzbazzar"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // If using react-native-splash-screen:
         SplashScreen.show(this)
        super.onCreate(savedInstanceState)
    }
}
