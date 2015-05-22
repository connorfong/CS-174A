
var canvas;
var gl;
var length = 0.5;

var x1 = 10.0;
var x2 = -10.0;
var y1 = 10.0;
var y2 = -10.0;
var z1 = 10.0;
var z2 = -10.0;

var modelViewMatrix;

var viewMatrix;
var projectionMatrix;
var p;

var near = 0.3;
var far = 100.0;
var x_t = 0;
var y_t = 0;
var z_t = -30;
var theta = 0;

var  fovy = 90.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect = 1;       // Viewport aspect ratio

var eye;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var points = [];
var colors = [];
var index = 0;

/*var crossHair = [
	vec3(-2.5,0.0,0.0),
	vec3(2.5,0.0,0.0),
	vec3(0.0,-2.5,0.0),
	vec3(0.0,2.5,0.0)
];

var cHair = 0;*/

var vertexColors = [
	[ 0.0, 0.0, 0.0, 1.0 ],  // black
	[ 1.0, 0.0, 0.0, 1.0 ],  // red
	[ 1.0, 1.0, 0.0, 1.0 ],  // yellow
	[ 0.0, 1.0, 0.0, 1.0 ],  // green
	[ 0.0, 0.0, 1.0, 1.0 ],  // blue
	[ 1.0, 0.0, 1.0, 1.0 ],  // magenta
	[ 1.0, 1.0, 1.0, 1.0 ],  // white
	[ 0.0, 1.0, 1.0, 1.0 ]   // cyan
];

window.onload = function init()
{

    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
	
	colorCube();
	/*for (var i = 0; i < 4; ++i) {
		points.push(crossHair[i]);
	}*/

    gl.viewport( 0, 0, canvas.width, canvas.height );
	
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
	
	var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );


    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
	colorUni = gl.getUniformLocation(program, "fColor");
					
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
		index = 0;
		x1 = 10.0;
		x2 = -10.0;
		y1 = 10.0;
		y2 = -10.0;
		z1 = 10.0;
		z2 = -10.0;
		x_t = 0;
		y_t = 0;
		z_t = -30;
		theta = 0;
		aspect = 1;
	}
	if (event.keyCode == 73) { //'I' Move camera forward
		x_t += 0.25*Math.sin(theta);
		z_t += 0.25*Math.cos(theta);
	}
	if (event.keyCode == 77) { //'M' Move camera backward
		x_t -= 0.25*Math.sin(theta);
		z_t -= 0.25*Math.cos(theta);
	}
	if (event.keyCode == 74) { //'J' Move camera left (pan)
		x1 -= 0.25;
		x2 -= 0.25;
	}
	if (event.keyCode == 75) { //'K' Move camera right (pan)
		x1 += 0.25;
		x2 += 0.25;
	}
	if (event.keyCode == 38) { //'UP' Move camera up (pan) 
		y1 -= 0.25;
		y2 -= 0.25;
	}
	if (event.keyCode == 40) { //'DOWN' Move camera down (pan)
		y1 += 0.25;
		y2 += 0.25;
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
	/*if (event.keyCode == 84) { //'T' Display orthogonal crosshairs
		if (cHair == 0) {cHair = 1;}
		else {cHair = 0;}
	}*/
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push( vertexColors[index] );
    }
}

/*function displayCross() {
	//projectionMatrix = ortho(-20.0, 20.0, -20.0, 20.0, 0.5, 500.0);
	projectionMatrix = perspective(fovy, aspect, near, far);
	var temp = mat4();
	temp = mult(temp, projectionMatrix);
	var ctm = mult(temp, viewMatrix);
	ctm = mult(ctm, translate(vec3(0.0, 0.0, 0.0)));
	gl.uniform4fv(colorUni, flatten(vertexColors[0]));
	gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
	gl.drawArrays( gl.LINES, 36, 40 );
}*/

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	eye = vec3(x_t, y_t, z_t);
	
    viewMatrix = lookAt(eye, at, up);
	projectionMatrix = perspective(fovy, aspect, near, far);
	
	var translate_cube1 = vec3(x1, y1, z1);
	var translate_cube2 = vec3(x1, y1, z2);
	var translate_cube3 = vec3(x1, y2, z1);
	var translate_cube4 = vec3(x1, y2, z2);
	var translate_cube5 = vec3(x2, y1, z1);
	var translate_cube6 = vec3(x2, y1, z2);
	var translate_cube7 = vec3(x2, y2, z1);
	var translate_cube8 = vec3(x2, y2, z2);

    var temp = mat4();
    temp = mult(temp, projectionMatrix);
    temp = mult(temp, viewMatrix);
    var ctm = mult(temp, translate(translate_cube1));
	gl.uniform4fv(colorUni, flatten(vertexColors[index%8]));
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, 0, 36 );

    ctm = mult(temp, translate(translate_cube2));
	gl.uniform4fv(colorUni, flatten(vertexColors[(index+1)%8]));
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
	
	ctm = mult(temp, translate(translate_cube3));
	gl.uniform4fv(colorUni, flatten(vertexColors[(index+2)%8]));
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
	
	ctm = mult(temp, translate(translate_cube4));
	gl.uniform4fv(colorUni, flatten(vertexColors[(index+3)%8]));
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
	
	ctm = mult(temp, translate(translate_cube5));
	gl.uniform4fv(colorUni, flatten(vertexColors[(index+4)%8]));
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
	
	ctm = mult(temp, translate(translate_cube6));
	gl.uniform4fv(colorUni, flatten(vertexColors[(index+5)%8]));
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
	
	ctm = mult(temp, translate(translate_cube7));
	gl.uniform4fv(colorUni, flatten(vertexColors[(index+6)%8]));
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
	
	ctm = mult(temp, translate(translate_cube8));
	gl.uniform4fv(colorUni, flatten(vertexColors[(index+7)%8]));
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
	
	/*if (cHair == 0) {
	
		ctm = mult(temp, translate(vec3(0.0, 0.0, 0.0)));
		gl.uniform4fv(colorUni, flatten(vertexColors[1]));
		gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
		gl.drawArrays( gl.LINES, 36, 40 );
	}*/
		
    window.requestAnimFrame( render );
}

