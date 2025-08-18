/**
@typedef {Int32Array & {ptrs: MemoryPtrs,compiledFunc:()=>function,compiledMainFunc:()=>function,compiledCodeBlock:()=>CodeBlock}} Memory
@typedef {Map<number, Memory>} MemoryPtrs
@typedef {{IN:ExprStacks,OUT:ExprStacks,code:string,cost:number,closure:Map<function,string>,UID:string}} CodeBlock
*/

/**@type {Memory} */
globalThis.ZERO_MEMORY=new Int32Array();

Int32Array.prototype.ptrs=new Map();//反正不可变，直接在原型中存储空状态，平时就不需要为新内存写入指针信息了
ZERO_MEMORY.ptrs.set=(i,x)=>{throw(new Error('不该出现的写入'))};

Int32Array.prototype.compiledCodeBlock=function(){return this.CODE_BLOCK_CACHE??=new Context().include(this).compile()}
Int32Array.prototype.compiledFunc=function(){return this.FUNC_CACHE??=(()=>{
    /**@type {CodeBlock} */
    let block=this.compiledCodeBlock();
    let params=Object.values(block.IN).flat();//因此各栈的顺序不能乱变了
    let returns=Object.values(block.OUT).flat();
    let code='return ('+params.join(',')+')=>{'+'__COST('+(10+block.cost+(params.length+returns.length)/2)+');'+block.code+'return ['+returns.join(',')+'];}';
    __COST(code.length*10);
    return Function(...block.closure.values(),code)(...block.closure.keys());
})();}
Int32Array.prototype.compiledMainFunc=function(){return this.MAIN_FUNC_CACHE??=(()=>{
    /**@type {CodeBlock} */
    let block=this.compiledCodeBlock();
    let paramsCodes=Object.entries(block.IN).map(([type,arr])=>{
        if(arr.length===0)return '';
        let code=type==='int'?'0':type==='readOnly'?'ZERO_MEMORY':type==='writable'?'_MALLOC(0)':(()=>{throw new TypeError('unknown type:'+type)})();
        return 'let '+arr.map(v=>v+'='+code).join(',')+';';
    }).flat();//因此各栈的顺序不能乱变了

    let code='return ()=>{'+'__COST('+(100+block.cost)+');'+paramsCodes.join('')+block.code+'}';
    __COST(code.length*10);
    return Function(...block.closure.values(),code)(...block.closure.keys());
})();}



function floorMod(a,b){let r=a%b;return r<0?r+b:r;}
function limitTo(x,a,b){return x<a?a:x>b?b:x;}
class Entity{
    energy=0;program=ZERO_MEMORY;x=0;y=0;world=[[this]];score=0;
    DX=0;DY=0;
    transferEnergy(n){
        let E=this.getE();if(n<0&&E.program.length>0)return 0;//如果对方活着（有程序且有能量），就不能直接取出对方能量
        if(n>0){if(n>this.energy)n=this.energy;this.energy-=n;E.energy+=n;}else{n=-n;if(n>E.energy)n=E.energy;E.energy-=n;this.energy+=n;}return n|0;
    }
    tryWrite(arr){
        let E=this.getE();[arr,E.program]=[E.program,arr];return arr;//尝试与手上arr交换，然后返回
    }
    tryDivide(minEnergy){
        let energy=Math.floor(this.energy/2);if(energy<minEnergy)return 0;
        let E=this.getE();if(E.program.length)return 0;//程序活着就不能在此繁殖
        E.program=this.program;E.energy+=energy;this.energy-=energy;return energy;
    }
    move(){
        let B=this.getE(),A=this;
        [A.world[A.y][A.x],B.world[B.y][B.x]]=[B,A];
        [B.x,B.y,B.world,B.score,A.x,A.y,A.world,A.score]=[A.x,A.y,A.world,A.score,B.x,B.y,B.world,B.score];
    }
    getE(){//相对位置：自己横向+x纵向+y之处
        return this.world[limitTo(this.y+this.DY,0,this.world.length-1)][limitTo(this.x+this.DX,0,this.world[0].length-1)];
    }
    tick(){
        if(this.program.length===0||this.energy<=0)return;
        const OLD_SELF=SELF;SELF=this;
        this.DX=0;this.DY=0;
        try{
            let f=this.program.compiledMainFunc();f();
        }catch(error){
            if(error.message==='Array buffer allocation failed')console.log('出现内存分配耗尽错误：',error);
            else if(error.message!=='LACK OF ENERGY')throw error;
        }
        SELF=OLD_SELF;
    }
}
globalThis.SELF=new Entity();SELF.energy=Infinity;

/**@returns {Entity[][]}*/
function newWorld(width,height){
    let world=[];for(let y=0;y<height;y++){
        world[y]=[];for(let x=0;x<width;x++){let E=new Entity();E.world=world;world[y][x]=E;E.x=x;E.y=y;}
    }
    return world;
}

/**@param {Entity[][]} world*/
function copyWorld(world){
    let w=newWorld(world[0].length,world.length);
    for(let y=0;y<world.length;y++)for(let x=0;x<world[0].length;x++){let d=w[y][x],s=world[y][x];d.energy=s.energy;d.program=s.program;d.score=s.score;}
    return w;
}

globalThis.__COST=cost=>{if((SELF.energy-=cost)<0){SELF.energy=0;throw new Error('LACK OF ENERGY');}};

