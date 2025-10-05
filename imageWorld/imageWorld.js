/**@template T @param {T[]} a*/
function sample(a){return a[a.length*Math.random()>>>0]}
/**@template T @param {T[]} a @returns {T} */
function randTakeOut(a){let i=a.length*Math.random()>>>0,j=a.length-1;[a[i],a[j]]=[a[j],a[i]];return a.pop()}
/**@template T @param {T[]} a*/
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/**@param {number[]} acc @param {number} x */
function binSearch(acc,x){let a=0,b=acc.length;while(a<=b){let m=a+b>>>1;if(acc[m]>x)b=m-1;else a=m+1;}return a;}
/**@param {number[][]} vecs */
function vectorsInfo(vecs){
    let dim=vecs[0].length,avg=Array.from(Array(dim),()=>0);for(let v of vecs)for(let i=0;i<dim;i++)avg[i]+=v[i];for(let i=0;i<dim;i++)avg[i]/=vecs.length;
    let dist2=vecs.map(v=>v.reduce((s,x,i)=>s+(x-avg[i])**2,0)),std=(dist2.reduce((x,y)=>x+y,0)/vecs.length)**.5;
    return {avg,std,vectors:vecs.map((v,i)=>({vector:v,dist2:dist2[i]}))}
}


/**@param {number} h @param {number} s @param {number} v  */
function hsvToRgb(h, s, v) {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: return [v, t, p];
        case 1: return [q, v, p];
        case 2: return [p, v, t];
        case 3: return [p, q, v];
        case 4: return [t, p, v];
        case 5: return [v, p, q];
        default:throw [h,s,v]
    }
}


String.prototype.hash=function(){
    let h=0;
    for(let x of this)h=(h^x.charCodeAt(0))*0xdeece66d+0xb|0;
    return h;
}


globalThis.uneval=function(x){
    switch(typeof x){
        case "string":return JSON.stringify(x);case "boolean":case "number":case "undefined":return String(x);case "bigint":return x<1n<<20n&&x>-1n<<20n?String(x)+'n':'0x'+x.toString(16)+'n';
        case "symbol":throw new TypeError('cannot serialize symbol');
        case "function":
            // if(x.name==='anonymous')return '('+x.toString()+')';
            if(typeof x.uneval==='function')return x.uneval();
            throw new TypeError('cannot serialize unknown function');
        case "object":
            if(x==null)return 'null';
            if(x.constructor===Array)return '['+x.map(x=>uneval(x)).join(',')+']';
            if(x.constructor===Object){
                let kvs=[];
                for(let key in x)kvs.push((/^[a-zA-Z0-9_$]+$/.test(key)?key:JSON.stringify(key))+':'+uneval(x[key]));
                return '({'+kvs.join(',')+'})'
            }
            if(typeof x.uneval==='function')return x.uneval();
            throw new TypeError('cannot serialize type '+x.constructor.name+'='+x.constructor);
    }
}


