// import texture.js
// import MV.js
// import models.js
// import modelLoad.js
var stop = false;
var setBoatOnFire = false;
var won = false;
var isAlive = true;
var beginGame;
// var oldProjection;
var counter = 2;
const framesToShake = 10;
var frameCounter = framesToShake;

const ATTACK_DIS = 0.8;
const CURVATURE = 0.3;
const ROTATE_SPEED = 3;
const ENENMY_SPEED = 0.01;
const BOMB1_SPEED = 0.05;
const BOMB2_SPEED = 0.03;
const USER_SPEED = 0.02;


function Water(width, height, h) {
	// Properties
	// texture (u, v, 0)
	if (width != height) {
		console.log("width is not equal to height");
	}
	this.width = width;
	this.height = height;
	this.h = h;

	var filter = gl.LINEAR;
	if (!gl.getExtension("OES_texture_float")) {
		console.log("Your browser doesn't support OES_texture_float extension");
		if (!gl.getExtension("OES_texture_half_float")) {
			console.log("Your browser doesn't support OES_texture_half_float extension");
		}
		else {
			if (!gl.getExtension("OES_texture_half_float_linear")) {
				console.log("Your browser doesn't support OES_texture_half_float_linear extension");
				filter = gl.NEAREST;
			}
		}
	}
	else {
		if (!gl.getExtension("OES_texture_float_linear")) {
			console.log("Your browser doesn't support OES_float_linear extension");
			filter = gl.NEAREST;
		}
	}


	this.textureA = new Texture(width, height, {type: gl.FLOAT, filter: filter});
	this.textureB = new Texture(width, height, {type: gl.FLOAT, filter: filter});

	this.cauticsTexture = new Texture(width, height, {type: gl.UNSIGNED_BYTE, filter: gl.LINEAR});

	this.vertexArray = [vec4(-1, -1, 0, 1),
						vec4( 1, -1, 0, 1),
						vec4(-1,  1, 0, 1),
						vec4( 1,  1, 0, 1)];										// position of each vertices of surface of water
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertexArray), gl.STATIC_DRAW);

	
	// generate the mesh vertex of the surface of water


	// generate update fragment shader
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, '\
						attribute vec4 position;\
						varying vec2 coord;\
						\
						void main() {\
							coord = position.xy * 0.5 + 0.5;\
							gl_Position = position;\
						}\
						');
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.log('vertex compile error: ' + gl.getShaderInfoLog(vertexShader));
	}
	var updateShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(updateShader, '\
						precision highp float;\
						uniform float deltaX;\
						const float deltaT = 0.016;\
						\
						varying vec2 coord;\
						uniform sampler2D texture;\
						\
						void main() {\
							float c = 0.7 * deltaX / deltaT;\
							vec4 u = texture2D(texture, coord);\
							vec2 dx = vec2(deltaX, 0.0);\
							vec2 dy = vec2(0.0, deltaX);\
							float f = c * c * (\
												texture2D(texture, coord + dx).r +\
												texture2D(texture, coord + dy).r +\
												texture2D(texture, coord - dx).r +\
												texture2D(texture, coord - dy).r -\
												4.0 * u.r) / (deltaX * deltaX);\
							u.g += f * deltaT;\
							u.r += u.g * deltaT;\
							u.g *= 0.995;\
							gl_FragColor = u;\
						}\
						');
	gl.compileShader(updateShader);
	if (!gl.getShaderParameter(updateShader, gl.COMPILE_STATUS)) {
		console.log('update fragment compile error: ' + gl.getShaderInfoLog(updateShader));
	}
	this.updateProgram = gl.createProgram();
	gl.attachShader(this.updateProgram, vertexShader);
	gl.attachShader(this.updateProgram, updateShader);
	gl.linkProgram(this.updateProgram);
	if (!gl.getProgramParameter(this.updateProgram, gl.LINK_STATUS)) {
		console.log("Program link error: " + gl.getProgramInfoLog(this.updateProgram));
	}
	this.dxLoc = gl.getUniformLocation(this.updateProgram, "deltaX");

	
	var forceShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(forceShader, '\
						precision highp float;\
						const float PI = 3.141592653589793;\
						varying vec2 coord;\
						uniform vec2 center;\
						uniform float radius;\
						uniform float strength;\
						uniform sampler2D texture;\
						\
						void main() {\
							vec4 info = texture2D(texture, coord);\
							float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);\
							drop = 0.5 - cos(drop * PI) * 0.5;\
							info.r += drop * strength;\
							\
							gl_FragColor = info;\
						}\
						');
	gl.compileShader(forceShader);
	if (!gl.getShaderParameter(forceShader, gl.COMPILE_STATUS)) {
		console.log('force fragment compile error: ' + gl.getShaderInfoLog(forceShader));
	}
	this.forceProgram = gl.createProgram();
	gl.attachShader(this.forceProgram, vertexShader);
	gl.attachShader(this.forceProgram, forceShader);
	gl.linkProgram(this.forceProgram);
	if (!gl.getProgramParameter(this.forceProgram, gl.LINK_STATUS)) {
		console.log("Program link error: " + gl.getProgramInfoLog(this.forceProgram));
	}
	this.cenLoc = gl.getUniformLocation(this.forceProgram, "center");
	this.radLoc = gl.getUniformLocation(this.forceProgram, "radius");
	this.streLoc = gl.getUniformLocation(this.forceProgram, "strength");


	var normalShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(normalShader, '\
						precision highp float;\
						varying vec2 coord;\
						uniform float deltaX;\
						uniform sampler2D texture;\
						\
						void main() {\
							vec4 u = texture2D(texture, coord);\
							vec2 dx = vec2(deltaX, 0.0);\
							vec2 dy = vec2(0.0, deltaX);\
							vec3 v1 = vec3(deltaX, texture2D(texture, coord + dx).r - u.r, 0.0);\
							vec3 v2 = vec3(0.0, texture2D(texture, coord + dy).r - u.r, deltaX);\
							u.ba = normalize(cross(v1, v2)).xz;\
							\
							gl_FragColor = u;\
						}\
						');
	gl.compileShader(normalShader);
	if (!gl.getShaderParameter(normalShader, gl.COMPILE_STATUS)) {
		console.log('normal fragment compile error: ' + gl.getShaderInfoLog(normalShader));
	}
	this.normalProgram = gl.createProgram();
	gl.attachShader(this.normalProgram, vertexShader);
	gl.attachShader(this.normalProgram, normalShader);
	gl.linkProgram(this.normalProgram);
	if (!gl.getProgramParameter(this.normalProgram, gl.LINK_STATUS)) {
		console.log("Program link error: " + gl.getProgramInfoLog(this.normalProgram));
	}
	this.nDxLoc = gl.getUniformLocation(this.normalProgram, "deltaX");


	var cauticsShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(cauticsShader, '\
						precision highp float;\
						varying vec2 coord;\
						uniform sampler2D texture;\
						uniform vec3 light;\
						\
						void main() {\
							vec4 u = texture2D(texture, coord);\
							vec3 normal = vec3(u.b, sqrt(1.0 - dot(u.ba, u.ba)), u.a);\
							vec3 incomingRay = refract(vec3(0.0, -1.0, 0.0), -normal, 1.0 / 1.333);\
							gl_FragColor = vec4(pow(abs(incomingRay.y), 100.0) * light, 1.0);\
						}\
						')
	gl.compileShader(cauticsShader);
	if (!gl.getShaderParameter(cauticsShader, gl.COMPILE_STATUS)) {
		console.log('cautics fragment compile error: ' + gl.getShaderInfoLog(cauticsShader));
	}
	this.cauticsProgram = gl.createProgram();
	gl.attachShader(this.cauticsProgram, vertexShader);
	gl.attachShader(this.cauticsProgram, cauticsShader);
	gl.linkProgram(this.cauticsProgram);
	if (!gl.getProgramParameter(this.cauticsProgram, gl.LINK_STATUS)) {
		console.log("Program link error: " + gl.getProgramInfoLog(this.cauticsProgram));
	}
	this.lightLoc = gl.getUniformLocation(this.cauticsProgram, "light");




	this.waterMeshArray = [];
	var detail = 200;
	var step = 2 / detail;
	for (var i = 0; i < detail - 1; i++) {
		x = i / detail;
		x = 2 * x - 1;
		for (var j = 0; j < detail - 1; j++) {
			y = j / detail;
			y = 2 * y - 1;
			this.waterMeshArray.push(vec4(x, y, 0, 1));
			this.waterMeshArray.push(vec4(x, y + step, 0, 1));
			this.waterMeshArray.push(vec4(x + step, y, 0, 1));
			this.waterMeshArray.push(vec4(x, y + step, 0, 1));
			this.waterMeshArray.push(vec4(x + step, y, 0, 1));
			this.waterMeshArray.push(vec4(x + step, y + step, 0, 1));
		}
	}
	this.waterMeshBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.waterMeshBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.waterMeshArray), gl.STATIC_DRAW);

	var vRenderShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vRenderShader, '\
						attribute vec4 position;\
						uniform sampler2D waterTexture;\
						uniform mat4 modelViewMatrix;\
						uniform mat4 projectionMatrix;\
						varying vec4 vPos;\
						\
						void main() {\
							vec4 u = texture2D(waterTexture, position.xy * 0.5 + 0.5);\
							vec4 modifiedPos = vec4(position.xzy, 1);\
							modifiedPos.y += u.r;\
							vPos = modifiedPos;\
							gl_Position = projectionMatrix * modelViewMatrix * modifiedPos;\
						}\
						');
	gl.compileShader(vRenderShader);
	if (!gl.getShaderParameter(vRenderShader, gl.COMPILE_STATUS)) {
		console.log('vertex compile error: ' + gl.getShaderInfoLog(vRenderShader));
	}
	var fRenderShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fRenderShader, '\
							precision highp float;\
							varying vec4 vPos;\
							uniform sampler2D waterTexture;\
							uniform sampler2D wallTexture;\
							uniform sampler2D cauticsTexture;\
							uniform sampler2D object1;\
							uniform sampler2D object2;\
							uniform sampler2D object3;\
							uniform sampler2D object4;\
							uniform sampler2D boatTexture;\
							uniform sampler2D skyTexture;\
							uniform vec4 vLevel;\
							uniform vec4 eye;\
							\
							vec4 intersectObject(vec3 center, vec3 ray, sampler2D texture, float level) {\
								float b = (level - center.y) / ray.y;\
								vec3 pos = b * ray + center;\
								vec4 info = texture2D(texture, pos.xz * 0.5 + 0.5);\
								if (info.r == 0.0 && info.g == 0.0 && info.b == 0.0) return vec4(0.0, 0.0, 0.0, 0.0);\
								else return info * 0.5 + texture2D(cauticsTexture, pos.xz * 0.5 + 0.5) * 0.5;\
							}\
							vec4 intersectWall(vec3 center, vec3 ray, vec3 minPoint, vec3 maxPoint) {\
								vec4 color;\
								vec3 tMin = (minPoint - center) / ray;\
								vec3 tMax = (maxPoint - center) / ray;\
								vec3 bMax = max(tMin, tMax);\
								float b = min(min(bMax.x, bMax.y), bMax.z);\
								vec3 pos = ray * b + center;\
								if (abs(pos.x) > 0.999) color = texture2D(wallTexture, pos.yz * 0.5 + 0.5);\
								else if (abs(pos.z) > 0.999) color = texture2D(wallTexture, pos.yx * 0.5 + 0.5);\
								else if (pos.y > 0.999) color = texture2D(skyTexture, pos.xz * 0.5 + 0.5);\
								else {\
									color = texture2D(wallTexture, pos.xz * 0.5 + 0.5) * 0.5 + texture2D(cauticsTexture, pos.xz * 0.5 + 0.5) * 0.5;\
									vec4 shadow = intersectObject(pos, vec3(0, 1, 0), object4, vLevel[3]);\
									if (shadow.a > 0.0) return vec4(0.0, 0.0, 0.0, 1.0) * 0.5 + color * 0.5;\
									shadow = intersectObject(pos, vec3(0, 1, 0), object3, vLevel[2]);\
									if (shadow.a > 0.0) return vec4(0.0, 0.0, 0.0, 1.0) * 0.5 + color * 0.5;\
									shadow = intersectObject(pos, vec3(0, 1, 0), object2, vLevel[1]);\
									if (shadow.a > 0.0) return vec4(0.0, 0.0, 0.0, 1.0) * 0.5 + color * 0.5;\
									shadow = intersectObject(pos, vec3(0, 1, 0), object1, vLevel[0]);\
									if (shadow.a > 0.0) return vec4(0.0, 0.0, 0.0, 1.0) * 0.5 + color * 0.5;\
									shadow = intersectObject(pos, vec3(0, 1, 0), boatTexture, 0.0);\
									if (shadow.a > 0.0) return vec4(0.0, 0.0, 0.0, 1.0) * 0.5 + color * 0.5;\
								}\
								return color;\
							}\
							vec4 rayTrace(vec3 center, vec3 ray) {\
								vec4 info = intersectObject(center, ray, object1, vLevel[0]);\
								if (info.a > 0.0) return info;\
								info = intersectObject(center, ray, object2, vLevel[1]);\
								if (info.a > 0.0) return info;\
								info = intersectObject(center, ray, object3, vLevel[2]);\
								if (info.a > 0.0) return info;\
								info = intersectObject(center, ray, object4, vLevel[3]);\
								if (info.a > 0.0) return info;\
								return intersectWall(center, ray, vec3(-1.0, -1.0, -1.0), vec3(1.0, 1.0, 1.0));\
							}\
							\
							void main(){\
								vec4 base;\
								vec4 u = texture2D(waterTexture, vPos.xz * 0.5 + 0.5);\
								vec3 normal = vec3(u.b, sqrt(1.0 - dot(u.ba, u.ba)), u.a);\
								vec3 incomingRay = normalize((vPos - eye).xyz);\
								vec3 refractedRay = refract(incomingRay, normal, 1.333 / 1.0);\
								if (all(equal(refractedRay, vec3(0.0, 0.0, 0.0)))) {\
									vec3 reflectedRay = reflect(incomingRay, normal);\
									base = intersectWall(vPos.xyz, reflectedRay, vec3(-1.0, -1.0, -1.0), vec3(1.0, 1.0, 1.0));\
								}\
								else base = rayTrace(vPos.xyz, refractedRay);\
								gl_FragColor = base * vec4(0.8, 1.0, 1.1, 1);\
							}\
							');
	gl.compileShader(fRenderShader);
	if (!gl.getShaderParameter(fRenderShader, gl.COMPILE_STATUS)) {
		console.log('fragment compile error: ' + gl.getShaderInfoLog(fRenderShader));
	}
	this.renderProgram = gl.createProgram();
	gl.attachShader(this.renderProgram, vRenderShader);
	gl.attachShader(this.renderProgram, fRenderShader);
	gl.linkProgram(this.renderProgram);
	if (!gl.getProgramParameter(this.renderProgram, gl.LINK_STATUS)) {
		console.log("Program link error: " + gl.getProgramInfoLog(this.renderProgram));
	}
	this.modelLoc = gl.getUniformLocation(this.renderProgram, "modelViewMatrix");
	this.projLoc = gl.getUniformLocation(this.renderProgram, "projectionMatrix");
	this.eyeLoc = gl.getUniformLocation(this.renderProgram, "eye");
	this.levLoc = gl.getUniformLocation(this.renderProgram, "vLevel");




	// Methods
	this.render = function() {
		gl.useProgram(this.renderProgram);
		gl.uniformMatrix4fv(this.modelLoc, false, flatten(camera.transformation));
  		gl.uniformMatrix4fv(this.projLoc, false, flatten(projection));
  		gl.uniform4fv(this.eyeLoc, vec4(camera.position, 1.0));
  		gl.uniform1i(gl.getUniformLocation(this.renderProgram, "waterTexture"), 0);
  		gl.uniform1i(gl.getUniformLocation(this.renderProgram, "wallTexture"), 1);
  		gl.uniform1i(gl.getUniformLocation(this.renderProgram, "cauticsTexture"), 2);
  		gl.uniform1i(gl.getUniformLocation(this.renderProgram, "object1"), 3);
  		gl.uniform1i(gl.getUniformLocation(this.renderProgram, "object2"), 4);
  		gl.uniform1i(gl.getUniformLocation(this.renderProgram, "object3"), 5);
  		gl.uniform1i(gl.getUniformLocation(this.renderProgram, "object4"), 6);
  		gl.uniform1i(gl.getUniformLocation(this.renderProgram, "boatTexture"), 7);
  		gl.uniform1i(gl.getUniformLocation(this.renderProgram, "skyTexture"), 8);

  		var texList = [{ref: 0, level: submarine1.level},
  					   {ref: 1, level: submarine2.level},
  					   {ref: 2, level: bomb1.level},
  					   {ref: 3, level: bomb2.level}];
  		texList.sort(function(a, b) {return b.level - a.level});

  		gl.uniform4fv(this.levLoc, new Float32Array([texList[0].level, texList[1].level, texList[2].level, texList[3].level]));

  		var posLoc = gl.getAttribLocation(this.renderProgram, "position");
  		gl.bindBuffer(gl.ARRAY_BUFFER, this.waterMeshBuffer);
  		gl.enableVertexAttribArray(posLoc);
  		gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);

  		this.textureA.bind(0);
  		wall.wallTexture.bind(1);
  		this.cauticsTexture.bind(2);
  		for (var i = 0; i < texList.length; i++) {
  			if (texList[i].ref == 0) submarine1.posTexture.bind(i + 3);
  			if (texList[i].ref == 1) submarine2.posTexture.bind(i + 3);
  			if (texList[i].ref == 2) bomb1.posTexture.bind(i + 3);
  			if (texList[i].ref == 3) bomb2.posTexture.bind(i + 3);
  		}

  		boat.posTexture.bind(7);
  		sky.bind(8);


  		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);

		gl.drawArrays(gl.TRIANGLES, 0, this.waterMeshArray.length);

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
	}
	this.simulation = function() {
		gl.useProgram(this.updateProgram);
		gl.uniform1f(this.dxLoc, 1 / this.width);
		
		var this_ = this; 
		this.textureB.drawTo(function() {
			this_.textureA.bind();
			var posLoc = gl.getAttribLocation(this_.updateProgram, "position");
			gl.bindBuffer(gl.ARRAY_BUFFER, this_.vertexBuffer);
			
			gl.enableVertexAttribArray(posLoc);
			gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, this_.vertexArray.length);
		});
		this.textureB.swapWith(this.textureA);
	}
	this.updateNormal = function() {
		gl.useProgram(this.normalProgram);
		gl.uniform1f(this.nDxLoc, 1 / this.width);

		var this_ = this;
		this.textureB.drawTo(function() {
			this_.textureA.bind();
			var posLoc = gl.getAttribLocation(this_.normalProgram, "position");
			gl.bindBuffer(gl.ARRAY_BUFFER, this_.vertexBuffer);

			gl.enableVertexAttribArray(posLoc);
			gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, this_.vertexArray.length);
		});
		this.textureB.swapWith(this.textureA);
	}
	this.updateCautics = function() {
		gl.useProgram(this.cauticsProgram);
		gl.uniform3fv(this.lightLoc, vec3(0.5, 0.5, 0.5));

		var this_ = this;
		this.cauticsTexture.drawTo(function() {
			this_.textureA.bind();
			var posLoc = gl.getAttribLocation(this_.normalProgram, "position");
			gl.bindBuffer(gl.ARRAY_BUFFER, this_.vertexBuffer);

			gl.enableVertexAttribArray(posLoc);
			gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, this_.vertexArray.length);
		});
	}
	this.force = function(center, strength, radius) {
		gl.useProgram(this.forceProgram);
		gl.uniform1f(this.radLoc, radius);
		gl.uniform1f(this.streLoc, strength);
		gl.uniform2fv(this.cenLoc, center);

		var this_ = this;
		this.textureB.drawTo(function() {
			this_.textureA.bind();
			var posLoc = gl.getAttribLocation(this_.updateProgram, "position");
			gl.bindBuffer(gl.ARRAY_BUFFER, this_.vertexBuffer);

			gl.enableVertexAttribArray(posLoc);
			gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, this_.vertexArray.length);
		});
		this.textureB.swapWith(this.textureA);
	}
}