const MEM_LIMIT=1024;
globalThis._IDX=(arr,i)=>i<arr.length?arr[i]:0;
globalThis._MALLOC=(n)=>{if(n>MEM_LIMIT)n=MEM_LIMIT;__COST(10+n/8);let result=new Int32Array(n);result.ptrs=new Map();return result}//要不是必须存在第一个数组，全用_SLICE都行，没_MALLOC什么事了
/**@param {Memory} arr @param {number} start @param {number} end */
globalThis._SLICE=(arr,start,end)=>{//这个函数功能较为强大，相当于没限制坐标越界的slice（越界就是默认值0），start>end时则将结果反转。
    let reverse=end<start;if(reverse)[end,start]=[start,end];if(end-start>MEM_LIMIT)end=start+MEM_LIMIT;
    let result=new Int32Array(end-start);result.ptrs=new Map();if(end===start)return result;
    let copyStart=Math.min(Math.max(0,start),arr.length),copyEnd=Math.min(Math.max(0,end),arr.length),copyLen=copyEnd-copyStart;
    __COST((end-start)/8+(copyLen>0?copyLen+20:0));//原本是copyLen*(reverse?2:1)，但性能测试表示反转的复制性能似乎与正向复制差不多
    if(copyLen===0)return result;
    let sub=arr.subarray(copyStart,copyEnd);let dest=reverse?end-copyEnd:copyStart-start;
    result.set(sub,dest);if(reverse)result.subarray(dest,dest+copyLen).reverse();return result;
};
globalThis._PTR_KEYS=(arr)=>{__COST(arr.ptrs.size*10);return new Int32Array(arr.ptrs.keys());}
globalThis._MAP_OPER=(A,B,oper)=>{//0bDCBA，ABCD分别是：单独A时是否采用、单独B时是否采用、AB时是否采用A、AB时是否采用B（两者皆有就随机选一边）
    oper&=0b1111;if(oper===0b0000)return new Map();if(oper===0b0101)return new Map(A);if(oper===0b1010)return new Map(B);
    let m;switch(oper&0b0011){case 0:m=new Map();break;case 1:__COST(A.size*10);m=new Map(A);break;case 2:__COST(B.size*10);m=new Map(B);break;case 3:__COST(A.size*10+B.size*15);m=new Map(A);for (const [k,v] of B)m.set(k,v);break;}
    __COST((A.size+B.size+Math.min(A.size,B.size))*10);let INT=new Set(A.keys()).intersection(new Set(B.keys()));__COST(INT.size*[10,20,20,25][oper>>2]);
    switch(oper>>2){case 0:for(let k of INT)m.delete(k);break;case 1:for(let k of INT)m.set(k,A.get(k));break;case 2:for(let k of INT)m.set(k,B.get(k));break;case 3:for(let k of INT)m.set(k,Math.random()<.5?A.get(k):B.get(k));break;}
    return m;
}
globalThis._COPY_WRITABLE=arr=>{__COST(arr.length+arr.ptrs.size*10);let result=arr.slice();result.ptrs=new Map(arr.ptrs);return result;}

globalThis.PROGRAM_MUTATE=arr=>{
    __COST(arr.length);
    let result=new Int32Array(arr);result.ptrs=arr.ptrs;
    result[result.length*Math.random()>>>0]=randInt();
    return result;
}
globalThis.PROGRAM_CROSSOVER=(a,b)=>{
    let ia=Math.random()*a.length|0,ja=Math.random()*a.length|0,ib=Math.random()*b.length|0,jb=Math.random()*b.length|0;
    if(ia>ja)[ia,ja]=[ja,ia];if(ib>jb)[ib,jb]=[jb,ib];let na=ja-ia,nb=jb-ib;
    __COST(a.length-na+nb);
    let result=new Int32Array(a.length-na+nb);
    result.set(a.subarray(0,ia),0);result.set(b.subarray(ib,jb),ia);result.set(a.subarray(ja),ia+nb);
    result.ptrs=a.ptrs;return result;
}
globalThis.PROGRAM_REPLACE_PTR=(arr,i,arr1)=>{//修改arr[i]处编码对应的ptr，只为了增加成功率
    if(i<0||i>=arr.length)return arr;
    let result=_COPY_WRITABLE(arr);result.ptrs.set(i,arr1);return result;
}

