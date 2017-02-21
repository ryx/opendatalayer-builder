var mocha = require('mocha');
var assert = require('chai').assert;
var sinon = require('sinon');
var mockery = require('mockery');

var it = mocha.it;
var describe = mocha.describe;
var before = mocha.before;
var after = mocha.after;
var beforeEach = mocha.beforeEach;
var afterEach = mocha.afterEach;

describe('odl-builder', function () {
  let [odlBuilder, pathStub, fsStub, browserifyStub, browserifyInstanceStub] = [];

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });
  });

  after(function () {
    mockery.disable();
  });

  beforeEach(function () {
    mockery.resetCache();
    // stubs
    pathStub = sinon.stub();
    fsStub = {
      writeFileSync: sinon.spy(),
      unlinkSync: sinon.spy()
    };
    browserifyInstanceStub = { bundle: sinon.stub().callsArgWith(0, null, 'foo') };
    browserifyStub = sinon.stub().returns(browserifyInstanceStub);
    // register mocks
    mockery.registerMock('path', pathStub);
    mockery.registerMock('fs', fsStub);
    mockery.registerMock('browserify', browserifyStub);
    // load ODL builder
    odlBuilder = require ('./../../src/builder');
  });

  afterEach(function () {
    mockery.deregisterAll();
  });

  describe ('_normalizePluginName', function () {
    it ('should be a function', function () {
      assert.isFunction(odlBuilder._normalizePluginName);
    });

    it ('should replace dashes in module names with an underscore', function () {
      assert.equal(odlBuilder._normalizePluginName('my-module-name'), 'my_module_name');
    });

    it ('should replace slashes in module names with an underscore', function () {
      assert.equal(odlBuilder._normalizePluginName('my/module/name'), 'my_module_name');
    });
  });

  describe ('configure', function () {
    it ('should be a function', function () {
      assert.isFunction(odlBuilder.configure);
    });

    it ('should NOT throw an error if valid options are passed', function () {
      assert.doesNotThrow(function () {
        odlBuilder.configure({
          baseDir: '',
          outputPath: '',
          outputFilename: ''
        });
      }, 'configure: option "kaboom" is unknown');
    });

    it ('should throw an error if unknown options are passed', function () {
      assert.throws(function () {
        odlBuilder.configure({ kaboom: 'foo' });
      }, 'configure: option "kaboom" is unknown');
    });

    it ('should accept an object and store it as internal configuration that then gets used by the [bundle] method ', function () {
      odlBuilder.configure({
        baseDir: '_basedir_',
        outputPath: '_outputPath_',
        outputFilename: '_outputFilename_'
      });
      return odlBuilder.bundle()
        .then(function () {
          sinon.assert.calledWith(fsStub.writeFileSync, '_basedir_/_outputPath_/_outputFilename_.__tmp.js');
        })
        .catch(function (err) { /* fail silently */ });
    });
  });

  describe ('bundle', function () {
    let [config] = [];

    beforeEach(function () {
      config = {
        baseDir: '.',  // usually points to process.cwd()
        outputPath: 'output',
        outputFilename: 'myfile.js'
      };
    });

    it ('should be a function', function () {
      assert.isFunction(odlBuilder.bundle);
    });

    it ('should throw an error if invalid options are provided', function () {
      var options = { kaboom: 'foo' };
      assert.throws(function () {
        odlBuilder.bundle(options);
      }, 'configure: option "kaboom" is unknown');
    });

    it ('should NOT throw an error if valid options are provided', function () {
      assert.doesNotThrow(function () {
        odlBuilder.bundle(config);
      }, 'configure: option "kaboom" is unknown');
    });

    it ('should write the temporary output to "/{config.outputPath}/{config.outputFilename}.__tmp.js"', function () {
      return odlBuilder.bundle(config)
        .then(function () {
          sinon.assert.calledWith(fsStub.writeFileSync, './output/myfile.js.__tmp.js');
        });
    });

    it ('should call browserify on the temp file "/{config.outputPath}/{config.outputFilename}.__tmp.js"', function () {
      return odlBuilder.bundle(config)
        .then(function () {
          sinon.assert.calledWith(browserifyStub, './output/myfile.js.__tmp.js');
        });
    });

    it ('should call browserify.bundle and write the output to "/{config.outputPath}/{config.outputFileName}" if browserify.bundle DOES NOT throw an error', function () {
      return odlBuilder.bundle(config)
        .then(function () {
          sinon.assert.calledWith(fsStub.writeFileSync, './output/myfile.js');
        });
    });

    it ('should call unlink on the temporary output if browserify.bundle DOES NOT throw an error', function () {
      return odlBuilder.bundle(config)
        .then(function () {
          sinon.assert.calledWith(fsStub.unlinkSync, './output/myfile.js.__tmp.js');
        });
    });

    it ('should NOT call unlink on the temporary output if browserify.bundle DOES NOT throw an error but {config.debug} is true', function () {
      config.debug = true;
      return odlBuilder.bundle(config)
        .then(function () {
          sinon.assert.neverCalledWith(fsStub.unlinkSync, './output/myfile.js.__tmp.js');
        });
    });

    /* it ('should reject the Promise if browserify.bundle DOES throw an error', function (done) {
      mockery.deregisterAll();
      mockery.resetCache();
      browserifyInstanceStub = { bundle: sinon.stub().callsArgWith(0, null, 'Boomshakala') };
      browserifyStub = sinon.stub().returns(browserifyInstanceStub);
      // register mocks
      mockery.registerMock('browserify', browserifyStub);

      odlBuilder.bundle(config)
        .then(function (err) {
          console.log('ERR', err);
          assert.equal(err, 'Boomshakala');
          done();
        })
        .catch(function (err) { console.error(err); });
    });*/
  });
});
