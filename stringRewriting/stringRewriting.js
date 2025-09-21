/**@template T @param {T[]} a*/
function sample(a){return a[a.length*Math.random()>>>0]}
/**@template T @param {T[]} a*/
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/**@param {number[]} acc @param {number} x */
function binSearch(acc,x){let a=0,b=acc.length;while(a<=b){let m=a+b>>>1;if(acc[m]>x)b=m-1;else a=m+1;}return a;}

const RANDSELECTED=[...'\n\n\n\n====%%%%0123456789ABCDEF','%3D','%3D','%3D','%3D','%0A','%0A','%0A','%0A'];
function runRules(s,rules){
    for(let i=0;i<rules.length;i++){
        let r=rules[i],replaced=false;
        let s1=s.replace(r[0],x=>{replaced=true;return r[1]});
        if(replaced)return [s1,i];
    }
    return [s,-1]
}

/**
 * @template T
 * @param {number} width 
 * @param {number} height 
 * @param {(number,number)=>T} f 
 */
function grid2D(width,height,f){
    return Array.from(Array(height),(_,y)=>Array.from(Array(width),(_,x)=>f(x,y)))
}


globalThis.WORLD=grid2D(128,128,(x,y)=>'');


function tick(world,x0,y0){
    let size_change=0;
    let xs=Math.max(x0-1,0),xe=Math.min(x0+1,world[0].length-1),ys=Math.max(y0-1,0),ye=Math.min(y0+1,world.length-1);
    let self=world[y0][x0],selfRules=rulesOf(self);
    for(let y=ys;y<=ye;y++)
    for(let x=xs;x<=xe;x++){
        if(x0===x&&y0===y)continue;//不修改自己
        let s=world[y][x],s1=s;
        for(let step=0;step<64;step++){
            let ruleUsed,s1Old=s1;
            [s1,ruleUsed]=runRules(s1,selfRules);
            s1=s1.slice(0,1024);
            if(ruleUsed<0||s1===s1Old)break;
        }
        size_change+=s1.length-s.length;
        world[y][x]=s1;
    }
    if(size_change===0&&Math.random()<1/8)
    if(Math.random()<1/2){
        let i=Math.random()*(self.length+1)>>>0;
        let s=sample(RANDSELECTED);if(Math.random()>1/1024)s=s.slice(0,self.length-i);
        self=self.slice(0,i)+s+self.slice(i+s.length);
    }else{
        let other=world[(Math.random()*(ye-ys+1)|0)+ys][(Math.random()*(xe-xs+1)|0)+xs];
        let ri=Math.random(),rj=Math.random();if(ri>rj)[ri,rj]=[rj,ri];
        let i=ri*(self.length+1)>>>0,j=rj*(self.length+1)>>>0;
        let i1=ri*(other.length+1)>>>0,j1=rj*(other.length+1)>>>0;
        self=self.slice(0,i)+other.slice(i1,j1)+self.slice(j);
    }
    world[y0][x0]=self.slice(0,1024);
}

String.prototype.hash=function(){
    let h=0;
    for(let x of this)h=(h^x.charCodeAt(0))*0xdeece66d+0xb|0;
    return h;
}
globalThis.BUFFER=new Map([['',{color:'#000000',rules:[['','']].slice(1),tick:0}]]);
function clearBuffer(tick){
    for(let k of BUFFER.keys()){
        if(BUFFER.get(k).tick<tick-5)BUFFER.delete(k)
    }
}
function bufferOf(s){let buffer=BUFFER.get(s)??(BUFFER.set(s,{}),BUFFER.get(s));buffer.tick=TICK;return buffer}
function colorOf(s){return bufferOf(s).color??='#'+(s.hash()>>>8).toString(16).padStart(6,'0')}
function rulesOf(s){return bufferOf(s).rules??=(()=>{
    let rules=[];
    for(let line of s.split('\n')){
        let strs=line.split('=').map(unescape);
        for(let i=strs.length;--i>=1;)rules.push([strs[i-1],strs[i]]);
    };
    return rules
})()}


globalThis.TICK=0;
function randomIterOrder(world){let w=world[0].length,h=world.length,order=Array.from(Array(w*h),(_,i)=>[i%w,i/w|0]);shuffle(order);return order}
function tickLogic(){
    const width=WORLD[0].length,height=WORLD.length;
    for(let [x,y] of randomIterOrder(WORLD))tick(WORLD,x,y);
    let es=randomIterOrder(WORLD).map(([x,y])=>[x,y,WORLD[y][x].length,0]).filter(o=>o[2]>0);
    // let sum=0;for(let i=0;i<es.length;i++)es[i][3]=(sum+=es[i][2]);
    // let toClear=es.map(()=>0),acc=es.map(o=>o[3]);
    // for(let needClear=es.length-width*height*.25|0;needClear>0;){
    //     let i=binSearch(acc,Math.random()*sum);if(!toClear[i]){toClear[i]=1;needClear--;}
    // }
    // es.map(([x,y,len,acc],i)=>{if(toClear[i]){let s=WORLD[y][x];WORLD[y][x]=s.slice(0,s.length*.5);}});
    es.slice(width*height/4).map(([x,y,len,acc],i)=>{let s=WORLD[y][x];WORLD[y][x]=s.slice(0,s.length*.5);});
    clearBuffer(TICK);TICK++;
}


const canvas=document.getElementById('canvas');
/** @type {CanvasRenderingContext2D}*/
const ctx=canvas.getContext("2d");

function renderLogic(){
	let WORLD=globalThis.WORLD;
    const width=WORLD[0].length,height=WORLD.length;
	const cellSize=6;
	canvas.width=width*cellSize;canvas.height=height*cellSize;

    ctx.clearRect(0, 0, width, height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        let E=WORLD[y][x];
        ctx.fillStyle=colorOf(E);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
}



globalThis.uneval=function(x,recorded=new Map()){
    let codes=[];let allocVar=(prefix,val)=>{let v=prefix+recorded.size;recorded.set(val,v);return v;}
    let numToString=n=>OPCODE_TO_NAME.get(n)??(Math.abs(n)<0x8000?n.toString():'0x'+(n>>>0).toString(16)+'|0');
    let recursiveUneval=x=>{
        switch(typeof x){
            case "string":return JSON.stringify(x);case "boolean":case "number":case "undefined":return String(x);case "bigint":return x<1n<<20n&&x>-1n<<20n?String(x)+'n':'0x'+x.toString(16)+'n';
            case "symbol":throw new TypeError('cannot serialize symbol');case "function":throw new TypeError('cannot serialize function');
            case "object":
                if(recorded.has(x))return recorded.get(x);
                if(x instanceof Array){
                    let innerPart=x.map(x=>recursiveUneval(x)).join(',');let v=allocVar('a',x);codes.push('var '+v+'=['+innerPart+'];');return v;
                }
                if(x.constructor===Object){
                    let kvs=[];
                    for(let key in x)kvs.push((/^[a-zA-Z0-9_$]+$/.test(key)?key:JSON.stringify(key))+':'+recursiveUneval(x[key]));
                    let v=allocVar('o',x);codes.push('let '+v+'={'+kvs.join(',')+'};');return v;
                }
                throw new TypeError('cannot serialize type '+x.constructor.name+'='+x.constructor);
        }

    }
    codes.push('return '+recursiveUneval(x));return codes.join('\n');
}



globalThis.worldToSerializable=function(world){return world}
globalThis.worldFromSerializable=function(w){return w}

export {tickLogic,renderLogic}