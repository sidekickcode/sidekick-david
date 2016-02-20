var analyser = require("../../../analysis/src/analyser");

var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');

describe('dependency analyser', function() {

  describe('config', function() {

    var sd;

    before(function() {
      this.config = analyser.load(__dirname + "/../");
      sd = require('../../sidekick-david');
    });

    it('config exists for analyser', function() {
      assert.isObject(this.config, 'analyser config is an object');
    });

    it('turns interpreters and scripts into invocation', function() {
      assert.match(this.config.command, /\bnode\b/);
    });

    it('interpreter command contains script', function() {
      var re = /\/index\.js$/;
      var matches = re.exec(this.config.command);
      assert.equal(matches.length, 1);
    });

    it('executes as analyser', function(done) {
      var manifest = require('../package.json');
      manifest.dependencies.david = "0.0.1";  //put back deps

      fs.readFile(path.join(__dirname, '/../package.json'), "utf-8", function(err, data){
        sd.run(manifest, data).then(function(results){
          console.log(JSON.stringify({ meta: results }));
          var badDavidDep = {analyser: 'sidekick-david', kind: 'dependency_outdated'};
          assert.equal(results.length, 1);
          var returnedDavidDep = results[0];
          assert.equal(returnedDavidDep.analyser, badDavidDep.analyser);
          assert.equal(returnedDavidDep.kind, badDavidDep.kind);
          assert.isObject(returnedDavidDep.location);

          var messageRe = /Dependency \'david\' is out of date. You have \'0\.0\.1\'./;
          var matches = messageRe.exec(returnedDavidDep.message);
          assert.equal(matches.length, 1);
          done();
        });

      });
    });

    it('executes as cli', function(done) {
      var manifest = require('../package.json');
      manifest.dependencies.david = "0.0.1";  //put back deps
      manifest.devDependencies.chai = "0.0.1";  //put back deps
      manifest.optionalDependencies = {"jscs":  "0.0.1"};  //put back deps

      sd.runCliReport(manifest).then(function(results){
        console.log('\n\n' + results.cliOutput);
        assert.equal(results.deps.length, 1);
        assert.equal(results.devDeps.length, 1);
        assert.equal(results.optDeps.length, 1);
        done();
      });
    });

    it('executes as cli - no deps', function(done) {
      delete require.cache[require.resolve('../package.json')];
      var manifest = require('../package.json');
      manifest.devDependencies.chai = "0.0.1";  //put back deps

      sd.runCliReport(manifest).then(function(results){
        console.log('\n\n' + results.cliOutput);
        assert.equal(results.deps.length, 0);
        assert.equal(results.devDeps.length, 1);
        done();
      });
    });

    it('executes as cli - no dev deps', function(done) {
      delete require.cache[require.resolve('../package.json')];
      var manifest = require('../package.json');
      manifest.dependencies.david = "0.0.1";  //put back deps

      sd.runCliReport(manifest).then(function(results){
        console.log('\n\n' + results.cliOutput);
        assert.equal(results.deps.length, 1);
        assert.equal(results.devDeps.length, 0);
        done();
      });
    });

    it('executes as cli - with only optional deps', function(done) {
      delete require.cache[require.resolve('../package.json')];
      var manifest = require('../package.json');
      manifest.optionalDependencies = {"jscs":  "0.0.1"};  //put back deps

      sd.runCliReport(manifest).then(function(results){
        console.log('\n\n' + results.cliOutput);
        assert.equal(results.deps.length, 0);
        assert.equal(results.devDeps.length, 0);
        assert.equal(results.optDeps.length, 1);
        done();
      });
    });
  })
});