# frozen_string_literal: true

# Applied by Expo's existing CocoaPods post_install. No SDK package or runtime swizzle is added.
require 'digest'
require 'tempfile'

module DeriveInternalReplayCapturePatch
  VERSION = '3.88.2'
  FILES = {
    'PostHog/PostHogConfig.swift' => {
      original_sha256: 'fd2ae95ff9cbc43f8bf47b1737985c017c6ffacd6415025346f12e6136ac1141',
      patched_sha256: '5299e9971211af13de4b421dcc327b04396786dd7a6db0355eccd9a5cc652080',
      replacements: [
        [<<'BEFORE_0_0', <<'AFTER_0_0'],
import Foundation
BEFORE_0_0
import Foundation
#if os(iOS)
    import UIKit
#endif
AFTER_0_0
        [<<'BEFORE_0_1', <<'AFTER_0_1'],
        @objc public let sessionReplayConfig: PostHogSessionReplayConfig = .init()
BEFORE_0_1
        @objc public let sessionReplayConfig: PostHogSessionReplayConfig = .init()

        /// Shelv's pinned local capture gate. Configure before setup; never mutate while recording.
        /// Called synchronously on main before native traversal/rendering. False drops the capture.
        /// Background screenshot capture is unavailable while this gate is configured.
        @objc public var deriveBeforeReplayCapture: ((UIWindow) -> Bool)?
AFTER_0_1
      ]
    },
    'PostHog/Replay/PostHogReplayIntegration.swift' => {
      original_sha256: 'fa897696386eb79c53e3a8454bcd9f022aacfc44bca7e31bb4897effaea19222',
      patched_sha256: 'a067b9efcb9c76073dc6fec1d628dcfc1211e3344fdceeef147176e7e229214a',
      replacements: [
        [<<'BEFORE_1_0', <<'AFTER_1_0'],
        private func generateSnapshot(_ window: UIWindow, _ screenName: String? = nil, postHog: PostHogSDK, timestampDate: Date) {
BEFORE_1_0
        /// Local capture admission runs outside SDK locks, before native content is read.
        private func deriveReplayCaptureAllowed(_ window: UIWindow) -> Bool {
            guard let captureConfig = config else { return false }
            let admission = captureConfig.deriveBeforeReplayCapture
            guard let admission else { return true }
            guard Thread.isMainThread else { return false }
            return admission(window)
        }

        private func generateSnapshot(_ window: UIWindow, _ screenName: String? = nil, postHog: PostHogSDK, timestampDate: Date) {
            guard deriveReplayCaptureAllowed(window) else { return }
AFTER_1_0
        [<<'BEFORE_1_1', <<'AFTER_1_1'],
        private func collectMaskedRegions(in window: UIWindow) -> [MaskedRegion]? {
BEFORE_1_1
        private func collectMaskedRegions(in window: UIWindow) -> [MaskedRegion]? {
            guard deriveReplayCaptureAllowed(window) else { return nil }
AFTER_1_1
        [<<'BEFORE_1_2', <<'AFTER_1_2'],
        ) -> ScreenshotCapture? {
            guard let wireframe = autoreleasepool(invoking: { prepareScreenshotWireframe(window, overrideMaskRects: overrideMaskRects) }) else {
BEFORE_1_2
        ) -> ScreenshotCapture? {
            guard deriveReplayCaptureAllowed(window) else { return nil }
            guard let wireframe = autoreleasepool(invoking: { prepareScreenshotWireframe(window, overrideMaskRects: overrideMaskRects) }) else {
AFTER_1_2
        [<<'BEFORE_1_3', <<'AFTER_1_3'],
                let image = collectedImage ?? window.toImage(afterScreenUpdates: episodeFirstFrame, preferFidelityRenderer: true)
BEFORE_1_3
                let hasHook = config?.deriveBeforeReplayCapture != nil
                let image: UIImage?
                if let collectedImage {
                    image = collectedImage
                } else {
                    guard deriveReplayCaptureAllowed(window) else { return false }
                    image = window.toImage(afterScreenUpdates: episodeFirstFrame || hasHook, preferFidelityRenderer: true)
                }
AFTER_1_3
        [<<'BEFORE_1_4', <<'AFTER_1_4'],
        private func performBracketedBackgroundCapture(window: UIWindow, screenName: String?, postHog: PostHogSDK) -> Bool {
            defer { finishScreenshotRender() }
BEFORE_1_4
        private func performBracketedBackgroundCapture(window: UIWindow, screenName: String?, postHog: PostHogSDK) -> Bool {
            defer { finishScreenshotRender() }

            // A main admission followed by an off-main render would reopen the UI race.
            guard let captureConfig = config, captureConfig.deriveBeforeReplayCapture == nil else {
                return false
            }
AFTER_1_4
        [<<'BEFORE_1_5', <<'AFTER_1_5'],
            let image = renderImage ? window.toImage(preferFidelityRenderer: preferFidelityRenderer) : nil
BEFORE_1_5
            let hasHook = config?.deriveBeforeReplayCapture != nil
            let image = renderImage ? window.toImage(afterScreenUpdates: hasHook, preferFidelityRenderer: preferFidelityRenderer) : nil
            if hasHook && renderImage && !deriveReplayCaptureAllowed(window) { return nil }
AFTER_1_5
        [<<'BEFORE_1_6', <<'AFTER_1_6'],
                guard let image, image.size.hasSize() else {
                    return false
                }
                wireframe.image = image
BEFORE_1_6
                guard let image, image.size.hasSize() else {
                    return false
                }
                if hasHook && !deriveReplayCaptureAllowed(window) { return false }
                wireframe.image = image
AFTER_1_6
      ]
    },
  }.freeze

  def self.apply!(installer)
    versions = installer.pod_targets.map do |target|
      spec = target.root_spec
      spec.version.to_s if spec.name == 'PostHog'
    end.compact.uniq
    unless versions == [VERSION]
      raise "Internal replay requires installed PostHog #{VERSION}; found #{versions.inspect}"
    end

    root = installer.sandbox.pod_dir('PostHog')
    # Validate every source and every resulting digest before staging or mutating any file.
    pending = FILES.map do |relative, rule|
      path = File.join(root, relative)
      source = File.binread(path)
      digest = Digest::SHA256.hexdigest(source)
      next if digest == rule.fetch(:patched_sha256)
      unless digest == rule.fetch(:original_sha256)
        raise "Internal replay refuses unrecognized PostHog source SHA256: #{relative} (#{digest})"
      end
      patched = rule.fetch(:replacements).reduce(source) do |text, (before, after)|
        unless text.scan(Regexp.new(Regexp.escape(before))).length == 1
          raise "Internal replay patch anchor must occur exactly once: #{relative}"
        end
        text.sub(before) { after }
      end
      unless Digest::SHA256.hexdigest(patched) == rule.fetch(:patched_sha256)
        raise "Internal replay patched source SHA256 mismatch: #{relative}"
      end
      [path, patched]
    end.compact

    staged = []
    begin
      pending.each do |path, patched|
        temp = Tempfile.new(['.derive-replay-', '.swift'], File.dirname(path))
        staged << [temp, path]
        temp.binmode
        temp.write(patched)
        temp.flush
        temp.chmod(File.stat(path).mode & 0o777)
        temp.close
      end
      staged.each { |temp, path| File.rename(temp.path, path) }
    ensure
      staged.each { |temp, _| temp.close! }
    end
  end
end
