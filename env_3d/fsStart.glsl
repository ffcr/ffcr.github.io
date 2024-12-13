glsl[getFileNameFromPath(document.currentScript.src)]=`
in vec2 pos;
out vec4 color;
void main() {
	vec2 j=2.*sin(pos*5.);
	color=vec4(j,.5,1.);
}
`