class ExprStacksCount{
    int=0;readOnly=0;writable=0;link=0;
    /**@param {ExprStacks} stacks */
    expandTo(stacks){for(let i in stacks)if(this[i]<stacks[i].length)this[i]=stacks[i].length;return this;}
    limitTo(stacks){for(let i in stacks)if(this[i]>stacks[i].length)this[i]=stacks[i].length;return this;}
}
class ExprStacks{
    int=[];readOnly=[];writable=[];link=[];//哪怕只有int，也得有3类栈。然后link也是必须加的栈，不然if for等碰撞成功率将几乎为0。
    /** @param {ExprStacksCount} counts */
    pops(counts){//格式统一，容易写一点
        for(let i in counts){if(this[i].length<counts[i])return undefined;}
        let result={};for(let i in counts)result[i]=this[i].splice(this[i].length-counts[i]);
        return result;
    }
    /** @param {ExprStacks} stacks */
    pushs(stacks){for(let i in stacks)this[i].push(...stacks[i])}
}
/**@param {Context} ctx  */
const requestInput=function(ctx,type,pos){
    let stack=ctx.inputs[type];while(pos>=stack.length)stack.push(ctx.allocVar(ctx.typeNow));return stack[pos];
}
/**@param {number}cost @param {string} code*/
const simpleInst=function(cost,code){
    const SEPARATOR='\0';
    let varsRequired={},varsOut={},pushBack={};let stackOf=(dict,irw)=>dict[{i:'int',r:'readOnly',w:'writable'}[irw]]??=[];
    let codeProcessed=code.replace(/[IOR][irw][0-9]/g,(v)=>{
        stackOf(v[0]==='I'||v[0]==='R'?varsRequired:varsOut,v[1])[v[2]]=v;//为此断言code中的写法一定是0 1 2 ...，而I与U使用相同的栈，只是U会放回去
        if(v[0]==='R')stackOf(pushBack,v[1])[v[2]]=v;//这会导致出现空隙
        return SEPARATOR+v+SEPARATOR;
    }).split(SEPARATOR).map((s,i)=>{return /^[IOR][irw][0-9]$/g.test(s)?s:JSON.stringify(s)}).join('+');//假设语句不以变量符号开头
    
    for(let i in pushBack)pushBack[i].filter(x=>true);//清除空隙，而js中的空隙不会进入filter函数
    let IN_COUNT={};for(let i in varsRequired)IN_COUNT[i]=varsRequired[i].length;
    let OUT_COUNT={};for(let i in varsOut)OUT_COUNT[i]=varsOut[i].length;
    
    //I 输入（消耗），O 输出，R 读取（不消耗）
    return Function('ctx',
        'let vars=ctx.stacks.pops('+JSON.stringify(IN_COUNT).replaceAll('"','')+');if(!vars)return;\n'+
        'let '+JSON.stringify(varsRequired).replaceAll('"','')+'=vars;ctx.cost+='+cost+';\n'+
        'let '+JSON.stringify(varsOut).replaceAll('"','')+'=ctx.allocVars('+JSON.stringify(OUT_COUNT).replaceAll('"','')+');\n'+
        (Object.keys(pushBack).length===0?'':'ctx.stacks.pushs('+JSON.stringify(pushBack).replaceAll('"','')+');\n')+
        'ctx.statements.push('+codeProcessed+');\n'+
        'ctx.stacks.pushs('+JSON.stringify(varsOut).replaceAll('"','')+');\n',
    );
}
const forEachVars=(func,dst,src)=>{
    let codes=[];let compilingCost=0;
    for(let type in dst){
        for(let arr=dst[type],i=0;i<arr.length;i++)codes.push(src?func(arr[i],src[type][i]):func(arr[i]));
        compilingCost+=10;
    }
    __COST(compilingCost);return codes;
}
const codeAssigns=(dst,src,dstPrefix='',srcPrefix='')=>{let codes=forEachVars((a,b)=>dstPrefix+a+'='+srcPrefix+b,dst,src);return codes.length?codes.join(';')+';':''}
const codeVars=(dst,dstPrefix='')=>{let codes=forEachVars((a)=>dstPrefix+a,dst);return codes.length===0?'':'let '+codes.join(',')+';'}
const codeVarsAndAssigns=(dst,src,dstPrefix='',srcPrefix='')=>{let codes=forEachVars((a,b)=>dstPrefix+a+'='+srcPrefix+b,dst,src);return codes.length===0?'':'let '+codes.join(',')+';'}
const allocRandVarName=length=>Array.from(Array(length),()=>'0123456789$ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'[Math.random()*64>>>0]).join('');
//10位时，64**10种可能性的变量名，其实已经足够避免碰撞，只是太长了，可能降低代码编译速度，所以不太想用

