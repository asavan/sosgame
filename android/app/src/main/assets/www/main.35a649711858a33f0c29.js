(()=>{"use strict";var e,t,o={746:(e,t,o)=>{function n(e){const t={};for(const o of e)t[o]=[];const o=e=>{const o=t[e];if(!Array.isArray(o))throw"No name";return o};return{on:(e,t)=>o(e).push(t),set:(e,o)=>t[e]=o,call:async(e,t)=>{let n=[];for(const r of o(e)){if("function"!=typeof r)return;n.push(r(t))}await Promise.allSettled(n)},reset:e=>{delete t[e]},actionKeys:()=>Object.keys(t)}}o.d(t,{A:()=>n})},379:(e,t,o)=>{function n(e){e&&e.remove()}function r(e,t){t&&("object"==typeof e&&JSON?t.innerHTML+=JSON.stringify(e)+"<br />":t.innerHTML+=e+"<br />")}function s(e,t){r(e,t)}function i(e,t){r(e,t)}function a(e){switch(e.toLowerCase().trim()){case"true":case"yes":case"1":return!0;case"false":case"no":case"0":case void 0:return!1;default:return Boolean(e)}}function c(e,t,o){const n=e.location.search,r=new URLSearchParams(n);for(const[e,t]of r)"number"==typeof o[e]?o[e]=Number.parseInt(t,10):"boolean"==typeof o[e]?o[e]=a(t):o[e]=t}o.d(t,{P$:()=>c,Rm:()=>i,cb:()=>l,k6:()=>n,vA:()=>d,z3:()=>s});const l=e=>new Promise((t=>setTimeout(t,e)));function d(e,t){if(!e)throw t}}},n={};function r(e){var t=n[e];if(void 0!==t)return t.exports;var s=n[e]={exports:{}};return o[e](s,s.exports,r),s.exports}r.m=o,r.d=(e,t)=>{for(var o in t)r.o(t,o)&&!r.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:t[o]})},r.f={},r.e=e=>Promise.all(Object.keys(r.f).reduce(((t,o)=>(r.f[o](e,t),t)),[])),r.u=e=>e+"."+{334:"5323879c7587104985cc",370:"41ec33887e69c71936c9",402:"4acd3148e2ac1bc83225",641:"0fc0076305dcf9d2b1f1",659:"1e442f3791f209755d98"}[e]+".js",r.miniCssF=e=>{},r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),e={},t="sosgame:",r.l=(o,n,s,i)=>{if(e[o])e[o].push(n);else{var a,c;if(void 0!==s)for(var l=document.getElementsByTagName("script"),d=0;d<l.length;d++){var u=l[d];if(u.getAttribute("src")==o||u.getAttribute("data-webpack")==t+s){a=u;break}}a||(c=!0,(a=document.createElement("script")).charset="utf-8",a.timeout=120,r.nc&&a.setAttribute("nonce",r.nc),a.setAttribute("data-webpack",t+s),a.src=o),e[o]=[n];var f=(t,n)=>{a.onerror=a.onload=null,clearTimeout(m);var r=e[o];if(delete e[o],a.parentNode&&a.parentNode.removeChild(a),r&&r.forEach((e=>e(n))),t)return t(n)},m=setTimeout(f.bind(null,void 0,{type:"timeout",target:a}),12e4);a.onerror=f.bind(null,a.onerror),a.onload=f.bind(null,a.onload),c&&document.head.appendChild(a)}},r.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},(()=>{var e;r.g.importScripts&&(e=r.g.location+"");var t=r.g.document;if(!e&&t&&(t.currentScript&&(e=t.currentScript.src),!e)){var o=t.getElementsByTagName("script");if(o.length)for(var n=o.length-1;n>-1&&(!e||!/^http(s?):/.test(e));)e=o[n--].src}if(!e)throw new Error("Automatic publicPath is not supported in this browser");e=e.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),r.p=e})(),(()=>{var e={792:0};r.f.j=(t,o)=>{var n=r.o(e,t)?e[t]:void 0;if(0!==n)if(n)o.push(n[2]);else{var s=new Promise(((o,r)=>n=e[t]=[o,r]));o.push(n[2]=s);var i=r.p+r.u(t),a=new Error;r.l(i,(o=>{if(r.o(e,t)&&(0!==(n=e[t])&&(e[t]=void 0),n)){var s=o&&("load"===o.type?"missing":o.type),i=o&&o.target&&o.target.src;a.message="Loading chunk "+t+" failed.\n("+s+": "+i+")",a.name="ChunkLoadError",a.type=s,a.request=i,n[1](a)}}),"chunk-"+t,t)}};var t=(t,o)=>{var n,s,[i,a,c]=o,l=0;if(i.some((t=>0!==e[t]))){for(n in a)r.o(a,n)&&(r.m[n]=a[n]);if(c)c(r)}for(t&&t(o);l<i.length;l++)s=i[l],r.o(e,s)&&e[s]&&e[s][0](),e[s]=0},o=self.webpackChunksosgame=self.webpackChunksosgame||[];o.forEach(t.bind(null,0)),o.push=t.bind(null,o.push.bind(o))})(),(()=>{const e={modes:["client","ai","server","hotseat","test"],mode:"hotseat",wsPort:8088,logger:"",networkDebug:!1,logicDebug:!1,colorOrder:["blue","red","green","yellow"],color:"blue",playerLimit:2,idNameInStorage:"my-id",idNameLen:6,size:14};var t=r(379),o=r(746);const n=function(e,t){return e.preventDefault(),!e.target.classList.contains("cell")||e.target.classList.contains("disabled")?-1:function(e,t){const o=e.target||e.srcElement;for(let e=0;e<t.children.length;e++)if(t.children[e]===o)return e;return-1}(e,t)};function s(e,t){for(let o=0;o<2;o++){const n=t.childNodes[o];e.getActiveDigitIndex()===o?(n.classList.add("active"),n.classList.add(e.currentColor())):(n.classList.remove("active"),n.classList.remove(e.currentColor()))}}function i(e,t){const o=e.enum1();for(const[n,r]of o){const o=t.childNodes[n],s=r.text;o.textContent=s.toString()," "===o.textContent&&(o.innerHTML="&nbsp;"),o.className=s&&" "!==s?"cell disabled":"cell",r.isActive&&(o.classList.add("active"),o.classList.add(e.currentColor())),r.color&&o.classList.add(r.color),r.isLastMove&&o.classList.add("last")}}function a(e,r,a,c){const l=r.querySelector(".field"),d=r.querySelector(".box"),u=r.querySelector(".buttons"),f=r.querySelector(".install");r.documentElement.style.setProperty("--field-size",c.size());const m=(0,o.A)(["message","gameover","started","winclosed"]),p=function(e,o){const n=e.querySelector(".overlay"),r=e.querySelector(".close");return(0,t.vA)(n,"No overlay"),(0,t.vA)(r,"No close button"),r.addEventListener("click",(function(e){return e.preventDefault(),n.classList.remove("show"),o.call("winclosed",{})}),!1),n}(r,m);const v=m.actionKeys,b=()=>function(e,t,o,n){i(e,t),s(e,o),e.isMyMove()?n.classList.remove("disabled"):n.classList.add("disabled")}(c,d,u,l);function h(){return c.tryMove()}c.on("moveEnd",(async e=>{const o=[];0===e.moveCount&&o.push(m.call("started",e)),o.push(b()),await Promise.allSettled(o);const n=[];n.push((0,t.cb)(200)),n.push(m.call("message",e)),await Promise.allSettled(o)})),c.on("nextPlayer",(()=>{const e=[];return e.push((0,t.cb)(100)),e.push(b()),Promise.allSettled(e)})),c.on("gameover",(e=>{const t=[];return t.push(function(e,t,o,n,r){const s=t.endMessage(e);o.querySelector("h2").textContent=s,o.querySelector(".content").textContent=t.endMessage2(e),o.classList.add("show"),n.classList.remove("hidden2"),r.classList.add("disabled")}(e.res,c,p,f,l)),t.push(m.call("gameover",e)),Promise.allSettled(t)}));return function(e,o,n,r){(0,t.vA)(r),r.replaceChildren();for(let t=0;t<o;t++){const t=e.createElement("div");t.className=n,r.append(t)}}(r,c.size(),"cell",d),d.addEventListener("click",(function(e){const t=n(e,d);if(!(t<0))return c.setActivePosition(t),i(c,d),h()}),!1),u.addEventListener("click",(function(e){const t=n(e,u);if(!(t<0))return c.setActiveDigitIndex(t),s(c,u),h()}),!1),b(),{on:function(e,t){return m.on(e,t)},actionKeys:v,onMessage:async function({res:e,position:o,digit:n,playerId:r}){const s=await c.setMove(o,n,r);return a.logicDebug&&(0,t.vA)(e===s.res,"Bad move"),s},redraw:b}}(async function(o,n){let s;(0,t.P$)(o,n,e),function(e){e.colorOrder.length>e.playerLimit&&e.colorOrder.splice(e.playerLimit)}(e),"client"===e.mode?s=await r.e(334).then(r.bind(r,334)):"server"===e.mode?s=await r.e(402).then(r.bind(r,402)):"ai"===e.mode?s=await r.e(370).then(r.bind(r,370)):"hotseat"===e.mode?s=await r.e(659).then(r.bind(r,659)):"test"===e.mode?s=await r.e(641).then(r.bind(r,641)):(0,t.vA)(!1,"Unsupported mode"),s.default(o,n,e,a).catch((e=>{}))})(window,document)})()})();