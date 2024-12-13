class Env{
	static len=256;
	static mod(x){return x&255;}
	static N=0;
	constructor(e){
		if(e){
			this.mem=e.mem.slice(0);
			this.insPointer=e.insPointer;
			this.data=e.data;
		}else
			this.mem=new Int32Array(Env.len);
		this.name='env'+Env.N++;
	}
	insPointer=0;
	data=0;
	printBuffer=[];
	tick(){
		if(this.done)return;
		
			
			
		let m=this.mem;
		//if(!(this.insPointer>=0&&this.insPointer<m.length)){this.print('done!');this.done=true;return;}
		this.data=Env.mod(this.data);
		this.insPointer=Env.mod(this.insPointer);
		
		let i=this.data;
		let ins=m[this.insPointer];
		
		let a=0,b=0;
		
		
		
		
		
		
		while(ins){
			let un=ins&1;
			let j=0;
			while((ins>>>=1)&1)j++;
			ins>>>=1;
			if(un)i+=~j;else i+=j;
			
			
			if((ins>>>=1)&1){
				
				if((ins>>>=1)&1){
					a=m[i];
				}else{
					[m[i],a]=[a,m[i]];
				}
				
			}else{
				if((ins>>>=1)&1){
					
					if((ins>>>=1)&1){//calc start

						if((ins>>>=1)&1){
							if((ins>>>=1)&1){
								if((ins>>>=1)&1){
									m[i]+=a;
								}else{
									m[i]-=a;
								}
							}else{
								if((ins>>>=1)&1){
									m[i]*=a;
								}else{
									m[i]/=a;
								}
							}
						}else{
							if((ins>>>=1)&1){
								if((ins>>>=1)&1){
									m[i]%=a;
								}else{
									m[i]=-m[i];
								}
							}else{
								if((ins>>>=1)&1){
									a=m[i]<=a;
								}else{
									a=!a;
								}
							}
						}

					}else{

						if((ins>>>=1)&1){
							if((ins>>>=1)&1){
								if((ins>>>=1)&1){
									if((ins>>>=1)&1){
										m[i]&=a;
									}else{
										m[i]|=a;
									}
								}else{
									if((ins>>>=1)&1){
										m[i]^=a;
									}else{
										m[i]=~m[i];
									}
								}
							}else{
								if((ins>>>=1)&1){
									if((ins>>>=1)&1){
										m[i]=~~(Math.random()*4294967296);
									}else{
										m[i]=Env.len;
									}
								}else{
									if((ins>>>=1)&1){
										m[i]<<=a;
									}else{
										m[i]>>>=a;
									}
								}
							}
						}else{
							if((ins>>>=1)&1){
								m[i]--;
							}else{
								m[i]++;
							}
						}

					}//calc end
					
				}else{
					if((ins>>>=1)&1){
						
						if((ins>>>=1)&1){
							if((ins>>>=1)&1){//pointer start
								if((ins>>>=1)&1){
									if((ins>>>=1)&1){
										if(!a){this.insPointer++;break;}
									}else{
										if(!a){this.insPointer--;break;}
									}
								}else{
									if((ins>>>=1)&1){
										if(a){this.insPointer=m[i];break;}
									}else{
										m[i]=this.insPointer;
									}
								}
							}else{
								if((ins>>>=1)&1){
									if((ins>>>=1)&1){
										i=0;
									}else{
										i=m[i];
									}
								}else{
									if((ins>>>=1)&1){
										a=i;
									}else{
										[i,a]=[a,i];
									}
								}
							}//pointer end
						}else{
							if((ins>>>=1)&1){
								this.printBuffer.push(m[i]+'\n');
								m[i]=100;//result
							}else{
								if((ins>>>=1)&1)
									m[i]=1000;
								else
									m[i]=10;
							}
						}
						
					}else{
						
						if((ins>>>=1)&1){
							b=a;
						}else{
							[a,b]=[b,a];
						}
						
					}
				}	
			}


			
			
		}



		
		
		
		this.data=i;
		
		this.insPointer++;
		
		
	}
	render(){
		this.updateCode(this.mem);
		this.printBuffer.forEach(s=>this.print(s));
		this.printBuffer=[];
	}
	print(...x){console.log(...x)};
	updateCode(o){}
	
}

(()=>{
	
	for(let j=0;j<12;j++){
		envs.push(new Env());
	}
	envs.forEach(e=>{
		e.mem.forEach((v,k)=>{
			e.mem[k]=~~(Math.random()*4294967296);
		});
	});
})();