function Wall(width, height) {
	// Properties
	this.wallArray = [vec4(-1, -1,  1, 1),
				 	  vec4(-1,  1,  1, 1),
				 	  vec4( 1,  1,  1, 1),
				 	  vec4(-1, -1,  1, 1),
				 	  vec4( 1,  1,  1, 1),
				 	  vec4( 1, -1,  1, 1),
				 	  vec4( 1, -1,  1, 1),
				 	  vec4( 1,  1,  1, 1),
				 	  vec4( 1,  1, -1, 1),
				 	  vec4( 1, -1,  1, 1),
				 	  vec4( 1,  1, -1, 1),
				 	  vec4( 1, -1, -1, 1),
				 	  vec4( 1, -1, -1, 1),
				 	  vec4( 1,  1, -1, 1),
				 	  vec4(-1, -1, -1, 1),
				 	  vec4(-1, -1, -1, 1),
				 	  vec4( 1,  1, -1, 1),
				 	  vec4(-1,  1, -1, 1),
				 	  vec4(-1, -1, -1, 1),
				 	  vec4(-1,  1, -1, 1),
				 	  vec4(-1, -1,  1, 1),
				 	  vec4(-1, -1,  1, 1),
				 	  vec4(-1,  1, -1, 1),
				 	  vec4(-1,  1,  1, 1),
				 	  vec4(-1, -1,  1, 1),
				 	  vec4( 1, -1, -1, 1),
				 	  vec4(-1, -1, -1, 1),
				 	  vec4( 1, -1,  1, 1),
				 	  vec4( 1, -1, -1, 1),
				 	  vec4(-1, -1,  1, 1)];
	this.coord = [vec2(0, 0),
				  vec2(0, 1),
				  vec2(1, 1),
				  vec2(0, 0),
				  vec2(1, 1),
				  vec2(1, 0),
				  vec2(0, 0),
				  vec2(0, 1),
				  vec2(1, 1),
				  vec2(0, 0),
				  vec2(1, 1),
				  vec2(1, 0),
				  vec2(0, 0),
				  vec2(0, 1),
				  vec2(1, 0),
				  vec2(1, 0),
				  vec2(0, 1),
				  vec2(1, 1),
				  vec2(0, 0),
				  vec2(0, 1),
				  vec2(1, 0),
				  vec2(1, 0),
				  vec2(0, 1),
				  vec2(1, 1),
				  vec2(0, 0),
				  vec2(1, 1),
				  vec2(0, 1),
				  vec2(1, 0),
				  vec2(1, 1),
				  vec2(0, 0)];
	this.wallBuffer = gl.createBuffer();
	this.coordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.wallBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.wallArray), gl.STATIC_DRAW);
  	gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.coord), gl.STATIC_DRAW);

	this.wallTexture = new Texture(width, height, {type: gl.UNSIGNED_BYTE, filter: gl.LINEAR, wrap: gl.REPEAT});
	this.wallTexture.loadImage("wall");

	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, '\
					attribute vec4 position;\
					attribute vec2 coord;\
					uniform mat4 modelViewMatrix;\
					uniform mat4 projectionMatrix;\
					varying vec3 vPos;\
					varying vec2 wall;\
					\
					void main() {\
						wall = coord;\
						vPos = position.xyz;\
						gl_Position = projectionMatrix * modelViewMatrix * position;\
					}\
					');
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.log('vertex compile error: ' + gl.getShaderInfoLog(vertexShader));
	}
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, '\
					precision highp float;\
					uniform sampler2D waterTexture;\
					uniform sampler2D wallTexture;\
					uniform sampler2D cauticsTexture;\
					uniform sampler2D object1;\
					uniform sampler2D object2;\
					uniform sampler2D boatTexture;\
					varying vec3 vPos;\
					varying vec2 wall;\
					\
					vec4 intersectObject(vec3 center, sampler2D texture) {\
						vec4 info = texture2D(texture, center.xz * 0.5 + 0.5);\
						if (info.r == 0.0 && info.g == 0.0 && info.b == 0.0) return vec4(0.0, 0.0, 0.0, 0.0);\
						else return info;\
					}\
					void main() {\
						vec4 base = texture2D(wallTexture, wall);\
						vec4 cautics = texture2D(cauticsTexture, vPos.xz * 0.5 + 0.5);\
						vec4 u = texture2D(waterTexture, vPos.xz * 0.5 + 0.5);\
						if (u.r > vPos.y) {\
							base *= vec4(0.4, 0.9, 1.0, 1.0);\
						}\
						if (vPos.y < -0.999) {\
							base = base * 0.5 + cautics * 0.5;\
							vec4 shadow = intersectObject(vPos, object1);\
							if (shadow.a > 0.0) base = base * 0.5 + vec4(0.0, 0.0, 0.0, 1.0) * 0.5;\
							else {\
								shadow = intersectObject(vPos, object2);\
								if (shadow.a > 0.0) base = base * 0.5 + vec4(0.0, 0.0, 0.0, 1.0) * 0.5;\
								else {\
									shadow = intersectObject(vPos, boatTexture);\
									if (shadow.a > 0.0) base = base * 0.5 + vec4(0.0, 0.0, 0.0, 1.0) * 0.5;\
								}\
							}\
						}\
						gl_FragColor = base;\
					}\
					');
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.log('fragment compile error: ' + gl.getShaderInfoLog(fragmentShader));
	}
	this.program = gl.createProgram();
	gl.attachShader(this.program, vertexShader);
	gl.attachShader(this.program, fragmentShader);
	gl.linkProgram(this.program);
	if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
		console.log("Program link error: " + gl.getProgramInfoLog(this.program));
	}
	this.modelLoc = gl.getUniformLocation(this.program, "modelViewMatrix");
	this.projLoc = gl.getUniformLocation(this.program, "projectionMatrix");


	// Methods
	this.render = function() {
		gl.useProgram(this.program);
		gl.uniformMatrix4fv(this.modelLoc, false, flatten(camera.transformation));
  		gl.uniformMatrix4fv(this.projLoc, false, flatten(projection));
  		gl.uniform1i(gl.getUniformLocation(this.program, "waterTexture"), 0);
  		gl.uniform1i(gl.getUniformLocation(this.program, "wallTexture"), 1);
  		gl.uniform1i(gl.getUniformLocation(this.program, "cauticsTexture"), 2);
  		gl.uniform1i(gl.getUniformLocation(this.program, "object1"), 3);
  		gl.uniform1i(gl.getUniformLocation(this.program, "object2"), 4);
  		gl.uniform1i(gl.getUniformLocation(this.program, "boatTexture"), 5);

  		var posLoc = gl.getAttribLocation(this.program, "position");
  		var cordLoc = gl.getAttribLocation(this.program, "coord");
  		gl.bindBuffer(gl.ARRAY_BUFFER, this.wallBuffer);
  		gl.enableVertexAttribArray(posLoc);
  		gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);

  		gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
  		gl.enableVertexAttribArray(cordLoc);
  		gl.vertexAttribPointer(cordLoc, 2, gl.FLOAT, false, 0, 0);

  		water.textureA.bind(0);
  		this.wallTexture.bind(1);
  		water.cauticsTexture.bind(2);
  		submarine1.posTexture.bind(3);
  		submarine2.posTexture.bind(4);
  		boat.posTexture.bind(5);

  		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		gl.drawArrays(gl.TRIANGLES, 0, this.coord.length);

		gl.disable(gl.CULL_FACE);
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
	}
}


