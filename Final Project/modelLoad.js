var UNIFORM_mvMatrix;
var UNIFORM_pMatrix;
var UNIFORM_eyePosition;
var UNIFORM_sampler;
var UNIFORM_vMatrix;
var UNIFORM_aboveWater;

var ATTRIBUTE_position;
var ATTRIBUTE_normal;
var ATTRIBUTE_uv;

var MODEL_renderProgram;


function model_init() 
{
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, '\
attribute vec3 vPosition;\
attribute vec3 vNormal;\
attribute vec2 vUV;\
uniform mat4 mvMatrix;\
uniform mat4 viewMatrix;\
uniform mat4 pMatrix;\
const vec4 lightDirection = vec4(0.0, -1.0, 0.0, 0.0);\
uniform vec4 eyePosition;\
\
varying vec3 fL, fE, fH, fN;\
varying vec2 fUV;\
void main()\
{\
    vec3 pos = (mvMatrix * vec4(vPosition, 1.0)).xyz;\
    vec3 light = (viewMatrix * lightDirection).xyz;\
    vec3 eye = (viewMatrix * eyePosition).xyz;\
    \
    fL = normalize(light);\
    fE = normalize(eye - pos);\
    fH = normalize(fL + fE);\
    fN = normalize(mvMatrix * vec4(vNormal, 0.0)).xyz;\
    fUV = vUV;\
    gl_Position = pMatrix * vec4(pos, 1.0);\
}\
                    ');
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log('model vertex compile error: ' + gl.getShaderInfoLog(vertexShader));
    }
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, '\
precision mediump float;\
\
varying vec3 fL, fE, fH, fN;\
varying vec2 fUV;\
\
uniform sampler2D uSampler;\
uniform bool aboveWater;\
const float shininess = 70.0;\
void main()\
{\
    vec4 texColor = texture2D(uSampler, fUV);\
    vec4 ambient = 0.3 * texColor;\
    float kd = abs(dot(fL, fN));\
    vec4 diffuse = kd * 0.6 * texColor;\
    \
    float ks = pow(abs(dot(fN, fH)), shininess);\
    vec4 specular = 0.3 * ks * vec4(1.0, 1.0, 1.0, 1.0);\
    \
    vec4 fColor = ambient + diffuse + specular;\
    fColor.a  = 1.0;\
    \
    if (aboveWater) gl_FragColor = fColor * vec4(0.8, 1.0, 1.1, 1);\
    else gl_FragColor = fColor * vec4(0.4, 0.9, 1.0, 1.0);\
}\
        ');
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log('model fragment compile error: ' + gl.getShaderInfoLog(fragmentShader));
    }
    MODEL_renderProgram = gl.createProgram();
    gl.attachShader(MODEL_renderProgram, vertexShader);
    gl.attachShader(MODEL_renderProgram, fragmentShader);
    gl.linkProgram(MODEL_renderProgram);
    if (!gl.getProgramParameter(MODEL_renderProgram, gl.LINK_STATUS)) {
        console.log("Program link error: " + gl.getProgramInfoLog(MODEL_renderProgram));
    }

    ATTRIBUTE_position = gl.getAttribLocation( MODEL_renderProgram, "vPosition" );

    ATTRIBUTE_normal = gl.getAttribLocation( MODEL_renderProgram, "vNormal" );

    ATTRIBUTE_uv = gl.getAttribLocation( MODEL_renderProgram, "vUV" );


    UNIFORM_mvMatrix = gl.getUniformLocation(MODEL_renderProgram, "mvMatrix");
    UNIFORM_pMatrix = gl.getUniformLocation(MODEL_renderProgram, "pMatrix");
    UNIFORM_eyePosition = gl.getUniformLocation(MODEL_renderProgram, "eyePosition");
    UNIFORM_sampler = gl.getUniformLocation(MODEL_renderProgram, "uSampler");
    UNIFORM_vMatrix = gl.getUniformLocation(MODEL_renderProgram, "viewMatrix");
    UNIFORM_aboveWater = gl.getUniformLocation(MODEL_renderProgram, "aboveWater");
}


function modelsList()
{
    this.vertices = [];
    this.normals = [];
    this.uv = [];
    this.numVerts = [];
    this.boxes = [];
}
var allModels = new modelsList();
var Enum = { BOMB : 0, SUBMARINE : 1, BOAT : 2, MISSLE : 3 };



