/*
	var pos=new Float32Array([
		x+0,y+d,z+d,x+0,y+d,z+0,x+0,y+0,z+0,x+0,y+d,z+d,x+0,y+0,z+0,x+0,y+0,z+d,//x-
		x+d,y+d,z+d,x+d,y+0,z+d,x+d,y+0,z+0,x+d,y+d,z+d,x+d,y+0,z+0,x+d,y+d,z+0,//x+
		x+0,y+0,z+0,x+d,y+0,z+0,x+d,y+0,z+d,x+0,y+0,z+0,x+d,y+0,z+d,x+0,y+0,z+d,//y-
		x+d,y+d,z+d,x+d,y+d,z+0,x+0,y+d,z+0,x+d,y+d,z+d,x+0,y+d,z+0,x+0,y+d,z+d,//y+
		x+d,y+0,z+0,x+0,y+0,z+0,x+0,y+d,z+0,x+d,y+0,z+0,x+0,y+d,z+0,x+d,y+d,z+0,//z-
		x+d,y+d,z+d,x+0,y+d,z+d,x+0,y+0,z+d,x+d,y+d,z+d,x+0,y+0,z+d,x+d,y+0,z+d,//z+
	]);
	let b=ID;
	var block = new Float32Array([
		-1,0,0,b, -1,0,0,b, -1,0,0,b, -1,0,0,b, -1,0,0,b, -1,0,0,b,
		 1,0,0,b,  1,0,0,b,  1,0,0,b,  1,0,0,b,  1,0,0,b,  1,0,0,b,
		0,-1,0,b, 0,-1,0,b, 0,-1,0,b, 0,-1,0,b, 0,-1,0,b, 0,-1,0,b,
		0, 1,0,b, 0, 1,0,b, 0, 1,0,b, 0, 1,0,b, 0, 1,0,b, 0, 1,0,b,
		0,0,-1,b, 0,0,-1,b, 0,0,-1,b, 0,0,-1,b, 0,0,-1,b, 0,0,-1,b,
		0,0, 1,b, 0,0, 1,b, 0,0, 1,b, 0,0, 1,b, 0,0, 1,b, 0,0, 1,b,
	]);
*/
/*function kdTree(es){
	let avg=[0,0,0];
	for(let e of es)for(let a=0;a<3;a++){avg[a]+=e.pos[a];}
	for(let a=0;a<3;a++)avg[a]/=es.length;
	let s=[0,0,0];
	for(let e of es)for(let a=0;a<3;a++){s[a]+=(e.pos[a]-avg[a])**2;}
	let m=0,mv=s[0];
	for(let a=1;a<3;a++)if(mv<s[a]){m=a;mv=s[a];}
	let es1=Array.from(es);
	es1.sort((a,b)=>a.pos[m]-b.pos[m]);
	return {
		E:es1[es1.length>>1],
		L:
	};
}*/
function ticker(f,time,tpsProcess,minTime){
	let t00=timerStart();
	let count=0;
	let f1=()=>{
		let t0=timerStart();
		f(time);
		count++;
		if(tpsProcess)if(timerEnd(t00)>=minTime*1000){
			tpsProcess(count/(timerEnd(t00)/1000));
			count=0;t00=timerStart();
		}
		setTimeout(f1,1000*time-timerEnd(t0));
	}
	setTimeout(f1,0);
}

