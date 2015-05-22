var canvas;
var gl;
var length = 0.5;
var time = 0.0;
var timer = new Timer();
var omega = 40;

var UNIFORM_mvpMatrix;
var UNIFORM_lightPosition;
var UNIFORM_shininess;
var ATTRIBUTE_position;
var ATTRIBUTE_normal;

var UNIFORM_texScale;

var positionBuffer; 
var normalBuffer;

var myTexture;
var myTexture2;

var viewMatrix;
var projectionMatrix;
var mvpMatrix;

var shininess = 50;
var lightPosition = vec3(0.0, 0.0, 0.0);

var eye = vec3(0, 1.0, 2.0);
var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);

var x_t = -1.0;
var y_t = 0.0;
var z_t = 0.0;

var xRot = 0.0;
var yRot = 0.0;
var xSpeed = 180.0;
var ySpeed = 360.0;
var hold = true;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    vertices = [
        vec3(  length,   length, length ), //vertex 0
        vec3(  length,  -length, length ), //vertex 1
        vec3( -length,   length, length ), //vertex 2
        vec3( -length,  -length, length ),  //vertex 3 
        vec3(  length,   length, -length ), //vertex 4
        vec3(  length,  -length, -length ), //vertex 5
        vec3( -length,   length, -length ), //vertex 6
        vec3( -length,  -length, -length )  //vertex 7   
    ];

    var points = [];
    var normals = [];
    var uv = [];
	var uv2 = [];
    Cube(vertices, points, normals, uv, uv2);

    myTexture = gl.createTexture();
    myTexture.image = new Image();
    myTexture.image.onload = function(){
		gl.bindTexture(gl.TEXTURE_2D, myTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
    }

    myTexture.image.src = "./Images/chrome.jpg";
	
	myTexture2 = gl.createTexture();
    myTexture2.image = new Image();
    myTexture2.image.onload = function(){
		gl.bindTexture(gl.TEXTURE_2D, myTexture2);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture2.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
    }

    myTexture2.image.src = "./Images/chrome.jpg";

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    normalBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    uvBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, uvBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(uv), gl.STATIC_DRAW );
	
	uv2Buffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, uv2Buffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(uv2), gl.STATIC_DRAW );

    ATTRIBUTE_position = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( ATTRIBUTE_position );

    ATTRIBUTE_normal = gl.getAttribLocation( program, "vNormal" );
    gl.enableVertexAttribArray( ATTRIBUTE_normal );

    ATTRIBUTE_uv = gl.getAttribLocation( program, "vUV" );
    gl.enableVertexAttribArray( ATTRIBUTE_uv);
	
	ATTRIBUTE_uv2 = gl.getAttribLocation( program, "vUV2" );
    gl.enableVertexAttribArray( ATTRIBUTE_uv2);

    gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
    gl.vertexAttribPointer( ATTRIBUTE_position, 3, gl.FLOAT, false, 0, 0 );

    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer );
    gl.vertexAttribPointer( ATTRIBUTE_normal, 3, gl.FLOAT, false, 0, 0 );

    gl.bindBuffer( gl.ARRAY_BUFFER, uvBuffer );
    gl.vertexAttribPointer( ATTRIBUTE_uv, 2, gl.FLOAT, false, 0, 0 );
	
	gl.bindBuffer( gl.ARRAY_BUFFER, uv2Buffer );
    gl.vertexAttribPointer( ATTRIBUTE_uv2, 2, gl.FLOAT, false, 0, 0 );

    UNIFORM_mvMatrix = gl.getUniformLocation(program, "mvMatrix");
    UNIFORM_pMatrix = gl.getUniformLocation(program, "pMatrix");
    UNIFORM_lightPosition = gl.getUniformLocation(program, "lightPosition");
    UNIFORM_shininess = gl.getUniformLocation(program, "shininess");
    UNIFORM_sampler = gl.getUniformLocation(program, "uSampler");
	UNIFORM_texScale = gl.getUniformLocation(program, "texScale");

    viewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(90, 1, 0.001, 1000);

    timer.reset();
    gl.enable(gl.DEPTH_TEST);
	
	document.onkeydown = handleKeyDown;

    render();
}