function Fire(width, height)
{
this.numParticlesExplosion = 600;
this.numParticlesFire = 600;
this.particleLife = [];
this.xyzCoord = [], this.colors = [];
this.pLifeBuffer;
this.xyzCoordBuffer;
this.pColorBuffer;
this.particleLifeLoc;
this.xyzCoordLoc;
this.colorsLoc;
this.timeLoc;
this.pointSizeLoc;
this.particleTypeLoc;
this.startTime;
this.ini = true;
this.frameCounter = 0;
this.counter = 0;
this.mvMatrix = mat4();

	this.fireTexture = new Texture(width, height, {type: gl.UNSIGNED_BYTE, filter: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE});
	this.fireTexture.loadImage("fire");

	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, '\
				  precision mediump int;\
		          uniform int particleType;\
		          attribute float particleLife;\
		          attribute vec3 xyzCoord;\
		          attribute vec2 vColor;\
		          uniform float time;\
		          uniform float pointSize;\
		          varying float vLifetime;\
		          varying vec2 fColor;\
		          uniform mat4 modelViewMatrix;\
		          void main(void) {\
		            float ti = 0.0;\
		            if(particleType == 0)\
		            {\
		              vLifetime = particleLife - time;\
		              ti = 1.0 - vLifetime/particleLife;\
		              gl_Position = modelViewMatrix * vec4(time * xyzCoord[0], time * xyzCoord[1], time * xyzCoord[2], 1.0);\
		            }\
		            if(particleType == 1)\
		            {\
		              vLifetime = mod(time, particleLife);\
		              ti = 1.0 - vLifetime/particleLife;\
		              gl_Position = modelViewMatrix * vec4(xyzCoord[0] * ti, xyzCoord[1] * vLifetime - 1.0, xyzCoord[2] * ti, 1.0);\
		            }\
		            vLifetime = 4.0 * ti * (1.0 - ti);\
		            fColor = vColor;\
		            gl_PointSize = pointSize;\
		          }\
					');
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.log('vertex compile error: ' + gl.getShaderInfoLog(vertexShader));
	}
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, '\
					precision mediump float;\
          			uniform sampler2D sTexture;\
		          	varying vec2 fColor;\
		          	varying float vLifetime;\
		          	void main(void) {\
            		vec4 texColor = texture2D(sTexture, gl_PointCoord);\
            		gl_FragColor = vec4(fColor, 0., 1.) * texColor;\
            		gl_FragColor.a = vLifetime;\
          			}\
					');
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.log('fragment compile error: ' + gl.getShaderInfoLog(fragmentShader));
	}
	this.program = gl.createProgram();
	gl.attachShader(this.program, vertexShader);
	gl.attachShader(this.program, fragmentShader);
	gl.linkProgram(this.program);
	if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
		console.log("Program link error: " + gl.getProgramInfoLog(this.program));
	}
	

   for (var i=0; i < this.numParticlesExplosion; i++)  
   {
        this.particleLife.push( Math.random()  );
        this.xyzCoord.push( 10*(Math.random()-0.5));
        this.xyzCoord.push( 10*(Math.random()-0.5));
        this.xyzCoord.push( 10*(Math.random()-0.5));
        this.colors.push( Math.random() );  this.colors.push( .2*Math.random() );
   }
   for (var i=0; i < this.numParticlesFire; i++)  
   {
        this.particleLife.push( 2*Math.random() + 1 );
        this.xyzCoord.push( 4*(Math.random() - .5) );
        this.xyzCoord.push( 4*Math.random() );
        this.xyzCoord.push( 4*(Math.random() - .5) );
        this.colors.push( Math.random() );  this.colors.push( .2*Math.random() );
   }

   this.particleTypeLoc = gl.getUniformLocation(this.program, "particleType");

   this.particleLifeLoc = gl.getAttribLocation(this.program, "particleLife");
   gl.enableVertexAttribArray( this.particleLifeLoc );
   this.pLifeBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, this.pLifeBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.particleLife), gl.STATIC_DRAW);
   gl.vertexAttribPointer( this.particleLifeLoc, 1, gl.FLOAT, false, 0, 0);

   this.xyzCoordLoc = gl.getAttribLocation(this.program, "xyzCoord");
   gl.enableVertexAttribArray( this.xyzCoordLoc );
   this.xyzCoordBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, this.xyzCoordBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.xyzCoord), gl.STATIC_DRAW);
   gl.vertexAttribPointer( this.xyzCoordLoc, 3, gl.FLOAT, false, 0, 0);

   this.colorsLoc = gl.getAttribLocation(this.program, "vColor");
   gl.enableVertexAttribArray( this.colorsLoc );
   this.pColorBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, this.pColorBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
   gl.vertexAttribPointer( this.colorsLoc, 2, gl.FLOAT, false, 0, 0);

   this.startTime = new Date().getTime();
   gl.uniform1i( gl.getUniformLocation(this.program, "sTexture"), 0);
   this.timeLoc = gl.getUniformLocation(this.program, "time");
   this.pointSizeLoc = gl.getUniformLocation(this.program, "pointSize");

   this.render = function()
   {
   	   	if(this.ini)
   		{
   			this.startTime = new Date().getTime();
   			this.ini = false;
   			// oldProjection = mult(mat4(), projection);
   		}

   	    gl.useProgram( this.program );
	     // gl.disable(gl.DEPTH_TEST);
	     
	    gl.enable(gl.BLEND);
	    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
	    gl.depthMask( false );
	    var endTime = new Date().getTime();
	    endTime = (endTime - this.startTime)/1000;
		gl.uniform1f(this.timeLoc, endTime );

	    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "modelViewMatrix"), false, flatten(this.mvMatrix));

	    gl.bindBuffer(gl.ARRAY_BUFFER, this.pLifeBuffer);
	    gl.vertexAttribPointer( this.particleLifeLoc, 1, gl.FLOAT, false, 0, 0);

	    gl.bindBuffer(gl.ARRAY_BUFFER, this.xyzCoordBuffer);
	    gl.vertexAttribPointer( this.xyzCoordLoc, 3, gl.FLOAT, false, 0, 0);

	    gl.bindBuffer(gl.ARRAY_BUFFER, this.pColorBuffer);
	    gl.vertexAttribPointer( this.colorsLoc, 2, gl.FLOAT, false, 0, 0);

	    this.fireTexture.bind(0);


	    this.frameCounter++;
	    if(this.frameCounter <= 24)	//shake for this many frames
	    {
	    	gl.uniform1i(this.particleTypeLoc, 0);
	    	gl.uniform1f( this.pointSizeLoc, 30);
        	gl.drawArrays(gl.POINTS, 0, this.numParticlesExplosion);	//draw explosion first

	        if(this.counter == 0)
	        {
	            projection = mult(projection, rotate(-2, vec3(0,0,1)));
	            this.counter--;
	        }
	        else
	        {
	            projection = mult(projection, rotate(2, vec3(0,0,1)));
	            this.counter++;
	        }

	    }
	    if(this.frameCounter > 24)
	    {
	    	// projection = mult(mat4(), oldProjection);	//no need for this
	    	gl.uniform1i(this.particleTypeLoc, 1);
	    	gl.uniform1f( this.pointSizeLoc, 10);
        	gl.drawArrays(gl.POINTS, this.numParticlesExplosion, this.numParticlesFire);	//draw fire 
	    }
	    
	    // gl.flush ();
	    gl.depthMask( true );   
	    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	    gl.disable(gl.BLEND); 
	    // gl.enable(gl.DEPTH_TEST);
   }
}

