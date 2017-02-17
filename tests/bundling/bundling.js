var odlBuilder = require('../../src/builder');

odlBuilder.buildPackage({
  outputPath: '../../build',
  baseDir: './',
  plugins: {
    // explicitly NOT load facebookWCA for testing that case
    /* 'odl/plugins/facebookWCA': {
      config: { bla: 'blubb' },
      rule: false,
    },*/
    'opendatalayer-plugin-example': {
      config: {
        gaProdId: 'UA-123456',
      },
      rule: true,
    },
  },
}, function(err) {
  if (err) {
    console.error(err);
  } else {
    console.log('Ready ..');
  }
});
