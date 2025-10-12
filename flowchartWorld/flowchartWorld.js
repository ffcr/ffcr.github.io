//constructor type is 

/**@param {typeof Function} A @param {typeof Function} B */
function isSubClass(A,B){return A===B||A.prototype instanceof B}

/**@template T @param {T[]} a*/
function sample(a){return a[a.length*Math.random()>>>0]}
/**@template T @param {T[]} a @returns {T} */
function randTakeOut(a){let i=a.length*Math.random()>>>0,j=a.length-1;[a[i],a[j]]=[a[j],a[i]];return a.pop()}
/**@template T @param {T[]} a*/
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/**@param {number[]} acc @param {number} x */
function binSearch(acc,x){let a=0,b=acc.length;while(a<=b){let m=a+b>>>1;if(acc[m]>x)b=m-1;else a=m+1;}return a;}


/**@template T @param {(any,any)=>T} f*/
function vecFn(f,a,b){return Array.from(a,(_,i)=>f(a[i],b[i]))}
/**@template T @param {T[][]} m*/
function transpose(m) {return m[0].map((_,i)=>m.map(row=>row[i]));}

/**@param {number[]} a*/
function sum(a){return a.reduce((x,y)=>x+y,0)}
/**@param {number[]} a*/
function avg(a){return sum(a)/a.length}
/**@param {number[]} a*/
function std(a,AVG=avg(a)){let s=0;for(let i=0;i<a.length;i++)s+=(a[i]-AVG)**2;return (s/a.length)**.5}

/**@param {number} i @param {Array} a*/
function limitIndex(i,a){i|=0;return i>=a.length?a.length-1:i<0?0:i}

/**@param {number} n*/
function sumBits(n){let i=0;while(n){n&=n-1;i++}return i}

/**
 * @template T
 * @param {number} width 
 * @param {number} height 
 * @param {(number,number)=>T} f 
 */
function grid2D(width,height,f){
    return Array.from(Array(height),(_,y)=>Array.from(Array(width),(_,x)=>f(x,y)))
}
function grid2DIterOrder(world){let w=world[0].length,h=world.length,order=Array.from(Array(w*h),(_,i)=>[i%w,i/w|0]);return order}


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

globalThis.Pos=class Pos{//不可变
    constructor(x=0,y=0){this.x=x;this.y=y;}
    add(pos){return new Pos(this.x+pos.x|0,this.y+pos.y|0)}
    sub(pos){return new Pos(this.x-pos.x|0,this.y-pos.y|0)}
    inverse(){return new Pos(-this.x|0,-this.y|0)}
    equals(p){return p===this||p!=null&&this.x===p.x&&this.y===p.y}
    static ZERO=new Pos(0,0);
    uneval(){return this===Pos.ZERO?'Pos.ZERO':'new Pos('+(this.x)+','+(this.y)+')'}
}

globalThis.Fn=class Fn{
    /** @callback InstFunc  @this {Context} @param {...DataNode} args @return {number|undefined} @name nextBranchId */
    /**@param {InstFunc} fn @param {typeof Function[]} varTypes @param {number} branchCount @param {number} cost */
    constructor(fn,varTypes,cost,branchCount=1){this.fn=fn;this.varTypes=varTypes;this.cost=cost;this.branchCount=branchCount;}
    uneval(){return INST_TABLE.get(this)??('/*unknown fn*/'+this.fn.toString())}
}