function GameObject(modelNum, width, height)
{
    this.modelNum = modelNum;
    if(modelNum == Enum.MISSLE)
        modelNum = Enum.BOMB;
    this.vBuffer = allModels.vertices[modelNum];
    this.nBuffer = allModels.normals[modelNum];
    this.uvBuffer = allModels.uv[modelNum];
    this.numVerts = allModels.numVerts[modelNum];
    this.box = new Box(allModels.boxes[modelNum].xmin, allModels.boxes[modelNum].xmax,
                        allModels.boxes[modelNum].ymin, allModels.boxes[modelNum].ymax,
                        allModels.boxes[modelNum].zmin, allModels.boxes[modelNum].zmax);
    this.mvMatrix;
    this.texture;

    this.posTexture = new Texture(width, height, {type: gl.UNSIGNED_BYTE});
    this.level = 0.0;
    this.center = vec3(0, 0, 0);

    if (modelNum == Enum.BOMB) this.emited = false;

    if (modelNum == Enum.SUBMARINE) {
        this.turning = false;
        this.orientation = 0;
        this.dir = 1;
    }

    if (modelNum == Enum.BOAT) {
        this.dir = vec4(-1, 0, 0, 0);
        this.right = vec4(0, 0, -1, 0);
    }

    if( modelNum == Enum.BOMB) {
        this.dir =  vec3(0, 1, 0);
    }

}
GameObject.prototype.setProperties = function (mvMatrix, texture)
{
    this.mvMatrix = mvMatrix;
    if(this.modelNum == Enum.MISSLE)
        this.mvMatrix = mult(this.mvMatrix, scale(0.25,0.5,0.25));
    this.texture = texture;
}
GameObject.prototype.updatePos = function () 
{
    var this_ = this;
    this.posTexture.drawTo(function () {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (this_.level < -0.001 || this_.modelNum == Enum.BOAT) this_.render(mat4(), rotate(-90, [1, 0, 0]), vec4(camera.position, 1.0), true);
    });
}
GameObject.prototype.translation = function (x, y, z)
{
    this.mvMatrix = mult(translate(x, y, z), this.mvMatrix);
    this.level += y;
    this.center = add(vec3(x, y, z), this.center);
}
GameObject.prototype.rotation = function(angle)
{
    this.mvMatrix = mult(rotate(angle, [0, 1, 0]), this.mvMatrix);
}
GameObject.prototype.render = function(projection, wrdViewMatrix, eye, flag)
{
    gl.uniform1i(UNIFORM_sampler, 0);

    gl.uniformMatrix4fv(UNIFORM_pMatrix, false, flatten(projection));
    var modelViewMatrix = mult(wrdViewMatrix, this.mvMatrix);
    gl.uniformMatrix4fv(UNIFORM_mvMatrix, false, flatten(modelViewMatrix)); this.box.mvMatrix = modelViewMatrix;
    gl.uniformMatrix4fv(UNIFORM_vMatrix, false, flatten(wrdViewMatrix));
    gl.uniform4fv(UNIFORM_eyePosition, new Float32Array(eye));
    gl.uniform1i(UNIFORM_aboveWater, flag);

    gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer);
    gl.enableVertexAttribArray( ATTRIBUTE_position);
    gl.vertexAttribPointer( ATTRIBUTE_position, 3, gl.FLOAT, false, 0, 0 );

    gl.bindBuffer( gl.ARRAY_BUFFER, this.nBuffer);
    gl.enableVertexAttribArray( ATTRIBUTE_normal);
    gl.vertexAttribPointer( ATTRIBUTE_normal, 3, gl.FLOAT, false, 0, 0 );

    this.texture.bind(0);

    gl.bindBuffer( gl.ARRAY_BUFFER, this.uvBuffer);
    gl.enableVertexAttribArray( ATTRIBUTE_uv);
    gl.vertexAttribPointer( ATTRIBUTE_uv, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays( gl.TRIANGLES, 0, this.numVerts);
}

