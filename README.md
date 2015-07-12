# obj-mtl-loader


An obj file loader for WebGL, including .mtl loder

### Install
------
Using [npm](https://www.npmjs.com/)

```javascript
npm install obj-mtl-loader
```

### Example
------

To run example, ```npm install```, then run ```npm start```, you should see the obj loader working on your http://localhost:3001/.

If you want to edit the example, make sure you run ```webpack``` after you make any changes or you can run ```webpack --progress --colors --watch``` as the watch mode for webpack.


* only obj file
  ```javascript
  var ObjMtlLoader = require("obj-mtl-loader");
  var objMtlLoader = new ObjMtlLoader();
  objMtlLoader.load("./test/objfiles/bunny.obj", function(err, result) {
    if(err){
      /*Handle error here*/
    }
    var vertices = result.vertices;
    var faces = result.faces;
    var normals = result.normals;
  });
  ```

* with materials(.mtl)

  ```javascript
  var ObjMtlLoader = require("obj-mtl-loader");
  var objMtlLoader = new ObjMtlLoader();
  objMtlLoader.load("./test/objfiles/sponza/sponza.obj", "./test/objfiles/sponza/sponza.mtl", function(err, result) {
    if(err){
      /*Handle error here*/
    }
    var vertices = result.vertices;
    var faces = result.faces;
    var normals = result.normals;
    var textureCoords = result.textureCoords;
    var facesMaterialsIndex = result.facesMaterialsIndex;
    var materials = result.materials;
  });
  ```

  See more examples on [examples folder](https://github.com/tiansijie/ObjLoader/tree/master/example)

### Attributes
------

* vertices: Double Array, each item is an array with 3 or 4 numbers
* normals: Double Array, each item is an array with 3 numbers
* textureCoords: Double Array, each item is an array with 2 or 3 numbers
* faces: Objects inside Array, each Object is

  * indices: the index of the vertices for this face
  * texture: the texture index for this face
  * normal: the normal index of this face

* facesMaterialsIndex(Optional): Objects inside Array, each object is
  * materialName: The name of the material in mtl file
  * materialStartIndex: The start index of this material


* materials: Objects inside Array, each object is
  * name: Name of the material
  * ambient: Ambient color, **Ka**
  * diffuse: Diffuse color, **Kd**
  * specular: Specular color, **Ks**
  * specularExponent: Specular Exponent, **Ns**
  * transparent: transparent, **d** || **Tr**
  * illumMode: Illum mode, **illum**
  * ambientMap: Ambient map, **map_Ka**
  * diffuseMap: Diffuse map, **map_Kd**
  * specularMap: Specular map, **map_Ks**
  * alphaMat: Alpha map, **map_d**
  * bumpMap: Bump map, **map_bump**
  * displacementMap: Displacement map, **disp**

### License
------
  MIT