var gl;
var water;
var fire;
var wall;

var submarine1;
var submarine2;

var bomb1;
var bomb2;

var boat;

var sky;

var resetCache = [];


var camera = new Camera();
var eyeAngle = 60;
var eyeYaw = 0;
var projection = perspective(1.0, 4.0, 1.5, -1.5, -1.5, 1.5);


function start() {

	var canvas = document.getElementById("glcanvas");
	gl = initWebGL(canvas);

	water = new Water(canvas.width, canvas.height, 10);
	fire = new Fire(canvas.width, canvas.height);
	wall = new Wall(canvas.width, canvas.height);

	model_init();
	loadModel(bombModel);       
    loadModel(submarineModel);  
    loadModel(boatModel);

    boat = new GameObject(Enum.BOAT, canvas.width, canvas.height);

    var paperTexture = new Texture(canvas.width, canvas.height, {type: gl.UNSIGNED_BYTE, wrap: gl.REPEAT});
    paperTexture.loadImage("paper");

    var baseMatrix = mat4();
    baseMatrix = mult(translate(0.0, -49.95210158638656, 2.7553300857543945), baseMatrix);
    baseMatrix = mult(scale(0.0025,0.003000780167646537,0.006901625690589735), baseMatrix);
    baseMatrix = mult(rotate(90, [0, 0, 1]), baseMatrix);
    baseMatrix = mult(rotate(90, [-1, 0, 0]), baseMatrix);

    boat.setProperties(baseMatrix, paperTexture);
    boat.translation(0.0, 0.05, 0.0);
	
	

	submarine1 = new GameObject(Enum.SUBMARINE, canvas.width, canvas.height);
	submarine2 = new GameObject(Enum.SUBMARINE, canvas.width, canvas.height);
	
	var submarineTexture = new Texture(canvas.width, canvas.height, {type: gl.UNSIGNED_BYTE});
	submarineTexture.loadImage("metal");
	baseMatrix = mat4();
	baseMatrix = mult(translate(-115.45578002929688, -103.66910552978516, -17.699554443359375), baseMatrix);
    baseMatrix = mult(scale(0.0002971746551349857,0.0003352827801192189,0.0003920978780071597), baseMatrix);

    objWrdMatrix = mult(rotate(90, [0, 1, 0]), baseMatrix);
    submarine1.setProperties(objWrdMatrix, submarineTexture);
    submarine1.translation(0.0, -0.4, 0.0);

    submarine2.setProperties(baseMatrix, submarineTexture);
    submarine2.translation(-0.5, -0.7, 0.0);



    bomb1 = new GameObject(Enum.BOMB, canvas.width, canvas.height);
    bomb2 = new GameObject(Enum.BOMB, canvas.width, canvas.height);

    var bombTexture = new Texture(canvas.width, canvas.height, {type: gl.UNSIGNED_BYTE});
    bombTexture.loadImage("bomb");
    baseMatrix = mat4();
    baseMatrix = mult(translate(0.0, -5.385089874267578, 0.028937935829162598), baseMatrix);
    baseMatrix = mult(scale(0.007550017717134805,0.011141875326298161,0.007633404388552707), baseMatrix);
    baseMatrix = mult(rotate(180, [0, 0, 1]), baseMatrix);//////////////////^^^

    resetCache.push(baseMatrix);

    bomb1.setProperties(baseMatrix, bombTexture);
    bomb1.translation(0.0, -0.4, 0.0);

    resetCache.push(baseMatrix);

    bomb2.setProperties(baseMatrix, bombTexture);
    bomb2.translation(-0.5, -0.7, 0.0);

    sky = new Texture(canvas.width, canvas.height, {type: gl.UNSIGNED_BYTE});
    sky.loadImage("sky");

  	camera.transformation = lookAt(vec3(0, Math.sqrt(3), 1), vec3(0, 0, 0), vec3(0, 1, -Math.sqrt(3)));
  	camera.position = vec3(0, Math.sqrt(3), 1);

	//water.force([0, 0], 0.1, 0.1);
	water.updateNormal();
	water.updateCautics();

	setTimeout(function(){
		if(isAlive)
			document.getElementById("instruction").innerHTML = "Only 45 more seconds. <br /><br /><br />\
			 Press A to activate your superpower!";
	}, 15000);
	setTimeout(function(){
		if(isAlive)
		{
			document.getElementById("instruction").innerHTML = "You saved the crew!<br /><br /><br /><br /><br /><br /><br />\
			(...but it would be more thrilling if you hadn't run in circles.)";
			won = true;
		}
	}, 60000);
	beginGame = new Date().getTime();
	

////////////////////////////////////////////////////////////////////////////
///////////////////Fps counter
////////////////////////////////////////////////////////////////////////////

// var stats = new Stats();
// stats.setMode(0); // 0: fps, 1: ms

// // align top-left
// stats.domElement.style.position = 'absolute';
// stats.domElement.style.left = '0px';
// stats.domElement.style.top = '0px';

// document.body.appendChild( stats.domElement );

// var update = function () {

//     stats.begin();

//     // monitored code goes here

//     stats.end();

//     requestAnimationFrame( update );

// };

// requestAnimationFrame( update );

//////////////////////////////////////////////////////////////////////////////////

	render();
}

