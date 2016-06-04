var solc = require('solc/wrapper');

var compileJSON = function () { return ''; };
var missingInputs = [];

module.exports = function (self) {
  self.addEventListener('message', function (e) {
    var data = e.data;
    switch (data.cmd) {
      case 'loadVersion':
        delete window.Module;
        compileJSON = null;

        self.importScripts(data.data);

        var compiler = solc(window.Module);

        compileJSON = function (input, optimize) {
          return JSON.stringify(compiler.compile(JSON.parse(input), optimize, function (path) {
            missingInputs.push(path);
            return { 'error': 'Deferred import' };
          }));
        };

        self.postMessage({
          cmd: 'versionLoaded',
          data: compiler.version(),
          acceptsMultipleFiles: compiler.supportsMulti
        });
        break;
      case 'compile':
        missingInputs.length = 0;
        self.postMessage({cmd: 'compiled', data: compileJSON(data.source, data.optimize), missingInputs: missingInputs});
        break;
    }
  }, false);
};
