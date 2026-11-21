package com.yourname.territorygrid.scanner

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MlKitScannerActivity : ComponentActivity() {

    private lateinit var cameraExecutor: ExecutorService
    private lateinit var previewView: PreviewView
    private var camera: Camera? = null
    private var isTorchOn = false
    private var isScanned = false

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            startCamera()
        } else {
            Toast.makeText(this, "Camera permission required for ML Kit QR scanning", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        cameraExecutor = Executors.newSingleThreadExecutor()

        // Root container
        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        // CameraX Preview View
        previewView = PreviewView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
        root.addView(previewView)

        // Custom Cyberpunk Viewfinder Overlay with Reticle & Laser Sweep
        val overlayView = ViewfinderOverlayView(this)
        root.addView(
            overlayView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )

        // Top HUD Header
        val topHud = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(32, 48, 32, 24)
            gravity = Gravity.CENTER_VERTICAL
            setBackgroundColor(Color.parseColor("#CC02050A"))
        }

        val closeBtn = TextView(this).apply {
            text = "✕"
            textSize = 22f
            setTextColor(Color.parseColor("#00E5FF"))
            setPadding(24, 16, 24, 16)
            setOnClickListener { finish() }
        }
        topHud.addView(closeBtn)

        val titleCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)
            setPadding(16, 0, 16, 0)
        }

        val titleText = TextView(this).apply {
            text = "GOOGLE ML KIT // OPTICAL SCANNER"
            textSize = 13f
            setTextColor(Color.parseColor("#00E5FF"))
            typeface = android.graphics.Typeface.MONOSPACE
        }
        val subText = TextView(this).apply {
            text = "Point camera at player QR code on screen"
            textSize = 11f
            setTextColor(Color.parseColor("#A0AEC0"))
        }
        titleCol.addView(titleText)
        titleCol.addView(subText)
        topHud.addView(titleCol)

        // Torch / Flashlight Toggle Button
        val torchBtn = TextView(this).apply {
            text = "⚡ FLASH"
            textSize = 12f
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#3300E5FF"))
            setPadding(24, 16, 24, 16)
            typeface = android.graphics.Typeface.MONOSPACE
            setOnClickListener {
                toggleTorch(this)
            }
        }
        topHud.addView(torchBtn)

        root.addView(
            topHud,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.TOP
            )
        )

        // Bottom Status Bar
        val bottomHud = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 24, 32, 48)
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#CC02050A"))
        }

        val hintText = TextView(this).apply {
            text = "FAST REAL-TIME ML KIT DETECTION (30-60 FPS)"
            textSize = 11f
            setTextColor(Color.parseColor("#00FF88"))
            typeface = android.graphics.Typeface.MONOSPACE
        }
        bottomHud.addView(hintText)

        root.addView(
            bottomHud,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
            )
        )

        setContentView(root)

        // Check camera permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCamera()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun toggleTorch(btn: TextView) {
        val cam = camera ?: return
        isTorchOn = !isTorchOn
        cam.cameraControl.enableTorch(isTorchOn)
        if (isTorchOn) {
            btn.text = "⚡ FLASH ON"
            btn.setTextColor(Color.BLACK)
            btn.setBackgroundColor(Color.parseColor("#FFD600"))
        } else {
            btn.text = "⚡ FLASH"
            btn.setTextColor(Color.WHITE)
            btn.setBackgroundColor(Color.parseColor("#3300E5FF"))
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

            // High-speed ML Kit Barcode Analyzer configured specifically for QR Codes
            val options = BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                .build()
            val barcodeScanner = BarcodeScanning.getClient(options)

            val imageAnalysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                processImageProxy(barcodeScanner, imageProxy)
            }

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    this,
                    cameraSelector,
                    preview,
                    imageAnalysis
                )
            } catch (exc: Exception) {
                Toast.makeText(this, "Failed to start camera: ${exc.message}", Toast.LENGTH_SHORT).show()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun processImageProxy(
        barcodeScanner: com.google.mlkit.vision.barcode.BarcodeScanner,
        imageProxy: ImageProxy
    ) {
        if (isScanned) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(
                mediaImage,
                imageProxy.imageInfo.rotationDegrees
            )

            barcodeScanner.process(image)
                .addOnSuccessListener { barcodes ->
                    if (isScanned) return@addOnSuccessListener
                    for (barcode in barcodes) {
                        val rawValue = barcode.rawValue
                        if (!rawValue.isNullOrBlank()) {
                            isScanned = true
                            triggerHapticFeedback()
                            runOnUiThread {
                                val resultIntent = Intent().apply {
                                    putExtra("SCAN_RESULT", rawValue)
                                }
                                setResult(Activity.RESULT_OK, resultIntent)
                                finish()
                            }
                            break
                        }
                    }
                }
                .addOnFailureListener {
                    // Ignored: continuous scanning next frame
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
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
                vibrator?.vibrate(100)
            }
        } catch (_: Exception) {}
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }

    // Custom Viewfinder with Cyan Target Box & Animated Laser Line
    private class ViewfinderOverlayView(context: Context) : View(context) {
        private val boxPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#00E5FF")
            style = Paint.Style.STROKE
            strokeWidth = 6f
        }
        private val cornerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#00FF88")
            style = Paint.Style.STROKE
            strokeWidth = 10f
        }
        private val laserPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#CC00FF88")
            style = Paint.Style.STROKE
            strokeWidth = 4f
            setShadowLayer(16f, 0f, 0f, Color.parseColor("#00FF88"))
        }
        private val scrimPaint = Paint().apply {
            color = Color.parseColor("#8802050A")
            style = Paint.Style.FILL
        }

        private var laserY = 0f
        private var laserSpeed = 8f

        init {
            setLayerType(LAYER_TYPE_SOFTWARE, null)
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)

            val w = width.toFloat()
            val h = height.toFloat()
            val size = (w.coerceAtMost(h) * 0.72f).coerceAtLeast(240f)
            val left = (w - size) / 2f
            val top = (h - size) / 2f
            val right = left + size
            val bottom = top + size
            val box = RectF(left, top, right, bottom)

            // Dark semi-transparent scrim around viewfinder
            canvas.drawRect(0f, 0f, w, top, scrimPaint)
            canvas.drawRect(0f, bottom, w, h, scrimPaint)
            canvas.drawRect(0f, top, left, bottom, scrimPaint)
            canvas.drawRect(right, top, w, bottom, scrimPaint)

            // Outer cyan border
            canvas.drawRoundRect(box, 16f, 16f, boxPaint)

            // Neon green corners
            val cornerLen = 40f
            // Top-left
            canvas.drawLine(left, top, left + cornerLen, top, cornerPaint)
            canvas.drawLine(left, top, left, top + cornerLen, cornerPaint)
            // Top-right
            canvas.drawLine(right - cornerLen, top, right, top, cornerPaint)
            canvas.drawLine(right, top, right, top + cornerLen, cornerPaint)
            // Bottom-left
            canvas.drawLine(left, bottom, left + cornerLen, bottom, cornerPaint)
            canvas.drawLine(left, bottom - cornerLen, left, bottom, cornerPaint)
            // Bottom-right
            canvas.drawLine(right - cornerLen, bottom, right, bottom, cornerPaint)
            canvas.drawLine(right, bottom - cornerLen, right, bottom, cornerPaint)

            // Animated Laser Line
            if (laserY < top || laserY > bottom) {
                laserY = top
            }
            laserY += laserSpeed
            if (laserY >= bottom || laserY <= top) {
                laserSpeed = -laserSpeed
            }

            canvas.drawLine(left + 8f, laserY, right - 8f, laserY, laserPaint)

            postInvalidateOnAnimation()
        }
    }
}
