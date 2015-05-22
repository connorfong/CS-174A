
var canvas;
var gl;
var time = 0.0;
var timer = new Timer();

var sunScale = 0.8;
const numSpheres = 5;
const numTimesToSubdivide = [ 5, 1, 2, 5, 4, 3 ];
const sphereVertices = 
	[3 * Math.pow(4, (numTimesToSubdivide[0]+1)),
	3 * Math.pow(4, (numTimesToSubdivide[1]+1)),
	3 * Math.pow(4, (numTimesToSubdivide[2]+1)),
	3 * Math.pow(4, (numTimesToSubdivide[3]+1)),
	3 * Math.pow(4, (numTimesToSubdivide[4]+1)),
	3 * Math.pow(4, (numTimesToSubdivide[5]+1))];
const totalVertices = 3 * (sphereVertices[0] + sphereVertices[1] +
							sphereVertices[2] + sphereVertices[3] +
							sphereVertices[4] + sphereVertices[5]);

var sphereTranslateX = [ 0.0, 2.0, 4.0, 6.0, 9.0, 10.0 ];
var sphereScales = [ sunScale, 0.35, 0.31, 0.60, 0.42, 0.2 ];
var orbitAngles = [ 0.0, 24.0, 53.0, 113.0, 154.0, 154.0 ];
var moonOrbitAngle = 0.0;

var points = [];
var flatNormals = [];
var gouraudNormals = [];
var phongNormals = [];

var modelViewMatrixLoc;
var projectionMatrixLoc;
var finalTranslateLoc;
var sphereScaleLoc;
var sphereTranslateLoc;
var sphereOrbitLoc;
var moonOrbitLoc;

var ambientProductLoc;
var diffuseProductLoc;
var specularProductLoc;
var shininessLoc;

var fovy = 90.0;
var aspect = 1.0;
var near = 1.0;
var far = 100.0;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -20.0;
var right = 20.0;
var ytop = 20.0;
var bottom = -20.0;

var eye;
var at;
var up;
var x_t = 0.0;
var z_t = 14.0;

var navTranslateLoc;
var navRotateLoc;
var translateVector = vec3( 0.0, 0.0, 0.0 );
var navigationUnit = 0.5;
var yawAngleIncrement = 1.0;
var yawAngle = 0.0;
var pitchAngle = 30.0;

var light_position = vec4( 0.0, 0.0, 0.0, 1.0 );

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

var lightAmbient = vec4(0.9, 0.9, 0.9, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var x_trans = 0.0;
var y_trans = 0.0;
var z_trans = 0.0;

// shading
var materialAmbient =
[
	[ sunScale, 0.0, 1-sunScale, 1.0 ],
	[ 0.8, 0.8, 0.8, 1.0 ],
	[ 0.0, 0.2, 0.0, 1.0 ],
	[ 0.0, 0.0, 0.4, 1.0 ],
	[ 0.4, 0.2, 0.0, 1.0 ],
	[ 0.1, 0.1, 0.1, 1.0 ]
];
var materialDiffuse =
[
	[ 0.0, 0.0, 0.0, 1.0 ],
	[ 1.0, 1.0, 1.0, 1.0 ],
	[ 0.0, 0.7, 0.0, 1.0 ],
	[ 0.0, 0.0, 1.0, 1.0 ],
	[ 0.6, 0.3, 0.0, 1.0 ],
	[ 1.0, 1.0, 1.0, 1.0 ]
];
var materialSpecular =
[
	[ 0.0, 0.0, 0.0, 1.0 ],
	[ 0.5, 0.5, 0.5, 1.0 ],
	[ 0.5, 0.5, 0.5, 1.0 ],
	[ 0.5, 0.5, 0.5, 1.0 ],
	[ 0.0, 0.0, 0.0, 1.0 ],
	[ 0.0, 0.0, 0.0, 1.0 ]
];

var materialShininess = [ 50.0, 50.0, 10.0, 50.0, 50.0, 10.0 ];
var sphereShadingType = [ 0, 0, 1, 1, 1, 0];
var usePhong = [ false, false, false, true, true, false ];
var phongShading;

var nBuffer;
var gBUffer;
var vNormal;


function triangle( a, b, c, s )
{
	if (s == 0) {
		var t1 = subtract(b, a);
		var t2 = subtract(c, a);
		var triangleNormal = normalize(cross(t1, t2));
		triangleNormal = vec4(triangleNormal);
		
		flatNormals.push(triangleNormal);
		points.push(a);
		
		flatNormals.push(triangleNormal);
		points.push(b);
		
		flatNormals.push(triangleNormal);
		points.push(c);
	}
	else {
		flatNormals.push(a);
		points.push(a);
		
		flatNormals.push(b);
		points.push(b);
		
		flatNormals.push(c);
		points.push(c);
	}
}

function divideTriangle(a, b, c, count, s) {
    if ( count > 0 ) {
                
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1, s );
        divideTriangle( ab, b, bc, count - 1, s );
        divideTriangle( bc, c, ac, count - 1, s );
        divideTriangle( ab, bc, ac, count - 1, s );
    }
    else { 
        triangle( a, b, c, s );
    }
}


function tetrahedron(a, b, c, d, n, s) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}


