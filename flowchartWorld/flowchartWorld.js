/**@param {typeof Function} A @param {typeof Function} B */
function isSubClass(A,B){return A===B||A.prototype instanceof B}

/**@template T @param {T[]} a*/
function sample(a){return a[a.length*Math.random()>>>0]}
/**@template T @param {T[]} a @returns {T} */
function randTakeOut(a){let i=a.length*Math.random()>>>0,j=a.length-1;[a[i],a[j]]=[a[j],a[i]];return a.pop()}
/**@template T @param {T[]} a*/
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

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


globalThis.uneval=function(x){switch(typeof x){
    case "string":return JSON.stringify(x);case "boolean":case "number":case "undefined":return String(x);case "bigint":return x<1n<<20n&&x>-1n<<20n?String(x)+'n':'0x'+x.toString(16)+'n';
    default:return x==null?'null':x._uneval();
}}

Object.defineProperty(Object.prototype,'_uneval',{value:function(){let kvs=[];for(let key in this)kvs.push((/^[a-zA-Z0-9_$]+$/.test(key)?key:JSON.stringify(key))+':'+uneval(this[key]));return '({'+kvs.join(',')+'})'},enumerable:false,writable:true});
Object.defineProperty(Array.prototype,'_uneval',{value:function(){return '['+this.map(x=>uneval(x)).join(',')+']'},enumerable:false,writable:true});


globalThis.Pos=class Pos{//不可变
    constructor(x=0,y=0){this.x=x;this.y=y;}
    add(pos){return new Pos(this.x+pos.x|0,this.y+pos.y|0)}
    sub(pos){return new Pos(this.x-pos.x|0,this.y-pos.y|0)}
    inverse(){return new Pos(-this.x|0,-this.y|0)}
    equals(p){return p===this||p!=null&&this.x===p.x&&this.y===p.y}
    static ZERO=new Pos(0,0);
    _uneval(){return this===Pos.ZERO?'Pos.ZERO':'new Pos('+(this.x)+','+(this.y)+')'}
}

globalThis.Fn=class Fn{
    /** @callback InstFunc  @this {Context} @param {...DataNode} args @return {number|undefined} @name nextBranchId */
    /**@param {InstFunc} fn @param {typeof Function[]} varTypes @param {number} branchCount @param {number} cost */
    constructor(fn,varTypes,cost,branchCount=1){this.fn=fn;this.varTypes=varTypes;this.cost=cost;this.branchCount=branchCount;}
    _uneval(){return INST_TABLE.get(this)??('/*unknown fn*/'+this.fn.toString())}
}