GameObject.prototype.collide = function(otherObj)
{
    var a = this.box;
    var b = otherObj.box;

    /////////////////////axis-aligned bounding boxes

    // if(a.xmax < b.xmin || a.xmin > b.xmax) return false;
    // if(a.ymax < b.ymin || a.ymin > b.ymax) return false;
    // if(a.zmax < b.zmin || a.zmin > b.zmax) return false;
    // // console.log("collided");
    // return true;

    ////////////////////oriented bounding boxes

    var PA = a.pCenter; 
    var Ax = a.xAxis; 
    var Ay = a.yAxis; 
    var Az = a.zAxis; 
    var WA = a.W;
    var HA = a.H;
    var DA = a.D;
    
    var PB = b.pCenter; 
    var Bx = b.xAxis; 
    var By = b.yAxis; 
    var Bz = b.zAxis; 
    var WB = b.W;
    var HB = b.H;
    var DB = b.D;

    var T = subtract(PB, PA);
    var TAx = dot(T, Ax);       var TAy = dot(T, Ay);       var TAz = dot(T, Az);
    var Rxx = dot(Ax, Bx);      var Rxy = dot(Ax, By);      var Rxz = dot(Ax, Bz);
    var Ryx = dot(Ay, Bx);      var Ryy = dot(Ay, By);      var Ryz = dot(Ay, Bz);
    var Rzx = dot(Az, Bx);      var Rzy = dot(Az, By);      var Rzz = dot(Az, Bz);

    if(
    Math.abs(TAx) > WA + Math.abs(WB * Rxx) + Math.abs(HB * Rxy) + Math.abs(DB * Rxz)       ||
    Math.abs(TAy) > HA + Math.abs(WB * Ryx) + Math.abs(HB * Ryy) + Math.abs(DB * Ryz)       ||
    Math.abs(TAz) > DA + Math.abs(WB * Rzx) + Math.abs(HB * Rzy) + Math.abs(DB * Rzz)       ||
    Math.abs(dot(T, Bx)) > Math.abs(WA * Rxx) + Math.abs(HA * Ryx) + Math.abs(DA * Rzx) + WB    ||
    Math.abs(dot(T, By)) > Math.abs(WA * Rxy) + Math.abs(HA * Ryy) + Math.abs(DA * Rzy) + HB    ||
    Math.abs(dot(T, Bz)) > Math.abs(WA * Rxz) + Math.abs(HA * Ryz) + Math.abs(DA * Rzz) + DB    ||
    Math.abs(TAz * Ryx - TAy * Rzx) > Math.abs(HA * Rzx) + Math.abs(DA * Ryx) + Math.abs(HB * Rxz) + Math.abs(DB * Rxy) ||
    Math.abs(TAz * Ryy - TAy * Rzy) > Math.abs(HA * Rzy) + Math.abs(DA * Ryy) + Math.abs(WB * Rxz) + Math.abs(DB * Rxx) ||
    Math.abs(TAz * Ryz - TAy * Rzz) > Math.abs(HA * Rzz) + Math.abs(DA * Ryz) + Math.abs(WB * Rxy) + Math.abs(HB * Rxx) ||
    Math.abs(TAx * Rzx - TAz * Rxx) > Math.abs(WA * Rzx) + Math.abs(DA * Rxx) + Math.abs(HB * Ryz) + Math.abs(DB * Ryy) ||
    Math.abs(TAx * Rzy - TAz * Rxy) > Math.abs(WA * Rzy) + Math.abs(DA * Rxy) + Math.abs(WB * Ryz) + Math.abs(DB * Ryx) ||
    Math.abs(TAx * Rzz - TAz * Rxz) > Math.abs(WA * Rzz) + Math.abs(DA * Rxz) + Math.abs(WB * Ryy) + Math.abs(HB * Ryx) ||
    Math.abs(TAy * Rxx - TAx * Ryx) > Math.abs(WA * Ryx) + Math.abs(HA * Rxx) + Math.abs(HB * Rzz) + Math.abs(DB * Rzy) ||
    Math.abs(TAy * Rxy - TAx * Ryy) > Math.abs(WA * Ryy) + Math.abs(HA * Rxy) + Math.abs(WB * Rzz) + Math.abs(DB * Rzx) ||
    Math.abs(TAy * Rxz - TAx * Ryz) > Math.abs(WA * Ryz) + Math.abs(HA * Rxz) + Math.abs(WB * Rzy) + Math.abs(HB * Rzx)  )
        return false;
        

    return true;
}

