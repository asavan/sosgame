"use strict";(self.webpackChunksosgame=self.webpackChunksosgame||[]).push([[334],{510:(e,n,t)=>{t.d(n,{A:()=>r});const r=function(e){return{message:e.onMessage}}},940:(e,n,t)=>{t.d(n,{A:()=>i});var r=t(746);function o(){}function i(e,n){const t=(0,r.A)(["close","disconnect","error","join","gameinit","reconnect"]);let i,s={};return{connect:function(c){return new Promise(((a,l)=>{c||l("Can't determine ws address");const d=function(e,n,t){const i=(0,r.A)(["error","open","message","beforeclose","close"]),s=new WebSocket(n);function c(e){t.log("Websocket message received: "+e);const n=JSON.parse(e);return i.call("message",n)}return s.onopen=function(){return i.call("open",e)},s.onclose=function(n){return t.log("Websocket closed "+n.code+" "+n.reason),i.call("close",e)},s.onmessage=async function(e){return e.data instanceof Blob?c(await e.data.text()):c(e.data)},s.onerror=function(n){return t.error(n),i.call("error",e)},{on:(e,n)=>i.on(e,n),send:(n,r,o,i)=>{const c={from:e,to:o,action:n,data:r,ignore:i};return t.log("Sending ["+e+"] to ["+o+"]: "+JSON.stringify(r)),s.send(JSON.stringify(c))},close:async()=>(await i.call("beforeclose",e),s.onerror=o,s.close())}}(e,c,n);d.on("message",(function(r){if(r.from!==e)if(r.to===e||"all"===r.to){if(!(r.ignore&&Array.isArray(r.ignore)&&r.ignore.includes(e)))return t.actionKeys().includes(r.action)?(n.log("handlers.actionKeys"),t.call(r.action,r)):Object.keys(s).includes(r.action)?(n.log("callCurrentHandler"),function(e,t){const r=s[e];"function"==typeof r?i?i.add((()=>r(t.data,t.from))):n.log("No queue"):n.log("Not function")}(r.action,r)):void n.log("Unknown action "+r.action);n.log("user in ignore list")}else n.log("another user");else n.error("same user")}));const u=(e,t,r)=>(n.log(t),d.send(e,t,"all",r)),f=(e,n,t)=>d.send(e,n,t);d.on("open",(()=>a({sendRawAll:u,sendRawTo:f})))}))},on:function(e,n){return t.on(e,n)},getWebSocketUrl:function(e,n){return e.wh?e.wh:"https:"!==n.protocol?"ws://"+n.hostname+":"+e.wsPort:void 0},registerHandler:function(e,n){i=n,s=e}}}},334:(e,n,t)=>{t.r(n),t.d(n,{default:()=>l});var r=t(666),o=t(940),i=t(373),s=t(510),c=t(233),a=t(379);function l(e,n,t,l){return new Promise(((d,u)=>{const f=r.A.getMyId(e,t,Math.random),g=r.A.setupLogger(n,t),m=(0,o.A)(f,g),A=(0,c.A)(g);m.connect(m.getWebSocketUrl(t,e.location)).then((r=>{g.log("connected"),m.on("gameinit",(o=>{const c=i.A.presenterFunc(o.data.presenter,t),a=l(e,n,t,c),u=(0,s.A)(a);m.registerHandler(u,A),function(e,n,t,r){for(const o of e.actionKeys())e.on(o,(e=>{!e||null!==e.playerId&&e.playerId!==r.joinedInd?t.log("ignore"):n.sendRawTo(o,e,r.serverId)}))}(a,r,g,o.data),d(a)})),m.on("reconnect",(n=>{(0,a.vA)(n.data.serverId===n.from,`Different server ${n}`),e.location.reload()})),r.sendRawAll("join")})).catch((e=>{g.error(e),u(e)}))}))}},666:(e,n,t)=>{t.d(n,{A:()=>i});var r=t(379),o=t(272);const i={setupLogger:function(e,n){let t;n.logger&&(t=e.querySelector(n.logger));return function(e,n){return{log:t=>{if(n.networkDebug)return(0,r.Rm)(t,e)},error:n=>{if(e)return(0,r.z3)(n,e)}}}(t,n)},getMyId:function(e,n,t){const r=e.sessionStorage.getItem(n.idNameInStorage);if(r)return r;const i=o.A.makeId(n.idNameLen,t);e.sessionStorage.setItem(n.idNameInStorage,i)},setupMedia:function(){if(navigator.mediaDevices)return navigator.mediaDevices.getUserMedia({audio:!0,video:!0})}}},373:(e,n,t)=>{t.d(n,{A:()=>a});var r=t(189),o=t(746);function i(e,n,t,r,o){let i=t,s="";return o>=0&&o<r.length&&(s=r[o]),{isLastMove:e,isActive:n,text:i,color:s}}function s(e){return{clientUserIdx:e.colorOrder.indexOf(e.color),currentUserIdx:0,playersSize:e.playerLimit,activeCellIndex:-1,activeDigitIndex:-1,lastMove:-1,gameover:!0,gamestarted:!1,round:0,fieldArr:r.A.init(e.size),movesIdx:Array.from({length:e.size}).fill(-1)}}function c({currentUserIdx:e,clientUserIdx:n,playersSize:t,activeCellIndex:s,activeDigitIndex:c,lastMove:a,gameover:l,gamestarted:d,round:u,fieldArr:f,movesIdx:g},m){let A=r.A.field(f);const I=(0,o.A)(["firstmove","gameover"]);const v=()=>{e=(e+1)%t},M=function(t,o,i){if(!((e,n,t,r)=>!(n<0||n>=2)&&t===r&&A.canSet(e))(t,o,i,e))return{res:r.A.IMPOSSIBLE_MOVE,position:-1,digit:-1,playerId:e,clientId:i};const u=A.setSafeByIndex(o,t);if(u===r.A.IMPOSSIBLE_MOVE)return{res:u,position:-1,digit:-1,playerId:e,clientId:i};s=-1,c=-1,d||I.call("firstmove",{}),d=!0,g[t]=i,a=t;const f=e,m=n;return u===r.A.NORMAL_MOVE&&v(),u!==r.A.WINNING_MOVE&&u!==r.A.DRAW_MOVE||(l=!0,I.call("gameover",u)),{res:u,position:t,digit:o,playerId:f,clientId:m}},y=A.size,p=()=>m.colorOrder[e],S=()=>{d=!1,l=!1,s=-1,c=-1,a=-1,f=r.A.init(y()),g=Array.from({length:y()}).fill(-1),e=u%t,A=r.A.field(f)};return{on:function(e,n){return I.on(e,n)},size:y,tryMove:function(){return M(s,c,e)},setMove:M,enum1:()=>function*(){for(let e=0;e<A.size();++e)yield[e,i(a===e,s===e,A.getCharSafe(e),m.colorOrder,g[e])]}(),setActivePosition:function(t){n!==e||l||(s=A.canSet(t)?t:-1)},setActiveDigitIndex:function(t){n!==e||l||(c=t)},currentColor:p,getActiveDigitIndex:()=>c,endMessage:t=>t===r.A.DRAW_MOVE?"Draw":e!==n?"You lose":"You win",endMessage2:e=>e===r.A.DRAW_MOVE?"Draw":p()+" player win",toJson:n=>({currentUserIdx:e,clientUserIdx:n,playersSize:t,activeCellIndex:s,activeDigitIndex:c,lastMove:a,gameover:l,fieldArr:A.toArr(),movesIdx:g}),isGameOver:()=>l,isMyMove:()=>!l&&e===n,calcLastMoveRes:()=>{if(a<0)return r.A.IMPOSSIBLE_MOVE;return A.checkWinning(a)},getCurrentIndex:()=>e,setClientIndex:e=>{n=e},getClientIndex:()=>n,getPlayersSize:()=>t,setMyTurn:()=>{e=n},nextRound:()=>{++u,S()},resetRound:S}}const a={presenterFunc:c,defaultPresenter:s,presenterFuncDefault:function(e){return c(s(e),e)}}},233:(e,n,t)=>{function r(e){let n=Promise.resolve();return{add:t=>new Promise(((r,o)=>{n=n.then(t).then(r).catch((n=>{e.log(n),o(n)}))}))}}t.d(n,{A:()=>r})},272:(e,n,t)=>{function r(e){return function(e,n){let t=e+Math.random()*(n-e);return Math.floor(t)}(0,e)}t.d(n,{A:()=>o});const o={makeId:function(e,n){let t="";const r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let o=0;o<e;o++)t+=r.charAt(Math.floor(62*n()));return t},randomEl:function(e){return e[r(e.length)]}}}}]);