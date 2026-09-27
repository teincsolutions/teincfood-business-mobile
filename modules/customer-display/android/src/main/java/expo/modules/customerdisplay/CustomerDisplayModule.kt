package expo.modules.customerdisplay

import android.app.Presentation
import android.content.Context
import android.graphics.Color
import android.hardware.display.DisplayManager
import android.view.Display
import android.webkit.WebView
import org.json.JSONObject
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android customer display. Presents a customer-facing WebView on a secondary
 * display using `Presentation` (DISPLAY_CATEGORY_PRESENTATION). The JS layer
 * pushes a platform-agnostic model JSON; this module only handles the hardware
 * (display discovery + a presentation surface) and forwards the model to the
 * bundled renderer.
 */
class CustomerDisplayModule : Module() {
  private var presentation: Presentation? = null
  private var webView: WebView? = null
  private var lastModelJson: String? = null
  private var displayManager: DisplayManager? = null

  private val displayListener = object : DisplayManager.DisplayListener {
    override fun onDisplayAdded(displayId: Int) = emitCapabilities()
    override fun onDisplayRemoved(displayId: Int) = emitCapabilities()
    override fun onDisplayChanged(displayId: Int) = Unit
  }

  private fun displayManager(): DisplayManager? {
    val ctx = appContext.reactContext ?: return null
    return ctx.getSystemService(Context.DISPLAY_SERVICE) as? DisplayManager
  }

  private fun allDisplays(): Array<Display> =
    displayManager()?.displays ?: emptyArray()

  private fun presentationDisplays(): Array<Display> =
    displayManager()?.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION)
      ?: emptyArray()

  private fun capabilities(): Map<String, Any?> {
    val all = allDisplays()
    val supported = presentationDisplays().isNotEmpty() || all.size > 1
    return mapOf(
      "supported" to supported,
      "displays" to all.size,
      "reason" to if (supported) null else "No secondary display detected",
    )
  }

  private fun emitCapabilities() {
    sendEvent("onDisplayChanged", capabilities())
  }

  private fun render(json: String) {
    val wv = webView ?: return
    wv.post {
      val literal = JSONObject.quote(json)
      wv.evaluateJavascript(
        "window.renderModel && window.renderModel(JSON.parse($literal));",
        null,
      )
    }
  }

  override fun definition() = ModuleDefinition {
    Name("CustomerDisplay")

    Events("onDisplayChanged")

    AsyncFunction("getCapabilities") { promise: Promise ->
      promise.resolve(capabilities())
    }

    AsyncFunction("open") { promise: Promise ->
      val ctx = appContext.reactContext
      if (ctx == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      val target = presentationDisplays().firstOrNull() ?: allDisplays().getOrNull(1)
      if (target == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      if (presentation == null) {
        val wv = WebView(ctx).apply {
          setBackgroundColor(Color.WHITE)
          settings.javaScriptEnabled = true
          settings.domStorageEnabled = true
          loadUrl("file:///android_asset/customer-display.html")
        }
        webView = wv
        presentation = Presentation(ctx, target).apply {
          setContentView(wv)
        }
      }
      presentation?.show()
      lastModelJson?.let { render(it) }
      promise.resolve(true)
    }

    AsyncFunction("close") { promise: Promise ->
      presentation?.dismiss()
      presentation = null
      webView = null
      promise.resolve(true)
    }

    AsyncFunction("update") { json: String, promise: Promise ->
      lastModelJson = json
      render(json)
      promise.resolve(true)
    }

    OnStartObserving {
      val dm = displayManager()
      displayManager = dm
      dm?.registerDisplayListener(displayListener, null)
    }

    OnStopObserving {
      displayManager?.unregisterDisplayListener(displayListener)
      displayManager = null
    }

    OnDestroy {
      presentation?.dismiss()
      presentation = null
      webView = null
      displayManager?.unregisterDisplayListener(displayListener)
      displayManager = null
    }
  }
}
