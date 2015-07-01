var ObjLoader = require('../src/objLoader');
var THREE = require('three');
var OrbitControls = require('three-orbit-controls')(THREE);
var webglUtility = require("./webglUtility");
var glMatrix = require("gl-matrix");

var scene;
var camera;
var renderer;
var controls;

var positionLocation = null;
var normalLocation = null;

var canvas = document.getElementById("canvas");
var gl = webglUtility.createWebGLContext(canvas);
if (!gl) {
  alert("No WebGL Supported on Your Browser");
}

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);

var near = 0.1;
var far = 100.0;

var persp = glMatrix.mat4.create();
glMatrix.mat4.perspective(persp, 45.0, canvas.width/canvas.height, near, far);

function sphericalToCartesian( r, a, e ) {
  var x = r * Math.cos(e) * Math.cos(a);
  var y = r * Math.sin(e);
  var z = r * Math.cos(e) * Math.sin(a);

  return [x,y,z];
}

var invTrans = glMatrix.mat4.create();

var radius = 10.0;
var azimuth = Math.PI;
var elevation = 0.0001;

//camera
var eye = sphericalToCartesian(radius, azimuth, elevation);
var center = [0.0, 0.0, 0.0];
var eyedis = 1.0;
var cam_dir = glMatrix.vec3.create();

glMatrix.vec3.normalize(cam_dir, glMatrix.vec3.create([center[0]-eye[0], center[1]-eye[1], center[2]-eye[2]]));

var up = [0.0, 1.0, 0.0];
var view = glMatrix.mat4.create();
glMatrix.mat4.lookAt(view, eye, center, up);

var viewVector = cam_dir;

var vBuffer = null;
var nBuffer = null;
var iBuffer = null;

function resetCamera()
{
	eye[0] = center[0] + eyedis * Math.cos(azimuth) * Math.cos(elevation);
	eye[1] = center[1] + eyedis * Math.sin(elevation);
	eye[2] = center[2] + eyedis * Math.cos(elevation) * Math.sin(azimuth);

	glMatrix.mat4.lookAt(view, eye, center, up);
}

var models = glMatrix.mat4.create();
glMatrix.mat4.identity(models);

var shader_prog;

/* Load shaders */
var vs = webglUtility.getShaderSource(document.getElementById("vs"));
var fs = webglUtility.getShaderSource(document.getElementById("fs"));

shader_prog = webglUtility.createProgram(gl, vs, fs, "");

var positionLocation = gl.getAttribLocation(shader_prog, "Position");
var normalLocation = gl.getAttribLocation(shader_prog, "Normal");
var u_ModelLocation = gl.getUniformLocation(shader_prog,"u_Model");
var u_ViewLocation = gl.getUniformLocation(shader_prog,"u_View");
var u_PerspLocation = gl.getUniformLocation(shader_prog,"u_Persp");