let INSTRUCTIONS={
    /**@param {Context} ctx  */
    TYPE_INT(ctx){ctx.typeNow='int'},
    TYPE_READONLY(ctx){ctx.typeNow='readOnly'},
    TYPE_WRITABLE(ctx){ctx.typeNow='writable'},
    TYPE_CODE(ctx){ctx.typeNow='link'},//只能在编译阶段用
    /**@param {Context} ctx  */
    ARG0(ctx){if(ctx.typeNow!=='link')ctx.stacks[ctx.typeNow].push(requestInput(ctx,ctx.typeNow,0+ctx.argOffset))},
    ARG1(ctx){if(ctx.typeNow!=='link')ctx.stacks[ctx.typeNow].push(requestInput(ctx,ctx.typeNow,1+ctx.argOffset))},
    ARG2(ctx){if(ctx.typeNow!=='link')ctx.stacks[ctx.typeNow].push(requestInput(ctx,ctx.typeNow,2+ctx.argOffset))},
    ARG3(ctx){if(ctx.typeNow!=='link')ctx.stacks[ctx.typeNow].push(requestInput(ctx,ctx.typeNow,3+ctx.argOffset))},

    /**@param {Context} ctx  */
    DUPE(ctx){
        let stack=ctx.stacks[ctx.typeNow];if(stack.length<1)return;
        if(ctx.typeNow==='writable'){
            let vDst=ctx.allocVar(ctx.typeNow),vSrc=stack.at(-1);
            stack.push(vDst);ctx.statements.push('let '+vDst+'=_COPY_WRITABLE('+vSrc+');');
        }else (a=>a.push(a.at(-1)))(ctx.stacks[ctx.typeNow]);
    },
    /**@param {Context} ctx  */
    SWAP(ctx){if(ctx.stacks[ctx.typeNow].length>=2)(a=>{a.push(a.pop(),a.pop())})(ctx.stacks[ctx.typeNow]);},
    /**@param {Context} ctx  */
    // ROT(ctx){if(ctx.stacks[ctx.typeNow].length>=3)(a=>{let [x,y,z]=a.splice(-3);a.push(y,z,x)})(ctx.stacks[ctx.typeNow]);},
    // /**@param {Context} ctx  */
    DIG(ctx){if(ctx.stacks[ctx.typeNow].length>=2)(a=>{a.push(a.shift())})(ctx.stacks[ctx.typeNow]);},
    /**@param {Context} ctx  */
    DROP(ctx){if(ctx.stacks[ctx.typeNow].length>=1)(a=>{a.pop();})(ctx.stacks[ctx.typeNow]);},
    /**@param {Context} ctx  */
    ARG_OFFSET_SET_0(ctx){ctx.argOffset=0},
    ARG_OFFSET_ADD_1(ctx){ctx.argOffset+=1},
    ARG_OFFSET_ADD_4(ctx){ctx.argOffset+=4},
    ARG_OFFSET_ADD_16(ctx){ctx.argOffset+=16},
    
    SWITCH_SIGN:simpleInst(1,'let Oi0=Ii0^-0x80000000;'),
    INC:simpleInst(1,'let Oi0=Ii0+1;'),
    DEC:simpleInst(1,'let Oi0=Ii0-1;'),
    SHL1:simpleInst(1,'let Oi0=Ii0<<1;'),
    SHR1:simpleInst(1,'let Oi0=Ii0>>1;'),
    SHL1N:simpleInst(1,'let Oi0=1<<Ii0;'),
    RAND:simpleInst(5,'let Oi0=Math.random()*0x100000000|0;'),
    RAND_N:simpleInst(5,'let Oi0=Math.random()*Ii0|0;'),

    AND:simpleInst(1,'let Oi0=Ii0&Ii1;'),
    OR:simpleInst(1,'let Oi0=Ii0|Ii1;'),
    XOR:simpleInst(1,'let Oi0=Ii0^Ii1;'),
    SHL:simpleInst(1,'let Oi0=Ii0<<Ii1;'),
    SHR:simpleInst(1,'let Oi0=Ii0>>Ii1;'),
    USHR:simpleInst(1,'let Oi0=Ii0>>>Ii1|0;'),
    NOT:simpleInst(1,'let Oi0=!Ii0|0;'),
    INV:simpleInst(1,'let Oi0=~Ii0;'),
    
    ADD:simpleInst(1,'let Oi0=Ii0+Ii1|0;'),
    SUB:simpleInst(1,'let Oi0=Ii0-Ii1|0;'),
    MUL:simpleInst(1,'let Oi0=Ii0*Ii1|0;'),
    DIV:simpleInst(1,'let Oi0=Ii0/Ii1|0;'),
    MOD:simpleInst(1,'let Oi0=Ii0%Ii1|0;'),
    UDIV:simpleInst(1,'let Oi0=(Ii0>>>0)/(Ii1>>>0)|0;'),
    UMOD:simpleInst(1,'let Oi0=(Ii0>>>0)%(Ii1>>>0)|0;'),
    NEG:simpleInst(1,'let Oi0=-Ii0|0;'),
    
    GT:simpleInst(1,'let Oi0=Ii0>Ii1?1:0;'),
    LT:simpleInst(1,'let Oi0=Ii0<Ii1?1:0;'),
    GTE:simpleInst(1,'let Oi0=Ii0>=Ii1?1:0;'),
    LTE:simpleInst(1,'let Oi0=Ii0<=Ii1?1:0;'),
    EQ:simpleInst(1,'let Oi0=Ii0===Ii1?1:0;'),
    NE:simpleInst(1,'let Oi0=Ii0!==Ii1?1:0;'),
    MIN:simpleInst(1,'let Oi0=Ii0<Ii1?Ii0:Ii1;'),
    MAX:simpleInst(1,'let Oi0=Ii0>Ii1?Ii0:Ii1;'),
    
    R_GET:simpleInst(4,'let Oi0=_IDX(Rr0,Ii0>>>0);'),
    R_PTR_JUMP:simpleInst(10,'let Or0=Ir0.ptrs.get(Ii0)??Ir0;'),
    R_LEN:simpleInst(4,'let Oi0=Rr0.length;'),
    R_PTR_LEN:simpleInst(6,'let Oi0=Rr0.ptrs.size;'),
    R_SUBARRAY:simpleInst(20,'let Or0=Ir0.subarray(Ii0,Ii1);Or0.ptrs=Ir0.ptrs;'),
    R_SLICE_TO_W:simpleInst(20,'let Ow0=_SLICE(Ir0,Ii0,Ii1);'),
    W_TO_R:simpleInst(1,'let Or0=Iw0;'),
    W_MALLOC:simpleInst(4,'let Ow0=_MALLOC(Ii0>0?Ii0:0);'),
    
    W_GET:simpleInst(4,'let Oi0=_IDX(Rw0,Ii0>>>0);'),
    W_PTR_GET:simpleInst(10,'let Or0=Rw0.ptrs.get(Ii0)??ZERO_MEMORY;'),
    W_LEN:simpleInst(4,'let Oi0=Rw0.length;'),
    W_PTR_LEN:simpleInst(6,'let Oi0=Rw0.ptrs.size;'),
    W_SET:simpleInst(4,'Rw0[Ii0>>>0]=Ii1;'),
    W_PTR_SET:simpleInst(10,'Rw0.ptrs.set(Ii0,Ir0);'),
    W_PTR_DEL:simpleInst(10,'let Oi0=Rw0.ptrs.delete(Ii0)|0;'),
    W_PTR_MAP_OPER:simpleInst(30,'Rw0.ptrs=_MAP_OPER(Rw0.ptrs,Rr0.ptrs,Ii0);'),

    /**@param {Context} ctx  */
    INCLUDE(ctx){
        let vars=ctx.stacks.pops({link:1});if(!vars)return;
        /**@type {{link:[Memory]}} */
        let {link:[f]}=vars;
        ctx.include(f);//其实有可能递归：里面的代码块又引用了代码块本身，还再次include了，就无限递归了。
    },
    /**@param {Context} ctx  */
    CALL(ctx){
        let vars=ctx.stacks.pops({link:1});if(!vars)return;
        /**@type {{link:[Memory]}} */
        let {link:[f]}=vars;
        let func=f.compiledFunc();
        let fInfo=f.compiledCodeBlock();
        let IN_COUNT=new ExprStacksCount().expandTo(fInfo.IN),varsIn=ctx.stacks.pops(IN_COUNT);if(!varsIn){ctx.stacks.pushs(vars);return;}//还原
        let OUT_COUNT=new ExprStacksCount().expandTo(fInfo.OUT),varsOut=ctx.allocVars(OUT_COUNT);
        let fID=ctx.closure.get(func)??(()=>{ctx.closure.set(func,fInfo.UID);return fInfo.UID})();
        let code='let ['+forEachVars(x=>x,varsOut).join(',')+']='+fID+'('+forEachVars(x=>x,varsIn).join(',')+');';
        ctx.statements.push(code);
        ctx.stacks.pushs(varsOut);
    },
    /**@param {Context} ctx  */
    IF(ctx){
        let vars=ctx.stacks.pops({int:1,link:2});if(!vars)return;
        /**@type {{int:[string],link:[Memory,Memory]}} */
        let {int:[cond],link:[tBlock,fBlock]}=vars;
        let t=tBlock.compiledCodeBlock(),f=fBlock.compiledCodeBlock();
        let IN_COUNT=new ExprStacksCount().expandTo(t.IN).expandTo(f.IN);//输入取两者并集
        let varsIn=ctx.stacks.pops(IN_COUNT);if(!varsIn){ctx.stacks.pushs(vars);return;}//还原
        let OUT_COUNT=new ExprStacksCount().expandTo(t.OUT).limitTo(f.OUT);//输出取两者交集
        let varsOut=ctx.allocVars(OUT_COUNT);let varsTmp=ctx.allocVars(IN_COUNT);//varsOut是新变量，能保证一定不重复，所以开头加“$”即可作为中间变量。但In不能保证。
        let costCode={t:'',f:''};if(Math.abs(t.cost-f.cost)<20)ctx.cost+=Math.max(t.cost,f.cost)+2;//分支耗能相差不大就直接扣最大值
        else{ctx.cost+=Math.min(t.cost,f.cost)+2;costCode[t.cost>f.cost?'t':'f']='__COST('+(Math.abs(t.cost-f.cost)+10)+');'}//相差大就先扣最小值，另一个分支扣差值
        
        let code=codeVars(varsOut)+
        'if('+cond+'){'+costCode.t+
            codeVarsAndAssigns(varsTmp,varsIn,'$')+codeVars(varsOut,'$$')+'{'+//套壳，避免变量重名
                codeVarsAndAssigns(t.IN,varsTmp,'','$')+t.code+codeAssigns(varsOut,t.OUT,'$$')+
            '}'+codeAssigns(varsOut,varsOut,'','$$')+
        '}else{'+costCode.f+
            codeVarsAndAssigns(varsTmp,varsIn,'$')+codeVars(varsOut,'$$')+'{'+//套壳，避免变量重名
                codeVarsAndAssigns(f.IN,varsTmp,'','$')+f.code+codeAssigns(varsOut,f.OUT,'$$')+
            '}'+codeAssigns(varsOut,varsOut,'','$$')+
        '}';
        ctx.statements.push(code);
        ctx.stacks.pushs(varsOut);
        for(let closure of [t.closure,f.closure])for(let [func,id] of closure)ctx.closure.set(func,id);//代码里面有可能存在导入，必须处理
    },
    /**@param {Context} ctx  */
    FOR_N(ctx){
        let vars=ctx.stacks.pops({link:1});if(!vars)return;
        /**@type {{link:[Memory]}} */
        let {link:[bodyBlock]}=vars;
        let body=bodyBlock.compiledCodeBlock();
        
        let IO_COUNT=new ExprStacksCount().expandTo(body.IN),varsIn;//最后一个int输入是迭代序号，同时输入量最后一个数字刚好也当作输入的迭代次数
        if(IO_COUNT.int<1||!(varsIn=ctx.stacks.pops(IO_COUNT))){ctx.stacks.pushs(vars);return;}//还原
        let limitCount=(stacks,counts)=>{let o={};for(let type in stacks)o[type]=stacks[type].slice(0,counts[type]??0);return o};
        let varsTmp=ctx.allocVars(IO_COUNT);let iter=varsTmp.int.at(-1);//使得循环体里面的迭代变量$x不会被重新赋值
        IO_COUNT.int--;let varsOut=ctx.allocVars(IO_COUNT);
        let code='if('+varsIn.int.at(-1)+'>0)__COST('+varsIn.int.at(-1)+'*'+(body.cost+3)+');'+
        codeVars(varsOut)+'{'+
            codeVarsAndAssigns(varsTmp,varsIn,'$')+
            'let $$'+iter+'=$'+iter+';for($'+iter+'=0;$'+iter+'<$$'+iter+';$'+iter+'++){'+//把$x赋给$$x，就能把$x清零当作迭代变量用了
                codeVarsAndAssigns(body.IN,varsTmp,'','$')+body.code+codeAssigns(limitCount((varsTmp.int.pop(),varsTmp),new ExprStacksCount().expandTo(body.OUT)),body.OUT,'$')+//使得循环体里面的迭代变量$x不会被重新赋值
            '}'+codeAssigns(varsOut,varsTmp,'','$')+
        '}';
        ctx.statements.push(code);
        ctx.stacks.pushs(varsOut);
        for(let [func,id] of body.closure)ctx.closure.set(func,id);//代码里面有可能存在导入，必须处理
    },
    '0x80000044|0':ctx=>{},
    '0x80000045|0':ctx=>{},
    '0x80000046|0':ctx=>{},
    '0x80000047|0':ctx=>{},
    CURSOR_SWAP_X:simpleInst(5,'let Oi0=SELF.DX;SELF.DX=Ii0;'),
    CURSOR_DEC_X:simpleInst(5,'SELF.DX=SELF.DX-1|0;'),
    CURSOR_INC_X:simpleInst(5,'SELF.DX=SELF.DX+1|0;'),
    CURSOR_NEG_X:simpleInst(5,'SELF.DX=-SELF.DX|0;'),
    CURSOR_SWAP_Y:simpleInst(5,'let Oi0=SELF.DY;SELF.DY=Ii0;'),
    CURSOR_DEC_Y:simpleInst(5,'SELF.DY=SELF.DY-1|0;'),
    CURSOR_INC_Y:simpleInst(5,'SELF.DY=SELF.DY+1|0;'),
    CURSOR_NEG_Y:simpleInst(5,'SELF.DY=-SELF.DY|0;'),

    E_READ_PROGRAM:simpleInst(30,'let Or0=SELF.getE().program;'),
    E_EXCHANGE_PROGRAM:simpleInst(30,'let Or0=SELF.tryWrite(Ir0);'),
    E_MOVE:simpleInst(30,'SELF.move();'),
    E_READ_SCORE:simpleInst(30,'let Oi0=SELF.getE().score;'),
    
    E_ENERGY_GET:simpleInst(30,'let Oi0=Math.min(SELF.getE().energy,0x7fffffff)|0;'),
    E_DIVIDE:simpleInst(30,'let Oi0=SELF.tryDivide(Ii0);'),
    PROGRAM_MUTATE:simpleInst(30,'let Or0=PROGRAM_MUTATE(Ir0);'),
    PROGRAM_CROSSOVER:simpleInst(30,'let Or0=PROGRAM_CROSSOVER(Ir0,Ir1);'),
    PROGRAM_REPLACE_PTR:simpleInst(30,'let Or0=PROGRAM_REPLACE_PTR(Ir0,Ii0,Ir1);'),
};
// for(let n=0;n<3;n++)for(let MORE_USED of ['CALL','IF','FOR_N'])INSTRUCTIONS[MORE_USED+'$'+n]=INSTRUCTIONS[MORE_USED];
// for(let n=0;n<3;n++)for(let id in INSTRUCTIONS)if(id.startsWith('E_'))INSTRUCTIONS[id+'$'+n]=INSTRUCTIONS[id];