function initWebGL(canvas) {
	var gl = null;

	// assign the canvas with the context of WebGL and check whether the browser supports it
	try {
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	}
	catch(e) {}

	if (!gl) {
		alert("Unable to initialize WebGL. Your browser may not support it.");
		gl = null;
	}
	return gl;
}

function render()
{
	setTimeout(function() {
		window.requestAnimationFrame(render);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		wall.render();

		gl.useProgram(MODEL_renderProgram);
	if(!stop) submarine1.updatePos();
	if(!stop) submarine2.updatePos();

	if (!stop) boat.updatePos();

	if(!stop) if (bomb1.emited) bomb1.updatePos();
	if(!stop) if (bomb2.emited) bomb2.updatePos();

		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);

		submarine1.render(projection, camera.transformation, vec4(camera.position, 1.0), false);
		submarine2.render(projection, camera.transformation, vec4(camera.position, 1.0), false);

		if (bomb1.emited) bomb1.render(projection, camera.transformation, vec4(camera.position, 1.0), (bomb1.level > 0));
		if (bomb2.emited) bomb2.render(projection, camera.transformation, vec4(camera.position, 1.0), (bomb2.level > 0));

		boat.render(projection, camera.transformation, vec4(camera.position, 1.0), true);

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);

		water.render();

		if(setBoatOnFire)
		{
			var baseMatrix = mat4();
			baseMatrix = mult(translate(0.0, 0.04, 0.0), baseMatrix);
			baseMatrix = mult(translate(boat.center[0], boat.center[1], boat.center[2]), baseMatrix);
			baseMatrix = mult(camera.transformation, baseMatrix);
			baseMatrix = mult(projection, baseMatrix);
			fire.mvMatrix = mult(baseMatrix, scale(0.05,0.04,0.05));
				
			fire.render();
		}
		
		water.simulation();
		water.updateNormal();
		water.updateCautics();


	if(!stop)	if (!submarine1.turning) submarine1.translation(0.0, 0.0, -ENENMY_SPEED * submarine1.dir);
	if(!stop)	if (submarine1.turning) {
			var temp = submarine1.center;
			submarine1.translation(-temp[0], -temp[1], -temp[2]);
			submarine1.rotation(ROTATE_SPEED);
			submarine1.orientation = (submarine1.orientation + ROTATE_SPEED) % 360;
			submarine1.translation( temp[0],  temp[1],  temp[2]);
		}
	if(!stop)	if (!submarine2.turning) submarine2.translation(ENENMY_SPEED * submarine2.dir, 0.0, 0.0);
	if(!stop)	if (submarine2.turning) {
			var temp = submarine2.center;
			submarine2.translation(-temp[0], -temp[1], -temp[2]);
			submarine2.rotation(ROTATE_SPEED);
			submarine2.orientation = (submarine2.orientation + ROTATE_SPEED) % 360;
			submarine2.translation( temp[0],  temp[1],  temp[2]);
		}
	if(!stop)	if (bomb1.emited) bomb1.translation(bomb1.dir[0], ENENMY_SPEED, bomb1.dir[2]);
	if(!stop)	if (bomb2.emited) bomb2.translation(bomb2.dir[0], ENENMY_SPEED, bomb2.dir[2]);
		
		detectInteraction();
	}, 16);
}

