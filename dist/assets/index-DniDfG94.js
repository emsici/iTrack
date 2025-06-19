var Kg=Object.defineProperty;var Jg=(g,m,y)=>m in g?Kg(g,m,{enumerable:!0,configurable:!0,writable:!0,value:y}):g[m]=y;var id=(g,m,y)=>Jg(g,typeof m!="symbol"?m+"":m,y);(function(){const m=document.createElement("link").relList;if(m&&m.supports&&m.supports("modulepreload"))return;for(const E of document.querySelectorAll('link[rel="modulepreload"]'))f(E);new MutationObserver(E=>{for(const O of E)if(O.type==="childList")for(const C of O.addedNodes)C.tagName==="LINK"&&C.rel==="modulepreload"&&f(C)}).observe(document,{childList:!0,subtree:!0});function y(E){const O={};return E.integrity&&(O.integrity=E.integrity),E.referrerPolicy&&(O.referrerPolicy=E.referrerPolicy),E.crossOrigin==="use-credentials"?O.credentials="include":E.crossOrigin==="anonymous"?O.credentials="omit":O.credentials="same-origin",O}function f(E){if(E.ep)return;E.ep=!0;const O=y(E);fetch(E.href,O)}})();function yd(g){return g&&g.__esModule&&Object.prototype.hasOwnProperty.call(g,"default")?g.default:g}var es={exports:{}},xn={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ud;function $g(){if(ud)return xn;ud=1;var g=Symbol.for("react.transitional.element"),m=Symbol.for("react.fragment");function y(f,E,O){var C=null;if(O!==void 0&&(C=""+O),E.key!==void 0&&(C=""+E.key),"key"in E){O={};for(var Y in E)Y!=="key"&&(O[Y]=E[Y])}else O=E;return E=O.ref,{$$typeof:g,type:f,key:C,ref:E!==void 0?E:null,props:O}}return xn.Fragment=m,xn.jsx=y,xn.jsxs=y,xn}var cd;function Wg(){return cd||(cd=1,es.exports=$g()),es.exports}var s=Wg(),ts={exports:{}},J={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var sd;function Fg(){if(sd)return J;sd=1;var g=Symbol.for("react.transitional.element"),m=Symbol.for("react.portal"),y=Symbol.for("react.fragment"),f=Symbol.for("react.strict_mode"),E=Symbol.for("react.profiler"),O=Symbol.for("react.consumer"),C=Symbol.for("react.context"),Y=Symbol.for("react.forward_ref"),D=Symbol.for("react.suspense"),v=Symbol.for("react.memo"),H=Symbol.for("react.lazy"),_=Symbol.iterator;function M(o){return o===null||typeof o!="object"?null:(o=_&&o[_]||o["@@iterator"],typeof o=="function"?o:null)}var F={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},K=Object.assign,ve={};function ce(o,N,B){this.props=o,this.context=N,this.refs=ve,this.updater=B||F}ce.prototype.isReactComponent={},ce.prototype.setState=function(o,N){if(typeof o!="object"&&typeof o!="function"&&o!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,o,N,"setState")},ce.prototype.forceUpdate=function(o){this.updater.enqueueForceUpdate(this,o,"forceUpdate")};function ot(){}ot.prototype=ce.prototype;function et(o,N,B){this.props=o,this.context=N,this.refs=ve,this.updater=B||F}var xe=et.prototype=new ot;xe.constructor=et,K(xe,ce.prototype),xe.isPureReactComponent=!0;var qe=Array.isArray,$={H:null,A:null,T:null,S:null,V:null},Ge=Object.prototype.hasOwnProperty;function De(o,N,B,w,X,ne){return B=ne.ref,{$$typeof:g,type:o,key:N,ref:B!==void 0?B:null,props:ne}}function ae(o,N){return De(o.type,N,void 0,void 0,void 0,o.props)}function he(o){return typeof o=="object"&&o!==null&&o.$$typeof===g}function Me(o){var N={"=":"=0",":":"=2"};return"$"+o.replace(/[=:]/g,function(B){return N[B]})}var je=/\/+/g;function me(o,N){return typeof o=="object"&&o!==null&&o.key!=null?Me(""+o.key):N.toString(36)}function Ee(){}function Je(o){switch(o.status){case"fulfilled":return o.value;case"rejected":throw o.reason;default:switch(typeof o.status=="string"?o.then(Ee,Ee):(o.status="pending",o.then(function(N){o.status==="pending"&&(o.status="fulfilled",o.value=N)},function(N){o.status==="pending"&&(o.status="rejected",o.reason=N)})),o.status){case"fulfilled":return o.value;case"rejected":throw o.reason}}throw o}function R(o,N,B,w,X){var ne=typeof o;(ne==="undefined"||ne==="boolean")&&(o=null);var k=!1;if(o===null)k=!0;else switch(ne){case"bigint":case"string":case"number":k=!0;break;case"object":switch(o.$$typeof){case g:case m:k=!0;break;case H:return k=o._init,R(k(o._payload),N,B,w,X)}}if(k)return X=X(o),k=w===""?"."+me(o,0):w,qe(X)?(B="",k!=null&&(B=k.replace(je,"$&/")+"/"),R(X,N,B,"",function(Vt){return Vt})):X!=null&&(he(X)&&(X=ae(X,B+(X.key==null||o&&o.key===X.key?"":(""+X.key).replace(je,"$&/")+"/")+k)),N.push(X)),1;k=0;var tt=w===""?".":w+":";if(qe(o))for(var ye=0;ye<o.length;ye++)w=o[ye],ne=tt+me(w,ye),k+=R(w,N,B,ne,X);else if(ye=M(o),typeof ye=="function")for(o=ye.call(o),ye=0;!(w=o.next()).done;)w=w.value,ne=tt+me(w,ye++),k+=R(w,N,B,ne,X);else if(ne==="object"){if(typeof o.then=="function")return R(Je(o),N,B,w,X);throw N=String(o),Error("Objects are not valid as a React child (found: "+(N==="[object Object]"?"object with keys {"+Object.keys(o).join(", ")+"}":N)+"). If you meant to render a collection of children, use an array instead.")}return k}function T(o,N,B){if(o==null)return o;var w=[],X=0;return R(o,w,"","",function(ne){return N.call(B,ne,X++)}),w}function U(o){if(o._status===-1){var N=o._result;N=N(),N.then(function(B){(o._status===0||o._status===-1)&&(o._status=1,o._result=B)},function(B){(o._status===0||o._status===-1)&&(o._status=2,o._result=B)}),o._status===-1&&(o._status=0,o._result=N)}if(o._status===1)return o._result.default;throw o._result}var L=typeof reportError=="function"?reportError:function(o){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var N=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof o=="object"&&o!==null&&typeof o.message=="string"?String(o.message):String(o),error:o});if(!window.dispatchEvent(N))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",o);return}console.error(o)};function te(){}return J.Children={map:T,forEach:function(o,N,B){T(o,function(){N.apply(this,arguments)},B)},count:function(o){var N=0;return T(o,function(){N++}),N},toArray:function(o){return T(o,function(N){return N})||[]},only:function(o){if(!he(o))throw Error("React.Children.only expected to receive a single React element child.");return o}},J.Component=ce,J.Fragment=y,J.Profiler=E,J.PureComponent=et,J.StrictMode=f,J.Suspense=D,J.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=$,J.__COMPILER_RUNTIME={__proto__:null,c:function(o){return $.H.useMemoCache(o)}},J.cache=function(o){return function(){return o.apply(null,arguments)}},J.cloneElement=function(o,N,B){if(o==null)throw Error("The argument must be a React element, but you passed "+o+".");var w=K({},o.props),X=o.key,ne=void 0;if(N!=null)for(k in N.ref!==void 0&&(ne=void 0),N.key!==void 0&&(X=""+N.key),N)!Ge.call(N,k)||k==="key"||k==="__self"||k==="__source"||k==="ref"&&N.ref===void 0||(w[k]=N[k]);var k=arguments.length-2;if(k===1)w.children=B;else if(1<k){for(var tt=Array(k),ye=0;ye<k;ye++)tt[ye]=arguments[ye+2];w.children=tt}return De(o.type,X,void 0,void 0,ne,w)},J.createContext=function(o){return o={$$typeof:C,_currentValue:o,_currentValue2:o,_threadCount:0,Provider:null,Consumer:null},o.Provider=o,o.Consumer={$$typeof:O,_context:o},o},J.createElement=function(o,N,B){var w,X={},ne=null;if(N!=null)for(w in N.key!==void 0&&(ne=""+N.key),N)Ge.call(N,w)&&w!=="key"&&w!=="__self"&&w!=="__source"&&(X[w]=N[w]);var k=arguments.length-2;if(k===1)X.children=B;else if(1<k){for(var tt=Array(k),ye=0;ye<k;ye++)tt[ye]=arguments[ye+2];X.children=tt}if(o&&o.defaultProps)for(w in k=o.defaultProps,k)X[w]===void 0&&(X[w]=k[w]);return De(o,ne,void 0,void 0,null,X)},J.createRef=function(){return{current:null}},J.forwardRef=function(o){return{$$typeof:Y,render:o}},J.isValidElement=he,J.lazy=function(o){return{$$typeof:H,_payload:{_status:-1,_result:o},_init:U}},J.memo=function(o,N){return{$$typeof:v,type:o,compare:N===void 0?null:N}},J.startTransition=function(o){var N=$.T,B={};$.T=B;try{var w=o(),X=$.S;X!==null&&X(B,w),typeof w=="object"&&w!==null&&typeof w.then=="function"&&w.then(te,L)}catch(ne){L(ne)}finally{$.T=N}},J.unstable_useCacheRefresh=function(){return $.H.useCacheRefresh()},J.use=function(o){return $.H.use(o)},J.useActionState=function(o,N,B){return $.H.useActionState(o,N,B)},J.useCallback=function(o,N){return $.H.useCallback(o,N)},J.useContext=function(o){return $.H.useContext(o)},J.useDebugValue=function(){},J.useDeferredValue=function(o,N){return $.H.useDeferredValue(o,N)},J.useEffect=function(o,N,B){var w=$.H;if(typeof B=="function")throw Error("useEffect CRUD overload is not enabled in this build of React.");return w.useEffect(o,N)},J.useId=function(){return $.H.useId()},J.useImperativeHandle=function(o,N,B){return $.H.useImperativeHandle(o,N,B)},J.useInsertionEffect=function(o,N){return $.H.useInsertionEffect(o,N)},J.useLayoutEffect=function(o,N){return $.H.useLayoutEffect(o,N)},J.useMemo=function(o,N){return $.H.useMemo(o,N)},J.useOptimistic=function(o,N){return $.H.useOptimistic(o,N)},J.useReducer=function(o,N,B){return $.H.useReducer(o,N,B)},J.useRef=function(o){return $.H.useRef(o)},J.useState=function(o){return $.H.useState(o)},J.useSyncExternalStore=function(o,N,B){return $.H.useSyncExternalStore(o,N,B)},J.useTransition=function(){return $.H.useTransition()},J.version="19.1.0",J}var rd;function rs(){return rd||(rd=1,ts.exports=Fg()),ts.exports}var ge=rs();const Pg=yd(ge);var ls={exports:{}},yn={},as={exports:{}},ns={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var fd;function Ig(){return fd||(fd=1,function(g){function m(T,U){var L=T.length;T.push(U);e:for(;0<L;){var te=L-1>>>1,o=T[te];if(0<E(o,U))T[te]=U,T[L]=o,L=te;else break e}}function y(T){return T.length===0?null:T[0]}function f(T){if(T.length===0)return null;var U=T[0],L=T.pop();if(L!==U){T[0]=L;e:for(var te=0,o=T.length,N=o>>>1;te<N;){var B=2*(te+1)-1,w=T[B],X=B+1,ne=T[X];if(0>E(w,L))X<o&&0>E(ne,w)?(T[te]=ne,T[X]=L,te=X):(T[te]=w,T[B]=L,te=B);else if(X<o&&0>E(ne,L))T[te]=ne,T[X]=L,te=X;else break e}}return U}function E(T,U){var L=T.sortIndex-U.sortIndex;return L!==0?L:T.id-U.id}if(g.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var O=performance;g.unstable_now=function(){return O.now()}}else{var C=Date,Y=C.now();g.unstable_now=function(){return C.now()-Y}}var D=[],v=[],H=1,_=null,M=3,F=!1,K=!1,ve=!1,ce=!1,ot=typeof setTimeout=="function"?setTimeout:null,et=typeof clearTimeout=="function"?clearTimeout:null,xe=typeof setImmediate<"u"?setImmediate:null;function qe(T){for(var U=y(v);U!==null;){if(U.callback===null)f(v);else if(U.startTime<=T)f(v),U.sortIndex=U.expirationTime,m(D,U);else break;U=y(v)}}function $(T){if(ve=!1,qe(T),!K)if(y(D)!==null)K=!0,Ge||(Ge=!0,me());else{var U=y(v);U!==null&&R($,U.startTime-T)}}var Ge=!1,De=-1,ae=5,he=-1;function Me(){return ce?!0:!(g.unstable_now()-he<ae)}function je(){if(ce=!1,Ge){var T=g.unstable_now();he=T;var U=!0;try{e:{K=!1,ve&&(ve=!1,et(De),De=-1),F=!0;var L=M;try{t:{for(qe(T),_=y(D);_!==null&&!(_.expirationTime>T&&Me());){var te=_.callback;if(typeof te=="function"){_.callback=null,M=_.priorityLevel;var o=te(_.expirationTime<=T);if(T=g.unstable_now(),typeof o=="function"){_.callback=o,qe(T),U=!0;break t}_===y(D)&&f(D),qe(T)}else f(D);_=y(D)}if(_!==null)U=!0;else{var N=y(v);N!==null&&R($,N.startTime-T),U=!1}}break e}finally{_=null,M=L,F=!1}U=void 0}}finally{U?me():Ge=!1}}}var me;if(typeof xe=="function")me=function(){xe(je)};else if(typeof MessageChannel<"u"){var Ee=new MessageChannel,Je=Ee.port2;Ee.port1.onmessage=je,me=function(){Je.postMessage(null)}}else me=function(){ot(je,0)};function R(T,U){De=ot(function(){T(g.unstable_now())},U)}g.unstable_IdlePriority=5,g.unstable_ImmediatePriority=1,g.unstable_LowPriority=4,g.unstable_NormalPriority=3,g.unstable_Profiling=null,g.unstable_UserBlockingPriority=2,g.unstable_cancelCallback=function(T){T.callback=null},g.unstable_forceFrameRate=function(T){0>T||125<T?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):ae=0<T?Math.floor(1e3/T):5},g.unstable_getCurrentPriorityLevel=function(){return M},g.unstable_next=function(T){switch(M){case 1:case 2:case 3:var U=3;break;default:U=M}var L=M;M=U;try{return T()}finally{M=L}},g.unstable_requestPaint=function(){ce=!0},g.unstable_runWithPriority=function(T,U){switch(T){case 1:case 2:case 3:case 4:case 5:break;default:T=3}var L=M;M=T;try{return U()}finally{M=L}},g.unstable_scheduleCallback=function(T,U,L){var te=g.unstable_now();switch(typeof L=="object"&&L!==null?(L=L.delay,L=typeof L=="number"&&0<L?te+L:te):L=te,T){case 1:var o=-1;break;case 2:o=250;break;case 5:o=1073741823;break;case 4:o=1e4;break;default:o=5e3}return o=L+o,T={id:H++,callback:U,priorityLevel:T,startTime:L,expirationTime:o,sortIndex:-1},L>te?(T.sortIndex=L,m(v,T),y(D)===null&&T===y(v)&&(ve?(et(De),De=-1):ve=!0,R($,L-te))):(T.sortIndex=o,m(D,T),K||F||(K=!0,Ge||(Ge=!0,me()))),T},g.unstable_shouldYield=Me,g.unstable_wrapCallback=function(T){var U=M;return function(){var L=M;M=U;try{return T.apply(this,arguments)}finally{M=L}}}}(ns)),ns}var od;function eh(){return od||(od=1,as.exports=Ig()),as.exports}var is={exports:{}},ke={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var dd;function th(){if(dd)return ke;dd=1;var g=rs();function m(D){var v="https://react.dev/errors/"+D;if(1<arguments.length){v+="?args[]="+encodeURIComponent(arguments[1]);for(var H=2;H<arguments.length;H++)v+="&args[]="+encodeURIComponent(arguments[H])}return"Minified React error #"+D+"; visit "+v+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function y(){}var f={d:{f:y,r:function(){throw Error(m(522))},D:y,C:y,L:y,m:y,X:y,S:y,M:y},p:0,findDOMNode:null},E=Symbol.for("react.portal");function O(D,v,H){var _=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:E,key:_==null?null:""+_,children:D,containerInfo:v,implementation:H}}var C=g.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function Y(D,v){if(D==="font")return"";if(typeof v=="string")return v==="use-credentials"?v:""}return ke.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=f,ke.createPortal=function(D,v){var H=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!v||v.nodeType!==1&&v.nodeType!==9&&v.nodeType!==11)throw Error(m(299));return O(D,v,null,H)},ke.flushSync=function(D){var v=C.T,H=f.p;try{if(C.T=null,f.p=2,D)return D()}finally{C.T=v,f.p=H,f.d.f()}},ke.preconnect=function(D,v){typeof D=="string"&&(v?(v=v.crossOrigin,v=typeof v=="string"?v==="use-credentials"?v:"":void 0):v=null,f.d.C(D,v))},ke.prefetchDNS=function(D){typeof D=="string"&&f.d.D(D)},ke.preinit=function(D,v){if(typeof D=="string"&&v&&typeof v.as=="string"){var H=v.as,_=Y(H,v.crossOrigin),M=typeof v.integrity=="string"?v.integrity:void 0,F=typeof v.fetchPriority=="string"?v.fetchPriority:void 0;H==="style"?f.d.S(D,typeof v.precedence=="string"?v.precedence:void 0,{crossOrigin:_,integrity:M,fetchPriority:F}):H==="script"&&f.d.X(D,{crossOrigin:_,integrity:M,fetchPriority:F,nonce:typeof v.nonce=="string"?v.nonce:void 0})}},ke.preinitModule=function(D,v){if(typeof D=="string")if(typeof v=="object"&&v!==null){if(v.as==null||v.as==="script"){var H=Y(v.as,v.crossOrigin);f.d.M(D,{crossOrigin:H,integrity:typeof v.integrity=="string"?v.integrity:void 0,nonce:typeof v.nonce=="string"?v.nonce:void 0})}}else v==null&&f.d.M(D)},ke.preload=function(D,v){if(typeof D=="string"&&typeof v=="object"&&v!==null&&typeof v.as=="string"){var H=v.as,_=Y(H,v.crossOrigin);f.d.L(D,H,{crossOrigin:_,integrity:typeof v.integrity=="string"?v.integrity:void 0,nonce:typeof v.nonce=="string"?v.nonce:void 0,type:typeof v.type=="string"?v.type:void 0,fetchPriority:typeof v.fetchPriority=="string"?v.fetchPriority:void 0,referrerPolicy:typeof v.referrerPolicy=="string"?v.referrerPolicy:void 0,imageSrcSet:typeof v.imageSrcSet=="string"?v.imageSrcSet:void 0,imageSizes:typeof v.imageSizes=="string"?v.imageSizes:void 0,media:typeof v.media=="string"?v.media:void 0})}},ke.preloadModule=function(D,v){if(typeof D=="string")if(v){var H=Y(v.as,v.crossOrigin);f.d.m(D,{as:typeof v.as=="string"&&v.as!=="script"?v.as:void 0,crossOrigin:H,integrity:typeof v.integrity=="string"?v.integrity:void 0})}else f.d.m(D)},ke.requestFormReset=function(D){f.d.r(D)},ke.unstable_batchedUpdates=function(D,v){return D(v)},ke.useFormState=function(D,v,H){return C.H.useFormState(D,v,H)},ke.useFormStatus=function(){return C.H.useHostTransitionStatus()},ke.version="19.1.0",ke}var gd;function lh(){if(gd)return is.exports;gd=1;function g(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(g)}catch(m){console.error(m)}}return g(),is.exports=th(),is.exports}/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var hd;function ah(){if(hd)return yn;hd=1;var g=eh(),m=rs(),y=lh();function f(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var l=2;l<arguments.length;l++)t+="&args[]="+encodeURIComponent(arguments[l])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function E(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function O(e){var t=e,l=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(l=t.return),e=t.return;while(e)}return t.tag===3?l:null}function C(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Y(e){if(O(e)!==e)throw Error(f(188))}function D(e){var t=e.alternate;if(!t){if(t=O(e),t===null)throw Error(f(188));return t!==e?null:e}for(var l=e,a=t;;){var n=l.return;if(n===null)break;var i=n.alternate;if(i===null){if(a=n.return,a!==null){l=a;continue}break}if(n.child===i.child){for(i=n.child;i;){if(i===l)return Y(n),e;if(i===a)return Y(n),t;i=i.sibling}throw Error(f(188))}if(l.return!==a.return)l=n,a=i;else{for(var u=!1,c=n.child;c;){if(c===l){u=!0,l=n,a=i;break}if(c===a){u=!0,a=n,l=i;break}c=c.sibling}if(!u){for(c=i.child;c;){if(c===l){u=!0,l=i,a=n;break}if(c===a){u=!0,a=i,l=n;break}c=c.sibling}if(!u)throw Error(f(189))}}if(l.alternate!==a)throw Error(f(190))}if(l.tag!==3)throw Error(f(188));return l.stateNode.current===l?e:t}function v(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=v(e),t!==null)return t;e=e.sibling}return null}var H=Object.assign,_=Symbol.for("react.element"),M=Symbol.for("react.transitional.element"),F=Symbol.for("react.portal"),K=Symbol.for("react.fragment"),ve=Symbol.for("react.strict_mode"),ce=Symbol.for("react.profiler"),ot=Symbol.for("react.provider"),et=Symbol.for("react.consumer"),xe=Symbol.for("react.context"),qe=Symbol.for("react.forward_ref"),$=Symbol.for("react.suspense"),Ge=Symbol.for("react.suspense_list"),De=Symbol.for("react.memo"),ae=Symbol.for("react.lazy"),he=Symbol.for("react.activity"),Me=Symbol.for("react.memo_cache_sentinel"),je=Symbol.iterator;function me(e){return e===null||typeof e!="object"?null:(e=je&&e[je]||e["@@iterator"],typeof e=="function"?e:null)}var Ee=Symbol.for("react.client.reference");function Je(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===Ee?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case K:return"Fragment";case ce:return"Profiler";case ve:return"StrictMode";case $:return"Suspense";case Ge:return"SuspenseList";case he:return"Activity"}if(typeof e=="object")switch(e.$$typeof){case F:return"Portal";case xe:return(e.displayName||"Context")+".Provider";case et:return(e._context.displayName||"Context")+".Consumer";case qe:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case De:return t=e.displayName||null,t!==null?t:Je(e.type)||"Memo";case ae:t=e._payload,e=e._init;try{return Je(e(t))}catch{}}return null}var R=Array.isArray,T=m.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,U=y.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,L={pending:!1,data:null,method:null,action:null},te=[],o=-1;function N(e){return{current:e}}function B(e){0>o||(e.current=te[o],te[o]=null,o--)}function w(e,t){o++,te[o]=e.current,e.current=t}var X=N(null),ne=N(null),k=N(null),tt=N(null);function ye(e,t){switch(w(k,t),w(ne,e),w(X,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?Ro(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=Ro(t),e=wo(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}B(X),w(X,e)}function Vt(){B(X),B(ne),B(k)}function qi(e){e.memoizedState!==null&&w(tt,e);var t=X.current,l=wo(t,e.type);t!==l&&(w(ne,e),w(X,l))}function Tn(e){ne.current===e&&(B(X),B(ne)),tt.current===e&&(B(tt),hn._currentValue=L)}var Gi=Object.prototype.hasOwnProperty,Li=g.unstable_scheduleCallback,Xi=g.unstable_cancelCallback,Ad=g.unstable_shouldYield,jd=g.unstable_requestPaint,zt=g.unstable_now,Nd=g.unstable_getCurrentPriorityLevel,os=g.unstable_ImmediatePriority,ds=g.unstable_UserBlockingPriority,En=g.unstable_NormalPriority,Od=g.unstable_LowPriority,gs=g.unstable_IdlePriority,Dd=g.log,_d=g.unstable_setDisableYieldValue,Sa=null,lt=null;function kt(e){if(typeof Dd=="function"&&_d(e),lt&&typeof lt.setStrictMode=="function")try{lt.setStrictMode(Sa,e)}catch{}}var at=Math.clz32?Math.clz32:Rd,Ud=Math.log,Md=Math.LN2;function Rd(e){return e>>>=0,e===0?32:31-(Ud(e)/Md|0)|0}var zn=256,An=4194304;function pl(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194048;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function jn(e,t,l){var a=e.pendingLanes;if(a===0)return 0;var n=0,i=e.suspendedLanes,u=e.pingedLanes;e=e.warmLanes;var c=a&134217727;return c!==0?(a=c&~i,a!==0?n=pl(a):(u&=c,u!==0?n=pl(u):l||(l=c&~e,l!==0&&(n=pl(l))))):(c=a&~i,c!==0?n=pl(c):u!==0?n=pl(u):l||(l=a&~e,l!==0&&(n=pl(l)))),n===0?0:t!==0&&t!==n&&(t&i)===0&&(i=n&-n,l=t&-t,i>=l||i===32&&(l&4194048)!==0)?t:n}function Ta(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function wd(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function hs(){var e=zn;return zn<<=1,(zn&4194048)===0&&(zn=256),e}function ms(){var e=An;return An<<=1,(An&62914560)===0&&(An=4194304),e}function Qi(e){for(var t=[],l=0;31>l;l++)t.push(e);return t}function Ea(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function Hd(e,t,l,a,n,i){var u=e.pendingLanes;e.pendingLanes=l,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=l,e.entangledLanes&=l,e.errorRecoveryDisabledLanes&=l,e.shellSuspendCounter=0;var c=e.entanglements,r=e.expirationTimes,b=e.hiddenUpdates;for(l=u&~l;0<l;){var z=31-at(l),j=1<<z;c[z]=0,r[z]=-1;var x=b[z];if(x!==null)for(b[z]=null,z=0;z<x.length;z++){var S=x[z];S!==null&&(S.lane&=-536870913)}l&=~j}a!==0&&ps(e,a,0),i!==0&&n===0&&e.tag!==0&&(e.suspendedLanes|=i&~(u&~t))}function ps(e,t,l){e.pendingLanes|=t,e.suspendedLanes&=~t;var a=31-at(t);e.entangledLanes|=t,e.entanglements[a]=e.entanglements[a]|1073741824|l&4194090}function bs(e,t){var l=e.entangledLanes|=t;for(e=e.entanglements;l;){var a=31-at(l),n=1<<a;n&t|e[a]&t&&(e[a]|=t),l&=~n}}function Zi(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Vi(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function vs(){var e=U.p;return e!==0?e:(e=window.event,e===void 0?32:Io(e.type))}function Cd(e,t){var l=U.p;try{return U.p=e,t()}finally{U.p=l}}var Kt=Math.random().toString(36).slice(2),Ze="__reactFiber$"+Kt,$e="__reactProps$"+Kt,wl="__reactContainer$"+Kt,ki="__reactEvents$"+Kt,Yd="__reactListeners$"+Kt,Bd="__reactHandles$"+Kt,xs="__reactResources$"+Kt,za="__reactMarker$"+Kt;function Ki(e){delete e[Ze],delete e[$e],delete e[ki],delete e[Yd],delete e[Bd]}function Hl(e){var t=e[Ze];if(t)return t;for(var l=e.parentNode;l;){if(t=l[wl]||l[Ze]){if(l=t.alternate,t.child!==null||l!==null&&l.child!==null)for(e=Bo(e);e!==null;){if(l=e[Ze])return l;e=Bo(e)}return t}e=l,l=e.parentNode}return null}function Cl(e){if(e=e[Ze]||e[wl]){var t=e.tag;if(t===5||t===6||t===13||t===26||t===27||t===3)return e}return null}function Aa(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(f(33))}function Yl(e){var t=e[xs];return t||(t=e[xs]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function He(e){e[za]=!0}var ys=new Set,Ss={};function bl(e,t){Bl(e,t),Bl(e+"Capture",t)}function Bl(e,t){for(Ss[e]=t,e=0;e<t.length;e++)ys.add(t[e])}var qd=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Ts={},Es={};function Gd(e){return Gi.call(Es,e)?!0:Gi.call(Ts,e)?!1:qd.test(e)?Es[e]=!0:(Ts[e]=!0,!1)}function Nn(e,t,l){if(Gd(t))if(l===null)e.removeAttribute(t);else{switch(typeof l){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var a=t.toLowerCase().slice(0,5);if(a!=="data-"&&a!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,""+l)}}function On(e,t,l){if(l===null)e.removeAttribute(t);else{switch(typeof l){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,""+l)}}function _t(e,t,l,a){if(a===null)e.removeAttribute(l);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(l);return}e.setAttributeNS(t,l,""+a)}}var Ji,zs;function ql(e){if(Ji===void 0)try{throw Error()}catch(l){var t=l.stack.trim().match(/\n( *(at )?)/);Ji=t&&t[1]||"",zs=-1<l.stack.indexOf(`
    at`)?" (<anonymous>)":-1<l.stack.indexOf("@")?"@unknown:0:0":""}return`
`+Ji+e+zs}var $i=!1;function Wi(e,t){if(!e||$i)return"";$i=!0;var l=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var a={DetermineComponentFrameRoot:function(){try{if(t){var j=function(){throw Error()};if(Object.defineProperty(j.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(j,[])}catch(S){var x=S}Reflect.construct(e,[],j)}else{try{j.call()}catch(S){x=S}e.call(j.prototype)}}else{try{throw Error()}catch(S){x=S}(j=e())&&typeof j.catch=="function"&&j.catch(function(){})}}catch(S){if(S&&x&&typeof S.stack=="string")return[S.stack,x.stack]}return[null,null]}};a.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var n=Object.getOwnPropertyDescriptor(a.DetermineComponentFrameRoot,"name");n&&n.configurable&&Object.defineProperty(a.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var i=a.DetermineComponentFrameRoot(),u=i[0],c=i[1];if(u&&c){var r=u.split(`
`),b=c.split(`
`);for(n=a=0;a<r.length&&!r[a].includes("DetermineComponentFrameRoot");)a++;for(;n<b.length&&!b[n].includes("DetermineComponentFrameRoot");)n++;if(a===r.length||n===b.length)for(a=r.length-1,n=b.length-1;1<=a&&0<=n&&r[a]!==b[n];)n--;for(;1<=a&&0<=n;a--,n--)if(r[a]!==b[n]){if(a!==1||n!==1)do if(a--,n--,0>n||r[a]!==b[n]){var z=`
`+r[a].replace(" at new "," at ");return e.displayName&&z.includes("<anonymous>")&&(z=z.replace("<anonymous>",e.displayName)),z}while(1<=a&&0<=n);break}}}finally{$i=!1,Error.prepareStackTrace=l}return(l=e?e.displayName||e.name:"")?ql(l):""}function Ld(e){switch(e.tag){case 26:case 27:case 5:return ql(e.type);case 16:return ql("Lazy");case 13:return ql("Suspense");case 19:return ql("SuspenseList");case 0:case 15:return Wi(e.type,!1);case 11:return Wi(e.type.render,!1);case 1:return Wi(e.type,!0);case 31:return ql("Activity");default:return""}}function As(e){try{var t="";do t+=Ld(e),e=e.return;while(e);return t}catch(l){return`
Error generating stack: `+l.message+`
`+l.stack}}function dt(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function js(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Xd(e){var t=js(e)?"checked":"value",l=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),a=""+e[t];if(!e.hasOwnProperty(t)&&typeof l<"u"&&typeof l.get=="function"&&typeof l.set=="function"){var n=l.get,i=l.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return n.call(this)},set:function(u){a=""+u,i.call(this,u)}}),Object.defineProperty(e,t,{enumerable:l.enumerable}),{getValue:function(){return a},setValue:function(u){a=""+u},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Dn(e){e._valueTracker||(e._valueTracker=Xd(e))}function Ns(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var l=t.getValue(),a="";return e&&(a=js(e)?e.checked?"true":"false":e.value),e=a,e!==l?(t.setValue(e),!0):!1}function _n(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var Qd=/[\n"\\]/g;function gt(e){return e.replace(Qd,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function Fi(e,t,l,a,n,i,u,c){e.name="",u!=null&&typeof u!="function"&&typeof u!="symbol"&&typeof u!="boolean"?e.type=u:e.removeAttribute("type"),t!=null?u==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+dt(t)):e.value!==""+dt(t)&&(e.value=""+dt(t)):u!=="submit"&&u!=="reset"||e.removeAttribute("value"),t!=null?Pi(e,u,dt(t)):l!=null?Pi(e,u,dt(l)):a!=null&&e.removeAttribute("value"),n==null&&i!=null&&(e.defaultChecked=!!i),n!=null&&(e.checked=n&&typeof n!="function"&&typeof n!="symbol"),c!=null&&typeof c!="function"&&typeof c!="symbol"&&typeof c!="boolean"?e.name=""+dt(c):e.removeAttribute("name")}function Os(e,t,l,a,n,i,u,c){if(i!=null&&typeof i!="function"&&typeof i!="symbol"&&typeof i!="boolean"&&(e.type=i),t!=null||l!=null){if(!(i!=="submit"&&i!=="reset"||t!=null))return;l=l!=null?""+dt(l):"",t=t!=null?""+dt(t):l,c||t===e.value||(e.value=t),e.defaultValue=t}a=a??n,a=typeof a!="function"&&typeof a!="symbol"&&!!a,e.checked=c?e.checked:!!a,e.defaultChecked=!!a,u!=null&&typeof u!="function"&&typeof u!="symbol"&&typeof u!="boolean"&&(e.name=u)}function Pi(e,t,l){t==="number"&&_n(e.ownerDocument)===e||e.defaultValue===""+l||(e.defaultValue=""+l)}function Gl(e,t,l,a){if(e=e.options,t){t={};for(var n=0;n<l.length;n++)t["$"+l[n]]=!0;for(l=0;l<e.length;l++)n=t.hasOwnProperty("$"+e[l].value),e[l].selected!==n&&(e[l].selected=n),n&&a&&(e[l].defaultSelected=!0)}else{for(l=""+dt(l),t=null,n=0;n<e.length;n++){if(e[n].value===l){e[n].selected=!0,a&&(e[n].defaultSelected=!0);return}t!==null||e[n].disabled||(t=e[n])}t!==null&&(t.selected=!0)}}function Ds(e,t,l){if(t!=null&&(t=""+dt(t),t!==e.value&&(e.value=t),l==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=l!=null?""+dt(l):""}function _s(e,t,l,a){if(t==null){if(a!=null){if(l!=null)throw Error(f(92));if(R(a)){if(1<a.length)throw Error(f(93));a=a[0]}l=a}l==null&&(l=""),t=l}l=dt(t),e.defaultValue=l,a=e.textContent,a===l&&a!==""&&a!==null&&(e.value=a)}function Ll(e,t){if(t){var l=e.firstChild;if(l&&l===e.lastChild&&l.nodeType===3){l.nodeValue=t;return}}e.textContent=t}var Zd=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Us(e,t,l){var a=t.indexOf("--")===0;l==null||typeof l=="boolean"||l===""?a?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":a?e.setProperty(t,l):typeof l!="number"||l===0||Zd.has(t)?t==="float"?e.cssFloat=l:e[t]=(""+l).trim():e[t]=l+"px"}function Ms(e,t,l){if(t!=null&&typeof t!="object")throw Error(f(62));if(e=e.style,l!=null){for(var a in l)!l.hasOwnProperty(a)||t!=null&&t.hasOwnProperty(a)||(a.indexOf("--")===0?e.setProperty(a,""):a==="float"?e.cssFloat="":e[a]="");for(var n in t)a=t[n],t.hasOwnProperty(n)&&l[n]!==a&&Us(e,n,a)}else for(var i in t)t.hasOwnProperty(i)&&Us(e,i,t[i])}function Ii(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Vd=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),kd=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Un(e){return kd.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}var eu=null;function tu(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Xl=null,Ql=null;function Rs(e){var t=Cl(e);if(t&&(e=t.stateNode)){var l=e[$e]||null;e:switch(e=t.stateNode,t.type){case"input":if(Fi(e,l.value,l.defaultValue,l.defaultValue,l.checked,l.defaultChecked,l.type,l.name),t=l.name,l.type==="radio"&&t!=null){for(l=e;l.parentNode;)l=l.parentNode;for(l=l.querySelectorAll('input[name="'+gt(""+t)+'"][type="radio"]'),t=0;t<l.length;t++){var a=l[t];if(a!==e&&a.form===e.form){var n=a[$e]||null;if(!n)throw Error(f(90));Fi(a,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name)}}for(t=0;t<l.length;t++)a=l[t],a.form===e.form&&Ns(a)}break e;case"textarea":Ds(e,l.value,l.defaultValue);break e;case"select":t=l.value,t!=null&&Gl(e,!!l.multiple,t,!1)}}}var lu=!1;function ws(e,t,l){if(lu)return e(t,l);lu=!0;try{var a=e(t);return a}finally{if(lu=!1,(Xl!==null||Ql!==null)&&(pi(),Xl&&(t=Xl,e=Ql,Ql=Xl=null,Rs(t),e)))for(t=0;t<e.length;t++)Rs(e[t])}}function ja(e,t){var l=e.stateNode;if(l===null)return null;var a=l[$e]||null;if(a===null)return null;l=a[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(a=!a.disabled)||(e=e.type,a=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!a;break e;default:e=!1}if(e)return null;if(l&&typeof l!="function")throw Error(f(231,t,typeof l));return l}var Ut=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),au=!1;if(Ut)try{var Na={};Object.defineProperty(Na,"passive",{get:function(){au=!0}}),window.addEventListener("test",Na,Na),window.removeEventListener("test",Na,Na)}catch{au=!1}var Jt=null,nu=null,Mn=null;function Hs(){if(Mn)return Mn;var e,t=nu,l=t.length,a,n="value"in Jt?Jt.value:Jt.textContent,i=n.length;for(e=0;e<l&&t[e]===n[e];e++);var u=l-e;for(a=1;a<=u&&t[l-a]===n[i-a];a++);return Mn=n.slice(e,1<a?1-a:void 0)}function Rn(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function wn(){return!0}function Cs(){return!1}function We(e){function t(l,a,n,i,u){this._reactName=l,this._targetInst=n,this.type=a,this.nativeEvent=i,this.target=u,this.currentTarget=null;for(var c in e)e.hasOwnProperty(c)&&(l=e[c],this[c]=l?l(i):i[c]);return this.isDefaultPrevented=(i.defaultPrevented!=null?i.defaultPrevented:i.returnValue===!1)?wn:Cs,this.isPropagationStopped=Cs,this}return H(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var l=this.nativeEvent;l&&(l.preventDefault?l.preventDefault():typeof l.returnValue!="unknown"&&(l.returnValue=!1),this.isDefaultPrevented=wn)},stopPropagation:function(){var l=this.nativeEvent;l&&(l.stopPropagation?l.stopPropagation():typeof l.cancelBubble!="unknown"&&(l.cancelBubble=!0),this.isPropagationStopped=wn)},persist:function(){},isPersistent:wn}),t}var vl={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Hn=We(vl),Oa=H({},vl,{view:0,detail:0}),Kd=We(Oa),iu,uu,Da,Cn=H({},Oa,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:su,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Da&&(Da&&e.type==="mousemove"?(iu=e.screenX-Da.screenX,uu=e.screenY-Da.screenY):uu=iu=0,Da=e),iu)},movementY:function(e){return"movementY"in e?e.movementY:uu}}),Ys=We(Cn),Jd=H({},Cn,{dataTransfer:0}),$d=We(Jd),Wd=H({},Oa,{relatedTarget:0}),cu=We(Wd),Fd=H({},vl,{animationName:0,elapsedTime:0,pseudoElement:0}),Pd=We(Fd),Id=H({},vl,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),e0=We(Id),t0=H({},vl,{data:0}),Bs=We(t0),l0={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},a0={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},n0={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function i0(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=n0[e])?!!t[e]:!1}function su(){return i0}var u0=H({},Oa,{key:function(e){if(e.key){var t=l0[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Rn(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?a0[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:su,charCode:function(e){return e.type==="keypress"?Rn(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Rn(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),c0=We(u0),s0=H({},Cn,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),qs=We(s0),r0=H({},Oa,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:su}),f0=We(r0),o0=H({},vl,{propertyName:0,elapsedTime:0,pseudoElement:0}),d0=We(o0),g0=H({},Cn,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),h0=We(g0),m0=H({},vl,{newState:0,oldState:0}),p0=We(m0),b0=[9,13,27,32],ru=Ut&&"CompositionEvent"in window,_a=null;Ut&&"documentMode"in document&&(_a=document.documentMode);var v0=Ut&&"TextEvent"in window&&!_a,Gs=Ut&&(!ru||_a&&8<_a&&11>=_a),Ls=" ",Xs=!1;function Qs(e,t){switch(e){case"keyup":return b0.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Zs(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Zl=!1;function x0(e,t){switch(e){case"compositionend":return Zs(t);case"keypress":return t.which!==32?null:(Xs=!0,Ls);case"textInput":return e=t.data,e===Ls&&Xs?null:e;default:return null}}function y0(e,t){if(Zl)return e==="compositionend"||!ru&&Qs(e,t)?(e=Hs(),Mn=nu=Jt=null,Zl=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return Gs&&t.locale!=="ko"?null:t.data;default:return null}}var S0={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Vs(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!S0[e.type]:t==="textarea"}function ks(e,t,l,a){Xl?Ql?Ql.push(a):Ql=[a]:Xl=a,t=Ti(t,"onChange"),0<t.length&&(l=new Hn("onChange","change",null,l,a),e.push({event:l,listeners:t}))}var Ua=null,Ma=null;function T0(e){Oo(e,0)}function Yn(e){var t=Aa(e);if(Ns(t))return e}function Ks(e,t){if(e==="change")return t}var Js=!1;if(Ut){var fu;if(Ut){var ou="oninput"in document;if(!ou){var $s=document.createElement("div");$s.setAttribute("oninput","return;"),ou=typeof $s.oninput=="function"}fu=ou}else fu=!1;Js=fu&&(!document.documentMode||9<document.documentMode)}function Ws(){Ua&&(Ua.detachEvent("onpropertychange",Fs),Ma=Ua=null)}function Fs(e){if(e.propertyName==="value"&&Yn(Ma)){var t=[];ks(t,Ma,e,tu(e)),ws(T0,t)}}function E0(e,t,l){e==="focusin"?(Ws(),Ua=t,Ma=l,Ua.attachEvent("onpropertychange",Fs)):e==="focusout"&&Ws()}function z0(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return Yn(Ma)}function A0(e,t){if(e==="click")return Yn(t)}function j0(e,t){if(e==="input"||e==="change")return Yn(t)}function N0(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var nt=typeof Object.is=="function"?Object.is:N0;function Ra(e,t){if(nt(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var l=Object.keys(e),a=Object.keys(t);if(l.length!==a.length)return!1;for(a=0;a<l.length;a++){var n=l[a];if(!Gi.call(t,n)||!nt(e[n],t[n]))return!1}return!0}function Ps(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Is(e,t){var l=Ps(e);e=0;for(var a;l;){if(l.nodeType===3){if(a=e+l.textContent.length,e<=t&&a>=t)return{node:l,offset:t-e};e=a}e:{for(;l;){if(l.nextSibling){l=l.nextSibling;break e}l=l.parentNode}l=void 0}l=Ps(l)}}function er(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?er(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function tr(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=_n(e.document);t instanceof e.HTMLIFrameElement;){try{var l=typeof t.contentWindow.location.href=="string"}catch{l=!1}if(l)e=t.contentWindow;else break;t=_n(e.document)}return t}function du(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var O0=Ut&&"documentMode"in document&&11>=document.documentMode,Vl=null,gu=null,wa=null,hu=!1;function lr(e,t,l){var a=l.window===l?l.document:l.nodeType===9?l:l.ownerDocument;hu||Vl==null||Vl!==_n(a)||(a=Vl,"selectionStart"in a&&du(a)?a={start:a.selectionStart,end:a.selectionEnd}:(a=(a.ownerDocument&&a.ownerDocument.defaultView||window).getSelection(),a={anchorNode:a.anchorNode,anchorOffset:a.anchorOffset,focusNode:a.focusNode,focusOffset:a.focusOffset}),wa&&Ra(wa,a)||(wa=a,a=Ti(gu,"onSelect"),0<a.length&&(t=new Hn("onSelect","select",null,t,l),e.push({event:t,listeners:a}),t.target=Vl)))}function xl(e,t){var l={};return l[e.toLowerCase()]=t.toLowerCase(),l["Webkit"+e]="webkit"+t,l["Moz"+e]="moz"+t,l}var kl={animationend:xl("Animation","AnimationEnd"),animationiteration:xl("Animation","AnimationIteration"),animationstart:xl("Animation","AnimationStart"),transitionrun:xl("Transition","TransitionRun"),transitionstart:xl("Transition","TransitionStart"),transitioncancel:xl("Transition","TransitionCancel"),transitionend:xl("Transition","TransitionEnd")},mu={},ar={};Ut&&(ar=document.createElement("div").style,"AnimationEvent"in window||(delete kl.animationend.animation,delete kl.animationiteration.animation,delete kl.animationstart.animation),"TransitionEvent"in window||delete kl.transitionend.transition);function yl(e){if(mu[e])return mu[e];if(!kl[e])return e;var t=kl[e],l;for(l in t)if(t.hasOwnProperty(l)&&l in ar)return mu[e]=t[l];return e}var nr=yl("animationend"),ir=yl("animationiteration"),ur=yl("animationstart"),D0=yl("transitionrun"),_0=yl("transitionstart"),U0=yl("transitioncancel"),cr=yl("transitionend"),sr=new Map,pu="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");pu.push("scrollEnd");function St(e,t){sr.set(e,t),bl(t,[e])}var rr=new WeakMap;function ht(e,t){if(typeof e=="object"&&e!==null){var l=rr.get(e);return l!==void 0?l:(t={value:e,source:t,stack:As(t)},rr.set(e,t),t)}return{value:e,source:t,stack:As(t)}}var mt=[],Kl=0,bu=0;function Bn(){for(var e=Kl,t=bu=Kl=0;t<e;){var l=mt[t];mt[t++]=null;var a=mt[t];mt[t++]=null;var n=mt[t];mt[t++]=null;var i=mt[t];if(mt[t++]=null,a!==null&&n!==null){var u=a.pending;u===null?n.next=n:(n.next=u.next,u.next=n),a.pending=n}i!==0&&fr(l,n,i)}}function qn(e,t,l,a){mt[Kl++]=e,mt[Kl++]=t,mt[Kl++]=l,mt[Kl++]=a,bu|=a,e.lanes|=a,e=e.alternate,e!==null&&(e.lanes|=a)}function vu(e,t,l,a){return qn(e,t,l,a),Gn(e)}function Jl(e,t){return qn(e,null,null,t),Gn(e)}function fr(e,t,l){e.lanes|=l;var a=e.alternate;a!==null&&(a.lanes|=l);for(var n=!1,i=e.return;i!==null;)i.childLanes|=l,a=i.alternate,a!==null&&(a.childLanes|=l),i.tag===22&&(e=i.stateNode,e===null||e._visibility&1||(n=!0)),e=i,i=i.return;return e.tag===3?(i=e.stateNode,n&&t!==null&&(n=31-at(l),e=i.hiddenUpdates,a=e[n],a===null?e[n]=[t]:a.push(t),t.lane=l|536870912),i):null}function Gn(e){if(50<un)throw un=0,zc=null,Error(f(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var $l={};function M0(e,t,l,a){this.tag=e,this.key=l,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=a,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function it(e,t,l,a){return new M0(e,t,l,a)}function xu(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Mt(e,t){var l=e.alternate;return l===null?(l=it(e.tag,t,e.key,e.mode),l.elementType=e.elementType,l.type=e.type,l.stateNode=e.stateNode,l.alternate=e,e.alternate=l):(l.pendingProps=t,l.type=e.type,l.flags=0,l.subtreeFlags=0,l.deletions=null),l.flags=e.flags&65011712,l.childLanes=e.childLanes,l.lanes=e.lanes,l.child=e.child,l.memoizedProps=e.memoizedProps,l.memoizedState=e.memoizedState,l.updateQueue=e.updateQueue,t=e.dependencies,l.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},l.sibling=e.sibling,l.index=e.index,l.ref=e.ref,l.refCleanup=e.refCleanup,l}function or(e,t){e.flags&=65011714;var l=e.alternate;return l===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=l.childLanes,e.lanes=l.lanes,e.child=l.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=l.memoizedProps,e.memoizedState=l.memoizedState,e.updateQueue=l.updateQueue,e.type=l.type,t=l.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function Ln(e,t,l,a,n,i){var u=0;if(a=e,typeof e=="function")xu(e)&&(u=1);else if(typeof e=="string")u=wg(e,l,X.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(e){case he:return e=it(31,l,t,n),e.elementType=he,e.lanes=i,e;case K:return Sl(l.children,n,i,t);case ve:u=8,n|=24;break;case ce:return e=it(12,l,t,n|2),e.elementType=ce,e.lanes=i,e;case $:return e=it(13,l,t,n),e.elementType=$,e.lanes=i,e;case Ge:return e=it(19,l,t,n),e.elementType=Ge,e.lanes=i,e;default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case ot:case xe:u=10;break e;case et:u=9;break e;case qe:u=11;break e;case De:u=14;break e;case ae:u=16,a=null;break e}u=29,l=Error(f(130,e===null?"null":typeof e,"")),a=null}return t=it(u,l,t,n),t.elementType=e,t.type=a,t.lanes=i,t}function Sl(e,t,l,a){return e=it(7,e,a,t),e.lanes=l,e}function yu(e,t,l){return e=it(6,e,null,t),e.lanes=l,e}function Su(e,t,l){return t=it(4,e.children!==null?e.children:[],e.key,t),t.lanes=l,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Wl=[],Fl=0,Xn=null,Qn=0,pt=[],bt=0,Tl=null,Rt=1,wt="";function El(e,t){Wl[Fl++]=Qn,Wl[Fl++]=Xn,Xn=e,Qn=t}function dr(e,t,l){pt[bt++]=Rt,pt[bt++]=wt,pt[bt++]=Tl,Tl=e;var a=Rt;e=wt;var n=32-at(a)-1;a&=~(1<<n),l+=1;var i=32-at(t)+n;if(30<i){var u=n-n%5;i=(a&(1<<u)-1).toString(32),a>>=u,n-=u,Rt=1<<32-at(t)+n|l<<n|a,wt=i+e}else Rt=1<<i|l<<n|a,wt=e}function Tu(e){e.return!==null&&(El(e,1),dr(e,1,0))}function Eu(e){for(;e===Xn;)Xn=Wl[--Fl],Wl[Fl]=null,Qn=Wl[--Fl],Wl[Fl]=null;for(;e===Tl;)Tl=pt[--bt],pt[bt]=null,wt=pt[--bt],pt[bt]=null,Rt=pt[--bt],pt[bt]=null}var Ke=null,ze=null,ue=!1,zl=null,At=!1,zu=Error(f(519));function Al(e){var t=Error(f(418,""));throw Ya(ht(t,e)),zu}function gr(e){var t=e.stateNode,l=e.type,a=e.memoizedProps;switch(t[Ze]=e,t[$e]=a,l){case"dialog":ee("cancel",t),ee("close",t);break;case"iframe":case"object":case"embed":ee("load",t);break;case"video":case"audio":for(l=0;l<sn.length;l++)ee(sn[l],t);break;case"source":ee("error",t);break;case"img":case"image":case"link":ee("error",t),ee("load",t);break;case"details":ee("toggle",t);break;case"input":ee("invalid",t),Os(t,a.value,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name,!0),Dn(t);break;case"select":ee("invalid",t);break;case"textarea":ee("invalid",t),_s(t,a.value,a.defaultValue,a.children),Dn(t)}l=a.children,typeof l!="string"&&typeof l!="number"&&typeof l!="bigint"||t.textContent===""+l||a.suppressHydrationWarning===!0||Mo(t.textContent,l)?(a.popover!=null&&(ee("beforetoggle",t),ee("toggle",t)),a.onScroll!=null&&ee("scroll",t),a.onScrollEnd!=null&&ee("scrollend",t),a.onClick!=null&&(t.onclick=Ei),t=!0):t=!1,t||Al(e)}function hr(e){for(Ke=e.return;Ke;)switch(Ke.tag){case 5:case 13:At=!1;return;case 27:case 3:At=!0;return;default:Ke=Ke.return}}function Ha(e){if(e!==Ke)return!1;if(!ue)return hr(e),ue=!0,!1;var t=e.tag,l;if((l=t!==3&&t!==27)&&((l=t===5)&&(l=e.type,l=!(l!=="form"&&l!=="button")||Gc(e.type,e.memoizedProps)),l=!l),l&&ze&&Al(e),hr(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(f(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8)if(l=e.data,l==="/$"){if(t===0){ze=Et(e.nextSibling);break e}t--}else l!=="$"&&l!=="$!"&&l!=="$?"||t++;e=e.nextSibling}ze=null}}else t===27?(t=ze,fl(e.type)?(e=Zc,Zc=null,ze=e):ze=t):ze=Ke?Et(e.stateNode.nextSibling):null;return!0}function Ca(){ze=Ke=null,ue=!1}function mr(){var e=zl;return e!==null&&(Ie===null?Ie=e:Ie.push.apply(Ie,e),zl=null),e}function Ya(e){zl===null?zl=[e]:zl.push(e)}var Au=N(null),jl=null,Ht=null;function $t(e,t,l){w(Au,t._currentValue),t._currentValue=l}function Ct(e){e._currentValue=Au.current,B(Au)}function ju(e,t,l){for(;e!==null;){var a=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,a!==null&&(a.childLanes|=t)):a!==null&&(a.childLanes&t)!==t&&(a.childLanes|=t),e===l)break;e=e.return}}function Nu(e,t,l,a){var n=e.child;for(n!==null&&(n.return=e);n!==null;){var i=n.dependencies;if(i!==null){var u=n.child;i=i.firstContext;e:for(;i!==null;){var c=i;i=n;for(var r=0;r<t.length;r++)if(c.context===t[r]){i.lanes|=l,c=i.alternate,c!==null&&(c.lanes|=l),ju(i.return,l,e),a||(u=null);break e}i=c.next}}else if(n.tag===18){if(u=n.return,u===null)throw Error(f(341));u.lanes|=l,i=u.alternate,i!==null&&(i.lanes|=l),ju(u,l,e),u=null}else u=n.child;if(u!==null)u.return=n;else for(u=n;u!==null;){if(u===e){u=null;break}if(n=u.sibling,n!==null){n.return=u.return,u=n;break}u=u.return}n=u}}function Ba(e,t,l,a){e=null;for(var n=t,i=!1;n!==null;){if(!i){if((n.flags&524288)!==0)i=!0;else if((n.flags&262144)!==0)break}if(n.tag===10){var u=n.alternate;if(u===null)throw Error(f(387));if(u=u.memoizedProps,u!==null){var c=n.type;nt(n.pendingProps.value,u.value)||(e!==null?e.push(c):e=[c])}}else if(n===tt.current){if(u=n.alternate,u===null)throw Error(f(387));u.memoizedState.memoizedState!==n.memoizedState.memoizedState&&(e!==null?e.push(hn):e=[hn])}n=n.return}e!==null&&Nu(t,e,l,a),t.flags|=262144}function Zn(e){for(e=e.firstContext;e!==null;){if(!nt(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Nl(e){jl=e,Ht=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Ve(e){return pr(jl,e)}function Vn(e,t){return jl===null&&Nl(e),pr(e,t)}function pr(e,t){var l=t._currentValue;if(t={context:t,memoizedValue:l,next:null},Ht===null){if(e===null)throw Error(f(308));Ht=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Ht=Ht.next=t;return l}var R0=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(l,a){e.push(a)}};this.abort=function(){t.aborted=!0,e.forEach(function(l){return l()})}},w0=g.unstable_scheduleCallback,H0=g.unstable_NormalPriority,Re={$$typeof:xe,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Ou(){return{controller:new R0,data:new Map,refCount:0}}function qa(e){e.refCount--,e.refCount===0&&w0(H0,function(){e.controller.abort()})}var Ga=null,Du=0,Pl=0,Il=null;function C0(e,t){if(Ga===null){var l=Ga=[];Du=0,Pl=Uc(),Il={status:"pending",value:void 0,then:function(a){l.push(a)}}}return Du++,t.then(br,br),t}function br(){if(--Du===0&&Ga!==null){Il!==null&&(Il.status="fulfilled");var e=Ga;Ga=null,Pl=0,Il=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function Y0(e,t){var l=[],a={status:"pending",value:null,reason:null,then:function(n){l.push(n)}};return e.then(function(){a.status="fulfilled",a.value=t;for(var n=0;n<l.length;n++)(0,l[n])(t)},function(n){for(a.status="rejected",a.reason=n,n=0;n<l.length;n++)(0,l[n])(void 0)}),a}var vr=T.S;T.S=function(e,t){typeof t=="object"&&t!==null&&typeof t.then=="function"&&C0(e,t),vr!==null&&vr(e,t)};var Ol=N(null);function _u(){var e=Ol.current;return e!==null?e:be.pooledCache}function kn(e,t){t===null?w(Ol,Ol.current):w(Ol,t.pool)}function xr(){var e=_u();return e===null?null:{parent:Re._currentValue,pool:e}}var La=Error(f(460)),yr=Error(f(474)),Kn=Error(f(542)),Uu={then:function(){}};function Sr(e){return e=e.status,e==="fulfilled"||e==="rejected"}function Jn(){}function Tr(e,t,l){switch(l=e[l],l===void 0?e.push(t):l!==t&&(t.then(Jn,Jn),t=l),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,zr(e),e;default:if(typeof t.status=="string")t.then(Jn,Jn);else{if(e=be,e!==null&&100<e.shellSuspendCounter)throw Error(f(482));e=t,e.status="pending",e.then(function(a){if(t.status==="pending"){var n=t;n.status="fulfilled",n.value=a}},function(a){if(t.status==="pending"){var n=t;n.status="rejected",n.reason=a}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,zr(e),e}throw Xa=t,La}}var Xa=null;function Er(){if(Xa===null)throw Error(f(459));var e=Xa;return Xa=null,e}function zr(e){if(e===La||e===Kn)throw Error(f(483))}var Wt=!1;function Mu(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Ru(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Ft(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Pt(e,t,l){var a=e.updateQueue;if(a===null)return null;if(a=a.shared,(se&2)!==0){var n=a.pending;return n===null?t.next=t:(t.next=n.next,n.next=t),a.pending=t,t=Gn(e),fr(e,null,l),t}return qn(e,a,t,l),Gn(e)}function Qa(e,t,l){if(t=t.updateQueue,t!==null&&(t=t.shared,(l&4194048)!==0)){var a=t.lanes;a&=e.pendingLanes,l|=a,t.lanes=l,bs(e,l)}}function wu(e,t){var l=e.updateQueue,a=e.alternate;if(a!==null&&(a=a.updateQueue,l===a)){var n=null,i=null;if(l=l.firstBaseUpdate,l!==null){do{var u={lane:l.lane,tag:l.tag,payload:l.payload,callback:null,next:null};i===null?n=i=u:i=i.next=u,l=l.next}while(l!==null);i===null?n=i=t:i=i.next=t}else n=i=t;l={baseState:a.baseState,firstBaseUpdate:n,lastBaseUpdate:i,shared:a.shared,callbacks:a.callbacks},e.updateQueue=l;return}e=l.lastBaseUpdate,e===null?l.firstBaseUpdate=t:e.next=t,l.lastBaseUpdate=t}var Hu=!1;function Za(){if(Hu){var e=Il;if(e!==null)throw e}}function Va(e,t,l,a){Hu=!1;var n=e.updateQueue;Wt=!1;var i=n.firstBaseUpdate,u=n.lastBaseUpdate,c=n.shared.pending;if(c!==null){n.shared.pending=null;var r=c,b=r.next;r.next=null,u===null?i=b:u.next=b,u=r;var z=e.alternate;z!==null&&(z=z.updateQueue,c=z.lastBaseUpdate,c!==u&&(c===null?z.firstBaseUpdate=b:c.next=b,z.lastBaseUpdate=r))}if(i!==null){var j=n.baseState;u=0,z=b=r=null,c=i;do{var x=c.lane&-536870913,S=x!==c.lane;if(S?(le&x)===x:(a&x)===x){x!==0&&x===Pl&&(Hu=!0),z!==null&&(z=z.next={lane:0,tag:c.tag,payload:c.payload,callback:null,next:null});e:{var V=e,Q=c;x=t;var de=l;switch(Q.tag){case 1:if(V=Q.payload,typeof V=="function"){j=V.call(de,j,x);break e}j=V;break e;case 3:V.flags=V.flags&-65537|128;case 0:if(V=Q.payload,x=typeof V=="function"?V.call(de,j,x):V,x==null)break e;j=H({},j,x);break e;case 2:Wt=!0}}x=c.callback,x!==null&&(e.flags|=64,S&&(e.flags|=8192),S=n.callbacks,S===null?n.callbacks=[x]:S.push(x))}else S={lane:x,tag:c.tag,payload:c.payload,callback:c.callback,next:null},z===null?(b=z=S,r=j):z=z.next=S,u|=x;if(c=c.next,c===null){if(c=n.shared.pending,c===null)break;S=c,c=S.next,S.next=null,n.lastBaseUpdate=S,n.shared.pending=null}}while(!0);z===null&&(r=j),n.baseState=r,n.firstBaseUpdate=b,n.lastBaseUpdate=z,i===null&&(n.shared.lanes=0),ul|=u,e.lanes=u,e.memoizedState=j}}function Ar(e,t){if(typeof e!="function")throw Error(f(191,e));e.call(t)}function jr(e,t){var l=e.callbacks;if(l!==null)for(e.callbacks=null,e=0;e<l.length;e++)Ar(l[e],t)}var ea=N(null),$n=N(0);function Nr(e,t){e=Qt,w($n,e),w(ea,t),Qt=e|t.baseLanes}function Cu(){w($n,Qt),w(ea,ea.current)}function Yu(){Qt=$n.current,B(ea),B($n)}var It=0,W=null,fe=null,_e=null,Wn=!1,ta=!1,Dl=!1,Fn=0,ka=0,la=null,B0=0;function Ne(){throw Error(f(321))}function Bu(e,t){if(t===null)return!1;for(var l=0;l<t.length&&l<e.length;l++)if(!nt(e[l],t[l]))return!1;return!0}function qu(e,t,l,a,n,i){return It=i,W=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,T.H=e===null||e.memoizedState===null?of:df,Dl=!1,i=l(a,n),Dl=!1,ta&&(i=Dr(t,l,a,n)),Or(e),i}function Or(e){T.H=ai;var t=fe!==null&&fe.next!==null;if(It=0,_e=fe=W=null,Wn=!1,ka=0,la=null,t)throw Error(f(300));e===null||Ce||(e=e.dependencies,e!==null&&Zn(e)&&(Ce=!0))}function Dr(e,t,l,a){W=e;var n=0;do{if(ta&&(la=null),ka=0,ta=!1,25<=n)throw Error(f(301));if(n+=1,_e=fe=null,e.updateQueue!=null){var i=e.updateQueue;i.lastEffect=null,i.events=null,i.stores=null,i.memoCache!=null&&(i.memoCache.index=0)}T.H=V0,i=t(l,a)}while(ta);return i}function q0(){var e=T.H,t=e.useState()[0];return t=typeof t.then=="function"?Ka(t):t,e=e.useState()[0],(fe!==null?fe.memoizedState:null)!==e&&(W.flags|=1024),t}function Gu(){var e=Fn!==0;return Fn=0,e}function Lu(e,t,l){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~l}function Xu(e){if(Wn){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Wn=!1}It=0,_e=fe=W=null,ta=!1,ka=Fn=0,la=null}function Fe(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return _e===null?W.memoizedState=_e=e:_e=_e.next=e,_e}function Ue(){if(fe===null){var e=W.alternate;e=e!==null?e.memoizedState:null}else e=fe.next;var t=_e===null?W.memoizedState:_e.next;if(t!==null)_e=t,fe=e;else{if(e===null)throw W.alternate===null?Error(f(467)):Error(f(310));fe=e,e={memoizedState:fe.memoizedState,baseState:fe.baseState,baseQueue:fe.baseQueue,queue:fe.queue,next:null},_e===null?W.memoizedState=_e=e:_e=_e.next=e}return _e}function Qu(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function Ka(e){var t=ka;return ka+=1,la===null&&(la=[]),e=Tr(la,e,t),t=W,(_e===null?t.memoizedState:_e.next)===null&&(t=t.alternate,T.H=t===null||t.memoizedState===null?of:df),e}function Pn(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return Ka(e);if(e.$$typeof===xe)return Ve(e)}throw Error(f(438,String(e)))}function Zu(e){var t=null,l=W.updateQueue;if(l!==null&&(t=l.memoCache),t==null){var a=W.alternate;a!==null&&(a=a.updateQueue,a!==null&&(a=a.memoCache,a!=null&&(t={data:a.data.map(function(n){return n.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),l===null&&(l=Qu(),W.updateQueue=l),l.memoCache=t,l=t.data[t.index],l===void 0)for(l=t.data[t.index]=Array(e),a=0;a<e;a++)l[a]=Me;return t.index++,l}function Yt(e,t){return typeof t=="function"?t(e):t}function In(e){var t=Ue();return Vu(t,fe,e)}function Vu(e,t,l){var a=e.queue;if(a===null)throw Error(f(311));a.lastRenderedReducer=l;var n=e.baseQueue,i=a.pending;if(i!==null){if(n!==null){var u=n.next;n.next=i.next,i.next=u}t.baseQueue=n=i,a.pending=null}if(i=e.baseState,n===null)e.memoizedState=i;else{t=n.next;var c=u=null,r=null,b=t,z=!1;do{var j=b.lane&-536870913;if(j!==b.lane?(le&j)===j:(It&j)===j){var x=b.revertLane;if(x===0)r!==null&&(r=r.next={lane:0,revertLane:0,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null}),j===Pl&&(z=!0);else if((It&x)===x){b=b.next,x===Pl&&(z=!0);continue}else j={lane:0,revertLane:b.revertLane,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null},r===null?(c=r=j,u=i):r=r.next=j,W.lanes|=x,ul|=x;j=b.action,Dl&&l(i,j),i=b.hasEagerState?b.eagerState:l(i,j)}else x={lane:j,revertLane:b.revertLane,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null},r===null?(c=r=x,u=i):r=r.next=x,W.lanes|=j,ul|=j;b=b.next}while(b!==null&&b!==t);if(r===null?u=i:r.next=c,!nt(i,e.memoizedState)&&(Ce=!0,z&&(l=Il,l!==null)))throw l;e.memoizedState=i,e.baseState=u,e.baseQueue=r,a.lastRenderedState=i}return n===null&&(a.lanes=0),[e.memoizedState,a.dispatch]}function ku(e){var t=Ue(),l=t.queue;if(l===null)throw Error(f(311));l.lastRenderedReducer=e;var a=l.dispatch,n=l.pending,i=t.memoizedState;if(n!==null){l.pending=null;var u=n=n.next;do i=e(i,u.action),u=u.next;while(u!==n);nt(i,t.memoizedState)||(Ce=!0),t.memoizedState=i,t.baseQueue===null&&(t.baseState=i),l.lastRenderedState=i}return[i,a]}function _r(e,t,l){var a=W,n=Ue(),i=ue;if(i){if(l===void 0)throw Error(f(407));l=l()}else l=t();var u=!nt((fe||n).memoizedState,l);u&&(n.memoizedState=l,Ce=!0),n=n.queue;var c=Rr.bind(null,a,n,e);if(Ja(2048,8,c,[e]),n.getSnapshot!==t||u||_e!==null&&_e.memoizedState.tag&1){if(a.flags|=2048,aa(9,ei(),Mr.bind(null,a,n,l,t),null),be===null)throw Error(f(349));i||(It&124)!==0||Ur(a,t,l)}return l}function Ur(e,t,l){e.flags|=16384,e={getSnapshot:t,value:l},t=W.updateQueue,t===null?(t=Qu(),W.updateQueue=t,t.stores=[e]):(l=t.stores,l===null?t.stores=[e]:l.push(e))}function Mr(e,t,l,a){t.value=l,t.getSnapshot=a,wr(t)&&Hr(e)}function Rr(e,t,l){return l(function(){wr(t)&&Hr(e)})}function wr(e){var t=e.getSnapshot;e=e.value;try{var l=t();return!nt(e,l)}catch{return!0}}function Hr(e){var t=Jl(e,2);t!==null&&ft(t,e,2)}function Ku(e){var t=Fe();if(typeof e=="function"){var l=e;if(e=l(),Dl){kt(!0);try{l()}finally{kt(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Yt,lastRenderedState:e},t}function Cr(e,t,l,a){return e.baseState=l,Vu(e,fe,typeof a=="function"?a:Yt)}function G0(e,t,l,a,n){if(li(e))throw Error(f(485));if(e=t.action,e!==null){var i={payload:n,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(u){i.listeners.push(u)}};T.T!==null?l(!0):i.isTransition=!1,a(i),l=t.pending,l===null?(i.next=t.pending=i,Yr(t,i)):(i.next=l.next,t.pending=l.next=i)}}function Yr(e,t){var l=t.action,a=t.payload,n=e.state;if(t.isTransition){var i=T.T,u={};T.T=u;try{var c=l(n,a),r=T.S;r!==null&&r(u,c),Br(e,t,c)}catch(b){Ju(e,t,b)}finally{T.T=i}}else try{i=l(n,a),Br(e,t,i)}catch(b){Ju(e,t,b)}}function Br(e,t,l){l!==null&&typeof l=="object"&&typeof l.then=="function"?l.then(function(a){qr(e,t,a)},function(a){return Ju(e,t,a)}):qr(e,t,l)}function qr(e,t,l){t.status="fulfilled",t.value=l,Gr(t),e.state=l,t=e.pending,t!==null&&(l=t.next,l===t?e.pending=null:(l=l.next,t.next=l,Yr(e,l)))}function Ju(e,t,l){var a=e.pending;if(e.pending=null,a!==null){a=a.next;do t.status="rejected",t.reason=l,Gr(t),t=t.next;while(t!==a)}e.action=null}function Gr(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function Lr(e,t){return t}function Xr(e,t){if(ue){var l=be.formState;if(l!==null){e:{var a=W;if(ue){if(ze){t:{for(var n=ze,i=At;n.nodeType!==8;){if(!i){n=null;break t}if(n=Et(n.nextSibling),n===null){n=null;break t}}i=n.data,n=i==="F!"||i==="F"?n:null}if(n){ze=Et(n.nextSibling),a=n.data==="F!";break e}}Al(a)}a=!1}a&&(t=l[0])}}return l=Fe(),l.memoizedState=l.baseState=t,a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Lr,lastRenderedState:t},l.queue=a,l=sf.bind(null,W,a),a.dispatch=l,a=Ku(!1),i=Iu.bind(null,W,!1,a.queue),a=Fe(),n={state:t,dispatch:null,action:e,pending:null},a.queue=n,l=G0.bind(null,W,n,i,l),n.dispatch=l,a.memoizedState=e,[t,l,!1]}function Qr(e){var t=Ue();return Zr(t,fe,e)}function Zr(e,t,l){if(t=Vu(e,t,Lr)[0],e=In(Yt)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var a=Ka(t)}catch(u){throw u===La?Kn:u}else a=t;t=Ue();var n=t.queue,i=n.dispatch;return l!==t.memoizedState&&(W.flags|=2048,aa(9,ei(),L0.bind(null,n,l),null)),[a,i,e]}function L0(e,t){e.action=t}function Vr(e){var t=Ue(),l=fe;if(l!==null)return Zr(t,l,e);Ue(),t=t.memoizedState,l=Ue();var a=l.queue.dispatch;return l.memoizedState=e,[t,a,!1]}function aa(e,t,l,a){return e={tag:e,create:l,deps:a,inst:t,next:null},t=W.updateQueue,t===null&&(t=Qu(),W.updateQueue=t),l=t.lastEffect,l===null?t.lastEffect=e.next=e:(a=l.next,l.next=e,e.next=a,t.lastEffect=e),e}function ei(){return{destroy:void 0,resource:void 0}}function kr(){return Ue().memoizedState}function ti(e,t,l,a){var n=Fe();a=a===void 0?null:a,W.flags|=e,n.memoizedState=aa(1|t,ei(),l,a)}function Ja(e,t,l,a){var n=Ue();a=a===void 0?null:a;var i=n.memoizedState.inst;fe!==null&&a!==null&&Bu(a,fe.memoizedState.deps)?n.memoizedState=aa(t,i,l,a):(W.flags|=e,n.memoizedState=aa(1|t,i,l,a))}function Kr(e,t){ti(8390656,8,e,t)}function Jr(e,t){Ja(2048,8,e,t)}function $r(e,t){return Ja(4,2,e,t)}function Wr(e,t){return Ja(4,4,e,t)}function Fr(e,t){if(typeof t=="function"){e=e();var l=t(e);return function(){typeof l=="function"?l():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Pr(e,t,l){l=l!=null?l.concat([e]):null,Ja(4,4,Fr.bind(null,t,e),l)}function $u(){}function Ir(e,t){var l=Ue();t=t===void 0?null:t;var a=l.memoizedState;return t!==null&&Bu(t,a[1])?a[0]:(l.memoizedState=[e,t],e)}function ef(e,t){var l=Ue();t=t===void 0?null:t;var a=l.memoizedState;if(t!==null&&Bu(t,a[1]))return a[0];if(a=e(),Dl){kt(!0);try{e()}finally{kt(!1)}}return l.memoizedState=[a,t],a}function Wu(e,t,l){return l===void 0||(It&1073741824)!==0?e.memoizedState=t:(e.memoizedState=l,e=no(),W.lanes|=e,ul|=e,l)}function tf(e,t,l,a){return nt(l,t)?l:ea.current!==null?(e=Wu(e,l,a),nt(e,t)||(Ce=!0),e):(It&42)===0?(Ce=!0,e.memoizedState=l):(e=no(),W.lanes|=e,ul|=e,t)}function lf(e,t,l,a,n){var i=U.p;U.p=i!==0&&8>i?i:8;var u=T.T,c={};T.T=c,Iu(e,!1,t,l);try{var r=n(),b=T.S;if(b!==null&&b(c,r),r!==null&&typeof r=="object"&&typeof r.then=="function"){var z=Y0(r,a);$a(e,t,z,rt(e))}else $a(e,t,a,rt(e))}catch(j){$a(e,t,{then:function(){},status:"rejected",reason:j},rt())}finally{U.p=i,T.T=u}}function X0(){}function Fu(e,t,l,a){if(e.tag!==5)throw Error(f(476));var n=af(e).queue;lf(e,n,t,L,l===null?X0:function(){return nf(e),l(a)})}function af(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:L,baseState:L,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Yt,lastRenderedState:L},next:null};var l={};return t.next={memoizedState:l,baseState:l,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Yt,lastRenderedState:l},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function nf(e){var t=af(e).next.queue;$a(e,t,{},rt())}function Pu(){return Ve(hn)}function uf(){return Ue().memoizedState}function cf(){return Ue().memoizedState}function Q0(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var l=rt();e=Ft(l);var a=Pt(t,e,l);a!==null&&(ft(a,t,l),Qa(a,t,l)),t={cache:Ou()},e.payload=t;return}t=t.return}}function Z0(e,t,l){var a=rt();l={lane:a,revertLane:0,action:l,hasEagerState:!1,eagerState:null,next:null},li(e)?rf(t,l):(l=vu(e,t,l,a),l!==null&&(ft(l,e,a),ff(l,t,a)))}function sf(e,t,l){var a=rt();$a(e,t,l,a)}function $a(e,t,l,a){var n={lane:a,revertLane:0,action:l,hasEagerState:!1,eagerState:null,next:null};if(li(e))rf(t,n);else{var i=e.alternate;if(e.lanes===0&&(i===null||i.lanes===0)&&(i=t.lastRenderedReducer,i!==null))try{var u=t.lastRenderedState,c=i(u,l);if(n.hasEagerState=!0,n.eagerState=c,nt(c,u))return qn(e,t,n,0),be===null&&Bn(),!1}catch{}finally{}if(l=vu(e,t,n,a),l!==null)return ft(l,e,a),ff(l,t,a),!0}return!1}function Iu(e,t,l,a){if(a={lane:2,revertLane:Uc(),action:a,hasEagerState:!1,eagerState:null,next:null},li(e)){if(t)throw Error(f(479))}else t=vu(e,l,a,2),t!==null&&ft(t,e,2)}function li(e){var t=e.alternate;return e===W||t!==null&&t===W}function rf(e,t){ta=Wn=!0;var l=e.pending;l===null?t.next=t:(t.next=l.next,l.next=t),e.pending=t}function ff(e,t,l){if((l&4194048)!==0){var a=t.lanes;a&=e.pendingLanes,l|=a,t.lanes=l,bs(e,l)}}var ai={readContext:Ve,use:Pn,useCallback:Ne,useContext:Ne,useEffect:Ne,useImperativeHandle:Ne,useLayoutEffect:Ne,useInsertionEffect:Ne,useMemo:Ne,useReducer:Ne,useRef:Ne,useState:Ne,useDebugValue:Ne,useDeferredValue:Ne,useTransition:Ne,useSyncExternalStore:Ne,useId:Ne,useHostTransitionStatus:Ne,useFormState:Ne,useActionState:Ne,useOptimistic:Ne,useMemoCache:Ne,useCacheRefresh:Ne},of={readContext:Ve,use:Pn,useCallback:function(e,t){return Fe().memoizedState=[e,t===void 0?null:t],e},useContext:Ve,useEffect:Kr,useImperativeHandle:function(e,t,l){l=l!=null?l.concat([e]):null,ti(4194308,4,Fr.bind(null,t,e),l)},useLayoutEffect:function(e,t){return ti(4194308,4,e,t)},useInsertionEffect:function(e,t){ti(4,2,e,t)},useMemo:function(e,t){var l=Fe();t=t===void 0?null:t;var a=e();if(Dl){kt(!0);try{e()}finally{kt(!1)}}return l.memoizedState=[a,t],a},useReducer:function(e,t,l){var a=Fe();if(l!==void 0){var n=l(t);if(Dl){kt(!0);try{l(t)}finally{kt(!1)}}}else n=t;return a.memoizedState=a.baseState=n,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:n},a.queue=e,e=e.dispatch=Z0.bind(null,W,e),[a.memoizedState,e]},useRef:function(e){var t=Fe();return e={current:e},t.memoizedState=e},useState:function(e){e=Ku(e);var t=e.queue,l=sf.bind(null,W,t);return t.dispatch=l,[e.memoizedState,l]},useDebugValue:$u,useDeferredValue:function(e,t){var l=Fe();return Wu(l,e,t)},useTransition:function(){var e=Ku(!1);return e=lf.bind(null,W,e.queue,!0,!1),Fe().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,l){var a=W,n=Fe();if(ue){if(l===void 0)throw Error(f(407));l=l()}else{if(l=t(),be===null)throw Error(f(349));(le&124)!==0||Ur(a,t,l)}n.memoizedState=l;var i={value:l,getSnapshot:t};return n.queue=i,Kr(Rr.bind(null,a,i,e),[e]),a.flags|=2048,aa(9,ei(),Mr.bind(null,a,i,l,t),null),l},useId:function(){var e=Fe(),t=be.identifierPrefix;if(ue){var l=wt,a=Rt;l=(a&~(1<<32-at(a)-1)).toString(32)+l,t="«"+t+"R"+l,l=Fn++,0<l&&(t+="H"+l.toString(32)),t+="»"}else l=B0++,t="«"+t+"r"+l.toString(32)+"»";return e.memoizedState=t},useHostTransitionStatus:Pu,useFormState:Xr,useActionState:Xr,useOptimistic:function(e){var t=Fe();t.memoizedState=t.baseState=e;var l={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=l,t=Iu.bind(null,W,!0,l),l.dispatch=t,[e,t]},useMemoCache:Zu,useCacheRefresh:function(){return Fe().memoizedState=Q0.bind(null,W)}},df={readContext:Ve,use:Pn,useCallback:Ir,useContext:Ve,useEffect:Jr,useImperativeHandle:Pr,useInsertionEffect:$r,useLayoutEffect:Wr,useMemo:ef,useReducer:In,useRef:kr,useState:function(){return In(Yt)},useDebugValue:$u,useDeferredValue:function(e,t){var l=Ue();return tf(l,fe.memoizedState,e,t)},useTransition:function(){var e=In(Yt)[0],t=Ue().memoizedState;return[typeof e=="boolean"?e:Ka(e),t]},useSyncExternalStore:_r,useId:uf,useHostTransitionStatus:Pu,useFormState:Qr,useActionState:Qr,useOptimistic:function(e,t){var l=Ue();return Cr(l,fe,e,t)},useMemoCache:Zu,useCacheRefresh:cf},V0={readContext:Ve,use:Pn,useCallback:Ir,useContext:Ve,useEffect:Jr,useImperativeHandle:Pr,useInsertionEffect:$r,useLayoutEffect:Wr,useMemo:ef,useReducer:ku,useRef:kr,useState:function(){return ku(Yt)},useDebugValue:$u,useDeferredValue:function(e,t){var l=Ue();return fe===null?Wu(l,e,t):tf(l,fe.memoizedState,e,t)},useTransition:function(){var e=ku(Yt)[0],t=Ue().memoizedState;return[typeof e=="boolean"?e:Ka(e),t]},useSyncExternalStore:_r,useId:uf,useHostTransitionStatus:Pu,useFormState:Vr,useActionState:Vr,useOptimistic:function(e,t){var l=Ue();return fe!==null?Cr(l,fe,e,t):(l.baseState=e,[e,l.queue.dispatch])},useMemoCache:Zu,useCacheRefresh:cf},na=null,Wa=0;function ni(e){var t=Wa;return Wa+=1,na===null&&(na=[]),Tr(na,e,t)}function Fa(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function ii(e,t){throw t.$$typeof===_?Error(f(525)):(e=Object.prototype.toString.call(t),Error(f(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function gf(e){var t=e._init;return t(e._payload)}function hf(e){function t(h,d){if(e){var p=h.deletions;p===null?(h.deletions=[d],h.flags|=16):p.push(d)}}function l(h,d){if(!e)return null;for(;d!==null;)t(h,d),d=d.sibling;return null}function a(h){for(var d=new Map;h!==null;)h.key!==null?d.set(h.key,h):d.set(h.index,h),h=h.sibling;return d}function n(h,d){return h=Mt(h,d),h.index=0,h.sibling=null,h}function i(h,d,p){return h.index=p,e?(p=h.alternate,p!==null?(p=p.index,p<d?(h.flags|=67108866,d):p):(h.flags|=67108866,d)):(h.flags|=1048576,d)}function u(h){return e&&h.alternate===null&&(h.flags|=67108866),h}function c(h,d,p,A){return d===null||d.tag!==6?(d=yu(p,h.mode,A),d.return=h,d):(d=n(d,p),d.return=h,d)}function r(h,d,p,A){var q=p.type;return q===K?z(h,d,p.props.children,A,p.key):d!==null&&(d.elementType===q||typeof q=="object"&&q!==null&&q.$$typeof===ae&&gf(q)===d.type)?(d=n(d,p.props),Fa(d,p),d.return=h,d):(d=Ln(p.type,p.key,p.props,null,h.mode,A),Fa(d,p),d.return=h,d)}function b(h,d,p,A){return d===null||d.tag!==4||d.stateNode.containerInfo!==p.containerInfo||d.stateNode.implementation!==p.implementation?(d=Su(p,h.mode,A),d.return=h,d):(d=n(d,p.children||[]),d.return=h,d)}function z(h,d,p,A,q){return d===null||d.tag!==7?(d=Sl(p,h.mode,A,q),d.return=h,d):(d=n(d,p),d.return=h,d)}function j(h,d,p){if(typeof d=="string"&&d!==""||typeof d=="number"||typeof d=="bigint")return d=yu(""+d,h.mode,p),d.return=h,d;if(typeof d=="object"&&d!==null){switch(d.$$typeof){case M:return p=Ln(d.type,d.key,d.props,null,h.mode,p),Fa(p,d),p.return=h,p;case F:return d=Su(d,h.mode,p),d.return=h,d;case ae:var A=d._init;return d=A(d._payload),j(h,d,p)}if(R(d)||me(d))return d=Sl(d,h.mode,p,null),d.return=h,d;if(typeof d.then=="function")return j(h,ni(d),p);if(d.$$typeof===xe)return j(h,Vn(h,d),p);ii(h,d)}return null}function x(h,d,p,A){var q=d!==null?d.key:null;if(typeof p=="string"&&p!==""||typeof p=="number"||typeof p=="bigint")return q!==null?null:c(h,d,""+p,A);if(typeof p=="object"&&p!==null){switch(p.$$typeof){case M:return p.key===q?r(h,d,p,A):null;case F:return p.key===q?b(h,d,p,A):null;case ae:return q=p._init,p=q(p._payload),x(h,d,p,A)}if(R(p)||me(p))return q!==null?null:z(h,d,p,A,null);if(typeof p.then=="function")return x(h,d,ni(p),A);if(p.$$typeof===xe)return x(h,d,Vn(h,p),A);ii(h,p)}return null}function S(h,d,p,A,q){if(typeof A=="string"&&A!==""||typeof A=="number"||typeof A=="bigint")return h=h.get(p)||null,c(d,h,""+A,q);if(typeof A=="object"&&A!==null){switch(A.$$typeof){case M:return h=h.get(A.key===null?p:A.key)||null,r(d,h,A,q);case F:return h=h.get(A.key===null?p:A.key)||null,b(d,h,A,q);case ae:var P=A._init;return A=P(A._payload),S(h,d,p,A,q)}if(R(A)||me(A))return h=h.get(p)||null,z(d,h,A,q,null);if(typeof A.then=="function")return S(h,d,p,ni(A),q);if(A.$$typeof===xe)return S(h,d,p,Vn(d,A),q);ii(d,A)}return null}function V(h,d,p,A){for(var q=null,P=null,G=d,Z=d=0,Be=null;G!==null&&Z<p.length;Z++){G.index>Z?(Be=G,G=null):Be=G.sibling;var ie=x(h,G,p[Z],A);if(ie===null){G===null&&(G=Be);break}e&&G&&ie.alternate===null&&t(h,G),d=i(ie,d,Z),P===null?q=ie:P.sibling=ie,P=ie,G=Be}if(Z===p.length)return l(h,G),ue&&El(h,Z),q;if(G===null){for(;Z<p.length;Z++)G=j(h,p[Z],A),G!==null&&(d=i(G,d,Z),P===null?q=G:P.sibling=G,P=G);return ue&&El(h,Z),q}for(G=a(G);Z<p.length;Z++)Be=S(G,h,Z,p[Z],A),Be!==null&&(e&&Be.alternate!==null&&G.delete(Be.key===null?Z:Be.key),d=i(Be,d,Z),P===null?q=Be:P.sibling=Be,P=Be);return e&&G.forEach(function(ml){return t(h,ml)}),ue&&El(h,Z),q}function Q(h,d,p,A){if(p==null)throw Error(f(151));for(var q=null,P=null,G=d,Z=d=0,Be=null,ie=p.next();G!==null&&!ie.done;Z++,ie=p.next()){G.index>Z?(Be=G,G=null):Be=G.sibling;var ml=x(h,G,ie.value,A);if(ml===null){G===null&&(G=Be);break}e&&G&&ml.alternate===null&&t(h,G),d=i(ml,d,Z),P===null?q=ml:P.sibling=ml,P=ml,G=Be}if(ie.done)return l(h,G),ue&&El(h,Z),q;if(G===null){for(;!ie.done;Z++,ie=p.next())ie=j(h,ie.value,A),ie!==null&&(d=i(ie,d,Z),P===null?q=ie:P.sibling=ie,P=ie);return ue&&El(h,Z),q}for(G=a(G);!ie.done;Z++,ie=p.next())ie=S(G,h,Z,ie.value,A),ie!==null&&(e&&ie.alternate!==null&&G.delete(ie.key===null?Z:ie.key),d=i(ie,d,Z),P===null?q=ie:P.sibling=ie,P=ie);return e&&G.forEach(function(kg){return t(h,kg)}),ue&&El(h,Z),q}function de(h,d,p,A){if(typeof p=="object"&&p!==null&&p.type===K&&p.key===null&&(p=p.props.children),typeof p=="object"&&p!==null){switch(p.$$typeof){case M:e:{for(var q=p.key;d!==null;){if(d.key===q){if(q=p.type,q===K){if(d.tag===7){l(h,d.sibling),A=n(d,p.props.children),A.return=h,h=A;break e}}else if(d.elementType===q||typeof q=="object"&&q!==null&&q.$$typeof===ae&&gf(q)===d.type){l(h,d.sibling),A=n(d,p.props),Fa(A,p),A.return=h,h=A;break e}l(h,d);break}else t(h,d);d=d.sibling}p.type===K?(A=Sl(p.props.children,h.mode,A,p.key),A.return=h,h=A):(A=Ln(p.type,p.key,p.props,null,h.mode,A),Fa(A,p),A.return=h,h=A)}return u(h);case F:e:{for(q=p.key;d!==null;){if(d.key===q)if(d.tag===4&&d.stateNode.containerInfo===p.containerInfo&&d.stateNode.implementation===p.implementation){l(h,d.sibling),A=n(d,p.children||[]),A.return=h,h=A;break e}else{l(h,d);break}else t(h,d);d=d.sibling}A=Su(p,h.mode,A),A.return=h,h=A}return u(h);case ae:return q=p._init,p=q(p._payload),de(h,d,p,A)}if(R(p))return V(h,d,p,A);if(me(p)){if(q=me(p),typeof q!="function")throw Error(f(150));return p=q.call(p),Q(h,d,p,A)}if(typeof p.then=="function")return de(h,d,ni(p),A);if(p.$$typeof===xe)return de(h,d,Vn(h,p),A);ii(h,p)}return typeof p=="string"&&p!==""||typeof p=="number"||typeof p=="bigint"?(p=""+p,d!==null&&d.tag===6?(l(h,d.sibling),A=n(d,p),A.return=h,h=A):(l(h,d),A=yu(p,h.mode,A),A.return=h,h=A),u(h)):l(h,d)}return function(h,d,p,A){try{Wa=0;var q=de(h,d,p,A);return na=null,q}catch(G){if(G===La||G===Kn)throw G;var P=it(29,G,null,h.mode);return P.lanes=A,P.return=h,P}finally{}}}var ia=hf(!0),mf=hf(!1),vt=N(null),jt=null;function el(e){var t=e.alternate;w(we,we.current&1),w(vt,e),jt===null&&(t===null||ea.current!==null||t.memoizedState!==null)&&(jt=e)}function pf(e){if(e.tag===22){if(w(we,we.current),w(vt,e),jt===null){var t=e.alternate;t!==null&&t.memoizedState!==null&&(jt=e)}}else tl()}function tl(){w(we,we.current),w(vt,vt.current)}function Bt(e){B(vt),jt===e&&(jt=null),B(we)}var we=N(0);function ui(e){for(var t=e;t!==null;){if(t.tag===13){var l=t.memoizedState;if(l!==null&&(l=l.dehydrated,l===null||l.data==="$?"||Qc(l)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}function ec(e,t,l,a){t=e.memoizedState,l=l(a,t),l=l==null?t:H({},t,l),e.memoizedState=l,e.lanes===0&&(e.updateQueue.baseState=l)}var tc={enqueueSetState:function(e,t,l){e=e._reactInternals;var a=rt(),n=Ft(a);n.payload=t,l!=null&&(n.callback=l),t=Pt(e,n,a),t!==null&&(ft(t,e,a),Qa(t,e,a))},enqueueReplaceState:function(e,t,l){e=e._reactInternals;var a=rt(),n=Ft(a);n.tag=1,n.payload=t,l!=null&&(n.callback=l),t=Pt(e,n,a),t!==null&&(ft(t,e,a),Qa(t,e,a))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var l=rt(),a=Ft(l);a.tag=2,t!=null&&(a.callback=t),t=Pt(e,a,l),t!==null&&(ft(t,e,l),Qa(t,e,l))}};function bf(e,t,l,a,n,i,u){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(a,i,u):t.prototype&&t.prototype.isPureReactComponent?!Ra(l,a)||!Ra(n,i):!0}function vf(e,t,l,a){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(l,a),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(l,a),t.state!==e&&tc.enqueueReplaceState(t,t.state,null)}function _l(e,t){var l=t;if("ref"in t){l={};for(var a in t)a!=="ref"&&(l[a]=t[a])}if(e=e.defaultProps){l===t&&(l=H({},l));for(var n in e)l[n]===void 0&&(l[n]=e[n])}return l}var ci=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function xf(e){ci(e)}function yf(e){console.error(e)}function Sf(e){ci(e)}function si(e,t){try{var l=e.onUncaughtError;l(t.value,{componentStack:t.stack})}catch(a){setTimeout(function(){throw a})}}function Tf(e,t,l){try{var a=e.onCaughtError;a(l.value,{componentStack:l.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(n){setTimeout(function(){throw n})}}function lc(e,t,l){return l=Ft(l),l.tag=3,l.payload={element:null},l.callback=function(){si(e,t)},l}function Ef(e){return e=Ft(e),e.tag=3,e}function zf(e,t,l,a){var n=l.type.getDerivedStateFromError;if(typeof n=="function"){var i=a.value;e.payload=function(){return n(i)},e.callback=function(){Tf(t,l,a)}}var u=l.stateNode;u!==null&&typeof u.componentDidCatch=="function"&&(e.callback=function(){Tf(t,l,a),typeof n!="function"&&(cl===null?cl=new Set([this]):cl.add(this));var c=a.stack;this.componentDidCatch(a.value,{componentStack:c!==null?c:""})})}function k0(e,t,l,a,n){if(l.flags|=32768,a!==null&&typeof a=="object"&&typeof a.then=="function"){if(t=l.alternate,t!==null&&Ba(t,l,n,!0),l=vt.current,l!==null){switch(l.tag){case 13:return jt===null?jc():l.alternate===null&&Ae===0&&(Ae=3),l.flags&=-257,l.flags|=65536,l.lanes=n,a===Uu?l.flags|=16384:(t=l.updateQueue,t===null?l.updateQueue=new Set([a]):t.add(a),Oc(e,a,n)),!1;case 22:return l.flags|=65536,a===Uu?l.flags|=16384:(t=l.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([a])},l.updateQueue=t):(l=t.retryQueue,l===null?t.retryQueue=new Set([a]):l.add(a)),Oc(e,a,n)),!1}throw Error(f(435,l.tag))}return Oc(e,a,n),jc(),!1}if(ue)return t=vt.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=n,a!==zu&&(e=Error(f(422),{cause:a}),Ya(ht(e,l)))):(a!==zu&&(t=Error(f(423),{cause:a}),Ya(ht(t,l))),e=e.current.alternate,e.flags|=65536,n&=-n,e.lanes|=n,a=ht(a,l),n=lc(e.stateNode,a,n),wu(e,n),Ae!==4&&(Ae=2)),!1;var i=Error(f(520),{cause:a});if(i=ht(i,l),nn===null?nn=[i]:nn.push(i),Ae!==4&&(Ae=2),t===null)return!0;a=ht(a,l),l=t;do{switch(l.tag){case 3:return l.flags|=65536,e=n&-n,l.lanes|=e,e=lc(l.stateNode,a,e),wu(l,e),!1;case 1:if(t=l.type,i=l.stateNode,(l.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||i!==null&&typeof i.componentDidCatch=="function"&&(cl===null||!cl.has(i))))return l.flags|=65536,n&=-n,l.lanes|=n,n=Ef(n),zf(n,e,l,a),wu(l,n),!1}l=l.return}while(l!==null);return!1}var Af=Error(f(461)),Ce=!1;function Le(e,t,l,a){t.child=e===null?mf(t,null,l,a):ia(t,e.child,l,a)}function jf(e,t,l,a,n){l=l.render;var i=t.ref;if("ref"in a){var u={};for(var c in a)c!=="ref"&&(u[c]=a[c])}else u=a;return Nl(t),a=qu(e,t,l,u,i,n),c=Gu(),e!==null&&!Ce?(Lu(e,t,n),qt(e,t,n)):(ue&&c&&Tu(t),t.flags|=1,Le(e,t,a,n),t.child)}function Nf(e,t,l,a,n){if(e===null){var i=l.type;return typeof i=="function"&&!xu(i)&&i.defaultProps===void 0&&l.compare===null?(t.tag=15,t.type=i,Of(e,t,i,a,n)):(e=Ln(l.type,null,a,t,t.mode,n),e.ref=t.ref,e.return=t,t.child=e)}if(i=e.child,!fc(e,n)){var u=i.memoizedProps;if(l=l.compare,l=l!==null?l:Ra,l(u,a)&&e.ref===t.ref)return qt(e,t,n)}return t.flags|=1,e=Mt(i,a),e.ref=t.ref,e.return=t,t.child=e}function Of(e,t,l,a,n){if(e!==null){var i=e.memoizedProps;if(Ra(i,a)&&e.ref===t.ref)if(Ce=!1,t.pendingProps=a=i,fc(e,n))(e.flags&131072)!==0&&(Ce=!0);else return t.lanes=e.lanes,qt(e,t,n)}return ac(e,t,l,a,n)}function Df(e,t,l){var a=t.pendingProps,n=a.children,i=e!==null?e.memoizedState:null;if(a.mode==="hidden"){if((t.flags&128)!==0){if(a=i!==null?i.baseLanes|l:l,e!==null){for(n=t.child=e.child,i=0;n!==null;)i=i|n.lanes|n.childLanes,n=n.sibling;t.childLanes=i&~a}else t.childLanes=0,t.child=null;return _f(e,t,a,l)}if((l&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&kn(t,i!==null?i.cachePool:null),i!==null?Nr(t,i):Cu(),pf(t);else return t.lanes=t.childLanes=536870912,_f(e,t,i!==null?i.baseLanes|l:l,l)}else i!==null?(kn(t,i.cachePool),Nr(t,i),tl(),t.memoizedState=null):(e!==null&&kn(t,null),Cu(),tl());return Le(e,t,n,l),t.child}function _f(e,t,l,a){var n=_u();return n=n===null?null:{parent:Re._currentValue,pool:n},t.memoizedState={baseLanes:l,cachePool:n},e!==null&&kn(t,null),Cu(),pf(t),e!==null&&Ba(e,t,a,!0),null}function ri(e,t){var l=t.ref;if(l===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof l!="function"&&typeof l!="object")throw Error(f(284));(e===null||e.ref!==l)&&(t.flags|=4194816)}}function ac(e,t,l,a,n){return Nl(t),l=qu(e,t,l,a,void 0,n),a=Gu(),e!==null&&!Ce?(Lu(e,t,n),qt(e,t,n)):(ue&&a&&Tu(t),t.flags|=1,Le(e,t,l,n),t.child)}function Uf(e,t,l,a,n,i){return Nl(t),t.updateQueue=null,l=Dr(t,a,l,n),Or(e),a=Gu(),e!==null&&!Ce?(Lu(e,t,i),qt(e,t,i)):(ue&&a&&Tu(t),t.flags|=1,Le(e,t,l,i),t.child)}function Mf(e,t,l,a,n){if(Nl(t),t.stateNode===null){var i=$l,u=l.contextType;typeof u=="object"&&u!==null&&(i=Ve(u)),i=new l(a,i),t.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,i.updater=tc,t.stateNode=i,i._reactInternals=t,i=t.stateNode,i.props=a,i.state=t.memoizedState,i.refs={},Mu(t),u=l.contextType,i.context=typeof u=="object"&&u!==null?Ve(u):$l,i.state=t.memoizedState,u=l.getDerivedStateFromProps,typeof u=="function"&&(ec(t,l,u,a),i.state=t.memoizedState),typeof l.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(u=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),u!==i.state&&tc.enqueueReplaceState(i,i.state,null),Va(t,a,i,n),Za(),i.state=t.memoizedState),typeof i.componentDidMount=="function"&&(t.flags|=4194308),a=!0}else if(e===null){i=t.stateNode;var c=t.memoizedProps,r=_l(l,c);i.props=r;var b=i.context,z=l.contextType;u=$l,typeof z=="object"&&z!==null&&(u=Ve(z));var j=l.getDerivedStateFromProps;z=typeof j=="function"||typeof i.getSnapshotBeforeUpdate=="function",c=t.pendingProps!==c,z||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(c||b!==u)&&vf(t,i,a,u),Wt=!1;var x=t.memoizedState;i.state=x,Va(t,a,i,n),Za(),b=t.memoizedState,c||x!==b||Wt?(typeof j=="function"&&(ec(t,l,j,a),b=t.memoizedState),(r=Wt||bf(t,l,r,a,x,b,u))?(z||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount()),typeof i.componentDidMount=="function"&&(t.flags|=4194308)):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=a,t.memoizedState=b),i.props=a,i.state=b,i.context=u,a=r):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),a=!1)}else{i=t.stateNode,Ru(e,t),u=t.memoizedProps,z=_l(l,u),i.props=z,j=t.pendingProps,x=i.context,b=l.contextType,r=$l,typeof b=="object"&&b!==null&&(r=Ve(b)),c=l.getDerivedStateFromProps,(b=typeof c=="function"||typeof i.getSnapshotBeforeUpdate=="function")||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(u!==j||x!==r)&&vf(t,i,a,r),Wt=!1,x=t.memoizedState,i.state=x,Va(t,a,i,n),Za();var S=t.memoizedState;u!==j||x!==S||Wt||e!==null&&e.dependencies!==null&&Zn(e.dependencies)?(typeof c=="function"&&(ec(t,l,c,a),S=t.memoizedState),(z=Wt||bf(t,l,z,a,x,S,r)||e!==null&&e.dependencies!==null&&Zn(e.dependencies))?(b||typeof i.UNSAFE_componentWillUpdate!="function"&&typeof i.componentWillUpdate!="function"||(typeof i.componentWillUpdate=="function"&&i.componentWillUpdate(a,S,r),typeof i.UNSAFE_componentWillUpdate=="function"&&i.UNSAFE_componentWillUpdate(a,S,r)),typeof i.componentDidUpdate=="function"&&(t.flags|=4),typeof i.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof i.componentDidUpdate!="function"||u===e.memoizedProps&&x===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||u===e.memoizedProps&&x===e.memoizedState||(t.flags|=1024),t.memoizedProps=a,t.memoizedState=S),i.props=a,i.state=S,i.context=r,a=z):(typeof i.componentDidUpdate!="function"||u===e.memoizedProps&&x===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||u===e.memoizedProps&&x===e.memoizedState||(t.flags|=1024),a=!1)}return i=a,ri(e,t),a=(t.flags&128)!==0,i||a?(i=t.stateNode,l=a&&typeof l.getDerivedStateFromError!="function"?null:i.render(),t.flags|=1,e!==null&&a?(t.child=ia(t,e.child,null,n),t.child=ia(t,null,l,n)):Le(e,t,l,n),t.memoizedState=i.state,e=t.child):e=qt(e,t,n),e}function Rf(e,t,l,a){return Ca(),t.flags|=256,Le(e,t,l,a),t.child}var nc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function ic(e){return{baseLanes:e,cachePool:xr()}}function uc(e,t,l){return e=e!==null?e.childLanes&~l:0,t&&(e|=xt),e}function wf(e,t,l){var a=t.pendingProps,n=!1,i=(t.flags&128)!==0,u;if((u=i)||(u=e!==null&&e.memoizedState===null?!1:(we.current&2)!==0),u&&(n=!0,t.flags&=-129),u=(t.flags&32)!==0,t.flags&=-33,e===null){if(ue){if(n?el(t):tl(),ue){var c=ze,r;if(r=c){e:{for(r=c,c=At;r.nodeType!==8;){if(!c){c=null;break e}if(r=Et(r.nextSibling),r===null){c=null;break e}}c=r}c!==null?(t.memoizedState={dehydrated:c,treeContext:Tl!==null?{id:Rt,overflow:wt}:null,retryLane:536870912,hydrationErrors:null},r=it(18,null,null,0),r.stateNode=c,r.return=t,t.child=r,Ke=t,ze=null,r=!0):r=!1}r||Al(t)}if(c=t.memoizedState,c!==null&&(c=c.dehydrated,c!==null))return Qc(c)?t.lanes=32:t.lanes=536870912,null;Bt(t)}return c=a.children,a=a.fallback,n?(tl(),n=t.mode,c=fi({mode:"hidden",children:c},n),a=Sl(a,n,l,null),c.return=t,a.return=t,c.sibling=a,t.child=c,n=t.child,n.memoizedState=ic(l),n.childLanes=uc(e,u,l),t.memoizedState=nc,a):(el(t),cc(t,c))}if(r=e.memoizedState,r!==null&&(c=r.dehydrated,c!==null)){if(i)t.flags&256?(el(t),t.flags&=-257,t=sc(e,t,l)):t.memoizedState!==null?(tl(),t.child=e.child,t.flags|=128,t=null):(tl(),n=a.fallback,c=t.mode,a=fi({mode:"visible",children:a.children},c),n=Sl(n,c,l,null),n.flags|=2,a.return=t,n.return=t,a.sibling=n,t.child=a,ia(t,e.child,null,l),a=t.child,a.memoizedState=ic(l),a.childLanes=uc(e,u,l),t.memoizedState=nc,t=n);else if(el(t),Qc(c)){if(u=c.nextSibling&&c.nextSibling.dataset,u)var b=u.dgst;u=b,a=Error(f(419)),a.stack="",a.digest=u,Ya({value:a,source:null,stack:null}),t=sc(e,t,l)}else if(Ce||Ba(e,t,l,!1),u=(l&e.childLanes)!==0,Ce||u){if(u=be,u!==null&&(a=l&-l,a=(a&42)!==0?1:Zi(a),a=(a&(u.suspendedLanes|l))!==0?0:a,a!==0&&a!==r.retryLane))throw r.retryLane=a,Jl(e,a),ft(u,e,a),Af;c.data==="$?"||jc(),t=sc(e,t,l)}else c.data==="$?"?(t.flags|=192,t.child=e.child,t=null):(e=r.treeContext,ze=Et(c.nextSibling),Ke=t,ue=!0,zl=null,At=!1,e!==null&&(pt[bt++]=Rt,pt[bt++]=wt,pt[bt++]=Tl,Rt=e.id,wt=e.overflow,Tl=t),t=cc(t,a.children),t.flags|=4096);return t}return n?(tl(),n=a.fallback,c=t.mode,r=e.child,b=r.sibling,a=Mt(r,{mode:"hidden",children:a.children}),a.subtreeFlags=r.subtreeFlags&65011712,b!==null?n=Mt(b,n):(n=Sl(n,c,l,null),n.flags|=2),n.return=t,a.return=t,a.sibling=n,t.child=a,a=n,n=t.child,c=e.child.memoizedState,c===null?c=ic(l):(r=c.cachePool,r!==null?(b=Re._currentValue,r=r.parent!==b?{parent:b,pool:b}:r):r=xr(),c={baseLanes:c.baseLanes|l,cachePool:r}),n.memoizedState=c,n.childLanes=uc(e,u,l),t.memoizedState=nc,a):(el(t),l=e.child,e=l.sibling,l=Mt(l,{mode:"visible",children:a.children}),l.return=t,l.sibling=null,e!==null&&(u=t.deletions,u===null?(t.deletions=[e],t.flags|=16):u.push(e)),t.child=l,t.memoizedState=null,l)}function cc(e,t){return t=fi({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function fi(e,t){return e=it(22,e,null,t),e.lanes=0,e.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null},e}function sc(e,t,l){return ia(t,e.child,null,l),e=cc(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Hf(e,t,l){e.lanes|=t;var a=e.alternate;a!==null&&(a.lanes|=t),ju(e.return,t,l)}function rc(e,t,l,a,n){var i=e.memoizedState;i===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:a,tail:l,tailMode:n}:(i.isBackwards=t,i.rendering=null,i.renderingStartTime=0,i.last=a,i.tail=l,i.tailMode=n)}function Cf(e,t,l){var a=t.pendingProps,n=a.revealOrder,i=a.tail;if(Le(e,t,a.children,l),a=we.current,(a&2)!==0)a=a&1|2,t.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Hf(e,l,t);else if(e.tag===19)Hf(e,l,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}a&=1}switch(w(we,a),n){case"forwards":for(l=t.child,n=null;l!==null;)e=l.alternate,e!==null&&ui(e)===null&&(n=l),l=l.sibling;l=n,l===null?(n=t.child,t.child=null):(n=l.sibling,l.sibling=null),rc(t,!1,n,l,i);break;case"backwards":for(l=null,n=t.child,t.child=null;n!==null;){if(e=n.alternate,e!==null&&ui(e)===null){t.child=n;break}e=n.sibling,n.sibling=l,l=n,n=e}rc(t,!0,l,null,i);break;case"together":rc(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function qt(e,t,l){if(e!==null&&(t.dependencies=e.dependencies),ul|=t.lanes,(l&t.childLanes)===0)if(e!==null){if(Ba(e,t,l,!1),(l&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(f(153));if(t.child!==null){for(e=t.child,l=Mt(e,e.pendingProps),t.child=l,l.return=t;e.sibling!==null;)e=e.sibling,l=l.sibling=Mt(e,e.pendingProps),l.return=t;l.sibling=null}return t.child}function fc(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&Zn(e)))}function K0(e,t,l){switch(t.tag){case 3:ye(t,t.stateNode.containerInfo),$t(t,Re,e.memoizedState.cache),Ca();break;case 27:case 5:qi(t);break;case 4:ye(t,t.stateNode.containerInfo);break;case 10:$t(t,t.type,t.memoizedProps.value);break;case 13:var a=t.memoizedState;if(a!==null)return a.dehydrated!==null?(el(t),t.flags|=128,null):(l&t.child.childLanes)!==0?wf(e,t,l):(el(t),e=qt(e,t,l),e!==null?e.sibling:null);el(t);break;case 19:var n=(e.flags&128)!==0;if(a=(l&t.childLanes)!==0,a||(Ba(e,t,l,!1),a=(l&t.childLanes)!==0),n){if(a)return Cf(e,t,l);t.flags|=128}if(n=t.memoizedState,n!==null&&(n.rendering=null,n.tail=null,n.lastEffect=null),w(we,we.current),a)break;return null;case 22:case 23:return t.lanes=0,Df(e,t,l);case 24:$t(t,Re,e.memoizedState.cache)}return qt(e,t,l)}function Yf(e,t,l){if(e!==null)if(e.memoizedProps!==t.pendingProps)Ce=!0;else{if(!fc(e,l)&&(t.flags&128)===0)return Ce=!1,K0(e,t,l);Ce=(e.flags&131072)!==0}else Ce=!1,ue&&(t.flags&1048576)!==0&&dr(t,Qn,t.index);switch(t.lanes=0,t.tag){case 16:e:{e=t.pendingProps;var a=t.elementType,n=a._init;if(a=n(a._payload),t.type=a,typeof a=="function")xu(a)?(e=_l(a,e),t.tag=1,t=Mf(null,t,a,e,l)):(t.tag=0,t=ac(null,t,a,e,l));else{if(a!=null){if(n=a.$$typeof,n===qe){t.tag=11,t=jf(null,t,a,e,l);break e}else if(n===De){t.tag=14,t=Nf(null,t,a,e,l);break e}}throw t=Je(a)||a,Error(f(306,t,""))}}return t;case 0:return ac(e,t,t.type,t.pendingProps,l);case 1:return a=t.type,n=_l(a,t.pendingProps),Mf(e,t,a,n,l);case 3:e:{if(ye(t,t.stateNode.containerInfo),e===null)throw Error(f(387));a=t.pendingProps;var i=t.memoizedState;n=i.element,Ru(e,t),Va(t,a,null,l);var u=t.memoizedState;if(a=u.cache,$t(t,Re,a),a!==i.cache&&Nu(t,[Re],l,!0),Za(),a=u.element,i.isDehydrated)if(i={element:a,isDehydrated:!1,cache:u.cache},t.updateQueue.baseState=i,t.memoizedState=i,t.flags&256){t=Rf(e,t,a,l);break e}else if(a!==n){n=ht(Error(f(424)),t),Ya(n),t=Rf(e,t,a,l);break e}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName==="HTML"?e.ownerDocument.body:e}for(ze=Et(e.firstChild),Ke=t,ue=!0,zl=null,At=!0,l=mf(t,null,a,l),t.child=l;l;)l.flags=l.flags&-3|4096,l=l.sibling}else{if(Ca(),a===n){t=qt(e,t,l);break e}Le(e,t,a,l)}t=t.child}return t;case 26:return ri(e,t),e===null?(l=Xo(t.type,null,t.pendingProps,null))?t.memoizedState=l:ue||(l=t.type,e=t.pendingProps,a=zi(k.current).createElement(l),a[Ze]=t,a[$e]=e,Qe(a,l,e),He(a),t.stateNode=a):t.memoizedState=Xo(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return qi(t),e===null&&ue&&(a=t.stateNode=qo(t.type,t.pendingProps,k.current),Ke=t,At=!0,n=ze,fl(t.type)?(Zc=n,ze=Et(a.firstChild)):ze=n),Le(e,t,t.pendingProps.children,l),ri(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&ue&&((n=a=ze)&&(a=Sg(a,t.type,t.pendingProps,At),a!==null?(t.stateNode=a,Ke=t,ze=Et(a.firstChild),At=!1,n=!0):n=!1),n||Al(t)),qi(t),n=t.type,i=t.pendingProps,u=e!==null?e.memoizedProps:null,a=i.children,Gc(n,i)?a=null:u!==null&&Gc(n,u)&&(t.flags|=32),t.memoizedState!==null&&(n=qu(e,t,q0,null,null,l),hn._currentValue=n),ri(e,t),Le(e,t,a,l),t.child;case 6:return e===null&&ue&&((e=l=ze)&&(l=Tg(l,t.pendingProps,At),l!==null?(t.stateNode=l,Ke=t,ze=null,e=!0):e=!1),e||Al(t)),null;case 13:return wf(e,t,l);case 4:return ye(t,t.stateNode.containerInfo),a=t.pendingProps,e===null?t.child=ia(t,null,a,l):Le(e,t,a,l),t.child;case 11:return jf(e,t,t.type,t.pendingProps,l);case 7:return Le(e,t,t.pendingProps,l),t.child;case 8:return Le(e,t,t.pendingProps.children,l),t.child;case 12:return Le(e,t,t.pendingProps.children,l),t.child;case 10:return a=t.pendingProps,$t(t,t.type,a.value),Le(e,t,a.children,l),t.child;case 9:return n=t.type._context,a=t.pendingProps.children,Nl(t),n=Ve(n),a=a(n),t.flags|=1,Le(e,t,a,l),t.child;case 14:return Nf(e,t,t.type,t.pendingProps,l);case 15:return Of(e,t,t.type,t.pendingProps,l);case 19:return Cf(e,t,l);case 31:return a=t.pendingProps,l=t.mode,a={mode:a.mode,children:a.children},e===null?(l=fi(a,l),l.ref=t.ref,t.child=l,l.return=t,t=l):(l=Mt(e.child,a),l.ref=t.ref,t.child=l,l.return=t,t=l),t;case 22:return Df(e,t,l);case 24:return Nl(t),a=Ve(Re),e===null?(n=_u(),n===null&&(n=be,i=Ou(),n.pooledCache=i,i.refCount++,i!==null&&(n.pooledCacheLanes|=l),n=i),t.memoizedState={parent:a,cache:n},Mu(t),$t(t,Re,n)):((e.lanes&l)!==0&&(Ru(e,t),Va(t,null,null,l),Za()),n=e.memoizedState,i=t.memoizedState,n.parent!==a?(n={parent:a,cache:a},t.memoizedState=n,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=n),$t(t,Re,a)):(a=i.cache,$t(t,Re,a),a!==n.cache&&Nu(t,[Re],l,!0))),Le(e,t,t.pendingProps.children,l),t.child;case 29:throw t.pendingProps}throw Error(f(156,t.tag))}function Gt(e){e.flags|=4}function Bf(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!Ko(t)){if(t=vt.current,t!==null&&((le&4194048)===le?jt!==null:(le&62914560)!==le&&(le&536870912)===0||t!==jt))throw Xa=Uu,yr;e.flags|=8192}}function oi(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?ms():536870912,e.lanes|=t,ra|=t)}function Pa(e,t){if(!ue)switch(e.tailMode){case"hidden":t=e.tail;for(var l=null;t!==null;)t.alternate!==null&&(l=t),t=t.sibling;l===null?e.tail=null:l.sibling=null;break;case"collapsed":l=e.tail;for(var a=null;l!==null;)l.alternate!==null&&(a=l),l=l.sibling;a===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:a.sibling=null}}function Te(e){var t=e.alternate!==null&&e.alternate.child===e.child,l=0,a=0;if(t)for(var n=e.child;n!==null;)l|=n.lanes|n.childLanes,a|=n.subtreeFlags&65011712,a|=n.flags&65011712,n.return=e,n=n.sibling;else for(n=e.child;n!==null;)l|=n.lanes|n.childLanes,a|=n.subtreeFlags,a|=n.flags,n.return=e,n=n.sibling;return e.subtreeFlags|=a,e.childLanes=l,t}function J0(e,t,l){var a=t.pendingProps;switch(Eu(t),t.tag){case 31:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Te(t),null;case 1:return Te(t),null;case 3:return l=t.stateNode,a=null,e!==null&&(a=e.memoizedState.cache),t.memoizedState.cache!==a&&(t.flags|=2048),Ct(Re),Vt(),l.pendingContext&&(l.context=l.pendingContext,l.pendingContext=null),(e===null||e.child===null)&&(Ha(t)?Gt(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,mr())),Te(t),null;case 26:return l=t.memoizedState,e===null?(Gt(t),l!==null?(Te(t),Bf(t,l)):(Te(t),t.flags&=-16777217)):l?l!==e.memoizedState?(Gt(t),Te(t),Bf(t,l)):(Te(t),t.flags&=-16777217):(e.memoizedProps!==a&&Gt(t),Te(t),t.flags&=-16777217),null;case 27:Tn(t),l=k.current;var n=t.type;if(e!==null&&t.stateNode!=null)e.memoizedProps!==a&&Gt(t);else{if(!a){if(t.stateNode===null)throw Error(f(166));return Te(t),null}e=X.current,Ha(t)?gr(t):(e=qo(n,a,l),t.stateNode=e,Gt(t))}return Te(t),null;case 5:if(Tn(t),l=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==a&&Gt(t);else{if(!a){if(t.stateNode===null)throw Error(f(166));return Te(t),null}if(e=X.current,Ha(t))gr(t);else{switch(n=zi(k.current),e){case 1:e=n.createElementNS("http://www.w3.org/2000/svg",l);break;case 2:e=n.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;default:switch(l){case"svg":e=n.createElementNS("http://www.w3.org/2000/svg",l);break;case"math":e=n.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;case"script":e=n.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild);break;case"select":e=typeof a.is=="string"?n.createElement("select",{is:a.is}):n.createElement("select"),a.multiple?e.multiple=!0:a.size&&(e.size=a.size);break;default:e=typeof a.is=="string"?n.createElement(l,{is:a.is}):n.createElement(l)}}e[Ze]=t,e[$e]=a;e:for(n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.tag!==27&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break e;for(;n.sibling===null;){if(n.return===null||n.return===t)break e;n=n.return}n.sibling.return=n.return,n=n.sibling}t.stateNode=e;e:switch(Qe(e,l,a),l){case"button":case"input":case"select":case"textarea":e=!!a.autoFocus;break e;case"img":e=!0;break e;default:e=!1}e&&Gt(t)}}return Te(t),t.flags&=-16777217,null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==a&&Gt(t);else{if(typeof a!="string"&&t.stateNode===null)throw Error(f(166));if(e=k.current,Ha(t)){if(e=t.stateNode,l=t.memoizedProps,a=null,n=Ke,n!==null)switch(n.tag){case 27:case 5:a=n.memoizedProps}e[Ze]=t,e=!!(e.nodeValue===l||a!==null&&a.suppressHydrationWarning===!0||Mo(e.nodeValue,l)),e||Al(t)}else e=zi(e).createTextNode(a),e[Ze]=t,t.stateNode=e}return Te(t),null;case 13:if(a=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(n=Ha(t),a!==null&&a.dehydrated!==null){if(e===null){if(!n)throw Error(f(318));if(n=t.memoizedState,n=n!==null?n.dehydrated:null,!n)throw Error(f(317));n[Ze]=t}else Ca(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;Te(t),n=!1}else n=mr(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),n=!0;if(!n)return t.flags&256?(Bt(t),t):(Bt(t),null)}if(Bt(t),(t.flags&128)!==0)return t.lanes=l,t;if(l=a!==null,e=e!==null&&e.memoizedState!==null,l){a=t.child,n=null,a.alternate!==null&&a.alternate.memoizedState!==null&&a.alternate.memoizedState.cachePool!==null&&(n=a.alternate.memoizedState.cachePool.pool);var i=null;a.memoizedState!==null&&a.memoizedState.cachePool!==null&&(i=a.memoizedState.cachePool.pool),i!==n&&(a.flags|=2048)}return l!==e&&l&&(t.child.flags|=8192),oi(t,t.updateQueue),Te(t),null;case 4:return Vt(),e===null&&Hc(t.stateNode.containerInfo),Te(t),null;case 10:return Ct(t.type),Te(t),null;case 19:if(B(we),n=t.memoizedState,n===null)return Te(t),null;if(a=(t.flags&128)!==0,i=n.rendering,i===null)if(a)Pa(n,!1);else{if(Ae!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(i=ui(e),i!==null){for(t.flags|=128,Pa(n,!1),e=i.updateQueue,t.updateQueue=e,oi(t,e),t.subtreeFlags=0,e=l,l=t.child;l!==null;)or(l,e),l=l.sibling;return w(we,we.current&1|2),t.child}e=e.sibling}n.tail!==null&&zt()>hi&&(t.flags|=128,a=!0,Pa(n,!1),t.lanes=4194304)}else{if(!a)if(e=ui(i),e!==null){if(t.flags|=128,a=!0,e=e.updateQueue,t.updateQueue=e,oi(t,e),Pa(n,!0),n.tail===null&&n.tailMode==="hidden"&&!i.alternate&&!ue)return Te(t),null}else 2*zt()-n.renderingStartTime>hi&&l!==536870912&&(t.flags|=128,a=!0,Pa(n,!1),t.lanes=4194304);n.isBackwards?(i.sibling=t.child,t.child=i):(e=n.last,e!==null?e.sibling=i:t.child=i,n.last=i)}return n.tail!==null?(t=n.tail,n.rendering=t,n.tail=t.sibling,n.renderingStartTime=zt(),t.sibling=null,e=we.current,w(we,a?e&1|2:e&1),t):(Te(t),null);case 22:case 23:return Bt(t),Yu(),a=t.memoizedState!==null,e!==null?e.memoizedState!==null!==a&&(t.flags|=8192):a&&(t.flags|=8192),a?(l&536870912)!==0&&(t.flags&128)===0&&(Te(t),t.subtreeFlags&6&&(t.flags|=8192)):Te(t),l=t.updateQueue,l!==null&&oi(t,l.retryQueue),l=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(l=e.memoizedState.cachePool.pool),a=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),a!==l&&(t.flags|=2048),e!==null&&B(Ol),null;case 24:return l=null,e!==null&&(l=e.memoizedState.cache),t.memoizedState.cache!==l&&(t.flags|=2048),Ct(Re),Te(t),null;case 25:return null;case 30:return null}throw Error(f(156,t.tag))}function $0(e,t){switch(Eu(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Ct(Re),Vt(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Tn(t),null;case 13:if(Bt(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(f(340));Ca()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return B(we),null;case 4:return Vt(),null;case 10:return Ct(t.type),null;case 22:case 23:return Bt(t),Yu(),e!==null&&B(Ol),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return Ct(Re),null;case 25:return null;default:return null}}function qf(e,t){switch(Eu(t),t.tag){case 3:Ct(Re),Vt();break;case 26:case 27:case 5:Tn(t);break;case 4:Vt();break;case 13:Bt(t);break;case 19:B(we);break;case 10:Ct(t.type);break;case 22:case 23:Bt(t),Yu(),e!==null&&B(Ol);break;case 24:Ct(Re)}}function Ia(e,t){try{var l=t.updateQueue,a=l!==null?l.lastEffect:null;if(a!==null){var n=a.next;l=n;do{if((l.tag&e)===e){a=void 0;var i=l.create,u=l.inst;a=i(),u.destroy=a}l=l.next}while(l!==n)}}catch(c){pe(t,t.return,c)}}function ll(e,t,l){try{var a=t.updateQueue,n=a!==null?a.lastEffect:null;if(n!==null){var i=n.next;a=i;do{if((a.tag&e)===e){var u=a.inst,c=u.destroy;if(c!==void 0){u.destroy=void 0,n=t;var r=l,b=c;try{b()}catch(z){pe(n,r,z)}}}a=a.next}while(a!==i)}}catch(z){pe(t,t.return,z)}}function Gf(e){var t=e.updateQueue;if(t!==null){var l=e.stateNode;try{jr(t,l)}catch(a){pe(e,e.return,a)}}}function Lf(e,t,l){l.props=_l(e.type,e.memoizedProps),l.state=e.memoizedState;try{l.componentWillUnmount()}catch(a){pe(e,t,a)}}function en(e,t){try{var l=e.ref;if(l!==null){switch(e.tag){case 26:case 27:case 5:var a=e.stateNode;break;case 30:a=e.stateNode;break;default:a=e.stateNode}typeof l=="function"?e.refCleanup=l(a):l.current=a}}catch(n){pe(e,t,n)}}function Nt(e,t){var l=e.ref,a=e.refCleanup;if(l!==null)if(typeof a=="function")try{a()}catch(n){pe(e,t,n)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof l=="function")try{l(null)}catch(n){pe(e,t,n)}else l.current=null}function Xf(e){var t=e.type,l=e.memoizedProps,a=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":l.autoFocus&&a.focus();break e;case"img":l.src?a.src=l.src:l.srcSet&&(a.srcset=l.srcSet)}}catch(n){pe(e,e.return,n)}}function oc(e,t,l){try{var a=e.stateNode;pg(a,e.type,l,t),a[$e]=t}catch(n){pe(e,e.return,n)}}function Qf(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&fl(e.type)||e.tag===4}function dc(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||Qf(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&fl(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function gc(e,t,l){var a=e.tag;if(a===5||a===6)e=e.stateNode,t?(l.nodeType===9?l.body:l.nodeName==="HTML"?l.ownerDocument.body:l).insertBefore(e,t):(t=l.nodeType===9?l.body:l.nodeName==="HTML"?l.ownerDocument.body:l,t.appendChild(e),l=l._reactRootContainer,l!=null||t.onclick!==null||(t.onclick=Ei));else if(a!==4&&(a===27&&fl(e.type)&&(l=e.stateNode,t=null),e=e.child,e!==null))for(gc(e,t,l),e=e.sibling;e!==null;)gc(e,t,l),e=e.sibling}function di(e,t,l){var a=e.tag;if(a===5||a===6)e=e.stateNode,t?l.insertBefore(e,t):l.appendChild(e);else if(a!==4&&(a===27&&fl(e.type)&&(l=e.stateNode),e=e.child,e!==null))for(di(e,t,l),e=e.sibling;e!==null;)di(e,t,l),e=e.sibling}function Zf(e){var t=e.stateNode,l=e.memoizedProps;try{for(var a=e.type,n=t.attributes;n.length;)t.removeAttributeNode(n[0]);Qe(t,a,l),t[Ze]=e,t[$e]=l}catch(i){pe(e,e.return,i)}}var Lt=!1,Oe=!1,hc=!1,Vf=typeof WeakSet=="function"?WeakSet:Set,Ye=null;function W0(e,t){if(e=e.containerInfo,Bc=_i,e=tr(e),du(e)){if("selectionStart"in e)var l={start:e.selectionStart,end:e.selectionEnd};else e:{l=(l=e.ownerDocument)&&l.defaultView||window;var a=l.getSelection&&l.getSelection();if(a&&a.rangeCount!==0){l=a.anchorNode;var n=a.anchorOffset,i=a.focusNode;a=a.focusOffset;try{l.nodeType,i.nodeType}catch{l=null;break e}var u=0,c=-1,r=-1,b=0,z=0,j=e,x=null;t:for(;;){for(var S;j!==l||n!==0&&j.nodeType!==3||(c=u+n),j!==i||a!==0&&j.nodeType!==3||(r=u+a),j.nodeType===3&&(u+=j.nodeValue.length),(S=j.firstChild)!==null;)x=j,j=S;for(;;){if(j===e)break t;if(x===l&&++b===n&&(c=u),x===i&&++z===a&&(r=u),(S=j.nextSibling)!==null)break;j=x,x=j.parentNode}j=S}l=c===-1||r===-1?null:{start:c,end:r}}else l=null}l=l||{start:0,end:0}}else l=null;for(qc={focusedElem:e,selectionRange:l},_i=!1,Ye=t;Ye!==null;)if(t=Ye,e=t.child,(t.subtreeFlags&1024)!==0&&e!==null)e.return=t,Ye=e;else for(;Ye!==null;){switch(t=Ye,i=t.alternate,e=t.flags,t.tag){case 0:break;case 11:case 15:break;case 1:if((e&1024)!==0&&i!==null){e=void 0,l=t,n=i.memoizedProps,i=i.memoizedState,a=l.stateNode;try{var V=_l(l.type,n,l.elementType===l.type);e=a.getSnapshotBeforeUpdate(V,i),a.__reactInternalSnapshotBeforeUpdate=e}catch(Q){pe(l,l.return,Q)}}break;case 3:if((e&1024)!==0){if(e=t.stateNode.containerInfo,l=e.nodeType,l===9)Xc(e);else if(l===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":Xc(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((e&1024)!==0)throw Error(f(163))}if(e=t.sibling,e!==null){e.return=t.return,Ye=e;break}Ye=t.return}}function kf(e,t,l){var a=l.flags;switch(l.tag){case 0:case 11:case 15:al(e,l),a&4&&Ia(5,l);break;case 1:if(al(e,l),a&4)if(e=l.stateNode,t===null)try{e.componentDidMount()}catch(u){pe(l,l.return,u)}else{var n=_l(l.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(n,t,e.__reactInternalSnapshotBeforeUpdate)}catch(u){pe(l,l.return,u)}}a&64&&Gf(l),a&512&&en(l,l.return);break;case 3:if(al(e,l),a&64&&(e=l.updateQueue,e!==null)){if(t=null,l.child!==null)switch(l.child.tag){case 27:case 5:t=l.child.stateNode;break;case 1:t=l.child.stateNode}try{jr(e,t)}catch(u){pe(l,l.return,u)}}break;case 27:t===null&&a&4&&Zf(l);case 26:case 5:al(e,l),t===null&&a&4&&Xf(l),a&512&&en(l,l.return);break;case 12:al(e,l);break;case 13:al(e,l),a&4&&$f(e,l),a&64&&(e=l.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(l=ig.bind(null,l),Eg(e,l))));break;case 22:if(a=l.memoizedState!==null||Lt,!a){t=t!==null&&t.memoizedState!==null||Oe,n=Lt;var i=Oe;Lt=a,(Oe=t)&&!i?nl(e,l,(l.subtreeFlags&8772)!==0):al(e,l),Lt=n,Oe=i}break;case 30:break;default:al(e,l)}}function Kf(e){var t=e.alternate;t!==null&&(e.alternate=null,Kf(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&Ki(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var Se=null,Pe=!1;function Xt(e,t,l){for(l=l.child;l!==null;)Jf(e,t,l),l=l.sibling}function Jf(e,t,l){if(lt&&typeof lt.onCommitFiberUnmount=="function")try{lt.onCommitFiberUnmount(Sa,l)}catch{}switch(l.tag){case 26:Oe||Nt(l,t),Xt(e,t,l),l.memoizedState?l.memoizedState.count--:l.stateNode&&(l=l.stateNode,l.parentNode.removeChild(l));break;case 27:Oe||Nt(l,t);var a=Se,n=Pe;fl(l.type)&&(Se=l.stateNode,Pe=!1),Xt(e,t,l),fn(l.stateNode),Se=a,Pe=n;break;case 5:Oe||Nt(l,t);case 6:if(a=Se,n=Pe,Se=null,Xt(e,t,l),Se=a,Pe=n,Se!==null)if(Pe)try{(Se.nodeType===9?Se.body:Se.nodeName==="HTML"?Se.ownerDocument.body:Se).removeChild(l.stateNode)}catch(i){pe(l,t,i)}else try{Se.removeChild(l.stateNode)}catch(i){pe(l,t,i)}break;case 18:Se!==null&&(Pe?(e=Se,Yo(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,l.stateNode),vn(e)):Yo(Se,l.stateNode));break;case 4:a=Se,n=Pe,Se=l.stateNode.containerInfo,Pe=!0,Xt(e,t,l),Se=a,Pe=n;break;case 0:case 11:case 14:case 15:Oe||ll(2,l,t),Oe||ll(4,l,t),Xt(e,t,l);break;case 1:Oe||(Nt(l,t),a=l.stateNode,typeof a.componentWillUnmount=="function"&&Lf(l,t,a)),Xt(e,t,l);break;case 21:Xt(e,t,l);break;case 22:Oe=(a=Oe)||l.memoizedState!==null,Xt(e,t,l),Oe=a;break;default:Xt(e,t,l)}}function $f(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{vn(e)}catch(l){pe(t,t.return,l)}}function F0(e){switch(e.tag){case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Vf),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Vf),t;default:throw Error(f(435,e.tag))}}function mc(e,t){var l=F0(e);t.forEach(function(a){var n=ug.bind(null,e,a);l.has(a)||(l.add(a),a.then(n,n))})}function ut(e,t){var l=t.deletions;if(l!==null)for(var a=0;a<l.length;a++){var n=l[a],i=e,u=t,c=u;e:for(;c!==null;){switch(c.tag){case 27:if(fl(c.type)){Se=c.stateNode,Pe=!1;break e}break;case 5:Se=c.stateNode,Pe=!1;break e;case 3:case 4:Se=c.stateNode.containerInfo,Pe=!0;break e}c=c.return}if(Se===null)throw Error(f(160));Jf(i,u,n),Se=null,Pe=!1,i=n.alternate,i!==null&&(i.return=null),n.return=null}if(t.subtreeFlags&13878)for(t=t.child;t!==null;)Wf(t,e),t=t.sibling}var Tt=null;function Wf(e,t){var l=e.alternate,a=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:ut(t,e),ct(e),a&4&&(ll(3,e,e.return),Ia(3,e),ll(5,e,e.return));break;case 1:ut(t,e),ct(e),a&512&&(Oe||l===null||Nt(l,l.return)),a&64&&Lt&&(e=e.updateQueue,e!==null&&(a=e.callbacks,a!==null&&(l=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=l===null?a:l.concat(a))));break;case 26:var n=Tt;if(ut(t,e),ct(e),a&512&&(Oe||l===null||Nt(l,l.return)),a&4){var i=l!==null?l.memoizedState:null;if(a=e.memoizedState,l===null)if(a===null)if(e.stateNode===null){e:{a=e.type,l=e.memoizedProps,n=n.ownerDocument||n;t:switch(a){case"title":i=n.getElementsByTagName("title")[0],(!i||i[za]||i[Ze]||i.namespaceURI==="http://www.w3.org/2000/svg"||i.hasAttribute("itemprop"))&&(i=n.createElement(a),n.head.insertBefore(i,n.querySelector("head > title"))),Qe(i,a,l),i[Ze]=e,He(i),a=i;break e;case"link":var u=Vo("link","href",n).get(a+(l.href||""));if(u){for(var c=0;c<u.length;c++)if(i=u[c],i.getAttribute("href")===(l.href==null||l.href===""?null:l.href)&&i.getAttribute("rel")===(l.rel==null?null:l.rel)&&i.getAttribute("title")===(l.title==null?null:l.title)&&i.getAttribute("crossorigin")===(l.crossOrigin==null?null:l.crossOrigin)){u.splice(c,1);break t}}i=n.createElement(a),Qe(i,a,l),n.head.appendChild(i);break;case"meta":if(u=Vo("meta","content",n).get(a+(l.content||""))){for(c=0;c<u.length;c++)if(i=u[c],i.getAttribute("content")===(l.content==null?null:""+l.content)&&i.getAttribute("name")===(l.name==null?null:l.name)&&i.getAttribute("property")===(l.property==null?null:l.property)&&i.getAttribute("http-equiv")===(l.httpEquiv==null?null:l.httpEquiv)&&i.getAttribute("charset")===(l.charSet==null?null:l.charSet)){u.splice(c,1);break t}}i=n.createElement(a),Qe(i,a,l),n.head.appendChild(i);break;default:throw Error(f(468,a))}i[Ze]=e,He(i),a=i}e.stateNode=a}else ko(n,e.type,e.stateNode);else e.stateNode=Zo(n,a,e.memoizedProps);else i!==a?(i===null?l.stateNode!==null&&(l=l.stateNode,l.parentNode.removeChild(l)):i.count--,a===null?ko(n,e.type,e.stateNode):Zo(n,a,e.memoizedProps)):a===null&&e.stateNode!==null&&oc(e,e.memoizedProps,l.memoizedProps)}break;case 27:ut(t,e),ct(e),a&512&&(Oe||l===null||Nt(l,l.return)),l!==null&&a&4&&oc(e,e.memoizedProps,l.memoizedProps);break;case 5:if(ut(t,e),ct(e),a&512&&(Oe||l===null||Nt(l,l.return)),e.flags&32){n=e.stateNode;try{Ll(n,"")}catch(S){pe(e,e.return,S)}}a&4&&e.stateNode!=null&&(n=e.memoizedProps,oc(e,n,l!==null?l.memoizedProps:n)),a&1024&&(hc=!0);break;case 6:if(ut(t,e),ct(e),a&4){if(e.stateNode===null)throw Error(f(162));a=e.memoizedProps,l=e.stateNode;try{l.nodeValue=a}catch(S){pe(e,e.return,S)}}break;case 3:if(Ni=null,n=Tt,Tt=Ai(t.containerInfo),ut(t,e),Tt=n,ct(e),a&4&&l!==null&&l.memoizedState.isDehydrated)try{vn(t.containerInfo)}catch(S){pe(e,e.return,S)}hc&&(hc=!1,Ff(e));break;case 4:a=Tt,Tt=Ai(e.stateNode.containerInfo),ut(t,e),ct(e),Tt=a;break;case 12:ut(t,e),ct(e);break;case 13:ut(t,e),ct(e),e.child.flags&8192&&e.memoizedState!==null!=(l!==null&&l.memoizedState!==null)&&(Sc=zt()),a&4&&(a=e.updateQueue,a!==null&&(e.updateQueue=null,mc(e,a)));break;case 22:n=e.memoizedState!==null;var r=l!==null&&l.memoizedState!==null,b=Lt,z=Oe;if(Lt=b||n,Oe=z||r,ut(t,e),Oe=z,Lt=b,ct(e),a&8192)e:for(t=e.stateNode,t._visibility=n?t._visibility&-2:t._visibility|1,n&&(l===null||r||Lt||Oe||Ul(e)),l=null,t=e;;){if(t.tag===5||t.tag===26){if(l===null){r=l=t;try{if(i=r.stateNode,n)u=i.style,typeof u.setProperty=="function"?u.setProperty("display","none","important"):u.display="none";else{c=r.stateNode;var j=r.memoizedProps.style,x=j!=null&&j.hasOwnProperty("display")?j.display:null;c.style.display=x==null||typeof x=="boolean"?"":(""+x).trim()}}catch(S){pe(r,r.return,S)}}}else if(t.tag===6){if(l===null){r=t;try{r.stateNode.nodeValue=n?"":r.memoizedProps}catch(S){pe(r,r.return,S)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;l===t&&(l=null),t=t.return}l===t&&(l=null),t.sibling.return=t.return,t=t.sibling}a&4&&(a=e.updateQueue,a!==null&&(l=a.retryQueue,l!==null&&(a.retryQueue=null,mc(e,l))));break;case 19:ut(t,e),ct(e),a&4&&(a=e.updateQueue,a!==null&&(e.updateQueue=null,mc(e,a)));break;case 30:break;case 21:break;default:ut(t,e),ct(e)}}function ct(e){var t=e.flags;if(t&2){try{for(var l,a=e.return;a!==null;){if(Qf(a)){l=a;break}a=a.return}if(l==null)throw Error(f(160));switch(l.tag){case 27:var n=l.stateNode,i=dc(e);di(e,i,n);break;case 5:var u=l.stateNode;l.flags&32&&(Ll(u,""),l.flags&=-33);var c=dc(e);di(e,c,u);break;case 3:case 4:var r=l.stateNode.containerInfo,b=dc(e);gc(e,b,r);break;default:throw Error(f(161))}}catch(z){pe(e,e.return,z)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Ff(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Ff(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function al(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)kf(e,t.alternate,t),t=t.sibling}function Ul(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:ll(4,t,t.return),Ul(t);break;case 1:Nt(t,t.return);var l=t.stateNode;typeof l.componentWillUnmount=="function"&&Lf(t,t.return,l),Ul(t);break;case 27:fn(t.stateNode);case 26:case 5:Nt(t,t.return),Ul(t);break;case 22:t.memoizedState===null&&Ul(t);break;case 30:Ul(t);break;default:Ul(t)}e=e.sibling}}function nl(e,t,l){for(l=l&&(t.subtreeFlags&8772)!==0,t=t.child;t!==null;){var a=t.alternate,n=e,i=t,u=i.flags;switch(i.tag){case 0:case 11:case 15:nl(n,i,l),Ia(4,i);break;case 1:if(nl(n,i,l),a=i,n=a.stateNode,typeof n.componentDidMount=="function")try{n.componentDidMount()}catch(b){pe(a,a.return,b)}if(a=i,n=a.updateQueue,n!==null){var c=a.stateNode;try{var r=n.shared.hiddenCallbacks;if(r!==null)for(n.shared.hiddenCallbacks=null,n=0;n<r.length;n++)Ar(r[n],c)}catch(b){pe(a,a.return,b)}}l&&u&64&&Gf(i),en(i,i.return);break;case 27:Zf(i);case 26:case 5:nl(n,i,l),l&&a===null&&u&4&&Xf(i),en(i,i.return);break;case 12:nl(n,i,l);break;case 13:nl(n,i,l),l&&u&4&&$f(n,i);break;case 22:i.memoizedState===null&&nl(n,i,l),en(i,i.return);break;case 30:break;default:nl(n,i,l)}t=t.sibling}}function pc(e,t){var l=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(l=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==l&&(e!=null&&e.refCount++,l!=null&&qa(l))}function bc(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&qa(e))}function Ot(e,t,l,a){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)Pf(e,t,l,a),t=t.sibling}function Pf(e,t,l,a){var n=t.flags;switch(t.tag){case 0:case 11:case 15:Ot(e,t,l,a),n&2048&&Ia(9,t);break;case 1:Ot(e,t,l,a);break;case 3:Ot(e,t,l,a),n&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&qa(e)));break;case 12:if(n&2048){Ot(e,t,l,a),e=t.stateNode;try{var i=t.memoizedProps,u=i.id,c=i.onPostCommit;typeof c=="function"&&c(u,t.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(r){pe(t,t.return,r)}}else Ot(e,t,l,a);break;case 13:Ot(e,t,l,a);break;case 23:break;case 22:i=t.stateNode,u=t.alternate,t.memoizedState!==null?i._visibility&2?Ot(e,t,l,a):tn(e,t):i._visibility&2?Ot(e,t,l,a):(i._visibility|=2,ua(e,t,l,a,(t.subtreeFlags&10256)!==0)),n&2048&&pc(u,t);break;case 24:Ot(e,t,l,a),n&2048&&bc(t.alternate,t);break;default:Ot(e,t,l,a)}}function ua(e,t,l,a,n){for(n=n&&(t.subtreeFlags&10256)!==0,t=t.child;t!==null;){var i=e,u=t,c=l,r=a,b=u.flags;switch(u.tag){case 0:case 11:case 15:ua(i,u,c,r,n),Ia(8,u);break;case 23:break;case 22:var z=u.stateNode;u.memoizedState!==null?z._visibility&2?ua(i,u,c,r,n):tn(i,u):(z._visibility|=2,ua(i,u,c,r,n)),n&&b&2048&&pc(u.alternate,u);break;case 24:ua(i,u,c,r,n),n&&b&2048&&bc(u.alternate,u);break;default:ua(i,u,c,r,n)}t=t.sibling}}function tn(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var l=e,a=t,n=a.flags;switch(a.tag){case 22:tn(l,a),n&2048&&pc(a.alternate,a);break;case 24:tn(l,a),n&2048&&bc(a.alternate,a);break;default:tn(l,a)}t=t.sibling}}var ln=8192;function ca(e){if(e.subtreeFlags&ln)for(e=e.child;e!==null;)If(e),e=e.sibling}function If(e){switch(e.tag){case 26:ca(e),e.flags&ln&&e.memoizedState!==null&&Cg(Tt,e.memoizedState,e.memoizedProps);break;case 5:ca(e);break;case 3:case 4:var t=Tt;Tt=Ai(e.stateNode.containerInfo),ca(e),Tt=t;break;case 22:e.memoizedState===null&&(t=e.alternate,t!==null&&t.memoizedState!==null?(t=ln,ln=16777216,ca(e),ln=t):ca(e));break;default:ca(e)}}function eo(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function an(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var l=0;l<t.length;l++){var a=t[l];Ye=a,lo(a,e)}eo(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)to(e),e=e.sibling}function to(e){switch(e.tag){case 0:case 11:case 15:an(e),e.flags&2048&&ll(9,e,e.return);break;case 3:an(e);break;case 12:an(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,gi(e)):an(e);break;default:an(e)}}function gi(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var l=0;l<t.length;l++){var a=t[l];Ye=a,lo(a,e)}eo(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:ll(8,t,t.return),gi(t);break;case 22:l=t.stateNode,l._visibility&2&&(l._visibility&=-3,gi(t));break;default:gi(t)}e=e.sibling}}function lo(e,t){for(;Ye!==null;){var l=Ye;switch(l.tag){case 0:case 11:case 15:ll(8,l,t);break;case 23:case 22:if(l.memoizedState!==null&&l.memoizedState.cachePool!==null){var a=l.memoizedState.cachePool.pool;a!=null&&a.refCount++}break;case 24:qa(l.memoizedState.cache)}if(a=l.child,a!==null)a.return=l,Ye=a;else e:for(l=e;Ye!==null;){a=Ye;var n=a.sibling,i=a.return;if(Kf(a),a===l){Ye=null;break e}if(n!==null){n.return=i,Ye=n;break e}Ye=i}}}var P0={getCacheForType:function(e){var t=Ve(Re),l=t.data.get(e);return l===void 0&&(l=e(),t.data.set(e,l)),l}},I0=typeof WeakMap=="function"?WeakMap:Map,se=0,be=null,I=null,le=0,re=0,st=null,il=!1,sa=!1,vc=!1,Qt=0,Ae=0,ul=0,Ml=0,xc=0,xt=0,ra=0,nn=null,Ie=null,yc=!1,Sc=0,hi=1/0,mi=null,cl=null,Xe=0,sl=null,fa=null,oa=0,Tc=0,Ec=null,ao=null,un=0,zc=null;function rt(){if((se&2)!==0&&le!==0)return le&-le;if(T.T!==null){var e=Pl;return e!==0?e:Uc()}return vs()}function no(){xt===0&&(xt=(le&536870912)===0||ue?hs():536870912);var e=vt.current;return e!==null&&(e.flags|=32),xt}function ft(e,t,l){(e===be&&(re===2||re===9)||e.cancelPendingCommit!==null)&&(da(e,0),rl(e,le,xt,!1)),Ea(e,l),((se&2)===0||e!==be)&&(e===be&&((se&2)===0&&(Ml|=l),Ae===4&&rl(e,le,xt,!1)),Dt(e))}function io(e,t,l){if((se&6)!==0)throw Error(f(327));var a=!l&&(t&124)===0&&(t&e.expiredLanes)===0||Ta(e,t),n=a?lg(e,t):Nc(e,t,!0),i=a;do{if(n===0){sa&&!a&&rl(e,t,0,!1);break}else{if(l=e.current.alternate,i&&!eg(l)){n=Nc(e,t,!1),i=!1;continue}if(n===2){if(i=t,e.errorRecoveryDisabledLanes&i)var u=0;else u=e.pendingLanes&-536870913,u=u!==0?u:u&536870912?536870912:0;if(u!==0){t=u;e:{var c=e;n=nn;var r=c.current.memoizedState.isDehydrated;if(r&&(da(c,u).flags|=256),u=Nc(c,u,!1),u!==2){if(vc&&!r){c.errorRecoveryDisabledLanes|=i,Ml|=i,n=4;break e}i=Ie,Ie=n,i!==null&&(Ie===null?Ie=i:Ie.push.apply(Ie,i))}n=u}if(i=!1,n!==2)continue}}if(n===1){da(e,0),rl(e,t,0,!0);break}e:{switch(a=e,i=n,i){case 0:case 1:throw Error(f(345));case 4:if((t&4194048)!==t)break;case 6:rl(a,t,xt,!il);break e;case 2:Ie=null;break;case 3:case 5:break;default:throw Error(f(329))}if((t&62914560)===t&&(n=Sc+300-zt(),10<n)){if(rl(a,t,xt,!il),jn(a,0,!0)!==0)break e;a.timeoutHandle=Ho(uo.bind(null,a,l,Ie,mi,yc,t,xt,Ml,ra,il,i,2,-0,0),n);break e}uo(a,l,Ie,mi,yc,t,xt,Ml,ra,il,i,0,-0,0)}}break}while(!0);Dt(e)}function uo(e,t,l,a,n,i,u,c,r,b,z,j,x,S){if(e.timeoutHandle=-1,j=t.subtreeFlags,(j&8192||(j&16785408)===16785408)&&(gn={stylesheets:null,count:0,unsuspend:Hg},If(t),j=Yg(),j!==null)){e.cancelPendingCommit=j(ho.bind(null,e,t,i,l,a,n,u,c,r,z,1,x,S)),rl(e,i,u,!b);return}ho(e,t,i,l,a,n,u,c,r)}function eg(e){for(var t=e;;){var l=t.tag;if((l===0||l===11||l===15)&&t.flags&16384&&(l=t.updateQueue,l!==null&&(l=l.stores,l!==null)))for(var a=0;a<l.length;a++){var n=l[a],i=n.getSnapshot;n=n.value;try{if(!nt(i(),n))return!1}catch{return!1}}if(l=t.child,t.subtreeFlags&16384&&l!==null)l.return=t,t=l;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function rl(e,t,l,a){t&=~xc,t&=~Ml,e.suspendedLanes|=t,e.pingedLanes&=~t,a&&(e.warmLanes|=t),a=e.expirationTimes;for(var n=t;0<n;){var i=31-at(n),u=1<<i;a[i]=-1,n&=~u}l!==0&&ps(e,l,t)}function pi(){return(se&6)===0?(cn(0),!1):!0}function Ac(){if(I!==null){if(re===0)var e=I.return;else e=I,Ht=jl=null,Xu(e),na=null,Wa=0,e=I;for(;e!==null;)qf(e.alternate,e),e=e.return;I=null}}function da(e,t){var l=e.timeoutHandle;l!==-1&&(e.timeoutHandle=-1,vg(l)),l=e.cancelPendingCommit,l!==null&&(e.cancelPendingCommit=null,l()),Ac(),be=e,I=l=Mt(e.current,null),le=t,re=0,st=null,il=!1,sa=Ta(e,t),vc=!1,ra=xt=xc=Ml=ul=Ae=0,Ie=nn=null,yc=!1,(t&8)!==0&&(t|=t&32);var a=e.entangledLanes;if(a!==0)for(e=e.entanglements,a&=t;0<a;){var n=31-at(a),i=1<<n;t|=e[n],a&=~i}return Qt=t,Bn(),l}function co(e,t){W=null,T.H=ai,t===La||t===Kn?(t=Er(),re=3):t===yr?(t=Er(),re=4):re=t===Af?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,st=t,I===null&&(Ae=1,si(e,ht(t,e.current)))}function so(){var e=T.H;return T.H=ai,e===null?ai:e}function ro(){var e=T.A;return T.A=P0,e}function jc(){Ae=4,il||(le&4194048)!==le&&vt.current!==null||(sa=!0),(ul&134217727)===0&&(Ml&134217727)===0||be===null||rl(be,le,xt,!1)}function Nc(e,t,l){var a=se;se|=2;var n=so(),i=ro();(be!==e||le!==t)&&(mi=null,da(e,t)),t=!1;var u=Ae;e:do try{if(re!==0&&I!==null){var c=I,r=st;switch(re){case 8:Ac(),u=6;break e;case 3:case 2:case 9:case 6:vt.current===null&&(t=!0);var b=re;if(re=0,st=null,ga(e,c,r,b),l&&sa){u=0;break e}break;default:b=re,re=0,st=null,ga(e,c,r,b)}}tg(),u=Ae;break}catch(z){co(e,z)}while(!0);return t&&e.shellSuspendCounter++,Ht=jl=null,se=a,T.H=n,T.A=i,I===null&&(be=null,le=0,Bn()),u}function tg(){for(;I!==null;)fo(I)}function lg(e,t){var l=se;se|=2;var a=so(),n=ro();be!==e||le!==t?(mi=null,hi=zt()+500,da(e,t)):sa=Ta(e,t);e:do try{if(re!==0&&I!==null){t=I;var i=st;t:switch(re){case 1:re=0,st=null,ga(e,t,i,1);break;case 2:case 9:if(Sr(i)){re=0,st=null,oo(t);break}t=function(){re!==2&&re!==9||be!==e||(re=7),Dt(e)},i.then(t,t);break e;case 3:re=7;break e;case 4:re=5;break e;case 7:Sr(i)?(re=0,st=null,oo(t)):(re=0,st=null,ga(e,t,i,7));break;case 5:var u=null;switch(I.tag){case 26:u=I.memoizedState;case 5:case 27:var c=I;if(!u||Ko(u)){re=0,st=null;var r=c.sibling;if(r!==null)I=r;else{var b=c.return;b!==null?(I=b,bi(b)):I=null}break t}}re=0,st=null,ga(e,t,i,5);break;case 6:re=0,st=null,ga(e,t,i,6);break;case 8:Ac(),Ae=6;break e;default:throw Error(f(462))}}ag();break}catch(z){co(e,z)}while(!0);return Ht=jl=null,T.H=a,T.A=n,se=l,I!==null?0:(be=null,le=0,Bn(),Ae)}function ag(){for(;I!==null&&!Ad();)fo(I)}function fo(e){var t=Yf(e.alternate,e,Qt);e.memoizedProps=e.pendingProps,t===null?bi(e):I=t}function oo(e){var t=e,l=t.alternate;switch(t.tag){case 15:case 0:t=Uf(l,t,t.pendingProps,t.type,void 0,le);break;case 11:t=Uf(l,t,t.pendingProps,t.type.render,t.ref,le);break;case 5:Xu(t);default:qf(l,t),t=I=or(t,Qt),t=Yf(l,t,Qt)}e.memoizedProps=e.pendingProps,t===null?bi(e):I=t}function ga(e,t,l,a){Ht=jl=null,Xu(t),na=null,Wa=0;var n=t.return;try{if(k0(e,n,t,l,le)){Ae=1,si(e,ht(l,e.current)),I=null;return}}catch(i){if(n!==null)throw I=n,i;Ae=1,si(e,ht(l,e.current)),I=null;return}t.flags&32768?(ue||a===1?e=!0:sa||(le&536870912)!==0?e=!1:(il=e=!0,(a===2||a===9||a===3||a===6)&&(a=vt.current,a!==null&&a.tag===13&&(a.flags|=16384))),go(t,e)):bi(t)}function bi(e){var t=e;do{if((t.flags&32768)!==0){go(t,il);return}e=t.return;var l=J0(t.alternate,t,Qt);if(l!==null){I=l;return}if(t=t.sibling,t!==null){I=t;return}I=t=e}while(t!==null);Ae===0&&(Ae=5)}function go(e,t){do{var l=$0(e.alternate,e);if(l!==null){l.flags&=32767,I=l;return}if(l=e.return,l!==null&&(l.flags|=32768,l.subtreeFlags=0,l.deletions=null),!t&&(e=e.sibling,e!==null)){I=e;return}I=e=l}while(e!==null);Ae=6,I=null}function ho(e,t,l,a,n,i,u,c,r){e.cancelPendingCommit=null;do vi();while(Xe!==0);if((se&6)!==0)throw Error(f(327));if(t!==null){if(t===e.current)throw Error(f(177));if(i=t.lanes|t.childLanes,i|=bu,Hd(e,l,i,u,c,r),e===be&&(I=be=null,le=0),fa=t,sl=e,oa=l,Tc=i,Ec=n,ao=a,(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?(e.callbackNode=null,e.callbackPriority=0,cg(En,function(){return xo(),null})):(e.callbackNode=null,e.callbackPriority=0),a=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||a){a=T.T,T.T=null,n=U.p,U.p=2,u=se,se|=4;try{W0(e,t,l)}finally{se=u,U.p=n,T.T=a}}Xe=1,mo(),po(),bo()}}function mo(){if(Xe===1){Xe=0;var e=sl,t=fa,l=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||l){l=T.T,T.T=null;var a=U.p;U.p=2;var n=se;se|=4;try{Wf(t,e);var i=qc,u=tr(e.containerInfo),c=i.focusedElem,r=i.selectionRange;if(u!==c&&c&&c.ownerDocument&&er(c.ownerDocument.documentElement,c)){if(r!==null&&du(c)){var b=r.start,z=r.end;if(z===void 0&&(z=b),"selectionStart"in c)c.selectionStart=b,c.selectionEnd=Math.min(z,c.value.length);else{var j=c.ownerDocument||document,x=j&&j.defaultView||window;if(x.getSelection){var S=x.getSelection(),V=c.textContent.length,Q=Math.min(r.start,V),de=r.end===void 0?Q:Math.min(r.end,V);!S.extend&&Q>de&&(u=de,de=Q,Q=u);var h=Is(c,Q),d=Is(c,de);if(h&&d&&(S.rangeCount!==1||S.anchorNode!==h.node||S.anchorOffset!==h.offset||S.focusNode!==d.node||S.focusOffset!==d.offset)){var p=j.createRange();p.setStart(h.node,h.offset),S.removeAllRanges(),Q>de?(S.addRange(p),S.extend(d.node,d.offset)):(p.setEnd(d.node,d.offset),S.addRange(p))}}}}for(j=[],S=c;S=S.parentNode;)S.nodeType===1&&j.push({element:S,left:S.scrollLeft,top:S.scrollTop});for(typeof c.focus=="function"&&c.focus(),c=0;c<j.length;c++){var A=j[c];A.element.scrollLeft=A.left,A.element.scrollTop=A.top}}_i=!!Bc,qc=Bc=null}finally{se=n,U.p=a,T.T=l}}e.current=t,Xe=2}}function po(){if(Xe===2){Xe=0;var e=sl,t=fa,l=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||l){l=T.T,T.T=null;var a=U.p;U.p=2;var n=se;se|=4;try{kf(e,t.alternate,t)}finally{se=n,U.p=a,T.T=l}}Xe=3}}function bo(){if(Xe===4||Xe===3){Xe=0,jd();var e=sl,t=fa,l=oa,a=ao;(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?Xe=5:(Xe=0,fa=sl=null,vo(e,e.pendingLanes));var n=e.pendingLanes;if(n===0&&(cl=null),Vi(l),t=t.stateNode,lt&&typeof lt.onCommitFiberRoot=="function")try{lt.onCommitFiberRoot(Sa,t,void 0,(t.current.flags&128)===128)}catch{}if(a!==null){t=T.T,n=U.p,U.p=2,T.T=null;try{for(var i=e.onRecoverableError,u=0;u<a.length;u++){var c=a[u];i(c.value,{componentStack:c.stack})}}finally{T.T=t,U.p=n}}(oa&3)!==0&&vi(),Dt(e),n=e.pendingLanes,(l&4194090)!==0&&(n&42)!==0?e===zc?un++:(un=0,zc=e):un=0,cn(0)}}function vo(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,qa(t)))}function vi(e){return mo(),po(),bo(),xo()}function xo(){if(Xe!==5)return!1;var e=sl,t=Tc;Tc=0;var l=Vi(oa),a=T.T,n=U.p;try{U.p=32>l?32:l,T.T=null,l=Ec,Ec=null;var i=sl,u=oa;if(Xe=0,fa=sl=null,oa=0,(se&6)!==0)throw Error(f(331));var c=se;if(se|=4,to(i.current),Pf(i,i.current,u,l),se=c,cn(0,!1),lt&&typeof lt.onPostCommitFiberRoot=="function")try{lt.onPostCommitFiberRoot(Sa,i)}catch{}return!0}finally{U.p=n,T.T=a,vo(e,t)}}function yo(e,t,l){t=ht(l,t),t=lc(e.stateNode,t,2),e=Pt(e,t,2),e!==null&&(Ea(e,2),Dt(e))}function pe(e,t,l){if(e.tag===3)yo(e,e,l);else for(;t!==null;){if(t.tag===3){yo(t,e,l);break}else if(t.tag===1){var a=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof a.componentDidCatch=="function"&&(cl===null||!cl.has(a))){e=ht(l,e),l=Ef(2),a=Pt(t,l,2),a!==null&&(zf(l,a,t,e),Ea(a,2),Dt(a));break}}t=t.return}}function Oc(e,t,l){var a=e.pingCache;if(a===null){a=e.pingCache=new I0;var n=new Set;a.set(t,n)}else n=a.get(t),n===void 0&&(n=new Set,a.set(t,n));n.has(l)||(vc=!0,n.add(l),e=ng.bind(null,e,t,l),t.then(e,e))}function ng(e,t,l){var a=e.pingCache;a!==null&&a.delete(t),e.pingedLanes|=e.suspendedLanes&l,e.warmLanes&=~l,be===e&&(le&l)===l&&(Ae===4||Ae===3&&(le&62914560)===le&&300>zt()-Sc?(se&2)===0&&da(e,0):xc|=l,ra===le&&(ra=0)),Dt(e)}function So(e,t){t===0&&(t=ms()),e=Jl(e,t),e!==null&&(Ea(e,t),Dt(e))}function ig(e){var t=e.memoizedState,l=0;t!==null&&(l=t.retryLane),So(e,l)}function ug(e,t){var l=0;switch(e.tag){case 13:var a=e.stateNode,n=e.memoizedState;n!==null&&(l=n.retryLane);break;case 19:a=e.stateNode;break;case 22:a=e.stateNode._retryCache;break;default:throw Error(f(314))}a!==null&&a.delete(t),So(e,l)}function cg(e,t){return Li(e,t)}var xi=null,ha=null,Dc=!1,yi=!1,_c=!1,Rl=0;function Dt(e){e!==ha&&e.next===null&&(ha===null?xi=ha=e:ha=ha.next=e),yi=!0,Dc||(Dc=!0,rg())}function cn(e,t){if(!_c&&yi){_c=!0;do for(var l=!1,a=xi;a!==null;){if(e!==0){var n=a.pendingLanes;if(n===0)var i=0;else{var u=a.suspendedLanes,c=a.pingedLanes;i=(1<<31-at(42|e)+1)-1,i&=n&~(u&~c),i=i&201326741?i&201326741|1:i?i|2:0}i!==0&&(l=!0,Ao(a,i))}else i=le,i=jn(a,a===be?i:0,a.cancelPendingCommit!==null||a.timeoutHandle!==-1),(i&3)===0||Ta(a,i)||(l=!0,Ao(a,i));a=a.next}while(l);_c=!1}}function sg(){To()}function To(){yi=Dc=!1;var e=0;Rl!==0&&(bg()&&(e=Rl),Rl=0);for(var t=zt(),l=null,a=xi;a!==null;){var n=a.next,i=Eo(a,t);i===0?(a.next=null,l===null?xi=n:l.next=n,n===null&&(ha=l)):(l=a,(e!==0||(i&3)!==0)&&(yi=!0)),a=n}cn(e)}function Eo(e,t){for(var l=e.suspendedLanes,a=e.pingedLanes,n=e.expirationTimes,i=e.pendingLanes&-62914561;0<i;){var u=31-at(i),c=1<<u,r=n[u];r===-1?((c&l)===0||(c&a)!==0)&&(n[u]=wd(c,t)):r<=t&&(e.expiredLanes|=c),i&=~c}if(t=be,l=le,l=jn(e,e===t?l:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),a=e.callbackNode,l===0||e===t&&(re===2||re===9)||e.cancelPendingCommit!==null)return a!==null&&a!==null&&Xi(a),e.callbackNode=null,e.callbackPriority=0;if((l&3)===0||Ta(e,l)){if(t=l&-l,t===e.callbackPriority)return t;switch(a!==null&&Xi(a),Vi(l)){case 2:case 8:l=ds;break;case 32:l=En;break;case 268435456:l=gs;break;default:l=En}return a=zo.bind(null,e),l=Li(l,a),e.callbackPriority=t,e.callbackNode=l,t}return a!==null&&a!==null&&Xi(a),e.callbackPriority=2,e.callbackNode=null,2}function zo(e,t){if(Xe!==0&&Xe!==5)return e.callbackNode=null,e.callbackPriority=0,null;var l=e.callbackNode;if(vi()&&e.callbackNode!==l)return null;var a=le;return a=jn(e,e===be?a:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),a===0?null:(io(e,a,t),Eo(e,zt()),e.callbackNode!=null&&e.callbackNode===l?zo.bind(null,e):null)}function Ao(e,t){if(vi())return null;io(e,t,!0)}function rg(){xg(function(){(se&6)!==0?Li(os,sg):To()})}function Uc(){return Rl===0&&(Rl=hs()),Rl}function jo(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:Un(""+e)}function No(e,t){var l=t.ownerDocument.createElement("input");return l.name=t.name,l.value=t.value,e.id&&l.setAttribute("form",e.id),t.parentNode.insertBefore(l,t),e=new FormData(e),l.parentNode.removeChild(l),e}function fg(e,t,l,a,n){if(t==="submit"&&l&&l.stateNode===n){var i=jo((n[$e]||null).action),u=a.submitter;u&&(t=(t=u[$e]||null)?jo(t.formAction):u.getAttribute("formAction"),t!==null&&(i=t,u=null));var c=new Hn("action","action",null,a,n);e.push({event:c,listeners:[{instance:null,listener:function(){if(a.defaultPrevented){if(Rl!==0){var r=u?No(n,u):new FormData(n);Fu(l,{pending:!0,data:r,method:n.method,action:i},null,r)}}else typeof i=="function"&&(c.preventDefault(),r=u?No(n,u):new FormData(n),Fu(l,{pending:!0,data:r,method:n.method,action:i},i,r))},currentTarget:n}]})}}for(var Mc=0;Mc<pu.length;Mc++){var Rc=pu[Mc],og=Rc.toLowerCase(),dg=Rc[0].toUpperCase()+Rc.slice(1);St(og,"on"+dg)}St(nr,"onAnimationEnd"),St(ir,"onAnimationIteration"),St(ur,"onAnimationStart"),St("dblclick","onDoubleClick"),St("focusin","onFocus"),St("focusout","onBlur"),St(D0,"onTransitionRun"),St(_0,"onTransitionStart"),St(U0,"onTransitionCancel"),St(cr,"onTransitionEnd"),Bl("onMouseEnter",["mouseout","mouseover"]),Bl("onMouseLeave",["mouseout","mouseover"]),Bl("onPointerEnter",["pointerout","pointerover"]),Bl("onPointerLeave",["pointerout","pointerover"]),bl("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),bl("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),bl("onBeforeInput",["compositionend","keypress","textInput","paste"]),bl("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),bl("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),bl("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var sn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),gg=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(sn));function Oo(e,t){t=(t&4)!==0;for(var l=0;l<e.length;l++){var a=e[l],n=a.event;a=a.listeners;e:{var i=void 0;if(t)for(var u=a.length-1;0<=u;u--){var c=a[u],r=c.instance,b=c.currentTarget;if(c=c.listener,r!==i&&n.isPropagationStopped())break e;i=c,n.currentTarget=b;try{i(n)}catch(z){ci(z)}n.currentTarget=null,i=r}else for(u=0;u<a.length;u++){if(c=a[u],r=c.instance,b=c.currentTarget,c=c.listener,r!==i&&n.isPropagationStopped())break e;i=c,n.currentTarget=b;try{i(n)}catch(z){ci(z)}n.currentTarget=null,i=r}}}}function ee(e,t){var l=t[ki];l===void 0&&(l=t[ki]=new Set);var a=e+"__bubble";l.has(a)||(Do(t,e,2,!1),l.add(a))}function wc(e,t,l){var a=0;t&&(a|=4),Do(l,e,a,t)}var Si="_reactListening"+Math.random().toString(36).slice(2);function Hc(e){if(!e[Si]){e[Si]=!0,ys.forEach(function(l){l!=="selectionchange"&&(gg.has(l)||wc(l,!1,e),wc(l,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Si]||(t[Si]=!0,wc("selectionchange",!1,t))}}function Do(e,t,l,a){switch(Io(t)){case 2:var n=Gg;break;case 8:n=Lg;break;default:n=$c}l=n.bind(null,t,l,e),n=void 0,!au||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(n=!0),a?n!==void 0?e.addEventListener(t,l,{capture:!0,passive:n}):e.addEventListener(t,l,!0):n!==void 0?e.addEventListener(t,l,{passive:n}):e.addEventListener(t,l,!1)}function Cc(e,t,l,a,n){var i=a;if((t&1)===0&&(t&2)===0&&a!==null)e:for(;;){if(a===null)return;var u=a.tag;if(u===3||u===4){var c=a.stateNode.containerInfo;if(c===n)break;if(u===4)for(u=a.return;u!==null;){var r=u.tag;if((r===3||r===4)&&u.stateNode.containerInfo===n)return;u=u.return}for(;c!==null;){if(u=Hl(c),u===null)return;if(r=u.tag,r===5||r===6||r===26||r===27){a=i=u;continue e}c=c.parentNode}}a=a.return}ws(function(){var b=i,z=tu(l),j=[];e:{var x=sr.get(e);if(x!==void 0){var S=Hn,V=e;switch(e){case"keypress":if(Rn(l)===0)break e;case"keydown":case"keyup":S=c0;break;case"focusin":V="focus",S=cu;break;case"focusout":V="blur",S=cu;break;case"beforeblur":case"afterblur":S=cu;break;case"click":if(l.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":S=Ys;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":S=$d;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":S=f0;break;case nr:case ir:case ur:S=Pd;break;case cr:S=d0;break;case"scroll":case"scrollend":S=Kd;break;case"wheel":S=h0;break;case"copy":case"cut":case"paste":S=e0;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":S=qs;break;case"toggle":case"beforetoggle":S=p0}var Q=(t&4)!==0,de=!Q&&(e==="scroll"||e==="scrollend"),h=Q?x!==null?x+"Capture":null:x;Q=[];for(var d=b,p;d!==null;){var A=d;if(p=A.stateNode,A=A.tag,A!==5&&A!==26&&A!==27||p===null||h===null||(A=ja(d,h),A!=null&&Q.push(rn(d,A,p))),de)break;d=d.return}0<Q.length&&(x=new S(x,V,null,l,z),j.push({event:x,listeners:Q}))}}if((t&7)===0){e:{if(x=e==="mouseover"||e==="pointerover",S=e==="mouseout"||e==="pointerout",x&&l!==eu&&(V=l.relatedTarget||l.fromElement)&&(Hl(V)||V[wl]))break e;if((S||x)&&(x=z.window===z?z:(x=z.ownerDocument)?x.defaultView||x.parentWindow:window,S?(V=l.relatedTarget||l.toElement,S=b,V=V?Hl(V):null,V!==null&&(de=O(V),Q=V.tag,V!==de||Q!==5&&Q!==27&&Q!==6)&&(V=null)):(S=null,V=b),S!==V)){if(Q=Ys,A="onMouseLeave",h="onMouseEnter",d="mouse",(e==="pointerout"||e==="pointerover")&&(Q=qs,A="onPointerLeave",h="onPointerEnter",d="pointer"),de=S==null?x:Aa(S),p=V==null?x:Aa(V),x=new Q(A,d+"leave",S,l,z),x.target=de,x.relatedTarget=p,A=null,Hl(z)===b&&(Q=new Q(h,d+"enter",V,l,z),Q.target=p,Q.relatedTarget=de,A=Q),de=A,S&&V)t:{for(Q=S,h=V,d=0,p=Q;p;p=ma(p))d++;for(p=0,A=h;A;A=ma(A))p++;for(;0<d-p;)Q=ma(Q),d--;for(;0<p-d;)h=ma(h),p--;for(;d--;){if(Q===h||h!==null&&Q===h.alternate)break t;Q=ma(Q),h=ma(h)}Q=null}else Q=null;S!==null&&_o(j,x,S,Q,!1),V!==null&&de!==null&&_o(j,de,V,Q,!0)}}e:{if(x=b?Aa(b):window,S=x.nodeName&&x.nodeName.toLowerCase(),S==="select"||S==="input"&&x.type==="file")var q=Ks;else if(Vs(x))if(Js)q=j0;else{q=z0;var P=E0}else S=x.nodeName,!S||S.toLowerCase()!=="input"||x.type!=="checkbox"&&x.type!=="radio"?b&&Ii(b.elementType)&&(q=Ks):q=A0;if(q&&(q=q(e,b))){ks(j,q,l,z);break e}P&&P(e,x,b),e==="focusout"&&b&&x.type==="number"&&b.memoizedProps.value!=null&&Pi(x,"number",x.value)}switch(P=b?Aa(b):window,e){case"focusin":(Vs(P)||P.contentEditable==="true")&&(Vl=P,gu=b,wa=null);break;case"focusout":wa=gu=Vl=null;break;case"mousedown":hu=!0;break;case"contextmenu":case"mouseup":case"dragend":hu=!1,lr(j,l,z);break;case"selectionchange":if(O0)break;case"keydown":case"keyup":lr(j,l,z)}var G;if(ru)e:{switch(e){case"compositionstart":var Z="onCompositionStart";break e;case"compositionend":Z="onCompositionEnd";break e;case"compositionupdate":Z="onCompositionUpdate";break e}Z=void 0}else Zl?Qs(e,l)&&(Z="onCompositionEnd"):e==="keydown"&&l.keyCode===229&&(Z="onCompositionStart");Z&&(Gs&&l.locale!=="ko"&&(Zl||Z!=="onCompositionStart"?Z==="onCompositionEnd"&&Zl&&(G=Hs()):(Jt=z,nu="value"in Jt?Jt.value:Jt.textContent,Zl=!0)),P=Ti(b,Z),0<P.length&&(Z=new Bs(Z,e,null,l,z),j.push({event:Z,listeners:P}),G?Z.data=G:(G=Zs(l),G!==null&&(Z.data=G)))),(G=v0?x0(e,l):y0(e,l))&&(Z=Ti(b,"onBeforeInput"),0<Z.length&&(P=new Bs("onBeforeInput","beforeinput",null,l,z),j.push({event:P,listeners:Z}),P.data=G)),fg(j,e,b,l,z)}Oo(j,t)})}function rn(e,t,l){return{instance:e,listener:t,currentTarget:l}}function Ti(e,t){for(var l=t+"Capture",a=[];e!==null;){var n=e,i=n.stateNode;if(n=n.tag,n!==5&&n!==26&&n!==27||i===null||(n=ja(e,l),n!=null&&a.unshift(rn(e,n,i)),n=ja(e,t),n!=null&&a.push(rn(e,n,i))),e.tag===3)return a;e=e.return}return[]}function ma(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function _o(e,t,l,a,n){for(var i=t._reactName,u=[];l!==null&&l!==a;){var c=l,r=c.alternate,b=c.stateNode;if(c=c.tag,r!==null&&r===a)break;c!==5&&c!==26&&c!==27||b===null||(r=b,n?(b=ja(l,i),b!=null&&u.unshift(rn(l,b,r))):n||(b=ja(l,i),b!=null&&u.push(rn(l,b,r)))),l=l.return}u.length!==0&&e.push({event:t,listeners:u})}var hg=/\r\n?/g,mg=/\u0000|\uFFFD/g;function Uo(e){return(typeof e=="string"?e:""+e).replace(hg,`
`).replace(mg,"")}function Mo(e,t){return t=Uo(t),Uo(e)===t}function Ei(){}function oe(e,t,l,a,n,i){switch(l){case"children":typeof a=="string"?t==="body"||t==="textarea"&&a===""||Ll(e,a):(typeof a=="number"||typeof a=="bigint")&&t!=="body"&&Ll(e,""+a);break;case"className":On(e,"class",a);break;case"tabIndex":On(e,"tabindex",a);break;case"dir":case"role":case"viewBox":case"width":case"height":On(e,l,a);break;case"style":Ms(e,a,i);break;case"data":if(t!=="object"){On(e,"data",a);break}case"src":case"href":if(a===""&&(t!=="a"||l!=="href")){e.removeAttribute(l);break}if(a==null||typeof a=="function"||typeof a=="symbol"||typeof a=="boolean"){e.removeAttribute(l);break}a=Un(""+a),e.setAttribute(l,a);break;case"action":case"formAction":if(typeof a=="function"){e.setAttribute(l,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof i=="function"&&(l==="formAction"?(t!=="input"&&oe(e,t,"name",n.name,n,null),oe(e,t,"formEncType",n.formEncType,n,null),oe(e,t,"formMethod",n.formMethod,n,null),oe(e,t,"formTarget",n.formTarget,n,null)):(oe(e,t,"encType",n.encType,n,null),oe(e,t,"method",n.method,n,null),oe(e,t,"target",n.target,n,null)));if(a==null||typeof a=="symbol"||typeof a=="boolean"){e.removeAttribute(l);break}a=Un(""+a),e.setAttribute(l,a);break;case"onClick":a!=null&&(e.onclick=Ei);break;case"onScroll":a!=null&&ee("scroll",e);break;case"onScrollEnd":a!=null&&ee("scrollend",e);break;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(f(61));if(l=a.__html,l!=null){if(n.children!=null)throw Error(f(60));e.innerHTML=l}}break;case"multiple":e.multiple=a&&typeof a!="function"&&typeof a!="symbol";break;case"muted":e.muted=a&&typeof a!="function"&&typeof a!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(a==null||typeof a=="function"||typeof a=="boolean"||typeof a=="symbol"){e.removeAttribute("xlink:href");break}l=Un(""+a),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",l);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":a!=null&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(l,""+a):e.removeAttribute(l);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":a&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(l,""):e.removeAttribute(l);break;case"capture":case"download":a===!0?e.setAttribute(l,""):a!==!1&&a!=null&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(l,a):e.removeAttribute(l);break;case"cols":case"rows":case"size":case"span":a!=null&&typeof a!="function"&&typeof a!="symbol"&&!isNaN(a)&&1<=a?e.setAttribute(l,a):e.removeAttribute(l);break;case"rowSpan":case"start":a==null||typeof a=="function"||typeof a=="symbol"||isNaN(a)?e.removeAttribute(l):e.setAttribute(l,a);break;case"popover":ee("beforetoggle",e),ee("toggle",e),Nn(e,"popover",a);break;case"xlinkActuate":_t(e,"http://www.w3.org/1999/xlink","xlink:actuate",a);break;case"xlinkArcrole":_t(e,"http://www.w3.org/1999/xlink","xlink:arcrole",a);break;case"xlinkRole":_t(e,"http://www.w3.org/1999/xlink","xlink:role",a);break;case"xlinkShow":_t(e,"http://www.w3.org/1999/xlink","xlink:show",a);break;case"xlinkTitle":_t(e,"http://www.w3.org/1999/xlink","xlink:title",a);break;case"xlinkType":_t(e,"http://www.w3.org/1999/xlink","xlink:type",a);break;case"xmlBase":_t(e,"http://www.w3.org/XML/1998/namespace","xml:base",a);break;case"xmlLang":_t(e,"http://www.w3.org/XML/1998/namespace","xml:lang",a);break;case"xmlSpace":_t(e,"http://www.w3.org/XML/1998/namespace","xml:space",a);break;case"is":Nn(e,"is",a);break;case"innerText":case"textContent":break;default:(!(2<l.length)||l[0]!=="o"&&l[0]!=="O"||l[1]!=="n"&&l[1]!=="N")&&(l=Vd.get(l)||l,Nn(e,l,a))}}function Yc(e,t,l,a,n,i){switch(l){case"style":Ms(e,a,i);break;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(f(61));if(l=a.__html,l!=null){if(n.children!=null)throw Error(f(60));e.innerHTML=l}}break;case"children":typeof a=="string"?Ll(e,a):(typeof a=="number"||typeof a=="bigint")&&Ll(e,""+a);break;case"onScroll":a!=null&&ee("scroll",e);break;case"onScrollEnd":a!=null&&ee("scrollend",e);break;case"onClick":a!=null&&(e.onclick=Ei);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!Ss.hasOwnProperty(l))e:{if(l[0]==="o"&&l[1]==="n"&&(n=l.endsWith("Capture"),t=l.slice(2,n?l.length-7:void 0),i=e[$e]||null,i=i!=null?i[l]:null,typeof i=="function"&&e.removeEventListener(t,i,n),typeof a=="function")){typeof i!="function"&&i!==null&&(l in e?e[l]=null:e.hasAttribute(l)&&e.removeAttribute(l)),e.addEventListener(t,a,n);break e}l in e?e[l]=a:a===!0?e.setAttribute(l,""):Nn(e,l,a)}}}function Qe(e,t,l){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":ee("error",e),ee("load",e);var a=!1,n=!1,i;for(i in l)if(l.hasOwnProperty(i)){var u=l[i];if(u!=null)switch(i){case"src":a=!0;break;case"srcSet":n=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(f(137,t));default:oe(e,t,i,u,l,null)}}n&&oe(e,t,"srcSet",l.srcSet,l,null),a&&oe(e,t,"src",l.src,l,null);return;case"input":ee("invalid",e);var c=i=u=n=null,r=null,b=null;for(a in l)if(l.hasOwnProperty(a)){var z=l[a];if(z!=null)switch(a){case"name":n=z;break;case"type":u=z;break;case"checked":r=z;break;case"defaultChecked":b=z;break;case"value":i=z;break;case"defaultValue":c=z;break;case"children":case"dangerouslySetInnerHTML":if(z!=null)throw Error(f(137,t));break;default:oe(e,t,a,z,l,null)}}Os(e,i,c,r,b,u,n,!1),Dn(e);return;case"select":ee("invalid",e),a=u=i=null;for(n in l)if(l.hasOwnProperty(n)&&(c=l[n],c!=null))switch(n){case"value":i=c;break;case"defaultValue":u=c;break;case"multiple":a=c;default:oe(e,t,n,c,l,null)}t=i,l=u,e.multiple=!!a,t!=null?Gl(e,!!a,t,!1):l!=null&&Gl(e,!!a,l,!0);return;case"textarea":ee("invalid",e),i=n=a=null;for(u in l)if(l.hasOwnProperty(u)&&(c=l[u],c!=null))switch(u){case"value":a=c;break;case"defaultValue":n=c;break;case"children":i=c;break;case"dangerouslySetInnerHTML":if(c!=null)throw Error(f(91));break;default:oe(e,t,u,c,l,null)}_s(e,a,n,i),Dn(e);return;case"option":for(r in l)if(l.hasOwnProperty(r)&&(a=l[r],a!=null))switch(r){case"selected":e.selected=a&&typeof a!="function"&&typeof a!="symbol";break;default:oe(e,t,r,a,l,null)}return;case"dialog":ee("beforetoggle",e),ee("toggle",e),ee("cancel",e),ee("close",e);break;case"iframe":case"object":ee("load",e);break;case"video":case"audio":for(a=0;a<sn.length;a++)ee(sn[a],e);break;case"image":ee("error",e),ee("load",e);break;case"details":ee("toggle",e);break;case"embed":case"source":case"link":ee("error",e),ee("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(b in l)if(l.hasOwnProperty(b)&&(a=l[b],a!=null))switch(b){case"children":case"dangerouslySetInnerHTML":throw Error(f(137,t));default:oe(e,t,b,a,l,null)}return;default:if(Ii(t)){for(z in l)l.hasOwnProperty(z)&&(a=l[z],a!==void 0&&Yc(e,t,z,a,l,void 0));return}}for(c in l)l.hasOwnProperty(c)&&(a=l[c],a!=null&&oe(e,t,c,a,l,null))}function pg(e,t,l,a){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var n=null,i=null,u=null,c=null,r=null,b=null,z=null;for(S in l){var j=l[S];if(l.hasOwnProperty(S)&&j!=null)switch(S){case"checked":break;case"value":break;case"defaultValue":r=j;default:a.hasOwnProperty(S)||oe(e,t,S,null,a,j)}}for(var x in a){var S=a[x];if(j=l[x],a.hasOwnProperty(x)&&(S!=null||j!=null))switch(x){case"type":i=S;break;case"name":n=S;break;case"checked":b=S;break;case"defaultChecked":z=S;break;case"value":u=S;break;case"defaultValue":c=S;break;case"children":case"dangerouslySetInnerHTML":if(S!=null)throw Error(f(137,t));break;default:S!==j&&oe(e,t,x,S,a,j)}}Fi(e,u,c,r,b,z,i,n);return;case"select":S=u=c=x=null;for(i in l)if(r=l[i],l.hasOwnProperty(i)&&r!=null)switch(i){case"value":break;case"multiple":S=r;default:a.hasOwnProperty(i)||oe(e,t,i,null,a,r)}for(n in a)if(i=a[n],r=l[n],a.hasOwnProperty(n)&&(i!=null||r!=null))switch(n){case"value":x=i;break;case"defaultValue":c=i;break;case"multiple":u=i;default:i!==r&&oe(e,t,n,i,a,r)}t=c,l=u,a=S,x!=null?Gl(e,!!l,x,!1):!!a!=!!l&&(t!=null?Gl(e,!!l,t,!0):Gl(e,!!l,l?[]:"",!1));return;case"textarea":S=x=null;for(c in l)if(n=l[c],l.hasOwnProperty(c)&&n!=null&&!a.hasOwnProperty(c))switch(c){case"value":break;case"children":break;default:oe(e,t,c,null,a,n)}for(u in a)if(n=a[u],i=l[u],a.hasOwnProperty(u)&&(n!=null||i!=null))switch(u){case"value":x=n;break;case"defaultValue":S=n;break;case"children":break;case"dangerouslySetInnerHTML":if(n!=null)throw Error(f(91));break;default:n!==i&&oe(e,t,u,n,a,i)}Ds(e,x,S);return;case"option":for(var V in l)if(x=l[V],l.hasOwnProperty(V)&&x!=null&&!a.hasOwnProperty(V))switch(V){case"selected":e.selected=!1;break;default:oe(e,t,V,null,a,x)}for(r in a)if(x=a[r],S=l[r],a.hasOwnProperty(r)&&x!==S&&(x!=null||S!=null))switch(r){case"selected":e.selected=x&&typeof x!="function"&&typeof x!="symbol";break;default:oe(e,t,r,x,a,S)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var Q in l)x=l[Q],l.hasOwnProperty(Q)&&x!=null&&!a.hasOwnProperty(Q)&&oe(e,t,Q,null,a,x);for(b in a)if(x=a[b],S=l[b],a.hasOwnProperty(b)&&x!==S&&(x!=null||S!=null))switch(b){case"children":case"dangerouslySetInnerHTML":if(x!=null)throw Error(f(137,t));break;default:oe(e,t,b,x,a,S)}return;default:if(Ii(t)){for(var de in l)x=l[de],l.hasOwnProperty(de)&&x!==void 0&&!a.hasOwnProperty(de)&&Yc(e,t,de,void 0,a,x);for(z in a)x=a[z],S=l[z],!a.hasOwnProperty(z)||x===S||x===void 0&&S===void 0||Yc(e,t,z,x,a,S);return}}for(var h in l)x=l[h],l.hasOwnProperty(h)&&x!=null&&!a.hasOwnProperty(h)&&oe(e,t,h,null,a,x);for(j in a)x=a[j],S=l[j],!a.hasOwnProperty(j)||x===S||x==null&&S==null||oe(e,t,j,x,a,S)}var Bc=null,qc=null;function zi(e){return e.nodeType===9?e:e.ownerDocument}function Ro(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function wo(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function Gc(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Lc=null;function bg(){var e=window.event;return e&&e.type==="popstate"?e===Lc?!1:(Lc=e,!0):(Lc=null,!1)}var Ho=typeof setTimeout=="function"?setTimeout:void 0,vg=typeof clearTimeout=="function"?clearTimeout:void 0,Co=typeof Promise=="function"?Promise:void 0,xg=typeof queueMicrotask=="function"?queueMicrotask:typeof Co<"u"?function(e){return Co.resolve(null).then(e).catch(yg)}:Ho;function yg(e){setTimeout(function(){throw e})}function fl(e){return e==="head"}function Yo(e,t){var l=t,a=0,n=0;do{var i=l.nextSibling;if(e.removeChild(l),i&&i.nodeType===8)if(l=i.data,l==="/$"){if(0<a&&8>a){l=a;var u=e.ownerDocument;if(l&1&&fn(u.documentElement),l&2&&fn(u.body),l&4)for(l=u.head,fn(l),u=l.firstChild;u;){var c=u.nextSibling,r=u.nodeName;u[za]||r==="SCRIPT"||r==="STYLE"||r==="LINK"&&u.rel.toLowerCase()==="stylesheet"||l.removeChild(u),u=c}}if(n===0){e.removeChild(i),vn(t);return}n--}else l==="$"||l==="$?"||l==="$!"?n++:a=l.charCodeAt(0)-48;else a=0;l=i}while(l);vn(t)}function Xc(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var l=t;switch(t=t.nextSibling,l.nodeName){case"HTML":case"HEAD":case"BODY":Xc(l),Ki(l);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(l.rel.toLowerCase()==="stylesheet")continue}e.removeChild(l)}}function Sg(e,t,l,a){for(;e.nodeType===1;){var n=l;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!a&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(a){if(!e[za])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(i=e.getAttribute("rel"),i==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(i!==n.rel||e.getAttribute("href")!==(n.href==null||n.href===""?null:n.href)||e.getAttribute("crossorigin")!==(n.crossOrigin==null?null:n.crossOrigin)||e.getAttribute("title")!==(n.title==null?null:n.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(i=e.getAttribute("src"),(i!==(n.src==null?null:n.src)||e.getAttribute("type")!==(n.type==null?null:n.type)||e.getAttribute("crossorigin")!==(n.crossOrigin==null?null:n.crossOrigin))&&i&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var i=n.name==null?null:""+n.name;if(n.type==="hidden"&&e.getAttribute("name")===i)return e}else return e;if(e=Et(e.nextSibling),e===null)break}return null}function Tg(e,t,l){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!l||(e=Et(e.nextSibling),e===null))return null;return e}function Qc(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState==="complete"}function Eg(e,t){var l=e.ownerDocument;if(e.data!=="$?"||l.readyState==="complete")t();else{var a=function(){t(),l.removeEventListener("DOMContentLoaded",a)};l.addEventListener("DOMContentLoaded",a),e._reactRetry=a}}function Et(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="F!"||t==="F")break;if(t==="/$")return null}}return e}var Zc=null;function Bo(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var l=e.data;if(l==="$"||l==="$!"||l==="$?"){if(t===0)return e;t--}else l==="/$"&&t++}e=e.previousSibling}return null}function qo(e,t,l){switch(t=zi(l),e){case"html":if(e=t.documentElement,!e)throw Error(f(452));return e;case"head":if(e=t.head,!e)throw Error(f(453));return e;case"body":if(e=t.body,!e)throw Error(f(454));return e;default:throw Error(f(451))}}function fn(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);Ki(e)}var yt=new Map,Go=new Set;function Ai(e){return typeof e.getRootNode=="function"?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var Zt=U.d;U.d={f:zg,r:Ag,D:jg,C:Ng,L:Og,m:Dg,X:Ug,S:_g,M:Mg};function zg(){var e=Zt.f(),t=pi();return e||t}function Ag(e){var t=Cl(e);t!==null&&t.tag===5&&t.type==="form"?nf(t):Zt.r(e)}var pa=typeof document>"u"?null:document;function Lo(e,t,l){var a=pa;if(a&&typeof t=="string"&&t){var n=gt(t);n='link[rel="'+e+'"][href="'+n+'"]',typeof l=="string"&&(n+='[crossorigin="'+l+'"]'),Go.has(n)||(Go.add(n),e={rel:e,crossOrigin:l,href:t},a.querySelector(n)===null&&(t=a.createElement("link"),Qe(t,"link",e),He(t),a.head.appendChild(t)))}}function jg(e){Zt.D(e),Lo("dns-prefetch",e,null)}function Ng(e,t){Zt.C(e,t),Lo("preconnect",e,t)}function Og(e,t,l){Zt.L(e,t,l);var a=pa;if(a&&e&&t){var n='link[rel="preload"][as="'+gt(t)+'"]';t==="image"&&l&&l.imageSrcSet?(n+='[imagesrcset="'+gt(l.imageSrcSet)+'"]',typeof l.imageSizes=="string"&&(n+='[imagesizes="'+gt(l.imageSizes)+'"]')):n+='[href="'+gt(e)+'"]';var i=n;switch(t){case"style":i=ba(e);break;case"script":i=va(e)}yt.has(i)||(e=H({rel:"preload",href:t==="image"&&l&&l.imageSrcSet?void 0:e,as:t},l),yt.set(i,e),a.querySelector(n)!==null||t==="style"&&a.querySelector(on(i))||t==="script"&&a.querySelector(dn(i))||(t=a.createElement("link"),Qe(t,"link",e),He(t),a.head.appendChild(t)))}}function Dg(e,t){Zt.m(e,t);var l=pa;if(l&&e){var a=t&&typeof t.as=="string"?t.as:"script",n='link[rel="modulepreload"][as="'+gt(a)+'"][href="'+gt(e)+'"]',i=n;switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":i=va(e)}if(!yt.has(i)&&(e=H({rel:"modulepreload",href:e},t),yt.set(i,e),l.querySelector(n)===null)){switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(l.querySelector(dn(i)))return}a=l.createElement("link"),Qe(a,"link",e),He(a),l.head.appendChild(a)}}}function _g(e,t,l){Zt.S(e,t,l);var a=pa;if(a&&e){var n=Yl(a).hoistableStyles,i=ba(e);t=t||"default";var u=n.get(i);if(!u){var c={loading:0,preload:null};if(u=a.querySelector(on(i)))c.loading=5;else{e=H({rel:"stylesheet",href:e,"data-precedence":t},l),(l=yt.get(i))&&Vc(e,l);var r=u=a.createElement("link");He(r),Qe(r,"link",e),r._p=new Promise(function(b,z){r.onload=b,r.onerror=z}),r.addEventListener("load",function(){c.loading|=1}),r.addEventListener("error",function(){c.loading|=2}),c.loading|=4,ji(u,t,a)}u={type:"stylesheet",instance:u,count:1,state:c},n.set(i,u)}}}function Ug(e,t){Zt.X(e,t);var l=pa;if(l&&e){var a=Yl(l).hoistableScripts,n=va(e),i=a.get(n);i||(i=l.querySelector(dn(n)),i||(e=H({src:e,async:!0},t),(t=yt.get(n))&&kc(e,t),i=l.createElement("script"),He(i),Qe(i,"link",e),l.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},a.set(n,i))}}function Mg(e,t){Zt.M(e,t);var l=pa;if(l&&e){var a=Yl(l).hoistableScripts,n=va(e),i=a.get(n);i||(i=l.querySelector(dn(n)),i||(e=H({src:e,async:!0,type:"module"},t),(t=yt.get(n))&&kc(e,t),i=l.createElement("script"),He(i),Qe(i,"link",e),l.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},a.set(n,i))}}function Xo(e,t,l,a){var n=(n=k.current)?Ai(n):null;if(!n)throw Error(f(446));switch(e){case"meta":case"title":return null;case"style":return typeof l.precedence=="string"&&typeof l.href=="string"?(t=ba(l.href),l=Yl(n).hoistableStyles,a=l.get(t),a||(a={type:"style",instance:null,count:0,state:null},l.set(t,a)),a):{type:"void",instance:null,count:0,state:null};case"link":if(l.rel==="stylesheet"&&typeof l.href=="string"&&typeof l.precedence=="string"){e=ba(l.href);var i=Yl(n).hoistableStyles,u=i.get(e);if(u||(n=n.ownerDocument||n,u={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},i.set(e,u),(i=n.querySelector(on(e)))&&!i._p&&(u.instance=i,u.state.loading=5),yt.has(e)||(l={rel:"preload",as:"style",href:l.href,crossOrigin:l.crossOrigin,integrity:l.integrity,media:l.media,hrefLang:l.hrefLang,referrerPolicy:l.referrerPolicy},yt.set(e,l),i||Rg(n,e,l,u.state))),t&&a===null)throw Error(f(528,""));return u}if(t&&a!==null)throw Error(f(529,""));return null;case"script":return t=l.async,l=l.src,typeof l=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(t=va(l),l=Yl(n).hoistableScripts,a=l.get(t),a||(a={type:"script",instance:null,count:0,state:null},l.set(t,a)),a):{type:"void",instance:null,count:0,state:null};default:throw Error(f(444,e))}}function ba(e){return'href="'+gt(e)+'"'}function on(e){return'link[rel="stylesheet"]['+e+"]"}function Qo(e){return H({},e,{"data-precedence":e.precedence,precedence:null})}function Rg(e,t,l,a){e.querySelector('link[rel="preload"][as="style"]['+t+"]")?a.loading=1:(t=e.createElement("link"),a.preload=t,t.addEventListener("load",function(){return a.loading|=1}),t.addEventListener("error",function(){return a.loading|=2}),Qe(t,"link",l),He(t),e.head.appendChild(t))}function va(e){return'[src="'+gt(e)+'"]'}function dn(e){return"script[async]"+e}function Zo(e,t,l){if(t.count++,t.instance===null)switch(t.type){case"style":var a=e.querySelector('style[data-href~="'+gt(l.href)+'"]');if(a)return t.instance=a,He(a),a;var n=H({},l,{"data-href":l.href,"data-precedence":l.precedence,href:null,precedence:null});return a=(e.ownerDocument||e).createElement("style"),He(a),Qe(a,"style",n),ji(a,l.precedence,e),t.instance=a;case"stylesheet":n=ba(l.href);var i=e.querySelector(on(n));if(i)return t.state.loading|=4,t.instance=i,He(i),i;a=Qo(l),(n=yt.get(n))&&Vc(a,n),i=(e.ownerDocument||e).createElement("link"),He(i);var u=i;return u._p=new Promise(function(c,r){u.onload=c,u.onerror=r}),Qe(i,"link",a),t.state.loading|=4,ji(i,l.precedence,e),t.instance=i;case"script":return i=va(l.src),(n=e.querySelector(dn(i)))?(t.instance=n,He(n),n):(a=l,(n=yt.get(i))&&(a=H({},l),kc(a,n)),e=e.ownerDocument||e,n=e.createElement("script"),He(n),Qe(n,"link",a),e.head.appendChild(n),t.instance=n);case"void":return null;default:throw Error(f(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(a=t.instance,t.state.loading|=4,ji(a,l.precedence,e));return t.instance}function ji(e,t,l){for(var a=l.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),n=a.length?a[a.length-1]:null,i=n,u=0;u<a.length;u++){var c=a[u];if(c.dataset.precedence===t)i=c;else if(i!==n)break}i?i.parentNode.insertBefore(e,i.nextSibling):(t=l.nodeType===9?l.head:l,t.insertBefore(e,t.firstChild))}function Vc(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function kc(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var Ni=null;function Vo(e,t,l){if(Ni===null){var a=new Map,n=Ni=new Map;n.set(l,a)}else n=Ni,a=n.get(l),a||(a=new Map,n.set(l,a));if(a.has(e))return a;for(a.set(e,null),l=l.getElementsByTagName(e),n=0;n<l.length;n++){var i=l[n];if(!(i[za]||i[Ze]||e==="link"&&i.getAttribute("rel")==="stylesheet")&&i.namespaceURI!=="http://www.w3.org/2000/svg"){var u=i.getAttribute(t)||"";u=e+u;var c=a.get(u);c?c.push(i):a.set(u,[i])}}return a}function ko(e,t,l){e=e.ownerDocument||e,e.head.insertBefore(l,t==="title"?e.querySelector("head > title"):null)}function wg(e,t,l){if(l===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function Ko(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}var gn=null;function Hg(){}function Cg(e,t,l){if(gn===null)throw Error(f(475));var a=gn;if(t.type==="stylesheet"&&(typeof l.media!="string"||matchMedia(l.media).matches!==!1)&&(t.state.loading&4)===0){if(t.instance===null){var n=ba(l.href),i=e.querySelector(on(n));if(i){e=i._p,e!==null&&typeof e=="object"&&typeof e.then=="function"&&(a.count++,a=Oi.bind(a),e.then(a,a)),t.state.loading|=4,t.instance=i,He(i);return}i=e.ownerDocument||e,l=Qo(l),(n=yt.get(n))&&Vc(l,n),i=i.createElement("link"),He(i);var u=i;u._p=new Promise(function(c,r){u.onload=c,u.onerror=r}),Qe(i,"link",l),t.instance=i}a.stylesheets===null&&(a.stylesheets=new Map),a.stylesheets.set(t,e),(e=t.state.preload)&&(t.state.loading&3)===0&&(a.count++,t=Oi.bind(a),e.addEventListener("load",t),e.addEventListener("error",t))}}function Yg(){if(gn===null)throw Error(f(475));var e=gn;return e.stylesheets&&e.count===0&&Kc(e,e.stylesheets),0<e.count?function(t){var l=setTimeout(function(){if(e.stylesheets&&Kc(e,e.stylesheets),e.unsuspend){var a=e.unsuspend;e.unsuspend=null,a()}},6e4);return e.unsuspend=t,function(){e.unsuspend=null,clearTimeout(l)}}:null}function Oi(){if(this.count--,this.count===0){if(this.stylesheets)Kc(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var Di=null;function Kc(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Di=new Map,t.forEach(Bg,e),Di=null,Oi.call(e))}function Bg(e,t){if(!(t.state.loading&4)){var l=Di.get(e);if(l)var a=l.get(null);else{l=new Map,Di.set(e,l);for(var n=e.querySelectorAll("link[data-precedence],style[data-precedence]"),i=0;i<n.length;i++){var u=n[i];(u.nodeName==="LINK"||u.getAttribute("media")!=="not all")&&(l.set(u.dataset.precedence,u),a=u)}a&&l.set(null,a)}n=t.instance,u=n.getAttribute("data-precedence"),i=l.get(u)||a,i===a&&l.set(null,n),l.set(u,n),this.count++,a=Oi.bind(this),n.addEventListener("load",a),n.addEventListener("error",a),i?i.parentNode.insertBefore(n,i.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(n,e.firstChild)),t.state.loading|=4}}var hn={$$typeof:xe,Provider:null,Consumer:null,_currentValue:L,_currentValue2:L,_threadCount:0};function qg(e,t,l,a,n,i,u,c){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=Qi(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Qi(0),this.hiddenUpdates=Qi(null),this.identifierPrefix=a,this.onUncaughtError=n,this.onCaughtError=i,this.onRecoverableError=u,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=c,this.incompleteTransitions=new Map}function Jo(e,t,l,a,n,i,u,c,r,b,z,j){return e=new qg(e,t,l,u,c,r,b,j),t=1,i===!0&&(t|=24),i=it(3,null,null,t),e.current=i,i.stateNode=e,t=Ou(),t.refCount++,e.pooledCache=t,t.refCount++,i.memoizedState={element:a,isDehydrated:l,cache:t},Mu(i),e}function $o(e){return e?(e=$l,e):$l}function Wo(e,t,l,a,n,i){n=$o(n),a.context===null?a.context=n:a.pendingContext=n,a=Ft(t),a.payload={element:l},i=i===void 0?null:i,i!==null&&(a.callback=i),l=Pt(e,a,t),l!==null&&(ft(l,e,t),Qa(l,e,t))}function Fo(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var l=e.retryLane;e.retryLane=l!==0&&l<t?l:t}}function Jc(e,t){Fo(e,t),(e=e.alternate)&&Fo(e,t)}function Po(e){if(e.tag===13){var t=Jl(e,67108864);t!==null&&ft(t,e,67108864),Jc(e,67108864)}}var _i=!0;function Gg(e,t,l,a){var n=T.T;T.T=null;var i=U.p;try{U.p=2,$c(e,t,l,a)}finally{U.p=i,T.T=n}}function Lg(e,t,l,a){var n=T.T;T.T=null;var i=U.p;try{U.p=8,$c(e,t,l,a)}finally{U.p=i,T.T=n}}function $c(e,t,l,a){if(_i){var n=Wc(a);if(n===null)Cc(e,t,a,Ui,l),ed(e,a);else if(Qg(n,e,t,l,a))a.stopPropagation();else if(ed(e,a),t&4&&-1<Xg.indexOf(e)){for(;n!==null;){var i=Cl(n);if(i!==null)switch(i.tag){case 3:if(i=i.stateNode,i.current.memoizedState.isDehydrated){var u=pl(i.pendingLanes);if(u!==0){var c=i;for(c.pendingLanes|=2,c.entangledLanes|=2;u;){var r=1<<31-at(u);c.entanglements[1]|=r,u&=~r}Dt(i),(se&6)===0&&(hi=zt()+500,cn(0))}}break;case 13:c=Jl(i,2),c!==null&&ft(c,i,2),pi(),Jc(i,2)}if(i=Wc(a),i===null&&Cc(e,t,a,Ui,l),i===n)break;n=i}n!==null&&a.stopPropagation()}else Cc(e,t,a,null,l)}}function Wc(e){return e=tu(e),Fc(e)}var Ui=null;function Fc(e){if(Ui=null,e=Hl(e),e!==null){var t=O(e);if(t===null)e=null;else{var l=t.tag;if(l===13){if(e=C(t),e!==null)return e;e=null}else if(l===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return Ui=e,null}function Io(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Nd()){case os:return 2;case ds:return 8;case En:case Od:return 32;case gs:return 268435456;default:return 32}default:return 32}}var Pc=!1,ol=null,dl=null,gl=null,mn=new Map,pn=new Map,hl=[],Xg="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function ed(e,t){switch(e){case"focusin":case"focusout":ol=null;break;case"dragenter":case"dragleave":dl=null;break;case"mouseover":case"mouseout":gl=null;break;case"pointerover":case"pointerout":mn.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":pn.delete(t.pointerId)}}function bn(e,t,l,a,n,i){return e===null||e.nativeEvent!==i?(e={blockedOn:t,domEventName:l,eventSystemFlags:a,nativeEvent:i,targetContainers:[n]},t!==null&&(t=Cl(t),t!==null&&Po(t)),e):(e.eventSystemFlags|=a,t=e.targetContainers,n!==null&&t.indexOf(n)===-1&&t.push(n),e)}function Qg(e,t,l,a,n){switch(t){case"focusin":return ol=bn(ol,e,t,l,a,n),!0;case"dragenter":return dl=bn(dl,e,t,l,a,n),!0;case"mouseover":return gl=bn(gl,e,t,l,a,n),!0;case"pointerover":var i=n.pointerId;return mn.set(i,bn(mn.get(i)||null,e,t,l,a,n)),!0;case"gotpointercapture":return i=n.pointerId,pn.set(i,bn(pn.get(i)||null,e,t,l,a,n)),!0}return!1}function td(e){var t=Hl(e.target);if(t!==null){var l=O(t);if(l!==null){if(t=l.tag,t===13){if(t=C(l),t!==null){e.blockedOn=t,Cd(e.priority,function(){if(l.tag===13){var a=rt();a=Zi(a);var n=Jl(l,a);n!==null&&ft(n,l,a),Jc(l,a)}});return}}else if(t===3&&l.stateNode.current.memoizedState.isDehydrated){e.blockedOn=l.tag===3?l.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Mi(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var l=Wc(e.nativeEvent);if(l===null){l=e.nativeEvent;var a=new l.constructor(l.type,l);eu=a,l.target.dispatchEvent(a),eu=null}else return t=Cl(l),t!==null&&Po(t),e.blockedOn=l,!1;t.shift()}return!0}function ld(e,t,l){Mi(e)&&l.delete(t)}function Zg(){Pc=!1,ol!==null&&Mi(ol)&&(ol=null),dl!==null&&Mi(dl)&&(dl=null),gl!==null&&Mi(gl)&&(gl=null),mn.forEach(ld),pn.forEach(ld)}function Ri(e,t){e.blockedOn===t&&(e.blockedOn=null,Pc||(Pc=!0,g.unstable_scheduleCallback(g.unstable_NormalPriority,Zg)))}var wi=null;function ad(e){wi!==e&&(wi=e,g.unstable_scheduleCallback(g.unstable_NormalPriority,function(){wi===e&&(wi=null);for(var t=0;t<e.length;t+=3){var l=e[t],a=e[t+1],n=e[t+2];if(typeof a!="function"){if(Fc(a||l)===null)continue;break}var i=Cl(l);i!==null&&(e.splice(t,3),t-=3,Fu(i,{pending:!0,data:n,method:l.method,action:a},a,n))}}))}function vn(e){function t(r){return Ri(r,e)}ol!==null&&Ri(ol,e),dl!==null&&Ri(dl,e),gl!==null&&Ri(gl,e),mn.forEach(t),pn.forEach(t);for(var l=0;l<hl.length;l++){var a=hl[l];a.blockedOn===e&&(a.blockedOn=null)}for(;0<hl.length&&(l=hl[0],l.blockedOn===null);)td(l),l.blockedOn===null&&hl.shift();if(l=(e.ownerDocument||e).$$reactFormReplay,l!=null)for(a=0;a<l.length;a+=3){var n=l[a],i=l[a+1],u=n[$e]||null;if(typeof i=="function")u||ad(l);else if(u){var c=null;if(i&&i.hasAttribute("formAction")){if(n=i,u=i[$e]||null)c=u.formAction;else if(Fc(n)!==null)continue}else c=u.action;typeof c=="function"?l[a+1]=c:(l.splice(a,3),a-=3),ad(l)}}}function Ic(e){this._internalRoot=e}Hi.prototype.render=Ic.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(f(409));var l=t.current,a=rt();Wo(l,a,e,t,null,null)},Hi.prototype.unmount=Ic.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Wo(e.current,2,null,e,null,null),pi(),t[wl]=null}};function Hi(e){this._internalRoot=e}Hi.prototype.unstable_scheduleHydration=function(e){if(e){var t=vs();e={blockedOn:null,target:e,priority:t};for(var l=0;l<hl.length&&t!==0&&t<hl[l].priority;l++);hl.splice(l,0,e),l===0&&td(e)}};var nd=m.version;if(nd!=="19.1.0")throw Error(f(527,nd,"19.1.0"));U.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(f(188)):(e=Object.keys(e).join(","),Error(f(268,e)));return e=D(t),e=e!==null?v(e):null,e=e===null?null:e.stateNode,e};var Vg={bundleType:0,version:"19.1.0",rendererPackageName:"react-dom",currentDispatcherRef:T,reconcilerVersion:"19.1.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Ci=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Ci.isDisabled&&Ci.supportsFiber)try{Sa=Ci.inject(Vg),lt=Ci}catch{}}return yn.createRoot=function(e,t){if(!E(e))throw Error(f(299));var l=!1,a="",n=xf,i=yf,u=Sf,c=null;return t!=null&&(t.unstable_strictMode===!0&&(l=!0),t.identifierPrefix!==void 0&&(a=t.identifierPrefix),t.onUncaughtError!==void 0&&(n=t.onUncaughtError),t.onCaughtError!==void 0&&(i=t.onCaughtError),t.onRecoverableError!==void 0&&(u=t.onRecoverableError),t.unstable_transitionCallbacks!==void 0&&(c=t.unstable_transitionCallbacks)),t=Jo(e,1,!1,null,null,l,a,n,i,u,c,null),e[wl]=t.current,Hc(e),new Ic(t)},yn.hydrateRoot=function(e,t,l){if(!E(e))throw Error(f(299));var a=!1,n="",i=xf,u=yf,c=Sf,r=null,b=null;return l!=null&&(l.unstable_strictMode===!0&&(a=!0),l.identifierPrefix!==void 0&&(n=l.identifierPrefix),l.onUncaughtError!==void 0&&(i=l.onUncaughtError),l.onCaughtError!==void 0&&(u=l.onCaughtError),l.onRecoverableError!==void 0&&(c=l.onRecoverableError),l.unstable_transitionCallbacks!==void 0&&(r=l.unstable_transitionCallbacks),l.formState!==void 0&&(b=l.formState)),t=Jo(e,1,!0,t,l??null,a,n,i,u,c,r,b),t.context=$o(null),l=t.current,a=rt(),a=Zi(a),n=Ft(a),n.callback=null,Pt(l,n,a),l=a,t.current.lanes=l,Ea(t,l),Dt(t),e[wl]=t.current,Hc(e),new Hi(t)},yn.version="19.1.0",yn}var md;function nh(){if(md)return ls.exports;md=1;function g(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(g)}catch(m){console.error(m)}}return g(),ls.exports=ah(),ls.exports}var ih=nh();const uh=yd(ih);/*! Capacitor: https://capacitorjs.com/ - MIT License */var xa;(function(g){g.Unimplemented="UNIMPLEMENTED",g.Unavailable="UNAVAILABLE"})(xa||(xa={}));class us extends Error{constructor(m,y,f){super(m),this.message=m,this.code=y,this.data=f}}const ch=g=>{var m,y;return g!=null&&g.androidBridge?"android":!((y=(m=g==null?void 0:g.webkit)===null||m===void 0?void 0:m.messageHandlers)===null||y===void 0)&&y.bridge?"ios":"web"},sh=g=>{const m=g.CapacitorCustomPlatform||null,y=g.Capacitor||{},f=y.Plugins=y.Plugins||{},E=()=>m!==null?m.name:ch(g),O=()=>E()!=="web",C=_=>{const M=v.get(_);return!!(M!=null&&M.platforms.has(E())||Y(_))},Y=_=>{var M;return(M=y.PluginHeaders)===null||M===void 0?void 0:M.find(F=>F.name===_)},D=_=>g.console.error(_),v=new Map,H=(_,M={})=>{const F=v.get(_);if(F)return console.warn(`Capacitor plugin "${_}" already registered. Cannot register plugins twice.`),F.proxy;const K=E(),ve=Y(_);let ce;const ot=async()=>(!ce&&K in M?ce=typeof M[K]=="function"?ce=await M[K]():ce=M[K]:m!==null&&!ce&&"web"in M&&(ce=typeof M.web=="function"?ce=await M.web():ce=M.web),ce),et=(ae,he)=>{var Me,je;if(ve){const me=ve==null?void 0:ve.methods.find(Ee=>he===Ee.name);if(me)return me.rtype==="promise"?Ee=>y.nativePromise(_,he.toString(),Ee):(Ee,Je)=>y.nativeCallback(_,he.toString(),Ee,Je);if(ae)return(Me=ae[he])===null||Me===void 0?void 0:Me.bind(ae)}else{if(ae)return(je=ae[he])===null||je===void 0?void 0:je.bind(ae);throw new us(`"${_}" plugin is not implemented on ${K}`,xa.Unimplemented)}},xe=ae=>{let he;const Me=(...je)=>{const me=ot().then(Ee=>{const Je=et(Ee,ae);if(Je){const R=Je(...je);return he=R==null?void 0:R.remove,R}else throw new us(`"${_}.${ae}()" is not implemented on ${K}`,xa.Unimplemented)});return ae==="addListener"&&(me.remove=async()=>he()),me};return Me.toString=()=>`${ae.toString()}() { [capacitor code] }`,Object.defineProperty(Me,"name",{value:ae,writable:!1,configurable:!1}),Me},qe=xe("addListener"),$=xe("removeListener"),Ge=(ae,he)=>{const Me=qe({eventName:ae},he),je=async()=>{const Ee=await Me;$({eventName:ae,callbackId:Ee},he)},me=new Promise(Ee=>Me.then(()=>Ee({remove:je})));return me.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await je()},me},De=new Proxy({},{get(ae,he){switch(he){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return ve?Ge:qe;case"removeListener":return $;default:return xe(he)}}});return f[_]=De,v.set(_,{name:_,proxy:De,platforms:new Set([...Object.keys(M),...ve?[K]:[]])}),De};return y.convertFileSrc||(y.convertFileSrc=_=>_),y.getPlatform=E,y.handleError=D,y.isNativePlatform=O,y.isPluginAvailable=C,y.registerPlugin=H,y.Exception=us,y.DEBUG=!!y.DEBUG,y.isLoggingEnabled=!!y.isLoggingEnabled,y},rh=g=>g.Capacitor=sh(g),ya=rh(typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}),Bi=ya.registerPlugin;class Sd{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(m,y){let f=!1;this.listeners[m]||(this.listeners[m]=[],f=!0),this.listeners[m].push(y);const O=this.windowListeners[m];O&&!O.registered&&this.addWindowListener(O),f&&this.sendRetainedArgumentsForEvent(m);const C=async()=>this.removeListener(m,y);return Promise.resolve({remove:C})}async removeAllListeners(){this.listeners={};for(const m in this.windowListeners)this.removeWindowListener(this.windowListeners[m]);this.windowListeners={}}notifyListeners(m,y,f){const E=this.listeners[m];if(!E){if(f){let O=this.retainedEventArguments[m];O||(O=[]),O.push(y),this.retainedEventArguments[m]=O}return}E.forEach(O=>O(y))}hasListeners(m){var y;return!!(!((y=this.listeners[m])===null||y===void 0)&&y.length)}registerWindowListener(m,y){this.windowListeners[y]={registered:!1,windowEventName:m,pluginEventName:y,handler:f=>{this.notifyListeners(y,f)}}}unimplemented(m="not implemented"){return new ya.Exception(m,xa.Unimplemented)}unavailable(m="not available"){return new ya.Exception(m,xa.Unavailable)}async removeListener(m,y){const f=this.listeners[m];if(!f)return;const E=f.indexOf(y);this.listeners[m].splice(E,1),this.listeners[m].length||this.removeWindowListener(this.windowListeners[m])}addWindowListener(m){window.addEventListener(m.windowEventName,m.handler),m.registered=!0}removeWindowListener(m){m&&(window.removeEventListener(m.windowEventName,m.handler),m.registered=!1)}sendRetainedArgumentsForEvent(m){const y=this.retainedEventArguments[m];y&&(delete this.retainedEventArguments[m],y.forEach(f=>{this.notifyListeners(m,f)}))}}const pd=g=>encodeURIComponent(g).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),bd=g=>g.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class fh extends Sd{async getCookies(){const m=document.cookie,y={};return m.split(";").forEach(f=>{if(f.length<=0)return;let[E,O]=f.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");E=bd(E).trim(),O=bd(O).trim(),y[E]=O}),y}async setCookie(m){try{const y=pd(m.key),f=pd(m.value),E=`; expires=${(m.expires||"").replace("expires=","")}`,O=(m.path||"/").replace("path=",""),C=m.url!=null&&m.url.length>0?`domain=${m.url}`:"";document.cookie=`${y}=${f||""}${E}; path=${O}; ${C};`}catch(y){return Promise.reject(y)}}async deleteCookie(m){try{document.cookie=`${m.key}=; Max-Age=0`}catch(y){return Promise.reject(y)}}async clearCookies(){try{const m=document.cookie.split(";")||[];for(const y of m)document.cookie=y.replace(/^ +/,"").replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(m){return Promise.reject(m)}}async clearAllCookies(){try{await this.clearCookies()}catch(m){return Promise.reject(m)}}}Bi("CapacitorCookies",{web:()=>new fh});const oh=async g=>new Promise((m,y)=>{const f=new FileReader;f.onload=()=>{const E=f.result;m(E.indexOf(",")>=0?E.split(",")[1]:E)},f.onerror=E=>y(E),f.readAsDataURL(g)}),dh=(g={})=>{const m=Object.keys(g);return Object.keys(g).map(E=>E.toLocaleLowerCase()).reduce((E,O,C)=>(E[O]=g[m[C]],E),{})},gh=(g,m=!0)=>g?Object.entries(g).reduce((f,E)=>{const[O,C]=E;let Y,D;return Array.isArray(C)?(D="",C.forEach(v=>{Y=m?encodeURIComponent(v):v,D+=`${O}=${Y}&`}),D.slice(0,-1)):(Y=m?encodeURIComponent(C):C,D=`${O}=${Y}`),`${f}&${D}`},"").substr(1):null,hh=(g,m={})=>{const y=Object.assign({method:g.method||"GET",headers:g.headers},m),E=dh(g.headers)["content-type"]||"";if(typeof g.data=="string")y.body=g.data;else if(E.includes("application/x-www-form-urlencoded")){const O=new URLSearchParams;for(const[C,Y]of Object.entries(g.data||{}))O.set(C,Y);y.body=O.toString()}else if(E.includes("multipart/form-data")||g.data instanceof FormData){const O=new FormData;if(g.data instanceof FormData)g.data.forEach((Y,D)=>{O.append(D,Y)});else for(const Y of Object.keys(g.data))O.append(Y,g.data[Y]);y.body=O;const C=new Headers(y.headers);C.delete("content-type"),y.headers=C}else(E.includes("application/json")||typeof g.data=="object")&&(y.body=JSON.stringify(g.data));return y};class mh extends Sd{async request(m){const y=hh(m,m.webFetchExtra),f=gh(m.params,m.shouldEncodeUrlParams),E=f?`${m.url}?${f}`:m.url,O=await fetch(E,y),C=O.headers.get("content-type")||"";let{responseType:Y="text"}=O.ok?m:{};C.includes("application/json")&&(Y="json");let D,v;switch(Y){case"arraybuffer":case"blob":v=await O.blob(),D=await oh(v);break;case"json":D=await O.json();break;case"document":case"text":default:D=await O.text()}const H={};return O.headers.forEach((_,M)=>{H[M]=_}),{data:D,headers:H,status:O.status,url:O.url}}async get(m){return this.request(Object.assign(Object.assign({},m),{method:"GET"}))}async post(m){return this.request(Object.assign(Object.assign({},m),{method:"POST"}))}async put(m){return this.request(Object.assign(Object.assign({},m),{method:"PUT"}))}async patch(m){return this.request(Object.assign(Object.assign({},m),{method:"PATCH"}))}async delete(m){return this.request(Object.assign(Object.assign({},m),{method:"DELETE"}))}}const fs=Bi("CapacitorHttp",{web:()=>new mh}),Sn="https://www.euscagency.com/etsm3/platforme/transport/apk",ph=async(g,m)=>{try{let y;if(ya.isNativePlatform())if(y=await fs.post({url:`${Sn}/login.php`,headers:{"Content-Type":"application/json"},data:{email:g,password:m}}),y.status===200){const f=y.data;if(f.status==="success"&&f.token)return{status:f.status,token:f.token};throw new Error("Autentificare eșuată")}else throw new Error("Autentificare eșuată");else{const f=await fetch(`${Sn}/login.php`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:g,password:m})});if(!f.ok)throw new Error(`HTTP error! status: ${f.status}`);const E=await f.json();if(E.status==="success"&&E.token)return{status:E.status,token:E.token};throw new Error("Autentificare eșuată")}}catch(y){throw console.error("Login error:",y),new Error("Eroare de conexiune la serverul de autentificare")}},bh=async(g,m)=>{try{const y=await fs.get({url:`${Sn}/vehicul.php?nr=${g}`,headers:{Authorization:`Bearer ${m}`,"Content-Type":"application/json"}});if(y.status===200){const f=y.data;return f.status==="success"&&Array.isArray(f.data)?f.data.map((E,O)=>{var C;return{id:((C=E.ikRoTrans)==null?void 0:C.toString())||`course_${O}`,name:`Transport ${E.codDeclarant} - ${E.ikRoTrans}`,departure_location:`${E.denumireLocStart||E.Vama}, ${E.Judet||""}`.trim().replace(/, $/,""),destination_location:`${E.denumireLocStop||E.VamaStop}, ${E.JudetStop||""}`.trim().replace(/, $/,""),departure_time:E.dataTransport||null,arrival_time:null,description:E.denumireDeclarant||"Transport marfă",status:1,uit:E.UIT,ikRoTrans:E.ikRoTrans,codDeclarant:E.codDeclarant,denumireDeclarant:E.denumireDeclarant,nrVehicul:E.nrVehicul,dataTransport:E.dataTransport,vama:E.Vama,birouVamal:E.BirouVamal,judet:E.Judet,vamaStop:E.VamaStop,birouVamalStop:E.BirouVamalStop,judetStop:E.JudetStop}}):[]}else throw new Error("Eroare la încărcarea curselor")}catch(y){throw console.error("Get vehicle courses error:",y),new Error("Eroare de conexiune la serverul de curse")}},vh=async g=>{try{let m;return ya.isNativePlatform()?m=await fs.post({url:`${Sn}/login.php`,headers:{"Content-Type":"application/json",Authorization:`Bearer ${g}`},data:{iesire:1}}):m=await fetch(`${Sn}/login.php`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g}`},body:JSON.stringify({iesire:1})}),m.status===200}catch(m){return console.error("Logout error:",m),!1}},xh=({onLogin:g})=>{const[m,y]=ge.useState(""),[f,E]=ge.useState(""),[O,C]=ge.useState(!1),[Y,D]=ge.useState(""),[v,H]=ge.useState(!1),_=async M=>{if(M.preventDefault(),!m||!f){D("Te rog să completezi toate câmpurile");return}C(!0),D("");try{if(m==="admin@itrack.app"&&f==="parola123"){console.log("Admin login detected"),g("ADMIN_TOKEN");return}const F=await ph(m,f);F.token?g(F.token):D(F.error||"Date de conectare incorecte")}catch(F){D(F.message||"Eroare la conectare")}finally{C(!1)}};return s.jsxs("div",{className:"login-container",children:[s.jsx("style",{children:`
          .login-container {
            min-height: 100vh;
            min-height: 100dvh;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 50%, #764ba2 75%, #1e3c72 100%);
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
          }
          
          .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(79, 70, 229, 0.2) 0%, transparent 50%);
            animation: backgroundFloat 25s ease-in-out infinite;
            pointer-events: none;
          }

          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
            padding: 20px;
            position: relative;
            overflow: hidden;
          }

          .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            pointer-events: none;
          }

          .login-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(25px);
            border-radius: 25px;
            padding: 50px;
            width: 100%;
            max-width: 500px;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: fadeInUp 0.8s ease-out;
          }

          .login-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 40px 80px rgba(79, 70, 229, 0.2);
          }

          .login-header {
            text-align: center;
            margin-bottom: 40px;
          }

          .transport-logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 25px;
            position: relative;
            animation: professionalFloat 4s ease-in-out infinite;
          }

          .corporate-emblem {
            width: 100%;
            height: 100%;
            position: relative;
            cursor: pointer;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .corporate-emblem:hover {
            transform: scale(1.08) translateY(-3px);
            filter: drop-shadow(0 25px 50px rgba(30, 64, 175, 0.25));
          }

          .emblem-ring {
            width: 90px;
            height: 90px;
            border: 2px solid rgba(59, 130, 246, 0.2);
            border-radius: 50%;
            position: relative;
            background: linear-gradient(145deg, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.9));
            box-shadow: 
              0 8px 32px rgba(30, 64, 175, 0.15),
              inset 0 2px 8px rgba(255, 255, 255, 0.7);
            animation: emblemGlow 6s ease-in-out infinite;
          }

          .emblem-core {
            width: 70px;
            height: 70px;
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 
              0 6px 20px rgba(0, 0, 0, 0.08),
              inset 0 1px 4px rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(226, 232, 240, 0.5);
          }

          .emblem-center {
            width: 50px;
            height: 50px;
            background: linear-gradient(145deg, #1e40af 0%, #3b82f6 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
              0 4px 16px rgba(30, 64, 175, 0.25),
              inset 0 1px 4px rgba(255, 255, 255, 0.3);
            animation: truckPulse 4s ease-in-out infinite;
          }

          .emblem-center i {
            font-size: 1.5rem;
            color: #ffffff;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
          }

          .corporate-emblem:hover .emblem-ring {
            animation: emblemRotate 2s linear infinite;
            box-shadow: 
              0 0 50px rgba(59, 130, 246, 0.4),
              inset 0 0 30px rgba(255, 255, 255, 0.2);
          }

          .corporate-emblem:hover .emblem-center {
            transform: scale(1.1);
            box-shadow: 
              0 12px 40px rgba(30, 64, 175, 0.5),
              inset 0 2px 12px rgba(255, 255, 255, 0.3);
          }

          .app-title {
            font-size: 2.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 15px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            animation: slideInFromLeft 0.8s ease-out;
            letter-spacing: -1px;
          }

          @keyframes elegantMotion {
            0%, 100% { 
              transform: translateX(0px) translateY(0px) rotate(0deg); 
            }
            25% { 
              transform: translateX(3px) translateY(-2px) rotate(0.3deg); 
            }
            50% { 
              transform: translateX(6px) translateY(0px) rotate(0deg); 
            }
            75% { 
              transform: translateX(3px) translateY(1px) rotate(-0.2deg); 
            }
          }

          @keyframes executiveFloat {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg); 
              box-shadow: 0 12px 35px rgba(30, 64, 175, 0.4);
            }
            50% { 
              transform: translateY(-3px) rotate(0.5deg); 
              box-shadow: 0 18px 45px rgba(30, 64, 175, 0.6);
            }
          }

          @keyframes corporateGlow {
            0%, 100% { 
              box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
              border-color: #e2e8f0;
            }
            50% { 
              box-shadow: 0 20px 50px rgba(59, 130, 246, 0.15);
              border-color: #bfdbfe;
            }
          }

          @keyframes professionalFloat {
            0%, 100% { 
              transform: translateY(0px); 
            }
            50% { 
              transform: translateY(-8px); 
            }
          }

          @keyframes truckPulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(1.05); 
              opacity: 0.9; 
            }
          }

          @keyframes gpsPulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(1.2); 
              opacity: 0.7; 
            }
          }

          @keyframes cargoFloat {
            0%, 100% { 
              transform: translateX(0px); 
            }
            50% { 
              transform: translateX(-3px); 
            }
          }

          @keyframes emblemGlow {
            0%, 100% { 
              box-shadow: 0 8px 32px rgba(30, 64, 175, 0.15), inset 0 2px 8px rgba(255, 255, 255, 0.7);
            }
            50% { 
              box-shadow: 0 12px 40px rgba(30, 64, 175, 0.25), inset 0 2px 12px rgba(255, 255, 255, 0.8);
            }
          }

          @keyframes truckPulse {
            0%, 100% { 
              transform: scale(1); 
              box-shadow: 0 4px 16px rgba(30, 64, 175, 0.25), inset 0 1px 4px rgba(255, 255, 255, 0.3);
            }
            50% { 
              transform: scale(1.02); 
              box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3), inset 0 1px 6px rgba(255, 255, 255, 0.4);
            }
          }

          @keyframes iconFloat {
            0%, 100% { 
              transform: translateY(0px); 
            }
            50% { 
              transform: translateY(-2px); 
            }
          }

          @keyframes inputIconFloat {
            0%, 100% { 
              transform: translateY(-50%) scale(1); 
            }
            50% { 
              transform: translateY(-50%) scale(1.05); 
            }
          }

          @keyframes executiveLEDPulse {
            0%, 100% { 
              opacity: 1; 
              box-shadow: 0 0 25px rgba(255, 255, 255, 0.9), 0 0 50px rgba(59, 130, 246, 0.6);
            }
            50% { 
              opacity: 0.8; 
              box-shadow: 0 0 35px rgba(255, 255, 255, 1), 0 0 70px rgba(59, 130, 246, 0.8);
            }
          }

          @keyframes headlightBeam {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }

          @keyframes antennaSignal {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(2deg); }
            75% { transform: rotate(-1deg); }
          }

          @keyframes connectivityPulse {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
              box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
            }
            50% { 
              opacity: 0.6; 
              transform: scale(1.2);
              box-shadow: 0 0 20px rgba(16, 185, 129, 0.9);
            }
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 25px;
          }

          .form-group {
            position: relative;
          }

          .form-input {
            width: 100%;
            padding: 18px 20px 18px 55px;
            border: 2px solid #e2e8f0;
            border-radius: 15px;
            background: #ffffff;
            color: #1e293b;
            font-size: 1.1rem;
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }

          .form-input::placeholder {
            color: #94a3b8;
            font-weight: 400;
          }

          .form-input:focus {
            outline: none;
            border-color: #4f46e5;
            background: #ffffff;
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.15);
            transform: translateY(-2px);
          }

          .input-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            color: #4f46e5;
            font-size: 1.2rem;
            pointer-events: none;
          }

          .password-container {
            position: relative;
          }

          .password-toggle {
            position: absolute;
            right: 18px;
            top: 50%;
            transform: translateY(-50%);
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            color: #64748b;
            cursor: pointer;
            font-size: 1.1rem;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.3s ease;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .password-toggle:hover {
            color: #4f46e5;
            background: #f1f5f9;
            border-color: #cbd5e1;
            transform: translateY(-50%) scale(1.05);
          }

          .login-button {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
            color: white;
            border: none;
            padding: 20px 30px;
            border-radius: 18px;
            font-size: 1.2rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 15px;
            box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4);
            letter-spacing: 0.5px;
            text-transform: uppercase;
            position: relative;
            overflow: hidden;
          }

          .login-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }

          .login-button:hover:not(:disabled) {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 25px 50px rgba(79, 70, 229, 0.5);
          }

          .login-button:hover:not(:disabled)::before {
            left: 100%;
          }

          .login-button:active:not(:disabled) {
            animation: buttonPress 0.2s ease;
          }

          .login-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .error-alert {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            backdrop-filter: blur(10px);
          }

          .error-icon {
            color: #ef4444;
            font-size: 1.2rem;
          }

          .error-text {
            color: #dc2626;
            font-weight: 500;
          }

          .login-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .version-info {
            color: #64748b;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .security-badges {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 25px;
          }

          .security-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #64748b;
            font-size: 0.85rem;
            font-weight: 500;
          }

          @media (max-width: 768px) {
            .login-card {
              margin: 20px;
              padding: 35px 25px;
              max-width: 90%;
            }
            
            .app-title {
              font-size: 2.2rem;
            }
            
            .app-subtitle {
              font-size: 1rem;
              letter-spacing: 1.5px;
            }
            
            .app-logo {
              width: 75px;
              height: 75px;
              margin-bottom: 20px;
            }
            
            .form-input {
              padding: 16px 18px 16px 50px;
              font-size: 1rem;
            }
            
            .input-icon {
              left: 16px;
              font-size: 1.1rem;
            }
            
            .password-toggle {
              right: 16px;
              width: 34px;
              height: 34px;
              padding: 6px;
            }
            
            .login-button {
              padding: 18px 25px;
              font-size: 1.1rem;
            }
          }

          @media (max-width: 480px) {
            .login-container {
              padding: 15px;
            }
            
            .login-card {
              margin: 15px;
              padding: 30px 20px;
              max-width: 95%;
            }
            
            .app-title {
              font-size: 1.8rem;
            }
            
            .app-subtitle {
              font-size: 0.9rem;
              letter-spacing: 1px;
            }
            
            .app-logo {
              width: 65px;
              height: 65px;
              margin-bottom: 15px;
            }
            
            .form-input {
              padding: 14px 16px 14px 45px;
              font-size: 0.95rem;
            }
            
            .input-icon {
              left: 14px;
              font-size: 1rem;
            }
            
            .password-toggle {
              right: 14px;
              width: 32px;
              height: 32px;
            }
            
            .login-button {
              padding: 16px 20px;
              font-size: 1rem;
            }
          }

          @media (min-width: 1024px) {
            .login-card {
              padding: 60px;
              max-width: 550px;
            }
            
            .app-title {
              font-size: 3.2rem;
            }
            
            .app-subtitle {
              font-size: 1.3rem;
            }
            
            .app-logo {
              width: 100px;
              height: 100px;
              margin-bottom: 30px;
            }
          }

          /* Safe area for mobile devices */
          @supports (padding: max(0px)) {
            .login-container {
              padding-top: max(20px, env(safe-area-inset-top));
              padding-bottom: max(20px, env(safe-area-inset-bottom));
              padding-left: max(20px, env(safe-area-inset-left));
              padding-right: max(20px, env(safe-area-inset-right));
            }
          }
        `}),s.jsxs("div",{className:"login-card",children:[s.jsxs("div",{className:"login-header",children:[s.jsx("div",{className:"transport-logo",children:s.jsx("div",{className:"corporate-emblem",children:s.jsx("div",{className:"emblem-ring",children:s.jsx("div",{className:"emblem-core",children:s.jsx("div",{className:"emblem-center",children:s.jsx("i",{className:"fas fa-truck"})})})})})}),s.jsx("h1",{className:"app-title",children:"iTrack"})]}),s.jsxs("form",{onSubmit:_,className:"login-form",children:[Y&&s.jsxs("div",{className:"error-alert",children:[s.jsx("i",{className:"fas fa-exclamation-triangle error-icon"}),s.jsx("span",{className:"error-text",children:Y})]}),s.jsx("div",{className:"form-group",children:s.jsxs("div",{className:"input-container",children:[s.jsx("input",{type:"email",className:"form-input",value:m,onChange:M=>y(M.target.value),disabled:O,placeholder:"Email",autoComplete:"email"}),s.jsx("i",{className:"fas fa-user input-icon"})]})}),s.jsx("div",{className:"form-group",children:s.jsxs("div",{className:"input-container",children:[s.jsx("input",{type:v?"text":"password",className:"form-input",value:f,onChange:M=>E(M.target.value),disabled:O,placeholder:"Parolă",autoComplete:"current-password"}),s.jsx("i",{className:"fas fa-lock input-icon"}),s.jsx("button",{type:"button",className:"password-toggle",onClick:()=>H(!v),disabled:O,title:v?"Ascunde parola":"Afișează parola",children:s.jsx("i",{className:`fas ${v?"fa-eye-slash":"fa-eye"}`})})]})}),s.jsx("button",{type:"submit",className:"login-button",disabled:O,children:O?s.jsxs(s.Fragment,{children:[s.jsx("div",{className:"loading-spinner"}),s.jsx("span",{children:"Autentificare în curs..."})]}):s.jsxs(s.Fragment,{children:[s.jsx("i",{className:"fas fa-sign-in-alt"}),s.jsx("span",{children:"Autentificare"})]})})]}),s.jsx("div",{className:"login-footer",children:s.jsxs("div",{className:"version-info",children:[s.jsx("i",{className:"fas fa-code-branch"}),s.jsx("span",{children:"Versiunea 1807.99"})]})})]})]})},Yi=Bi("GPSTracking");class yh{constructor(){id(this,"activeCourses",new Map)}async startTracking(m,y,f,E,O=2){var Y,D;console.log(`Starting GPS tracking for course ${m}, UIT: ${f}`);const C={courseId:m,vehicleNumber:y,uit:f,token:E,status:O};this.activeCourses.set(m,C),console.log("Plugin Diagnostics:"),console.log(`- Capacitor available: ${!!(window!=null&&window.Capacitor)}`),console.log(`- Platform: ${((Y=window==null?void 0:window.Capacitor)==null?void 0:Y.platform)||"unknown"}`),console.log(`- Available plugins: ${Object.keys(((D=window==null?void 0:window.Capacitor)==null?void 0:D.Plugins)||{})}`),console.log(`- User agent: ${navigator.userAgent}`),console.log(`- GPSTracking registered: ${typeof Yi<"u"}`);try{console.log("Calling Capacitor GPS plugin with parameters:"),console.log(`- Vehicle: ${y}`),console.log(`- Course: ${m}`),console.log(`- UIT: ${f}`),console.log(`- Status: ${O}`);const v=await Yi.startGPSTracking({vehicleNumber:y,courseId:m,uit:f,authToken:E,status:O});console.log("Capacitor GPS plugin response:",v),v&&v.success?(console.log(`GPS tracking started successfully for UIT: ${f}`),console.log("EnhancedGPSService will transmit coordinates every 60 seconds")):console.warn(`GPS tracking failed for UIT: ${f}`,v)}catch(v){throw console.error(`GPS plugin error for UIT: ${f}:`,v),console.error("Plugin not available on this platform"),v}}async stopTracking(m){console.log(`Stopping GPS tracking for course ${m}`);try{const y=await Yi.stopGPSTracking({courseId:m});console.log("GPS stop result:",y),this.activeCourses.delete(m)}catch(y){throw console.error(`Error stopping GPS tracking for ${m}:`,y),y}}getActiveCourses(){return Array.from(this.activeCourses.keys())}hasActiveCourses(){return this.activeCourses.size>0}async isTrackingActive(){try{return(await Yi.isGPSTrackingActive()).isActive}catch(m){return console.error("Error checking GPS tracking status:",m),!1}}}const Td=new yh,cs=(g,m,y,f,E=2)=>Td.startTracking(g,m,f,y,E),vd=g=>Td.stopTracking(g),Sh="modulepreload",Th=function(g){return"/"+g},xd={},Eh=function(m,y,f){let E=Promise.resolve();if(y&&y.length>0){let C=function(v){return Promise.all(v.map(H=>Promise.resolve(H).then(_=>({status:"fulfilled",value:_}),_=>({status:"rejected",reason:_}))))};document.getElementsByTagName("link");const Y=document.querySelector("meta[property=csp-nonce]"),D=(Y==null?void 0:Y.nonce)||(Y==null?void 0:Y.getAttribute("nonce"));E=C(y.map(v=>{if(v=Th(v),v in xd)return;xd[v]=!0;const H=v.endsWith(".css"),_=H?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${v}"]${_}`))return;const M=document.createElement("link");if(M.rel=H?"stylesheet":Sh,H||(M.as="script"),M.crossOrigin="",M.href=v,D&&M.setAttribute("nonce",D),document.head.appendChild(M),H)return new Promise((F,K)=>{M.addEventListener("load",F),M.addEventListener("error",()=>K(new Error(`Unable to preload CSS for ${v}`)))})}))}function O(C){const Y=new Event("vite:preloadError",{cancelable:!0});if(Y.payload=C,window.dispatchEvent(Y),!Y.defaultPrevented)throw C}return E.then(C=>{for(const Y of C||[])Y.status==="rejected"&&O(Y.reason);return m().catch(O)})},Ed=Bi("Preferences",{web:()=>Eh(()=>import("./web-f5mzcrk5.js"),[]).then(g=>new g.PreferencesWeb)}),zd="auth_token",zh=async()=>{try{return(await Ed.get({key:zd})).value}catch(g){return console.error("Error getting stored token:",g),null}},ss=async()=>{try{await Ed.remove({key:zd})}catch(g){throw console.error("Error clearing token:",g),g}},Ah=({course:g,onStatusUpdate:m,isLoading:y})=>{const[f,E]=ge.useState(!1),O=D=>{switch(D){case 1:return"Disponibilă";case 2:return"În progres";case 3:return"Pauzată";case 4:return"Finalizată";default:return"Necunoscut"}},C=D=>{let v;switch(D){case"start":v=2;break;case"pause":v=3;break;case"resume":v=2;break;case"finish":v=4;break;default:return}m(g.id,v)},Y=()=>{if(y)return s.jsx("div",{className:"text-center py-2",children:s.jsx("div",{className:"spinner-border spinner-border-sm text-primary",role:"status",children:s.jsx("span",{className:"visually-hidden",children:"Se încarcă..."})})});switch(g.status){case 1:return s.jsxs("button",{className:"btn btn-success btn-sm w-100",onClick:()=>C("start"),children:[s.jsx("i",{className:"fas fa-play me-2"}),"Start"]});case 2:return s.jsxs("div",{className:"d-flex gap-2",children:[s.jsxs("button",{className:"btn btn-warning btn-sm flex-fill",onClick:()=>C("pause"),children:[s.jsx("i",{className:"fas fa-pause me-1"}),"Pauzează"]}),s.jsxs("button",{className:"btn btn-danger btn-sm flex-fill",onClick:()=>C("finish"),children:[s.jsx("i",{className:"fas fa-stop me-1"}),"Finalizează"]})]});case 3:return s.jsxs("button",{className:"btn btn-primary btn-sm w-100",onClick:()=>C("resume"),children:[s.jsx("i",{className:"fas fa-play me-2"}),"Continuă"]});default:return null}};return s.jsx("div",{className:"course-detail-card mb-4",children:s.jsxs("div",{className:"card shadow-lg border-0 course-card-modern",children:[s.jsxs("div",{className:"card-header-modern d-flex justify-content-between align-items-center",children:[s.jsxs("div",{className:"course-header-info",children:[s.jsxs("div",{className:"course-name-section",children:[s.jsxs("h5",{className:"course-title-main",children:["UIT: ",g.uit]}),s.jsxs("span",{className:"course-id-badge",children:["ikRoTrans: ",g.ikRoTrans]})]}),s.jsx("div",{className:"course-route-info",children:s.jsx("div",{className:"route-display",children:s.jsxs("span",{className:"route-start",children:["Cod: ",g.codDeclarant]})})})]}),s.jsxs("div",{className:"course-header-actions",children:[s.jsxs("span",{className:`status-badge-modern status-${g.status}`,children:[s.jsx("i",{className:"fas fa-circle status-indicator"}),O(g.status)]}),s.jsx("button",{className:"btn-info-toggle",onClick:()=>{console.log("Info button clicked, current state:",f),E(!f)},title:"Afișează/Ascunde detalii complete",children:s.jsx("i",{className:`fas fa-${f?"chevron-up":"info-circle"}`})})]})]}),s.jsxs("div",{className:"card-body",children:[s.jsxs("div",{className:"course-summary mb-3",children:[s.jsxs("div",{className:"summary-item",children:[s.jsx("i",{className:"fas fa-calendar text-primary"}),s.jsx("span",{className:"summary-label",children:"Data Transport:"}),s.jsx("span",{className:"summary-value",children:g.dataTransport||"Nu este specificată"})]}),s.jsxs("div",{className:"summary-item",children:[s.jsx("i",{className:"fas fa-map-marker-alt text-primary"}),s.jsx("span",{className:"summary-label",children:"Traseu:"}),s.jsxs("span",{className:"summary-value",children:[g.vama," → ",g.vamaStop]})]})]}),f&&s.jsxs("div",{className:"course-details",children:[s.jsxs("h6",{className:"details-title",children:[s.jsx("i",{className:"fas fa-info-circle me-2"}),"Informații Complete Transport"]}),s.jsxs("div",{className:"details-grid",children:[s.jsxs("div",{className:"detail-group",children:[s.jsxs("h6",{className:"group-title",children:[s.jsx("i",{className:"fas fa-building me-2"}),"Declarant"]}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Cod Declarant:"}),s.jsx("div",{className:"detail-value",children:g.codDeclarant})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Denumire:"}),s.jsx("div",{className:"detail-value",children:g.denumireDeclarant})]})})]}),s.jsxs("div",{className:"detail-group",children:[s.jsxs("h6",{className:"group-title",children:[s.jsx("i",{className:"fas fa-truck me-2"}),"Transport"]}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"ikRoTrans:"}),s.jsx("div",{className:"detail-value",children:g.ikRoTrans})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Număr Vehicul:"}),s.jsx("div",{className:"detail-value",children:g.nrVehicul})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Data Transport:"}),s.jsx("div",{className:"detail-value",children:g.dataTransport})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"UIT:"}),s.jsx("div",{className:"detail-value font-monospace",children:g.uit})]})})]}),s.jsxs("div",{className:"detail-group",children:[s.jsxs("h6",{className:"group-title",children:[s.jsx("i",{className:"fas fa-map-marker-alt me-2"}),"Plecare"]}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Vamă:"}),s.jsx("div",{className:"detail-value",children:g.vama})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Birou Vamal:"}),s.jsx("div",{className:"detail-value",children:g.birouVamal})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Județ:"}),s.jsx("div",{className:"detail-value",children:g.judet})]})})]}),s.jsxs("div",{className:"detail-group",children:[s.jsxs("h6",{className:"group-title",children:[s.jsx("i",{className:"fas fa-flag-checkered me-2"}),"Destinație"]}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Vamă Stop:"}),s.jsx("div",{className:"detail-value",children:g.vamaStop})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Birou Vamal Stop:"}),s.jsx("div",{className:"detail-value",children:g.birouVamalStop})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Județ Stop:"}),s.jsx("div",{className:"detail-value",children:g.judetStop})]})})]})]})]}),s.jsx("div",{className:"course-actions",children:Y()})]})]})})},jh=({token:g,onLogout:m})=>{const[y,f]=ge.useState(""),[E,O]=ge.useState([]),[C,Y]=ge.useState(!1),[D,v]=ge.useState(""),[H,_]=ge.useState(!1),[M,F]=ge.useState(null),[K,ve]=ge.useState(!1),[ce,ot]=ge.useState(0),[et,xe]=ge.useState(!1),[qe,$]=ge.useState(""),[Ge,De]=ge.useState(!1),ae=async()=>{if(!y.trim()){v("Vă rugăm să introduceți numărul vehiculului");return}Y(!0),v("");try{const R=await bh(y,g);if(!R||R.length===0){v("Nu există curse disponibile pentru acest vehicul. Verificați numărul și încercați din nou."),O([]),_(!1);return}O(R),_(!0)}catch(R){console.error("Error loading courses:",R),v(R.message||"Eroare la încărcarea curselor. Verificați numărul vehiculului."),O([]),_(!1)}finally{Y(!1)}},he=async(R,T)=>{const U=E.find(te=>te.id===R);if(!U)return;const L=U.status;F(R);try{O(te=>te.map(o=>o.id===R?{...o,status:T}:o)),console.log(`Updating status for course ${R}: ${L} → ${T}`),T===2&&L!==2?(console.log(`Starting GPS tracking for course ${R} with UIT ${U.uit}`),await cs(R,y,g,U.uit,T)):T===3&&L===2?(console.log(`Pausing GPS tracking for course ${R} with UIT ${U.uit}`),await vd(R),await cs(R,y,g,U.uit,T)):T===4?(console.log(`Stopping GPS tracking for course ${R} with UIT ${U.uit}`),await vd(R)):T===2&&L===3&&(console.log(`Resuming GPS tracking for course ${R} with UIT ${U.uit}`),await cs(R,y,g,U.uit,T)),console.log(`Status updated locally for course ${R}: ${T}`)}catch(te){console.error(`Error updating status for course ${R}:`,te),O(o=>o.map(N=>N.id===R?{...N,status:L}:N)),v(`Eroare la actualizarea statusului: ${te instanceof Error?te.message:"Eroare necunoscută"}`)}finally{F(null)}},Me=()=>{_(!1),O([]),v(""),f("")},je=async()=>{try{await vh(g),await ss(),m()}catch(R){console.error("Logout error:",R),await ss(),m()}},me=()=>{ot(R=>{const T=R+1;return T>=20?(xe(!0),ot(0),0):((T<10||T===10)&&ve(!0),T)})},Ee=()=>{qe==="parola123"?(De(!0),xe(!1),$("")):(alert("Parolă incorectă"),$(""))},Je=()=>{De(!1)};return H?s.jsxs("div",{className:"courses-container",children:[s.jsx("style",{children:`
          .courses-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 50%, #764ba2 75%, #1e3c72 100%);
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
            position: relative;
            overflow-x: hidden;
          }
          
          .courses-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(79, 70, 229, 0.2) 0%, transparent 50%);
            animation: backgroundFloat 25s ease-in-out infinite;
            pointer-events: none;
          }

          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .courses-header {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(30px);
            color: #1e3c72;
            padding: calc(env(safe-area-inset-top, 0px) + 30px) 25px 30px 25px;
            box-shadow: 
              0 12px 40px rgba(0, 0, 0, 0.1),
              0 4px 12px rgba(79, 70, 229, 0.05);
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 2px solid rgba(79, 70, 229, 0.1);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: slideInDown 0.6s ease-out;
          }

          .courses-header:hover {
            background: rgba(255, 255, 255, 1);
            box-shadow: 
              0 16px 50px rgba(0, 0, 0, 0.12),
              0 6px 15px rgba(79, 70, 229, 0.1);
          }

          @keyframes slideInDown {
            0% {
              transform: translateY(-100%);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .vehicle-header-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
          }

          .vehicle-display {
            display: flex;
            align-items: center;
            gap: 18px;
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(124, 58, 237, 0.25), rgba(16, 185, 129, 0.15));
            background-size: 200% 200%;
            padding: 18px 30px;
            border-radius: 25px;
            backdrop-filter: blur(20px);
            cursor: pointer;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid rgba(255, 255, 255, 0.4);
            box-shadow: 
              0 12px 35px rgba(0, 0, 0, 0.1),
              0 4px 12px rgba(79, 70, 229, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            position: relative;
            overflow: hidden;
            animation: gradientShift 4s ease infinite;
          }

          .vehicle-display:hover {
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.4), rgba(124, 58, 237, 0.4), rgba(16, 185, 129, 0.3));
            transform: translateY(-5px) scale(1.03);
            background-position: 100% 0%;
            box-shadow: 
              0 20px 50px rgba(79, 70, 229, 0.25),
              0 8px 20px rgba(124, 58, 237, 0.2),
              0 4px 12px rgba(16, 185, 129, 0.15);
            border-color: rgba(255, 255, 255, 0.6);
          }

          .vehicle-display::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: all 0.6s ease;
          }

          .vehicle-display:hover::before {
            left: 100%;
          }

          .vehicle-display:active {
            animation: buttonPress 0.2s ease;
          }

          .vehicle-display i {
            font-size: 1.5rem;
          }

          .vehicle-number-text {
            font-size: 1.2rem;
            font-weight: 700;
            letter-spacing: 1px;
          }

          .vehicle-edit-icon {
            opacity: 0.7;
            font-size: 0.9rem;
          }

          .courses-stats {
            text-align: center;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25), rgba(6, 182, 212, 0.15));
            background-size: 200% 200%;
            padding: 25px 20px;
            border-radius: 25px;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.4);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            position: relative;
            overflow: hidden;
            animation: gradientShift 6s ease infinite;
            box-shadow: 
              0 12px 30px rgba(16, 185, 129, 0.15),
              0 4px 12px rgba(5, 150, 105, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }

          .courses-stats:hover {
            transform: translateY(-6px) scale(1.05);
            background-position: 100% 0%;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(5, 150, 105, 0.4), rgba(6, 182, 212, 0.3));
            box-shadow: 
              0 20px 45px rgba(16, 185, 129, 0.25),
              0 8px 20px rgba(5, 150, 105, 0.2),
              0 4px 12px rgba(6, 182, 212, 0.15);
            border-color: rgba(255, 255, 255, 0.6);
          }

          .courses-stats::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: all 0.8s ease;
          }

          .courses-stats:hover::before {
            left: 100%;
          }

          .stats-number {
            font-size: 3rem;
            font-weight: 900;
            display: block;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #059669, #10b981, #06b6d4);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: countUp 1.2s ease-out, gradientShift 3s ease infinite;
            transition: all 0.4s ease;
            position: relative;
          }

          .courses-stats:hover .stats-number {
            font-size: 3.2rem;
            transform: scale(1.1);
            text-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }

          .stats-label {
            font-size: 1rem;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            color: #1e3c72;
          }

          .courses-content {
            padding: 20px 20px 200px 20px;
            max-width: 1200px;
            margin: 0 auto;
            min-height: calc(100vh - 200px);
          }

          .courses-grid {
            display: grid;
            gap: 25px;
            grid-template-columns: 1fr;
            animation: fadeInUp 0.8s ease-out;
          }

          .courses-grid > * {
            animation: slideInUp 0.6s ease-out;
            animation-fill-mode: both;
          }

          .courses-grid > *:nth-child(1) { animation-delay: 0.1s; }
          .courses-grid > *:nth-child(2) { animation-delay: 0.2s; }
          .courses-grid > *:nth-child(3) { animation-delay: 0.3s; }
          .courses-grid > *:nth-child(4) { animation-delay: 0.4s; }
          .courses-grid > *:nth-child(5) { animation-delay: 0.5s; }
          .courses-grid > *:nth-child(6) { animation-delay: 0.6s; }

          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInUp {
            0% {
              opacity: 0;
              transform: translateY(40px) scale(0.9);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .courses-error-alert {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
          }

          .courses-error-icon {
            color: #ef4444;
            font-size: 1.2rem;
          }

          .courses-error-text {
            color: #7f1d1d;
            font-weight: 500;
            flex: 1;
          }

          .courses-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(25px);
            border-top: 2px solid rgba(79, 70, 229, 0.1);
            padding: 18px 20px calc(18px + env(safe-area-inset-bottom, 20px)) 20px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            box-shadow: 
              0 -8px 30px rgba(0, 0, 0, 0.12),
              0 -2px 8px rgba(79, 70, 229, 0.05);
            z-index: 1000;
            transition: all 0.3s ease;
            animation: slideInUp 0.5s ease-out;
          }

          .courses-bottom-nav:hover {
            background: rgba(255, 255, 255, 1);
            box-shadow: 
              0 -12px 40px rgba(0, 0, 0, 0.15),
              0 -4px 12px rgba(79, 70, 229, 0.1);
          }

          .nav-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 12px 18px;
            border: none;
            background: rgba(79, 70, 229, 0.05);
            color: #64748b;
            cursor: pointer;
            border-radius: 16px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 80px;
            position: relative;
            overflow: hidden;
            border: 2px solid transparent;
          }

          .nav-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.1), transparent);
            transition: all 0.6s ease;
          }

          .nav-button:hover {
            background: rgba(79, 70, 229, 0.15);
            color: #4f46e5;
            transform: translateY(-4px) scale(1.05);
            border-color: rgba(79, 70, 229, 0.3);
            box-shadow: 
              0 8px 25px rgba(79, 70, 229, 0.2),
              0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .nav-button:hover::before {
            left: 100%;
          }

          .nav-button:active {
            transform: translateY(-1px) scale(0.98);
            transition: all 0.1s ease;
          }

          .nav-button i {
            font-size: 1.2rem;
          }

          .nav-button-label {
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .logout-nav-button {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border-color: rgba(239, 68, 68, 0.2);
          }

          .logout-nav-button:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #dc2626;
            transform: translateY(-4px) scale(1.05);
            border-color: rgba(239, 68, 68, 0.4);
            box-shadow: 
              0 8px 25px rgba(239, 68, 68, 0.3),
              0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .logout-nav-button::before {
            background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent);
          }

          .version-info-bottom {
            position: fixed;
            bottom: 130px;
            left: 50%;
            transform: translateX(-50%);
            color: #1e3c72;
            font-size: 1rem;
            font-weight: 700;
            background: rgba(255, 255, 255, 0.98);
            padding: 12px 25px;
            border-radius: 30px;
            backdrop-filter: blur(20px);
            cursor: pointer;
            user-select: none;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1001;
            border: 2px solid rgba(79, 70, 229, 0.4);
            box-shadow: 
              0 12px 35px rgba(0, 0, 0, 0.15),
              0 4px 12px rgba(79, 70, 229, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% {
              box-shadow: 
                0 12px 35px rgba(0, 0, 0, 0.15),
                0 4px 12px rgba(79, 70, 229, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
            }
            50% {
              box-shadow: 
                0 16px 45px rgba(0, 0, 0, 0.2),
                0 6px 16px rgba(79, 70, 229, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
            }
          }

          .version-info-bottom:hover {
            background: rgba(255, 255, 255, 1);
            transform: translateX(-50%) scale(1.1) translateY(-3px);
            border-color: rgba(79, 70, 229, 0.6);
            box-shadow: 
              0 20px 50px rgba(79, 70, 229, 0.3),
              0 8px 20px rgba(0, 0, 0, 0.2),
              inset 0 2px 0 rgba(255, 255, 255, 0.6);
            animation: none;
          }

          .version-info-bottom:active {
            transform: translateX(-50%) scale(1.05) translateY(-1px);
            transition: all 0.1s ease;
          }

          .debug-prompt-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .debug-prompt-content {
            background: white;
            border-radius: 15px;
            padding: 25px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }

          .debug-prompt-content h3 {
            margin: 0 0 15px 0;
            color: #1e3c72;
            font-size: 1.2rem;
          }

          .debug-prompt-content p {
            margin: 0 0 20px 0;
            color: #64748b;
            font-size: 0.9rem;
          }

          .debug-password-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            margin-bottom: 20px;
            outline: none;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
          }

          .debug-password-input:focus {
            border-color: #4f46e5;
          }

          .debug-prompt-buttons {
            display: flex;
            gap: 10px;
          }

          .debug-submit-btn, .debug-cancel-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .debug-submit-btn {
            background: #4f46e5;
            color: white;
          }

          .debug-submit-btn:hover {
            background: #4338ca;
          }

          .debug-cancel-btn {
            background: #f1f5f9;
            color: #64748b;
          }

          .debug-cancel-btn:hover {
            background: #e2e8f0;
          }

          .mobile-debug-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 3000;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 10px;
            overflow-y: auto;
          }

          .mobile-debug-panel {
            background: #1a1a1a;
            color: #e2e8f0;
            border-radius: 12px;
            width: 100%;
            max-width: 500px;
            margin-top: 20px;
            max-height: calc(100vh - 40px);
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }

          .debug-header {
            padding: 15px 20px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2d2d2d;
            border-radius: 12px 12px 0 0;
          }

          .debug-header h3 {
            margin: 0;
            font-size: 1.1rem;
            color: #00ff88;
          }

          .debug-close-btn {
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
          }

          .debug-close-btn:hover {
            background: #cc3333;
            transform: scale(1.1);
          }

          .debug-content {
            padding: 20px;
            flex: 1;
            overflow-y: auto;
          }

          .debug-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px;
            background: #2d2d2d;
            border-radius: 8px;
            font-size: 0.85rem;
          }

          .debug-indicator {
            color: #00ff88;
            font-weight: 600;
          }

          .debug-platform {
            color: #94a3b8;
          }

          .debug-log-output {
            background: #0f0f0f;
            border-radius: 8px;
            padding: 15px;
            height: 250px;
            overflow-y: auto;
            margin-bottom: 15px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.8rem;
            border: 1px solid #333;
          }

          .debug-log-item {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #222;
          }

          .log-time {
            color: #64748b;
            min-width: 60px;
            font-size: 0.75rem;
          }

          .log-level {
            min-width: 50px;
            font-weight: 600;
            font-size: 0.75rem;
            color: #3b82f6;
          }

          .debug-log-item.warn .log-level {
            color: #f59e0b;
          }

          .debug-log-item.error .log-level {
            color: #ef4444;
          }

          .log-message {
            flex: 1;
            color: #e2e8f0;
            font-size: 0.8rem;
          }

          .debug-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .debug-action-btn {
            padding: 8px 15px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .debug-action-btn:hover {
            background: #4338ca;
            transform: translateY(-1px);
          }

          @media (max-width: 768px) {
            .courses-content {
              padding: 15px 15px 140px 15px;
            }
            
            .courses-header {
              padding: 20px 15px;
            }
            
            .vehicle-header-info {
              flex-direction: column;
              gap: 15px;
              align-items: stretch;
            }
            
            .vehicle-display {
              padding: 12px 20px;
            }
            
            .vehicle-number-text {
              font-size: 1.1rem;
            }
            
            .stats-number {
              font-size: 2rem;
            }
            
            .courses-bottom-nav {
              padding: 12px 15px calc(12px + env(safe-area-inset-bottom, 25px)) 15px;
            }
            
            .nav-button {
              min-width: 60px;
              padding: 8px 10px;
            }
            
            .nav-button i {
              font-size: 1.1rem;
            }
            
            .nav-button-label {
              font-size: 0.7rem;
            }
          }

          @media (max-width: 480px) {
            .courses-content {
              padding: 10px 10px 150px 10px;
            }
            
            .courses-header {
              padding: 15px 10px;
            }
            
            .vehicle-display {
              padding: 10px 15px;
              gap: 10px;
            }
            
            .vehicle-number-text {
              font-size: 1rem;
            }
            
            .stats-number {
              font-size: 1.8rem;
            }
            
            .stats-label {
              font-size: 0.9rem;
            }
            
            .courses-bottom-nav {
              padding: 10px 10px calc(10px + env(safe-area-inset-bottom, 30px)) 10px;
            }
          }

          @media (min-width: 1024px) {
            .courses-content {
              padding: 30px 30px 100px 30px;
            }
            
            .courses-header {
              padding: 30px;
            }
            
            .courses-grid {
              grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
              gap: 25px;
            }
          }
            
            .courses-header {
              padding: 15px;
            }
          }

          @media (min-width: 768px) {
            .courses-grid {
              grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            }
          }

          /* Info Modal Styles */
          .info-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
          }

          .info-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(25px);
            border-radius: 20px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: slideInUp 0.3s ease;
          }

          .info-header {
            padding: 20px 25px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .info-header h3 {
            margin: 0;
            color: #1e3c72;
            font-size: 1.3rem;
            font-weight: 700;
          }

          .info-close {
            background: none;
            border: none;
            font-size: 1.2rem;
            color: #64748b;
            cursor: pointer;
            padding: 5px;
            border-radius: 5px;
            transition: all 0.3s ease;
          }

          .info-close:hover {
            background: rgba(0, 0, 0, 0.1);
            color: #1e3c72;
          }

          .info-body {
            padding: 20px 25px;
          }

          .info-section {
            margin-bottom: 20px;
          }

          .info-section:last-child {
            margin-bottom: 0;
          }

          .info-section h4 {
            color: #1e3c72;
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .info-section h4 i {
            color: #4f46e5;
          }

          .info-section p {
            margin: 5px 0;
            color: #64748b;
            line-height: 1.5;
          }

          .info-section strong {
            color: #1e3c72;
          }

          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          @keyframes slideInUp {
            0% {
              transform: translateY(30px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @media (max-width: 480px) {
            .info-content {
              margin: 10px;
              max-height: 85vh;
            }
            
            .info-header {
              padding: 15px 20px;
            }
            
            .info-body {
              padding: 15px 20px;
            }
          }
        `}),s.jsx("div",{className:"courses-header",children:s.jsxs("div",{className:"vehicle-header-info",children:[s.jsxs("div",{className:"vehicle-display",onClick:Me,children:[s.jsx("i",{className:"fas fa-truck"}),s.jsx("span",{className:"vehicle-number-text",children:y}),s.jsx("i",{className:"fas fa-edit vehicle-edit-icon"})]}),s.jsxs("div",{className:"courses-stats",children:[s.jsx("span",{className:"stats-number",children:E.length}),s.jsx("span",{className:"stats-label",children:"Transporturi Active"})]})]})}),s.jsxs("div",{className:"courses-content",children:[D&&s.jsxs("div",{className:"courses-error-alert",children:[s.jsx("i",{className:"fas fa-exclamation-triangle courses-error-icon"}),s.jsx("span",{className:"courses-error-text",children:D})]}),s.jsx("div",{className:"courses-grid",children:E.map(R=>s.jsx(Ah,{course:R,onStatusUpdate:he,isLoading:M===R.id},R.id))})]}),s.jsxs("div",{className:"courses-bottom-nav",children:[s.jsxs("button",{className:"nav-button",onClick:me,children:[s.jsx("i",{className:"fas fa-info-circle"}),s.jsxs("span",{className:"nav-button-label",children:["Info",ce>=10?`+${ce}`:""]})]}),s.jsxs("button",{className:"nav-button logout-nav-button",onClick:je,children:[s.jsx("i",{className:"fas fa-sign-out-alt"}),s.jsx("span",{className:"nav-button-label",children:"Ieșire"})]})]}),K&&s.jsx("div",{className:"info-modal",onClick:()=>ve(!1),children:s.jsxs("div",{className:"info-content",onClick:R=>R.stopPropagation(),children:[s.jsxs("div",{className:"info-header",children:[s.jsx("h3",{children:"iTrack - Informații Aplicație"}),s.jsx("button",{className:"info-close",onClick:()=>ve(!1),children:s.jsx("i",{className:"fas fa-times"})})]}),s.jsxs("div",{className:"info-body",children:[s.jsxs("div",{className:"info-section",children:[s.jsxs("h4",{children:[s.jsx("i",{className:"fas fa-truck"})," Vehicul"]}),s.jsxs("p",{children:["Număr înmatriculare: ",s.jsx("strong",{children:y})]}),s.jsxs("p",{children:["Curse active: ",s.jsx("strong",{children:E.filter(R=>R.status===2).length})]}),s.jsxs("p",{children:["Curse în pauză: ",s.jsx("strong",{children:E.filter(R=>R.status===3).length})]})]}),s.jsxs("div",{className:"info-section",children:[s.jsxs("h4",{children:[s.jsx("i",{className:"fas fa-satellite"})," GPS Tracking"]}),E.filter(R=>R.status===2).length>0?s.jsxs(s.Fragment,{children:[s.jsxs("p",{children:["Status: ",s.jsxs("strong",{children:["Activ pentru ",E.filter(R=>R.status===2).length," curse"]})]}),s.jsx("p",{children:"Curse în tracking:"}),s.jsx("div",{style:{marginLeft:"15px",fontSize:"0.9rem"},children:E.filter(R=>R.status===2).map(R=>s.jsxs("p",{style:{margin:"2px 0",color:"#059669"},children:["• UIT: ",s.jsx("strong",{children:R.uit})]},R.id))}),s.jsxs("p",{children:["Interval transmisie: ",s.jsx("strong",{children:"60 secunde"})]}),s.jsxs("p",{children:["Background tracking: ",s.jsx("strong",{children:"Activat (nativ Android)"})]}),s.jsxs("p",{children:["Funcționează când: ",s.jsx("strong",{children:"telefon blocat, app minimizată"})]})]}):s.jsxs(s.Fragment,{children:[s.jsxs("p",{children:["Status: ",s.jsx("strong",{children:"Inactiv"})]}),s.jsx("p",{children:"Nu există curse în desfășurare"}),s.jsx("p",{children:"GPS va porni automat la Start Cursă"})]})]}),s.jsxs("div",{className:"info-section",children:[s.jsxs("h4",{children:[s.jsx("i",{className:"fas fa-mobile-alt"})," Aplicație"]}),s.jsxs("p",{children:["Versiune: ",s.jsx("strong",{children:"1807.99"})]}),s.jsxs("p",{children:["Platform: ",s.jsx("strong",{children:"Android/Web"})]}),s.jsx("p",{children:"© 2025 iTrack Business Solutions"})]})]})]})}),et&&s.jsx("div",{className:"debug-prompt-overlay",children:s.jsxs("div",{className:"debug-prompt-content",children:[s.jsx("h3",{children:"Mod Debug Dezvoltator"}),s.jsx("p",{children:"Introduceți parola pentru accesul la panelul de debug:"}),s.jsx("input",{type:"password",value:qe,onChange:R=>$(R.target.value),placeholder:"Parola debug",className:"debug-password-input",onKeyPress:R=>R.key==="Enter"&&Ee()}),s.jsxs("div",{className:"debug-prompt-buttons",children:[s.jsx("button",{onClick:Ee,className:"debug-submit-btn",children:"Accesează Debug"}),s.jsx("button",{onClick:()=>xe(!1),className:"debug-cancel-btn",children:"Anulează"})]})]})}),Ge&&s.jsx("div",{className:"mobile-debug-overlay",children:s.jsxs("div",{className:"mobile-debug-panel",children:[s.jsxs("div",{className:"debug-header",children:[s.jsx("h3",{children:"📱 Debug Panel (Mobile)"}),s.jsx("button",{onClick:Je,className:"debug-close-btn",children:"✕"})]}),s.jsx("div",{className:"debug-content",children:s.jsxs("div",{className:"debug-logs-container",children:[s.jsxs("div",{className:"debug-status",children:[s.jsx("span",{className:"debug-indicator",children:"🟢 Debug Activ"}),s.jsx("span",{className:"debug-platform",children:"Platform: Android APK"})]}),s.jsxs("div",{className:"debug-log-output",id:"debugLogOutput",children:[s.jsxs("div",{className:"debug-log-item info",children:[s.jsx("span",{className:"log-time",children:new Date().toLocaleTimeString()}),s.jsx("span",{className:"log-level",children:"INFO"}),s.jsx("span",{className:"log-message",children:"Debug panel activat pentru diagnosticare GPS"})]}),s.jsxs("div",{className:"debug-log-item warn",children:[s.jsx("span",{className:"log-time",children:new Date().toLocaleTimeString()}),s.jsx("span",{className:"log-level",children:"WARN"}),s.jsx("span",{className:"log-message",children:"Verificați logurile Android ADB pentru detalii complete"})]})]}),s.jsxs("div",{className:"debug-actions",children:[s.jsx("button",{className:"debug-action-btn",onClick:()=>console.log("Test GPS Plugin"),children:"Test GPS Plugin"}),s.jsx("button",{className:"debug-action-btn",onClick:()=>console.log("Clear Logs"),children:"Clear Logs"})]})]})})]})})]}):s.jsxs("div",{className:"vehicle-input-container",children:[s.jsx("style",{children:`
            .vehicle-input-container {
              min-height: 100vh;
              min-height: 100dvh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: calc(env(safe-area-inset-top, 0px) + 40px) env(safe-area-inset-right) max(20px, env(safe-area-inset-bottom)) env(safe-area-inset-left);
              position: relative;
              overflow: hidden;
            }

            .vehicle-card {
              background: rgba(255, 255, 255, 0.15);
              backdrop-filter: blur(20px);
              border-radius: 20px;
              padding: 40px;
              width: 100%;
              max-width: 450px;
              box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              position: relative;
              z-index: 1;
            }

            .vehicle-header {
              text-align: center;
              margin-bottom: 40px;
            }

            .vehicle-logo {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #4f46e5, #06b6d4);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
            }

            .vehicle-logo i {
              font-size: 2rem;
              color: white;
            }

            .vehicle-title {
              font-size: 2.5rem;
              font-weight: 700;
              color: white;
              margin-bottom: 8px;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }

            .vehicle-subtitle {
              font-size: 1.1rem;
              color: rgba(255, 255, 255, 0.8);
              font-weight: 400;
            }

            .vehicle-form {
              display: flex;
              flex-direction: column;
              gap: 25px;
            }

            .vehicle-form-group {
              position: relative;
            }

            .vehicle-form-input {
              width: 100%;
              padding: 16px 20px 16px 50px;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.1);
              color: white;
              font-size: 1.1rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              transition: all 0.3s ease;
              backdrop-filter: blur(10px);
              text-align: center;
            }

            .vehicle-form-input::placeholder {
              color: rgba(255, 255, 255, 0.6);
              text-transform: none;
              letter-spacing: normal;
              font-weight: 400;
            }

            .vehicle-form-input:focus {
              outline: none;
              border-color: rgba(255, 255, 255, 0.6);
              background: rgba(255, 255, 255, 0.15);
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
              transform: translateY(-2px);
            }

            .vehicle-input-icon {
              position: absolute;
              left: 16px;
              top: 50%;
              transform: translateY(-50%);
              color: rgba(255, 255, 255, 0.7);
              font-size: 1.2rem;
              pointer-events: none;
            }

            .vehicle-load-button {
              background: linear-gradient(135deg, #4f46e5, #06b6d4);
              color: white;
              border: none;
              padding: 18px 24px;
              border-radius: 12px;
              font-size: 1.1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin-top: 10px;
              box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
            }

            .vehicle-load-button:hover:not(:disabled) {
              transform: translateY(-2px);
              box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4);
            }

            .vehicle-load-button:disabled {
              opacity: 0.7;
              cursor: not-allowed;
            }

            .vehicle-loading-spinner {
              width: 20px;
              height: 20px;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-top: 2px solid white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            @media (max-width: 768px) {
              .vehicle-card {
                padding: 40px 30px;
                margin: 15px;
                max-width: calc(100vw - 30px);
                border-radius: 20px;
              }
              
              .vehicle-title {
                font-size: 2rem;
              }
              
              .vehicle-subtitle {
                font-size: 1rem;
              }
              
              .vehicle-form-input {
                padding: 16px 20px 16px 50px;
                font-size: 1.1rem;
                letter-spacing: 1px;
              }
              
              .vehicle-load-button {
                padding: 18px 25px;
                font-size: 1.1rem;
              }
              
              .vehicle-logo {
                width: 70px;
                height: 70px;
              }
              
              .vehicle-logo i {
                font-size: 1.8rem;
              }
            }

            @media (max-width: 480px) {
              .vehicle-input-container {
                padding: calc(env(safe-area-inset-top, 0px) + 40px) 15px max(15px, env(safe-area-inset-bottom)) 15px;
              }
              
              .vehicle-card {
                padding: 35px 25px;
                margin: 10px;
              }
              
              .vehicle-title {
                font-size: 1.8rem;
              }
              
              .vehicle-header {
                margin-bottom: 35px;
              }
              
              .vehicle-form {
                gap: 20px;
              }
            }

            .vehicle-error-alert {
              background: rgba(239, 68, 68, 0.15);
              border: 1px solid rgba(239, 68, 68, 0.3);
              border-radius: 12px;
              padding: 16px;
              display: flex;
              align-items: center;
              gap: 12px;
              backdrop-filter: blur(10px);
            }

            .vehicle-error-icon {
              color: #ef4444;
              font-size: 1.2rem;
            }

            .vehicle-error-text {
              color: white;
              font-weight: 500;
              flex: 1;
            }

            .vehicle-footer-actions {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(20px);
              border-top: 1px solid rgba(255, 255, 255, 0.2);
              padding: 20px;
              display: flex;
              justify-content: center;
            }

            .vehicle-logout-button {
              background: rgba(239, 68, 68, 0.2);
              border: 1px solid rgba(239, 68, 68, 0.3);
              color: white;
              padding: 12px 24px;
              border-radius: 12px;
              font-size: 1rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 8px;
              backdrop-filter: blur(10px);
            }

            .vehicle-logout-button:hover {
              background: rgba(239, 68, 68, 0.3);
              transform: translateY(-2px);
            }

            @media (max-width: 768px) {
              .vehicle-card {
                margin: 20px;
                padding: 30px 20px;
              }
              
              .vehicle-title {
                font-size: 2rem;
              }
            }
          `}),s.jsxs("div",{className:"vehicle-card",children:[s.jsxs("div",{className:"vehicle-header",children:[s.jsx("div",{className:"vehicle-logo",children:s.jsx("i",{className:"fas fa-truck"})}),s.jsx("h1",{className:"vehicle-title",children:"iTrack"}),s.jsx("p",{className:"vehicle-subtitle",children:"Selectați Vehiculul de Transport"})]}),s.jsxs("div",{className:"vehicle-form",children:[D&&s.jsxs("div",{className:"vehicle-error-alert",children:[s.jsx("i",{className:"fas fa-exclamation-triangle vehicle-error-icon"}),s.jsx("span",{className:"vehicle-error-text",children:D})]}),s.jsxs("div",{className:"vehicle-form-group",children:[s.jsx("i",{className:"fas fa-truck vehicle-input-icon"}),s.jsx("input",{type:"text",className:"vehicle-form-input",value:y,onChange:R=>{const T=R.target.value.replace(/[^A-Za-z0-9]/g,"").toUpperCase();f(T)},placeholder:"Numărul de înmatriculare (ex: B123ABC)",disabled:C,maxLength:10,onKeyPress:R=>{R.key==="Enter"&&ae()}})]}),s.jsx("button",{className:"vehicle-load-button",onClick:ae,disabled:C||!y.trim(),children:C?s.jsxs(s.Fragment,{children:[s.jsx("div",{className:"vehicle-loading-spinner"}),s.jsx("span",{children:"Căutare curse în progres..."})]}):s.jsxs(s.Fragment,{children:[s.jsx("i",{className:"fas fa-search"}),s.jsx("span",{children:"Încarcă Transporturile"})]})})]})]}),s.jsx("div",{className:"vehicle-footer-actions",children:s.jsxs("button",{className:"vehicle-logout-button",onClick:je,children:[s.jsx("i",{className:"fas fa-sign-out-alt"}),s.jsx("span",{children:"Deconectare"})]})})]})},Nh=({onLogout:g})=>{const[m,y]=ge.useState([]),[f,E]=ge.useState([]),[O,C]=ge.useState(""),[Y,D]=ge.useState("");ge.useEffect(()=>{const _=[],M={log:console.log,warn:console.warn,error:console.error,debug:console.debug,info:console.info},F=(K,ve)=>{const ce={id:Date.now().toString()+Math.random().toString(36).substr(2,9),timestamp:new Date().toLocaleString("ro-RO"),level:K,message:ve};_.unshift(ce),_.length>200&&_.pop(),y([..._])};return console.log=(...K)=>{M.log(...K),F("INFO",K.join(" "))},console.warn=(...K)=>{M.warn(...K),F("WARN",K.join(" "))},console.error=(...K)=>{M.error(...K),F("ERROR",K.join(" "))},console.debug=(...K)=>{M.debug(...K),F("DEBUG",K.join(" "))},F("INFO","Admin Panel - Console logging started"),F("INFO","Ready for debugging on mobile device"),()=>{console.log=M.log,console.warn=M.warn,console.error=M.error,console.debug=M.debug}},[]),ge.useEffect(()=>{let _=m;O&&(_=_.filter(M=>M.message.toLowerCase().includes(O.toLowerCase()))),Y&&(_=_.filter(M=>M.level===Y)),E(_)},[m,O,Y]);const v=_=>{switch(_){case"INFO":return"#10b981";case"WARN":return"#f59e0b";case"ERROR":return"#ef4444";case"DEBUG":return"#6b7280";default:return"#6b7280"}},H=()=>{y([]),console.log("Logs cleared by admin")};return s.jsxs("div",{style:{minHeight:"100vh",background:"linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",padding:"20px",fontFamily:"Arial, sans-serif"},children:[s.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.95)",borderRadius:"15px",padding:"20px",marginBottom:"20px",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.1)"},children:[s.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"15px"},children:[s.jsx("h2",{style:{margin:0,color:"#1e293b"},children:"🔧 Admin Debug Panel"}),s.jsx("button",{onClick:g,style:{background:"#ef4444",color:"white",border:"none",padding:"10px 20px",borderRadius:"8px",cursor:"pointer",fontWeight:"bold"},children:"Logout"})]}),s.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:"10px",marginBottom:"10px"},children:[s.jsx("input",{type:"text",placeholder:"Caută în logs...",value:O,onChange:_=>C(_.target.value),style:{padding:"10px",borderRadius:"8px",border:"2px solid #e5e7eb",fontSize:"14px"}}),s.jsxs("select",{value:Y,onChange:_=>D(_.target.value),style:{padding:"10px",borderRadius:"8px",border:"2px solid #e5e7eb",fontSize:"14px"},children:[s.jsx("option",{value:"",children:"Toate nivelurile"}),s.jsx("option",{value:"INFO",children:"INFO"}),s.jsx("option",{value:"WARN",children:"WARN"}),s.jsx("option",{value:"ERROR",children:"ERROR"}),s.jsx("option",{value:"DEBUG",children:"DEBUG"})]}),s.jsx("button",{onClick:H,style:{background:"#6b7280",color:"white",border:"none",padding:"10px 15px",borderRadius:"8px",cursor:"pointer",whiteSpace:"nowrap"},children:"Clear"})]}),s.jsxs("div",{style:{color:"#6b7280",fontSize:"14px"},children:["📊 Total logs: ",f.length]})]}),s.jsx("div",{style:{background:"rgba(255, 255, 255, 0.95)",borderRadius:"15px",overflow:"hidden",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.1)",maxHeight:"calc(100vh - 200px)",overflowY:"auto"},children:f.length>0?s.jsx("div",{children:f.map(_=>s.jsxs("div",{style:{padding:"12px 15px",borderBottom:"1px solid #e5e7eb",fontSize:"13px",lineHeight:"1.4"},children:[s.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"8px",marginBottom:"4px"},children:[s.jsx("span",{style:{background:v(_.level),color:"white",padding:"2px 6px",borderRadius:"4px",fontSize:"11px",fontWeight:"bold",minWidth:"45px",textAlign:"center"},children:_.level}),s.jsx("span",{style:{color:"#6b7280",fontSize:"11px",minWidth:"120px"},children:_.timestamp})]}),s.jsx("div",{style:{color:"#374151",marginLeft:"57px",wordBreak:"break-word",fontFamily:"Monaco, Menlo, monospace",fontSize:"12px"},children:_.message})]},_.id))}):s.jsxs("div",{style:{textAlign:"center",padding:"40px",color:"#6b7280"},children:[s.jsx("div",{style:{fontSize:"48px",marginBottom:"10px"},children:"📱"}),s.jsx("div",{children:"Niciun log găsit"}),s.jsx("div",{style:{fontSize:"12px",marginTop:"5px"},children:"Interacționează cu aplicația pentru a vedea log-urile"})]})})]})},Oh=()=>{const[g,m]=ge.useState("login"),[y,f]=ge.useState(""),[E,O]=ge.useState(!0);ge.useEffect(()=>{(async()=>{try{const v=await zh();v?(console.log("Found stored token - auto login"),f(v),m("vehicle")):console.log("No stored token - showing login")}catch(v){console.error("Error initializing app:",v)}finally{O(!1)}})()},[]);const C=D=>{f(D),m(D==="ADMIN_TOKEN"?"admin":"vehicle")},Y=async()=>{try{const D=await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/login.php",{method:"POST",headers:{Authorization:`Bearer ${y}`,"Content-Type":"application/json"},body:JSON.stringify({iesire:1})});console.log("Logout API response:",D.status)}catch(D){console.error("Error calling logout API:",D)}finally{await ss(),f(""),m("login"),console.log("Logged out - cleared local storage")}};return E?s.jsx("div",{className:"app",style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"},children:s.jsx("div",{children:"Loading..."})}):s.jsxs("div",{className:"app",children:[g==="login"&&s.jsx(xh,{onLogin:C}),g==="vehicle"&&s.jsx(jh,{token:y,onLogout:Y}),g==="admin"&&s.jsx(Nh,{onLogout:Y})]})};ya.isNativePlatform()&&console.log("Running on native platform");uh.createRoot(document.getElementById("root")).render(s.jsx(Pg.StrictMode,{children:s.jsx(Oh,{})}));export{Sd as W};
