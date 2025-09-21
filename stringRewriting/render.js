import {Entity} from './myLang.js';
/**@typedef {import('./myLang.js').Memory} Memory */

Int32Array.prototype.hash=function(){return this.HASH??=(()=>{
    let h=0;
    for(let x of this)h=(h^x)*0xdeece66d+0xb|0;
    for(let [i,x] of this.ptrs){h=(h^i^x.hash())*0xdeece66d+0xb|0;}
    return h;
})();}
Int32Array.prototype.color=function(){return this.COLOR??='#'+(this.hash()>>>8).toString(16).padStart(6,'0')}
const canvas=document.getElementById('canvas');
/** @type {CanvasRenderingContext2D}*/
const ctx=canvas.getContext("2d");

function renderLogic(){
	/**@type {Entity[][]} */
	let WORLD=globalThis.WORLD;
    const width=WORLD[0].length,height=WORLD.length;
	const cellSize=6;
	canvas.width=width*cellSize;canvas.height=height*cellSize;

    let colors=Array.from(Array(8),(_,i)=>'#'+(i&4?'FF':'00')+(i&2?'FF':'00')+(i&1?'FF':'00'));
    ctx.clearRect(0, 0, width, height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        let E=WORLD[y][x];
        ctx.fillStyle=E.program.color();//区分不同生命程序
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        ctx.fillStyle=colors[(E.program.length>0)<<2|(E.energy>0)<<1|(E.score.length>0)];
        // ctx.fillStyle=colors[E.question>32?7:E.question<0?4:0];
        ctx.fillRect(x * cellSize+2, y * cellSize+2, 2, 2);

    }
}
export {renderLogic}