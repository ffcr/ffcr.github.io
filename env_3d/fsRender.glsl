glsl[getFileNameFromPath(document.currentScript.src)]=`
//glsl新函数：uintBitsToFloat、floatBitsToUint等等一系列 另外，float转uint有bug，尽量不要uint
in vec2 pos;
out vec4 color;
//uniform float time;
uniform sampler2D tex;
//uniform usampler2D tex;
//uniform vec2 wh;
//uniform vec3 mouse;
/*
uint get(uvec4 p,ivec2 g){
	return p[(g.y>>2)^1]>>(((7^g.x)<<2)|(g.y&3))&1u;
}*/
void main() {
	/*if(mouse.z>.5&&length(mouse.xy-pos)<.1)discard;
	/*ivec2 g=ivec2(fract(wh*pos)*8.);
	uvec4 p=texture(tex,pos);
	color=vec4(vec3(get(p,g)>0u?1.:0.),1.);*/
	color=texture(tex,pos);
}
`