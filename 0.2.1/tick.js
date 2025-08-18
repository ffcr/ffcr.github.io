/**@template T @param {T[]} a*/
function sample(a){return a[a.length*Math.random()>>>0]}
/**@template T @param {T[]} a*/
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/**@param {Entity[][]} dst @param {Entity[][]} src*/
function copyWorldRegion(dst,src,xd,yd,x0,y0,x1,y1){
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
        let destX=xd+(x-x0),destY=yd+(y-y0),E=dst[destY][destX],E1=src[y][x];
        E.program=E1.program;E.energy=E1.energy;E.score=E1.score;
    }
}

globalThis.LOG=1;
globalThis.BASIC_ENERGY=1000;globalThis.REWARD_FOR_CORRECT=100000;
globalThis.INITIAL_ENERGY=10000;


/**@typedef {import('./myLang.js').Memory} Memory */
import {Entity,newWorld,copyWorld,randMem} from './myLang.js';
Int32Array.prototype.fileTreeSize=function(){
    try{
        return this.FILE_TREE_SIZE??=this.length+10*this.ptrs.size+(this.ptrs.size===0?0:this.ptrs.values().map(x=>x.fileTreeSize()).reduce((x,y)=>x+y));
    }catch(e){
        if(e.message==="Maximum call stack size exceeded"){console.log('生命程序出现循环引用，体积设为无穷');return this.FILE_TREE_SIZE??=Infinity;}
        else throw e;
    }
}

const randInt=()=>Math.random()<.2?(Math.random()*50-25|0):0x80000000|(Math.random()*OPCODE_TO_INSTRUCTION.size);
/**@param {Memory} mem */
function diffMem(mem){
    let arr=Array.from(mem),ptrs=new Map(mem.ptrs);
    if(mem.length===0||Math.random()<.5){
        // p[p.length*Math.random()>>>0]=NAME_TO_OPCODE.get('E_READ_QUESTION');
        let DIFF_LEN=Math.random()*10+1|0;let mode=mem.length===0?1:(Math.random()*3|0)-1;
        switch(mode){
            case  1:arr.splice(arr.length*Math.random()>>>0,0,...Array.from(Array(DIFF_LEN),()=>randInt()));break;
            case  0:arr.splice(arr.length*Math.random()>>>0,DIFF_LEN,...Array.from(Array(DIFF_LEN),()=>randInt()));break;
            case -1:arr.splice(arr.length*Math.random()>>>0,DIFF_LEN);break;
        }
    }else{
        let mode=ptrs.size===0?1:(Math.random()*3|0)-1;
        switch(mode){
            case  1:ptrs.set(randInt(),diffMem(ZERO_MEMORY));break;
            case  0:let k=sample([...ptrs.keys()]);ptrs.set(k,diffMem(ptrs.get(k)));
            case -1:ptrs.delete(sample([...ptrs.keys()]));break;
        }
    }
    let result=new Int32Array(arr);result.ptrs=ptrs;return result;
}
function sampleNearR(world,x0,y0,r){
    let wh=r*2+1,p=Math.random()*wh*wh|0,x=x0+(p%wh)-r,y=y0+(p/wh|0)-r;
    return world[Math.min(Math.max(0,y),world.length-1)][Math.min(Math.max(0,x),world[0].length-1)];
}

console.log('开始加载世界');

globalThis.WORLD=newWorld(256,256);
globalThis.ROUND=0;

/**@param {Entity[][]} world*/
function randomIterOrder(world){let w=world[0].length,h=world.length,order=Array.from(Array(w*h),(_,i)=>[i%w,i/w|0]);shuffle(order);return order}

function tickLogic(){
    const w=WORLD[0].length,h=WORLD.length;let hasE=(x,y)=>x>=0&&x<w&&y>=0&&y<h&&WORLD[y][x].program.length;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        let E=WORLD[y][x];let count=0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(hasE(x+dx,y+dy))count++;
        E.score=count===3?2:count===2?1:0;//类似于b3s23的规则：附近有3个则得分最高，有2个其次。
    }
    for(let [x,y] of randomIterOrder(WORLD)){let E=WORLD[y][x];E.tick();}
    let Es=[];
    for(let [x,y] of randomIterOrder(WORLD)){
        let E=WORLD[y][x];
        if(E.program.length)Es.push(E);else if(Math.random()<.001){E.program=randMem(30,2)}
    }
    Es.sort((a,b)=>b.score-a.score);
    for(let i=w*h*0.1|0;i<Es.length;i++){let toKill=Es[i];toKill.program=ZERO_MEMORY;toKill.energy=0;}
    for(let i=0,l=Math.min(Es.length,w*h*0.05|0);i<l;i++){let E=Es[i];E.energy+=50000;}
}
export {tickLogic}