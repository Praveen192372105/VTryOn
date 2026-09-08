package com.example.vtryon.core.util

import app.cash.turbine.test
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test

class TurbineFlowTest {

    @Test
    fun `Turbine tests StateFlow state transitions cleanly`() = runBlocking {
        val stateFlow = MutableStateFlow("Initial")

        stateFlow.test {
            assertEquals("Initial", awaitItem())

            stateFlow.value = "Loading"
            assertEquals("Loading", awaitItem())

            stateFlow.value = "Success"
            assertEquals("Success", awaitItem())

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `Turbine tests SharedFlow event emissions without dropping`() = runBlocking {
        val sharedFlow = MutableSharedFlow<String>(extraBufferCapacity = 5)

        sharedFlow.test {
            sharedFlow.emit("NavigateToWorkspace")
            assertEquals("NavigateToWorkspace", awaitItem())

            sharedFlow.emit("ShowToast")
            assertEquals("ShowToast", awaitItem())

            cancelAndIgnoreRemainingEvents()
        }
    }
}
