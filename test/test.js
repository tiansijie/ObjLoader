var assert = require('chai').assert;
var fs = require('fs');
var util = require('util');
var sinon = require('sinon');

// Mock XHR; must be done before requiring objLoader
var server = sinon.fakeServer.create();
require("global/window").XMLHttpRequest = server.xhr;

var ObjLoader = require('../src/objLoader');

describe('Definition', function() {
  it('should be properly defined', function() {
    var objloader = new ObjLoader();
    assert(util.isObject(objloader));
  });
});

describe('Parsing', function() {
  var path = __dirname + '/../example/public/test/objfiles/sponza';
  var objFilePath = path + '/sponza.obj';
  var mtlFilePath = path + '/sponza.mtl';
  var objFileURL = "file://" + objFilePath;
  var mtlFileURL = "file://" + mtlFilePath;

  function okResponseFor(filePath) {
    return [ 200, {
      'Content-Type' : 'text/plain;charset=utf-8'
    }, fs.readFileSync(filePath, 'utf8') ];
  }

  beforeEach(function() {
    server.respondWith('GET', objFileURL, okResponseFor(objFilePath));
    server.respondWith('GET', mtlFileURL, okResponseFor(mtlFilePath));
  });

  it('should parse without error and return a meaningful object', function(done) {
    new ObjLoader().load(objFileURL, mtlFileURL, function(err, result) {

      // Basic sanity checks
      assert.isNull(err);
      assert.isDefined(result);
      assert(util.isObject(result));

      // Expected value is from Blender stats
      assert.equal(result.vertices.length, 60848);

      // Blender says 40209. Close enough I guess?
      assert.equal(result.faces.length, 40211);

      // Expected value: "newmtl" count in mtl
      assert.equal(result.materials.length, 20);
      
      // Ensure last material was properly loaded
      assert.equal(result.materials[19].name, 'sp_00_vrata_kock');
      assert.equal(result.materials[19].bumpMap, 'VRATA_KO.JPG');

      done();
    });

    server.respond();
  });
});