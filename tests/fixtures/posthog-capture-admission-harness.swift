import Foundation
#if canImport(CoreGraphics)
import CoreGraphics
#endif

// These boundary doubles count native reads. Admission and the five SDK entry points
// are copied verbatim from the Ruby patch output by the Node test, not reimplemented.
enum Reads {
    static var values = [String]()
    static var afterUpdates = [Bool]()
    static var afterRender: (() -> Void)?
}
func requireCheck(_ condition: @autoclosure () -> Bool, _ message: String = "native assertion failed") {
    if !condition() { print(message); exit(1) }
}
final class UIImage { let size = CGSize(width: 40, height: 40) }
final class UIWindow {
    let bounds = CGRect(x: 0, y: 0, width: 40, height: 40)
    func hasCameraForReplay() -> Bool { Reads.values.append("camera"); return false }
    func toImage(afterScreenUpdates: Bool = false, preferFidelityRenderer: Bool = true) -> UIImage? {
        Reads.values.append("render")
        Reads.afterUpdates.append(afterScreenUpdates)
        Reads.afterRender?()
        return UIImage()
    }
}
class UIView {}
final class RRWireframe { var image: UIImage? }
struct MaskedRegion { let rect: CGRect }
struct MaskRead { let hasUnsettledReporters = false; let regions = [MaskedRegion]() }
enum PostHogPresentationCover {
    static func frontmostFullWindowCover(in window: UIWindow) -> UIView? { Reads.values.append("cover"); return nil }
}
final class PostHogSessionReplayMaskRegistry {
    static let shared = PostHogSessionReplayMaskRegistry()
    func maskedRects(in window: UIWindow, insideCover cover: UIView?) -> MaskRead { Reads.values.append("registry"); return MaskRead() }
}
final class PostHogConfig { var deriveBeforeReplayCapture: ((UIWindow) -> Bool)? }
final class PostHogSDK {
    let config = PostHogConfig()
    func isSessionReplayActive() -> Bool { true }
}
extension CGSize { func hasSize() -> Bool { width > 0 && height > 0 } }
func hedgeLog(_ message: String) {}
#if os(Linux)
func autoreleasepool<T>(invoking action: () -> T) -> T { action() }
#endif

final class CaptureIntegration {
    let sdk = PostHogSDK()
    var attached = true
    var config: PostHogConfig? { attached ? sdk.config : nil }
    private struct ScreenshotCapture {
        let wireframe: RRWireframe
        let windowSize: CGSize
        let timestampDate: Date
        let image: UIImage?
    }
    func toWireframe(_ window: UIWindow) -> RRWireframe? { Reads.values.append("wireframe"); return RRWireframe() }
    func captureSnapshot(_ frame: RRWireframe, window: UIWindow, windowSize: CGSize, screenName: String?, postHog: PostHogSDK, timestampDate: Date, episodeFirstFrame: Bool = false) {
        Reads.values.append("enqueue")
    }
    func findMaskableWidgets(under cover: UIView?, in window: UIWindow, _ widgets: inout [MaskedRegion]) { Reads.values.append("mask-walk") }
    func prepareScreenshotWireframe(_ window: UIWindow, overrideMaskRects: [CGRect]?) -> RRWireframe? {
        Reads.values.append("metadata"); return RRWireframe()
    }
    func finishScreenshotRender() { Reads.values.append("finish") }
    static func sweptRects(before: [MaskedRegion], after: [MaskedRegion]?) -> [CGRect]? { after?.map(\.rect) }

    // PATCHED_METHODS

