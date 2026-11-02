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
import androidx.webkit.WebViewAssetLoader
import java.io.InputStream

class MainActivity : AppCompatActivity() {

    private val TAG = "MSbookApp"
    private lateinit var webView: WebView
    private var assetLoader: WebViewAssetLoader? = null
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
            // Safe status bar color
            window.statusBarColor = Color.parseColor("#0F4D32")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.setSystemBarsAppearance(
                    0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Status bar styling exception: ${e.message}")
        }

        try {
            // Setup AndroidX WebViewAssetLoader as backup
            assetLoader = WebViewAssetLoader.Builder()
                .setDomain("appassets.androidplatform.net")
                .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
                .build()
        } catch (e: Exception) {
            Log.w(TAG, "WebViewAssetLoader init exception: ${e.message}")
        }

        try {
            webView = WebView(this)
            setContentView(webView)
            configureWebViewSettings()
            setupClients()
            setupBackNavigation()

            // Load MSbook application
            webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
        } catch (e: Exception) {
            Log.e(TAG, "Fatal WebView launch exception", e)
            Toast.makeText(this, "Opening MSbook: ${e.message}", Toast.LENGTH_LONG).show()
        }
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
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mediaPlaybackRequiresUserGesture = false

        try {
            settings.userAgentString = "${settings.userAgentString} MSbookNative/1.0"
        } catch (_: Exception) {}

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
    }

    private fun handleCustomAssetRequest(url: Uri): WebResourceResponse? {
        val host = url.host ?: ""
        val urlStr = url.toString()

        if (!host.contains("appassets.androidplatform.net") && 
            !urlStr.contains("androidplatform.net") && 
            !urlStr.startsWith("file:///android_asset/")) {
            return null
        }

        var path = url.path ?: return null
        if (path.startsWith("/assets/")) {
            path = path.substring("/assets/".length)
        }
        if (path.startsWith("/")) {
            path = path.substring(1)
        }
        if (path.isEmpty()) {
            path = "index.html"
        }

        val candidates = listOf(
            path,
            "assets/$path",
            path.replace("assets/assets/", "assets/")
        )

        var stream: InputStream? = null
        for (cand in candidates) {
            try {
                stream = assets.open(cand)
                break
            } catch (_: Exception) {}
        }

        if (stream == null) {
            return assetLoader?.shouldInterceptRequest(url)
        }

        val mimeType = when {
            path.endsWith(".html") -> "text/html"
            path.endsWith(".js") || path.endsWith(".mjs") -> "text/javascript"
            path.endsWith(".css") -> "text/css"
            path.endsWith(".png") -> "image/png"
            path.endsWith(".jpg") || path.endsWith(".jpeg") -> "image/jpeg"
            path.endsWith(".svg") -> "image/svg+xml"
            path.endsWith(".json") -> "application/json"
            path.endsWith(".woff2") -> "font/woff2"
            path.endsWith(".woff") -> "font/woff"
            path.endsWith(".ttf") -> "font/ttf"
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
                val customResp = handleCustomAssetRequest(url)
                if (customResp != null) return customResp
                return assetLoader?.shouldInterceptRequest(url)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldInterceptRequest(view: WebView?, url: String?): WebResourceResponse? {
                if (url == null) return null
                return try {
                    val uri = Uri.parse(url)
                    handleCustomAssetRequest(uri) ?: assetLoader?.shouldInterceptRequest(uri)
                } catch (e: Exception) {
                    null
                }
            }

            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                Log.w(TAG, "WebView error ($errorCode): $description for $failingUrl")
                if (failingUrl?.contains("index.html") == true) {
                    // Fallback to direct file url
                    view?.loadUrl("file:///android_asset/index.html")
                }
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
                // External intents: WhatsApp sharing, dialer, mail
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

                // Keep local app navigation inside the WebView
                if (url.contains("appassets.androidplatform.net") || url.startsWith("file:///android_asset/")) {
                    return false
                }

                // External web links open in external browser
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                } catch (ignored: Exception) {}
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d(TAG, "[JS] ${consoleMessage?.message()} -- line ${consoleMessage?.lineNumber()}")
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

        webView.setDownloadListener { url, _, _, mimeType, _ ->
            try {
                val intent = Intent(Intent.ACTION_VIEW)
                intent.setDataAndType(Uri.parse(url), mimeType)
                startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(this, "Downloading file...", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::webView.isInitialized && webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }
}
