Pod::Spec.new do |s|
 s.name = 'DeriveInternalReplay'
 s.version = '0.1.0'
 s.summary = 'Debug-only synthetic replay test surface'
 s.description = 'Generated UIKit and React Native replay validation with capture-time native admission.'
 s.license = { :type => 'Proprietary' }
 s.author = 'Derive'
 s.homepage = 'https://github.com/KanujVerma/shelv'
 s.platforms = { :ios => '16.4' }
 s.source = { :git => 'https://github.com/KanujVerma/shelv.git' }
 s.static_framework = true
 s.dependency 'ExpoModulesCore'
 s.dependency 'PostHog', '3.88.2'
 s.source_files = '*.swift'
 s.swift_version = '5.0'
end
