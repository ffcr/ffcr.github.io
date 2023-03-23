

//READ1 WRITE1(&push) WRITENULL(pop) CLRLIST +-*/&|^(pop) }IF(list[0]){ }{ 
//-128~127
function limit(x){x=x&15;if(x&8)x=~(x&7);return x;}
function ranCmd(){
	let l=arguments.callee.list;
	if(!l){
		l=[];
		for(let j=0;j<2;j++)l=l.concat(['}{','}if(this.stack.pop()){','}if(this.stack.pop()){','}if(this.stack.pop()){','}if(this.stack.pop()){','this.stack=[]']);
		for(let j=0;j<5;j++)for(let a of ['0','1','1','-1','2','2','-2','3','-3',]){
			l.push('this.stack.push('+a+')');
		}
		for(let j=0;j<8;j++)for(let a of ['limit(Math.random()*16)','limit(Math.log2(this.energy))','this.look(this.eye_x,this.eye_y)','this.look(this.eye_x,this.eye_y)','this.look(this.eye_x,this.eye_y)',]){
			l.push('this.stack.push('+a+')');
		}
		
		for(let j=0;j<2;j++)for(let a of ['var_a','var_a','var_a','var_a','var_b','var_b','var_c','var_d']){
			l.push('this.stack.push(this.'+a+')');
			l.push('this.'+a+'=limit(this.stack.pop())');
		}
		for(let j=0;j<8;j++)for(let a of ['ACTION','ACTION','eye_x','eye_y']){
			l.push('this.'+a+'=limit(this.stack.pop())')
		}
		
		for(let j=0;j<2;j++)for(let a of ['+','-','*','/','%','&','|','^','>','<','>=','<=','==','!=']){
			l.push('\''+a+'\';var b=this.stack.pop(),a=this.stack.pop();this.stack.push(limit(a'+a+'b));');
		}
		arguments.callee.list=l;
	}
	return l.sample();
}
function compile(g){
	let s='{\n';
	
	for(let c of g)s+=c+'\n';
	
	s+='}';
	return new Function(s);
}

let energy_mul=1;

