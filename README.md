> **Please note that this project is still in the process of being prepared and polished
> to become a standalone tool and project. Any documentation might be incomplete and/or
> misleading. So no complains, you've been warned ;-) ..**

# OpenDataLayer Builder
The ODL builder generates a bundled "package" with the [OpenDataLayer framework](https://gitlab.gkh-setu.de/bsna/opendatalayer),
combined with your configured plugins and their required initialization code. The resulting file can be
directly included in your web project and offers all the benefits of the ODL right out-of-the-box. No further
setup or manual intervention required.

## Usage

### Preparation
Install the OpenDataLayer and OpenDataLayer Builder modules from npm, together with any ODL plugins
you want to use in your project:

    npm install opendatalayer opendatalayer-builder --save-dev
    npm install opendatalayer-plugin-example --save-dev

### Simple example
In your project's buildfile you import and call ODL builder to create your package. The builder offers a
[bundle](#api) method which takes a configuration object to set up ODL and control name and target of the
resulting file.

A very simple build script could look like this:.
```javascript
import odlBuilder from 'opendatalayer-builder';

odlBuilder
  .bundle({
    outputPath: 'build',
    outputFilename: 'odl-bundle-test.js',
    // This block defines the plugins to be included in the package, together with
    // their configuration and the respective deployment rules. A rule defines the
    // circumstances und which the plugin will be activated (i.e. receive data)
    // during runtime.
    plugins: {
      'opendatalayer-plugin-example': {
        config: { someValue: 'FOO-BAR-123' },
        rule: function (data) {
          return data.page.type === 'homepage'; // only activate on pages with type "homepage"
        },
      },
    },
  })
  .catch(err => console.error(err));
```

### Separating the ODL configuration
Another, more scalable approach is to completely separate your OpenDataLayer configuration
into a dedicated file. This results in much better separation of concerns and doesn't mix up your
ODL configuration with your project build settings.

For this you simply create a dedicated file named `opendatalayer.config.js`, include odlBuilder and
add a call to the [configure](#api) method, passing your usual configuration as you would when
using [bundle](#api):
```javascript
import odlBuilder from 'opendatalayer-builder';

odlBuilder.configure({
  outputPath: 'build',
  outputFilename: 'odl-bundle.max.js',
  plugins: {
    'opendatalayer-plugin-example': {
      config: {
        fooBar: 'FOO-BAR-123',
      },
      rule: (data) => (data.page.type === 'homepage'),
    },
  },
  debug: true,
});
```

Then, in your buildfile, you can simply include the configuration and call [bundle](#api) without
further options. Here is an example using [gulp](http://www.gulpjs.com), which plays nicely together
since [bundle](#api) returns a `Promise` object which gulp can handle.

```javascript
import odlBuilder from 'opendatalayer-builder';
import './opendatalayer.config.js';

gulp.task('opendatalayer', () => odlBuilder.bundle());
```

## API
The `opendatalayer-builder` module provides the following public methods:

### configure([config])
Pass the given configuration to the ODL builder. Read more about plugin configuration and options in the
[Configuration](#configuration) section.

### bundle([config]) -> Promise
Build the ODL package based on the provided configuration (or any config passed to [configure](#api)). Returns
a Promise object which gets passed an error object when rejected.

## Concepts
Behind the scenens the ODL Builder generates a piece of bootstrapping code and uses [browserify](http://browserify.org/) to bundle it
together with the ODL core library and all configured plugins. The bootstrapping code is a rather simple,
ES5-compliant piece of Javascript that joins all the other parts together.

The following, commented example snippet demonstrates the bootstrapping code:

```javascript
// load ODL library
var _odl = require("opendatalayer").odl;

// load standalone plugin
var opendatalayer_plugin_example = require("opendatalayer-plugin-example").default;
console.log("Plugin: opendatalayer-plugin-example", opendatalayer_plugin_example);

// load  set of local plugins
var ___node_modules_opendatalayer_plugins_kaufhof_dist_trbo = require("../node_modules/opendatalayer-plugins-kaufhof/dist/trbo").default;
console.log("Plugin: ../node_modules/opendatalayer-plugins-kaufhof/dist/trbo", ___node_modules_opendatalayer_plugins_kaufhof_dist_trbo);

// generate plugin configuration (as taken from config provided in builder)
var ODL_CONFIG = {
 "opendatalayer-plugin-example": {"fooBar":"FOO-BAR-123"},
 "../node_modules/opendatalayer-plugins-kaufhof/dist/trbo": {"scriptUrl":"..."},
};

// generate rules setup (as taken from config provided in builder)
var ODL_RULES = {
 "opendatalayer-plugin-example": function rule(data) {
        return data.page.type === 'homepage';
      },
 "../node_modules/opendatalayer-plugins-kaufhof/dist/trbo": function rule(data) {
        return true;
      },
};

// generate plugin references (used to look up constructor based on id)
var ODL_MAPPINGS = {
 "opendatalayer-plugin-example": opendatalayer_plugin_example,
 "../node_modules/opendatalayer-plugins-kaufhof/dist/trbo": ___node_modules_opendatalayer_plugins_kaufhof_dist_trbo,
};

// perform initialization (including an example of the onBeforeInitialization callback)
var ODL_DATA = {};
(function (odl, data, done) {
  // START: onBeforeInitialization callback
  window.require(['gk/lib/mediaQuery'], function (mq) {
    data.kaufhof = {
      breakpoint: mq.currentRange
    };
    done();
  });
// END: onBeforeInitialization callback
}(_odl, ODL_DATA, function () {
  _odl.initialize(ODL_DATA, ODL_RULES, ODL_CONFIG, {}, ODL_MAPPINGS);
}));

```