globalThis.InstNode=class InstNode{
    /**@param {Fn} fn */
    constructor(fn,branchPoss=Array(fn.branchCount).fill(Pos.ZERO),varPoss=Array(fn.varTypes.length).fill(Pos.ZERO),isHead=true){
        this.isHead=isHead;this.fn=fn;this.branchPoss=branchPoss;this.varPoss=varPoss;
    }
    uneval(){return 'new InstNode('+uneval(this.fn)+','+uneval(this.branchPoss)+','+uneval(this.varPoss)+','+uneval(this.isHead)+')'}
}
globalThis.DataNode=class DataNode{
    /**@param {typeof Function} type  */
    constructor(type,val){
        this.type=type;
        this._val=val;
    }
    get val(){return this._val}
    set val(v){
        let valid=this.type===Any||this.type===I32&&v===(v|0)||v!=null&&isSubClass(v.constructor,this.type);
        if(!valid)throw new TypeError('cannot assign value of type '+uneval(v?.constructor)+' to DataNode of type '+uneval(this.type));
        this._val=v;
    }
    /**@returns {typeof Function} */
    static initialNodeOf(type){
        return new DataNode(type,type===I32?0:type===F64?0.0:type===Str?'':type===Pos?Pos.ZERO:type===Env?new Env(1,1):type===InstNode?new InstNode(sample(INST_LIST)):type===DataNode?new DataNode(Any,undefined):type===Any?undefined:(()=>{throw new TypeError('cannot create initial node of type '+type.name)})());
    }
    uneval(){return 'new DataNode('+uneval(this.type)+','+uneval(this.val)+')'}
}
globalThis.Env=class Env{
    /**@param {Pos} p*/
    inGrid({x,y}){return x>=0&&y>=0&&x<this.width&&y<this.height}
    /**@param {Pos} p*/
    get(p){return this.inGrid(p)?this.data[p.y][p.x]:undefined}
    /**@param {Pos} p*/
    swap(p,o){if(!this.inGrid(p))return o;const l=this.data[p.y];[l[p.x],o]=[o,l[p.x]];return o}
    /**@returns {*|Env} */
    static undefinedFn(x,y){return undefined};
    constructor(width,height,energy=0){
        this.width=width;this.height=height;this.data=grid2D(width,height,Env.undefinedFn);
        this.iterOrder=grid2DIterOrder(this.data);this.energy=energy;
    }
    randomChange(){
        this.energy+=(globalThis.RANDOM_ENERGY_GAIN??=10);
        let pos=new Pos(this.width*Math.random()>>>0,this.height*Math.random()>>>0);
        let e=this.get(pos);
        if(Math.random()<1/2){//随机修改
            let matter=e instanceof Env?e.width*e.height+e.energy:1;let willChange=(matter,newMatter)=>Math.random()<Math.min(matter/newMatter,newMatter/matter);
            if(Math.random()<1/2){
                let newWidth=Math.random()*8+2>>>0,newHeight=Math.random()*8+2>>>0;
                if(willChange(matter,newWidth*newHeight))this.swap(pos,new Env(newWidth,newHeight));
            }else if(willChange(matter,1)){
                let e1=undefined;
                if(Math.random()<1/2)e1=new InstNode(sample(INST_LIST));
                this.swap(pos,e1);
            }
            return
        }
        if(e instanceof InstNode){//随机连接
            repairConnection:for(let i=0;i<e.varPoss.length;i++){
                let target=e.fn.varTypes[i],p=e.varPoss[i],randPosList;
                for(;;){
                    let dataNode=this.get(pos.add(p));
                    if(dataNode instanceof DataNode&&isSubClass(dataNode.type,target)){e.varPoss[i]=p;continue repairConnection;}
                    randPosList??=shuffle((globalThis.MOORE_NEIGHBORHOOD??=[new Pos(-1,-1),new Pos(0,-1),new Pos(1,-1),new Pos(-1,0),new Pos(1,0),new Pos(-1,1),new Pos(0,1),new Pos(1,1)]).concat());
                    if(!randPosList.length)break;p=randPosList.pop();
                }
                e.varPoss[i]=p;let pos1=pos.add(p);if(this.get(pos1) instanceof InstNode)continue;
                this.swap(pos1,DataNode.initialNodeOf(target));
            }
        }
    }
    /**@param {Array<[number,number,*]>} arr */
    setMultiple(arr){for(let [x,y,o] of arr)this.swap(new Pos(x,y),o);return this}
    uneval(){return 'new Env('+uneval(this.width)+','+uneval(this.height)+','+uneval(this.energy)+').setMultiple('+uneval(this.data.flatMap((r,y)=>r.map((o,x)=>o==null?null:[x,y,o])).filter(Boolean))+')'}
}


