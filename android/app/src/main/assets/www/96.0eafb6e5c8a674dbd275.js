"use strict";(self.webpackChunksosgame=self.webpackChunksosgame||[]).push([[96],{510:(e,n,t)=>{t.d(n,{A:()=>r});const r=function(e){return{message:e.onMessage}}},96:(e,n,t)=>{t.r(n),t.d(n,{default:()=>f});var r=t(379),o=t(571),i=t(940),s=t(373);var c=t(267),d=t(510),a=t(233);function l(e,n){const t={serverId:n};return e.sendRawAll("reconnect",t)}function u(e,n,t,r,o){const i=(0,d.A)(e);return n.registerHandler(i,o),function(e,n,t){for(const t of e.actionKeys())e.on(t,(e=>{let r=e,o=null;e.ignore&&Array.isArray(e.ignore)&&(r=e.data,o=e.ignore),n.sendRawAll(t,r,o)}));return l(n,t)}(e,t,r)}function f(e,n,t,d){return new Promise(((f,A)=>{const v=c.A.getMyId(e,t,Math.random),g=c.A.setupLogger(n,t),I=(0,i.A)(v,g),x=(0,a.A)(g),m=function(e){const n=[];for(const[t]of Object.entries(e))n.push(t);let t=n.length;const o=t=>{const o=n[t];(0,r.vA)(o,"Bad Index");const i=e[o];return(0,r.vA)(i,"Empty client"),i},i=n=>{const t=e[n];return(0,r.vA)(t,`No id ${n} in clients`),t},s=(e,t)=>{const r=e.index,o=n[r];n[e.index]=n[t.index],e.index=t.index,n[t.index]=o,t.index=r};return{addClient:(o,i)=>{const s=e[o];s?s.name=i:(e[o]={index:t,name:i},n.push(o),++t),(0,r.vA)(t===n.length)},remove:o=>{const i=e[o];--t;const s=n[t];n[i.index]=s,n.pop(),e[s].index=i.index,e[o]=null,(0,r.vA)(t===n.length)},swapInd:(e,n)=>{const t=o(e),r=o(n);s(t,r)},swapById:(e,n)=>{const t=i(e),r=i(n);s(t,r)},indById:e=>i(e).index}}({});m.addClient(v,v);const M=s.A.presenterFuncDefault(t),p=d(e,n,t,M);I.connect(I.getWebSocketUrl(t,e.location)).then((i=>{const s=function(e,n,t){const r=t.sh||e.location.href,i=new URL(r);return i.searchParams.set("mode","client"),(0,o.A)(i.toString(),n.querySelector(".qrcode"))}(e,n,t);p.on("started",(()=>{(0,r.k6)(s)})),p.on("winclosed",(()=>(M.nextRound(),p.redraw(),l(i,v)))),I.on("join",(e=>{m.addClient(e.from,e.from);const n=m.indById(e.from),t=M.toJson(n),r={serverId:v,presenter:t};i.sendRawTo("gameinit",r,e.from)})),u(p,I,i,v,x),f(p)})).catch((e=>{g.error(e),A(e)}))}))}},373:(e,n,t)=>{t.d(n,{A:()=>d});var r=t(189),o=t(746);function i(e,n,t,r,o){let i=t,s="";return o>=0&&o<r.length&&(s=r[o]),{isLastMove:e,isActive:n,text:i,color:s}}function s(e){return{clientUserIdx:e.colorOrder.indexOf(e.color),currentUserIdx:e.colorOrder.indexOf(e.color),playersSize:e.colorOrder.length,activeCellIndex:-1,activeDigitIndex:-1,lastMove:-1,gameover:!1,gamestarted:!1,round:0,fieldArr:r.A.init(e.size),movesIdx:Array(e.size).fill(-1)}}function c({currentUserIdx:e,clientUserIdx:n,playersSize:t,activeCellIndex:s,activeDigitIndex:c,lastMove:d,gameover:a,gamestarted:l,round:u,fieldArr:f,movesIdx:A},v){let g=r.A.field(f);const I=(0,o.A)(["firstmove","gameover"]);const x=function(o,i,u){if(!((e,n,t,r)=>!(n<0||n>=2)&&t==r&&g.canSet(e))(o,i,u,e))return{res:r.A.IMPOSSIBLE_MOVE,position:-1,digit:-1,playerId:e,clientId:u};const f=g.setSafeByIndex(i,o);if(f===r.A.IMPOSSIBLE_MOVE)return{res:f,position:-1,digit:-1,playerId:e,clientId:u};s=-1,c=-1,l||I.call("firstmove",{}),l=!0,A[o]=u,d=o;const x=e,m=n;return f===r.A.NORMAL_MOVE&&(e=(e+1)%t,"hotseat"===v.mode&&(n=e)),f!==r.A.WINNING_MOVE&&f!==r.A.DRAW_MOVE||(a=!0,I.call("gameover",f)),{res:f,position:o,digit:i,playerId:x,clientId:m}},m=g.size,M=()=>v.colorOrder[e];return{on:function(e,n){return I.on(e,n)},size:m,tryMove:function(){return x(s,c,e)},setMove:x,enum1:()=>function*(){for(let e=0;e<g.size();++e)yield[e,i(d===e,s===e,g.getCharSafe(e),v.colorOrder,A[e])]}(),setActivePosition:function(t){n!==e||a||(s=g.canSet(t)?t:-1)},setActiveDigitIndex:function(t){n!==e||a||(c=t)},currentColor:M,getActiveDigitIndex:()=>c,endMessage:t=>t===r.A.DRAW_MOVE?"Draw":e!==n?"You lose":"You win",endMessage2:e=>e===r.A.DRAW_MOVE?"Draw":M()+" player win",toJson:n=>({currentUserIdx:e,clientUserIdx:n,playersSize:t,activeCellIndex:s,activeDigitIndex:c,lastMove:d,gameover:a,fieldArr:g.toArr(),movesIdx:A}),isGameOver:()=>a,isMyMove:()=>!a&&e===n,calcLastMoveRes:()=>{if(d<0)return r.A.IMPOSSIBLE_MOVE;return g.checkWinning(d)},nextRound:()=>{++u,l=!1,a=!1,s=-1,c=-1,d=-1,a=!1,l=!1,f=r.A.init(v.size),A=Array(v.size).fill(-1),e=(n+u)%t,g=r.A.field(f)}}}const d={presenterFunc:c,defaultPresenter:s,presenterFuncDefault:function(e){return c(s(e),e)}}},233:(e,n,t)=>{function r(e){let n=Promise.resolve();return{add:t=>new Promise(((r,o)=>{n=n.then(t).then(r).catch((n=>{e.log(n),o(n)}))}))}}t.d(n,{A:()=>r})}}]);