function part(l,n,a){let d=l/n;return [~~(a*d),~~((a+1)*d)-~~(a*d)]}

let RAF=(window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(callback){window.setTimeout(callback, 1000 / 60);}).bind(window);
let ctx,imgData;
function updateRender(p){
	let e=env.get(p);
	let xp=part(canvas.width,env.lenX,p.x);
	let yp=part(canvas.height,env.lenY,p.y);
	let xl=xp[1],yl=yp[1];
	let ixl=1/xl,iyl=1/yl;
	let r=e instanceof Object&&e.render instanceof Function;
	for(let b=0;b<yl;b++)
	for(let a=0;a<xl;a++){
		let i=4*(a+xp[0]+(b+yp[0])*canvas.width);
		
		let f;
		if(r)f=e.render((a+.5)*ixl,(b+.5)*iyl,xl,yl);
		if(f instanceof Array){
			imgData.data[i]=f[0]*256;
			imgData.data[i+1]=f[1]*256;
			imgData.data[i+2]=f[2]*256;
			imgData.data[i+3]=f[3]*256;
		}else{imgData.data[i]=imgData.data[i+1]=imgData.data[i+2]=imgData.data[i+3]=0;}
	}
}
function render(){
	//if(!renderAll)
	//	for(let p of upd)updateRender(p);
	for(let x=0;x<env.lenX;x++)
	for(let y=0;y<env.lenY;y++){
		updateRender(env.getBlock(x,y));
	}
	ctx.putImageData(imgData, 0, 0);
	RAF(render);
}
initFunctions.push(function(){
    ctx = canvas.getContext('2d');
	imgData=ctx.getImageData(0, 0, canvas.width, canvas.height);
	render();
});