let OPCODE_TO_INSTRUCTION=new Map(Object.entries(INSTRUCTIONS).map(([name,f],i)=>[i^0x80000000,f]));
let NAME_TO_OPCODE=new Map(Object.entries(INSTRUCTIONS).map(([name,f],i)=>[name,i^0x80000000]));
let OPCODE_TO_NAME=new Map(Object.entries(INSTRUCTIONS).map(([name,f],i)=>[i^0x80000000,name]));
globalThis.OPCODE_TO_INSTRUCTION=OPCODE_TO_INSTRUCTION;globalThis.NAME_TO_OPCODE=NAME_TO_OPCODE;globalThis.OPCODE_TO_NAME=OPCODE_TO_NAME;

class Context{
    statements=[];inputs=new ExprStacks();stacks=new ExprStacks();cost=0;
    typeNow='int';argOffset=0;
    varsCounter={};closure=new Map();
    allocVar(type){__COST(10);this.varsCounter[type]??=0;return type[0]+(this.varsCounter[type]++);}//因此要保证不同类型栈的首字母不同
    allocVars(counts){let vars={};for(let type in counts)vars[type]=Array.from(Array(counts[type]),()=>this.allocVar(type));return vars;}
    
    /**
     * @param {Memory} insts 
     */
    include(insts){
        __COST(insts.length*300);//编译一条指令的基础耗能
        for(let i=0;i<insts.length;i++){
            let val=insts[i];
            let ptrContent=insts.ptrs.get(val);
            if(ptrContent!==undefined){//第一优先级：指针存在，就把对应数组放进link栈
                this.stacks.link.push(ptrContent);
            }else{
                let inst=OPCODE_TO_INSTRUCTION.get(val);
                if(inst)inst(this);//第二优先级：对应指令存在，则执行指令
                else{//否则视作常数，为int栈增添一个新元素
                    this.stacks.int.push(val<0?'('+val.toString()+')':val.toString());
                }
            }
        }
        // for(let unused_insts of this.stacks.link){this.include(unused_insts)}//最后没用上的全部视作普通代码导入，增加函数有效率
        return this;
    }
    compile(){
        this.stacks.link.length=0;//删除所有元素，因为link只是构造时用的
        return {IN:this.inputs,OUT:this.stacks,cost:this.cost,code:this.statements.join(''),closure:this.closure,UID:'f_'+allocRandVarName(10)}
    }
}




