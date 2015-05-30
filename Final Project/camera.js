function Camera() {
	// Properties
	this.initial = [vec3(0, 0, 0), vec3(0, 0, 0)];    // inital position and orientation
	this.position = vec3(0, 0, 0);   				  // current position
	this.orientation = vec4(0, 0, 1, 0);              // current orientation			
	this.top = vec4(0, 1, 0, 0);					  // current top orientation
	this.transformation = mat4();					  // world-eye transformation
	this.modification = mat4();						  // modification transformation to convert delta vector between
													  // rotation center of the camera and the position of the camera
													  // from world coordinate to eye coordinate 
	// Methods
	this.init = function(x, y, z, theta) {
		this.initial = [vec3(x, y, z), theta];
		this.position = vec3(x, y, z);
		this.transformation = translate(-x, -y, -z);
		this.transformation = mult(rotate(-theta[0], [1, 0, 0]), this.transformation);
		this.transformation = mult(rotate(-theta[1], [0, 1, 0]), this.transformation);
		this.transformation = mult(rotate(-theta[2], [0, 0, 1]), this.transformation);
					
					// calculate the initial top and head orientation
					var inverseTransform = mat4();
					inverseTransform = mult(rotate(theta[0], [1, 0, 0]), inverseTransform);
					inverseTransform = mult(rotate(theta[1], [0, 1, 0]), inverseTransform);
					inverseTransform = mult(rotate(theta[2], [0, 0, 1]), inverseTransform);
					this.orientation = vMult(inverseTransform, vec4(0, 0, 1, 0));
					this.top = vMult(inverseTransform, vec4(0, 1, 0, 0));
				}
				this.translation = function(x, y, z) {
					this.transformation = mult(translate(-x, -y, -z), this.transformation);
					this.position = add(this.position, vec3(x, y, z));
				}
				this.rotation = function(theta, axis) {
					this.transformation = mult(rotate(-theta, axis), this.transformation);
					this.orientation = mult(rotate(theta, axis), this.orientation);
				}
				this.fromWrlToEye = function() {
					return this.transformation;
				}
				// navigate the camera in the eye coordinate
				this.up = function() {
					var direction = vScale( 0.25, this.top, false);
					this.transformation = mult(translate(-direction[0], -direction[1], -direction[2]), this.transformation);
					this.position = add(this.position, direction.slice(0, 3));
				}
				this.down = function() {
					var direction = vScale(-0.25, this.top, false);
					this.transformation = mult(translate(-direction[0], -direction[1], -direction[2]), this.transformation);
					this.position = add(this.position, direction.slice(0, 3));
				}
				this.forward = function() {
					// calculate the unit orientation vector of camera
					// scale it to the incremental step length
					var direction = vScale(0.25, this.orientation, false);
					this.transformation = mult(translate(direction[0], direction[1],  direction[2]), this.transformation);
					this.position = add(this.position, negate(direction).slice(0, 3));
				}
				this.backward = function() {
					var direction = vScale(-0.25, this.orientation, false);
					this.transformation = mult(translate(direction[0], direction[1],  direction[2]), this.transformation);
					this.position = add(this.position, negate(direction).slice(0, 3));
				}
				this.left = function() {
					// use cross product to calculate the perpendicular vector of the plane consisting of the orientation of camera and y-axis
					var direction = cross(this.orientation, this.top);
					direction = normalize(direction, false);
					direction = vScale(-0.25, direction, false);
					this.transformation = mult(translate(direction[0], direction[1],  direction[2]), this.transformation);
					this.position = add(this.position, negate(direction).slice(0, 3));
				}
				this.right = function() {
					var direction = cross(this.orientation, this.top);
					direction = normalize(direction, false);
					direction = vScale(0.25, direction, false);
					this.transformation = mult(translate(direction[0], direction[1],  direction[2]), this.transformation);
					this.position = add(this.position, negate(direction).slice(0, 3));
				}
				this.lYaw = function() {
					// rotate the camera in the eye coordinate
					this.transformation = mult(rotate(-deltaYaw, this.top.slice(0, 3)), this.transformation);
					// store a modification transformation for adjusting the delta vector between rotation center of the camera and the camera
					this.modification = mult(rotate(-deltaYaw, this.top.slice(0, 3)), this.modification);
					
					this.orientation =  vMult(rotate( deltaYaw, this.top.slice(0, 3)), this.orientation);
				}
				this.rYaw = function() {
					this.transformation = mult(rotate( deltaYaw, this.top.slice(0, 3)), this.transformation);
					this.modification = mult(rotate(deltaYaw, this.top.slice(0, 3)), this.modification);
					
					this.orientation =  vMult(rotate(-deltaYaw, this.top.slice(0, 3)), this.orientation);
				}
				this.initialStatus = function() {
					return this.initial;
				}
				this.deltaModify = function(delta) {
					return vMult(this.modification, delta).slice(0, 3);
				}
			}

			function perspective(near, far, top, bottom, left, right) {
				var r00 = 2 * near / (right - left);
				var r02 = (right + left) / (right - left);
				var r11 = 2 * near / (top - bottom);
				var r12 = (top + bottom) / (top - bottom);
				var r22 = -(far + near) / (far - near);
				var r23 = -2 * far * near / (far - near);

				var result = mat4();
				result[0][0] = r00;
				result[0][2] = r02;
				result[1][1] = r11;
				result[1][2] = r12;
				result[2][2] = r22;
				result[2][3] = r23;
				result[3][2] = -1;
				result[3][3] = 0;

				return result;
			}