function detectInteraction() {
	if (bomb1.level <= 0.001 && bomb1.level >= -0.001) water.force([bomb1.center[0], bomb1.center[2]], 0.03, 0.05);
	if (bomb2.level <= 0.001 && bomb2.level >= -0.001) water.force([bomb2.center[0], bomb2.center[2]], 0.03, 0.05);

	if(isAlive)		//only check if have not lost yet
		bombCollision();

	if (!bomb1.emited && length(subtract(vec2(submarine1.center[0], submarine1.center[2]), vec2(boat.center[0], boat.center[2]))) < ATTACK_DIS) {
		bomb1.emited = true;
		bomb1.mvMatrix = resetCache[0];
		bomb1.center = vec3(0, 0, 0);
		bomb1.level = 0;
		bomb1.mvMatrix = mult(rotate(180, vec3(0,0,1)), bomb1.mvMatrix);
		bomb1.translation(submarine1.center[0], submarine1.center[1], submarine1.center[2]);
		var yDiff = boat.center[1] - submarine1.center[1];
		var ratio = ENENMY_SPEED / yDiff;
		bomb1.dir = vScale(ratio, vec3(boat.center[0]- submarine1.center[0], boat.center[1] - submarine1.center[1], boat.center[2] - submarine1.center[2]));
		
		var dir = vec4(bomb1.dir, 0.0);
		var norm = cross(vec4(0,-1,0,0), dir);
		bomb1.mvMatrix = mult(bomb1.mvMatrix, 
			rotate(90+180 / Math.PI * Math.atan(dir[1] / Math.sqrt(dir[0] * dir[0] + dir[2] * dir[2])), 
				vec3(norm[0], norm[1], norm[2])));

	}
	if (!bomb2.emited && length(subtract(vec2(submarine2.center[0], submarine2.center[2]), vec2(boat.center[0], boat.center[2]))) < ATTACK_DIS) {
		bomb2.emited = true;
		bomb2.mvMatrix = resetCache[1];
		bomb2.center = vec3(0, 0, 0);
		bomb2.level = 0;
		bomb2.mvMatrix = mult(rotate(180, vec3(0,0,1)), bomb2.mvMatrix);
		bomb2.translation(submarine2.center[0], submarine2.center[1], submarine2.center[2]);
		var yDiff = boat.center[1] - submarine2.center[1];
		var ratio = ENENMY_SPEED / yDiff;
		bomb2.dir = vScale(ratio, vec3(boat.center[0]- submarine2.center[0], boat.center[1] - submarine2.center[1], boat.center[2] - submarine2.center[2]));
		
		var dir = vec4(bomb2.dir, 0.0);
		var norm = cross(vec4(0,-1,0,0), dir);
		bomb2.mvMatrix = mult(bomb2.mvMatrix, 
			rotate(90+180 / Math.PI * Math.atan(dir[1] / Math.sqrt(dir[0] * dir[0] + dir[2] * dir[2])), 
				vec3(norm[0], norm[1], norm[2])));

	}

	if (bomb1.level > 1.0) bomb1.emited = false;
	if (bomb2.level > 1.0) bomb2.emited = false;


	if (submarine1.turning && (submarine1.orientation == 180 || submarine1.orientation == 0)) {
		submarine1.turning = false;
		submarine1.dir = Math.cos(radians(submarine1.orientation));
	}
	if (!submarine1.turning && Math.abs(submarine1.center[2] - 0.3 * submarine1.dir) >= 1) submarine1.turning = true;

	if (submarine2.turning && (submarine2.orientation == 180 || submarine2.orientation == 0)) {
		submarine2.turning = false;
		submarine2.dir = Math.cos(radians(submarine2.orientation));
	}
	if (!submarine2.turning && Math.abs(submarine2.center[0] + 0.3 * submarine2.dir) >= 1) submarine2.turning = true;
}