/**@typedef {Env|InstNode} Tickable */
globalThis.Context=class Context{
    /**@param {Context} parent @param {Env} main  @param {Env} env @param {Pos} pos */
    constructor(parent,main,env,pos){//运行主体是main，初始位置在env的pos处
        this.parent=parent;this.main=main;this.env=env;this.pos=pos;
    }
    /**@param {Tickable} E */
    tick(E){
        if(E instanceof InstNode&&E.isHead){
            if(this.main.energy<=0)return;
            let instNode=E;for(;;){
                let dataNodes=[],next=0;
                for(let i=0;i<instNode.varPoss.length;i++){
                    let p=instNode.varPoss[i],dataNode=this.env.get(this.pos.add(p));
                    if(!(dataNode instanceof DataNode)||!isSubClass(dataNode.type,instNode.fn.varTypes[i]))break;
                    dataNodes.push(dataNode)
                }
                if(dataNodes.length>=instNode.fn.varTypes.length){
                    let cost=instNode.fn.cost;if(this.main.energy<cost)break;
                    try{
                        this.cost(cost);next=instNode.fn.fn.apply(this,dataNodes)|0;//0 when no return
                    }catch(e){if(e==='out of energy')break;console.log('error when run ',instNode.fn.uneval());throw e;}//只有能量耗尽是正常停止
                    // console.log('success run ',instNode.fn.uneval());
                }
                let nextPos=this.pos.add(instNode.branchPoss[next]);
                let nextNode=this.env.get(nextPos);if(!(nextNode instanceof InstNode)||nextNode===instNode)return;
                nextNode.isHead=false;this.pos=nextPos;instNode=nextNode;
            }
        }
        if(E instanceof Env){
            for(let i=0;i<RANDOM_CHANGE_COUNT;i++)E.randomChange();//每次tick随机修改环境
            shuffle(E.iterOrder);
            for(let [x,y] of E.iterOrder){
                let e1=E.data[y][x];if(e1 instanceof Env){new Context(this,e1,E,new Pos(x,y)).tick(e1);}
            }
            if(this.parent)for(let [x,y] of E.iterOrder){
                let e1=E.data[y][x];if(e1 instanceof InstNode&&e1.isHead)new Context(this,E,this.env,this.pos).tick(e1);
            }
        }
    }
    cost(n){if(!((this.main.energy-=n)>=0)){this.main.energy=0;throw 'out of energy';}}
}

globalThis.Any=Object;globalThis.I32=class extends Number{};globalThis.F64=Number;globalThis.Str=String;
for(let name of ['Any','I32','F64','Str','Pos','Env','InstNode','DataNode'])globalThis[name].uneval=()=>name;
globalThis.MUTATABLE=new Set([Env,InstNode,DataNode]);//Pos和基础类型不可变

