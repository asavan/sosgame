"use strict";(self.webpackChunksosgame=self.webpackChunksosgame||[]).push([[334],{510:(e,n,t)=>{t.d(n,{A:()=>r});const r=function(e){return{message:e.onMessage}}},940:(e,n,t)=>{t.d(n,{A:()=>i});var r=t(746);function o(){}function i(e,n){const t=(0,r.A)(["close","disconnect","error","join","gameinit","reconnect"]);let i,s={};return{connect:function(c){return new Promise(((a,l)=>{c||l("Can't determine ws address");const u=function(e,n,t){const i=(0,r.A)(["error","open","message","beforeclose","close"]),s=new WebSocket(n);function c(e){t.log("Websocket message received: "+e);const n=JSON.parse(e);return i.call("message",n)}return s.onopen=function(){return i.call("open",e)},s.onclose=function(n){return t.log("Websocket closed "+n.code+" "+n.reason),i.call("close",e)},s.onmessage=async function(e){return e.data instanceof Blob?c(await e.data.text()):c(e.data)},s.onerror=function(n){return t.error(n),i.call("error",e)},{on:(e,n)=>i.on(e,n),send:(n,r,o,i)=>{const c={from:e,to:o,action:n,data:r,ignore:i};return t.log("Sending ["+e+"] to ["+o+"]: "+JSON.stringify(r)),s.send(JSON.stringify(c))},close:async()=>(await i.call("beforeclose",e),s.onerror=o,s.close())}}(e,c,n);u.on("message",(function(r){if(r.from!==e)if(r.to===e||"all"===r.to){if(!(r.ignore&&Array.isArray(r.ignore)&&r.ignore.includes(e)))return t.actionKeys().includes(r.action)?(n.log("handlers.actionKeys"),t.call(r.action,r)):Object.keys(s).includes(r.action)?(n.log("callCurrentHandler"),function(e,t){const r=s[e];"function"==typeof r?i?i.add((()=>r(t.data,t.from))):n.log("No queue"):n.log("Not function")}(r.action,r)):void n.log("Unknown action "+r.action);n.log("user in ignore list")}else n.log("another user");else n.error("same user")}));const d=(e,t,r)=>(n.log(t),u.send(e,t,"all",r)),f=(e,n,t)=>u.send(e,n,t);u.on("open",(()=>a({sendRawAll:d,sendRawTo:f})))}))},on:function(e,n){return t.on(e,n)},getWebSocketUrl:function(e,n){return e.wh?e.wh:"https:"!==n.protocol?"ws://"+n.hostname+":"+e.wsPort:void 0},registerHandler:function(e,n){i=n,s=e}}}},189:(e,n,t)=>{t.d(n,{A:()=>u});const r=-1,o=1,i=2,s=3;function c(e){switch(e){case 5:return"S";case 2:return"O";case 0:return" "}return""}function a(e){return Array.from({length:e}).fill(0)}function l(e){const n=[5,2],t=[-1,-1,...e,-1,-1],a=t.length-4,u=e=>e>=0&&e<a,d=e=>{for(let n=e+2;n<e+5;++n){if(5===t[n-2]&&2===t[n-1]&&5===t[n])return s}for(let e=0;e<a;e++)if(0===t[e+2])return o;return i},f=e=>0===t[2+e],g=e=>u(e)&&f(e),I=()=>t.slice(2,-2);return{size:()=>a,setSafe:(e,n)=>g(n)?(((e,n)=>{t[2+n]=function(e){switch(e){case"S":case"s":return 5;case"O":case"o":return 2;case" ":return 0;case"":return-1}return-1}(e)})(e,n),d(n)):r,setSafeByIndex:(e,o,i=!1)=>{if(!g(o))return r;if(e<0||e>=n.length)return r;const s=t[2+o];t[2+o]=n[e];const c=d(o);return i&&(t[2+o]=s),c},getCharSafe:e=>u(e)?(e=>c(t[2+e]))(e):"",canSet:g,clone:()=>l(e),movesLeft:()=>t.reduce(((e,n)=>e+(0===n)),0),toArr:I,asString:()=>I().map(c).join(""),isEmpty:f,inBounds:u,checkWinning:d}}const u={defaultField:function(e){return l(a(e))},field:l,init:a,IMPOSSIBLE_MOVE:r,NORMAL_MOVE:o,WINNING_MOVE:s,DRAW_MOVE:i}},334:(e,n,t)=>{t.r(n),t.d(n,{default:()=>l});var r=t(666),o=t(940),i=t(373),s=t(510),c=t(233),a=t(379);function l(e,n,t,l){return new Promise(((u,d)=>{const f=r.A.getMyId(e,t,Math.random),g=r.A.setupLogger(n,t),I=(0,o.A)(f,g),m=(0,c.A)(g);I.connect(I.getWebSocketUrl(t,e.location)).then((r=>{g.log("connected"),I.on("gameinit",(o=>{const c=i.A.presenterFunc(o.data.presenter,t),a=l(e,n,t,c),d=(0,s.A)(a);I.registerHandler(d,m),function(e,n,t,r){for(const o of e.actionKeys())e.on(o,(e=>{!e||null!==e.playerId&&e.playerId!==r.joinedInd?t.log("ignore"):n.sendRawTo(o,e,r.serverId)}))}(a,r,g,o.data),u(a)})),I.on("reconnect",(n=>{(0,a.vA)(n.data.serverId===n.from,`Different server ${n}`),e.location.reload()})),r.sendRawAll("join")})).catch((e=>{g.error(e),d(e)}))}))}},666:(e,n,t)=>{t.d(n,{A:()=>i});var r=t(379),o=t(272);const i={setupLogger:function(e,n){let t;n.logger&&(t=e.querySelector(n.logger));return function(e,n){return{log:t=>{if(n.networkDebug)return(0,r.Rm)(t,e)},error:n=>{if(e)return(0,r.z3)(n,e)}}}(t,n)},getMyId:function(e,n,t){const r=e.sessionStorage.getItem(n.idNameInStorage);if(r)return r;const i=o.A.makeId(n.idNameLen,t);e.sessionStorage.setItem(n.idNameInStorage,i)},setupMedia:function(){if(navigator.mediaDevices)return navigator.mediaDevices.getUserMedia({audio:!0,video:!0})}}},373:(e,n,t)=>{t.d(n,{A:()=>a});var r=t(189),o=t(746);function i(e,n,t,r,o){let i=t,s="";return o>=0&&o<r.length&&(s=r[o]),{isLastMove:e,isActive:n,text:i,color:s}}function s(e){return{clientUserIdx:e.colorOrder.indexOf(e.color),currentUserIdx:0,playersSize:e.playerLimit,activeCellIndex:-1,activeDigitIndex:-1,lastMove:-1,gameover:!0,round:0,moveCount:0,fieldArr:r.A.init(e.size),movesIdx:Array.from({length:e.size}).fill(-1)}}function c({currentUserIdx:e,clientUserIdx:n,playersSize:t,activeCellIndex:s,activeDigitIndex:c,lastMove:a,gameover:l,round:u,moveCount:d,fieldArr:f,movesIdx:g},I){let m=r.A.field(f);const A=(0,o.A)(["moveEnd","nextPlayer","gameover"]);const v=()=>{e=(e+1)%t},y=async function(t,o,i){if(!((e,n,t,r)=>!(n<0||n>=2)&&t===r&&m.canSet(e))(t,o,i,e))return{res:r.A.IMPOSSIBLE_MOVE,position:-1,digit:-1,playerId:e,clientId:i};const u=m.setSafeByIndex(o,t);if(u===r.A.IMPOSSIBLE_MOVE)return{res:u,position:-1,digit:-1,playerId:e,clientId:i};s=-1,c=-1,g[t]=i,a=t,++d;const f=e,I=n;return await A.call("moveEnd",{res:u,position:t,digit:o,playerId:f,clientId:I,moveCount:d}),u===r.A.NORMAL_MOVE&&(v(),await A.call("nextPlayer",{res:u,position:t,digit:o,playerId:f,clientId:I,moveCount:d})),u!==r.A.WINNING_MOVE&&u!==r.A.DRAW_MOVE||(l=!0,await A.call("gameover",{res:u,position:t,digit:o,playerId:f,clientId:I,moveCount:d})),{res:u,position:t,digit:o,playerId:f,clientId:I}},p=m.size,M=()=>I.colorOrder[e],S=()=>{d=0,l=!1,s=-1,c=-1,a=-1,f=r.A.init(p()),g=Array.from({length:p()}).fill(-1),e=u%t,m=r.A.field(f)};return{on:function(e,n){return A.on(e,n)},size:p,tryMove:function(){return y(s,c,e)},setMove:y,enum1:()=>function*(){for(let e=0;e<m.size();++e)yield[e,i(a===e,s===e,m.getCharSafe(e),I.colorOrder,g[e])]}(),setActivePosition:function(t){n!==e||l||(s=m.canSet(t)?t:-1)},setActiveDigitIndex:function(t){n!==e||l||(c=t)},currentColor:M,getActiveDigitIndex:()=>c,endMessage:t=>t===r.A.DRAW_MOVE?"Draw":e!==n?"You lose":"You win",endMessage2:e=>e===r.A.DRAW_MOVE?"Draw":M()+" player win",toJson:n=>({currentUserIdx:e,clientUserIdx:n,playersSize:t,activeCellIndex:s,activeDigitIndex:c,lastMove:a,gameover:l,fieldArr:m.toArr(),movesIdx:g}),isGameOver:()=>l,isMyMove:()=>!l&&e===n,calcLastMoveRes:()=>{if(a<0)return r.A.IMPOSSIBLE_MOVE;return m.checkWinning(a)},getCurrentIndex:()=>e,setClientIndex:e=>{n=e},getClientIndex:()=>n,getPlayersSize:()=>t,setMyTurn:()=>{e=n},nextRound:()=>{++u,S()},resetRound:S}}const a={presenterFunc:c,defaultPresenter:s,presenterFuncDefault:function(e){return c(s(e),e)}}},233:(e,n,t)=>{function r(e){let n=Promise.resolve();return{add:t=>new Promise(((r,o)=>{n=n.then(t).then(r).catch((n=>{e.log(n),o(n)}))}))}}t.d(n,{A:()=>r})},272:(e,n,t)=>{function r(e){return function(e,n){let t=e+Math.random()*(n-e);return Math.floor(t)}(0,e)}t.d(n,{A:()=>o});const o={makeId:function(e,n){let t="";const r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let o=0;o<e;o++)t+=r.charAt(Math.floor(62*n()));return t},randomEl:function(e){return e[r(e.length)]}}}}]);