globalThis.INSTS=new Map([
    ['+',{type:'nnn',fn:(x,y)=>'('+x+'+'+y+')'}],
    ['-',{type:'nnn',fn:(x,y)=>'('+x+'-'+y+')'}],
    ['*',{type:'nnn',fn:(x,y)=>'('+x+'*'+y+')'}],
    ['/',{type:'nnn',fn:(x,y)=>'('+x+'/'+y+')'}],
    ['%',{type:'nnn',fn:(x,y)=>'('+x+'%'+y+')'}],
    ['&',{type:'nnn',fn:(x,y)=>'('+x+'&'+y+')'}],
    ['|',{type:'nnn',fn:(x,y)=>'('+x+'|'+y+')'}],
    ['^',{type:'nnn',fn:(x,y)=>'('+x+'^'+y+')'}],
    ['<<',{type:'nnn',fn:(x,y)=>'('+x+'<<'+y+')'}],
    ['>>',{type:'nnn',fn:(x,y)=>'('+x+'>>'+y+')'}],
    ['>>>',{type:'nnn',fn:(x,y)=>'('+x+'>>>'+y+')'}],
    ['==',{type:'nnn',fn:(x,y)=>'('+x+'=='+y+'?1:0)'}],
    ['!=',{type:'nnn',fn:(x,y)=>'('+x+'!='+y+'?1:0)'}],
    ['>',{type:'nnn',fn:(x,y)=>'('+x+'>'+y+'?1:0)'}],
    ['<',{type:'nnn',fn:(x,y)=>'('+x+'<'+y+'?1:0)'}],
    ['>=',{type:'nnn',fn:(x,y)=>'('+x+'>='+y+'?1:0)'}],
    ['<=',{type:'nnn',fn:(x,y)=>'('+x+'<='+y+'?1:0)'}],
    ['min',{type:'nnn',fn:(x,y)=>'Math.min('+x+','+y+')'}],
    ['max',{type:'nnn',fn:(x,y)=>'Math.max('+x+','+y+')'}],
    ['&&',{type:'nnn',fn:(x,y)=>'('+x+'&&'+y+')'}],
    ['||',{type:'nnn',fn:(x,y)=>'('+x+'||'+y+')'}],
    ['?:',{type:'nnnn',fn:(cond,t,f)=>'('+cond+'?'+t+':'+f+')'}],
    ['~',{type:'nn',fn:(x)=>'(~'+x+')'}],
    ['!',{type:'nn',fn:(x)=>'(+!'+x+')'}],
    ['neg',{type:'nn',fn:(x)=>'(-'+x+')'}],
    ['+1',{type:'nn',fn:(x)=>'('+x+'+1)'}],
    ['-1',{type:'nn',fn:(x)=>'('+x+'-1)'}],
    ['*2',{type:'nn',fn:(x)=>'('+x+'*2)'}],
    ['/2',{type:'nn',fn:(x)=>'('+x+'/2)'}],
    ['floor',{type:'nn',fn:(x)=>'Math.floor('+x+')'}],
    ['ceil',{type:'nn',fn:(x)=>'Math.ceil('+x+')'}],
    ['round',{type:'nn',fn:(x)=>'Math.round('+x+')'}],
    ['sqrt',{type:'nn',fn:(x)=>'Math.sqrt('+x+')'}],
    ['sin',{type:'nn',fn:(x)=>'Math.sin('+x+')'}],
    ['cos',{type:'nn',fn:(x)=>'Math.cos('+x+')'}],
    ['tan',{type:'nn',fn:(x)=>'Math.tan('+x+')'}],
    ['asin',{type:'nn',fn:(x)=>'Math.asin('+x+')'}],
    ['acos',{type:'nn',fn:(x)=>'Math.acos('+x+')'}],
    ['atan',{type:'nn',fn:(x)=>'Math.atan('+x+')'}],
    ['atan2',{type:'nnn',fn:(x,y)=>'Math.atan2('+x+','+y+')'}],
    ['pow',{type:'nnn',fn:(x,y)=>'Math.pow('+x+','+y+')'}],
    ['exp',{type:'nn',fn:(x)=>'Math.exp('+x+')'}],
    ['log',{type:'nn',fn:(x)=>'Math.log('+x+')'}],
    ['rand',{type:'n',fn:()=>'Math.random()'}],
    ['rand2',{type:'n',fn:()=>'(Math.random()<.5?1:0)'}],
    ['time',{type:'n',fn:()=>'(new Date()*.001)'}],
    ['0',{type:'n',fn:()=>'0'}],
    ['1',{type:'n',fn:()=>'1'}],
    ['2',{type:'n',fn:()=>'2'}],
    ['3',{type:'n',fn:()=>'3'}],
    ['4',{type:'n',fn:()=>'4'}],
    ['5',{type:'n',fn:()=>'5'}],
    ['6',{type:'n',fn:()=>'6'}],
    ['7',{type:'n',fn:()=>'7'}],
    ['8',{type:'n',fn:()=>'8'}],
    ['9',{type:'n',fn:()=>'9'}],
    ['-1',{type:'n',fn:()=>'(-1)'}],
    ['-2',{type:'n',fn:()=>'(-2)'}],
    ['-3',{type:'n',fn:()=>'(-3)'}],
    ['-4',{type:'n',fn:()=>'(-4)'}],
    ['a',{type:'n',fn:()=>'a'}],
    ['b',{type:'n',fn:()=>'b'}],
    ['c',{type:'n',fn:()=>'c'}],
    ['d',{type:'n',fn:()=>'d'}],
    ['a=',{type:'nn',fn:(x)=>'(a='+x+')'}],
    ['b=',{type:'nn',fn:(x)=>'(b='+x+')'}],
    ['c=',{type:'nn',fn:(x)=>'(c='+x+')'}],
    ['d=',{type:'nn',fn:(x)=>'(d='+x+')'}],
    ['u',{type:'n',fn:()=>'((x+.5)/16)'}],
    ['v',{type:'n',fn:()=>'((y+.5)/16)'}],
    ['R',{type:'nnn',fn:(x,y)=>'(img[0+4*(x+'+x+'&15)+64*(y+'+y+'&15)]/255)'}],
    ['G',{type:'nnn',fn:(x,y)=>'(img[1+4*(x+'+x+'&15)+64*(y+'+y+'&15)]/255)'}],
    ['B',{type:'nnn',fn:(x,y)=>'(img[2+4*(x+'+x+'&15)+64*(y+'+y+'&15)]/255)'}],
    ['H=',{type:'nn',fn:(x)=>'(hsv[i+0]='+x+')'}],
    ['S=',{type:'nn',fn:(x)=>'(hsv[i+1]='+x+')'}],
    ['V=',{type:'nn',fn:(x)=>'(hsv[i+2]='+x+')'}],
    // ['N2S',{type:'sn',fn:(x)=>'String('+x+')'}],
    // ['S2N',{type:'ns',fn:(x)=>'Number('+x+')'}],
]);
globalThis.INSTS_NAMES=new Map(Array.from(INSTS.entries(),([x,y])=>[y,x]));