function bombCollision(){
	
	boat.box.transform();

	if(bomb1.emited)
	{
		bomb1.box.transform();
		if(bomb1.collide(boat))
		{
			// stop=true;		//uncomment this to manually check for collision, key 'A' to start animation again
			
			bomb1.emited = false;
			setBoatOnFire = true;
			isAlive = false;
			if(!won)
				document.getElementById("instruction").innerHTML = "You lost.<br /> \
			Refresh to try again.";
		}
	}
	if(bomb2.emited)
	{
		bomb2.box.transform();
		if(bomb2.collide(boat))
		{
			// stop=true;		//uncomment this to manually check for collision, key 'A' to start animation again
			
			bomb2.emited = false;
			setBoatOnFire = true;
			isAlive = false;
			if(!won)
				document.getElementById("instruction").innerHTML = "A sneaky missile hit your boat.<br />\
				 Revenge is not good, but FYI, it's the bottom submarine.";
		}
	}
}

function boatCollision(direction) {
	var t1 = mult(subtract(vec2(-1, -1), vec2(boat.center[0] + direction * 0.15 * boat.dir[0], boat.center[2] + direction * 0.15 * boat.dir[2])), vec2(direction * 1 / boat.dir[0], direction * 1 / boat.dir[2]));
	var t2 = mult(subtract(vec2( 1,  1), vec2(boat.center[0] + direction * 0.15 * boat.dir[0], boat.center[2] + direction * 0.15 * boat.dir[2])), vec2(direction * 1 / boat.dir[0], direction * 1 / boat.dir[2]));
	var tMax = vec2(Math.max(t1[0], t2[0]), Math.max(t1[1], t2[1]));
	return Math.min(tMax[0], tMax[1]) < USER_SPEED;
}