globalThis.InstNode=class InstNode{
    /**@param {Fn} fn */
    constructor(fn,branchPoss=Array(fn.branchCount).fill(Pos.ZERO),varPoss=Array(fn.varTypes.length).fill(Pos.ZERO),isHead=true){
        if(branchPoss.length!==fn.branchCount)throw new TypeError('branchPoss length mismatch,expected '+fn.branchCount+',got '+branchPoss.length);
        if(varPoss.length!==fn.varTypes.length)throw new TypeError('varPoss length mismatch,expected '+fn.varTypes.length+',got '+varPoss.length);
        this.isHead=isHead;this.fn=fn;this.branchPoss=branchPoss;this.varPoss=varPoss;
    }
    _uneval(){return 'new InstNode('+uneval(this.fn)+','+uneval(this.branchPoss)+','+uneval(this.varPoss)+','+uneval(this.isHead)+')'}
}
globalThis.DataNode=class DataNode{
    /**@param {typeof Function} type  */
    constructor(type,val){this.type=type;this._val=val;}
    get val(){return this._val}
    set val(v){
        let valid=this.type===Any||this.type===I32&&v===(v|0)||v!=null&&isSubClass(v.constructor,this.type);
        if(!valid)throw new TypeError('cannot assign value of type '+uneval(v?.constructor)+' to DataNode of type '+uneval(this.type));
        this._val=v;
    }
    /**@returns {typeof Function} */
    static initialValueOf(type){
        return type===I32?0:type===F64?0.0:type===Str?'':type===Pos?Pos.ZERO:type===Env?new Env(1,1):type===InstNode?new InstNode(sample(INST_LIST)):type===DataNode?new DataNode(Any,undefined):type===Any?undefined:(()=>{throw new TypeError('cannot create initial node of type '+type.name)})();
    }
    _uneval(){return 'new DataNode('+uneval(this.type)+','+uneval(this.val)+')'}
}
globalThis.matterOf=e=>e instanceof Env?4*(e.width*e.height)**2+(e.energy/256):e instanceof DataNode?3+matterOf(e.val):e instanceof InstNode?4:e!=null?2:1;

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
    randomChange(level){//各层分类讨论
        this.energy+=RANDOM_ENERGY_GAIN;
        let pos=new Pos(this.width*Math.random()>>>0,this.height*Math.random()>>>0);
        
        let willChange=(matter,newMatter)=>Math.random()<matterOf(newMatter)/matterOf(matter);
        let e=this.get(pos),e1;
        if(level<1||level<2&&Math.random()<1/8)e1=new Env(Math.random()*8+2>>>0,Math.random()*6+2>>>0);
        else if(Math.random()<1/2)e1=new InstNode(sample(INST_LIST));else e1=undefined;
        if(willChange(e,e1))e=this.swap(pos,e1);

        if(e instanceof InstNode){//随机连接
            e.isHead=true;
            repairConnection:for(let i=0;i<e.varPoss.length;i++){
                let target=e.fn.varTypes[i],p=e.varPoss[i],randPosList;
                for(;;){
                    let dataNode=this.get(pos.add(p));
                    if(dataNode instanceof DataNode&&isSubClass(dataNode.type,target)){e.varPoss[i]=p;continue repairConnection;}
                    randPosList??=shuffle((globalThis.MOORE_NEIGHBORHOOD??=[new Pos(-1,-1),new Pos(0,-1),new Pos(1,-1),new Pos(-1,0),new Pos(1,0),new Pos(-1,1),new Pos(0,1),new Pos(1,1)]).concat());
                    if(!randPosList.length)break;p=randPosList.pop();
                }
                e.varPoss[i]=p;let pos1=pos.add(p);if(this.get(pos1) instanceof InstNode)continue;
                this.swap(pos1,new DataNode(target,DataNode.initialValueOf(target)));
            }
        }
    }
    recycle(o){
        function energyOf(o){
            if(o instanceof Env){let e=o.width*o.height*1+o.energy;for(let i=0;i<o.data.length;i++)for(let j=0;j<o.data[i].length;j++)e+=energyOf(o.data[i][j]);return e;}
            if(o instanceof DataNode){return 1+energyOf(o.val);}
            return o instanceof Any&&MUTATABLE.has(o.constructor)?1:0;
        }
        this.energy+=energyOf(o);
    }
    /**@param {Array<[number,number,*]>} arr */
    setMultiple(arr){for(let [x,y,o] of arr)this.swap(new Pos(x,y),o);return this}
    _uneval(){return 'new Env('+uneval(this.width)+','+uneval(this.height)+','+uneval(this.energy)+').setMultiple('+uneval(this.data.flatMap((r,y)=>r.map((o,x)=>o==null?null:[x,y,o])).filter(Boolean))+')'}
}

