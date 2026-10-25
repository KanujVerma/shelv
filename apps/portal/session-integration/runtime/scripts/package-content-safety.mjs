// The bare sb_secret_ prefix is validation vocabulary. Any nonempty key-like
// suffix is forbidden in a package, alongside the existing fixture markers.
// Only counts and the reviewed artifact path may enter failure diagnostics.
export function assertPackageContentSafe(content, filename) {
  const prohibited = /synthetic-(?:access|refresh|verifier|storage-signature)|sb_secret_[A-Za-z0-9_.-]+|sb_publishable_synthetic|testRunAlarm|testGetAlarm/g;
  const source = content.toString();
  let count = 0;
  while (prohibited.test(source)) count++;
  if (count) throw new Error(`Prohibited package markers found in ${filename} (${count} ${count === 1 ? 'match' : 'matches'}).`);
}
