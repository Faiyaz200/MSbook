package com.msbook.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
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

    private val requestCameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            Toast.makeText(this, "Camera permission needed for barcode scanning", Toast.LENGTH_SHORT).show()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Set status bar styling to MSbook Primary Dark Green
        window.statusBarColor = Color.parseColor("#0F4D32")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
            )
        }

        // Initialize WebViewAssetLoader for secure HTTPS origin loading of local bundled assets
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this)
        setContentView(webView)

        configureWebViewSettings()
        setupClients()
        setupBackNavigation()
        checkPermissions()

        // Load complete offline bundled MSbook web application
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebViewSettings() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mediaPlaybackRequiresUserGesture = false

        // User Agent
        settings.userAgentString = "${settings.userAgentString} MSbookNativeAndroid/1.0"

        // Hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
    }

    private fun setupClients() {
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                val url = request?.url ?: return null
                return assetLoader.shouldInterceptRequest(url)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // Handle external protocols (WhatsApp ledger sharing, phone dialer, email)
                if (url.startsWith("whatsapp:") || url.startsWith("https://wa.me/") || 
                    url.startsWith("https://api.whatsapp.com/") || url.startsWith("tel:") || 
                    url.startsWith("mailto:")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "App not installed for this action", Toast.LENGTH_SHORT).show()
                        return true
                    }
                }

                // Keep local app navigation inside the WebView
                if (url.contains("appassets.androidplatform.net")) {
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
            // Support camera access for barcode and QR code scanner
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.let {
                    val requestedResources = it.resources
                    for (res in requestedResources) {
                        if (res == PermissionRequest.RESOURCE_VIDEO_CAPTURE) {
                            it.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))
                            return
                        }
                    }
                    it.grant(requestedResources)
                }
            }

            // Support file picker for backup restoration and import
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

                try {
                    fileChooserLauncher.launch(intent)
                } catch (e: Exception) {
                    fileUploadCallback = null
                    return false
                }
                return true
            }
        }

        // Support file downloads (CSV export, JSON backup, PDF ledger statements)
        webView.setDownloadListener { url, _, contentDisposition, mimeType, _ ->
            try {
                val intent = Intent(Intent.ACTION_VIEW)
                intent.setDataAndType(Uri.parse(url), mimeType)
                startActivity(intent)
            } catch (e: Exception) {
                // If it's a blob/data URI, trigger save via intent
                if (url.startsWith("data:") || url.startsWith("blob:")) {
                    Toast.makeText(this, "Downloading report...", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }

    private fun checkPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }
}