function initWebGL() {

  var objloader = new ObjLoader();
  objloader.load("./test/objfiles/suzanne/suzanne.obj", function(err, result) {
    if(err) {
      console.error(err);
    }
    else {

      var geometry = new THREE.Geometry();
      var vertices = result.vertices;
      var faces = result.faces;
      var normals = result.normals;
      var facesMaterialsIndex = result.facesMaterialsIndex;
      var materials = result.materials;


      var index = 0;
      var bufferVertices = [];
      var meshIndex = [];
      var meshNormals = [];


      for(var i = 0; i < faces.length; ++i) {
        for(var j = 1; j <= faces[i].indices.length-2; ++j) {
          var index1 = faces[i].indices[0]-1;
          var index2 = faces[i].indices[j]-1;
          var index3 = faces[i].indices[j+1]-1;

          bufferVertices.push(vertices[index1][0]);
          bufferVertices.push(vertices[index1][1]);
          bufferVertices.push(vertices[index1][2]);

          bufferVertices.push(vertices[index2][0]);
          bufferVertices.push(vertices[index2][1]);
          bufferVertices.push(vertices[index2][2]);

          bufferVertices.push(vertices[index3][0]);
          bufferVertices.push(vertices[index3][1]);
          bufferVertices.push(vertices[index3][2]);

          if(normals.length != 0) {
            for(var k = 0; k < 3; ++k) {
              meshNormals.push(normals[faces[i].normal[k]-1][0]);
              meshNormals.push(normals[faces[i].normal[k]-1][1]);
              meshNormals.push(normals[faces[i].normal[k]-1][2]);
            }
          }
          else {
            var calNormal = glMatrix.vec3.create();
            var aV = glMatrix.vec3.fromValues(
              vertices[index2][0] - vertices[index1][0],
              vertices[index2][1] - vertices[index1][1],
              vertices[index2][2] - vertices[index1][2]
            );
            var bV = glMatrix.vec3.fromValues(
              vertices[index3][0] - vertices[index2][0],
              vertices[index3][1] - vertices[index2][1],
              vertices[index3][2] - vertices[index2][2]
            );
            glMatrix.vec3.cross(calNormal, aV, bV);
            for(var k = 0; k < 3; ++k) {
              meshNormals.push(calNormal[0]);
              meshNormals.push(calNormal[1]);
              meshNormals.push(calNormal[2]);
            }
          }

          meshIndex.push(index++);
          meshIndex.push(index++);
          meshIndex.push(index++);
        }
      }

      var vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferVertices), gl.STATIC_DRAW);
      vertexBuffer.numItems = bufferVertices.length / 3;
      vBuffer = vertexBuffer;

      var normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshNormals), gl.STATIC_DRAW);
      normalBuffer.numItems = meshNormals.length / 3;
      nBuffer = normalBuffer;

      var indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshIndex), gl.STATIC_DRAW);
      indexBuffer.numItems = meshIndex.length;
      iBuffer = indexBuffer;
    }
  });


}


function animate() {
    window.requestAnimationFrame(animate);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    draw();
}

