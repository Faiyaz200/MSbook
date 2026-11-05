package com.msbook.app

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowInsetsController
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import java.io.InputStream

class MainActivity : AppCompatActivity() {

    private val TAG = "MSbookApp"
    private lateinit var webView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (fileUploadCallback != null) {
            val results = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            fileUploadCallback?.onReceiveValue(results)
            fileUploadCallback = null
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Apply MSbook dark green brand status bar
            window.statusBarColor = Color.parseColor("#0F4D32")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.setSystemBarsAppearance(
                    0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Status bar setup error: ${e.message}")
        }

        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.webView)

        configureWebViewSettings()
        setupClients()
        setupBackNavigation()

        // Point assets loading path directly to index.html within the APK
        val assetUrl = "file:///android_asset/index.html"
        Log.d(TAG, "Loading APK assets entry point: $assetUrl")
        webView.loadUrl(assetUrl)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebViewSettings() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.textZoom = 100
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mediaPlaybackRequiresUserGesture = false

        try {
            settings.userAgentString = "${settings.userAgentString} MSbookNativeAndroid/1.0"
        } catch (_: Exception) {}

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
    }

    private fun handleAssetRequest(uri: Uri): WebResourceResponse? {
        val urlStr = uri.toString()
        var path = uri.path ?: ""

        // Normalize APK asset path
        if (path.startsWith("/android_asset/")) {
            path = path.substring("/android_asset/".length)
        } else if (path.startsWith("/assets/")) {
            path = path.substring("/assets/".length)
        }
        if (path.startsWith("/")) {
            path = path.substring(1)
        }
        if (path.isEmpty() || path == "index.html") {
            path = "index.html"
        }

        val candidates = listOf(
            path,
            "assets/$path",
            path.removePrefix("assets/")
        )

        var stream: InputStream? = null
        var resolvedPath = path
        for (cand in candidates) {
            try {
                stream = assets.open(cand)
                resolvedPath = cand
                break
            } catch (_: Exception) {}
        }

        if (stream == null) {
            return null
        }

        val mimeType = when {
            resolvedPath.endsWith(".html") -> "text/html"
            resolvedPath.endsWith(".js") || resolvedPath.endsWith(".mjs") -> "text/javascript"
            resolvedPath.endsWith(".css") -> "text/css"
            resolvedPath.endsWith(".png") -> "image/png"
            resolvedPath.endsWith(".jpg") || resolvedPath.endsWith(".jpeg") -> "image/jpeg"
            resolvedPath.endsWith(".svg") -> "image/svg+xml"
            resolvedPath.endsWith(".json") -> "application/json"
            resolvedPath.endsWith(".woff2") -> "font/woff2"
            resolvedPath.endsWith(".woff") -> "font/woff"
            resolvedPath.endsWith(".ttf") -> "font/ttf"
            else -> "text/plain"
        }

        val response = WebResourceResponse(mimeType, "UTF-8", stream)
        response.responseHeaders = mapOf(
            "Access-Control-Allow-Origin" to "*",
            "Access-Control-Allow-Methods" to "GET, OPTIONS",
            "Access-Control-Allow-Headers" to "*"
        )
        return response
    }

    private fun setupClients() {
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                val url = request?.url ?: return null
                return handleAssetRequest(url)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldInterceptRequest(view: WebView?, url: String?): WebResourceResponse? {
                if (url == null) return null
                return try {
                    handleAssetRequest(Uri.parse(url))
                } catch (e: Exception) {
                    null
                }
            }

            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                Log.e(TAG, "WebView error ($errorCode): $description for $failingUrl")
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                return handleUrlRouting(url)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url == null) return false
                return handleUrlRouting(url)
            }

            private fun handleUrlRouting(url: String): Boolean {
                // External intents: WhatsApp, tel, mail
                if (url.startsWith("whatsapp:") || url.startsWith("https://wa.me/") || 
                    url.startsWith("https://api.whatsapp.com/") || url.startsWith("tel:") || 
                    url.startsWith("mailto:")) {
                    return try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "App not installed for this action", Toast.LENGTH_SHORT).show()
                        true
                    }
                }

                // Keep local app asset navigation inside WebView
                if (url.startsWith("file:///android_asset/")) {
                    return false
                }

                // External browser links
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                } catch (ignored: Exception) {}
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d(TAG, "[Console] ${consoleMessage?.message()} -- line ${consoleMessage?.lineNumber()}")
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.let {
                    it.grant(it.resources)
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }

                return try {
                    fileChooserLauncher.launch(intent)
                    true
                } catch (e: Exception) {
                    fileUploadCallback = null
                    false
                }
            }
        }
    }

    private var lastBackPressTime = 0L

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::webView.isInitialized) {
                    webView.evaluateJavascript("window.handleAndroidBack ? window.handleAndroidBack() : false") { result ->
                        val handledInApp = result == "true"
                        if (!handledInApp) {
                            val currentTime = System.currentTimeMillis()
                            if (currentTime - lastBackPressTime < 2000) {
                                finish()
                            } else {
                                lastBackPressTime = currentTime
                                Toast.makeText(this@MainActivity, "Press back again to exit", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                } else {
                    finish()
                }
            }
        })
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.destroy()
        }
        super.onDestroy()
    }
}
