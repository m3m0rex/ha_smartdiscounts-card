class El { constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.style={};this.classList={add(){},remove(){},toggle(){},contains(){return false}};this.dataset={};}
  append(...k){k.forEach(x=>{if(x&&typeof x==="object")x.parentNode=this;this.children.push(x)});} prepend(...k){this.append(...k)} before(){} remove(){}
  setAttribute(k,v){this.attrs[k]=v} getAttribute(k){return this.attrs[k]} removeAttribute(){} addEventListener(){} removeEventListener(){}
  replaceChildren(...k){this.children=[];this.append(...k)} attachShadow(){this.shadowRoot=new El("shadow");return this.shadowRoot}
  querySelector(){return null} querySelectorAll(){return []} closest(){return null} dispatchEvent(){} focus(){}
  get firstChild(){return this.children[0]} get lastChild(){return this.children[this.children.length-1]} get isConnected(){return true}
  get textContent(){return this.children.map(c=>typeof c==="string"?c:(c&&c.textContent)||"").join("")} set textContent(v){this.children=[String(v)]}
}
const defs={};
global.HTMLElement=El; global.customElements={get:(n)=>defs[n],define:(n,c)=>{defs[n]=c}};
global.document={createElement:(t)=>defs[t]?new defs[t]():new El(t),createTextNode:(s)=>String(s),documentElement:{lang:"de"},addEventListener(){}};
global.window=global; global.localStorage={_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}};
global.CustomEvent=class{constructor(t,o){this.type=t;Object.assign(this,o)}}; global.navigator={language:"de"};
require(process.argv[2]);
const C=defs["smartdiscounts-card"]; const c=new C();
const day=(n)=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
let items=[{uid:"1",summary:"Butter 2",description:"",status:"needs_action"},{uid:"2",summary:"Spaghetti",description:`⚙OFFER:${JSON.stringify({s:"Lidl",p:0.99,v:day(3)})}`,status:"needs_action"},{uid:"3",summary:"Bananen",description:"🏷️ REWE · 1,79 € · bis 23.11.",status:"needs_action"}];
const st={"todo.demo":{entity_id:"todo.demo",state:"3",last_updated:"x",attributes:{friendly_name:"Einkauf"}},
 "sensor.rewe":{entity_id:"sensor.rewe",state:"2",last_updated:"a",attributes:{friendly_name:"REWE",discounts:[{title:"Butter mild",price:"1,29 €",end_date:day(2)},{title:"Kaffee",price:"5,79 €",end_date:day(2)}]}},
 "sensor.rewe_preview":{entity_id:"sensor.rewe_preview",state:"1",last_updated:"a",attributes:{friendly_name:"REWE Vorschau",discounts:[{title:"Butter Süßrahm",price:"0,99 €"}]}}};
const ud={};
const hass={language:"de",config:{components:["todo"]},user:{is_admin:false,id:"u"},states:st,services:{},
 callWS:(m)=>Promise.resolve(m.type==="todo/item/list"?{items}:m.type==="frontend/get_user_data"?{value:ud[m.key]||null}:m.type==="frontend/set_user_data"?(ud[m.key]=m.value,{}):{}),
 callService:()=>Promise.resolve(),callApi:()=>Promise.resolve({})};
c.setConfig({list:"todo.demo"}); c.hass=hass;
setTimeout(async()=>{ try{
  for (const tab of ["shop","all","watch"]) { c._tab=tab; c._render(); }
  console.log("next:",c._next.map(o=>`${o.name}@${o.from}`), "exp from:",day(3));
  c._tab="shop"; const body=c._renderShop(); console.log("SHOP:",body.textContent.replace(/\s+/g," ").slice(0,600));
  c._when="next"; c._tab="all"; console.log("ALL-next:",c._renderAll(["REWE"]).textContent.replace(/\s+/g," ").slice(0,300));
  await c._watchAdd("Butter"); c._tab="watch"; console.log("WATCH:",c._renderWatch().textContent.replace(/\s+/g," ").slice(0,400));
  console.log("note:",c._offerNote(c._next[0]));
  console.log("OK"); }catch(e){console.error("FAIL",e)} },300);