perprocess.push(()=>{


let objects=[];
let program=autoGenProgram(glsl.test1_v,glsl.test1_f);


let renderObject=(x,y,z,r)=>{//r>0:ball r<0:block frame
	var block = new Float32Array(144);//6faces*(2triangles*3points)*4xyzr
	block.set([x,y,z,r]);
	for(let p=4;p<=256;p<<=1)block.copyWithin(p,0,p);
	
	let o={block:block};
	objects.push(o);
}

class OcTree{
	static UID_COUNT=0;
	constructor(pos,r){
		this.UID=OcTree.UID_COUNT++;
		this.pos=pos;
		this.r=r;
		this.es=[];
		this.children=[];
		//console.log('new ',this);
	}
	test(pos,r){
		if(r!==undefined){
			if(false){//algorithm 1
				return m4.distance(this.pos,pos)<=1.7320508075688772*this.r+r;
			}else{//algorithm 2
				let p1,r1,p2,r2;//r1>r2
				if(this.r>r)[p1,r1,p2,r2]=[this.pos,this.r,pos,r];
				else[p2,r2,p1,r1]=[this.pos,this.r,pos,r];
				for(let i=0;i<3;i++)if(p2[i]-r2>=p1[i]+r1||p2[i]+r2<p1[i]-r1)return false;
				return true;
			}
		}
		for(let i=0;i<3;i++)if(pos[i]>=this.pos[i]+this.r||pos[i]<this.pos[i]-this.r)return false;
		return true;
	}
	radiusInteract(pos,r,f){
		if(!this.test(pos,r))return;
		this.es.filter(e=>{
			if(!(this.test(e.pos)))return true;
			e.radiusInteract(pos,r,f);
			return false;
		}).forEach(e=>e.updateOcTree(this));
		
		for(let e of this.children){
			e.radiusInteract(pos,r,f);
		}
	}
	push(e){
		if(this.es.length>0&&this.children.length>0)throw ['tree both have children and es',this,e];
		
		if(!this.test(e.pos))return;
		
		if(this.children.length>0){
			for(let c of this.children){
				let r=c.push(e);
				if(r)return r;
			}
			throw ['tree have children but need push es',this,e];
		}
		
		if(this.es.indexOf(e)>=0)return this;
		e.updateOcTree(this);
		if(this.es.length>10&&this.r>2){
			let aa=this.r*.5;
			let p=Array(6);
			for(let a=0;a<6;a++)p[a]=this.pos[a%3]+(a<3?-aa:+aa);
			for(let a=0;a<8;a++)this.children.push(new OcTree([p[a&1?3:0],p[a&2?4:1],p[a&4?5:2]],aa));
			let es1=this.es;//@-------------------------------------todo:change to updateOcTree
			this.es=[];
			//console.log([this.pos,this.r,e.pos,e.r]);
			for(let e of es1)this.push(e);
			return true;
		}
		return this;
	}
	checkClear(){
		if(this.children.length>0){
			let es1=[],clear=true;
			for(let c of this.children){
				c.checkClear();
				if(c.children.length>0)clear=false;
				if(clear)es1.push.apply(es1,c.es);
			}
			if(clear&&es1.length<5){
				//console.log('delete',this);
				//throw [this,es1];
				this.children=[];
				this.es=[];
				for(let e of es1)e.updateOcTree(this);
				return true;
			}
		}
	}
	render(){
		renderObject(this.pos[0],this.pos[1],this.pos[2],-this.r);
		for(let e of this.children)e.render();
		//for(let e of this.es)e.render();
	}
}

let boids=[];let ocTree=new OcTree([0,0,0],512);
class Boid{
	static maxF=50;
	static visibleDistance=10;
	constructor(pos){
		this.pos=Float32Array.from(pos);
		ocTree.push(this);
		let mf=Boid.maxF*2*1;
		this.v=Float32Array.from([mf*(Math.random()-.5),mf*(Math.random()-.5),mf*(Math.random()-.5)]);
		this.r=1.0;
		this.sleep=0;
		this.aThink=new Float32Array(3);
	}
	think(){
		let a = new Float32Array(3);
		let inRadius=[];
		ocTree.radiusInteract(this.pos,Boid.visibleDistance,boid=>{
			let dx = m4.subtractVectors(boid.pos,this.pos);
			let r=m4.length(dx);
			if(!(r!=0&&r < Boid.visibleDistance))return;//exclude self
			let dv=m4.subtractVectors(boid.v,this.v);
			inRadius.push([boid,dx,r,dv])
		});
		for(let [boid,dx,r,dv] of inRadius){
			m4.addVectors(a,m4.scaleVector(dx,Math.min(1000*(r-1),0)),a);//avoid collision
			m4.addVectors(a,m4.scaleVector(dv,500/inRadius.length),a);//same velocity
			m4.addVectors(a,m4.scaleVector(dx,100/inRadius.length),a);//average position of neighboring
		}
		
		if(m4.length(a)>Boid.maxF){
			m4.scaleVector(m4.normalize(a),Boid.maxF,a);
		}
		this.aThink=a;
	}
	tick(dT){
		if((this.sleep-=dT)<0){
			let a0=this.aThink;
			this.think();
			let a1=this.aThink;
			let d=m4.cross(a1,a0);
			
			this.sleep=Math.min(1,.5*(1-m4.lengthSq(d)**.25/Boid.maxF));
			//if(Math.random()<.001)console.log(this.sleep);
		}
		
		let a=this.aThink;
		a=m4.addVectors(a,m4.scaleVector(this.v,-m4.length(this.v)*.02*dT));
		for(let i=0;i<3;i++){this.pos[i]+=dT*(this.v[i]+=dT*a[i]);}
		let outerBorder=m4.length(this.pos)/200-1;
		if(outerBorder>0){
			let outer=m4.scale(this.pos,outerBorder/(1+outerBorder));
			for(let i=0;i<3;i++)this.v[i]-=outer[i]*dT*1.;
		}
		if(isNaN(this.pos[0]))throw [NaN,this];
		if(!this.ocTree.test(this.pos))ocTree.push(this);
	}
	render(){
		renderObject(this.pos[0],this.pos[1],this.pos[2],this.r);
	}
	radiusInteract(pos,r,f){
		if(m4.distanceSq(pos,this.pos)<=r*r)return f(this);
	}
	updateOcTree(t){
		if(t===this.ocTree)return;
		this.ocTree?.es.del(this);
		//this.ocTree?.checkClear();
		this.ocTree=t;
		t.es.push(this);
	}
}
let visible=1;
let render1=function(){
	objects=[];
	if(visible&1){
		for(let e of boids)e.render();
	}
	if(visible&2){
		ocTree.render();
	}
	renderObject(0,0,0,200);
	
	
	gl.useProgram(program);
	let tri_count=0;
	{
		let nb=0,b=0;
		objects.forEach(o=>{
			nb+=o.block.length;
		});
		let block=new Float32Array(nb);
		objects.forEach(o=>{
			block.set(o.block,b);
			b+=o.block.length;
		});
		renderData(program,{name:'block',type:'4f',data:block});
		tri_count=nb/4;
	}
	
	let M=m4.perspective(Math.PI/2,canvas.width/canvas.height,0.01,10000); 
	m4.multiply(M,m4.inverse(player.mat),M);
    renderData(program,{name:'mat',type:'Matrix4fv',data:[false,M]});
    renderData(program,{name:'pos_player',type:'3f',data:[...m4.transformVector(player.mat,[0,0,0,1])]});

	// Bind the attribute/buffer set we want.
	//gl.bindVertexArray(vao);
	
	gl.drawArrays(gl.TRIANGLES, 0,tri_count);//offset count
}
renderer.push(render1);

/*
let sub=document.createElement("input");
sub.type='submit';
sub.value='八叉树渲染开关';
sub.onclick=()=>{renderOcTree=!renderOcTree;sub.blur();};
div1.appendChild(sub);
*/
document.addEventListener("keydown",function(e){
	if(e.keyCode=='V'.charCodeAt(0)){
		visible=(visible+1)%4;
	}
});


let d=3,l=d*5;
for(let j=0;j<64;j++){
	let x0=(Math.random()*2-1)*100;
	let y0=(Math.random()*2-1)*100;
	let z0=(Math.random()*2-1)*100;
	for(let x=0;x<l;x+=d)
	for(let y=0;y<l;y+=d)
	for(let z=0;z<l;z+=d)
	{
		//let o={};
		//o.pos=new Float32Array([-1,-1,-1,1,-1,-2,0,1,-5+.01*C++]);
		//o.block=new Float32Array([1,0,0,0,1,0,0,0,1,0,0,0,]);
		//objects.push(o);
		boids.push(new Boid([x0+x+Math.random(),y0+y+Math.random(),z0-z+Math.random()]));
		
	}
}
let tick=function(dT){
	if(keyDowns["F".charCodeAt(0)])console.log(ocTree);
	for(let e of boids)e.tick(dT);
	ocTree.checkClear();
	//if(!ocTree.test(m4.transformVector(player.mat,[0,0,0,1]).slice(0,3),1))console.log('player out!');
};

let TPSDisplay=document.createElement("divTPS");
divDebugInf.appendChild(TPSDisplay);
ticker(tick,1/200,t=>{
	TPSDisplay.innerText='TPS:'+t.toFixed(3);
},.5);
});