function Cube(vertices, points, normals, uv, uv2){
    Quad(vertices, points, normals, uv, 0, 1, 2, 3, vec3(0, 0, 1), uv2);
    Quad(vertices, points, normals, uv, 4, 0, 6, 2, vec3(0, 1, 0), uv2);
    Quad(vertices, points, normals, uv, 4, 5, 0, 1, vec3(1, 0, 0), uv2);
    Quad(vertices, points, normals, uv, 2, 3, 6, 7, vec3(1, 0, 1), uv2);
    Quad(vertices, points, normals, uv, 6, 7, 4, 5, vec3(0, 1, 1), uv2);
    Quad(vertices, points, normals, uv, 1, 5, 3, 7, vec3(1, 1, 0 ), uv2);
}

function Quad( vertices, points, normals, uv, v1, v2, v3, v4, normal, uv2){

    normals.push(normal);
    normals.push(normal);
    normals.push(normal);
    normals.push(normal);
    normals.push(normal);
    normals.push(normal);

	uv.push(vec2(0,0));
    uv.push(vec2(1,0));
    uv.push(vec2(1,1));
    uv.push(vec2(0,0));
    uv.push(vec2(1,1));
    uv.push(vec2(0,1));
	
    uv2.push(vec2(-0.5,-0.5));
    uv2.push(vec2(1.5,-0.5));
    uv2.push(vec2(1.5,1.5));
    uv2.push(vec2(-0.5,-0.5));
    uv2.push(vec2(1.5,1.5));
    uv2.push(vec2(-0.5,1.5));

    points.push(vertices[v1]);
    points.push(vertices[v3]);
    points.push(vertices[v4]);
    points.push(vertices[v1]);
    points.push(vertices[v4]);
    points.push(vertices[v2]);
}

var currentlyPressedKeys = {};
function handleKeyDown(event) {
	if (event.keyCode == 73) { //'I' Move camera forward
		z_t += 0.1;
	}
	if (event.keyCode == 79) { //'O' Move camera backward
		z_t -= 0.1;
	}
	if (event.keyCode == 74) { //'J' Move camera left (pan)
		x_t += 0.25;
	}
	if (event.keyCode == 75) { //'K' Move camera right (pan)
		x_t -= 0.25;
	}
	if (event.keyCode == 38) { //'UP' Move camera up (pan) 
		y_t -= 0.25;
	}
	if (event.keyCode == 40) { //'DOWN' Move camera down (pan)
		y_t += 0.25;
	}
	if (event.keyCode == 90) { //'Z' Reset camera
		x_t = -1.0;
		y_t = 0.0;
		z_t = 0.0;
	}
	if (event.keyCode == 82) { //'R' Rotate both cubes
		hold = !hold;
	}
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//time += timer.getElapsedTime() / 1000;
	
	if (!hold) {
		time += 0.015;
		xRot = time * xSpeed;
		yRot = time * ySpeed;
	}
	
	mvMatrix = mult(viewMatrix, translate(vec3(x_t, y_t, z_t)));
	mvMatrix = mult(mvMatrix, rotate(yRot, [0, 1, 0]));

    gl.uniformMatrix4fv(UNIFORM_mvMatrix, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(UNIFORM_pMatrix, false, flatten(projectionMatrix));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, myTexture);

    gl.uniform3fv(UNIFORM_lightPosition,  flatten(lightPosition));
    gl.uniform1f(UNIFORM_shininess,  shininess);
    gl.uniform1i(UNIFORM_sampler, 0);
	
	gl.uniform1i(UNIFORM_texScale, true);

    gl.drawArrays( gl.TRIANGLES, 0, 36);
	
	mvMatrix = mult(viewMatrix, translate(vec3(x_t+2.0, y_t, z_t)));
	mvMatrix = mult(mvMatrix, rotate(xRot, [1, 0, 0]));

    gl.uniformMatrix4fv(UNIFORM_mvMatrix, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(UNIFORM_pMatrix, false, flatten(projectionMatrix));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, myTexture2);

    gl.uniform3fv(UNIFORM_lightPosition,  flatten(lightPosition));
    gl.uniform1f(UNIFORM_shininess,  shininess);
    gl.uniform1i(UNIFORM_sampler, 0);
	
	gl.uniform1i(UNIFORM_texScale, false);

    gl.drawArrays( gl.TRIANGLES, 0, 36);

    window.requestAnimFrame( render );
}
