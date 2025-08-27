function floormod(x,y){
	x=~~x;
	return x>=0?x%y:x%y+y;
}


function applyRotation([x,y], r) {return [[x,y],[-y,x],[-x,-y],[y,-x]][r]}//[y,-x,-y,x,y].slice(3-r,3-r+2)
function inverseTransform(T) {
  const rInv = -T[2]&3;
  const tInv = applyRotation([T[0], T[1]], rInv);
  return [ -tInv[0], -tInv[1], rInv ];
}
function composeTransforms(T1, T2) {
  const r = (T2[2] + T1[2]) & 3;
  const t1Rot = applyRotation([T1[0], T1[1]], T2[2]);
  return [ T2[0] + t1Rot[0], T2[1] + t1Rot[1], r ];
}


let upd=[];
let env={
	get:function(p){return this.data[p.index];},
	set:function(p,e){
		this.data[p.index]=e;
		this.update(p);
	},
	update:function(p){
		upd.push(p);
	},
	getBlock:function(rx,ry){
		let x=floormod(rx,this.lenX);
		let y=floormod(ry,this.lenY);
		let i=x+y*this.lenX;
		return this.blockBuffer[i]||(this.blockBuffer[i]=new this.Block(x,y,i));
		//return new this.Block(x,y,i);
	},
	Block:class{
		constructor(x,y,i){
			this.x=x;
			this.y=y;
			this.index=i;
		}
		pos(x,y){
			return env.getBlock(this.x+x,this.y+y);
		}
		get E(){
			return env.get(this);
		}
		set E(e){
			env.set(this,e);
		}
		near4(){return [this.pos(-1,0),this.pos(1,0),this.pos(0,-1),this.pos(0,1),];}
		near5(){return [this,this.pos(-1,0),this.pos(1,0),this.pos(0,-1),this.pos(0,1),];}
		near8(){return [this.pos(-1,0),this.pos(1,0),this.pos(0,-1),this.pos(0,1),this.pos(-1,-1),this.pos(1,1),this.pos(1,-1),this.pos(-1,1)];}
		near9(){return [this,this.pos(-1,0),this.pos(1,0),this.pos(0,-1),this.pos(0,1),this.pos(-1,-1),this.pos(1,1),this.pos(1,-1),this.pos(-1,1)];}
		nearR(r,self,func){
			let a=[];
			for(let x=-r;x<=r;x++)
			for(let y=-r;y<=r;y++){
				let p=this.pos(x,y);
				if((self||x!=0||y!=0)&&(func===undefined||func(p)))a.push(p);
			}
			return a;
		}
	},
};

initFunctions.push(function(){
    this.lenX=canvas.width/4;this.lenY=canvas.height/4;
    this.data=Array(this.lenX*this.lenY);
    this.blockBuffer=Array(this.data.length);
    /*test*/
    let k=0;
    for(let y=0;y<this.lenY;y++)
    for(let x=0;x<this.lenX;x++){
        this.data[k++]='('+x+','+y+')';
    }
}.bind(env));