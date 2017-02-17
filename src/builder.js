var path = require('path');
var fs = require('fs');
var browserify = require('browserify');

/**
 * Normalize a module name to an identifier that can be used as variable name.
 * Example: "foo/bar/example" would become "foo_bar_example"
 */
function normalizePluginName(moduleName, substitute) {
  return moduleName.replace(/[\-\/]/g, substitute || '_');
}
module.exports.normalizePluginName = normalizePluginName;

/**
 * Generate a string with ES6 import statements based on the given configuration
 * @return {String}
 */
function generateES6ImportString(config) {
  var output = 'import { odl } from "opendatalayer";\n';
  for (var name in config.plugins || {}) {
    if (!config.hasOwnProperty(name)) {
      output += 'import ' + normalizePluginName(name) + ' from "' + name + '";\n';
    }
  }
  return output;
}

/**
 * Generate a string with ES5 import statements based on the given configuration
 * @return {String}
 */
function generateES5ImportString(config) {
  var output = 'var odl = require("opendatalayer").odl;\n';
  for (var name in config.plugins || {}) {
    if (!config.hasOwnProperty(name)) {
      output += 'var ' + normalizePluginName(name) + ' = require("' + name + '").default;\n';
      output += 'console.log("Plugin: ' + name + '", ' + normalizePluginName(name) + ');\n';
    }
  }
  return output;
}

/**
 * Validate a single ODL plugin configuration and check if rule and config are
 * syntactically correct.
 * @param config
 * @return {Object}
 */
function validateConfiguration(config) {
  // validate configuration and rules
  if (!config.config) {
    throw new Error('validateConfiguration: config missing for plugin ' + config);
  }
  if (!config.rule) {
    throw new Error('validateConfiguration: rule missing for plugin ' + config);
  }
}

/**
 * Generate an ODL plugin configuration based on the given plugin list
 * @param plugins  {Array<Object>}   object literal with plugin configurations
 * @return {String}
 */
function generateConfiguration(plugins) {
  // build configuration block
  var output = 'var ODL_CONFIG = {\n';
  for (var name in plugins || {}) {
    if (plugins.hasOwnProperty(name)) {
      var entry = plugins[name];
      // output += ` '${name}': ${JSON.stringify(entry.config)}\n`;
      output += ' "' + name + '": ' + JSON.stringify(entry.config) + ',\n'
    }
  }
  output += '};\n';
  return output;
}

/**
 * Generate an ODL plugin ruleset based on the given plugin list
 * @param plugins  {Array<Object>}   object literal with plugin configurations
 * @return {String}
 */
function generateRuleset(plugins) {
  // build configuration block
  var output = 'var ODL_RULES = {\n';
  for (var name in plugins || {}) {
    if (plugins.hasOwnProperty(name)) {
      var entry = plugins[name];
      // output += `  '${name}': ${entry.rule},\n`;
      output += ' "' + name + '": ' + entry.rule + ',\n';
    }
  }
  output += '};\n';
  return output;
}

/**
 * Generate an ODL plugin mapping that gets used to lookup module variables for
 * runtime instantiation of plugins.
 * @param plugins  {Array<Object>}   object literal with plugin configurations
 * @return {String}
 */
function generateMappings(plugins) {
  // build configuration block
  var output = 'var ODL_MAPPINGS = {\n';
  for (var name in plugins || {}) {
    if (plugins.hasOwnProperty(name)) {
      // output += `  '${name}': ${normalizePluginName(name)},\n`;
      output += ' "' + name + '": ' + normalizePluginName(name) + ',\n';
    }
  }
  output += '};\n';
  return output;
}

/**
 * Generate the ODL initialization block based on given config and rules.
 * @return {String}
 */
function generateODLInitialization() {
  var output = 'odl.initialize({}, ODL_RULES, ODL_CONFIG, {}, ODL_MAPPINGS);';
  return output;
}

/**
 * Generate the complete ODL initscript that contains import statements for all required
 * plugins and the odl.init call.
 * @param config  {Object}  ODL configuration object as passed to odl.init
 * @param targetFilename  {String}  absolute path (incl. filename) to write the init script to
 */
function generateInitScript(config, targetFile) {
  var output = '';

  // generate main code
  output += generateES5ImportString(config) + '\n';
  output += generateConfiguration(config.plugins);
  output += generateRuleset(config.plugins);
  output += generateMappings(config.plugins) + '\n';
  output += generateODLInitialization();

  return fs.writeFileSync(targetFile, output);
}

/**
 * Generate a "package" with the opendatalayer library, combined with all configured
 * plugins and the initialization code.
 * @param config {Object} configuration object
 */
module.exports.buildPackage = function (config, cb) {
  //const baseDir = config.baseDir || `/${path.resolve(__dirname)}`;
  var baseDir = config.baseDir || '/' + path.resolve(__dirname);
  var entryPoint = '__odl-init.js';

  // fetch ODL base code
  var odlBasedir = require.resolve('opendatalayer');
  console.log('ODL base dir:', odlBasedir);

  // generate initialization code for ODL
  //generateInitScript(config, `${baseDir}/${entryPoint}`);
  generateInitScript(config, baseDir + '/' + entryPoint);

  console.log('Running builder in: ', baseDir);
  console.log('Starting from entry point: ', entryPoint);

  // run browserify and bundle everything together
  var bundle = browserify(baseDir + '/' + entryPoint).bundle(function(err, src) {
    if (!err) {
      fs.writeFileSync(baseDir + '/odl-bundle.js', src);
    }
    cb(err);
  });

  /* return rollup.rollup({
    entry: entryPoint,
    plugins: [rollupBabel({
      // use our own config here
      babelrc: false,
      presets: [['es2015', { modules: false }]],
      plugins: ['external-helpers'],
    })],
  }).then((bundle) => {
    bundle.write({
      format: 'umd',
      dest: './dist/odl-bundle.js',
      sourceMap: true,
    });
  });*/
};