globalThis.ImgChunk=class{
    uneval(){return 'ImgChunk.fromCode('+JSON.stringify(ImgChunk.detokenize(this.source))+')'}
    static tokenize(str){return Array.from(str.split(/\s+/),s=>INSTS.get(s))}
    static detokenize(tokens){return Array.from(tokens,token=>INSTS_NAMES.get(token)).join(' ')}
    static fromCode(code){return this.builder()(this.tokenize(code))[0]}
    static builder(){
        let AST=[],source=[];
        let nextOP=function(op){
            if(AST.length>0&&AST.at(-1)[0].type[AST.at(-1).length]!==op.type[0]){console.log('token有误：',token);return}
            AST.push([op]);source.push(op);
            while(AST.length){
                let expr=AST.at(-1);if(expr[0].type.length>expr.length)break;
                AST.pop();if(AST.length>0){AST.at(-1).push(expr);continue}
                let f=new ImgChunk(expr,source);source=[];return f;
            }
        }
        return ops=>Array.from(ops,nextOP).filter(x=>x!=null);
    }
    
    constructor(expr,source){
        let newImage=()=>{let img=new ImageData(16,16),d=img.data;for(let i=0;i<d.length;i++)d[i]=(i&3)===3?255:Math.random()*256;return img}
        this.source=source;this.img=newImage();this.hsv=new Float64Array(4*16*16);
        let runTree=tree=>Function.prototype.call.apply(tree[0].fn,tree.map((x,i)=>i===0?x:runTree(x)));
        this.renderFunc=Function('for(let i=0,hsv=this.hsv,img=this.img.data,y=0;y<16;y++)for(let x=0;x<16;x++,i+=4){let a=0,b=0,c=0,d=0,r='+runTree(expr)+';hsv[i+2]=r;if(typeof r!=="number")throw this}');
    }
    render(){
        this.hsv.fill(1);this.renderFunc();let clamp=x=>x>1?1:x>0?x:0;
        for(let i=0,img=this.img.data;i<this.hsv.length;i+=4){
            let [r,g,b]=hsvToRgb(clamp(this.hsv[i]),clamp(this.hsv[i+1]),clamp(this.hsv[i+2]));
            if(r!=r||b!=b||g!=g)throw [r,g,b];
            img[i]=r*256;img[i+1]=g*256;img[i+2]=b*256;
        }
    }
    /**@param {ImgChunk} other  */
    feature(other){
        let data=this.img.data;
        ImgChunk.TEMP_IMG.set(data);
        data.set(other.img.data);
        this.render();
        let features=[0,0,0,0,0,0];
        for(let rgb=0;rgb<3;rgb++){
            let n=data.length/4,avg=0,std=0;for(let i=0;i<n;i++)avg+=data[4*i+rgb];avg/=n;features[2*rgb]=avg;
            for(let i=0;i<n;i++)std+=(data[4*i+rgb]-avg)**2;std/=n;std**=.5;features[2*rgb+1]=std;
        }
        data.set(ImgChunk.TEMP_IMG);
        return features;
    }
    static TEMP_IMG=new ImageData(16,16).data
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

let exprGenerator=ImgChunk.builder(),randToken=function(){let values=[...INSTS.values()];return ()=>sample(values)}();
globalThis.randFunctionFromTokens=(tokens0,limit)=>{
    let tokens=tokens0.concat();
    if(Math.random()>1/2){
        let i=Math.random()*tokens0.length>>>0,j=Math.random()*tokens0.length>>>0;if(i>j)[i,j]=[j,i];
        tokens=shuffle([tokens0.slice(0,i),tokens0.slice(i,j),tokens0.slice(j)]).flat();
    }
    tokens.length=Math.random()*tokens.length>>>0;
    let result=exprGenerator(tokens)[0];
    for(let i=0;!result;i++){let token=randToken();if(token.type.length>2&&Math.random()*limit<i)continue;result=exprGenerator([token])[0];}
    return result
}
globalThis.randGenWorld=(tokens0,limit)=>{
    WORLD.forEach(line=>line.forEach((_,i)=>{if(Math.random()>1/16)return;line[i]=Math.random()<1/8?ImgChunk.builder()(tokens0)[0]:randFunctionFromTokens(tokens0,limit)}));
}
globalThis.WORLD=grid2D(16,16,(x,y)=>{
    if((x=>x&x-1)(x+16*y)===0)console.log('generating:',{x,y})
    return randFunctionFromTokens([],32);
});





function randomIterOrder(world){let w=world[0].length,h=world.length,order=Array.from(Array(w*h),(_,i)=>[i%w,i/w|0]);shuffle(order);return order}
function tickLogic(){
    const width=WORLD[0].length,height=WORLD.length;
    for(let [ex,ey] of randomIterOrder(WORLD)){
        let f=WORLD[ey][ex];
        let env={x:0,y:0};
        f.render();
    }
}

globalThis.searchMostSpecial=function(){
    let exampleChunks=randomIterOrder(WORLD).slice(0,16).map(([x,y])=>WORLD[y][x]);
    let featurers=randomIterOrder(WORLD).map(([x,y])=>{
        let chunk=WORLD[y][x];
        let info=vectorsInfo(exampleChunks.map(c=>chunk.feature(c)));
        return {x,y,chunk,info,score:info.std}
    }).sort((x,y)=>y.score-x.score);featurers.length=16;
    // console.log('good featurers:',featurers.map(({x,y})=>'('+x+','+y+')').join(' '));

    let chunks=randomIterOrder(WORLD).map(([x,y])=>({x,y,chunk:WORLD[y][x],score:0}));
    
    for(let featurer of featurers){
        let info=vectorsInfo(chunks.map(c=>featurer.chunk.feature(c.chunk)));
        chunks.forEach((data,i)=>data.score+=info.vectors[i].dist2/info.std**2);
    }
    chunks.forEach(data=>data.score/=(50+data.chunk.source.length));
    chunks.sort((x,y)=>y.score-x.score);chunks.length=16;
    // console.log('good images:',chunks.map(({x,y})=>'('+x+','+y+')').join(' '));

    let pool=chunks.concat(),safe=featurers.concat(chunks);
    changeWorld:for(let [x,y] of randomIterOrder(WORLD).slice(0,WORLD.length*WORLD[0].length>>>3)){
        for(let {x:sx,y:sy} of safe){if(x===sx&&y===sy)continue changeWorld}
        let src1=sample(pool).chunk.source,src2=sample(pool).chunk.source,pos=Math.random();
        let src=src1.slice(0,pos*src1.length).concat(src2.slice(pos*src2.length));
        WORLD[y][x]=randFunctionFromTokens(src,Math.min(50,src.length))
    }
}



function renderLogic(){
    const canvas=document.getElementById('canvas');
    /** @type {CanvasRenderingContext2D}*/
    const ctx=canvas.getContext("2d");
    const width=WORLD[0].length,height=WORLD.length;
    const cellSize=16;
    canvas.width=width*cellSize;canvas.height=height*cellSize;
    
    ctx.clearRect(0,0,width,height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        ctx.putImageData(WORLD[y][x].img,x*cellSize,y*cellSize);
    }
}


export {tickLogic,renderLogic}