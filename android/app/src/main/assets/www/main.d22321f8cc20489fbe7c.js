(()=>{"use strict";var e,t,r={189:(e,t,r)=>{r.d(t,{A:()=>u});const n=-1,o=1,s=2,i=3;function c(e){switch(e){case 5:return"S";case 2:return"O";case 0:return" "}return""}function a(e){return Array.from({length:e}).fill(0)}function l(e){const t=[5,2],r=[-1,-1,...e,-1,-1],a=r.length-4,u=e=>e>=0&&e<a,d=e=>{for(let t=e+2;t<e+5;++t){if(5===r[t-2]&&2===r[t-1]&&5===r[t])return i}for(let e=0;e<a;e++)if(0===r[e+2])return o;return s},f=e=>0===r[2+e],m=e=>u(e)&&f(e),v=()=>r.slice(2,-2);return{size:()=>a,setSafe:(e,t)=>m(t)?(((e,t)=>{r[2+t]=function(e){switch(e){case"S":case"s":return 5;case"O":case"o":return 2;case" ":return 0;case"":return-1}return-1}(e)})(e,t),d(t)):n,setSafeByIndex:(e,o,s=!1)=>{if(!m(o))return n;if(e<0||e>=t.length)return n;const i=r[2+o];r[2+o]=t[e];const c=d(o);return s&&(r[2+o]=i),c},getCharSafe:e=>u(e)?(e=>c(r[2+e]))(e):"",canSet:m,clone:()=>l(e),movesLeft:()=>r.reduce(((e,t)=>e+(0===t)),0),toArr:v,asString:()=>v().map(c).join(""),isEmpty:f,inBounds:u,checkWinning:d}}const u={defaultField:function(e){return l(a(e))},field:l,init:a,IMPOSSIBLE_MOVE:n,NORMAL_MOVE:o,WINNING_MOVE:i,DRAW_MOVE:s}},746:(e,t,r)=>{function n(e){const t={};for(const r of e)t[r]=[];const r=e=>{const r=t[e];if(!Array.isArray(r))throw"No name";return r};return{on:(e,t)=>r(e).push(t),set:(e,r)=>t[e]=r,call:async(e,t)=>{let n=[];for(const o of r(e)){if("function"!=typeof o)return;n.push(o(t))}await Promise.allSettled(n)},reset:e=>{delete t[e]},actionKeys:()=>Object.keys(t)}}r.d(t,{A:()=>n})},379:(e,t,r)=>{function n(e){e&&e.remove()}function o(e,t){t&&("object"==typeof e&&JSON?t.innerHTML+=JSON.stringify(e)+"<br />":t.innerHTML+=e+"<br />")}function s(e,t){o(e,t)}function i(e,t){o(e,t)}function c(e){switch(e.toLowerCase().trim()){case"true":case"yes":case"1":return!0;case"false":case"no":case"0":case void 0:return!1;default:return Boolean(e)}}function a(e,t,r){const n=e.location.search,o=new URLSearchParams(n);for(const[e,t]of o)"number"==typeof r[e]?r[e]=Number.parseInt(t,10):"boolean"==typeof r[e]?r[e]=c(t):r[e]=t}r.d(t,{P$:()=>a,Rm:()=>i,cb:()=>l,k6:()=>n,vA:()=>u,z3:()=>s});const l=e=>new Promise((t=>setTimeout(t,e)));function u(e,t){if(!e)throw t}}},n={};function o(e){var t=n[e];if(void 0!==t)return t.exports;var s=n[e]={exports:{}};return r[e](s,s.exports,o),s.exports}o.m=r,o.d=(e,t)=>{for(var r in t)o.o(t,r)&&!o.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},o.f={},o.e=e=>Promise.all(Object.keys(o.f).reduce(((t,r)=>(o.f[r](e,t),t)),[])),o.u=e=>e+"."+{334:"f01f6d079d7a9071c28d",370:"a6bcd1ed8bb938354f1e",402:"6d7f83a833e664697fff",641:"ad472b22044f200d7c53",659:"be6df4b23e3633ec4111"}[e]+".js",o.miniCssF=e=>{},o.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),o.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),e={},t="sosgame:",o.l=(r,n,s,i)=>{if(e[r])e[r].push(n);else{var c,a;if(void 0!==s)for(var l=document.getElementsByTagName("script"),u=0;u<l.length;u++){var d=l[u];if(d.getAttribute("src")==r||d.getAttribute("data-webpack")==t+s){c=d;break}}c||(a=!0,(c=document.createElement("script")).charset="utf-8",c.timeout=120,o.nc&&c.setAttribute("nonce",o.nc),c.setAttribute("data-webpack",t+s),c.src=r),e[r]=[n];var f=(t,n)=>{c.onerror=c.onload=null,clearTimeout(m);var o=e[r];if(delete e[r],c.parentNode&&c.parentNode.removeChild(c),o&&o.forEach((e=>e(n))),t)return t(n)},m=setTimeout(f.bind(null,void 0,{type:"timeout",target:c}),12e4);c.onerror=f.bind(null,c.onerror),c.onload=f.bind(null,c.onload),a&&document.head.appendChild(c)}},o.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},(()=>{var e;o.g.importScripts&&(e=o.g.location+"");var t=o.g.document;if(!e&&t&&(t.currentScript&&(e=t.currentScript.src),!e)){var r=t.getElementsByTagName("script");if(r.length)for(var n=r.length-1;n>-1&&(!e||!/^http(s?):/.test(e));)e=r[n--].src}if(!e)throw new Error("Automatic publicPath is not supported in this browser");e=e.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),o.p=e})(),(()=>{var e={792:0};o.f.j=(t,r)=>{var n=o.o(e,t)?e[t]:void 0;if(0!==n)if(n)r.push(n[2]);else{var s=new Promise(((r,o)=>n=e[t]=[r,o]));r.push(n[2]=s);var i=o.p+o.u(t),c=new Error;o.l(i,(r=>{if(o.o(e,t)&&(0!==(n=e[t])&&(e[t]=void 0),n)){var s=r&&("load"===r.type?"missing":r.type),i=r&&r.target&&r.target.src;c.message="Loading chunk "+t+" failed.\n("+s+": "+i+")",c.name="ChunkLoadError",c.type=s,c.request=i,n[1](c)}}),"chunk-"+t,t)}};var t=(t,r)=>{var n,s,[i,c,a]=r,l=0;if(i.some((t=>0!==e[t]))){for(n in c)o.o(c,n)&&(o.m[n]=c[n]);if(a)a(o)}for(t&&t(r);l<i.length;l++)s=i[l],o.o(e,s)&&e[s]&&e[s][0](),e[s]=0},r=self.webpackChunksosgame=self.webpackChunksosgame||[];r.forEach(t.bind(null,0)),r.push=t.bind(null,r.push.bind(r))})(),(()=>{const e={modes:["client","ai","server","hotseat","test","servernew"],mode:"hotseat",wsPort:8088,logger:"",loggerInMode:".log",networkDebug:!1,externalId:"server",colorOrder:["blue","red","green","yellow"],color:"blue",playerLimit:2,idNameInStorage:"my-id",idNameLen:6,size:14};var t=o(189),r=o(379),n=o(746);const s=function(e,t){return e.preventDefault(),!e.target.classList.contains("cell")||e.target.classList.contains("disabled")?-1:function(e,t){const r=e.target||e.srcElement;for(let e=0;e<t.children.length;e++)if(t.children[e]===r)return e;return-1}(e,t)};function i(e,t,r){for(let n=0;n<2;n++){const o=t.childNodes[n];for(const e of r.colorOrder)o.classList.remove(e);e.getActiveDigitIndex()===n?(o.classList.add("active"),o.classList.add(e.currentColor())):o.classList.remove("active")}}function c(e,r,n,o,s,c,l){if(a(e,r),i(e,n,o),e.isMyMove()?l.classList.remove("disabled"):l.classList.add("disabled"),e.isGameOver()){const r=e.calcLastMoveRes();r!==t.A.WINNING_MOVE&&r!==t.A.DRAW_MOVE||function(e,t,r,n,o){const s=t.endMessage(e),i=r.querySelector("h2");i.textContent=s;const c=r.querySelector(".content");c.textContent=t.endMessage2(e),r.classList.add("show"),n.classList.remove("hidden2"),o.classList.add("disabled")}(r,e,s,c,l)}else s.classList.remove("show")}function a(e,t){const r=e.enum1();for(const[n,o]of r){const r=t.childNodes[n],s=o.text;r.textContent=s.toString()," "===r.textContent&&(r.innerHTML="&nbsp;"),r.className=s&&" "!==s?"cell disabled":"cell",o.isActive&&(r.classList.add("active"),r.classList.add(e.currentColor())),o.color&&r.classList.add(o.color),o.isLastMove&&r.classList.add("last")}}function l(e,o,l,u){const d=o.querySelector(".field"),f=o.querySelector(".box"),m=o.querySelector(".buttons"),v=o.querySelector(".install");o.documentElement.style.setProperty("--field-size",u.size());const p=(0,n.A)(["message","gameover","started","winclosed"]),b=function(e,t){const n=e.querySelector(".overlay"),o=e.querySelector(".close");return(0,r.vA)(n,"No overlay"),(0,r.vA)(o,"No close button"),o.addEventListener("click",(function(e){return e.preventDefault(),n.classList.remove("show"),t.call("winclosed",{})}),!1),n}(o,p);const h=p.actionKeys,g=()=>c(u,f,m,l,b,v,d);async function y(e){const n=e.res;if(n!==t.A.IMPOSSIBLE_MOVE){const o=[];o.push((0,r.cb)(200)),o.push(p.call("message",e)),await Promise.allSettled(o),g(),n!==t.A.WINNING_MOVE&&n!==t.A.DRAW_MOVE||await p.call("gameover",e)}}function w(){return y(u.tryMove())}return function(e,t,n,o){(0,r.vA)(o),o.replaceChildren();for(let r=0;r<t;r++){const t=e.createElement("div");t.className=n,o.append(t)}}(o,u.size(),"cell",f),f.addEventListener("click",(function(e){const t=s(e,f);if(!(t<0))return u.setActivePosition(t),a(u,f),w()}),!1),m.addEventListener("click",(function(e){const t=s(e,m);if(!(t<0))return u.setActiveDigitIndex(t),i(u,m,l),w()}),!1),c(u,f,m,l,b,v,d),u.on("firstmove",(e=>p.call("started",e))),{on:function(e,t){return p.on(e,t)},actionKeys:h,onMessage:function({res:e,position:t,digit:n,playerId:o}){const s=u.setMove(t,n,o);return(0,r.vA)(e===s.res,"Bad move"),y(s)},redraw:g}}(async function(t,n){let s;(0,r.P$)(t,n,e),function(e){e.colorOrder.length>e.playerLimit&&e.colorOrder.splice(e.playerLimit)}(e),"client"===e.mode?s=await o.e(334).then(o.bind(o,334)):"server"===e.mode?s=await o.e(402).then(o.bind(o,402)):"ai"===e.mode?s=await o.e(370).then(o.bind(o,370)):"hotseat"===e.mode?s=await o.e(659).then(o.bind(o,659)):"test"===e.mode?s=await o.e(641).then(o.bind(o,641)):(0,r.vA)(!1,"Unsupported mode"),s.default(t,n,e,l).catch((e=>{}))})(window,document)})()})();