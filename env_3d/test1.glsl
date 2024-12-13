glsl.test1_v=`
in vec4 block;
flat out vec4 id;
uniform mat4 mat;
out vec4 pos_gl;
out vec3 pos_world;
out vec2 texCoord;
const float ps[]=float[](
	-1.,+1.,+1.,-1.,+1.,-1.,-1.,-1.,-1.,-1.,+1.,+1.,-1.,-1.,-1.,-1.,-1.,+1.,//x-
	+1.,+1.,+1.,+1.,-1.,+1.,+1.,-1.,-1.,+1.,+1.,+1.,+1.,-1.,-1.,+1.,+1.,-1.,//x+
	-1.,-1.,-1.,+1.,-1.,-1.,+1.,-1.,+1.,-1.,-1.,-1.,+1.,-1.,+1.,-1.,-1.,+1.,//y-
	+1.,+1.,+1.,+1.,+1.,-1.,-1.,+1.,-1.,+1.,+1.,+1.,-1.,+1.,-1.,-1.,+1.,+1.,//y+
	+1.,-1.,-1.,-1.,-1.,-1.,-1.,+1.,-1.,+1.,-1.,-1.,-1.,+1.,-1.,+1.,+1.,-1.,//z-
	+1.,+1.,+1.,-1.,+1.,+1.,-1.,-1.,+1.,+1.,+1.,+1.,-1.,-1.,+1.,+1.,-1.,+1. //z+
);
void main() {
	int i=(gl_VertexID%36)*3;
	vec3 p=vec3(ps[i],ps[i+1],ps[i+2])*block.w+block.xyz;
	// Multiply the position by the matrix.
	pos_gl=gl_Position = mat * vec4(p, 1);
	// Convert from clipspace to colorspace.
	// Clipspace goes -1.0 to +1.0
	// Colorspace goes from 0.0 to 1.0
	texCoord=vec2(gl_VertexID%3==1?1.:0.,gl_VertexID%3==2?1.:0.);
	pos_world=p;
	id=block;
}
`

glsl.test1_f=`
in vec3 pos_world;
in vec4 pos_gl;
in vec2 texCoord;
flat in vec4 id;
uniform mat4 mat;
uniform vec3 pos_player;
uniform int visible;
out vec4 outColor;
float findRealDepth(in highp mat4 modelViewProjectinMatrix,in highp vec3 objectPosition){
	float far=gl_DepthRange.far; float near=gl_DepthRange.near;
	vec4 clip_space_pos = modelViewProjectinMatrix * vec4(objectPosition, 1.0);
	float ndc_depth = clip_space_pos.z / clip_space_pos.w;
	return (((far-near) * ndc_depth) + near + far) / 2.0;
}
void main() {
	float r=id.w;
	if(r<0.){
		if(texCoord.x<.005||texCoord.y<.005||texCoord.x+texCoord.y>.995){//gl_FrontFacing
			
		}else discard;
		outColor=vec4(vec3(.75)+.25*sin(vec3(r*5.,r*7.,r*11.)),1);
		gl_FragDepth = gl_FragCoord.z;
		return;
	}
	vec3 A=pos_world,P=pos_player;
	
	vec3 Q=id.xyz;
	vec3 v=Q-P;
	vec3 n=normalize(A-P);
	float PM=dot(n,v);
	float dd=dot(v,v)-PM*PM;
	float delta=r*r-dd;
	if(r>length(v)||delta<0.)discard;
	float near=PM-sqrt(delta);
	//float far=0.5*(-b+delta);
	vec3 loc=P+near*n;
	outColor = vec4(.5+.5*sin(10.*(loc-Q)/r),1);
	gl_FragDepth = findRealDepth(mat,loc);

}
`