/////////////////
function Box(xmin, xmax, ymin, ymax, zmin, zmax) {

    this.xmin = xmin;   this.xmax = xmax;
    this.ymin = ymin;   this.ymax = ymax;
    this.zmin = zmin;   this.zmax = zmax;

    this.v1 = vec3(this.xmax, this.ymax, this.zmax);
    this.v2 = vec3(this.xmin, this.ymax, this.zmax);
    this.v3 = vec3(this.xmin, this.ymin, this.zmax);
    this.v4 = vec3(this.xmax, this.ymin, this.zmax);
    this.v5 = vec3(this.xmax, this.ymax, this.zmin);
    this.v6 = vec3(this.xmin, this.ymax, this.zmin);
    this.v7 = vec3(this.xmin, this.ymin, this.zmin);
    this.v8 = vec3(this.xmax, this.ymin, this.zmin);

    this.mvMatrix = mat4();

};

Box.prototype.matXvec = function(vect)
{
    var matr = this.mvMatrix;
    var result = [];
    
    for (var i = 0; i < vect.length; i++) 
    {
        var sum = 0;
        for (var j = 0; j < vect.length; j++) 
        {
            sum += matr[i][j] * vect[j];
        }
        result.push( sum );
    }
    
    return result.splice(0, 3); 
}

Box.prototype.minMax = function(tv1, tv2, tv3, tv4, tv5, tv6, tv7, tv8)
{
    this.xmax = Math.max(tv1[0], tv2[0], tv3[0], tv4[0], tv5[0], tv6[0], tv7[0], tv8[0]);
    this.xmin = Math.min(tv1[0], tv2[0], tv3[0], tv4[0], tv5[0], tv6[0], tv7[0], tv8[0]);
    this.ymax = Math.max(tv1[1], tv2[1], tv3[1], tv4[1], tv5[1], tv6[1], tv7[1], tv8[1]);
    this.ymin = Math.min(tv1[1], tv2[1], tv3[1], tv4[1], tv5[1], tv6[1], tv7[1], tv8[1]);
    this.zmax = Math.max(tv1[2], tv2[2], tv3[2], tv4[2], tv5[2], tv6[2], tv7[2], tv8[2]);
    this.zmin = Math.min(tv1[2], tv2[2], tv3[2], tv4[2], tv5[2], tv6[2], tv7[2], tv8[2]);
}

Box.prototype.transform = function() 
{
    //console.log("transform");
    var tv1 = this.matXvec(vec4(this.v1, 1));
    var tv2 = this.matXvec(vec4(this.v2, 1));
    var tv3 = this.matXvec(vec4(this.v3, 1));
    var tv4 = this.matXvec(vec4(this.v4, 1));
    var tv5 = this.matXvec(vec4(this.v5, 1));
    var tv6 = this.matXvec(vec4(this.v6, 1));
    var tv7 = this.matXvec(vec4(this.v7, 1));
    var tv8 = this.matXvec(vec4(this.v8, 1));

    this.minMax(tv1, tv2, tv3, tv4, tv5, tv6, tv7, tv8);

    this.pCenter = vec3((this.xmax + this.xmin) / 2, (this.ymax + this.ymin) / 2, (this.zmax + this.zmin) / 2);
    this.xAxis = normalize(vec3(tv1[0] - tv2[0], tv1[1] - tv2[1], tv1[2] - tv2[2]), false);
    this.yAxis = normalize(vec3(tv2[0] - tv3[0], tv2[1] - tv3[1], tv2[2] - tv3[2]), false);
    this.zAxis = normalize(vec3(tv4[0] - tv8[0], tv4[1] - tv8[1], tv4[2] - tv8[2]), false);

    this.W = length(vec3(tv1[0] - tv2[0], tv1[1] - tv2[1], tv1[2] - tv2[2])) / 2;
    this.H = length(vec3(tv2[0] - tv3[0], tv2[1] - tv3[1], tv2[2] - tv3[2])) / 2;
    this.D = length(vec3(tv4[0] - tv8[0], tv4[1] - tv8[1], tv4[2] - tv8[2])) / 2;
}


/////////////////

function loadModel(model)
{

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(model.vertices), gl.STATIC_DRAW );

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(model.normals), gl.STATIC_DRAW );

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, uvBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(model.uv), gl.STATIC_DRAW );
    
    allModels.vertices.push(positionBuffer);
    allModels.normals.push(normalBuffer);
    allModels.uv.push(uvBuffer);
    allModels.numVerts.push(model.vertices.length / 3);
    allModels.boxes.push(new Box(model.xmin, model.xmax, model.ymin, model.ymax, model.zmin, model.zmax));

}