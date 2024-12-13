function timerStart(){return new Date().getTime();}
function timerEnd(t){return timerStart()-t;}

Math.floormod=function(x,y){
	//if((y&(y-1))==0)return (y-1)&x;
	x=~~x;
	return x>=0?x%y:x%y+y;
}
Math.part=function(l,n,a){let d=l/n;return [~~(a*d),~~((a+1)*d)-~~(a*d)]}//return start,len
Math.polar2Cartesian=function(r,a){return {x:r*Math.cos(a),y:r*Math.sin(a)};}
Math.cartesian2Polar=function (x, y){
    return { r:Math.sqrt(x*x + y*y), a:Math.atan2(y,x) };
}
Math.dist2=function(a,b){let s=0;for(let i in a){s+=(a[i]-b[i])**2;};return s;}
Math.dist=function(a,b){return Math.dist2(a,b)**0.5;}
Math.norm=function(a,r){let s=0;for(let i in a){s+=a[i]*a[i];};if(s==0)console.log('Math.norm zero');s=r/Math.sqrt(s);for(let i in a){a[i]*=s;}}
Math.add=function(a,b){let s={};for(let i in a){s[i]=a[i]+b[i];};return s;}
Math.sub=function(a,b){let s={};for(let i in a){s[i]=a[i]-b[i];};return s;}
Math.addEq=function(a,b){for(let i in a){a[i]+=b[i];}}
Math.subEq=function(a,b){for(let i in a){a[i]-=b[i];}}
Array.prototype.shuffle = function() {
  let m = this.length, i;
  while (m) {
    i = (Math.random() * m--) >>> 0;
    [this[m], this[i]] = [this[i], this[m]]
  }
  return this;
}
Array.prototype.shufflefor = function(f) {
  let m = this.length, i;
  while (m) {
    i = (Math.random() * m--) >>> 0;
    [this[m], this[i]] = [this[i], this[m]]
	if(f(this[m]))break;
  }
  return this.length-m;
}
Array.prototype.unique=function(){
	let ret=[];
	for (let i = 0;i<ar.length;i++){
		if (ret.findIndex(o=>o==ar[i])<0){
			ret.push(ar[i]);
		}
	}
	return ret;
}
Array.prototype.sample=function(func/*,count*/){
	if(!func){
		return this[~~(Math.random()*this.length)];
	}
	let total=0;
	let fs=Array(this.length);
	for(let a=0;a<this.length;a++)total+=(fs[a]=func(this[a]));
	
	//if(count===undefined)count=1;
	//let rans=Array(count);
	//for(let a=0;a<count;a++)rans[a]=Math.random()*total;
	let ran=Math.random()*total;
	let n=0;
	for(let a of fs)if(ran>a){
		ran-=a;
		n++;
	}else{
		ran/=a;
		break;
	}
	return [this[n],ran];
}
Array.prototype.last=function(a){
	if(a===undefined)return this[this.length-1];
	else return this[this.length-a-1];
}
Array.prototype.del=function(a){
	let i=this.indexOf(a);
	if(i===-1)return;
	this.splice(i,1);
	return i;
}
for(let t of [[[],Array.prototype],[Math,Math]])for(let a in t[0])Object.defineProperty(t[1],a,{
	enumerable:false
});


function upload(input,func) {
	if (window.FileReader) {
		var file = input.files[0];
		filename = file.name.split(".")[0];
		var reader = new FileReader();
		reader.onload = func;
		reader.readAsText(file);
	}else alert('不支持FileReader！');
}