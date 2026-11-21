package com.yourname.territorygrid

import android.Manifest
import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import com.yourname.territorygrid.scanner.MlKitScannerActivity
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    // Standalone Local Asset Application (Zero Vercel / Zero Internet Dependency)
    private val localAppUrl = "file:///android_asset/public/login.html"

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            webView.reload()
        }
    }

    private val mlKitScannerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val qrText = result.data?.getStringExtra("SCAN_RESULT")
            if (!qrText.isNullOrBlank()) {
                sendScanResultToWeb(qrText)
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Strict portrait orientation for field operations
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT

        // Request Camera Permission for QR Scanning
        requestCameraPermission()

        // Root container with cyber dark background
        val rootLayout = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#02050A"))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        // Horizontal Progress Bar with Cyber Cyan
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = false
            max = 100
            visibility = View.GONE
        }

        // High-Performance Hardware-Accelerated WebView
        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#02050A"))
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                @Suppress("DEPRECATION")
                allowFileAccessFromFileURLs = true
                @Suppress("DEPRECATION")
                allowUniversalAccessFromFileURLs = true
                useWideViewPort = true
                loadWithOverviewMode = true
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                }
                userAgentString = "$userAgentString TerritoryGridApp/1.0 (Android)"
            }

            // Expose Native Android Bridge for Google ML Kit Barcode Scanning
            addJavascriptInterface(AndroidBridge(), "AndroidBridge")

            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    progressBar.visibility = View.VISIBLE
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    progressBar.visibility = View.GONE
                }

                @TargetApi(Build.VERSION_CODES.M)
                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame == true) {
                        view?.loadUrl(localAppUrl)
                    }
                }

                @Suppress("DEPRECATION")
                override fun onReceivedError(
                    view: WebView?,
                    errorCode: Int,
                    description: String?,
                    failingUrl: String?
                ) {
                    super.onReceivedError(view, errorCode, description, failingUrl)
                    view?.loadUrl(localAppUrl)
                }

                @SuppressLint("WebViewClientOnReceivedSslError")
                override fun onReceivedSslError(
                    view: WebView?,
                    handler: android.webkit.SslErrorHandler?,
                    error: android.net.http.SslError?
                ) {
                    handler?.proceed()
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    progressBar.progress = newProgress
                    if (newProgress >= 100) {
                        progressBar.visibility = View.GONE
                    }
                }

                // Grant camera permission directly to web QR scanner
                override fun onPermissionRequest(request: PermissionRequest?) {
                    runOnUiThread {
                        request?.grant(request.resources)
                    }
                }
            }
        }

        rootLayout.addView(webView)
        rootLayout.addView(
            progressBar,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                10
            )
        )

        setContentView(rootLayout)

        // Initial Load: Standalone Offline Local Asset Application
        webView.loadUrl(localAppUrl)

        // Handle Back Navigation
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

    fun launchMlKitCameraScanner() {
        val intent = Intent(this, MlKitScannerActivity::class.java)
        mlKitScannerLauncher.launch(intent)
    }

    fun launchGoogleCodeScanner() {
        try {
            val options = GmsBarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                .enableAutoZoom()
                .build()

            val scanner = GmsBarcodeScanning.getClient(this, options)
            scanner.startScan()
                .addOnSuccessListener { barcode ->
                    val rawValue = barcode.rawValue
                    if (!rawValue.isNullOrBlank()) {
                        triggerHapticFeedback()
                        sendScanResultToWeb(rawValue)
                    }
                }
                .addOnCanceledListener {
                    // Canceled by user
                }
                .addOnFailureListener {
                    // Fall back to embedded CameraX ML Kit scanner
                    launchMlKitCameraScanner()
                }
        } catch (_: Exception) {
            launchMlKitCameraScanner()
        }
    }

    fun sendScanResultToWeb(qrText: String) {
        val escaped = qrText.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ")
        webView.post {
            val js = """
                (function() {
                    if (typeof window.handleNativeScanResult === 'function') {
                        window.handleNativeScanResult('$escaped');
                    } else if (typeof window.handleDecodedQR === 'function') {
                        window.handleDecodedQR('$escaped');
                    }
                })();
            """.trimIndent()
            webView.evaluateJavascript(js, null)
        }
    }

    private fun triggerHapticFeedback() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(
                    VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                @Suppress("DEPRECATION")
                vibrator?.vibrate(120)
            }
        } catch (_: Exception) {}
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun isNativeScannerAvailable(): Boolean = true

        @JavascriptInterface
        fun openNativeScanner() {
            runOnUiThread {
                launchGoogleCodeScanner()
            }
        }

        @JavascriptInterface
        fun openCameraXScanner() {
            runOnUiThread {
                launchMlKitCameraScanner()
            }
        }

        @JavascriptInterface
        fun triggerHaptic() {
            triggerHapticFeedback()
        }
    }

    private fun requestCameraPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
