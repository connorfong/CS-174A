Connor Fong
303991911
CS 174A

Platform: Windows 8.1
Environment: Notepad++
Browser: Mozilla Firefox (32.0.3)

Homework #4:
For this assignment I displayed displayed displayed both cubes, the left has the full size image,
while the right has the image reduced by 50%.  The image that I chose to use was the image provided in the
discussion materials, because it was easy to see the difference in the images between the nearest and 
linear filters, and its size is a power of two for mip-mapping.  I chose to repeat the reduced image, 
and place the image in the center, which resulted in a wrapping effect on the cube's edges.  
The left cube uses nearest filtering, and the cube on the right uses tri-linear mip-mapping.  


'i' and 'o' can be used to move the camera nearer or closer, by translating the cubes
'j' and 'k' can be used to move the camera left or right, by translating the cubes
'UP' and 'DOWN' can be used to move the camera up or down, by translating the cubes
'z' can be used to reset everything to their original positions

EXTRA CREDIT:
I chose to implement the rotation of the cubes for extra credit.  The left cube rotates around its y-axis
at a rate of 60 rpm and the right cube rotates at a rate of 30 rpm around its x-axis.

'r' can be used to make the cubes begin rotating, or pause the rotation.