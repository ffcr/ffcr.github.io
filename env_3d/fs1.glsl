glsl[getFileNameFromPath(document.currentScript.src)]=`
in vec2 pos;
out vec4 color;

uniform sampler2D last;
uniform vec2 ONE;
uniform float ran0;

float bbsm = 1739.;
vec2 bbsopt(in vec2 a){
	return fract(a*a*(1./bbsm))*bbsm;
}
vec4 hash(in vec2 pos){
	vec2 a0 = fract(pos*(3.14159265/1024.))*1024.;
	vec2 a1 = bbsopt(a0);
	vec2 a2 = a1.yx + bbsopt(a1);
	vec2 a3 = a2.yx + bbsopt(a2);
	return fract((a2.xyxy + a3.xxyy + a1.xyyx)*(1./bbsm));
}

void random(){
	color.w=1.;
	vec4 j=hash(pos);
	color.xyz=hash((j.xy+ran0*j.zw)*bbsm+bbsm).xyz;
}
void test(vec4 j){
	if(abs(j.x-color.y)<.01)color.w+=.05;
	if(abs(j.y-color.x)<.01)color.w-=.05;
	if(abs(j.x-color.y)<.1)color.w+=.01;
	if(abs(j.y-color.x)<.1)color.w-=.01;
}
vec4 data[5];
void this_func(float f){
	vec2 a;
	for(int i=1;i<5;i++){
		f=8.*fract(f);
		vec2 d=data[i].yx-data[0].xy;
		a+=
		f>=4.0?(
			f>6.0?(
				f>7.0?sin(d):cos(d)
			):(
				f>5.0?sqrt(abs(d)):d*d
			)
		):(
			f>2.0?(
				f>3.0?d+.1:d-.1
			):(
				f>1.0?d:-d
			)
		)
		;
	}
	color.xy+=.5*a;
}

void main() {
	color=texture(last,pos);
	color.w-=.01;
	if(color.w<0.){random();return;}
	data[0]=color;
	data[1]=texture(last,pos+ONE*vec2(-1,0));
	data[2]=texture(last,pos+ONE*vec2(1,0));
	data[3]=texture(last,pos+ONE*vec2(0,-1));
	data[4]=texture(last,pos+ONE*vec2(0,1));
	test(data[1]);
	test(data[2]);
	test(data[3]);
	test(data[4]);
	this_func(color.z);
}
`