function handleKey(event) {
	var key = event.keyCode;

	if (key == 38 && !boatCollision(1)) {	// UP
		boat.translation(boat.dir[0] * USER_SPEED, boat.dir[1] * USER_SPEED, boat.dir[2] * USER_SPEED);
		water.force([boat.center[0] - 0.05 * boat.dir[0], boat.center[2] - 0.05 * boat.dir[2]], 0.01, 0.01);
	}
	if (key == 39 && !boatCollision(1)) {	// RIGHT
		var temC = boat.center;
		var temD = boat.dir;
		var temR = boat.right;
		boat.translation(-temC[0] + 0.1 * temD[0] - CURVATURE * temR[0], -temC[1] + 0.1 * temD[1] - CURVATURE * temR[1], -temC[2] + 0.1 * temD[2] - CURVATURE * temR[2]);
		
		boat.rotation(-ROTATE_SPEED);
		var extCenter = vec4(boat.center, 1.0);
		extCenter = vMult(rotate(-ROTATE_SPEED, [0, 1, 0]), extCenter);
		boat.center = vec3(extCenter[0], extCenter[1], extCenter[2]);
		boat.dir = vMult(rotate(-ROTATE_SPEED, [0, 1, 0]), boat.dir);
		boat.right = vMult(rotate(-ROTATE_SPEED, [0, 1, 0]), boat.right);
		
		boat.translation( temC[0] - 0.1 * temD[0] + CURVATURE * temR[0],  temC[1] - 0.1 * temD[1] + CURVATURE * temR[1],  temC[2] - 0.1 * temD[2] + CURVATURE * temR[2]);
		water.force([boat.center[0] - 0.05 * boat.dir[0], boat.center[2] - 0.05 * boat.dir[2]], 0.01, 0.01);
	}
	if (key == 37 && !boatCollision(1)) {	// LEFT
		var temC = boat.center;
		var temD = boat.dir;
		var temR = boat.right;
		boat.translation(-temC[0] + 0.1 * temD[0] + CURVATURE * temR[0], -temC[1] + 0.1 * temD[1] + CURVATURE * temR[1], -temC[2] + 0.1 * temD[2] + CURVATURE * temR[2]);
		
		boat.rotation(ROTATE_SPEED);
		var extCenter = vec4(boat.center, 1.0);
		extCenter = vMult(rotate(ROTATE_SPEED, [0, 1, 0]), extCenter);
		boat.center = vec3(extCenter[0], extCenter[1], extCenter[2]);
		boat.dir = vMult(rotate(ROTATE_SPEED, [0, 1, 0]), boat.dir);
		boat.right = vMult(rotate(ROTATE_SPEED, [0, 1, 0]), boat.right);
		
		boat.translation( temC[0] - 0.1 * temD[0] - CURVATURE * temR[0],  temC[1] - 0.1 * temD[1] - CURVATURE * temR[1],  temC[2] - 0.1 * temD[2] - CURVATURE * temR[2]);
		water.force([boat.center[0] - 0.05 * boat.dir[0], boat.center[2] - 0.05 * boat.dir[2]], 0.01, 0.01);
	}
	if (key == 40 && !boatCollision(-1)) {	// DOWN
		boat.translation(-boat.dir[0] * USER_SPEED, -boat.dir[1] * USER_SPEED, -boat.dir[2] * USER_SPEED);
		water.force([boat.center[0] - 0.05 * boat.dir[0], boat.center[2] - 0.05 * boat.dir[2]], 0.01, 0.01);
	}

	// control the camera
	if (key == 87) {	// W
		eyeAngle = (eyeAngle + 3) % 360;
		var eye = vec4(0, 2 * Math.sin(radians(eyeAngle)), 2 * Math.cos(radians(eyeAngle)), 1);
		var top = vec4(0, 2 * Math.cos(radians(eyeAngle)), -2 * Math.sin(radians(eyeAngle)), 0);
		eye = vMult(rotate(eyeYaw, [0, 1, 0]), eye);
		top = vMult(rotate(eyeYaw, [0, 1, 0]), top);
		camera.transformation = lookAt(vec3(eye[0], eye[1], eye[2]), vec3(0, 0, 0), vec3(top[0], top[1], top[2]));
		camera.position = eye;

	}
	if (key == 83) {	// S
		eyeAngle = (eyeAngle - 3) % 360;
		var eye = vec4(0, 2 * Math.sin(radians(eyeAngle)), 2 * Math.cos(radians(eyeAngle)), 1);
		var top = vec4(0, 2 * Math.cos(radians(eyeAngle)), -2 * Math.sin(radians(eyeAngle)), 0);
		eye = vMult(rotate(eyeYaw, [0, 1, 0]), eye);
		top = vMult(rotate(eyeYaw, [0, 1, 0]), top);
		camera.transformation = lookAt(vec3(eye[0], eye[1], eye[2]), vec3(0, 0, 0), vec3(top[0], top[1], top[2]));
		camera.position = eye;
	}
	if (key == 65) {	// A
		eyeYaw = (eyeYaw - 3) % 360;
		var eye = vec4(0, 2 * Math.sin(radians(eyeAngle)), 2 * Math.cos(radians(eyeAngle)), 1);
		var top = vec4(0, 2 * Math.cos(radians(eyeAngle)), -2 * Math.sin(radians(eyeAngle)), 0);
		eye = vMult(rotate(eyeYaw, [0, 1, 0]), eye);
		top = vMult(rotate(eyeYaw, [0, 1, 0]), top);
		camera.transformation = lookAt(vec3(eye[0], eye[1], eye[2]), vec3(0, 0, 0), vec3(top[0], top[1], top[2]));
		camera.position = eye;
	}
	if (key == 68) {	// D
		eyeYaw = (eyeYaw + 3) % 360;
		var eye = vec4(0, 2 * Math.sin(radians(eyeAngle)), 2 * Math.cos(radians(eyeAngle)), 1);
		var top = vec4(0, 2 * Math.cos(radians(eyeAngle)), -2 * Math.sin(radians(eyeAngle)), 0);
		eye = vMult(rotate(eyeYaw, [0, 1, 0]), eye);
		top = vMult(rotate(eyeYaw, [0, 1, 0]), top);
		camera.transformation = lookAt(vec3(eye[0], eye[1], eye[2]), vec3(0, 0, 0), vec3(top[0], top[1], top[2]));
		camera.position = eye;
	}

}