globalThis.newMem=newMem;
/** @param {number[]|Int32Array} arr  @param {{[number]:Memory}|Map<number,Memory>} ptrs  @returns {Memory}*/
function newMem(arr,ptrs){
    let m=Int32Array.from(arr);
    if(ptrs instanceof Map)m.ptrs=ptrs;
    else if(ptrs?.constructor===Object)m.ptrs=new Map(Object.entries(ptrs).map(([i,a])=>{
        i=+i;if(i!==(i|0))throw new TypeError('key in ptrs should be int32');
        return [i,a];
    }));
    return m;
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
                if(x instanceof Int32Array){
                    if(x===ZERO_MEMORY)return 'ZERO_MEMORY';
                    let ptrsPart=x.ptrs.size===0?'':',{'+[...x.ptrs.entries()].map(([ptr,m1])=>'['+numToString(ptr)+']:'+recursiveUneval(m1)).join(',')+'}';
                    let v=allocVar('m',x);
                    codes.push('with(Object.fromEntries(NAME_TO_OPCODE)){var '+v+'=newMem(['+Array.from(x).map(n=>numToString(n))+']'+ptrsPart+');}');
                    let withTry=line=>"try{"+line+"}catch(e){console.log(e)};";
                    if(x.FUNC_CACHE)codes.push(withTry(v+'.compiledFunc();'));
                    if(x.MAIN_FUNC_CACHE)codes.push(withTry(v+'.compiledMainFunc();'));
                    if(!x.FUNC_CACHE&&!x.MAIN_FUNC_CACHE&&x.CODE_BLOCK_CACHE);codes.push(withTry(v+'.compiledCodeBlock();'));//虽然是小概率事件
                    return v;
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



/**@param {Entity[][]}world */
globalThis.worldToSerializable=function(world){return world.map(line=>line.map(E=>[E.program,E.score,E.energy]))}
/**@returns {Entity[][]} */
globalThis.worldFromSerializable=function(w){
    let width=w[0].length,height=w.length;let world=newWorld(width,height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){let E=world[y][x];[E.program,E.score,E.energy]=w[y][x];}
    return world;
}


/**@param {Memory} arr @param {Memory=>boolean} predicate */
let optimizeSize=(arr,predicate)=>{
    let firstCheck=predicate(arr);if(!firstCheck){console.log('警告：试了一次，输入本身进入谓词函数就返回假（'+firstCheck+'）了');}
    /**@param {Memory} arr*/
    let diff=arr=>{
        if(!(arr instanceof Int32Array))console.log(arr);
        let diffInner=arr.ptrs.size>0&&Math.random()<.5?true:false;//选择优化方向
        if(diffInner){//选择递归地尝试修改里面，如果修改成功就返回新结果
            let key=[...arr.ptrs.keys()][arr.ptrs.size*Math.random()|0],arr1=arr.ptrs.get(key),arr1Diffed=Math.random()<.8?diff(arr1):null;if(arr1Diffed===arr1)return arr;
            let result=new Int32Array(arr);result.ptrs=new Map(arr.ptrs);if(arr1Diffed===null)result.ptrs.delete(key);else result.ptrs.set(key,arr1Diffed);return result;
        }else{//选择修改本数组，如果修改成功就返回新结果
            let m=Math.random()*arr.length|0,n=Math.random()*arr.length|0;if(m===n)return arr;if(m>n)[m,n]=[n,m];
            let result=new Int32Array(arr.length-(n-m));result.set(arr.subarray(0,m),0);result.set(arr.subarray(n),m);result.ptrs=arr.ptrs;return result;
        }
    }
    
    console.log('开始优化：长度为',arr.length,'，内部数组数为',arr.ptrs.size);
    for(let tryTime=0;tryTime<1000;tryTime++){
        let arr1=diff(arr);if(arr1===arr||!predicate(arr1))continue;//如果修改失败（没能生成新数组）或违反了谓词就重试
        tryTime=0;arr=arr1;console.log('已优化到',arr.length);
    }
    return arr;
}

var randInt=()=>Math.random()<.2?(Math.random()*50-25|0):0x80000000|(Math.random()*OPCODE_TO_INSTRUCTION.size);
var randMem=(maxLen,nestLevel=2)=>{
    let arr=Array.from(Array(maxLen*Math.random()|0),randInt),ptrs={};
    if(arr.length&&nestLevel>0)while(Math.random()<.5){let fID=arr[arr.length*Math.random()|0];ptrs[fID]=randMem(maxLen,nestLevel-1);};
    return newMem(arr,ptrs);
}
// let randOfType=type=>type==='int'?randInt():type==='readOnly'||type==='writable'?randMem(10,1):(()=>{throw new TypeError(type)})();
// /**@param {Memory} m */
// let randInput=m=>Object.entries(m.compiledCodeBlock().IN).map(([type,stack])=>stack.map(vName=>randOfType(type))).flat();
// let defaultInput=m=>Object.entries(m.compiledCodeBlock().IN).map(([type,stack])=>{switch(type){
//     case 'writable':return stack.map(()=>{let result=new Int32Array(n);result.ptrs=new Map();return result});
//     case 'int':case 'readOnly':return Array(stack.length).fill(type==='int'?0:ZERO_MEMORY).flat();
// }});

if(false)
for(let test=0;test<1000000000;test++){
    try {
        if(test%100===0)console.log('开始测试',{test},);
        let world=newWorld(3,3);SELF=world[1][1];
        var m=SELF.program=randMem(100,2);
        SELF.energy=1000000;
        var f=m.compiledFunc();
        SELF.tick();
        // var input=randInput(m);
        // var result=f(...input);
        
    } catch (error) {
        if(error.message==='LACK OF ENERGY'){
            console.log(test,'能量耗尽',m.FUNC_CACHE===undefined?'（编译时）':'（解释时）');
            // m=optimizeSize(m,m=>{try{SELF.energy=100000;var f=m.compiledFunc();var input=randInput(m);var result=f(...input);}catch(e){if(error.message==='LACK OF ENERGY')return true;}return false;})
            continue;
        }
        console.log({test},'发生错误：',m.FUNC_CACHE?'（运行时）':'（编译时）',error);
        console.log('\n内存块：\n',uneval(m));
        if(typeof f==='function')console.log('\n函数：',f+'');
        if(m.CODE_BLOCK_CACHE)console.log('\n代码块：',m.CODE_BLOCK_CACHE);
        console.log('出现非耗能的错误，请检查');break;
        
    }
}

// with(Object.fromEntries(NAME_TO_OPCODE)){
//     var m0=newMem([-11,5,19,20,MUL,DUPE,-10,2,RAND_N,MIN,-12,R_PTR_JUMP,19]);
//     var m1=newMem([SUB,-4,-23,ARG3,LT,4,-22,21,17,INC,-22,SHR,W_GET,TYPE_INT,W_PTR_GET,W_PTR_DEL,-9,2,MOD,-4,8,-16,-19,ARG_OFFSET_ADD_4,-19,RAND_N,13,IF,-20,R_GET,1,XOR,23,GTE,-6,LT,ARG2,GT,16,LT,R_PTR_JUMP,SHL1,W_PTR_LEN,10,RAND_N,17,W_LEN,-23,9,-5,13,R_SLICE_TO_W,OR,ARG_OFFSET_ADD_1]);
//     var m2=newMem([INC,FOR_N,24,17,ARG2,4,NE,-4,-21,LT,INC,20,4,10,USHR,-7,24,-9,ARG_OFFSET_ADD_1,OR,ARG0],{[20]:m0,[24]:m1});     
//     var m3=newMem([12,-2,13,-17,W_PTR_DEL,W_PTR_MAP_OPER,INV,8,CALL,-20,W_SET,SWITCH_SIGN,17,20,INV,21,14,ARG_OFFSET_ADD_4,ARG1,-22,17,SHL,RAND,MUL,R_PTR_JUMP,7,16,OR,4,-13,23,R_SLICE_TO_W,LTE,INV,-8,GT,23,-18,ADD,OR,W_PTR_MAP_OPER,11,21,W_LEN,23,-9,19,DIV,R_GET,W_PTR_DEL,UDIV,-1,-4,-11,TYPE_CODE,MUL,TYPE_WRITABLE,W_PTR_DEL,TYPE_WRITABLE,16,-11,OR,-1,-24,-12,-7,SWAP,11,ARG0,W_SET,DROP,-22,1,EQ,FOR_N,W_LEN,ARG0,5,R_LEN,-2,-20,-18],{[1]:m2});
// }
// m3

// let CANNOT_COMPILE=m=>{try{SELF.energy=1000000;m.compiledFunc();}catch(e){if(e.message!=='LACK OF ENERGY')return true}return false};
// let CANNOT_EXEC=m=>{try{SELF.energy=1000000;m.compiledFunc()(...randInput(m));}catch(e){if(e.message!=='LACK OF ENERGY')return true}return false};
// let optimized=optimizeSize(m3,CANNOT_EXEC);
// console.log('简化结果：',uneval(optimized));
// SELF.energy=1000000;optimized.compiledFunc()(...randInput(optimized));

/*
if(false)
with(Object.fromEntries(NAME_TO_OPCODE)){
    // var m=newMem([ARG0,1001,CALL,ARG1,1001,CALL,ADD],{[1001]:newMem([ARG0,DUPE,MUL])});//a^2+b^2
    // var m=newMem([1001,1002,ARG0,ARG1,ARG0,ARG1,GTE,IF],{[1001]:newMem([ARG0,ARG1,SUB]),[1002]:newMem([ARG1,ARG0,SUB])});//abs(a-b)
    // var m=newMem([TYPE_READONLY,ARG0,R_LEN],{[1001]:newMem([ARG0,ARG1,SUB]),[1002]:newMem([ARG1,ARG0,SUB])});//len
    // var f=newMem([0,ARG0,1,ADD,1001,FOR_N],{[1001]:newMem([ARG0,ARG1,ADD])}).compiledFunc();//SUM 1 to N
    // console.log(f(100));

    
    // SELF.energy=1000000;
    // var M1=newMem([0,TYPE_READONLY,ARG0,R_LEN,1001,FOR_N,DROP],{[1001]:newMem([ARG0,ARG1,TYPE_READONLY,ARG0,R_GET,ADD])});
    // var f=M1.compiledFunc();//SUM array
    // var arr=newMem([100,10,1,10000,1000]);
    // console.log(f(arr));
    // console.log(uneval(M1));


    SELF.energy=1000000;
    //冒泡排序模板：for(i=0;i<a.length;i++) for(j=0;j<a.length-i-1;j++) if(a[j]>a[j+1])[a[j],a[j+1]]=[a[j+1],a[j]];
    var mem=newMem([TYPE_WRITABLE,ARG0,W_LEN,TYPE_INT,DUPE,1001,FOR_N,DROP],{[1001]:
        newMem([ARG0,ARG1,SUB,DEC,TYPE_WRITABLE,ARG0,1002,FOR_N],{
            1002:newMem([TYPE_WRITABLE,ARG0,TYPE_INT,  ARG0,  ARG0,W_GET,ARG0,INC,W_GET,GTE,  1003,1004,IF],{
                1003:newMem([TYPE_WRITABLE,ARG0,TYPE_INT,  ARG0,W_GET,ARG0,INC,W_GET, ARG0,SWAP,W_SET,ARG0,INC,SWAP,W_SET]),
                1004:newMem([])
            })
        })
    });
    mem.compiledCodeBlock();//SUM 1 to N
    console.log('编译CodeBlock后能量：',SELF.energy);
    var f=mem.compiledFunc();//SUM 1 to N
    console.log('编译Function后能量：',SELF.energy);
    console.log(f(newMem([33,40,44,28,65,92,35,20,73,9,66,46,2,64,23,75,52,85,59,89,78,62,51,50,42,22,97,74,1,82,72,43,80,25,63,69,67,45,7,94,77,17,31,16,53,71,57,95,12,39,83,0,41,68,47,34,3,81,11,26,88,99,98,15,49,90,87,54,93,8,96,36,70,21,38,5,18,14,76,27,48,91,37,19,24,79,61,84,29,55,86,32,58,6,60,13,56,30,10,4])));
    console.log(f+'');
    console.log('运行后能量：',SELF.energy);
    
}
*/

export {Entity,newWorld,copyWorld,randMem};