globalThis.Path=class Path{
    /**@param {Path} parent @param {Env} env @param {Pos} pos */
    constructor(parent,env,pos){this.parent=parent;this.env=env;this.pos=pos;}
}
globalThis.SAFE=0;
globalThis.Context=class Context{
    /**@param {Context} path @param {Env} m @param {Env} env @param {Pos} pos */
    constructor(path,m,env,pos){//运行主体是main，初始位置在env的pos处，env位于path.env的path.pos处。JS最麻烦的是没有this.path.{f(.env);g(.pos);}的语法，所以为了简洁只能把当前环境独立开来
        this.path=path;this.main=m;this.env=env;this.pos=pos;
        for(let i=0;(i+=Math.random()*2)<RANDOM_CHANGE_RATE*m.width*m.height;)m.randomChange(env==null?0:path==null?1:2);//每次tick随机修改环境
        shuffle(m.iterOrder);
        for(let [x,y] of m.iterOrder){
            let e1=m.data[y][x];if(e1 instanceof Env){
                let p1=new Pos(x,y),m1=(m.data[y][x]=undefined,e1),r=new Context(this.env==null?undefined:new Path(this.path,this.env,this.pos),m1,m,p1);
                let tryMove=()=>{let o0=m1,o1=r.env.get(r.pos);if(!(o1 instanceof Env)||m===r.env){m.swap(p1,o1);r.env.swap(r.pos,o0);return true}};//如果出来后与原格子swap，就会造成循环引用崩服，所以只准同层或与非环境swap。
                if(m.data[y][x]!=null||m===r.env&&p1.equals(r.pos)||!tryMove()){m1.recycle(m.data[y][x]);m.data[y][x]=m1};//原来的地方如果改了，一定是自己放的。如果又swap进去了就会导致再也出不来了，所以改了就取消移动，防止自尽
                
            }
        }
        if(this.env)for(let [x,y] of m.iterOrder){
            if(this.main.energy<=0)return;
            let e1=m.data[y][x];if(e1 instanceof InstNode&&e1.isHead)this.runProgram(new Pos(x,y));
        }
    }
    /**@param {Pos} pos */
    runProgram(pos){
        for(let instNode=this.main.get(pos);instNode instanceof InstNode;){
            let dataNodes=[],next=0;
            for(let i=0;i<instNode.varPoss.length;i++){
                let p=instNode.varPoss[i],dataNode=this.main.get(pos.add(p));
                if(!(dataNode instanceof DataNode)||!isSubClass(dataNode.type,instNode.fn.varTypes[i])){break}
                dataNodes.push(dataNode)
            }
            try{
                if(dataNodes.length>=instNode.fn.varTypes.length){
                    let cost=instNode.fn.cost;this.cost(cost);next=instNode.fn.fn.apply(this,dataNodes)|0;//0 when no return
                }else this.cost(2);
            }catch(e){if(e==='out of energy')break;console.log('error when run ',instNode.fn._uneval());throw e;}//只有能量耗尽是正常停止
            let nextPos=pos.add(instNode.branchPoss[next]);
            let nextNode=this.main.get(nextPos);if(!(nextNode instanceof InstNode)||nextNode===instNode)break;
            nextNode.isHead=false;pos=nextPos;instNode=nextNode;
        }
    }
    cost(n){if(!((this.main.energy-=n)>=0)){this.main.energy=0;throw 'out of energy';}}
}

globalThis.Any=Object;globalThis.I32=class extends Number{};globalThis.F64=Number;globalThis.Str=String;
for(let name of ['Any','I32','F64','Str','Pos','Env','InstNode','DataNode'])globalThis[name]._uneval=()=>name;
globalThis.MUTATABLE=new Set([Env,InstNode,DataNode]);//Pos和基础类型不可变

