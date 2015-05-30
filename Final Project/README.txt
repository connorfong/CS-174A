TEAM NUMBER: 16

MEMBER:
	Name: Huanquan Lu
	Name: Khoa Nguyen
	Name: Connor Fong

USEAGE:
To run this demo, the browser should support OES float texture and OES linear filter for float texture extensions.
	Tested Environment: Chrome 39.0.2171.71 
						Mozilla Firefox 34.0
			(To run this demo in browser like Chrome which validates the cross-domain security, you need to build a local server and visit the demo through this server
			 For example: 1. Open the cmd and cd to the folder you store the index.html file of this demo
			 			  2. Use the command, python -m SimpleHTTPServer 8080 &, to build a local server
			 			  3. Open the brower and visit http://localserver:8080 )

For our final project, we created a game in which the user controls a boat floating in a pool of water. There are also submarines which fire missiles at the boat which the user must avoid. The goal of the game is to avoid the missiles for 60 seconds. There are 2 submarines which move in fixed paths through the pool, and fire missiles when they get close enough to the boat. The view can also be changed then the cube of water will be rotated by the user. The boat is controlled by up, left, right and down arrows in the keyboard. Also, user can adjust the view by W, A, S and D. Missiles will be shot directly toward the center of the boat. Whenever the boat hits a wall, it can only go backward because going left or right will also cause the boat moving closer toward the wall. 


ADVANCED TOPIC IMPLEMENTATION:
	Water:
		1. Height Field Water Simulation: The equation u[i, j] = 0.7 * (u[i + 1, j] + u[i - 1, j] + u[i, j + 1] + u[i, j - 1]) / 4 / (dt * dt) is applied. We also multiplied the velocity of u[i, j] with 0.995 so the wave won't last forever.
		2. Caustics: We applied the method proposed in "GPU Gems: Programming Techniques, Tips and Tricks for Real-Time Graphics" to generate the caustics. We assumed the light source is distant and all light are vertical to the bottom of the swimming pool. For each pixel, we check the incoming ray which causes a vertical refracted ray to shoot at this pixel. Then calculate the cosine value of the angle between the incoming ray and the vertical direction. We multiplied the light intensity by the power of this cosine value to approximate the light intensity reaching this pixel.
		3. Ray Tracing and Shadow: We applied primary backward ray tracing to make the surface of water transparent, also to generate the shadow of objects. In order to make the computation of ray tracing for objects with irregular shapes efficient, we generate a texture, which is associated with the object's level at y axis, for each object by rendering only this object from a top-down view. Then sort these textures by their associated levels. From top to bottom, for each texture, use a simple ray tracer to calculate the point the ray intersected with the planar in the corresponding y level and sample color from the texture via this point. If the color is pure black (we assumed our objects won't be black at any point of them), the ray will be regarded as missing the object corresponding to the texutre. If the ray intersect with the object, we use the intersected point and a vertical ray (a similar strategy like generating caustics) to calculate whether this point is at other object's shadow. This method is an approximation of the real physical effect but is efficient for computing. Our demo can be run at more than 49 fps.
		4. Interaction between Water and Objects: There are two kinds of interactions between objects and water. One is between missiles and water, another is between the boat and water. For the first one, whenever a missile hits the surface of water, we generate a small wave by lifting the height of a circle area of water centered at the position the missile hitted. For the second one, whenever the boat moves, we generate a small wave at a position near the tail of the boat.
	Collision Detection:
		There are 3 kinds of collision in our demo: Submarines hit the wall of the swimming pool, the boat hits the wall of the swimming pool and missiles hit the boat.
			1. For the first one, we set the orientation of heads of submarines is aligned to axises. So we can check the minimum of distances between the center of a submarine and any walls. If this minimum is smaller than half of the length of the submarine, collision will happen.
			2. For the second one, we first calculated the possible hitted wall by regarding the direction of the boat as a ray. Then, calculate the distance between the point the ray intersected with that wall and the center of the boat via . If this distance is smaller than half of the length of the boat, collision will happen.
			3. For the last one, our models can fit quite nicely into rectangular boxes. However, because the game objects will be rotated, axis-aligned bounding boxes do not work correctly, and we implemented oriented bounding boxes for accurate collision detection. These objects are convex hull, so our implementation is based on the separating axis theorem.
	Particle System:
		We implemented a particle system to simulate explosion and fire when a missile hits the boat. Base texture for the particles is from the internet. We used the same shaders for both emitters. In the explosion, particles move away from the center to make a scattering effect. In the fire, particles in the xz plane move up toward the y axis to create a fire pillar. Parameters for the emitters and shaders were obtained from trials and errors to fit our game.
	Complex Models:
		.obj models for the game objects were downloaded from www.turbosquid.com and tf3dm.com under the Personal Use License. We parsed them into .json files using the utility convert_obj_three.py (provided with three.js). These files are index-based, so we wrote a script read.py to convert them into the same format we used for gl.drawArrays on our class assignments. Textures for the objects were also from the internet. These are in the folder named resources.

	Totally, we implemented 7 advanced topics (height field water simulation, caustics, ray tracing, shadow, collision detection, particle system and rendering complex models)
