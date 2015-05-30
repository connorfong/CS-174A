
var frameBuffer;
var renderBuffer;

function Texture(width, height, options) {
	  this.id = gl.createTexture()
	  this.width = width;
	  this.height = height;
	  options = options || {};
	  this.type = options.type || gl.FLOAT;
	  this.format = options.format || gl.RGBA;
	  var minFilter = options.filter || options.minFilter || gl.LINEAR;
	  var magFilter = options.filter || options.magFilter || gl.LINEAR;
	  var wrapS = options.wrap || options.wrapS || gl.CLAMP_TO_EDGE;
	  var wrapT = options.wrap || options.wrapT || gl.CLAMP_TO_EDGE;

	  gl.bindTexture(gl.TEXTURE_2D, this.id);
	  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  	gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);

  	this.bind = function(unit) {
  		gl.activeTexture(gl.TEXTURE0 + (unit || 0) );
  		gl.bindTexture(gl.TEXTURE_2D, this.id);
  	}

  	this.unbind = function(unit) {
  		gl.activeTexture(gl.TEXTURE0 + (unit || 0) );
  		gl.bindTexture(gl.TEXTURE_2D, null);
  	}

    this.loadImage = function(imageId) {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, document.getElementById(imageId));
    }

    this.swapWith = function(other) {
      var temp;
      temp = this.id; this.id = other.id; other.id = temp;
      temp = this.width; this.width = other.width; other.width = temp;
      temp = this.height; this.height = other.height; other.height = temp;
    }

  	this.drawTo = function(callback) {
  		var v = gl.getParameter(gl.VIEWPORT);
    	frameBuffer = frameBuffer || gl.createFramebuffer();
    	renderBuffer = renderBuffer || gl.createRenderbuffer();
    	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    	gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    	if (this.width != renderBuffer.width || this.height != renderBuffer.height) {
      		renderBuffer.width = this.width;
      		renderBuffer.height = this.height;
      		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
    	}
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
    	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
      		console.log('Rendering to this texture is not supported (incomplete framebuffer)');
    	}
    	gl.viewport(0, 0, this.width, this.height);

    	callback();

    	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    	gl.viewport(v[0], v[1], v[2], v[3]);
  	}

}