{
    // 将str根据args中的字符串split成多个部分，中间用下标连接
    // 如：f('abc def ghi_jkl_mn',[' ','_'])得到['abc',0,'def',0,'ghi',1,'jkl',1,'mn']
    // 实现使用简洁的正则表达式方法
    // 此部分由AI辅助生成
    /**@param {string} str @param {string[]} args @returns {Array<string|number>} */
    function replaceToIndex(str,args){
        let re=new RegExp('('+args.map(s=>s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')+')','g');
        let arr=[],lastIndex=0;
        str.replace(re,(match,_,index)=>{arr.push(str.slice(lastIndex,index),args.indexOf(match));lastIndex=index+match.length;});
        arr.push(str.slice(lastIndex));
        return arr;
    }

    /**@template T @param {()=>T} exampleFn @returns {(...args)=>T} */
    function macroDefine(exampleFn,...args){
        let code=exampleFn.toString();
        return (0,eval)('('+Array.from(args,(_,i)=>'s'+i)+')=>(0,eval)('+replaceToIndex(code,args).map(x=>typeof x==='number'?'s'+x:JSON.stringify(x)).join('+')+')()');
    }
    if(0){//test
        console.log(macroDefine(()=>2+3,'+')('**'));//8
        console.log(macroDefine(()=>Math.sqrt(4),'Math.sqrt')('Math.sign'));//1
    }
    globalThis.INSTS={};

    let binaryInst=macroDefine(()=>new Fn(function(a,b,c){a.val=b.val**c.val|0},[I32,I32,I32],1),'**');
    for(let [name,op] of [['ADD','+'],['SUB','-'],['MUL','*'],['DIV','/'],['REM','%'],['AND','&'],['OR','|'],['XOR','^'],['SHL','<<'],['SHR','>>'],['EQ','==='],['NE','!=='],['GT','>'],['LT','<'],['GTE','>='],['LTE','<=']]){
        INSTS[name]=binaryInst(op);
    }
    INSTS.POS_FROM_I32=new Fn(function(p,x,y){p.val=new Pos(x.val,y.val);},[Pos,I32,I32],2);
    INSTS.POS_TO_I32=new Fn(function(p,x,y){x.val=p.val.x;y.val=p.val.y;},[Pos,I32,I32],1);

    INSTS.IF=new Fn(function(cond){return cond.val?0:1},[I32],2,2);
    INSTS.MOVE=new Fn(function(a,b){let p=this.pos.add(new Pos(a.val,b.val));if(this.env.inGrid(p))this.pos=p;},[I32,I32],3);
    INSTS.JUMP_IN=new Fn(function(){
        let e=this.env.get(this.pos);if(e instanceof Env){this.parent=new Context(this.parent,this.main,this.env,this.pos);this.env=e;this.pos=new Pos(Math.random()*e.width|0,Math.random()*e.height|0);}
    },[],3);
    INSTS.JUMP_OUT=new Fn(function(){
        if(this.parent){this.env=this.parent.env;this.pos=this.parent.pos;this.parent=this.parent.parent;}
    },[],3);
    INSTS.SWAP=new Fn(function(o){if(o.type!==Any)return;o.val=this.env.swap(this.pos,o.val)},[Any],3);
    /**@this {Context} */
    function copy(o){
        if(!(o instanceof Any&&MUTATABLE.has(o.constructor)))return o;
        if(o instanceof InstNode){this.cost(3+(o.branchPoss.length+o.varPoss.length>>>2));let o1=new InstNode(o.fn);o1.branchPoss=o.branchPoss.concat();o1.varPoss=o.varPoss.concat();return o1;}
        if(o instanceof DataNode){this.cost(2);return new DataNode(o.type,copy.call(this,o.val));}
        if(o instanceof Env){this.cost(5+((o.width+1)*o.height)+(o.energy>>>1));let e1=new Env(o.width,o.height);e1.energy=o.energy-(o.energy>>>1);for(let i=0;i<o.data.length;i++)for(let j=0;j<o.data[i].length;j++)e1.data[i][j]=copy.call(this,o.data[i][j]);return e1;}
        throw new TypeError('cannot copy type '+o.constructor.name);
    }
    INSTS.ASSIGN=new Fn(function(a,b){if(a.type!==b.type)return;this.main.energy+=energyOf(a.val);a.val=copy.call(this,b.val);},[Any,Any],1);
    INSTS.COPY=new Fn(function(o){if(o.type!==Any)return;this.main.energy+=energyOf(o.val);o.val=undefined;o.val=copy.call(this,this.env.get(this.pos));},[Any],2);
    function energyOf(o){
        if(o instanceof Env){let e=o.width*o.height*1+o.energy;for(let i=0;i<o.data.length;i++)for(let j=0;j<o.data[i].length;j++)e+=energyOf(o.data[i][j]);return e;}
        if(o instanceof DataNode){return 1+energyOf(o.val);}
        return o instanceof Any&&MUTATABLE.has(o.constructor)?1:0;
    }
    INSTS.ENERGY=new Fn(function(a){a.val=this.main.energy|0},[I32],1);
    INSTS.RECYCLE=new Fn(function(o){if(o.type!==Any)return;this.main.energy+=energyOf(o.val);o.val=undefined},[Any],5);
    
    function exactType(o){
        if(o==null)return Any;let type=o.valueOf().constructor;return type===Number?(0===(o|0)?I32:F64):type;
    }

    INSTS.CREATE_DATA=new Fn(function(v){this.cost(2);this.main.energy+=energyOf(v.val);v.val=new DataNode(Any,undefined);},[DataNode],2);
    INSTS.CREATE_INST=new Fn(function(i){this.cost(3);this.main.energy+=energyOf(i.val);i.val=new InstNode(sample(INST_LIST));},[InstNode],3);
    INSTS.CREATE_ENV=new Fn(function(e,w,h){if(w<1||h<1)return;this.cost(5+(w+1)*h);this.main.energy+=energyOf(e.val);e.val=new Env(w,h);},[Env,I32,I32],5);
    
    INSTS.DATA_DOWNCASTING=new Fn(function(data){let o=data.val;data.type=exactType(o)},[DataNode],2);
    INSTS.DATA_UPCASTING=new Fn(function(data){data.type=Any},[DataNode],1);

    INSTS.INST_GET_CONNECT=new Fn(function(inst,i,pos){
        let arr=i>=0?inst.val.varPoss:inst.val.branchPoss;if(i<0)i=~i;//i>=0变量，i<0分支
        if(i<arr.length)pos.val=arr[i];
    },[InstNode,I32,Pos],3);
    INSTS.INST_SET_CONNECT=new Fn(function(inst,i,pos){
        let arr=i>=0?inst.val.varPoss:inst.val.branchPoss;if(i<0)i=~i;//i>=0变量，i<0分支
        if(i<arr.length)arr[i]=pos.val;
    },[InstNode,I32,Pos],3);


    for(let name in INSTS)globalThis[name]=INSTS[name];
    globalThis.INST_LIST=Object.values(INSTS);
    globalThis.INST_TABLE=new Map(Object.entries(INSTS).map(([k,v])=>[v,k]));
}





globalThis.WORLD=new Env(64,64);
globalThis.RANDOM_CHANGE_COUNT=40;//每个环境每次tick随机修改的次数
function tickLogic(){
    new Context(undefined,undefined,undefined).tick(WORLD);
}

function renderLogic(){
    const canvas=document.getElementById('canvas');
    /** @type {CanvasRenderingContext2D}*/
    const ctx=canvas.getContext("2d");
    const width=WORLD.width,height=WORLD.height;
    const cellSize=5;
    canvas.width=width*cellSize;canvas.height=height*cellSize;
    ctx.clearRect(0,0,width,height);

    function isNormalData(o){return o==null||o===0||o instanceof DataNode&&o.val==null||o instanceof Pos&&o.equals(Pos.ZERO)||o instanceof InstNode||o instanceof Env&&o.width===1&&o.height===1}
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        let e=WORLD.get(new Pos(x,y));
        if(e instanceof InstNode)ctx.fillStyle='#ff0000';
        else if(e instanceof DataNode)ctx.fillStyle=isNormalData(e.val)?'#0000ff':'#00ffff';
        else if(e instanceof Env)ctx.fillStyle='#00ff00';
        else continue;
        ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize);
    }
}

export {tickLogic,renderLogic}