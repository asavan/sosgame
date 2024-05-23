"use strict";(self.webpackChunksosgame=self.webpackChunksosgame||[]).push([[370],{657:(e,t,n)=>{n.d(t,{A:()=>o});var r=n(379);function o(e,t=0){const n=[];for(const[t]of Object.entries(e))n.push(t);let o=n.length;const i=t=>{const o=n[t];(0,r.vA)(o,"Bad Index");const i=e[o];return(0,r.vA)(i,"Empty client"),i},s=t=>{const n=e[t];return(0,r.vA)(n,`No id ${t} in clients`),n},d=(e,t)=>{const r=e.index,o=n[r];n[e.index]=n[t.index],e.index=t.index,n[t.index]=o,t.index=r},l=e=>(e+n.length)%n.length;return{addClient:(t,i)=>{const s=e[t];s?s.name=i:(e[t]={index:o,name:i},n.push(t),++o),(0,r.vA)(o===n.length)},remove:t=>{const i=e[t];--o;const s=n[o];n[i.index]=s,n.pop();e[s].index=i.index,e[t]=void 0,(0,r.vA)(o===n.length)},swapInd:(e,t)=>{const n=i(e),r=i(t);d(n,r)},swapById:(e,t)=>{const n=s(e),r=s(t);d(n,r)},indById:e=>l(s(e).index+t),idByInd:e=>n[l(e-t)],size:()=>n.length}}},370:(e,t,n)=>{n.r(t),n.d(t,{default:()=>x});var r=n(373),o=n(379),i=n(272),s=n(189);const d={bestMove:function(e,t=0,n=void 0){let r=s.A.IMPOSSIBLE_MOVE,o={res:r,digit:-1,position:-1};const i=n||e.size();for(let n=Math.max(t,0);n<Math.min(i,e.size());++n)for(let t=0;t<2;++t){const i=e.setSafeByIndex(t,n,!0);if(i===s.A.IMPOSSIBLE_MOVE)break;if(i===s.A.WINNING_MOVE)return{res:i,digit:t,position:n};r<i&&(r=i,o={res:r,digit:t,position:n})}return o}};const l={bestMove:function(e){const t=[],n=[];for(let r=0;r<e.size();++r)for(let o=0;o<2;++o){const i=e.clone(),l=i.setSafeByIndex(o,r);if(l===s.A.IMPOSSIBLE_MOVE)break;if(l===s.A.WINNING_MOVE)return{res:l,digit:o,position:r};d.bestMove(i,r-2,r+3).res!==s.A.WINNING_MOVE?t.push({res:l,digit:o,position:r}):n.push({res:l,digit:o,position:r})}return t.length>0?i.A.randomEl(t):n.length>0?i.A.randomEl(n):void(0,o.vA)(!1,"No moves")}},c=4,a=5;function u(e,t,n){const r=[],i=n.asString();let l=i.indexOf(e);for(;-1!==l;){const a=0,u=l+t,f=n.clone(),A=f.setSafeByIndex(a,u);(0,o.vA)(A===s.A.NORMAL_MOVE,u);d.bestMove(f,u-2,u+3).res!==s.A.WINNING_MOVE&&r.push({res:c,digit:a,position:u}),l=i.indexOf(e,u+1)}return r}function f(e){const t=[],n=" "+e.asString()+" ",r=" ".repeat(9);let o=n.indexOf(r);for(;-1!==o;){const e=0,i=o+4-1,s=a;t.push({res:s,digit:e,position:i}),o=n.indexOf(r,o+1)}return t}function A(e){(0,o.vA)(e.movesLeft()%2==1);const t=function(e){const t=[];return t.push(...u("   S",0,e)),t.push(...u("S   ",3,e)),t}(e);if(t.length>0)return i.A.randomEl(t);const n=f(e);return n.length>0?i.A.randomEl(n):l.bestMove(e)}function I(e){const t=e.toArr();let n=[],r=0,i=0,s=-1,d=-1;for(let e=0;e<t.length;e++){0===t[e]?(0===r&&(s=e),++r,d=e+1,r>i?(i=r,(0,o.vA)(i===d-s),n=i%2==0?[s+i/2-1,s+i/2]:[(i-1)/2+s]):r===i&&((0,o.vA)(i===d-s),i%2==0?(n.push(i/2+s-1),n.push(s+i/2)):n.push((i-1)/2+s))):(r=0,d=-1,s=-1)}return n}function v(e){(0,o.vA)(e.movesLeft()%2==0);const t=e.asString();let n=t.indexOf("S  S");return n>=0?l.bestMove(e):(n=t.indexOf("   "),n<0?l.bestMove(e):function(e){const t=[],n=[],r=[],l=[];for(let i=0;i<e.size();++i)for(let u=1;u<2;++u){const f=e.clone(),I=f.setSafeByIndex(u,i);if(I===s.A.IMPOSSIBLE_MOVE)break;I===s.A.WINNING_MOVE&&(0,o.vA)(!1,"Bad state");if(d.bestMove(f,i-2,i+3).res===s.A.WINNING_MOVE)n.push({res:I,digit:u,position:i});else{const e=A(f);e.res===c?r.push({res:I,digit:u,position:i}):e.res===a?l.push({res:I,digit:u,position:i}):t.push({res:I,digit:u,position:i})}}if(t.length>0)return i.A.randomEl(t);if(l.length>0)return i.A.randomEl(l);if(r.length>0)return i.A.randomEl(r);if(n.length>0)return i.A.randomEl(n);(0,o.vA)(!1,"No moves")}(e))}const g={bestMove:function(e){const t=d.bestMove(e);if(t.res===s.A.WINNING_MOVE)return t;if(e.movesLeft()%2==1){const t=A(e);return t.res>s.A.DRAW_MOVE&&(t.res=s.A.NORMAL_MOVE),t}return v(e)},findPattern:u,findLongEmpty:f,longestEmptyMids:I,randomEmptyMid:function(e){i.A.randomEl(I(e))},SOOS_MOVE:c,FIRST_S_MOVE:a};var M=n(657);function p(e,t){const n=e.getCurrentIndex();if(n===e.getClientIndex())return;const r=e.toJson(n);(0,o.vA)(r.currentUserIdx===n,"Corrupt data");const i=g.bestMove(s.A.field(r.fieldArr));return i.playerId=n,t.onMessage(i)}function x(e,t,n,i){return new Promise((s=>{const d=r.A.presenterFuncDefault(n),l=i(e,t,n,d),c=d.getClientIndex(),a=(0,M.A)({},c);a.addClient("user","user");for(let e=1;e<d.getPlayersSize();++e){const t="bot"+e;a.addClient(t,t)}l.on("gameover",(()=>{t.querySelector(".butInstall").classList.remove("hidden2")})),l.on("message",(async e=>{e.playerId===c&&(await(0,o.cb)(100),await p(d,l))})),l.on("winclosed",(()=>{d.nextRound(),l.redraw(),p(d,l)})),d.resetRound(),p(d,l),l.redraw(),s(l)}))}},373:(e,t,n)=>{n.d(t,{A:()=>l});var r=n(189),o=n(746);function i(e,t,n,r,o){let i=n,s="";return o>=0&&o<r.length&&(s=r[o]),{isLastMove:e,isActive:t,text:i,color:s}}function s(e){return{clientUserIdx:e.colorOrder.indexOf(e.color),currentUserIdx:0,playersSize:e.playerLimit,activeCellIndex:-1,activeDigitIndex:-1,lastMove:-1,gameover:!0,gamestarted:!1,round:0,fieldArr:r.A.init(e.size),movesIdx:Array.from({length:e.size}).fill(-1)}}function d({currentUserIdx:e,clientUserIdx:t,playersSize:n,activeCellIndex:s,activeDigitIndex:d,lastMove:l,gameover:c,gamestarted:a,round:u,fieldArr:f,movesIdx:A},I){let v=r.A.field(f);const g=(0,o.A)(["firstmove","gameover"]);const M=()=>{e=(e+1)%n},p=function(n,o,i){if(!((e,t,n,r)=>!(t<0||t>=2)&&n===r&&v.canSet(e))(n,o,i,e))return{res:r.A.IMPOSSIBLE_MOVE,position:-1,digit:-1,playerId:e,clientId:i};const u=v.setSafeByIndex(o,n);if(u===r.A.IMPOSSIBLE_MOVE)return{res:u,position:-1,digit:-1,playerId:e,clientId:i};s=-1,d=-1,a||g.call("firstmove",{}),a=!0,A[n]=i,l=n;const f=e,I=t;return u===r.A.NORMAL_MOVE&&M(),u!==r.A.WINNING_MOVE&&u!==r.A.DRAW_MOVE||(c=!0,g.call("gameover",u)),{res:u,position:n,digit:o,playerId:f,clientId:I}},x=v.size,m=()=>I.colorOrder[e],O=()=>{a=!1,c=!1,s=-1,d=-1,l=-1,f=r.A.init(x()),A=Array.from({length:x()}).fill(-1),e=u%n,v=r.A.field(f)};return{on:function(e,t){return g.on(e,t)},size:x,tryMove:function(){return p(s,d,e)},setMove:p,enum1:()=>function*(){for(let e=0;e<v.size();++e)yield[e,i(l===e,s===e,v.getCharSafe(e),I.colorOrder,A[e])]}(),setActivePosition:function(n){t!==e||c||(s=v.canSet(n)?n:-1)},setActiveDigitIndex:function(n){t!==e||c||(d=n)},currentColor:m,getActiveDigitIndex:()=>d,endMessage:n=>n===r.A.DRAW_MOVE?"Draw":e!==t?"You lose":"You win",endMessage2:e=>e===r.A.DRAW_MOVE?"Draw":m()+" player win",toJson:t=>({currentUserIdx:e,clientUserIdx:t,playersSize:n,activeCellIndex:s,activeDigitIndex:d,lastMove:l,gameover:c,fieldArr:v.toArr(),movesIdx:A}),isGameOver:()=>c,isMyMove:()=>!c&&e===t,calcLastMoveRes:()=>{if(l<0)return r.A.IMPOSSIBLE_MOVE;return v.checkWinning(l)},getCurrentIndex:()=>e,setClientIndex:e=>{t=e},getClientIndex:()=>t,getPlayersSize:()=>n,setMyTurn:()=>{e=t},nextRound:()=>{++u,O()},resetRound:O}}const l={presenterFunc:d,defaultPresenter:s,presenterFuncDefault:function(e){return d(s(e),e)}}},272:(e,t,n)=>{function r(e){return function(e,t){let n=e+Math.random()*(t-e);return Math.floor(n)}(0,e)}n.d(t,{A:()=>o});const o={makeId:function(e,t){let n="";const r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let o=0;o<e;o++)n+=r.charAt(Math.floor(62*t()));return n},randomEl:function(e){return e[r(e.length)]}}}}]);