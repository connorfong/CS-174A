
var canvas
var gl;

var points = [];

var NumTimesToSubdivide = 5;

window.onload = function init()
{
	var canvas = document.getElementById( "gl-canvas" );
	
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { 
		alert( "WebGL isn't available" ); 
	}

    // Set up geometry models
    var vertices = [
        vec2( -0.5, -0.5 ), //vertex 1
        vec2(  0.5,  -0.5 ), //vertex 2
        vec2( 0.0,  0.5 ), //vertex 3
    ];
	
	divideTriangle(vertices[0], vertices[1], vertices[2],
					NumTimesToSubdivide);
	
	//  Configure WebGL
	gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	// Send data to the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

function triangle(a, b, c)
{
	points.push(a);
	points.push(b);
	points.push(c);
}

function divideTriangle(a, b, c, count)
{
    if (count === 0) {
        triangle(a, b, c);
    }
    else {
        //Find midpoint of sides
        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        //Create 3 sub triangles
        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
    }
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}