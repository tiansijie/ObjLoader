var ObjLoader = require('../src/objLoader');
var THREE = require('three');
var OrbitControls = require('three-orbit-controls')(THREE);

var scene;
var camera;
var renderer;
var controls;

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
  objloader.load("./test/objfiles/sponza/sponza.obj", "./test/objfiles/sponza/sponza.mtl", function(err, result) {

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
            var face = new THREE.Face3(faces[i].indices[0]-1, faces[i].indices[j]-1, faces[i].indices[j+1]-1);
            geometry.faces.push(face);
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

      var groupMaterial = new THREE.MeshFaceMaterial(threeMaterialsArray);
      //var groupMaterial = new THREE.MeshBasicMaterial( { color: 0x00fff0 } );
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
	requestAnimationFrame( render );
	renderer.render( scene, camera );
  controls.update();
}


init();
render();
