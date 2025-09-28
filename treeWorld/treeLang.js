/**@template T @param {T[]} a*/
function sample(a){return a[a.length*Math.random()>>>0]}
/**@template T @param {T[]} a @returns {T} */
function randTakeOut(a){let i=a.length*Math.random()>>>0,j=a.length-1;[a[i],a[j]]=[a[j],a[i]];return a.pop()}
/**@template T @param {T[]} a*/
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/**@param {number[]} acc @param {number} x */
function binSearch(acc,x){let a=0,b=acc.length;while(a<=b){let m=a+b>>>1;if(acc[m]>x)b=m-1;else a=m+1;}return a;}

String.prototype.hash=function(){
    let h=0;
    for(let x of this)h=(h^x.charCodeAt(0))*0xdeece66d+0xb|0;
    return h;
}


globalThis.uneval=function(x){
    switch(typeof x){
        case "string":return JSON.stringify(x);case "boolean":case "number":case "undefined":return String(x);case "bigint":return x<1n<<20n&&x>-1n<<20n?String(x)+'n':'0x'+x.toString(16)+'n';
        case "symbol":throw new TypeError('cannot serialize symbol');case "function":throw new TypeError('cannot serialize function');
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

class Fn extends Function{
    /**@param {{i:function[],o:function,cost:number}} @param {...string} fargs */
    constructor({i,o,cost},...fargs){
        super(...fargs);
        this.inType=i;this.outType=o;this.cost=cost;
    }
    /**@param {number} index @param {Tree} e*/
    validAt(index,e){
        return index>=0&&index<this.inType.length&&e?.op.outType?.prototype instanceof this.inType[index];
    }
    /**@param {Context} env @param {Tree} e  */
    exec(env,e){env.cost(this.cost);return this.apply(env,Array.from(e,t=>t.op.exec(env,t)))}
    uneval(){let s=instNames.get(this);if(s)return s;else throw new Error('cannot uneval Fn '+this);}
    color(){return this.COLOR??='#'+(this.toString().hash()>>>8).toString(16).padStart(6,'0')}
}

/**@extends {Array<Tree>} */
globalThis.Tree=class extends Array{
    parent=this;
    /**@param {Fn} f @param {Tree[]} args  */
    constructor(f,...args){
        super(...args)
        this.op=f;
        for(let i=0;i<args.length;i++)this.set(i,args[i]);
    }
    /**@param {Tree} t*/
    set(i,t){t.parent=this;this[i]=t}
    /**@param {Tree} a @param {Tree} b*/
    static swap(a,ia,b,ib){
        let aia=a[ia],bib=b[ib];
        if(a.op.validAt(ia,bib)&&b.op.validAt(ib,aia)){
            a.set(ia,bib);b.set(ib,aia);return 1;
        }else return 0;
    }
    subNodeCount(){
        return Array.from(this,t=>t.subNodeCount()).reduce((x,y)=>x+y,1)
    }
    copy(){
        let {root,path}=this.path();
        let copySub=t=>{
            if(t instanceof Root)return new Root(copySub(t[0]),0);
            return new Tree(t.op,...Array.from(t,copySub));
        }
        let t=copySub(root);for(let i of path)t=t[i];return t;
    }
    unevalSub(){
        let expr=this.op.uneval(),wordEnd=expr.indexOf('(');
        if(wordEnd===-1)return expr.toUpperCase()+"("+Array.from(this,x=>x.unevalSub()).join(',')+")";
        else return expr.slice(0,wordEnd).toUpperCase()+expr.slice(wordEnd);
    }
    uneval(){
        let {root,path}=this.path();
        return root.unevalSub()+path.map(i=>'['+i+']').join('');
    }
    path(){
        let t=this,path=[];
        while(t.parent!==t){path.push(t.parent.indexOf(t));t=t.parent;};return {root:t,path:path.reverse()};
    }
}



// globalThis.debugStat=new Map();let addStat=e=>{if(!debugStat.has(e))debugStat.set(e,0);debugStat.set(e,debugStat.get(e)+1)}
// [...debugStat].sort((x,y)=>y[1]-x[1]).map(([f,n])=>[instNames.get(f),n])

globalThis.Context=class{
    move(x,y){
        let [dx,dy]=[[x,y],[-y,x],[-x,-y],[y,-x]][this.direction];
        this.x=Math.min(Math.max(this.x+dx,0),this.world[0].length-1);this.y=Math.min(Math.max(this.y+dy,0),this.world.length-1);
    }
    //实例化了就马上运行
    /**@param {number} x @param {number} y @param {Root[][]} world  */
    constructor(world,x,y){
        this.world=world;this.root=world[y][x];this.x=x;this.y=y;this.x0=x;this.y0=y;this.direction=Math.random()*4|0;
        this.stack=Array.from(Array(0),()=>new Root());
        let t=this.root;
        if(t.energy>0){
            world[y][x]=new Root();//temp
            // let energy0=t.energy;
            try {
                let result=t[0].op.exec(this,t[0]);
            } catch (error) {if(error!=="energy"){
                console.log('出错于运行程序：',uneval(t));
                // let iterAllNode=t=>{addStat(t.op);for(let t1 of t)iterAllNode(t1)}
                // iterAllNode(t);
                throw error;
            }}
            // let energy1=t.energy;
            // if(energy1>energy0){console.log('有赚：',uneval(t))}
            world[y][x]=world[this.y][this.x];world[this.y][this.x]=t;//如果程序不重置坐标就能实现移动
        }
    }
    cost(n){
        if(!((this.root.energy-=n)>=0)){this.root.energy=0;throw "energy";}
    }
}

globalThis.Root=class extends Tree{
    constructor(tree=ZERO_TREE(),energy=0){super(core,tree);this.energy=energy;}
    unevalSub(){return 'new Root('+(this[0].op===zero_tree&&this.energy===0?'':this[0].unevalSub()+(this.energy===0?'':','+this.energy))+')'}
}



globalThis.Int32=class extends Number{}


globalThis.instNames=new Map([[Number,'f64'],[Int32,'i32'],[String,'str']]);//两种模式：类型->名称或者指令->名称
for(let [f,fname] of instNames){globalThis[fname]=x=>new ValueFn(f,x);globalThis[fname.toUpperCase()]=x=>new Tree(new ValueFn(f,x))}

class ValueFn extends Fn{
    constructor(type,x){super({i:[],o:type,cost:1},'return arguments.callee.value');this.value=x;}
    uneval(){return instNames.get(this.outType)+'('+uneval(this.value)+')'}
    color(){return '#808080'}
}

/**@type {Map<Function,Fn[]>} */
globalThis.instPool=new Map();
/**@type {Map<Function,Fn>} */
globalThis.leafInstPool=new Map();
{
    /**@param {string} word @param {Fn} f */
    let addInst=(word,f,freq=1)=>{
        let lower=word.toLowerCase(),upper=word.toUpperCase()
        globalThis[lower]=f;instNames.set(f,lower);globalThis[upper]=(...args)=>new Tree(f,...args);//小写是函数，大写是构造
        let toAdd=Array(freq).fill(f);
        if(f.outType!=null)for(let type=f.outType;;type=Object.getPrototypeOf(type.prototype).constructor){
            for(let pool of f.inType.length>0?[instPool]:[instPool,leafInstPool]){//避免树无限延长
                let list=pool.get(type);if(!list){list=[];pool.set(type,list)};list.push.apply(list,toAdd);
            }
            if(type===Object)break;
        }
    }
    /**@param {string} str */
    let wordsAndOps=str=>str.split(' ').map(s=>s.split(':'));
    wordsAndOps('ADD:x+y|0 SUB:x-y|0 MUL:x*y|0 DIV:x/y|0 REM:x%y|0 AND:x&y OR:x|y XOR:x^y SHL:x<<y SHR:x>>y EQ:x===y|0 NE:x!==y|0 GT:x>y|0 LT:x<y|0 GTE:x>=y|0 LTE:x<=y|0').map(([word,expr])=>{addInst(word,new Fn({i:[Int32,Int32],o:Int32,cost:3},'x','y','return '+expr));});
    wordsAndOps('NOT:~x EQZ:!x|0 NEG:-x|0 ABS:Math.abs(x)|0 SQRT:Math.sqrt(x)|0 SQR:x**2|0').map(([word,expr])=>{addInst(word,new Fn({i:[Int32],o:Int32,cost:2},'x','return '+expr));});

    addInst('core',new Fn({i:[Object],o:null,cost:1},'x',''));
    addInst('comma',new Fn({i:[Object,Object],o:Object,cost:1},'x','y','return y'),16);
    addInst('zero_i32',new ValueFn(Int32,0));
    addInst('zero_tree',new Fn({i:[],o:Tree,cost:1},'return new Root()'));zero_tree.COLOR='#dddddd';

    addInst('branch',new Fn({i:[Int32,Object,Object],o:Object,cost:2},''),4);
    /**@param {Context} env @param {Tree} e  */
    branch.exec=function(env,e){env.cost(this.cost);let cond=e[0],t=cond.op.exec(env,cond)?e[1]:e[2];return t.op.exec(env,t);}

    addInst('i32_to_tree',new Fn({i:[Int32],o:Tree,cost:8},'x','return new Root(I32(x))'));
    addInst('tree_mutate',new Fn({i:[Tree,Int32,Int32],o:Tree,cost:8},'tree','i','count','return count>=1&&(i>>>0 in tree)?(this.cost(4*count),genRandTree(count,tree,i)):tree'));
    addInst('tree_jump',new Fn({i:[Tree,Int32],o:Tree,cost:1},'tree','i','return i===-1?tree.parent:tree.at(i>>>0)??tree'));
    addInst('tree_root',new Fn({i:[Tree],o:Tree,cost:8},'t','return t.path().root'));
    addInst('tree_recycle',new Fn({i:[Tree],o:Int32,cost:20},'t','let r=t.path().root;let dE=r.energy+r.subNodeCount()*8;this.cost(-dE);return dE;'));

    addInst('home',new Fn({i:[],o:Int32,cost:1},'let xo=this.x,yo=this.y;this.x=this.x0;this.y=this.y0;return Math.abs(this.x-xo)+Math.abs(this.y-yo)|0;'));
    addInst('rotate',new Fn({i:[Int32],o:Int32,cost:1},'x','return this.direction=this.direction+x&3;'));
    addInst('move',new Fn({i:[Int32,Int32],o:Int32,cost:2},'x','y','let xo=this.x,yo=this.y;this.move(x,y);return Math.abs(this.x-xo)+Math.abs(this.y-yo)|0;'));
    
    addInst('p_swap',new Fn({i:[Tree],o:Tree,cost:1},'t','const w=this.world,x=this.x ,y=this.y ;[t,w[y][x]]=[w[y][x],t];return t'));
    addInst('o_swap',new Fn({i:[Tree],o:Tree,cost:1},'t','const w=this.world,x=this.x0,y=this.y0;[t,w[y][x]]=[w[y][x],t];return t'));
    addInst('p_copy',new Fn({i:[],o:Tree,cost:6},'let t=this.world[this.y][this.x];this.cost(t.subNodeCount()*4);return t.copy()'));
    addInst('p_swapsub',new Fn({i:[Tree,Int32,Int32],o:Int32,cost:3},'a','ia','ib','let b=this.world[this.y][this.x];return Tree.swap(a,ia,b,ib);'));

    addInst('self_copy',new Fn({i:[],o:Tree,cost:6},'let t=this.root;this.cost(t.subNodeCount()*4);return t.copy()'));

    addInst('energy',new Fn({i:[],o:Int32,cost:1},'x','return this.root.energy|0;'));
    addInst('energy_get',new Fn({i:[],o:Int32,cost:6},'x','return this.world[this.y][this.x].path().root.energy|0;'));
    addInst('energy_give',new Fn({i:[Int32],o:Int32,cost:6},'n','if(n<=0||n>this.root.energy)return 0;this.cost(n);this.world[this.y][this.x].path().root.energy+=n;return n;'));
}



globalThis.genRandTree=function(nodeCount=10,target=new Root(),targetIndex=0){
    let count=1,tofill=[{tree:target,i:targetIndex}];
    while(tofill.length){
        let {tree,i}=randTakeOut(tofill);
        let type0=tree.op.inType[i];
        let f=sample((count>=nodeCount?leafInstPool:instPool).get(type0)),t=new Tree(f);tree.set(i,t);
        for(let i=0;i<f.inType.length;i++){tofill.push({i,tree:t});count++}
    }
    return target;
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


globalThis.WORLD=grid2D(128,128,(x,y)=>new Root());


function randomIterOrder(world){let w=world[0].length,h=world.length,order=Array.from(Array(w*h),(_,i)=>[i%w,i/w|0]);shuffle(order);return order}
function tickLogic(){
    const width=WORLD[0].length,height=WORLD.length;
    for(let [x,y] of randomIterOrder(WORLD))if(WORLD[y][x].energy>0)new Context(WORLD,x,y);
    for(let [x,y] of randomIterOrder(WORLD)){
        if(Math.random()>1/256)continue;
        let t=WORLD[y][x];
        if(Math.random()<1/2){
            let x1=Math.min(Math.max(x+(Math.random()*3-1|0),0),width -1);
            let y1=Math.min(Math.max(y+(Math.random()*3-1|0),0),height-1);
            if(WORLD[y1][x1].energy<t.energy){WORLD[y1][x1]=t.copy();WORLD[y1][x1].energy+=t.energy>>>1;t.energy>>>=1;}
        }
        if(t instanceof Root&&Math.random()<1/8){t.energy+=64}
        if(!(t instanceof Root&&t.energy>0)){
            if(Math.random()<1/8){let j=Math.random()*(t.length+1)>>>0;t=WORLD[y][x]=j===t.length?t.parent:t[j]}//随机跳转
            if(t.length&&Math.random()<1/8)genRandTree(16,t,t.length*Math.random()>>>0);//随机变异
        }
    }
}




function renderLogic(){
    const canvas=document.getElementById('canvas');
    /** @type {CanvasRenderingContext2D}*/
    const ctx=canvas.getContext("2d");
    const width=WORLD[0].length,height=WORLD.length;
    const cellSize=5;
    canvas.width=width*cellSize;canvas.height=height*cellSize;
    
    let showActive=document.getElementById('showActive').checked;
    let showInactive=document.getElementById('showInactive').checked;
    let showData=document.getElementById('showData').checked;

    ctx.clearRect(0,0,width,height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        let e=WORLD[y][x];
        ctx.fillStyle=(e instanceof Root?e[0]:e).op.color();
        if(e instanceof Root){
            if(e.energy>0){if(showActive)ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize);}
            else {if(showInactive)ctx.fillRect(x*cellSize+1,y*cellSize+1,cellSize-2,cellSize-2);}
        }else {if(showData)ctx.fillRect(x*cellSize+2,y*cellSize+2,cellSize-4,cellSize-4);}
    }
}



globalThis.testTree=function(t){
    t.energy=1000000;
    // let t=new Root(tree_jump(tree_jump(zero_tree(),zero_i32()),zero_i32()),1000000);
    // let t=new Root(tree_jump(zero_tree(),zero_i32()),1000000);
    console.log(uneval(t));
    // let t=new Root(zero_tree(),1000000);
    // t.energy=1000000;
    // // console.log&&(uneval(t));
    new Context([[t]],0,0);
    console.log(t.energy);
}
// for(let _=0;_<1000000;_++){
//     testTree(genRandTree(5));
// }


export {tickLogic,renderLogic}