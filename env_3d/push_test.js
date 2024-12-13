/*function inst(f){
    const handler = {
        get(target, propKey, receiver) {
            console.log('GET ' + propKey);
            // do other thing...
        },
        set(target, propKey, value, receiver) {
            console.log('SET ' + propKey);
            // do other thing...
        },
    };
    return e=>f(new Proxy(e,handler));
}*/
//let ADD=inst(e=>e.number=e.number+e.number);

const instruction={};
{
    instruction.calc={};
    for(let i of [...'+-*/%&|^','<<','>>','>>>'])instruction.calc[i]=Function('s','s.number=s.number'+i+'s.number');
    for(let i of [...'-~','1+','-1+'])instruction.calc[i]=Function('s','s.number='+i+'s.number');
    for(let t in ['abs','sign','floor','ceil','round','sqrt','exp','log','sin','cos','tan','asin','acos','atan'])instruction.calc[i]=Function('s','s.number=Math.'+i+'(s.number)');
    
    for(let i of [...'<>','<=','>=','===','!=='])instruction.calc[i]=Function('s','s.boolean=s.number'+i+'s.number');
    for(let i of ['!!'])instruction.calc[i]=Function('s','s.boolean='+i+'s.number');

    for(let i of [...'!'])instruction.calc[i]=Function('s','s.boolean='+i+'s.boolean');
    for(let i of ['&&','||','==','!='])instruction.calc[i]=Function('s','s.boolean=s.boolean'+i+'s.boolean');
    for(let i of ['0|'])instruction.calc[i]=Function('s','s.number='+i+'s.boolean');
    instruction.calc['strlen']=Function('s','s.number=s.string.length');
    instruction.calc['strconcat']=Function('s','s.string=s.string+s.string');
}
{
    instruction.store={};
    for(let i of '1234')instruction.store[i]={};
}
let ADD=function(s){s.number=s.number+s.number;};

class PushE{
    constructor(){
        const that=this;
        this.stack={
            number:[],
            boolean:[],
            string:[],
        }
        this.stackProxy={
            get number(){let a=that.stack.number;return a.length?a.pop():0;},
            set number(x){let a=that.stack.number;a.push(x);},
            get boolean(){let a=that.stack.boolean;return a.length?a.pop():false;},
            set boolean(x){let a=that.stack.boolean;a.push(x);},
            get string(){let a=that.stack.string;return a.length?a.pop():'';},
            set string(x){let a=that.stack.string;a.push(x);},
            get stack1(){let a=that.stack.stack1;return a.length?a.pop():0;},set stack1(x){let a=that.stack.stack1;a.push(x);},
            get stack2(){let a=that.stack.stack2;return a.length?a.pop():0;},set stack2(x){let a=that.stack.stack2;a.push(x);},
            get stack3(){let a=that.stack.stack3;return a.length?a.pop():0;},set stack3(x){let a=that.stack.stack3;a.push(x);},
            get stack4(){let a=that.stack.stack4;return a.length?a.pop():0;},set stack4(x){let a=that.stack.stack4;a.push(x);},
        }
    }
    
    run(){
        const stack=this.stack;
        while(stack.instruction.length){
            const c=stack.instruction.pop();
            if(typeof c==='function'){
                c.call(this,this.stackProxy);
            }
            else if(typeof c==='object'){
                if(c instanceof Array)stack.instruction.push.apply(stack.instruction,c);
                else c?.execute?.(this);
            }else
            stack[typeof c]?.push(c);
        }
    }
}