function draw() {
  if(vBuffer || nBuffer || iBuffer) {
    gl.useProgram(shader_prog);
    gl.enableVertexAttribArray(positionLocation);

    gl.uniformMatrix4fv(u_ModelLocation, false, models);
    gl.uniformMatrix4fv(u_ViewLocation, false, view);
	  gl.uniformMatrix4fv(u_PerspLocation, false, persp);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(normalLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);

    gl.drawElements(gl.TRIANGLES, iBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(positionLocation);
    gl.disableVertexAttribArray(normalLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
}


function init() {

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geometry, material );
  camera.position.z = 50;

  controls = new OrbitControls( camera );

  var objloader = new ObjLoader();
  objloader.load("./test/objfiles/bunny2.obj", function(err, result) {

    if(err) {
      console.error(err);
    }
    else {

      var geometry = new THREE.Geometry();
      var vertices = result.vertices;
      var faces = result.faces;
      var normals = result.normals;
      var facesMaterialsIndex = result.facesMaterialsIndex;
      var materials = result.materials;


      for(var i = 0; i < vertices.length; ++i) {
        geometry.vertices.push(
          new THREE.Vector3(vertices[i][0], vertices[i][1], vertices[i][2])
        )
      }


      if(facesMaterialsIndex) {
        for(var k = 0; k < facesMaterialsIndex.length; ++k) {

          var materialName = facesMaterialsIndex[k].materialName;
          var currentMatIndex = 0;
          for(var p = 0; p < materials.length; ++p) {
            if(materials[p].name === materialName) {
              currentMatIndex = p;
            }
          }

          var startIndex = facesMaterialsIndex[k].materialStartIndex;
          var endIndex = k+1 < facesMaterialsIndex.length? facesMaterialsIndex[k+1].materialStartIndex : faces.length;

          for(var i = startIndex; i < endIndex; ++i) {
            for(var j = 1; j <= faces[i].indices.length-2; ++j) {

              if(normals.length != 0) {
                var n0 = new THREE.Vector3(normals[faces[i].normal[0]-1][0], normals[faces[i].normal[0]-1][1], normals[faces[i].normal[0]-1][2]);
                var n1 = new THREE.Vector3(normals[faces[i].normal[1]-1][0], normals[faces[i].normal[1]-1][1], normals[faces[i].normal[1]-1][2]);
                var n2 = new THREE.Vector3(normals[faces[i].normal[2]-1][0], normals[faces[i].normal[2]-1][1], normals[faces[i].normal[2]-1][2]);

                var c0 = new THREE.Color(Math.abs(n0.x), Math.abs(n0.y), Math.abs(n0.z));
                var c1 = new THREE.Color(Math.abs(n1.x), Math.abs(n1.y), Math.abs(n1.z));
                var c2 = new THREE.Color(Math.abs(n2.x), Math.abs(n2.y), Math.abs(n2.z));

                var face = new THREE.Face3(faces[i].indices[0]-1, faces[i].indices[j]-1, faces[i].indices[j+1]-1, [n0,n1,n2], [c0,c1,c2], currentMatIndex);

              }
              else {
                var face = new THREE.Face3(faces[i].indices[0]-1, faces[i].indices[j]-1, faces[i].indices[j+1]-1, [0,1,0], [0,0,0], currentMatIndex);

                var fvUV = new THREE.Vector3(faces[i].texture[0]-1, faces[i].texture[j]-1, faces[i].texture[j+1]-1);
              }

              geometry.faces.push(face);
              geometry.faceVertexUvs.push(fvUV);
            }
          }
        }
      }
      else {
        for(var i = 0; i < faces.length; ++i) {
          for(var j = 1; j <= faces[i].indices.length-2; ++j) {

            if(normals.length != 0) {
              var n0 = new THREE.Vector3(normals[faces[i].normal[0]-1][0], normals[faces[i].normal[0]-1][1], normals[faces[i].normal[0]-1][2]);
              var n1 = new THREE.Vector3(normals[faces[i].normal[1]-1][0], normals[faces[i].normal[1]-1][1], normals[faces[i].normal[1]-1][2]);
              var n2 = new THREE.Vector3(normals[faces[i].normal[2]-1][0], normals[faces[i].normal[2]-1][1], normals[faces[i].normal[2]-1][2]);

              var c0 = new THREE.Color(Math.abs(n0.x), Math.abs(n0.y), Math.abs(n0.z));
              var c1 = new THREE.Color(Math.abs(n1.x), Math.abs(n1.y), Math.abs(n1.z));
              var c2 = new THREE.Color(Math.abs(n2.x), Math.abs(n2.y), Math.abs(n2.z));

              var face = new THREE.Face3(faces[i].indices[0]-1, faces[i].indices[j]-1, faces[i].indices[j+1]-1, [n0,n1,n2], [c0,c1,c2], currentMatIndex);
              geometry.faces.push(face);
            }
            else {
              var face = new THREE.Face3(faces[i].indices[0]-1, faces[i].indices[j]-1, faces[i].indices[j+1]-1);
            }

          }
        }
      }

      var threeMaterialsArray = [];
      if(materials) {
        for(var i = 0; i < materials.length; ++i) {
          var matData = materials[i];
          var mat = new THREE.MeshBasicMaterial();
          mat.color = new THREE.Color(matData.diffuse[0], matData.diffuse[1], matData.diffuse[2]);
          mat.specular = new THREE.Color(matData.specular[0], matData.specular[1], matData.specular[2]);
          threeMaterialsArray.push(mat);
        }
      }

      //var groupMaterial = new THREE.MeshFaceMaterial(threeMaterialsArray);
      var groupMaterial = new THREE.MeshPhongMaterial( { color: 0x00fff0 } );
      var cube = new THREE.Mesh(geometry, groupMaterial);
      cube.scale.set(10,10,10);
      scene.add( cube );

    }
  });


  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
  directionalLight.position.set( 0, 1, 0 );
  scene.add( directionalLight );

  var light = new THREE.AmbientLight( 0x404040 ); // soft white light
  scene.add( light );

}


function render() {
  //requestAnimationFrame( render );
  renderer.render( scene, camera );
  controls.update();
}

initWebGL();
animate();

// init();
// render();
