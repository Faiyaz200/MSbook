package com.msbook.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.msbook.app.ui.navigation.MSBookNavGraph
import com.msbook.app.ui.navigation.Screen
import com.msbook.app.ui.theme.MSBookTheme
import com.msbook.app.ui.theme.PrimaryDarkGreen

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as MSBookApplication
        val repository = app.businessRepository
        val accountingRepository = app.accountingRepository

        setContent {
            MSBookTheme {
                val navController = rememberNavController()
                var startDestination by remember { mutableStateOf<String?>(null) }

                LaunchedEffect(Unit) {
                    val hasBusinesses = repository.hasAnyBusiness()
                    if (hasBusinesses) {
                        repository.ensureActiveBusiness()
                        startDestination = Screen.Dashboard.route
                    } else {
                        startDestination = Screen.BusinessSelect.createRoute(isAddingAdditional = false)
                    }
                }

                if (startDestination == null) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(MaterialTheme.colorScheme.background),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = PrimaryDarkGreen)
                    }
                } else {
                    MSBookNavGraph(
                        navController = navController,
                        startDestination = startDestination!!,
                        repository = repository,
                        accountingRepository = accountingRepository
                    )
                }
            }
        }
    }
}
