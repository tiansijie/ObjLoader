# ObjLoader
An obj file loader for WebGL, including .mtl loder

It's going to be an npm module


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
   

