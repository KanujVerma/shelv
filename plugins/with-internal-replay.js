const {withPodfile} = require('expo/config-plugins');

const begin = '# @generated begin internal-replay-capture-admission';
const end = '# @generated end internal-replay-capture-admission';

module.exports = function withInternalReplay(config) {
  return withPodfile(config, result => {
    const source = result.modResults.contents;
    const anchors = [...source.matchAll(/^([\t ]*)post_install do \|installer\|[\t ]*\r?$/gm)];
    if (anchors.length !== 1) {
      throw new Error('Internal replay requires exactly one unambiguous Expo post_install block.');
    }
    const anchor = anchors[0];
    const newline = source.includes('\r\n') ? '\r\n' : '\n';
    const indent = anchor[1] + '  ';
    const block = [
      indent + begin,
      indent + "require File.join(__dir__, '..', 'modules', 'internal-replay', 'build', 'patch-posthog.rb')",
      indent + 'DeriveInternalReplayCapturePatch.apply!(installer)',
      indent + end,
    ].join(newline);
    // The match consumes CR on CRLF input; one further character consumes LF in either style.
    const afterAnchor = anchor.index + anchor[0].length + 1;
    const installed = source.slice(afterAnchor, afterAnchor + block.length + newline.length);
    const hasInstallation = source.includes(begin) || source.includes(end) || source.includes('DeriveInternalReplayCapturePatch');
    if (hasInstallation) {
      if (installed !== block + newline || source.split(begin).length !== 2 || source.split(end).length !== 2) {
        throw new Error('Internal replay installation block was changed; restore the exact generated block.');
      }
      return result;
    }
    if (source[afterAnchor - 1] !== '\n') {
      throw new Error('Internal replay requires the Expo post_install anchor to end with a newline.');
    }
    result.modResults.contents = source.slice(0, afterAnchor) + block + newline + source.slice(afterAnchor);
    return result;
  });
};