class Life{
	static DIE='DIE';
	constructor(a,h){
		if(typeof a=="number"){this.gene=[];for(let t=0;t<a;t++)this.gene.push(ranCmd());}
		else this.gene=a;
		this.program=compile(this.gene);
		this.direction=[[1,0],[0,1]];
		for(let j=0,k=~~(4*Math.random());j<k;j++)this.direction=math.multiply(this.direction,[[0,1],[-1,0]]);
		this.energy=h?h:1;
		this.age=0;
		
		this.eye_x=0;
		this.eye_y=1;
		this.stack=[];
	}
	spawn(){
		let g=this.gene.concat();
		for(let a=0;a<=g.length;a++){
			let r=Math.random()*20;
			if(r>=1)continue;
			if(r<.4)
			g.splice(a,1,ranCmd());//replace
			else if(r<.7)
			g.splice(a,0,ranCmd());//add
			else
			g.splice(a,1);//delete
		}
		let h=this.energy*.25;
		this.energy-=h;

		return new Life(g,h);
	}
	look(x,y){
		let e=this.pos.pos(...math.multiply(this.direction,[x,y])).E;
		switch(e?.constructor){
			case Life:return -1;
			case Plant:return 1;
			case Stone:return 2;
			default:return 0;
		}
	}
	cost(x){
		if(!((this.energy-=x)>0))throw Life.DIE;
	}
	behavior(p){
		this.age+=1;
		this.pos=p;
		this.stack=[];
		this.ACTION=0;
		
		this.cost(.00001*(this.gene.length+16));
		this.program.call(this);
		
		if(this.ACTION==0){
			let p1=p.pos(...math.multiply(this.direction,[0,1]));
			
			if(p1.E instanceof Plant){
				this.energy+=p1.E.energy*energy_mul;
				this.cost(.05);
				p.E=undefined;
				p1.E=this;
			}else if(p1.E instanceof Life){
				this.cost(this.energy*.05);
				p.E=p.E;
				let attack=this.energy*.3;
				attack=Math.min(p1.E.energy,attack);
				p1.E.energy-=attack;
				this.energy+=.8*attack;
			}else if(p1.E instanceof Stone){
				this.cost(1);
				p.E=p.E;
				// let p2=p.pos(...math.multiply(this.direction,[0,2]));
				// if(p2.E?.tick)
				// 	p.E=p.E;
				// else{
				// 	p.E=p2.E;
				// 	p2.E=p1.E;
				// 	p1.E=this;
				// }
			}else{
				this.cost(.01);
				p.E=p1.E;
				p1.E=this;
			}
			return;
		}
		if(this.ACTION==1){
			this.cost(.01);
			this.direction=math.multiply(this.direction,[[0,1],[-1,0]]);
		}
		if(this.ACTION==-1){
			this.cost(.01);
			this.direction=math.multiply(this.direction,[[0,-1],[1,0]]);
		}
		/*if(this.ACTION==-1){
			this.energy-=.1;
			let p1s=p.near8().filter(p1=>(p1.E instanceof Plant));
			//if(p1s.length){console.log(select=p);ticking=false;}
			for(let p1 of p1s){let e=p1.E.energy*.5;this.energy+=e;p1.E.energy-=e;}
		}*/
		//if(this.ACTION==1||this.ACTION==-1)
		if(this.ACTION>1||this.ACTION<-1)
		{
			let spawn_cost=.1*(this.gene.length+16);
			if(this.energy>spawn_cost+1){
				let p1s=p.near8().filter(p1=>!(p1.E instanceof Object));
				if(p1s.length>0){
					this.cost(spawn_cost);
					p1s.sample().E=this.spawn();
				}
			}
		}
		p.E=p.E;
	}
	tick(p){
		try{
			this.behavior(p);
		}catch(e){
			if(e===Life.DIE){
				if(p.E!=this)throw new Error('p.E moved before die process,in('+p.x+","+p.y+")");
				return p.E=undefined;
			}else throw e;
		}
		
	}
	render(x,y,xl,yl){x-=.5;x*=2;y-=.5;y*=2;[x,y]=math.multiply([x,y],this.direction);let t=y<0?1:1-x*x-y*y;return [t,t*.1*this.energy,t*.03*this.energy,1];}
}
class Plant{
	constructor(h){
		this.energy=h;
		this.wait_time=0;
	}
	tick(p){
		if((this.energy+=.002)<.01)return p.E=null;
		env.update(p);
		if((this.wait_time-=1/60)>0)return;
		if(this.energy>0.5&&Math.random()<.1){
			let arr=p.nearR(2,false,e=>!(e.E?.tick)&&e.nearR(2,false,e=>e.E instanceof Plant).length<2);
			if(arr.length){
				let p1=arr.sample();
				let a=this.energy*.02;
				this.energy-=a;
				p1.E=new Plant(a);
			}else{
				let arr=p.near4().filter(p1=>(p1.E instanceof Stone));
				if(arr.length){
					let p1=arr.sample();
					let arr2=p1.near4().filter(p2=>!(p2.E?.tick));
					if(arr2.length){
						let p2=arr2.sample();
						[p1.E,p2.E]=[p2.E,p1.E];
					}
				}
				this.wait_time=Math.random()*10;
			}
		}
	}
	render(x,y){
		//let a=Math.sin(0.003*this.energy*this.time)*.4+.6;
		//let a=Math.log(this.energy)-.1;
		let a=this.energy;
		return [0.2,a*.8+.2,0.2,1];
	}
}
class Stone{
	constructor(){
		
	}
	tick(p){

	}
	render(x,y){
		return [.75,.75,.75,1];
	}
}

let random_add=function(f){
	let b=env.getBlock(~~(Math.random()*env.lenX),~~(Math.random()*env.lenY));
	if(b.E?.tick)return;
	b.E=f();
}
initFunctions.push(function(){
	//start.toString().split(/{|}|;/).map(e=>e.replaceAll(/\t|\n/g,'')).filter(e=>e);
	for(let a=env.lenX*env.lenY*.1;--a>=0;)random_add(()=>new Plant(1));
	for(let a=env.lenX*env.lenY*.1;--a>=0;)random_add(()=>new Life(10,5));
	for(let a=env.lenX*env.lenY*.1;--a>=0;)random_add(()=>new Stone());
})
tickFunctions.push(function(){
	if(Math.random()<.001)random_add(()=>Math.random()<.5?new Life(10,5):new Plant(1));
})