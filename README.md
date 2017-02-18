# OpenDataLayer Builder
The ODL builder generates a "package" with the opendatalayer library, combined with all configured
plugins and the required initialization code.

## Usage
In your `package.json` you include the `opendatalayer`, `opendatalayer-builder` and any plugins you want to bundle as
`devDependenices`. Then, in your buildfile, you call ODL builder to create your package. The ODL builder offers a
method `buildPackage` which takes a config object and an optional callback parameter.

A very simple build script could look like this:.
```javascript
import odlBuilder from 'opendatalayer-builder';

odlBuilder
  .buildPackage({
    outputPath: 'build',
    outputFilename: 'odl-bundle-test.js',
    // This block defines the plugins to be included in the package, together with
    // their configuration and the respective deployment rules. A rule defines under
    // which circumstances to plugin will be activated (i.e. receive data) during runtime.
    plugins: {
      'opendatalayer-plugin-exmaple': {
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
Another (more scalable) approach is to completely separate your OpenDataLayer configuration
into a dedicated file. This results in much better separation of concerns and doesn't mix up your
ODL configuration with your project build settings.

Create a dedicated file named `opendatalayer.config.js`, include odlBuilder and add a call to
the `configure` method, passing your usual configuration as you would when using `buildPackage`:
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

Then, in your buildfile, you can simply include the configuration and call `buildPackage` without
further options. Here is an example using [gulp](http://www.gulpjs.com), which plays nicely together
since `buildPackage` returns a `Promise` object which gulp can handle.

```javascript
import odlBuilder from 'opendatalayer-builder';
import './opendatalayer.config.js';

gulp.task('opendatalayer', () => {
  odlBuilder.buildPackage().catch(err => console.log(err));
});
```