{
    /**@param {string} str @param {string[]} args @returns {Array<string|number>} */
    function replaceToIndex(str,args){// 将str根据args中的字符串split成多个部分，中间用下标连接。如：f('ab_cd e',[' ','_'])得到['ab',1,'cd',0,'e']
        let re=new RegExp('('+args.map(s=>s.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')).join('|')+')','g');
        let arr=[],lastIndex=0;
        str.replace(re,(match,_,index)=>{arr.push(str.slice(lastIndex,index),args.indexOf(match));lastIndex=index+match.length;});
        arr.push(str.slice(lastIndex));return arr;
    }

    /**@template T @param {()=>T} exampleFn @returns {(...args)=>T} */
    function macroDefine(exampleFn,...args){//函数.toString()可以获取其源码，替换再eval即宏的功能。例如macroDefine(()=>2+3,'+')('**')得到8
        let code=exampleFn.toString();
        return (0,eval)('('+Array.from(args,(_,i)=>'s'+i)+')=>(0,eval)('+replaceToIndex(code,args).map(x=>typeof x==='number'?'s'+x:JSON.stringify(x)).join('+')+')()');
    }

    globalThis.INSTS={};
    let binaryInst=macroDefine(()=>new Fn(function(a,b,c){a.val=b.val**c.val|0},[I32,I32,I32],1),'**');
    for(let [name,op] of [['ADD','+'],['SUB','-'],['MUL','*'],['DIV','/'],['REM','%'],['AND','&'],['OR','|'],['XOR','^'],['SHL','<<'],['SHR','>>'],['EQ','==='],['NE','!=='],['GT','>'],['LT','<'],['GTE','>='],['LTE','<=']]){
        INSTS[name]=binaryInst(op);
    }
    INSTS.POS_FROM_I32=new Fn(function(p,x,y){p.val=new Pos(x.val,y.val);},[Pos,I32,I32],2);
    INSTS.POS_TO_I32=new Fn(function(p,x,y){x.val=p.val.x;y.val=p.val.y;},[Pos,I32,I32],1);

    INSTS.IF=new Fn(function(cond){return cond.val?0:1},[Any],2,2);
    INSTS.MOVE=new Fn(function(a,b){let p=this.pos.add(new Pos(a.val,b.val));if(this.env.inGrid(p))this.pos=p;},[I32,I32],3);
    INSTS.JUMP_IN=new Fn(function(){
        let e=this.env.get(this.pos);if(e instanceof Env){this.path=new Path(this.path,this.env,this.pos);this.env=e;this.pos=new Pos(Math.random()*e.width|0,Math.random()*e.height|0);}
    },[],3);
    INSTS.JUMP_OUT=new Fn(function(){
        if(this.path){this.env=this.path.env;this.pos=this.path.pos;this.path=this.path.parent;}
    },[],3);
    INSTS.SWAP=new Fn(function(o){let e=this.env.get(this.pos);if(!isSubClass(exactType(e),o.type))return;if(Math.random()>=matterOf(this.main)/matterOf(e))return;o.val=this.env.swap(this.pos,o.val)},[Any],3);//太重的不能拿起，只能复制
    /**@this {Context} */
    function copy(o){
        if(!(o instanceof Any&&MUTATABLE.has(o.constructor)))return o;
        if(o instanceof InstNode){this.cost(3+(o.branchPoss.length+o.varPoss.length>>>2));let o1=new InstNode(o.fn);o1.branchPoss=o.branchPoss.concat();o1.varPoss=o.varPoss.concat();return o1;}
        if(o instanceof DataNode){this.cost(2);return new DataNode(o.type,copy.call(this,o.val));}
        if(o instanceof Env){this.cost(5+((o.width+1)*o.height)+(o.energy>>>1));let e1=new Env(o.width,o.height);e1.energy=o.energy-(o.energy>>>1);for(let i=0;i<o.data.length;i++)for(let j=0;j<o.data[i].length;j++)e1.data[i][j]=copy.call(this,o.data[i][j]);return e1;}
        throw new TypeError('cannot copy type '+o.constructor.name);
    }
    INSTS.ASSIGN=new Fn(function(a,b){if(!isSubClass(exactType(b.val),a.type))return;let old=a.val;a.val=copy.call(this,b.val);this.main.recycle(old);},[Any,Any],1);
    INSTS.COPY=new Fn(function(o){let t=this.env.get(this.pos);if(!isSubClass(exactType(t),o.type))return;let old=o.val;o.val=copy.call(this,t);this.main.recycle(old);},[Any],2);
    INSTS.SELF_COPY=new Fn(function(o){let t=this.main;if(!isSubClass(exactType(t),o.type))return;let old=o.val;o.val=copy.call(this,t);this.main.recycle(old);},[Any],2);

    INSTS.ENERGY=new Fn(function(a){a.val=this.main.energy|0},[I32],1);
    INSTS.RECYCLE=new Fn(function(o){let old=o.val;if(o.type===Env)this.cost(5);o.val=DataNode.initialValueOf(o.type);this.main.recycle(old);},[Any],2);
        
    function exactType(o){if(o==null)return Any;let type=o.valueOf().constructor;return type===Number?(o===(o|0)?I32:F64):type;}

    INSTS.CREATE_DATA=new Fn(function(v){this.cost(2);this.main.recycle(v.val);v.val=new DataNode(Any,undefined);},[DataNode],2);
    INSTS.CREATE_INST=new Fn(function(i){this.cost(3);this.main.recycle(i.val);i.val=new InstNode(sample(INST_LIST));},[InstNode],3);
    INSTS.CREATE_ENV=new Fn(function(e,w,h){if(w<1||h<1)return;this.cost(5+(w+1)*h);this.main.recycle(e.val);e.val=new Env(w,h);},[Env,I32,I32],5);
    
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



globalThis.CONFIG_WORLD_SIZE=JSON.parse(new URLSearchParams(window.location.search).get('worldSize')||'[32,32]');
globalThis.WORLD=new Env(...CONFIG_WORLD_SIZE);
globalThis.WORLD_STACK=[];
globalThis.jumpInWorld=function(x,y){let w=WORLD.get(new Pos(x,y));if(w instanceof Env){WORLD_STACK.push(WORLD);WORLD=w}}
globalThis.jumpOutWorld=function(){WORLD=WORLD_STACK.length?WORLD_STACK.pop():new Env(...CONFIG_WORLD_SIZE).setMultiple([[...CONFIG_WORLD_SIZE.map(x=>x*Math.random()|0),WORLD]])}


function tickLogic(){
    new Context(undefined,WORLD,undefined,undefined);
}

function colorOf(e){
    if(e instanceof InstNode)return 0xff0000;
    else if(e instanceof DataNode)return 0x00ff00;
    else if(e instanceof Env)return 0x0000ff;
    else if(e instanceof Pos)return 0xc0c0c0;
    return e!=null?0x808080:0xffffff
}

function strOf(e){
    if(typeof e==='object')if(e instanceof InstNode)return INST_TABLE.get(e.fn)[0];
    else if(e instanceof DataNode)return e.type._uneval()[0];
    else if(e instanceof Env)return 'E';
    else if(e instanceof Pos)return 'P';
    if(e==null)return '█';if(typeof e==='number'){let s=e.toString();if(s.length<3)return s;else return s.slice(0,2)+'#';}
}


function strImg(color,text,cellSize){
    cellSize>>>=0;return (((strImg.buffer??={})[color]??={})[text]??={})[cellSize]??=(()=>{
        let canvas=document.createElement('canvas');canvas.width=canvas.height=cellSize;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.textAlign='center';ctx.textBaseline='middle';
        let fontSize=0;do{ctx.font=(++fontSize)+'px sans-serif';var r=ctx.measureText(text);if(r.width<1/16)return canvas;}while(r.width<cellSize*1.0&&r.actualBoundingBoxAscent+r.actualBoundingBoxDescent<cellSize*1.0);
        ctx.font='bold '+fontSize+'px sans-serif';ctx.fillText(text,cellSize/2,cellSize/2);return canvas;
    })();
}


/**@param {Env} env @param {number} cellSize  */
function imgOfEnv(env,cellSize){
    cellSize=Math.max(1,cellSize>>>0);
    /**@type {HTMLCanvasElement} */
    let canvas=env.bufferCanvas??=document.createElement('canvas');let ctx=canvas.getContext('2d');
    canvas.width=env.width*cellSize;canvas.height=env.height*cellSize;
    /**@type {ImageData} */
    let data=env.bufferData;if(!data||data.width!==canvas.width||data.height!==canvas.height)data=new ImageData(canvas.width,canvas.height);
    const width=env.width,height=env.height;
    if(cellSize===1){
        for(let y=0;y<height;y++)for(let x=0;x<width;x++){
            let d=data.data,i=(width*y+x)*4,c=colorOf(env.data[y][x]);d[i]=c>>16&0xff;d[i+1]=c>>8&0xff;d[i+2]=c&0xff;d[i+3]=0xff;
        }
        ctx.putImageData(data,0,0);
    }
    else for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        let o=env.data[y][x],sub=o instanceof Env?imgOfEnv(o,cellSize/Math.max(o.width,o.height)):strImg(colorOf(o),strOf(o),cellSize);
        let [dx,dy]=sub.height>sub.width?[(1-sub.width/sub.height)/2,0]:[0,(1-sub.height/sub.width)/2];
        ctx.drawImage(sub,0,0,sub.width,sub.height,(x+dx)*cellSize,(y+dy)*cellSize,(1-2*dx)*cellSize,(1-2*dy)*cellSize);
    }
    return canvas
}

function renderLogic(){
    /** @type {HTMLCanvasElement}*/
    const canvas=document.getElementById('canvas');const ctx=canvas.getContext("2d");
    const width=WORLD.width,height=WORLD.height;
    canvas.style.width=width/height*parseInt(canvas.style.height)+'px';
    const cellSize=RENDER_CELL_SIZE;
    canvas.width=width*cellSize;canvas.height=height*cellSize;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(imgOfEnv(WORLD,cellSize),0,0);
}

export {tickLogic,renderLogic}