const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const existing = config.resolver.blockList;
const localDirectories = ['.local-artifacts', '.local-backups', '.worktrees'];
const escapedPath = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const localExclusions = localDirectories.map(name =>
  new RegExp(`^${escapedPath(path.resolve(__dirname, name))}(?:[/\\\\]|$)`)
);

// Keep local history and backups out of Metro's file map and module resolution.
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  ...localExclusions,
];

module.exports = config;