window.onload = function init()
{

    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
	
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	// subdivide tetrahedron into a sphere
	for ( var i = 0; i < numSpheres; i++ )
	{
		if (sphereShadingType[i] == 0)
			tetrahedron( va, vb, vc, vd, numTimesToSubdivide[i], 0 );
		else
			tetrahedron( va, vb, vc, vd, numTimesToSubdivide[i], 1 );
	};
	
	nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(flatNormals), gl.STATIC_DRAW );
	
	vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(light_position) );

	projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	finalTranslateLoc = gl.getUniformLocation(program, "finalTranslate");
	sphereScaleLoc = gl.getUniformLocation( program, "sphereScale" );
	sphereTranslateLoc = gl.getUniformLocation( program, "sphereTranslate" );
	sphereOrbitLoc = gl.getUniformLocation( program, "sphereOrbit" );
	moonOrbitLoc = gl.getUniformLocation( program, "moonOrbit" );
	
	ambientProductLoc = gl.getUniformLocation(program, "ambientProduct");
	diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
	specularProductLoc = gl.getUniformLocation(program, "specularProduct");
	shininessLoc = gl.getUniformLocation(program, "shininess");
	
	navRotateLoc = gl.getUniformLocation(program, "navRotate");
	navTranslateLoc = gl.getUniformLocation(program, "navTranslate");
	
	phongShading = gl.getUniformLocation(program, "phongShading");
	
	timer.reset();
	
	document.onkeydown = handleKeyDown;
    
    render();
}

var currentlyPressedKeys = {};
function handleKeyDown(event) {
	if (event.keyCode == 67) { //'C' Change cube colors
		if (index == 7) {index = 0;}
		else {index++;}
		}
	if (event.keyCode == 82) { //'R' Reset camera
		x_t = 0;
		y_t = 14.0 * Math.tan(pitchAngle * Math.PI / 180.0);
		z_t = 14.0;
		x_trans = 0.0;
		y_trans = 0.0;
		z_trans = 0.0;
		aspect = 1.0;
	}
	if (event.keyCode == 73) { //'I' Move camera forward
		x_t -= 0.25*Math.sin(theta);
		z_t -= 0.25*Math.cos(theta);
	}
	if (event.keyCode == 77) { //'M' Move camera backward
		x_t += 0.25*Math.sin(theta);
		z_t += 0.25*Math.cos(theta);
	}
	if (event.keyCode == 74) { //'J' Move camera left (pan)
		x_trans += 0.25;
	}
	if (event.keyCode == 75) { //'K' Move camera right (pan)
		x_trans -= 0.25;
	}
	if (event.keyCode == 38) { //'UP' Move camera up (pan) 
		y_trans -= 0.25;
	}
	if (event.keyCode == 40) { //'DOWN' Move camera down (pan)
		y_trans += 0.25;
	}
	if (event.keyCode == 37) { //'LEFT' Move camera left (strafe)
		x_t += 0.25*Math.sin(theta+90);
		z_t += 0.25*Math.cos(theta+90);
	}
	if (event.keyCode == 39) { //'RIGHT' Move camera right (strafe)
		x_t -= 0.25*Math.sin(theta+90);
		z_t -= 0.25*Math.cos(theta+90);
	}
	if (event.keyCode == 78) { //'N' Narrow view
		aspect += 0.25;
	}
	if (event.keyCode == 87) { //'W' Widen view
		aspect -= 0.25;
	}
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	at = vec3( 0.0, 0.0, 0.0 );
	up = vec3( 0.0, 1.0, 0.0 );
	eye = vec3( x_t, 14.0 * Math.tan(pitchAngle * Math.PI / 180.0), z_t );

	modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(90.0, aspect, near, far);

	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
	
	var offset = 0;
	
	time += timer.getElapsedTime() / 1000;
	
	for ( var i = 0; i < numSpheres; i++ )
	{
		var temp = mat4();
		var ctm = mult(temp, translate(vec3(x_trans, y_trans, z_trans)));
		gl.uniformMatrix4fv(finalTranslateLoc, false, flatten(ctm));
		
		ctm = mult(temp, scale(vec3(sphereScales[i], sphereScales[i], sphereScales[i])));
		gl.uniformMatrix4fv(sphereScaleLoc, false, flatten(ctm));
		
		gl.uniform1i(phongShading, usePhong[i]);
		
		ctm = mult(temp, translate(vec3(sphereTranslateX[i], 0, 0)));
		gl.uniformMatrix4fv(sphereTranslateLoc, false, flatten(ctm));
		
		ctm = mult(temp, rotate(time * orbitAngles[i], [0, 1, 0]));
		gl.uniformMatrix4fv(sphereOrbitLoc, false, flatten(ctm));

		
		var ambientProduct = mult(lightAmbient, materialAmbient[i]);
		var diffuseProduct = mult(lightDiffuse, materialDiffuse[i]);
		var specularProduct = mult(lightSpecular, materialSpecular[i]);
		
		gl.uniform4fv( ambientProductLoc, flatten(ambientProduct) );
		gl.uniform4fv( diffuseProductLoc, flatten(diffuseProduct) );
		gl.uniform4fv( specularProductLoc, flatten(specularProduct) );
		gl.uniform1f( shininessLoc, materialShininess[i] );
		
		ctm = mult(temp, translate(translateVector));
		gl.uniformMatrix4fv(navTranslateLoc, false, flatten(ctm));
		
		gl.drawArrays( gl.TRIANGLES, offset, sphereVertices[i] );
		offset = sphereVertices[i] + offset;
	};
		
    window.requestAnimFrame( render );
}

