"use strict";(self.webpackChunksosgame=self.webpackChunksosgame||[]).push([[386],{510:(e,n,t)=>{t.d(n,{A:()=>r});const r=function(e){return{message:e.onMessage}}},657:(e,n,t)=>{t.d(n,{A:()=>i});var r=t(379);function i(e,n=0){const t=[];for(const[n]of Object.entries(e))t.push(n);let i=t.length;const o=n=>{const i=t[n];(0,r.vA)(i,"Bad Index");const o=e[i];return(0,r.vA)(o,"Empty client"),o},s=n=>{const t=e[n];return(0,r.vA)(t,`No id ${n} in clients`),t},d=(e,n)=>{const r=e.index,i=t[r];t[e.index]=t[n.index],e.index=n.index,t[n.index]=i,n.index=r},c=e=>(e+t.length)%t.length;return{addClient:(n,o)=>{const s=e[n];s?s.name=o:(e[n]={index:i,name:o},t.push(n),++i),(0,r.vA)(i===t.length)},remove:n=>{const o=e[n];--i;const s=t[i];t[o.index]=s,t.pop();e[s].index=o.index,e[n]=void 0,(0,r.vA)(i===t.length)},swapInd:(e,n)=>{const t=o(e),r=o(n);d(t,r)},swapById:(e,n)=>{const t=s(e),r=s(n);d(t,r)},indById:e=>c(s(e).index+n),idByInd:e=>t[c(e-n)],size:()=>t.length}}},386:(e,n,t)=>{t.r(n),t.d(n,{default:()=>I});var r=t(379),i=t(571),o=t(940),s=t(373),d=t(657),c=t(267),l=t(510),a=t(233);function u(e,n){const t={serverId:n};return e.sendRawAll("reconnect",t)}function f(e,n,t,r,i,o){const s=(0,l.A)(e);return n.registerHandler(s,i),function(e,n,t,r){for(const t of e.actionKeys())e.on(t,(e=>{let i;e&&void 0!==e.playerId&&(i=[r.idByInd(e.playerId)]),n.sendRawAll(t,e,i)}));return u(n,t)}(e,t,r,o)}function I(e,n,t,l){return new Promise(((I,A)=>{const g=c.A.getMyId(e,t,Math.random),v=c.A.setupLogger(n,t),x=(0,o.A)(g,v),m=(0,a.A)(v),p=s.A.presenterFuncDefault(t),y=l(e,n,t,p),M=(0,d.A)({},p.getClientIndex());M.addClient(g,g),x.connect(x.getWebSocketUrl(t,e.location)).then((o=>{const s=function(e,n,t){const r=t.sh||e.location.href,o=new URL(r);return o.searchParams.set("mode","client"),(0,i.A)(o.toString(),n.querySelector(".qrcode"))}(e,n,t);y.on("started",(()=>{(0,r.k6)(s)})),y.on("winclosed",(()=>(p.nextRound(),y.redraw(),u(o,g)))),x.on("join",(e=>{M.addClient(e.from,e.from);const n=M.indById(e.from),i=M.indById(g);M.size()===t.playerLimit&&p.isGameOver()&&p.resetRound();const d=p.toJson(n),c={serverId:g,joinedInd:n,serverInd:i,presenter:d};o.sendRawTo("gameinit",c,e.from),y.redraw(),(0,r.k6)(s)})),f(y,x,o,g,m,M),I(y)})).catch((e=>{v.error(e),A(e)}))}))}},373:(e,n,t)=>{t.d(n,{A:()=>c});var r=t(189),i=t(746);function o(e,n,t,r,i){let o=t,s="";return i>=0&&i<r.length&&(s=r[i]),{isLastMove:e,isActive:n,text:o,color:s}}function s(e){return{clientUserIdx:e.colorOrder.indexOf(e.color),currentUserIdx:0,playersSize:e.playerLimit,activeCellIndex:-1,activeDigitIndex:-1,lastMove:-1,gameover:!0,gamestarted:!1,round:0,fieldArr:r.A.init(e.size),movesIdx:Array.from({length:e.size}).fill(-1)}}function d({currentUserIdx:e,clientUserIdx:n,playersSize:t,activeCellIndex:s,activeDigitIndex:d,lastMove:c,gameover:l,gamestarted:a,round:u,fieldArr:f,movesIdx:I},A){let g=r.A.field(f);const v=(0,i.A)(["firstmove","gameover"]);const x=()=>{e=(e+1)%t},m=function(t,i,o){if(!((e,n,t,r)=>!(n<0||n>=2)&&t===r&&g.canSet(e))(t,i,o,e))return{res:r.A.IMPOSSIBLE_MOVE,position:-1,digit:-1,playerId:e,clientId:o};const u=g.setSafeByIndex(i,t);if(u===r.A.IMPOSSIBLE_MOVE)return{res:u,position:-1,digit:-1,playerId:e,clientId:o};s=-1,d=-1,a||v.call("firstmove",{}),a=!0,I[t]=o,c=t;const f=e,A=n;return u===r.A.NORMAL_MOVE&&x(),u!==r.A.WINNING_MOVE&&u!==r.A.DRAW_MOVE||(l=!0,v.call("gameover",u)),{res:u,position:t,digit:i,playerId:f,clientId:A}},p=g.size,y=()=>A.colorOrder[e],M=()=>{a=!1,l=!1,s=-1,d=-1,c=-1,f=r.A.init(p()),I=Array.from({length:p()}).fill(-1),e=u%t,g=r.A.field(f)};return{on:function(e,n){return v.on(e,n)},size:p,tryMove:function(){return m(s,d,e)},setMove:m,enum1:()=>function*(){for(let e=0;e<g.size();++e)yield[e,o(c===e,s===e,g.getCharSafe(e),A.colorOrder,I[e])]}(),setActivePosition:function(t){n!==e||l||(s=g.canSet(t)?t:-1)},setActiveDigitIndex:function(t){n!==e||l||(d=t)},currentColor:y,getActiveDigitIndex:()=>d,endMessage:t=>t===r.A.DRAW_MOVE?"Draw":e!==n?"You lose":"You win",endMessage2:e=>e===r.A.DRAW_MOVE?"Draw":y()+" player win",toJson:n=>({currentUserIdx:e,clientUserIdx:n,playersSize:t,activeCellIndex:s,activeDigitIndex:d,lastMove:c,gameover:l,fieldArr:g.toArr(),movesIdx:I}),isGameOver:()=>l,isMyMove:()=>!l&&e===n,calcLastMoveRes:()=>{if(c<0)return r.A.IMPOSSIBLE_MOVE;return g.checkWinning(c)},getCurrentIndex:()=>e,setClientIndex:e=>{n=e},getClientIndex:()=>n,getPlayersSize:()=>t,setMyTurn:()=>{e=n},nextRound:()=>{++u,M()},resetRound:M}}const c={presenterFunc:d,defaultPresenter:s,presenterFuncDefault:function(e){return d(s(e),e)}}},233:(e,n,t)=>{function r(e){let n=Promise.resolve();return{add:t=>new Promise(((r,i)=>{n=n.then(t).then(r).catch((n=>{e.log(n),i(n)}))}))}}t.d(n,{A:()=>r})}}]);