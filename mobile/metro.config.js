// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// The web app's repo root, one level up — mobile/ is a sibling of src/, not
// a workspace member. This is intentionally lightweight: watching the repo
// root lets pure-logic modules re-export from ../src/utils/* via relative
// import without a full npm workspace. If that sharing surface grows,
// graduate to a real workspace (packages/domain) rather than expanding this
// further.
//
// Deliberately NOT touching resolver.nodeModulesPaths or
// disableHierarchicalLookup here: overriding either breaks Metro's normal
// hierarchical node_modules walk, which nested packages rely on to find
// their OWN correctly-versioned dependencies (e.g. react-native-reanimated's
// nested semver@7 vs. a hoisted semver@6 elsewhere in the tree). Widening
// watchFolders alone is enough for the ../src import to resolve.
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

module.exports = config;
