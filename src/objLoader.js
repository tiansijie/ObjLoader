var stream = require('stream');
var split = require('split');
var xhr = require('xhr');


function ObjLoader() {

  this.vertices = [];
  this.normals = [];
  this.textureCoords = [];
  this.faces = [];
  this.facesMaterialsIndex = [{materialName: null, materialStartIndex: 0}];
  this.materials = [];

}

ObjLoader.prototype.load = function(objFilePath, mtlFilePath, callback) {

  var self = this;

  if(typeof mtlFilePath === "function") {
    callback = mtlFilePath;
    mtlFilePath = "";
  }

  xhr(objFilePath, function (err, resp, objFileString) {
    if(err) {
      /*Error Handling*/
      callback(err);
    }
    /*Create readable stream to read obj file line by line*/
    var readable = self.createReadStream(objFileString);

    readable
      .pipe(split())
      .on('data', function(line) {
        self.parseObj(line);
      })
      .on('end', function() {

        /*Start reading .mtl file*/
        if(typeof mtlFilePath === "string" && mtlFilePath !== "") {
          xhr(mtlFilePath, function (err, resp, mtlFileString) {

            if(err) {
              callback(err);
            }

            var currentMat = {};
            var readable = self.createReadStream(mtlFileString);

            readable
              .pipe(split())
              .on('data', function(line) {
                currentMat = self.parseMtl(line, currentMat);
              })
              .on('end', function() {
                if(currentMat.name) {
                  self.materials.push(currentMat);
                }
                /*Geometry and Materials*/
                callback(
                  null,
                  {
                    vertices: self.vertices,
                    normals: self.normals,
                    textureCoords: self.textureCoords,
                    faces: self.faces,
                    facesMaterialsIndex: self.facesMaterialsIndex,
                    materials: self.materials
                  }
                );
              })
              .on('err', function(err) {
                /*Error Handling*/
                callback(err)
              });
          });
        }
        else {
          /*Only Geometry*/
          callback(
            null,
            {
              vertices: self.vertices,
              normals: self.normals,
              textureCoords: self.textureCoords,
              faces: self.faces
            }
          );
        }
      })
      .on('err', function(err) {
        /*Error Handling*/
        callback(err);
      });
  });
}


ObjLoader.prototype.createReadStream = function(fileString) {
  var readable = new stream.Readable();
  readable._read = function noop() {};
  readable.push(fileString);
  readable.push(null);
  return readable;
}


ObjLoader.prototype.parseObj = function(line) {

  /*Not include comment*/
  var commentStart = line.indexOf("#");
  if(commentStart != -1) {
    line = line.substring(0, commentStart);
  }
  line = line.trim();

  var splitedLine = line.split(/\s+/);

  if(splitedLine[0] === 'v') {
    var vertex = [Number(splitedLine[1]), Number(splitedLine[2]), Number(splitedLine[3]), splitedLine[4]? 1 : Number(splitedLine[4])];
    this.vertices.push(vertex);
  }
  else if(splitedLine[0] === 'vt') {
    var textureCoord = [Number(splitedLine[1]), Number(splitedLine[2]), splitedLine[3]? 1 : Number(splitedLine[3])]
    this.textureCoords.push(textureCoord);
  }
  else if(splitedLine[0] === 'vn') {
    var normal = [Number(splitedLine[1]), Number(splitedLine[2]), Number(splitedLine[3])];
    this.normals.push(normal);
  }
  else if(splitedLine[0] === 'f') {
    var face = {
      indices: [],
      texture: [],
      normal: []
      };

    for(var i = 1; i < splitedLine.length; ++i) {
      var dIndex = splitedLine[i].indexOf('//');
      var splitedFaceIndices = splitedLine[i].split(/\W+/);

      if(dIndex > 0) {
        /*Vertex Normal Indices Without Texture Coordinate Indices*/
        face.indices.push(splitedFaceIndices[0]);
        face.normal.push(splitedFaceIndices[1]);
      }
      else {
        if(splitedFaceIndices.length === 1) {
          /*Vertex Indices*/
          face.indices.push(splitedFaceIndices[0]);
        }
        else if(splitedFaceIndices.length === 2) {
          /*Vertex Texture Coordinate Indices*/
          face.indices.push(splitedFaceIndices[0]);
          face.texture.push(splitedFaceIndices[1]);
        }
        else if(splitedFaceIndices.length === 3) {
          /*Vertex Normal Indices*/
          face.indices.push(splitedFaceIndices[0]);
          face.texture.push(splitedFaceIndices[1]);
          face.normal.push(splitedFaceIndices[2]);
        }
      }
    }

    this.faces.push(face);
  }
  else if(splitedLine[0] === "usemtl") {
    if(this.faces.length === 0) {
      this.facesMaterialsIndex[0].materialName = splitedLine[1];
    }
    else {
      var materialName = splitedLine[1];
      var materialStartIndex = this.faces.length;

      this.facesMaterialsIndex.push({materialName: materialName, materialStartIndex: materialStartIndex});
    }
  }
}


ObjLoader.prototype.parseMtl = function(line, currentMat) {

  /*Not include comment*/
  var commentStart = line.indexOf("#");
  if(commentStart != -1) {
    line = line.substring(0, commentStart);
  }

  line = line.trim();
  var splitedLine = line.split(/\s+/);

  if(splitedLine[0] === "newmtl") {
    if(currentMat.name) {
      this.materials.push(currentMat);
      currentMat = {};
    }
    currentMat.name = splitedLine[1];
  }
  else if(splitedLine[0] === "Ka") {
    currentMat.ambient = [];
    for(var i = 0; i < 3; ++i) {
      currentMat.ambient.push(splitedLine[i+1]);
    }
  }
  else if(splitedLine[0] === "Kd") {
    currentMat.diffuse = [];
    for(var i = 0; i < 3; ++i) {
      currentMat.diffuse.push(splitedLine[i+1]);
    }
  }
  else if(splitedLine[0] === "Ks") {
    currentMat.specular = [];
    for(var i = 0; i < 3; ++i) {
      currentMat.specular.push(splitedLine[i+1]);
    }
  }
  else if(splitedLine[0] === "Ns") {
    currentMat.specularExponent = splitedLine[1];
  }
  else if(splitedLine[0] === "d" || splitedLine[0] === "Tr") {
    currentMat.transparent = splitedLine[1];
  }
  else if(splitedLine[0] === "illum") {
    currentMat.illumMode = splitedLine[1];
  }
  else if(splitedLine[0] === "map_Ka") {
    currentMat.ambientMap = splitedLine[1];
  }
  else if(splitedLine[0] === "map_Kd") {
    currentMat.diffuseMap = splitedLine[1];
  }
  else if(splitedLine[0] === "map_Ks") {
    currentMat.specularMap = splitedLine[1];
  }
  else if(splitedLine[0] === "map_d") {
    currentMat.alphaMat = splitedLine[1];
  }
  else if(splitedLine[0] === "map_bump" || splitedLine[0] === "bump") {
    currentMat.bumpMap = splitedLine[1];
  }
  else if(splitedLine[0] === "disp") {
    currentMat.displacementMap = splitedLine[1];
  }

  return currentMat;
}


module.exports = ObjLoader;
