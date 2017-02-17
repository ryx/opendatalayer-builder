# OpenDataLayer Builder
The ODL builder generates a "package" with the opendatalayer library, combined with all configured
plugins and the required initialization code.

## Usage
```javascript
import odlBuilder from 'opendatalayer-builder';

odlBuilder.buildPackage({
  outputPath: 'build',
  baseDir: './',
  plugins: {
    'odl/plugins/ga': {
      config: { accountId: 'UA-123456' },
      rule: true,
    },
  },
});
```