    func exercise() {
        requireCheck(Thread.isMainThread)
        let window = UIWindow()
        var callbacks = 0
        sdk.config.deriveBeforeReplayCapture = { candidate in
            requireCheck(Thread.isMainThread && candidate === window)
            callbacks += 1
            return false
        }
        Reads.values = []
        generateSnapshot(window, postHog: sdk, timestampDate: Date())
        requireCheck(Reads.values.isEmpty && callbacks == 1, "wireframe must reject before reading content")
        requireCheck(collectMaskedRegions(in: window) == nil && Reads.values.isEmpty && callbacks == 2, "settle mask sampling must reject before hierarchy traversal")
        requireCheck(collectScreenshotMetadata(window, overrideMaskRects: []) == nil && Reads.values.isEmpty && callbacks == 3, "override masks must not bypass metadata admission")
        requireCheck(!renderAndEnqueueScreenshot(RRWireframe(), window: window, windowSize: window.bounds.size, screenName: nil, postHog: sdk, timestampDate: Date(), image: nil, episodeFirstFrame: true))
        requireCheck(Reads.values.isEmpty && callbacks == 4, "bridge fallback must reject before rendering")
        requireCheck(!performBracketedBackgroundCapture(window: window, screenName: nil, postHog: sdk))
        requireCheck(Reads.values == ["finish"] && callbacks == 4, "background mode must reject before sampling or rendering")

        // Detaching during denial must keep a queued settle sample closed.
        attached = false; Reads.values = []
        requireCheck(collectMaskedRegions(in: window) == nil && Reads.values.isEmpty)
        attached = true
        sdk.config.deriveBeforeReplayCapture = { candidate in
            requireCheck(Thread.isMainThread && candidate === window)
            callbacks += 1
            return true
        }
        generateSnapshot(window, postHog: sdk, timestampDate: Date())
        requireCheck(Reads.values == ["wireframe", "enqueue"])
        Reads.values = []
        requireCheck(collectMaskedRegions(in: window) != nil)
        requireCheck(Reads.values == ["camera", "cover", "registry", "mask-walk"])
        Reads.values = []; Reads.afterUpdates = []
        requireCheck(collectScreenshotMetadata(window, overrideMaskRects: []) != nil)
        requireCheck(Reads.values == ["metadata", "render"])
        requireCheck(Reads.afterUpdates == [true], "configured metadata render must include current screen updates")
        Reads.values = []; Reads.afterUpdates = []
        requireCheck(renderAndEnqueueScreenshot(RRWireframe(), window: window, windowSize: window.bounds.size, screenName: nil, postHog: sdk, timestampDate: Date(), image: nil))
        requireCheck(Reads.values == ["render", "enqueue"])
        requireCheck(Reads.afterUpdates == [true], "configured fallback render must include current screen updates")
        Reads.values = []
        let allowedCallbacks = callbacks
        requireCheck(!performBracketedBackgroundCapture(window: window, screenName: nil, postHog: sdk))
        requireCheck(Reads.values == ["finish"] && callbacks == allowedCallbacks)

        var stillAdmitted = true
        sdk.config.deriveBeforeReplayCapture = { candidate in
            requireCheck(Thread.isMainThread && candidate === window)
            return stillAdmitted
        }
        Reads.afterRender = { stillAdmitted = false }; Reads.values = []
        requireCheck(collectScreenshotMetadata(window, overrideMaskRects: []) == nil, "metadata must discard an image when admission fails after rendering")
        requireCheck(Reads.values == ["metadata", "render"])
        stillAdmitted = true; Reads.values = []
        requireCheck(!renderAndEnqueueScreenshot(RRWireframe(), window: window, windowSize: window.bounds.size, screenName: nil, postHog: sdk, timestampDate: Date(), image: nil), "fallback must discard an image when admission fails after rendering")
        requireCheck(Reads.values == ["render"], "post-render denial must never enqueue")
        Reads.afterRender = nil; Reads.values = []
        requireCheck(!renderAndEnqueueScreenshot(RRWireframe(), window: window, windowSize: window.bounds.size, screenName: nil, postHog: sdk, timestampDate: Date(), image: UIImage()), "precollected images must recheck before enqueue")
        requireCheck(Reads.values.isEmpty)
        sdk.config.deriveBeforeReplayCapture = { _ in callbacks += 1; return true }

        let box = ResultBox(), finished = DispatchSemaphore(value: 0)
        DispatchQueue.global().async {
            box.value = self.deriveReplayCaptureAllowed(window)
            finished.signal()
        }
        requireCheck(finished.wait(timeout: .now() + 5) == .success)
        requireCheck(!box.value && callbacks == allowedCallbacks, "configured callback must never run off main")

        sdk.config.deriveBeforeReplayCapture = nil; Reads.values = []
        generateSnapshot(window, postHog: sdk, timestampDate: Date())
        requireCheck(Reads.values == ["wireframe", "enqueue"] && callbacks == allowedCallbacks, "unconfigured SDK behavior must remain available")
        Reads.values = []; Reads.afterUpdates = []
        requireCheck(collectScreenshotMetadata(window) != nil && Reads.values == ["metadata", "render"])
        requireCheck(Reads.afterUpdates == [false], "unconfigured metadata retains its renderer mode")
        Reads.values = []
        requireCheck(renderAndEnqueueScreenshot(RRWireframe(), window: window, windowSize: window.bounds.size, screenName: nil, postHog: sdk, timestampDate: Date(), image: nil))
        requireCheck(Reads.values == ["render", "enqueue"])
        requireCheck(Reads.afterUpdates == [false, false], "unconfigured steady fallback retains its renderer mode")
        Reads.afterUpdates = []; Reads.values = []
        requireCheck(renderAndEnqueueScreenshot(RRWireframe(), window: window, windowSize: window.bounds.size, screenName: nil, postHog: sdk, timestampDate: Date(), image: nil, episodeFirstFrame: true))
        requireCheck(Reads.afterUpdates == [true], "unconfigured bridge first frame keeps screen updates")
        print("native capture admission checks passed")
    }
}
final class ResultBox { var value = true }
CaptureIntegration().exercise()
