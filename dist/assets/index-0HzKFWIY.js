var kg=Object.defineProperty;var Jg=(g,p,S)=>p in g?kg(g,p,{enumerable:!0,configurable:!0,writable:!0,value:S}):g[p]=S;var ud=(g,p,S)=>Jg(g,typeof p!="symbol"?p+"":p,S);(function(){const p=document.createElement("link").relList;if(p&&p.supports&&p.supports("modulepreload"))return;for(const E of document.querySelectorAll('link[rel="modulepreload"]'))r(E);new MutationObserver(E=>{for(const O of E)if(O.type==="childList")for(const C of O.addedNodes)C.tagName==="LINK"&&C.rel==="modulepreload"&&r(C)}).observe(document,{childList:!0,subtree:!0});function S(E){const O={};return E.integrity&&(O.integrity=E.integrity),E.referrerPolicy&&(O.referrerPolicy=E.referrerPolicy),E.crossOrigin==="use-credentials"?O.credentials="include":E.crossOrigin==="anonymous"?O.credentials="omit":O.credentials="same-origin",O}function r(E){if(E.ep)return;E.ep=!0;const O=S(E);fetch(E.href,O)}})();function xd(g){return g&&g.__esModule&&Object.prototype.hasOwnProperty.call(g,"default")?g.default:g}var es={exports:{}},yn={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var id;function $g(){if(id)return yn;id=1;var g=Symbol.for("react.transitional.element"),p=Symbol.for("react.fragment");function S(r,E,O){var C=null;if(O!==void 0&&(C=""+O),E.key!==void 0&&(C=""+E.key),"key"in E){O={};for(var Y in E)Y!=="key"&&(O[Y]=E[Y])}else O=E;return E=O.ref,{$$typeof:g,type:r,key:C,ref:E!==void 0?E:null,props:O}}return yn.Fragment=p,yn.jsx=S,yn.jsxs=S,yn}var cd;function Wg(){return cd||(cd=1,es.exports=$g()),es.exports}var s=Wg(),ts={exports:{}},k={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var sd;function Fg(){if(sd)return k;sd=1;var g=Symbol.for("react.transitional.element"),p=Symbol.for("react.portal"),S=Symbol.for("react.fragment"),r=Symbol.for("react.strict_mode"),E=Symbol.for("react.profiler"),O=Symbol.for("react.consumer"),C=Symbol.for("react.context"),Y=Symbol.for("react.forward_ref"),D=Symbol.for("react.suspense"),y=Symbol.for("react.memo"),w=Symbol.for("react.lazy"),U=Symbol.iterator;function M(o){return o===null||typeof o!="object"?null:(o=U&&o[U]||o["@@iterator"],typeof o=="function"?o:null)}var W={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},K=Object.assign,ve={};function ie(o,N,H){this.props=o,this.context=N,this.refs=ve,this.updater=H||W}ie.prototype.isReactComponent={},ie.prototype.setState=function(o,N){if(typeof o!="object"&&typeof o!="function"&&o!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,o,N,"setState")},ie.prototype.forceUpdate=function(o){this.updater.enqueueForceUpdate(this,o,"forceUpdate")};function ot(){}ot.prototype=ie.prototype;function et(o,N,H){this.props=o,this.context=N,this.refs=ve,this.updater=H||W}var be=et.prototype=new ot;be.constructor=et,K(be,ie.prototype),be.isPureReactComponent=!0;var qe=Array.isArray,J={H:null,A:null,T:null,S:null,V:null},Ge=Object.prototype.hasOwnProperty;function Oe(o,N,H,R,L,ae){return H=ae.ref,{$$typeof:g,type:o,key:N,ref:H!==void 0?H:null,props:ae}}function le(o,N){return Oe(o.type,N,void 0,void 0,void 0,o.props)}function he(o){return typeof o=="object"&&o!==null&&o.$$typeof===g}function Me(o){var N={"=":"=0",":":"=2"};return"$"+o.replace(/[=:]/g,function(H){return N[H]})}var De=/\/+/g;function fe(o,N){return typeof o=="object"&&o!==null&&o.key!=null?Me(""+o.key):N.toString(36)}function Ae(){}function ke(o){switch(o.status){case"fulfilled":return o.value;case"rejected":throw o.reason;default:switch(typeof o.status=="string"?o.then(Ae,Ae):(o.status="pending",o.then(function(N){o.status==="pending"&&(o.status="fulfilled",o.value=N)},function(N){o.status==="pending"&&(o.status="rejected",o.reason=N)})),o.status){case"fulfilled":return o.value;case"rejected":throw o.reason}}throw o}function Se(o,N,H,R,L){var ae=typeof o;(ae==="undefined"||ae==="boolean")&&(o=null);var Z=!1;if(o===null)Z=!0;else switch(ae){case"bigint":case"string":case"number":Z=!0;break;case"object":switch(o.$$typeof){case g:case p:Z=!0;break;case w:return Z=o._init,Se(Z(o._payload),N,H,R,L)}}if(Z)return L=L(o),Z=R===""?"."+fe(o,0):R,qe(L)?(H="",Z!=null&&(H=Z.replace(De,"$&/")+"/"),Se(L,N,H,"",function(Zt){return Zt})):L!=null&&(he(L)&&(L=le(L,H+(L.key==null||o&&o.key===L.key?"":(""+L.key).replace(De,"$&/")+"/")+Z)),N.push(L)),1;Z=0;var tt=R===""?".":R+":";if(qe(o))for(var ye=0;ye<o.length;ye++)R=o[ye],ae=tt+fe(R,ye),Z+=Se(R,N,H,ae,L);else if(ye=M(o),typeof ye=="function")for(o=ye.call(o),ye=0;!(R=o.next()).done;)R=R.value,ae=tt+fe(R,ye++),Z+=Se(R,N,H,ae,L);else if(ae==="object"){if(typeof o.then=="function")return Se(ke(o),N,H,R,L);throw N=String(o),Error("Objects are not valid as a React child (found: "+(N==="[object Object]"?"object with keys {"+Object.keys(o).join(", ")+"}":N)+"). If you meant to render a collection of children, use an array instead.")}return Z}function h(o,N,H){if(o==null)return o;var R=[],L=0;return Se(o,R,"","",function(ae){return N.call(H,ae,L++)}),R}function _(o){if(o._status===-1){var N=o._result;N=N(),N.then(function(H){(o._status===0||o._status===-1)&&(o._status=1,o._result=H)},function(H){(o._status===0||o._status===-1)&&(o._status=2,o._result=H)}),o._status===-1&&(o._status=0,o._result=N)}if(o._status===1)return o._result.default;throw o._result}var B=typeof reportError=="function"?reportError:function(o){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var N=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof o=="object"&&o!==null&&typeof o.message=="string"?String(o.message):String(o),error:o});if(!window.dispatchEvent(N))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",o);return}console.error(o)};function ee(){}return k.Children={map:h,forEach:function(o,N,H){h(o,function(){N.apply(this,arguments)},H)},count:function(o){var N=0;return h(o,function(){N++}),N},toArray:function(o){return h(o,function(N){return N})||[]},only:function(o){if(!he(o))throw Error("React.Children.only expected to receive a single React element child.");return o}},k.Component=ie,k.Fragment=S,k.Profiler=E,k.PureComponent=et,k.StrictMode=r,k.Suspense=D,k.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=J,k.__COMPILER_RUNTIME={__proto__:null,c:function(o){return J.H.useMemoCache(o)}},k.cache=function(o){return function(){return o.apply(null,arguments)}},k.cloneElement=function(o,N,H){if(o==null)throw Error("The argument must be a React element, but you passed "+o+".");var R=K({},o.props),L=o.key,ae=void 0;if(N!=null)for(Z in N.ref!==void 0&&(ae=void 0),N.key!==void 0&&(L=""+N.key),N)!Ge.call(N,Z)||Z==="key"||Z==="__self"||Z==="__source"||Z==="ref"&&N.ref===void 0||(R[Z]=N[Z]);var Z=arguments.length-2;if(Z===1)R.children=H;else if(1<Z){for(var tt=Array(Z),ye=0;ye<Z;ye++)tt[ye]=arguments[ye+2];R.children=tt}return Oe(o.type,L,void 0,void 0,ae,R)},k.createContext=function(o){return o={$$typeof:C,_currentValue:o,_currentValue2:o,_threadCount:0,Provider:null,Consumer:null},o.Provider=o,o.Consumer={$$typeof:O,_context:o},o},k.createElement=function(o,N,H){var R,L={},ae=null;if(N!=null)for(R in N.key!==void 0&&(ae=""+N.key),N)Ge.call(N,R)&&R!=="key"&&R!=="__self"&&R!=="__source"&&(L[R]=N[R]);var Z=arguments.length-2;if(Z===1)L.children=H;else if(1<Z){for(var tt=Array(Z),ye=0;ye<Z;ye++)tt[ye]=arguments[ye+2];L.children=tt}if(o&&o.defaultProps)for(R in Z=o.defaultProps,Z)L[R]===void 0&&(L[R]=Z[R]);return Oe(o,ae,void 0,void 0,null,L)},k.createRef=function(){return{current:null}},k.forwardRef=function(o){return{$$typeof:Y,render:o}},k.isValidElement=he,k.lazy=function(o){return{$$typeof:w,_payload:{_status:-1,_result:o},_init:_}},k.memo=function(o,N){return{$$typeof:y,type:o,compare:N===void 0?null:N}},k.startTransition=function(o){var N=J.T,H={};J.T=H;try{var R=o(),L=J.S;L!==null&&L(H,R),typeof R=="object"&&R!==null&&typeof R.then=="function"&&R.then(ee,B)}catch(ae){B(ae)}finally{J.T=N}},k.unstable_useCacheRefresh=function(){return J.H.useCacheRefresh()},k.use=function(o){return J.H.use(o)},k.useActionState=function(o,N,H){return J.H.useActionState(o,N,H)},k.useCallback=function(o,N){return J.H.useCallback(o,N)},k.useContext=function(o){return J.H.useContext(o)},k.useDebugValue=function(){},k.useDeferredValue=function(o,N){return J.H.useDeferredValue(o,N)},k.useEffect=function(o,N,H){var R=J.H;if(typeof H=="function")throw Error("useEffect CRUD overload is not enabled in this build of React.");return R.useEffect(o,N)},k.useId=function(){return J.H.useId()},k.useImperativeHandle=function(o,N,H){return J.H.useImperativeHandle(o,N,H)},k.useInsertionEffect=function(o,N){return J.H.useInsertionEffect(o,N)},k.useLayoutEffect=function(o,N){return J.H.useLayoutEffect(o,N)},k.useMemo=function(o,N){return J.H.useMemo(o,N)},k.useOptimistic=function(o,N){return J.H.useOptimistic(o,N)},k.useReducer=function(o,N,H){return J.H.useReducer(o,N,H)},k.useRef=function(o){return J.H.useRef(o)},k.useState=function(o){return J.H.useState(o)},k.useSyncExternalStore=function(o,N,H){return J.H.useSyncExternalStore(o,N,H)},k.useTransition=function(){return J.H.useTransition()},k.version="19.1.0",k}var fd;function fs(){return fd||(fd=1,ts.exports=Fg()),ts.exports}var ge=fs();const Pg=xd(ge);var ls={exports:{}},xn={},as={exports:{}},ns={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var rd;function Ig(){return rd||(rd=1,function(g){function p(h,_){var B=h.length;h.push(_);e:for(;0<B;){var ee=B-1>>>1,o=h[ee];if(0<E(o,_))h[ee]=_,h[B]=o,B=ee;else break e}}function S(h){return h.length===0?null:h[0]}function r(h){if(h.length===0)return null;var _=h[0],B=h.pop();if(B!==_){h[0]=B;e:for(var ee=0,o=h.length,N=o>>>1;ee<N;){var H=2*(ee+1)-1,R=h[H],L=H+1,ae=h[L];if(0>E(R,B))L<o&&0>E(ae,R)?(h[ee]=ae,h[L]=B,ee=L):(h[ee]=R,h[H]=B,ee=H);else if(L<o&&0>E(ae,B))h[ee]=ae,h[L]=B,ee=L;else break e}}return _}function E(h,_){var B=h.sortIndex-_.sortIndex;return B!==0?B:h.id-_.id}if(g.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var O=performance;g.unstable_now=function(){return O.now()}}else{var C=Date,Y=C.now();g.unstable_now=function(){return C.now()-Y}}var D=[],y=[],w=1,U=null,M=3,W=!1,K=!1,ve=!1,ie=!1,ot=typeof setTimeout=="function"?setTimeout:null,et=typeof clearTimeout=="function"?clearTimeout:null,be=typeof setImmediate<"u"?setImmediate:null;function qe(h){for(var _=S(y);_!==null;){if(_.callback===null)r(y);else if(_.startTime<=h)r(y),_.sortIndex=_.expirationTime,p(D,_);else break;_=S(y)}}function J(h){if(ve=!1,qe(h),!K)if(S(D)!==null)K=!0,Ge||(Ge=!0,fe());else{var _=S(y);_!==null&&Se(J,_.startTime-h)}}var Ge=!1,Oe=-1,le=5,he=-1;function Me(){return ie?!0:!(g.unstable_now()-he<le)}function De(){if(ie=!1,Ge){var h=g.unstable_now();he=h;var _=!0;try{e:{K=!1,ve&&(ve=!1,et(Oe),Oe=-1),W=!0;var B=M;try{t:{for(qe(h),U=S(D);U!==null&&!(U.expirationTime>h&&Me());){var ee=U.callback;if(typeof ee=="function"){U.callback=null,M=U.priorityLevel;var o=ee(U.expirationTime<=h);if(h=g.unstable_now(),typeof o=="function"){U.callback=o,qe(h),_=!0;break t}U===S(D)&&r(D),qe(h)}else r(D);U=S(D)}if(U!==null)_=!0;else{var N=S(y);N!==null&&Se(J,N.startTime-h),_=!1}}break e}finally{U=null,M=B,W=!1}_=void 0}}finally{_?fe():Ge=!1}}}var fe;if(typeof be=="function")fe=function(){be(De)};else if(typeof MessageChannel<"u"){var Ae=new MessageChannel,ke=Ae.port2;Ae.port1.onmessage=De,fe=function(){ke.postMessage(null)}}else fe=function(){ot(De,0)};function Se(h,_){Oe=ot(function(){h(g.unstable_now())},_)}g.unstable_IdlePriority=5,g.unstable_ImmediatePriority=1,g.unstable_LowPriority=4,g.unstable_NormalPriority=3,g.unstable_Profiling=null,g.unstable_UserBlockingPriority=2,g.unstable_cancelCallback=function(h){h.callback=null},g.unstable_forceFrameRate=function(h){0>h||125<h?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):le=0<h?Math.floor(1e3/h):5},g.unstable_getCurrentPriorityLevel=function(){return M},g.unstable_next=function(h){switch(M){case 1:case 2:case 3:var _=3;break;default:_=M}var B=M;M=_;try{return h()}finally{M=B}},g.unstable_requestPaint=function(){ie=!0},g.unstable_runWithPriority=function(h,_){switch(h){case 1:case 2:case 3:case 4:case 5:break;default:h=3}var B=M;M=h;try{return _()}finally{M=B}},g.unstable_scheduleCallback=function(h,_,B){var ee=g.unstable_now();switch(typeof B=="object"&&B!==null?(B=B.delay,B=typeof B=="number"&&0<B?ee+B:ee):B=ee,h){case 1:var o=-1;break;case 2:o=250;break;case 5:o=1073741823;break;case 4:o=1e4;break;default:o=5e3}return o=B+o,h={id:w++,callback:_,priorityLevel:h,startTime:B,expirationTime:o,sortIndex:-1},B>ee?(h.sortIndex=B,p(y,h),S(D)===null&&h===S(y)&&(ve?(et(Oe),Oe=-1):ve=!0,Se(J,B-ee))):(h.sortIndex=o,p(D,h),K||W||(K=!0,Ge||(Ge=!0,fe()))),h},g.unstable_shouldYield=Me,g.unstable_wrapCallback=function(h){var _=M;return function(){var B=M;M=_;try{return h.apply(this,arguments)}finally{M=B}}}}(ns)),ns}var od;function eh(){return od||(od=1,as.exports=Ig()),as.exports}var us={exports:{}},Ke={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var dd;function th(){if(dd)return Ke;dd=1;var g=fs();function p(D){var y="https://react.dev/errors/"+D;if(1<arguments.length){y+="?args[]="+encodeURIComponent(arguments[1]);for(var w=2;w<arguments.length;w++)y+="&args[]="+encodeURIComponent(arguments[w])}return"Minified React error #"+D+"; visit "+y+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function S(){}var r={d:{f:S,r:function(){throw Error(p(522))},D:S,C:S,L:S,m:S,X:S,S,M:S},p:0,findDOMNode:null},E=Symbol.for("react.portal");function O(D,y,w){var U=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:E,key:U==null?null:""+U,children:D,containerInfo:y,implementation:w}}var C=g.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function Y(D,y){if(D==="font")return"";if(typeof y=="string")return y==="use-credentials"?y:""}return Ke.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=r,Ke.createPortal=function(D,y){var w=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!y||y.nodeType!==1&&y.nodeType!==9&&y.nodeType!==11)throw Error(p(299));return O(D,y,null,w)},Ke.flushSync=function(D){var y=C.T,w=r.p;try{if(C.T=null,r.p=2,D)return D()}finally{C.T=y,r.p=w,r.d.f()}},Ke.preconnect=function(D,y){typeof D=="string"&&(y?(y=y.crossOrigin,y=typeof y=="string"?y==="use-credentials"?y:"":void 0):y=null,r.d.C(D,y))},Ke.prefetchDNS=function(D){typeof D=="string"&&r.d.D(D)},Ke.preinit=function(D,y){if(typeof D=="string"&&y&&typeof y.as=="string"){var w=y.as,U=Y(w,y.crossOrigin),M=typeof y.integrity=="string"?y.integrity:void 0,W=typeof y.fetchPriority=="string"?y.fetchPriority:void 0;w==="style"?r.d.S(D,typeof y.precedence=="string"?y.precedence:void 0,{crossOrigin:U,integrity:M,fetchPriority:W}):w==="script"&&r.d.X(D,{crossOrigin:U,integrity:M,fetchPriority:W,nonce:typeof y.nonce=="string"?y.nonce:void 0})}},Ke.preinitModule=function(D,y){if(typeof D=="string")if(typeof y=="object"&&y!==null){if(y.as==null||y.as==="script"){var w=Y(y.as,y.crossOrigin);r.d.M(D,{crossOrigin:w,integrity:typeof y.integrity=="string"?y.integrity:void 0,nonce:typeof y.nonce=="string"?y.nonce:void 0})}}else y==null&&r.d.M(D)},Ke.preload=function(D,y){if(typeof D=="string"&&typeof y=="object"&&y!==null&&typeof y.as=="string"){var w=y.as,U=Y(w,y.crossOrigin);r.d.L(D,w,{crossOrigin:U,integrity:typeof y.integrity=="string"?y.integrity:void 0,nonce:typeof y.nonce=="string"?y.nonce:void 0,type:typeof y.type=="string"?y.type:void 0,fetchPriority:typeof y.fetchPriority=="string"?y.fetchPriority:void 0,referrerPolicy:typeof y.referrerPolicy=="string"?y.referrerPolicy:void 0,imageSrcSet:typeof y.imageSrcSet=="string"?y.imageSrcSet:void 0,imageSizes:typeof y.imageSizes=="string"?y.imageSizes:void 0,media:typeof y.media=="string"?y.media:void 0})}},Ke.preloadModule=function(D,y){if(typeof D=="string")if(y){var w=Y(y.as,y.crossOrigin);r.d.m(D,{as:typeof y.as=="string"&&y.as!=="script"?y.as:void 0,crossOrigin:w,integrity:typeof y.integrity=="string"?y.integrity:void 0})}else r.d.m(D)},Ke.requestFormReset=function(D){r.d.r(D)},Ke.unstable_batchedUpdates=function(D,y){return D(y)},Ke.useFormState=function(D,y,w){return C.H.useFormState(D,y,w)},Ke.useFormStatus=function(){return C.H.useHostTransitionStatus()},Ke.version="19.1.0",Ke}var gd;function lh(){if(gd)return us.exports;gd=1;function g(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(g)}catch(p){console.error(p)}}return g(),us.exports=th(),us.exports}/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var hd;function ah(){if(hd)return xn;hd=1;var g=eh(),p=fs(),S=lh();function r(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var l=2;l<arguments.length;l++)t+="&args[]="+encodeURIComponent(arguments[l])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function E(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function O(e){var t=e,l=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(l=t.return),e=t.return;while(e)}return t.tag===3?l:null}function C(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Y(e){if(O(e)!==e)throw Error(r(188))}function D(e){var t=e.alternate;if(!t){if(t=O(e),t===null)throw Error(r(188));return t!==e?null:e}for(var l=e,a=t;;){var n=l.return;if(n===null)break;var u=n.alternate;if(u===null){if(a=n.return,a!==null){l=a;continue}break}if(n.child===u.child){for(u=n.child;u;){if(u===l)return Y(n),e;if(u===a)return Y(n),t;u=u.sibling}throw Error(r(188))}if(l.return!==a.return)l=n,a=u;else{for(var i=!1,c=n.child;c;){if(c===l){i=!0,l=n,a=u;break}if(c===a){i=!0,a=n,l=u;break}c=c.sibling}if(!i){for(c=u.child;c;){if(c===l){i=!0,l=u,a=n;break}if(c===a){i=!0,a=u,l=n;break}c=c.sibling}if(!i)throw Error(r(189))}}if(l.alternate!==a)throw Error(r(190))}if(l.tag!==3)throw Error(r(188));return l.stateNode.current===l?e:t}function y(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=y(e),t!==null)return t;e=e.sibling}return null}var w=Object.assign,U=Symbol.for("react.element"),M=Symbol.for("react.transitional.element"),W=Symbol.for("react.portal"),K=Symbol.for("react.fragment"),ve=Symbol.for("react.strict_mode"),ie=Symbol.for("react.profiler"),ot=Symbol.for("react.provider"),et=Symbol.for("react.consumer"),be=Symbol.for("react.context"),qe=Symbol.for("react.forward_ref"),J=Symbol.for("react.suspense"),Ge=Symbol.for("react.suspense_list"),Oe=Symbol.for("react.memo"),le=Symbol.for("react.lazy"),he=Symbol.for("react.activity"),Me=Symbol.for("react.memo_cache_sentinel"),De=Symbol.iterator;function fe(e){return e===null||typeof e!="object"?null:(e=De&&e[De]||e["@@iterator"],typeof e=="function"?e:null)}var Ae=Symbol.for("react.client.reference");function ke(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===Ae?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case K:return"Fragment";case ie:return"Profiler";case ve:return"StrictMode";case J:return"Suspense";case Ge:return"SuspenseList";case he:return"Activity"}if(typeof e=="object")switch(e.$$typeof){case W:return"Portal";case be:return(e.displayName||"Context")+".Provider";case et:return(e._context.displayName||"Context")+".Consumer";case qe:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Oe:return t=e.displayName||null,t!==null?t:ke(e.type)||"Memo";case le:t=e._payload,e=e._init;try{return ke(e(t))}catch{}}return null}var Se=Array.isArray,h=p.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,_=S.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,B={pending:!1,data:null,method:null,action:null},ee=[],o=-1;function N(e){return{current:e}}function H(e){0>o||(e.current=ee[o],ee[o]=null,o--)}function R(e,t){o++,ee[o]=e.current,e.current=t}var L=N(null),ae=N(null),Z=N(null),tt=N(null);function ye(e,t){switch(R(Z,t),R(ae,e),R(L,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?Ro(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=Ro(t),e=wo(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}H(L),R(L,e)}function Zt(){H(L),H(ae),H(Z)}function qu(e){e.memoizedState!==null&&R(tt,e);var t=L.current,l=wo(t,e.type);t!==l&&(R(ae,e),R(L,l))}function Tn(e){ae.current===e&&(H(L),H(ae)),tt.current===e&&(H(tt),hn._currentValue=B)}var Gu=Object.prototype.hasOwnProperty,Lu=g.unstable_scheduleCallback,Xu=g.unstable_cancelCallback,Ad=g.unstable_shouldYield,jd=g.unstable_requestPaint,zt=g.unstable_now,Nd=g.unstable_getCurrentPriorityLevel,os=g.unstable_ImmediatePriority,ds=g.unstable_UserBlockingPriority,En=g.unstable_NormalPriority,Od=g.unstable_LowPriority,gs=g.unstable_IdlePriority,Dd=g.log,_d=g.unstable_setDisableYieldValue,Sa=null,lt=null;function Kt(e){if(typeof Dd=="function"&&_d(e),lt&&typeof lt.setStrictMode=="function")try{lt.setStrictMode(Sa,e)}catch{}}var at=Math.clz32?Math.clz32:Rd,Ud=Math.log,Md=Math.LN2;function Rd(e){return e>>>=0,e===0?32:31-(Ud(e)/Md|0)|0}var zn=256,An=4194304;function pl(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194048;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function jn(e,t,l){var a=e.pendingLanes;if(a===0)return 0;var n=0,u=e.suspendedLanes,i=e.pingedLanes;e=e.warmLanes;var c=a&134217727;return c!==0?(a=c&~u,a!==0?n=pl(a):(i&=c,i!==0?n=pl(i):l||(l=c&~e,l!==0&&(n=pl(l))))):(c=a&~u,c!==0?n=pl(c):i!==0?n=pl(i):l||(l=a&~e,l!==0&&(n=pl(l)))),n===0?0:t!==0&&t!==n&&(t&u)===0&&(u=n&-n,l=t&-t,u>=l||u===32&&(l&4194048)!==0)?t:n}function Ta(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function wd(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function hs(){var e=zn;return zn<<=1,(zn&4194048)===0&&(zn=256),e}function ms(){var e=An;return An<<=1,(An&62914560)===0&&(An=4194304),e}function Qu(e){for(var t=[],l=0;31>l;l++)t.push(e);return t}function Ea(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function Hd(e,t,l,a,n,u){var i=e.pendingLanes;e.pendingLanes=l,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=l,e.entangledLanes&=l,e.errorRecoveryDisabledLanes&=l,e.shellSuspendCounter=0;var c=e.entanglements,f=e.expirationTimes,b=e.hiddenUpdates;for(l=i&~l;0<l;){var z=31-at(l),j=1<<z;c[z]=0,f[z]=-1;var x=b[z];if(x!==null)for(b[z]=null,z=0;z<x.length;z++){var T=x[z];T!==null&&(T.lane&=-536870913)}l&=~j}a!==0&&ps(e,a,0),u!==0&&n===0&&e.tag!==0&&(e.suspendedLanes|=u&~(i&~t))}function ps(e,t,l){e.pendingLanes|=t,e.suspendedLanes&=~t;var a=31-at(t);e.entangledLanes|=t,e.entanglements[a]=e.entanglements[a]|1073741824|l&4194090}function vs(e,t){var l=e.entangledLanes|=t;for(e=e.entanglements;l;){var a=31-at(l),n=1<<a;n&t|e[a]&t&&(e[a]|=t),l&=~n}}function Vu(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Zu(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function bs(){var e=_.p;return e!==0?e:(e=window.event,e===void 0?32:Io(e.type))}function Cd(e,t){var l=_.p;try{return _.p=e,t()}finally{_.p=l}}var kt=Math.random().toString(36).slice(2),Ve="__reactFiber$"+kt,$e="__reactProps$"+kt,wl="__reactContainer$"+kt,Ku="__reactEvents$"+kt,Yd="__reactListeners$"+kt,Bd="__reactHandles$"+kt,ys="__reactResources$"+kt,za="__reactMarker$"+kt;function ku(e){delete e[Ve],delete e[$e],delete e[Ku],delete e[Yd],delete e[Bd]}function Hl(e){var t=e[Ve];if(t)return t;for(var l=e.parentNode;l;){if(t=l[wl]||l[Ve]){if(l=t.alternate,t.child!==null||l!==null&&l.child!==null)for(e=Bo(e);e!==null;){if(l=e[Ve])return l;e=Bo(e)}return t}e=l,l=e.parentNode}return null}function Cl(e){if(e=e[Ve]||e[wl]){var t=e.tag;if(t===5||t===6||t===13||t===26||t===27||t===3)return e}return null}function Aa(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(r(33))}function Yl(e){var t=e[ys];return t||(t=e[ys]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function He(e){e[za]=!0}var xs=new Set,Ss={};function vl(e,t){Bl(e,t),Bl(e+"Capture",t)}function Bl(e,t){for(Ss[e]=t,e=0;e<t.length;e++)xs.add(t[e])}var qd=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Ts={},Es={};function Gd(e){return Gu.call(Es,e)?!0:Gu.call(Ts,e)?!1:qd.test(e)?Es[e]=!0:(Ts[e]=!0,!1)}function Nn(e,t,l){if(Gd(t))if(l===null)e.removeAttribute(t);else{switch(typeof l){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var a=t.toLowerCase().slice(0,5);if(a!=="data-"&&a!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,""+l)}}function On(e,t,l){if(l===null)e.removeAttribute(t);else{switch(typeof l){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,""+l)}}function _t(e,t,l,a){if(a===null)e.removeAttribute(l);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(l);return}e.setAttributeNS(t,l,""+a)}}var Ju,zs;function ql(e){if(Ju===void 0)try{throw Error()}catch(l){var t=l.stack.trim().match(/\n( *(at )?)/);Ju=t&&t[1]||"",zs=-1<l.stack.indexOf(`
    at`)?" (<anonymous>)":-1<l.stack.indexOf("@")?"@unknown:0:0":""}return`
`+Ju+e+zs}var $u=!1;function Wu(e,t){if(!e||$u)return"";$u=!0;var l=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var a={DetermineComponentFrameRoot:function(){try{if(t){var j=function(){throw Error()};if(Object.defineProperty(j.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(j,[])}catch(T){var x=T}Reflect.construct(e,[],j)}else{try{j.call()}catch(T){x=T}e.call(j.prototype)}}else{try{throw Error()}catch(T){x=T}(j=e())&&typeof j.catch=="function"&&j.catch(function(){})}}catch(T){if(T&&x&&typeof T.stack=="string")return[T.stack,x.stack]}return[null,null]}};a.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var n=Object.getOwnPropertyDescriptor(a.DetermineComponentFrameRoot,"name");n&&n.configurable&&Object.defineProperty(a.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var u=a.DetermineComponentFrameRoot(),i=u[0],c=u[1];if(i&&c){var f=i.split(`
`),b=c.split(`
`);for(n=a=0;a<f.length&&!f[a].includes("DetermineComponentFrameRoot");)a++;for(;n<b.length&&!b[n].includes("DetermineComponentFrameRoot");)n++;if(a===f.length||n===b.length)for(a=f.length-1,n=b.length-1;1<=a&&0<=n&&f[a]!==b[n];)n--;for(;1<=a&&0<=n;a--,n--)if(f[a]!==b[n]){if(a!==1||n!==1)do if(a--,n--,0>n||f[a]!==b[n]){var z=`
`+f[a].replace(" at new "," at ");return e.displayName&&z.includes("<anonymous>")&&(z=z.replace("<anonymous>",e.displayName)),z}while(1<=a&&0<=n);break}}}finally{$u=!1,Error.prepareStackTrace=l}return(l=e?e.displayName||e.name:"")?ql(l):""}function Ld(e){switch(e.tag){case 26:case 27:case 5:return ql(e.type);case 16:return ql("Lazy");case 13:return ql("Suspense");case 19:return ql("SuspenseList");case 0:case 15:return Wu(e.type,!1);case 11:return Wu(e.type.render,!1);case 1:return Wu(e.type,!0);case 31:return ql("Activity");default:return""}}function As(e){try{var t="";do t+=Ld(e),e=e.return;while(e);return t}catch(l){return`
Error generating stack: `+l.message+`
`+l.stack}}function dt(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function js(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Xd(e){var t=js(e)?"checked":"value",l=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),a=""+e[t];if(!e.hasOwnProperty(t)&&typeof l<"u"&&typeof l.get=="function"&&typeof l.set=="function"){var n=l.get,u=l.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return n.call(this)},set:function(i){a=""+i,u.call(this,i)}}),Object.defineProperty(e,t,{enumerable:l.enumerable}),{getValue:function(){return a},setValue:function(i){a=""+i},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Dn(e){e._valueTracker||(e._valueTracker=Xd(e))}function Ns(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var l=t.getValue(),a="";return e&&(a=js(e)?e.checked?"true":"false":e.value),e=a,e!==l?(t.setValue(e),!0):!1}function _n(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var Qd=/[\n"\\]/g;function gt(e){return e.replace(Qd,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function Fu(e,t,l,a,n,u,i,c){e.name="",i!=null&&typeof i!="function"&&typeof i!="symbol"&&typeof i!="boolean"?e.type=i:e.removeAttribute("type"),t!=null?i==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+dt(t)):e.value!==""+dt(t)&&(e.value=""+dt(t)):i!=="submit"&&i!=="reset"||e.removeAttribute("value"),t!=null?Pu(e,i,dt(t)):l!=null?Pu(e,i,dt(l)):a!=null&&e.removeAttribute("value"),n==null&&u!=null&&(e.defaultChecked=!!u),n!=null&&(e.checked=n&&typeof n!="function"&&typeof n!="symbol"),c!=null&&typeof c!="function"&&typeof c!="symbol"&&typeof c!="boolean"?e.name=""+dt(c):e.removeAttribute("name")}function Os(e,t,l,a,n,u,i,c){if(u!=null&&typeof u!="function"&&typeof u!="symbol"&&typeof u!="boolean"&&(e.type=u),t!=null||l!=null){if(!(u!=="submit"&&u!=="reset"||t!=null))return;l=l!=null?""+dt(l):"",t=t!=null?""+dt(t):l,c||t===e.value||(e.value=t),e.defaultValue=t}a=a??n,a=typeof a!="function"&&typeof a!="symbol"&&!!a,e.checked=c?e.checked:!!a,e.defaultChecked=!!a,i!=null&&typeof i!="function"&&typeof i!="symbol"&&typeof i!="boolean"&&(e.name=i)}function Pu(e,t,l){t==="number"&&_n(e.ownerDocument)===e||e.defaultValue===""+l||(e.defaultValue=""+l)}function Gl(e,t,l,a){if(e=e.options,t){t={};for(var n=0;n<l.length;n++)t["$"+l[n]]=!0;for(l=0;l<e.length;l++)n=t.hasOwnProperty("$"+e[l].value),e[l].selected!==n&&(e[l].selected=n),n&&a&&(e[l].defaultSelected=!0)}else{for(l=""+dt(l),t=null,n=0;n<e.length;n++){if(e[n].value===l){e[n].selected=!0,a&&(e[n].defaultSelected=!0);return}t!==null||e[n].disabled||(t=e[n])}t!==null&&(t.selected=!0)}}function Ds(e,t,l){if(t!=null&&(t=""+dt(t),t!==e.value&&(e.value=t),l==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=l!=null?""+dt(l):""}function _s(e,t,l,a){if(t==null){if(a!=null){if(l!=null)throw Error(r(92));if(Se(a)){if(1<a.length)throw Error(r(93));a=a[0]}l=a}l==null&&(l=""),t=l}l=dt(t),e.defaultValue=l,a=e.textContent,a===l&&a!==""&&a!==null&&(e.value=a)}function Ll(e,t){if(t){var l=e.firstChild;if(l&&l===e.lastChild&&l.nodeType===3){l.nodeValue=t;return}}e.textContent=t}var Vd=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Us(e,t,l){var a=t.indexOf("--")===0;l==null||typeof l=="boolean"||l===""?a?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":a?e.setProperty(t,l):typeof l!="number"||l===0||Vd.has(t)?t==="float"?e.cssFloat=l:e[t]=(""+l).trim():e[t]=l+"px"}function Ms(e,t,l){if(t!=null&&typeof t!="object")throw Error(r(62));if(e=e.style,l!=null){for(var a in l)!l.hasOwnProperty(a)||t!=null&&t.hasOwnProperty(a)||(a.indexOf("--")===0?e.setProperty(a,""):a==="float"?e.cssFloat="":e[a]="");for(var n in t)a=t[n],t.hasOwnProperty(n)&&l[n]!==a&&Us(e,n,a)}else for(var u in t)t.hasOwnProperty(u)&&Us(e,u,t[u])}function Iu(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Zd=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),Kd=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Un(e){return Kd.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}var ei=null;function ti(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Xl=null,Ql=null;function Rs(e){var t=Cl(e);if(t&&(e=t.stateNode)){var l=e[$e]||null;e:switch(e=t.stateNode,t.type){case"input":if(Fu(e,l.value,l.defaultValue,l.defaultValue,l.checked,l.defaultChecked,l.type,l.name),t=l.name,l.type==="radio"&&t!=null){for(l=e;l.parentNode;)l=l.parentNode;for(l=l.querySelectorAll('input[name="'+gt(""+t)+'"][type="radio"]'),t=0;t<l.length;t++){var a=l[t];if(a!==e&&a.form===e.form){var n=a[$e]||null;if(!n)throw Error(r(90));Fu(a,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name)}}for(t=0;t<l.length;t++)a=l[t],a.form===e.form&&Ns(a)}break e;case"textarea":Ds(e,l.value,l.defaultValue);break e;case"select":t=l.value,t!=null&&Gl(e,!!l.multiple,t,!1)}}}var li=!1;function ws(e,t,l){if(li)return e(t,l);li=!0;try{var a=e(t);return a}finally{if(li=!1,(Xl!==null||Ql!==null)&&(pu(),Xl&&(t=Xl,e=Ql,Ql=Xl=null,Rs(t),e)))for(t=0;t<e.length;t++)Rs(e[t])}}function ja(e,t){var l=e.stateNode;if(l===null)return null;var a=l[$e]||null;if(a===null)return null;l=a[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(a=!a.disabled)||(e=e.type,a=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!a;break e;default:e=!1}if(e)return null;if(l&&typeof l!="function")throw Error(r(231,t,typeof l));return l}var Ut=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),ai=!1;if(Ut)try{var Na={};Object.defineProperty(Na,"passive",{get:function(){ai=!0}}),window.addEventListener("test",Na,Na),window.removeEventListener("test",Na,Na)}catch{ai=!1}var Jt=null,ni=null,Mn=null;function Hs(){if(Mn)return Mn;var e,t=ni,l=t.length,a,n="value"in Jt?Jt.value:Jt.textContent,u=n.length;for(e=0;e<l&&t[e]===n[e];e++);var i=l-e;for(a=1;a<=i&&t[l-a]===n[u-a];a++);return Mn=n.slice(e,1<a?1-a:void 0)}function Rn(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function wn(){return!0}function Cs(){return!1}function We(e){function t(l,a,n,u,i){this._reactName=l,this._targetInst=n,this.type=a,this.nativeEvent=u,this.target=i,this.currentTarget=null;for(var c in e)e.hasOwnProperty(c)&&(l=e[c],this[c]=l?l(u):u[c]);return this.isDefaultPrevented=(u.defaultPrevented!=null?u.defaultPrevented:u.returnValue===!1)?wn:Cs,this.isPropagationStopped=Cs,this}return w(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var l=this.nativeEvent;l&&(l.preventDefault?l.preventDefault():typeof l.returnValue!="unknown"&&(l.returnValue=!1),this.isDefaultPrevented=wn)},stopPropagation:function(){var l=this.nativeEvent;l&&(l.stopPropagation?l.stopPropagation():typeof l.cancelBubble!="unknown"&&(l.cancelBubble=!0),this.isPropagationStopped=wn)},persist:function(){},isPersistent:wn}),t}var bl={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Hn=We(bl),Oa=w({},bl,{view:0,detail:0}),kd=We(Oa),ui,ii,Da,Cn=w({},Oa,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:si,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Da&&(Da&&e.type==="mousemove"?(ui=e.screenX-Da.screenX,ii=e.screenY-Da.screenY):ii=ui=0,Da=e),ui)},movementY:function(e){return"movementY"in e?e.movementY:ii}}),Ys=We(Cn),Jd=w({},Cn,{dataTransfer:0}),$d=We(Jd),Wd=w({},Oa,{relatedTarget:0}),ci=We(Wd),Fd=w({},bl,{animationName:0,elapsedTime:0,pseudoElement:0}),Pd=We(Fd),Id=w({},bl,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),e0=We(Id),t0=w({},bl,{data:0}),Bs=We(t0),l0={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},a0={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},n0={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function u0(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=n0[e])?!!t[e]:!1}function si(){return u0}var i0=w({},Oa,{key:function(e){if(e.key){var t=l0[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Rn(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?a0[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:si,charCode:function(e){return e.type==="keypress"?Rn(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Rn(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),c0=We(i0),s0=w({},Cn,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),qs=We(s0),f0=w({},Oa,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:si}),r0=We(f0),o0=w({},bl,{propertyName:0,elapsedTime:0,pseudoElement:0}),d0=We(o0),g0=w({},Cn,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),h0=We(g0),m0=w({},bl,{newState:0,oldState:0}),p0=We(m0),v0=[9,13,27,32],fi=Ut&&"CompositionEvent"in window,_a=null;Ut&&"documentMode"in document&&(_a=document.documentMode);var b0=Ut&&"TextEvent"in window&&!_a,Gs=Ut&&(!fi||_a&&8<_a&&11>=_a),Ls=" ",Xs=!1;function Qs(e,t){switch(e){case"keyup":return v0.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Vs(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Vl=!1;function y0(e,t){switch(e){case"compositionend":return Vs(t);case"keypress":return t.which!==32?null:(Xs=!0,Ls);case"textInput":return e=t.data,e===Ls&&Xs?null:e;default:return null}}function x0(e,t){if(Vl)return e==="compositionend"||!fi&&Qs(e,t)?(e=Hs(),Mn=ni=Jt=null,Vl=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return Gs&&t.locale!=="ko"?null:t.data;default:return null}}var S0={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Zs(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!S0[e.type]:t==="textarea"}function Ks(e,t,l,a){Xl?Ql?Ql.push(a):Ql=[a]:Xl=a,t=Tu(t,"onChange"),0<t.length&&(l=new Hn("onChange","change",null,l,a),e.push({event:l,listeners:t}))}var Ua=null,Ma=null;function T0(e){Oo(e,0)}function Yn(e){var t=Aa(e);if(Ns(t))return e}function ks(e,t){if(e==="change")return t}var Js=!1;if(Ut){var ri;if(Ut){var oi="oninput"in document;if(!oi){var $s=document.createElement("div");$s.setAttribute("oninput","return;"),oi=typeof $s.oninput=="function"}ri=oi}else ri=!1;Js=ri&&(!document.documentMode||9<document.documentMode)}function Ws(){Ua&&(Ua.detachEvent("onpropertychange",Fs),Ma=Ua=null)}function Fs(e){if(e.propertyName==="value"&&Yn(Ma)){var t=[];Ks(t,Ma,e,ti(e)),ws(T0,t)}}function E0(e,t,l){e==="focusin"?(Ws(),Ua=t,Ma=l,Ua.attachEvent("onpropertychange",Fs)):e==="focusout"&&Ws()}function z0(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return Yn(Ma)}function A0(e,t){if(e==="click")return Yn(t)}function j0(e,t){if(e==="input"||e==="change")return Yn(t)}function N0(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var nt=typeof Object.is=="function"?Object.is:N0;function Ra(e,t){if(nt(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var l=Object.keys(e),a=Object.keys(t);if(l.length!==a.length)return!1;for(a=0;a<l.length;a++){var n=l[a];if(!Gu.call(t,n)||!nt(e[n],t[n]))return!1}return!0}function Ps(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Is(e,t){var l=Ps(e);e=0;for(var a;l;){if(l.nodeType===3){if(a=e+l.textContent.length,e<=t&&a>=t)return{node:l,offset:t-e};e=a}e:{for(;l;){if(l.nextSibling){l=l.nextSibling;break e}l=l.parentNode}l=void 0}l=Ps(l)}}function ef(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?ef(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function tf(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=_n(e.document);t instanceof e.HTMLIFrameElement;){try{var l=typeof t.contentWindow.location.href=="string"}catch{l=!1}if(l)e=t.contentWindow;else break;t=_n(e.document)}return t}function di(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var O0=Ut&&"documentMode"in document&&11>=document.documentMode,Zl=null,gi=null,wa=null,hi=!1;function lf(e,t,l){var a=l.window===l?l.document:l.nodeType===9?l:l.ownerDocument;hi||Zl==null||Zl!==_n(a)||(a=Zl,"selectionStart"in a&&di(a)?a={start:a.selectionStart,end:a.selectionEnd}:(a=(a.ownerDocument&&a.ownerDocument.defaultView||window).getSelection(),a={anchorNode:a.anchorNode,anchorOffset:a.anchorOffset,focusNode:a.focusNode,focusOffset:a.focusOffset}),wa&&Ra(wa,a)||(wa=a,a=Tu(gi,"onSelect"),0<a.length&&(t=new Hn("onSelect","select",null,t,l),e.push({event:t,listeners:a}),t.target=Zl)))}function yl(e,t){var l={};return l[e.toLowerCase()]=t.toLowerCase(),l["Webkit"+e]="webkit"+t,l["Moz"+e]="moz"+t,l}var Kl={animationend:yl("Animation","AnimationEnd"),animationiteration:yl("Animation","AnimationIteration"),animationstart:yl("Animation","AnimationStart"),transitionrun:yl("Transition","TransitionRun"),transitionstart:yl("Transition","TransitionStart"),transitioncancel:yl("Transition","TransitionCancel"),transitionend:yl("Transition","TransitionEnd")},mi={},af={};Ut&&(af=document.createElement("div").style,"AnimationEvent"in window||(delete Kl.animationend.animation,delete Kl.animationiteration.animation,delete Kl.animationstart.animation),"TransitionEvent"in window||delete Kl.transitionend.transition);function xl(e){if(mi[e])return mi[e];if(!Kl[e])return e;var t=Kl[e],l;for(l in t)if(t.hasOwnProperty(l)&&l in af)return mi[e]=t[l];return e}var nf=xl("animationend"),uf=xl("animationiteration"),cf=xl("animationstart"),D0=xl("transitionrun"),_0=xl("transitionstart"),U0=xl("transitioncancel"),sf=xl("transitionend"),ff=new Map,pi="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");pi.push("scrollEnd");function St(e,t){ff.set(e,t),vl(t,[e])}var rf=new WeakMap;function ht(e,t){if(typeof e=="object"&&e!==null){var l=rf.get(e);return l!==void 0?l:(t={value:e,source:t,stack:As(t)},rf.set(e,t),t)}return{value:e,source:t,stack:As(t)}}var mt=[],kl=0,vi=0;function Bn(){for(var e=kl,t=vi=kl=0;t<e;){var l=mt[t];mt[t++]=null;var a=mt[t];mt[t++]=null;var n=mt[t];mt[t++]=null;var u=mt[t];if(mt[t++]=null,a!==null&&n!==null){var i=a.pending;i===null?n.next=n:(n.next=i.next,i.next=n),a.pending=n}u!==0&&of(l,n,u)}}function qn(e,t,l,a){mt[kl++]=e,mt[kl++]=t,mt[kl++]=l,mt[kl++]=a,vi|=a,e.lanes|=a,e=e.alternate,e!==null&&(e.lanes|=a)}function bi(e,t,l,a){return qn(e,t,l,a),Gn(e)}function Jl(e,t){return qn(e,null,null,t),Gn(e)}function of(e,t,l){e.lanes|=l;var a=e.alternate;a!==null&&(a.lanes|=l);for(var n=!1,u=e.return;u!==null;)u.childLanes|=l,a=u.alternate,a!==null&&(a.childLanes|=l),u.tag===22&&(e=u.stateNode,e===null||e._visibility&1||(n=!0)),e=u,u=u.return;return e.tag===3?(u=e.stateNode,n&&t!==null&&(n=31-at(l),e=u.hiddenUpdates,a=e[n],a===null?e[n]=[t]:a.push(t),t.lane=l|536870912),u):null}function Gn(e){if(50<un)throw un=0,zc=null,Error(r(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var $l={};function M0(e,t,l,a){this.tag=e,this.key=l,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=a,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function ut(e,t,l,a){return new M0(e,t,l,a)}function yi(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Mt(e,t){var l=e.alternate;return l===null?(l=ut(e.tag,t,e.key,e.mode),l.elementType=e.elementType,l.type=e.type,l.stateNode=e.stateNode,l.alternate=e,e.alternate=l):(l.pendingProps=t,l.type=e.type,l.flags=0,l.subtreeFlags=0,l.deletions=null),l.flags=e.flags&65011712,l.childLanes=e.childLanes,l.lanes=e.lanes,l.child=e.child,l.memoizedProps=e.memoizedProps,l.memoizedState=e.memoizedState,l.updateQueue=e.updateQueue,t=e.dependencies,l.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},l.sibling=e.sibling,l.index=e.index,l.ref=e.ref,l.refCleanup=e.refCleanup,l}function df(e,t){e.flags&=65011714;var l=e.alternate;return l===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=l.childLanes,e.lanes=l.lanes,e.child=l.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=l.memoizedProps,e.memoizedState=l.memoizedState,e.updateQueue=l.updateQueue,e.type=l.type,t=l.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function Ln(e,t,l,a,n,u){var i=0;if(a=e,typeof e=="function")yi(e)&&(i=1);else if(typeof e=="string")i=wg(e,l,L.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(e){case he:return e=ut(31,l,t,n),e.elementType=he,e.lanes=u,e;case K:return Sl(l.children,n,u,t);case ve:i=8,n|=24;break;case ie:return e=ut(12,l,t,n|2),e.elementType=ie,e.lanes=u,e;case J:return e=ut(13,l,t,n),e.elementType=J,e.lanes=u,e;case Ge:return e=ut(19,l,t,n),e.elementType=Ge,e.lanes=u,e;default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case ot:case be:i=10;break e;case et:i=9;break e;case qe:i=11;break e;case Oe:i=14;break e;case le:i=16,a=null;break e}i=29,l=Error(r(130,e===null?"null":typeof e,"")),a=null}return t=ut(i,l,t,n),t.elementType=e,t.type=a,t.lanes=u,t}function Sl(e,t,l,a){return e=ut(7,e,a,t),e.lanes=l,e}function xi(e,t,l){return e=ut(6,e,null,t),e.lanes=l,e}function Si(e,t,l){return t=ut(4,e.children!==null?e.children:[],e.key,t),t.lanes=l,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Wl=[],Fl=0,Xn=null,Qn=0,pt=[],vt=0,Tl=null,Rt=1,wt="";function El(e,t){Wl[Fl++]=Qn,Wl[Fl++]=Xn,Xn=e,Qn=t}function gf(e,t,l){pt[vt++]=Rt,pt[vt++]=wt,pt[vt++]=Tl,Tl=e;var a=Rt;e=wt;var n=32-at(a)-1;a&=~(1<<n),l+=1;var u=32-at(t)+n;if(30<u){var i=n-n%5;u=(a&(1<<i)-1).toString(32),a>>=i,n-=i,Rt=1<<32-at(t)+n|l<<n|a,wt=u+e}else Rt=1<<u|l<<n|a,wt=e}function Ti(e){e.return!==null&&(El(e,1),gf(e,1,0))}function Ei(e){for(;e===Xn;)Xn=Wl[--Fl],Wl[Fl]=null,Qn=Wl[--Fl],Wl[Fl]=null;for(;e===Tl;)Tl=pt[--vt],pt[vt]=null,wt=pt[--vt],pt[vt]=null,Rt=pt[--vt],pt[vt]=null}var Je=null,Ee=null,ue=!1,zl=null,At=!1,zi=Error(r(519));function Al(e){var t=Error(r(418,""));throw Ya(ht(t,e)),zi}function hf(e){var t=e.stateNode,l=e.type,a=e.memoizedProps;switch(t[Ve]=e,t[$e]=a,l){case"dialog":I("cancel",t),I("close",t);break;case"iframe":case"object":case"embed":I("load",t);break;case"video":case"audio":for(l=0;l<sn.length;l++)I(sn[l],t);break;case"source":I("error",t);break;case"img":case"image":case"link":I("error",t),I("load",t);break;case"details":I("toggle",t);break;case"input":I("invalid",t),Os(t,a.value,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name,!0),Dn(t);break;case"select":I("invalid",t);break;case"textarea":I("invalid",t),_s(t,a.value,a.defaultValue,a.children),Dn(t)}l=a.children,typeof l!="string"&&typeof l!="number"&&typeof l!="bigint"||t.textContent===""+l||a.suppressHydrationWarning===!0||Mo(t.textContent,l)?(a.popover!=null&&(I("beforetoggle",t),I("toggle",t)),a.onScroll!=null&&I("scroll",t),a.onScrollEnd!=null&&I("scrollend",t),a.onClick!=null&&(t.onclick=Eu),t=!0):t=!1,t||Al(e)}function mf(e){for(Je=e.return;Je;)switch(Je.tag){case 5:case 13:At=!1;return;case 27:case 3:At=!0;return;default:Je=Je.return}}function Ha(e){if(e!==Je)return!1;if(!ue)return mf(e),ue=!0,!1;var t=e.tag,l;if((l=t!==3&&t!==27)&&((l=t===5)&&(l=e.type,l=!(l!=="form"&&l!=="button")||Gc(e.type,e.memoizedProps)),l=!l),l&&Ee&&Al(e),mf(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(r(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8)if(l=e.data,l==="/$"){if(t===0){Ee=Et(e.nextSibling);break e}t--}else l!=="$"&&l!=="$!"&&l!=="$?"||t++;e=e.nextSibling}Ee=null}}else t===27?(t=Ee,rl(e.type)?(e=Vc,Vc=null,Ee=e):Ee=t):Ee=Je?Et(e.stateNode.nextSibling):null;return!0}function Ca(){Ee=Je=null,ue=!1}function pf(){var e=zl;return e!==null&&(Ie===null?Ie=e:Ie.push.apply(Ie,e),zl=null),e}function Ya(e){zl===null?zl=[e]:zl.push(e)}var Ai=N(null),jl=null,Ht=null;function $t(e,t,l){R(Ai,t._currentValue),t._currentValue=l}function Ct(e){e._currentValue=Ai.current,H(Ai)}function ji(e,t,l){for(;e!==null;){var a=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,a!==null&&(a.childLanes|=t)):a!==null&&(a.childLanes&t)!==t&&(a.childLanes|=t),e===l)break;e=e.return}}function Ni(e,t,l,a){var n=e.child;for(n!==null&&(n.return=e);n!==null;){var u=n.dependencies;if(u!==null){var i=n.child;u=u.firstContext;e:for(;u!==null;){var c=u;u=n;for(var f=0;f<t.length;f++)if(c.context===t[f]){u.lanes|=l,c=u.alternate,c!==null&&(c.lanes|=l),ji(u.return,l,e),a||(i=null);break e}u=c.next}}else if(n.tag===18){if(i=n.return,i===null)throw Error(r(341));i.lanes|=l,u=i.alternate,u!==null&&(u.lanes|=l),ji(i,l,e),i=null}else i=n.child;if(i!==null)i.return=n;else for(i=n;i!==null;){if(i===e){i=null;break}if(n=i.sibling,n!==null){n.return=i.return,i=n;break}i=i.return}n=i}}function Ba(e,t,l,a){e=null;for(var n=t,u=!1;n!==null;){if(!u){if((n.flags&524288)!==0)u=!0;else if((n.flags&262144)!==0)break}if(n.tag===10){var i=n.alternate;if(i===null)throw Error(r(387));if(i=i.memoizedProps,i!==null){var c=n.type;nt(n.pendingProps.value,i.value)||(e!==null?e.push(c):e=[c])}}else if(n===tt.current){if(i=n.alternate,i===null)throw Error(r(387));i.memoizedState.memoizedState!==n.memoizedState.memoizedState&&(e!==null?e.push(hn):e=[hn])}n=n.return}e!==null&&Ni(t,e,l,a),t.flags|=262144}function Vn(e){for(e=e.firstContext;e!==null;){if(!nt(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Nl(e){jl=e,Ht=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Ze(e){return vf(jl,e)}function Zn(e,t){return jl===null&&Nl(e),vf(e,t)}function vf(e,t){var l=t._currentValue;if(t={context:t,memoizedValue:l,next:null},Ht===null){if(e===null)throw Error(r(308));Ht=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Ht=Ht.next=t;return l}var R0=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(l,a){e.push(a)}};this.abort=function(){t.aborted=!0,e.forEach(function(l){return l()})}},w0=g.unstable_scheduleCallback,H0=g.unstable_NormalPriority,Re={$$typeof:be,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Oi(){return{controller:new R0,data:new Map,refCount:0}}function qa(e){e.refCount--,e.refCount===0&&w0(H0,function(){e.controller.abort()})}var Ga=null,Di=0,Pl=0,Il=null;function C0(e,t){if(Ga===null){var l=Ga=[];Di=0,Pl=Uc(),Il={status:"pending",value:void 0,then:function(a){l.push(a)}}}return Di++,t.then(bf,bf),t}function bf(){if(--Di===0&&Ga!==null){Il!==null&&(Il.status="fulfilled");var e=Ga;Ga=null,Pl=0,Il=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function Y0(e,t){var l=[],a={status:"pending",value:null,reason:null,then:function(n){l.push(n)}};return e.then(function(){a.status="fulfilled",a.value=t;for(var n=0;n<l.length;n++)(0,l[n])(t)},function(n){for(a.status="rejected",a.reason=n,n=0;n<l.length;n++)(0,l[n])(void 0)}),a}var yf=h.S;h.S=function(e,t){typeof t=="object"&&t!==null&&typeof t.then=="function"&&C0(e,t),yf!==null&&yf(e,t)};var Ol=N(null);function _i(){var e=Ol.current;return e!==null?e:pe.pooledCache}function Kn(e,t){t===null?R(Ol,Ol.current):R(Ol,t.pool)}function xf(){var e=_i();return e===null?null:{parent:Re._currentValue,pool:e}}var La=Error(r(460)),Sf=Error(r(474)),kn=Error(r(542)),Ui={then:function(){}};function Tf(e){return e=e.status,e==="fulfilled"||e==="rejected"}function Jn(){}function Ef(e,t,l){switch(l=e[l],l===void 0?e.push(t):l!==t&&(t.then(Jn,Jn),t=l),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Af(e),e;default:if(typeof t.status=="string")t.then(Jn,Jn);else{if(e=pe,e!==null&&100<e.shellSuspendCounter)throw Error(r(482));e=t,e.status="pending",e.then(function(a){if(t.status==="pending"){var n=t;n.status="fulfilled",n.value=a}},function(a){if(t.status==="pending"){var n=t;n.status="rejected",n.reason=a}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Af(e),e}throw Xa=t,La}}var Xa=null;function zf(){if(Xa===null)throw Error(r(459));var e=Xa;return Xa=null,e}function Af(e){if(e===La||e===kn)throw Error(r(483))}var Wt=!1;function Mi(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Ri(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Ft(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Pt(e,t,l){var a=e.updateQueue;if(a===null)return null;if(a=a.shared,(ce&2)!==0){var n=a.pending;return n===null?t.next=t:(t.next=n.next,n.next=t),a.pending=t,t=Gn(e),of(e,null,l),t}return qn(e,a,t,l),Gn(e)}function Qa(e,t,l){if(t=t.updateQueue,t!==null&&(t=t.shared,(l&4194048)!==0)){var a=t.lanes;a&=e.pendingLanes,l|=a,t.lanes=l,vs(e,l)}}function wi(e,t){var l=e.updateQueue,a=e.alternate;if(a!==null&&(a=a.updateQueue,l===a)){var n=null,u=null;if(l=l.firstBaseUpdate,l!==null){do{var i={lane:l.lane,tag:l.tag,payload:l.payload,callback:null,next:null};u===null?n=u=i:u=u.next=i,l=l.next}while(l!==null);u===null?n=u=t:u=u.next=t}else n=u=t;l={baseState:a.baseState,firstBaseUpdate:n,lastBaseUpdate:u,shared:a.shared,callbacks:a.callbacks},e.updateQueue=l;return}e=l.lastBaseUpdate,e===null?l.firstBaseUpdate=t:e.next=t,l.lastBaseUpdate=t}var Hi=!1;function Va(){if(Hi){var e=Il;if(e!==null)throw e}}function Za(e,t,l,a){Hi=!1;var n=e.updateQueue;Wt=!1;var u=n.firstBaseUpdate,i=n.lastBaseUpdate,c=n.shared.pending;if(c!==null){n.shared.pending=null;var f=c,b=f.next;f.next=null,i===null?u=b:i.next=b,i=f;var z=e.alternate;z!==null&&(z=z.updateQueue,c=z.lastBaseUpdate,c!==i&&(c===null?z.firstBaseUpdate=b:c.next=b,z.lastBaseUpdate=f))}if(u!==null){var j=n.baseState;i=0,z=b=f=null,c=u;do{var x=c.lane&-536870913,T=x!==c.lane;if(T?(te&x)===x:(a&x)===x){x!==0&&x===Pl&&(Hi=!0),z!==null&&(z=z.next={lane:0,tag:c.tag,payload:c.payload,callback:null,next:null});e:{var V=e,X=c;x=t;var de=l;switch(X.tag){case 1:if(V=X.payload,typeof V=="function"){j=V.call(de,j,x);break e}j=V;break e;case 3:V.flags=V.flags&-65537|128;case 0:if(V=X.payload,x=typeof V=="function"?V.call(de,j,x):V,x==null)break e;j=w({},j,x);break e;case 2:Wt=!0}}x=c.callback,x!==null&&(e.flags|=64,T&&(e.flags|=8192),T=n.callbacks,T===null?n.callbacks=[x]:T.push(x))}else T={lane:x,tag:c.tag,payload:c.payload,callback:c.callback,next:null},z===null?(b=z=T,f=j):z=z.next=T,i|=x;if(c=c.next,c===null){if(c=n.shared.pending,c===null)break;T=c,c=T.next,T.next=null,n.lastBaseUpdate=T,n.shared.pending=null}}while(!0);z===null&&(f=j),n.baseState=f,n.firstBaseUpdate=b,n.lastBaseUpdate=z,u===null&&(n.shared.lanes=0),il|=i,e.lanes=i,e.memoizedState=j}}function jf(e,t){if(typeof e!="function")throw Error(r(191,e));e.call(t)}function Nf(e,t){var l=e.callbacks;if(l!==null)for(e.callbacks=null,e=0;e<l.length;e++)jf(l[e],t)}var ea=N(null),$n=N(0);function Of(e,t){e=Qt,R($n,e),R(ea,t),Qt=e|t.baseLanes}function Ci(){R($n,Qt),R(ea,ea.current)}function Yi(){Qt=$n.current,H(ea),H($n)}var It=0,$=null,re=null,_e=null,Wn=!1,ta=!1,Dl=!1,Fn=0,Ka=0,la=null,B0=0;function je(){throw Error(r(321))}function Bi(e,t){if(t===null)return!1;for(var l=0;l<t.length&&l<e.length;l++)if(!nt(e[l],t[l]))return!1;return!0}function qi(e,t,l,a,n,u){return It=u,$=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,h.H=e===null||e.memoizedState===null?or:dr,Dl=!1,u=l(a,n),Dl=!1,ta&&(u=_f(t,l,a,n)),Df(e),u}function Df(e){h.H=au;var t=re!==null&&re.next!==null;if(It=0,_e=re=$=null,Wn=!1,Ka=0,la=null,t)throw Error(r(300));e===null||Ce||(e=e.dependencies,e!==null&&Vn(e)&&(Ce=!0))}function _f(e,t,l,a){$=e;var n=0;do{if(ta&&(la=null),Ka=0,ta=!1,25<=n)throw Error(r(301));if(n+=1,_e=re=null,e.updateQueue!=null){var u=e.updateQueue;u.lastEffect=null,u.events=null,u.stores=null,u.memoCache!=null&&(u.memoCache.index=0)}h.H=Z0,u=t(l,a)}while(ta);return u}function q0(){var e=h.H,t=e.useState()[0];return t=typeof t.then=="function"?ka(t):t,e=e.useState()[0],(re!==null?re.memoizedState:null)!==e&&($.flags|=1024),t}function Gi(){var e=Fn!==0;return Fn=0,e}function Li(e,t,l){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~l}function Xi(e){if(Wn){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Wn=!1}It=0,_e=re=$=null,ta=!1,Ka=Fn=0,la=null}function Fe(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return _e===null?$.memoizedState=_e=e:_e=_e.next=e,_e}function Ue(){if(re===null){var e=$.alternate;e=e!==null?e.memoizedState:null}else e=re.next;var t=_e===null?$.memoizedState:_e.next;if(t!==null)_e=t,re=e;else{if(e===null)throw $.alternate===null?Error(r(467)):Error(r(310));re=e,e={memoizedState:re.memoizedState,baseState:re.baseState,baseQueue:re.baseQueue,queue:re.queue,next:null},_e===null?$.memoizedState=_e=e:_e=_e.next=e}return _e}function Qi(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function ka(e){var t=Ka;return Ka+=1,la===null&&(la=[]),e=Ef(la,e,t),t=$,(_e===null?t.memoizedState:_e.next)===null&&(t=t.alternate,h.H=t===null||t.memoizedState===null?or:dr),e}function Pn(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return ka(e);if(e.$$typeof===be)return Ze(e)}throw Error(r(438,String(e)))}function Vi(e){var t=null,l=$.updateQueue;if(l!==null&&(t=l.memoCache),t==null){var a=$.alternate;a!==null&&(a=a.updateQueue,a!==null&&(a=a.memoCache,a!=null&&(t={data:a.data.map(function(n){return n.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),l===null&&(l=Qi(),$.updateQueue=l),l.memoCache=t,l=t.data[t.index],l===void 0)for(l=t.data[t.index]=Array(e),a=0;a<e;a++)l[a]=Me;return t.index++,l}function Yt(e,t){return typeof t=="function"?t(e):t}function In(e){var t=Ue();return Zi(t,re,e)}function Zi(e,t,l){var a=e.queue;if(a===null)throw Error(r(311));a.lastRenderedReducer=l;var n=e.baseQueue,u=a.pending;if(u!==null){if(n!==null){var i=n.next;n.next=u.next,u.next=i}t.baseQueue=n=u,a.pending=null}if(u=e.baseState,n===null)e.memoizedState=u;else{t=n.next;var c=i=null,f=null,b=t,z=!1;do{var j=b.lane&-536870913;if(j!==b.lane?(te&j)===j:(It&j)===j){var x=b.revertLane;if(x===0)f!==null&&(f=f.next={lane:0,revertLane:0,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null}),j===Pl&&(z=!0);else if((It&x)===x){b=b.next,x===Pl&&(z=!0);continue}else j={lane:0,revertLane:b.revertLane,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null},f===null?(c=f=j,i=u):f=f.next=j,$.lanes|=x,il|=x;j=b.action,Dl&&l(u,j),u=b.hasEagerState?b.eagerState:l(u,j)}else x={lane:j,revertLane:b.revertLane,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null},f===null?(c=f=x,i=u):f=f.next=x,$.lanes|=j,il|=j;b=b.next}while(b!==null&&b!==t);if(f===null?i=u:f.next=c,!nt(u,e.memoizedState)&&(Ce=!0,z&&(l=Il,l!==null)))throw l;e.memoizedState=u,e.baseState=i,e.baseQueue=f,a.lastRenderedState=u}return n===null&&(a.lanes=0),[e.memoizedState,a.dispatch]}function Ki(e){var t=Ue(),l=t.queue;if(l===null)throw Error(r(311));l.lastRenderedReducer=e;var a=l.dispatch,n=l.pending,u=t.memoizedState;if(n!==null){l.pending=null;var i=n=n.next;do u=e(u,i.action),i=i.next;while(i!==n);nt(u,t.memoizedState)||(Ce=!0),t.memoizedState=u,t.baseQueue===null&&(t.baseState=u),l.lastRenderedState=u}return[u,a]}function Uf(e,t,l){var a=$,n=Ue(),u=ue;if(u){if(l===void 0)throw Error(r(407));l=l()}else l=t();var i=!nt((re||n).memoizedState,l);i&&(n.memoizedState=l,Ce=!0),n=n.queue;var c=wf.bind(null,a,n,e);if(Ja(2048,8,c,[e]),n.getSnapshot!==t||i||_e!==null&&_e.memoizedState.tag&1){if(a.flags|=2048,aa(9,eu(),Rf.bind(null,a,n,l,t),null),pe===null)throw Error(r(349));u||(It&124)!==0||Mf(a,t,l)}return l}function Mf(e,t,l){e.flags|=16384,e={getSnapshot:t,value:l},t=$.updateQueue,t===null?(t=Qi(),$.updateQueue=t,t.stores=[e]):(l=t.stores,l===null?t.stores=[e]:l.push(e))}function Rf(e,t,l,a){t.value=l,t.getSnapshot=a,Hf(t)&&Cf(e)}function wf(e,t,l){return l(function(){Hf(t)&&Cf(e)})}function Hf(e){var t=e.getSnapshot;e=e.value;try{var l=t();return!nt(e,l)}catch{return!0}}function Cf(e){var t=Jl(e,2);t!==null&&rt(t,e,2)}function ki(e){var t=Fe();if(typeof e=="function"){var l=e;if(e=l(),Dl){Kt(!0);try{l()}finally{Kt(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Yt,lastRenderedState:e},t}function Yf(e,t,l,a){return e.baseState=l,Zi(e,re,typeof a=="function"?a:Yt)}function G0(e,t,l,a,n){if(lu(e))throw Error(r(485));if(e=t.action,e!==null){var u={payload:n,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(i){u.listeners.push(i)}};h.T!==null?l(!0):u.isTransition=!1,a(u),l=t.pending,l===null?(u.next=t.pending=u,Bf(t,u)):(u.next=l.next,t.pending=l.next=u)}}function Bf(e,t){var l=t.action,a=t.payload,n=e.state;if(t.isTransition){var u=h.T,i={};h.T=i;try{var c=l(n,a),f=h.S;f!==null&&f(i,c),qf(e,t,c)}catch(b){Ji(e,t,b)}finally{h.T=u}}else try{u=l(n,a),qf(e,t,u)}catch(b){Ji(e,t,b)}}function qf(e,t,l){l!==null&&typeof l=="object"&&typeof l.then=="function"?l.then(function(a){Gf(e,t,a)},function(a){return Ji(e,t,a)}):Gf(e,t,l)}function Gf(e,t,l){t.status="fulfilled",t.value=l,Lf(t),e.state=l,t=e.pending,t!==null&&(l=t.next,l===t?e.pending=null:(l=l.next,t.next=l,Bf(e,l)))}function Ji(e,t,l){var a=e.pending;if(e.pending=null,a!==null){a=a.next;do t.status="rejected",t.reason=l,Lf(t),t=t.next;while(t!==a)}e.action=null}function Lf(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function Xf(e,t){return t}function Qf(e,t){if(ue){var l=pe.formState;if(l!==null){e:{var a=$;if(ue){if(Ee){t:{for(var n=Ee,u=At;n.nodeType!==8;){if(!u){n=null;break t}if(n=Et(n.nextSibling),n===null){n=null;break t}}u=n.data,n=u==="F!"||u==="F"?n:null}if(n){Ee=Et(n.nextSibling),a=n.data==="F!";break e}}Al(a)}a=!1}a&&(t=l[0])}}return l=Fe(),l.memoizedState=l.baseState=t,a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Xf,lastRenderedState:t},l.queue=a,l=sr.bind(null,$,a),a.dispatch=l,a=ki(!1),u=Ii.bind(null,$,!1,a.queue),a=Fe(),n={state:t,dispatch:null,action:e,pending:null},a.queue=n,l=G0.bind(null,$,n,u,l),n.dispatch=l,a.memoizedState=e,[t,l,!1]}function Vf(e){var t=Ue();return Zf(t,re,e)}function Zf(e,t,l){if(t=Zi(e,t,Xf)[0],e=In(Yt)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var a=ka(t)}catch(i){throw i===La?kn:i}else a=t;t=Ue();var n=t.queue,u=n.dispatch;return l!==t.memoizedState&&($.flags|=2048,aa(9,eu(),L0.bind(null,n,l),null)),[a,u,e]}function L0(e,t){e.action=t}function Kf(e){var t=Ue(),l=re;if(l!==null)return Zf(t,l,e);Ue(),t=t.memoizedState,l=Ue();var a=l.queue.dispatch;return l.memoizedState=e,[t,a,!1]}function aa(e,t,l,a){return e={tag:e,create:l,deps:a,inst:t,next:null},t=$.updateQueue,t===null&&(t=Qi(),$.updateQueue=t),l=t.lastEffect,l===null?t.lastEffect=e.next=e:(a=l.next,l.next=e,e.next=a,t.lastEffect=e),e}function eu(){return{destroy:void 0,resource:void 0}}function kf(){return Ue().memoizedState}function tu(e,t,l,a){var n=Fe();a=a===void 0?null:a,$.flags|=e,n.memoizedState=aa(1|t,eu(),l,a)}function Ja(e,t,l,a){var n=Ue();a=a===void 0?null:a;var u=n.memoizedState.inst;re!==null&&a!==null&&Bi(a,re.memoizedState.deps)?n.memoizedState=aa(t,u,l,a):($.flags|=e,n.memoizedState=aa(1|t,u,l,a))}function Jf(e,t){tu(8390656,8,e,t)}function $f(e,t){Ja(2048,8,e,t)}function Wf(e,t){return Ja(4,2,e,t)}function Ff(e,t){return Ja(4,4,e,t)}function Pf(e,t){if(typeof t=="function"){e=e();var l=t(e);return function(){typeof l=="function"?l():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function If(e,t,l){l=l!=null?l.concat([e]):null,Ja(4,4,Pf.bind(null,t,e),l)}function $i(){}function er(e,t){var l=Ue();t=t===void 0?null:t;var a=l.memoizedState;return t!==null&&Bi(t,a[1])?a[0]:(l.memoizedState=[e,t],e)}function tr(e,t){var l=Ue();t=t===void 0?null:t;var a=l.memoizedState;if(t!==null&&Bi(t,a[1]))return a[0];if(a=e(),Dl){Kt(!0);try{e()}finally{Kt(!1)}}return l.memoizedState=[a,t],a}function Wi(e,t,l){return l===void 0||(It&1073741824)!==0?e.memoizedState=t:(e.memoizedState=l,e=no(),$.lanes|=e,il|=e,l)}function lr(e,t,l,a){return nt(l,t)?l:ea.current!==null?(e=Wi(e,l,a),nt(e,t)||(Ce=!0),e):(It&42)===0?(Ce=!0,e.memoizedState=l):(e=no(),$.lanes|=e,il|=e,t)}function ar(e,t,l,a,n){var u=_.p;_.p=u!==0&&8>u?u:8;var i=h.T,c={};h.T=c,Ii(e,!1,t,l);try{var f=n(),b=h.S;if(b!==null&&b(c,f),f!==null&&typeof f=="object"&&typeof f.then=="function"){var z=Y0(f,a);$a(e,t,z,ft(e))}else $a(e,t,a,ft(e))}catch(j){$a(e,t,{then:function(){},status:"rejected",reason:j},ft())}finally{_.p=u,h.T=i}}function X0(){}function Fi(e,t,l,a){if(e.tag!==5)throw Error(r(476));var n=nr(e).queue;ar(e,n,t,B,l===null?X0:function(){return ur(e),l(a)})}function nr(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:B,baseState:B,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Yt,lastRenderedState:B},next:null};var l={};return t.next={memoizedState:l,baseState:l,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Yt,lastRenderedState:l},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function ur(e){var t=nr(e).next.queue;$a(e,t,{},ft())}function Pi(){return Ze(hn)}function ir(){return Ue().memoizedState}function cr(){return Ue().memoizedState}function Q0(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var l=ft();e=Ft(l);var a=Pt(t,e,l);a!==null&&(rt(a,t,l),Qa(a,t,l)),t={cache:Oi()},e.payload=t;return}t=t.return}}function V0(e,t,l){var a=ft();l={lane:a,revertLane:0,action:l,hasEagerState:!1,eagerState:null,next:null},lu(e)?fr(t,l):(l=bi(e,t,l,a),l!==null&&(rt(l,e,a),rr(l,t,a)))}function sr(e,t,l){var a=ft();$a(e,t,l,a)}function $a(e,t,l,a){var n={lane:a,revertLane:0,action:l,hasEagerState:!1,eagerState:null,next:null};if(lu(e))fr(t,n);else{var u=e.alternate;if(e.lanes===0&&(u===null||u.lanes===0)&&(u=t.lastRenderedReducer,u!==null))try{var i=t.lastRenderedState,c=u(i,l);if(n.hasEagerState=!0,n.eagerState=c,nt(c,i))return qn(e,t,n,0),pe===null&&Bn(),!1}catch{}finally{}if(l=bi(e,t,n,a),l!==null)return rt(l,e,a),rr(l,t,a),!0}return!1}function Ii(e,t,l,a){if(a={lane:2,revertLane:Uc(),action:a,hasEagerState:!1,eagerState:null,next:null},lu(e)){if(t)throw Error(r(479))}else t=bi(e,l,a,2),t!==null&&rt(t,e,2)}function lu(e){var t=e.alternate;return e===$||t!==null&&t===$}function fr(e,t){ta=Wn=!0;var l=e.pending;l===null?t.next=t:(t.next=l.next,l.next=t),e.pending=t}function rr(e,t,l){if((l&4194048)!==0){var a=t.lanes;a&=e.pendingLanes,l|=a,t.lanes=l,vs(e,l)}}var au={readContext:Ze,use:Pn,useCallback:je,useContext:je,useEffect:je,useImperativeHandle:je,useLayoutEffect:je,useInsertionEffect:je,useMemo:je,useReducer:je,useRef:je,useState:je,useDebugValue:je,useDeferredValue:je,useTransition:je,useSyncExternalStore:je,useId:je,useHostTransitionStatus:je,useFormState:je,useActionState:je,useOptimistic:je,useMemoCache:je,useCacheRefresh:je},or={readContext:Ze,use:Pn,useCallback:function(e,t){return Fe().memoizedState=[e,t===void 0?null:t],e},useContext:Ze,useEffect:Jf,useImperativeHandle:function(e,t,l){l=l!=null?l.concat([e]):null,tu(4194308,4,Pf.bind(null,t,e),l)},useLayoutEffect:function(e,t){return tu(4194308,4,e,t)},useInsertionEffect:function(e,t){tu(4,2,e,t)},useMemo:function(e,t){var l=Fe();t=t===void 0?null:t;var a=e();if(Dl){Kt(!0);try{e()}finally{Kt(!1)}}return l.memoizedState=[a,t],a},useReducer:function(e,t,l){var a=Fe();if(l!==void 0){var n=l(t);if(Dl){Kt(!0);try{l(t)}finally{Kt(!1)}}}else n=t;return a.memoizedState=a.baseState=n,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:n},a.queue=e,e=e.dispatch=V0.bind(null,$,e),[a.memoizedState,e]},useRef:function(e){var t=Fe();return e={current:e},t.memoizedState=e},useState:function(e){e=ki(e);var t=e.queue,l=sr.bind(null,$,t);return t.dispatch=l,[e.memoizedState,l]},useDebugValue:$i,useDeferredValue:function(e,t){var l=Fe();return Wi(l,e,t)},useTransition:function(){var e=ki(!1);return e=ar.bind(null,$,e.queue,!0,!1),Fe().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,l){var a=$,n=Fe();if(ue){if(l===void 0)throw Error(r(407));l=l()}else{if(l=t(),pe===null)throw Error(r(349));(te&124)!==0||Mf(a,t,l)}n.memoizedState=l;var u={value:l,getSnapshot:t};return n.queue=u,Jf(wf.bind(null,a,u,e),[e]),a.flags|=2048,aa(9,eu(),Rf.bind(null,a,u,l,t),null),l},useId:function(){var e=Fe(),t=pe.identifierPrefix;if(ue){var l=wt,a=Rt;l=(a&~(1<<32-at(a)-1)).toString(32)+l,t="«"+t+"R"+l,l=Fn++,0<l&&(t+="H"+l.toString(32)),t+="»"}else l=B0++,t="«"+t+"r"+l.toString(32)+"»";return e.memoizedState=t},useHostTransitionStatus:Pi,useFormState:Qf,useActionState:Qf,useOptimistic:function(e){var t=Fe();t.memoizedState=t.baseState=e;var l={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=l,t=Ii.bind(null,$,!0,l),l.dispatch=t,[e,t]},useMemoCache:Vi,useCacheRefresh:function(){return Fe().memoizedState=Q0.bind(null,$)}},dr={readContext:Ze,use:Pn,useCallback:er,useContext:Ze,useEffect:$f,useImperativeHandle:If,useInsertionEffect:Wf,useLayoutEffect:Ff,useMemo:tr,useReducer:In,useRef:kf,useState:function(){return In(Yt)},useDebugValue:$i,useDeferredValue:function(e,t){var l=Ue();return lr(l,re.memoizedState,e,t)},useTransition:function(){var e=In(Yt)[0],t=Ue().memoizedState;return[typeof e=="boolean"?e:ka(e),t]},useSyncExternalStore:Uf,useId:ir,useHostTransitionStatus:Pi,useFormState:Vf,useActionState:Vf,useOptimistic:function(e,t){var l=Ue();return Yf(l,re,e,t)},useMemoCache:Vi,useCacheRefresh:cr},Z0={readContext:Ze,use:Pn,useCallback:er,useContext:Ze,useEffect:$f,useImperativeHandle:If,useInsertionEffect:Wf,useLayoutEffect:Ff,useMemo:tr,useReducer:Ki,useRef:kf,useState:function(){return Ki(Yt)},useDebugValue:$i,useDeferredValue:function(e,t){var l=Ue();return re===null?Wi(l,e,t):lr(l,re.memoizedState,e,t)},useTransition:function(){var e=Ki(Yt)[0],t=Ue().memoizedState;return[typeof e=="boolean"?e:ka(e),t]},useSyncExternalStore:Uf,useId:ir,useHostTransitionStatus:Pi,useFormState:Kf,useActionState:Kf,useOptimistic:function(e,t){var l=Ue();return re!==null?Yf(l,re,e,t):(l.baseState=e,[e,l.queue.dispatch])},useMemoCache:Vi,useCacheRefresh:cr},na=null,Wa=0;function nu(e){var t=Wa;return Wa+=1,na===null&&(na=[]),Ef(na,e,t)}function Fa(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function uu(e,t){throw t.$$typeof===U?Error(r(525)):(e=Object.prototype.toString.call(t),Error(r(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function gr(e){var t=e._init;return t(e._payload)}function hr(e){function t(m,d){if(e){var v=m.deletions;v===null?(m.deletions=[d],m.flags|=16):v.push(d)}}function l(m,d){if(!e)return null;for(;d!==null;)t(m,d),d=d.sibling;return null}function a(m){for(var d=new Map;m!==null;)m.key!==null?d.set(m.key,m):d.set(m.index,m),m=m.sibling;return d}function n(m,d){return m=Mt(m,d),m.index=0,m.sibling=null,m}function u(m,d,v){return m.index=v,e?(v=m.alternate,v!==null?(v=v.index,v<d?(m.flags|=67108866,d):v):(m.flags|=67108866,d)):(m.flags|=1048576,d)}function i(m){return e&&m.alternate===null&&(m.flags|=67108866),m}function c(m,d,v,A){return d===null||d.tag!==6?(d=xi(v,m.mode,A),d.return=m,d):(d=n(d,v),d.return=m,d)}function f(m,d,v,A){var q=v.type;return q===K?z(m,d,v.props.children,A,v.key):d!==null&&(d.elementType===q||typeof q=="object"&&q!==null&&q.$$typeof===le&&gr(q)===d.type)?(d=n(d,v.props),Fa(d,v),d.return=m,d):(d=Ln(v.type,v.key,v.props,null,m.mode,A),Fa(d,v),d.return=m,d)}function b(m,d,v,A){return d===null||d.tag!==4||d.stateNode.containerInfo!==v.containerInfo||d.stateNode.implementation!==v.implementation?(d=Si(v,m.mode,A),d.return=m,d):(d=n(d,v.children||[]),d.return=m,d)}function z(m,d,v,A,q){return d===null||d.tag!==7?(d=Sl(v,m.mode,A,q),d.return=m,d):(d=n(d,v),d.return=m,d)}function j(m,d,v){if(typeof d=="string"&&d!==""||typeof d=="number"||typeof d=="bigint")return d=xi(""+d,m.mode,v),d.return=m,d;if(typeof d=="object"&&d!==null){switch(d.$$typeof){case M:return v=Ln(d.type,d.key,d.props,null,m.mode,v),Fa(v,d),v.return=m,v;case W:return d=Si(d,m.mode,v),d.return=m,d;case le:var A=d._init;return d=A(d._payload),j(m,d,v)}if(Se(d)||fe(d))return d=Sl(d,m.mode,v,null),d.return=m,d;if(typeof d.then=="function")return j(m,nu(d),v);if(d.$$typeof===be)return j(m,Zn(m,d),v);uu(m,d)}return null}function x(m,d,v,A){var q=d!==null?d.key:null;if(typeof v=="string"&&v!==""||typeof v=="number"||typeof v=="bigint")return q!==null?null:c(m,d,""+v,A);if(typeof v=="object"&&v!==null){switch(v.$$typeof){case M:return v.key===q?f(m,d,v,A):null;case W:return v.key===q?b(m,d,v,A):null;case le:return q=v._init,v=q(v._payload),x(m,d,v,A)}if(Se(v)||fe(v))return q!==null?null:z(m,d,v,A,null);if(typeof v.then=="function")return x(m,d,nu(v),A);if(v.$$typeof===be)return x(m,d,Zn(m,v),A);uu(m,v)}return null}function T(m,d,v,A,q){if(typeof A=="string"&&A!==""||typeof A=="number"||typeof A=="bigint")return m=m.get(v)||null,c(d,m,""+A,q);if(typeof A=="object"&&A!==null){switch(A.$$typeof){case M:return m=m.get(A.key===null?v:A.key)||null,f(d,m,A,q);case W:return m=m.get(A.key===null?v:A.key)||null,b(d,m,A,q);case le:var F=A._init;return A=F(A._payload),T(m,d,v,A,q)}if(Se(A)||fe(A))return m=m.get(v)||null,z(d,m,A,q,null);if(typeof A.then=="function")return T(m,d,v,nu(A),q);if(A.$$typeof===be)return T(m,d,v,Zn(d,A),q);uu(d,A)}return null}function V(m,d,v,A){for(var q=null,F=null,G=d,Q=d=0,Be=null;G!==null&&Q<v.length;Q++){G.index>Q?(Be=G,G=null):Be=G.sibling;var ne=x(m,G,v[Q],A);if(ne===null){G===null&&(G=Be);break}e&&G&&ne.alternate===null&&t(m,G),d=u(ne,d,Q),F===null?q=ne:F.sibling=ne,F=ne,G=Be}if(Q===v.length)return l(m,G),ue&&El(m,Q),q;if(G===null){for(;Q<v.length;Q++)G=j(m,v[Q],A),G!==null&&(d=u(G,d,Q),F===null?q=G:F.sibling=G,F=G);return ue&&El(m,Q),q}for(G=a(G);Q<v.length;Q++)Be=T(G,m,Q,v[Q],A),Be!==null&&(e&&Be.alternate!==null&&G.delete(Be.key===null?Q:Be.key),d=u(Be,d,Q),F===null?q=Be:F.sibling=Be,F=Be);return e&&G.forEach(function(ml){return t(m,ml)}),ue&&El(m,Q),q}function X(m,d,v,A){if(v==null)throw Error(r(151));for(var q=null,F=null,G=d,Q=d=0,Be=null,ne=v.next();G!==null&&!ne.done;Q++,ne=v.next()){G.index>Q?(Be=G,G=null):Be=G.sibling;var ml=x(m,G,ne.value,A);if(ml===null){G===null&&(G=Be);break}e&&G&&ml.alternate===null&&t(m,G),d=u(ml,d,Q),F===null?q=ml:F.sibling=ml,F=ml,G=Be}if(ne.done)return l(m,G),ue&&El(m,Q),q;if(G===null){for(;!ne.done;Q++,ne=v.next())ne=j(m,ne.value,A),ne!==null&&(d=u(ne,d,Q),F===null?q=ne:F.sibling=ne,F=ne);return ue&&El(m,Q),q}for(G=a(G);!ne.done;Q++,ne=v.next())ne=T(G,m,Q,ne.value,A),ne!==null&&(e&&ne.alternate!==null&&G.delete(ne.key===null?Q:ne.key),d=u(ne,d,Q),F===null?q=ne:F.sibling=ne,F=ne);return e&&G.forEach(function(Kg){return t(m,Kg)}),ue&&El(m,Q),q}function de(m,d,v,A){if(typeof v=="object"&&v!==null&&v.type===K&&v.key===null&&(v=v.props.children),typeof v=="object"&&v!==null){switch(v.$$typeof){case M:e:{for(var q=v.key;d!==null;){if(d.key===q){if(q=v.type,q===K){if(d.tag===7){l(m,d.sibling),A=n(d,v.props.children),A.return=m,m=A;break e}}else if(d.elementType===q||typeof q=="object"&&q!==null&&q.$$typeof===le&&gr(q)===d.type){l(m,d.sibling),A=n(d,v.props),Fa(A,v),A.return=m,m=A;break e}l(m,d);break}else t(m,d);d=d.sibling}v.type===K?(A=Sl(v.props.children,m.mode,A,v.key),A.return=m,m=A):(A=Ln(v.type,v.key,v.props,null,m.mode,A),Fa(A,v),A.return=m,m=A)}return i(m);case W:e:{for(q=v.key;d!==null;){if(d.key===q)if(d.tag===4&&d.stateNode.containerInfo===v.containerInfo&&d.stateNode.implementation===v.implementation){l(m,d.sibling),A=n(d,v.children||[]),A.return=m,m=A;break e}else{l(m,d);break}else t(m,d);d=d.sibling}A=Si(v,m.mode,A),A.return=m,m=A}return i(m);case le:return q=v._init,v=q(v._payload),de(m,d,v,A)}if(Se(v))return V(m,d,v,A);if(fe(v)){if(q=fe(v),typeof q!="function")throw Error(r(150));return v=q.call(v),X(m,d,v,A)}if(typeof v.then=="function")return de(m,d,nu(v),A);if(v.$$typeof===be)return de(m,d,Zn(m,v),A);uu(m,v)}return typeof v=="string"&&v!==""||typeof v=="number"||typeof v=="bigint"?(v=""+v,d!==null&&d.tag===6?(l(m,d.sibling),A=n(d,v),A.return=m,m=A):(l(m,d),A=xi(v,m.mode,A),A.return=m,m=A),i(m)):l(m,d)}return function(m,d,v,A){try{Wa=0;var q=de(m,d,v,A);return na=null,q}catch(G){if(G===La||G===kn)throw G;var F=ut(29,G,null,m.mode);return F.lanes=A,F.return=m,F}finally{}}}var ua=hr(!0),mr=hr(!1),bt=N(null),jt=null;function el(e){var t=e.alternate;R(we,we.current&1),R(bt,e),jt===null&&(t===null||ea.current!==null||t.memoizedState!==null)&&(jt=e)}function pr(e){if(e.tag===22){if(R(we,we.current),R(bt,e),jt===null){var t=e.alternate;t!==null&&t.memoizedState!==null&&(jt=e)}}else tl()}function tl(){R(we,we.current),R(bt,bt.current)}function Bt(e){H(bt),jt===e&&(jt=null),H(we)}var we=N(0);function iu(e){for(var t=e;t!==null;){if(t.tag===13){var l=t.memoizedState;if(l!==null&&(l=l.dehydrated,l===null||l.data==="$?"||Qc(l)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}function ec(e,t,l,a){t=e.memoizedState,l=l(a,t),l=l==null?t:w({},t,l),e.memoizedState=l,e.lanes===0&&(e.updateQueue.baseState=l)}var tc={enqueueSetState:function(e,t,l){e=e._reactInternals;var a=ft(),n=Ft(a);n.payload=t,l!=null&&(n.callback=l),t=Pt(e,n,a),t!==null&&(rt(t,e,a),Qa(t,e,a))},enqueueReplaceState:function(e,t,l){e=e._reactInternals;var a=ft(),n=Ft(a);n.tag=1,n.payload=t,l!=null&&(n.callback=l),t=Pt(e,n,a),t!==null&&(rt(t,e,a),Qa(t,e,a))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var l=ft(),a=Ft(l);a.tag=2,t!=null&&(a.callback=t),t=Pt(e,a,l),t!==null&&(rt(t,e,l),Qa(t,e,l))}};function vr(e,t,l,a,n,u,i){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(a,u,i):t.prototype&&t.prototype.isPureReactComponent?!Ra(l,a)||!Ra(n,u):!0}function br(e,t,l,a){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(l,a),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(l,a),t.state!==e&&tc.enqueueReplaceState(t,t.state,null)}function _l(e,t){var l=t;if("ref"in t){l={};for(var a in t)a!=="ref"&&(l[a]=t[a])}if(e=e.defaultProps){l===t&&(l=w({},l));for(var n in e)l[n]===void 0&&(l[n]=e[n])}return l}var cu=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function yr(e){cu(e)}function xr(e){console.error(e)}function Sr(e){cu(e)}function su(e,t){try{var l=e.onUncaughtError;l(t.value,{componentStack:t.stack})}catch(a){setTimeout(function(){throw a})}}function Tr(e,t,l){try{var a=e.onCaughtError;a(l.value,{componentStack:l.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(n){setTimeout(function(){throw n})}}function lc(e,t,l){return l=Ft(l),l.tag=3,l.payload={element:null},l.callback=function(){su(e,t)},l}function Er(e){return e=Ft(e),e.tag=3,e}function zr(e,t,l,a){var n=l.type.getDerivedStateFromError;if(typeof n=="function"){var u=a.value;e.payload=function(){return n(u)},e.callback=function(){Tr(t,l,a)}}var i=l.stateNode;i!==null&&typeof i.componentDidCatch=="function"&&(e.callback=function(){Tr(t,l,a),typeof n!="function"&&(cl===null?cl=new Set([this]):cl.add(this));var c=a.stack;this.componentDidCatch(a.value,{componentStack:c!==null?c:""})})}function K0(e,t,l,a,n){if(l.flags|=32768,a!==null&&typeof a=="object"&&typeof a.then=="function"){if(t=l.alternate,t!==null&&Ba(t,l,n,!0),l=bt.current,l!==null){switch(l.tag){case 13:return jt===null?jc():l.alternate===null&&ze===0&&(ze=3),l.flags&=-257,l.flags|=65536,l.lanes=n,a===Ui?l.flags|=16384:(t=l.updateQueue,t===null?l.updateQueue=new Set([a]):t.add(a),Oc(e,a,n)),!1;case 22:return l.flags|=65536,a===Ui?l.flags|=16384:(t=l.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([a])},l.updateQueue=t):(l=t.retryQueue,l===null?t.retryQueue=new Set([a]):l.add(a)),Oc(e,a,n)),!1}throw Error(r(435,l.tag))}return Oc(e,a,n),jc(),!1}if(ue)return t=bt.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=n,a!==zi&&(e=Error(r(422),{cause:a}),Ya(ht(e,l)))):(a!==zi&&(t=Error(r(423),{cause:a}),Ya(ht(t,l))),e=e.current.alternate,e.flags|=65536,n&=-n,e.lanes|=n,a=ht(a,l),n=lc(e.stateNode,a,n),wi(e,n),ze!==4&&(ze=2)),!1;var u=Error(r(520),{cause:a});if(u=ht(u,l),nn===null?nn=[u]:nn.push(u),ze!==4&&(ze=2),t===null)return!0;a=ht(a,l),l=t;do{switch(l.tag){case 3:return l.flags|=65536,e=n&-n,l.lanes|=e,e=lc(l.stateNode,a,e),wi(l,e),!1;case 1:if(t=l.type,u=l.stateNode,(l.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||u!==null&&typeof u.componentDidCatch=="function"&&(cl===null||!cl.has(u))))return l.flags|=65536,n&=-n,l.lanes|=n,n=Er(n),zr(n,e,l,a),wi(l,n),!1}l=l.return}while(l!==null);return!1}var Ar=Error(r(461)),Ce=!1;function Le(e,t,l,a){t.child=e===null?mr(t,null,l,a):ua(t,e.child,l,a)}function jr(e,t,l,a,n){l=l.render;var u=t.ref;if("ref"in a){var i={};for(var c in a)c!=="ref"&&(i[c]=a[c])}else i=a;return Nl(t),a=qi(e,t,l,i,u,n),c=Gi(),e!==null&&!Ce?(Li(e,t,n),qt(e,t,n)):(ue&&c&&Ti(t),t.flags|=1,Le(e,t,a,n),t.child)}function Nr(e,t,l,a,n){if(e===null){var u=l.type;return typeof u=="function"&&!yi(u)&&u.defaultProps===void 0&&l.compare===null?(t.tag=15,t.type=u,Or(e,t,u,a,n)):(e=Ln(l.type,null,a,t,t.mode,n),e.ref=t.ref,e.return=t,t.child=e)}if(u=e.child,!rc(e,n)){var i=u.memoizedProps;if(l=l.compare,l=l!==null?l:Ra,l(i,a)&&e.ref===t.ref)return qt(e,t,n)}return t.flags|=1,e=Mt(u,a),e.ref=t.ref,e.return=t,t.child=e}function Or(e,t,l,a,n){if(e!==null){var u=e.memoizedProps;if(Ra(u,a)&&e.ref===t.ref)if(Ce=!1,t.pendingProps=a=u,rc(e,n))(e.flags&131072)!==0&&(Ce=!0);else return t.lanes=e.lanes,qt(e,t,n)}return ac(e,t,l,a,n)}function Dr(e,t,l){var a=t.pendingProps,n=a.children,u=e!==null?e.memoizedState:null;if(a.mode==="hidden"){if((t.flags&128)!==0){if(a=u!==null?u.baseLanes|l:l,e!==null){for(n=t.child=e.child,u=0;n!==null;)u=u|n.lanes|n.childLanes,n=n.sibling;t.childLanes=u&~a}else t.childLanes=0,t.child=null;return _r(e,t,a,l)}if((l&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Kn(t,u!==null?u.cachePool:null),u!==null?Of(t,u):Ci(),pr(t);else return t.lanes=t.childLanes=536870912,_r(e,t,u!==null?u.baseLanes|l:l,l)}else u!==null?(Kn(t,u.cachePool),Of(t,u),tl(),t.memoizedState=null):(e!==null&&Kn(t,null),Ci(),tl());return Le(e,t,n,l),t.child}function _r(e,t,l,a){var n=_i();return n=n===null?null:{parent:Re._currentValue,pool:n},t.memoizedState={baseLanes:l,cachePool:n},e!==null&&Kn(t,null),Ci(),pr(t),e!==null&&Ba(e,t,a,!0),null}function fu(e,t){var l=t.ref;if(l===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof l!="function"&&typeof l!="object")throw Error(r(284));(e===null||e.ref!==l)&&(t.flags|=4194816)}}function ac(e,t,l,a,n){return Nl(t),l=qi(e,t,l,a,void 0,n),a=Gi(),e!==null&&!Ce?(Li(e,t,n),qt(e,t,n)):(ue&&a&&Ti(t),t.flags|=1,Le(e,t,l,n),t.child)}function Ur(e,t,l,a,n,u){return Nl(t),t.updateQueue=null,l=_f(t,a,l,n),Df(e),a=Gi(),e!==null&&!Ce?(Li(e,t,u),qt(e,t,u)):(ue&&a&&Ti(t),t.flags|=1,Le(e,t,l,u),t.child)}function Mr(e,t,l,a,n){if(Nl(t),t.stateNode===null){var u=$l,i=l.contextType;typeof i=="object"&&i!==null&&(u=Ze(i)),u=new l(a,u),t.memoizedState=u.state!==null&&u.state!==void 0?u.state:null,u.updater=tc,t.stateNode=u,u._reactInternals=t,u=t.stateNode,u.props=a,u.state=t.memoizedState,u.refs={},Mi(t),i=l.contextType,u.context=typeof i=="object"&&i!==null?Ze(i):$l,u.state=t.memoizedState,i=l.getDerivedStateFromProps,typeof i=="function"&&(ec(t,l,i,a),u.state=t.memoizedState),typeof l.getDerivedStateFromProps=="function"||typeof u.getSnapshotBeforeUpdate=="function"||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(i=u.state,typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount(),i!==u.state&&tc.enqueueReplaceState(u,u.state,null),Za(t,a,u,n),Va(),u.state=t.memoizedState),typeof u.componentDidMount=="function"&&(t.flags|=4194308),a=!0}else if(e===null){u=t.stateNode;var c=t.memoizedProps,f=_l(l,c);u.props=f;var b=u.context,z=l.contextType;i=$l,typeof z=="object"&&z!==null&&(i=Ze(z));var j=l.getDerivedStateFromProps;z=typeof j=="function"||typeof u.getSnapshotBeforeUpdate=="function",c=t.pendingProps!==c,z||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(c||b!==i)&&br(t,u,a,i),Wt=!1;var x=t.memoizedState;u.state=x,Za(t,a,u,n),Va(),b=t.memoizedState,c||x!==b||Wt?(typeof j=="function"&&(ec(t,l,j,a),b=t.memoizedState),(f=Wt||vr(t,l,f,a,x,b,i))?(z||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount()),typeof u.componentDidMount=="function"&&(t.flags|=4194308)):(typeof u.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=a,t.memoizedState=b),u.props=a,u.state=b,u.context=i,a=f):(typeof u.componentDidMount=="function"&&(t.flags|=4194308),a=!1)}else{u=t.stateNode,Ri(e,t),i=t.memoizedProps,z=_l(l,i),u.props=z,j=t.pendingProps,x=u.context,b=l.contextType,f=$l,typeof b=="object"&&b!==null&&(f=Ze(b)),c=l.getDerivedStateFromProps,(b=typeof c=="function"||typeof u.getSnapshotBeforeUpdate=="function")||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(i!==j||x!==f)&&br(t,u,a,f),Wt=!1,x=t.memoizedState,u.state=x,Za(t,a,u,n),Va();var T=t.memoizedState;i!==j||x!==T||Wt||e!==null&&e.dependencies!==null&&Vn(e.dependencies)?(typeof c=="function"&&(ec(t,l,c,a),T=t.memoizedState),(z=Wt||vr(t,l,z,a,x,T,f)||e!==null&&e.dependencies!==null&&Vn(e.dependencies))?(b||typeof u.UNSAFE_componentWillUpdate!="function"&&typeof u.componentWillUpdate!="function"||(typeof u.componentWillUpdate=="function"&&u.componentWillUpdate(a,T,f),typeof u.UNSAFE_componentWillUpdate=="function"&&u.UNSAFE_componentWillUpdate(a,T,f)),typeof u.componentDidUpdate=="function"&&(t.flags|=4),typeof u.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof u.componentDidUpdate!="function"||i===e.memoizedProps&&x===e.memoizedState||(t.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||i===e.memoizedProps&&x===e.memoizedState||(t.flags|=1024),t.memoizedProps=a,t.memoizedState=T),u.props=a,u.state=T,u.context=f,a=z):(typeof u.componentDidUpdate!="function"||i===e.memoizedProps&&x===e.memoizedState||(t.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||i===e.memoizedProps&&x===e.memoizedState||(t.flags|=1024),a=!1)}return u=a,fu(e,t),a=(t.flags&128)!==0,u||a?(u=t.stateNode,l=a&&typeof l.getDerivedStateFromError!="function"?null:u.render(),t.flags|=1,e!==null&&a?(t.child=ua(t,e.child,null,n),t.child=ua(t,null,l,n)):Le(e,t,l,n),t.memoizedState=u.state,e=t.child):e=qt(e,t,n),e}function Rr(e,t,l,a){return Ca(),t.flags|=256,Le(e,t,l,a),t.child}var nc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function uc(e){return{baseLanes:e,cachePool:xf()}}function ic(e,t,l){return e=e!==null?e.childLanes&~l:0,t&&(e|=yt),e}function wr(e,t,l){var a=t.pendingProps,n=!1,u=(t.flags&128)!==0,i;if((i=u)||(i=e!==null&&e.memoizedState===null?!1:(we.current&2)!==0),i&&(n=!0,t.flags&=-129),i=(t.flags&32)!==0,t.flags&=-33,e===null){if(ue){if(n?el(t):tl(),ue){var c=Ee,f;if(f=c){e:{for(f=c,c=At;f.nodeType!==8;){if(!c){c=null;break e}if(f=Et(f.nextSibling),f===null){c=null;break e}}c=f}c!==null?(t.memoizedState={dehydrated:c,treeContext:Tl!==null?{id:Rt,overflow:wt}:null,retryLane:536870912,hydrationErrors:null},f=ut(18,null,null,0),f.stateNode=c,f.return=t,t.child=f,Je=t,Ee=null,f=!0):f=!1}f||Al(t)}if(c=t.memoizedState,c!==null&&(c=c.dehydrated,c!==null))return Qc(c)?t.lanes=32:t.lanes=536870912,null;Bt(t)}return c=a.children,a=a.fallback,n?(tl(),n=t.mode,c=ru({mode:"hidden",children:c},n),a=Sl(a,n,l,null),c.return=t,a.return=t,c.sibling=a,t.child=c,n=t.child,n.memoizedState=uc(l),n.childLanes=ic(e,i,l),t.memoizedState=nc,a):(el(t),cc(t,c))}if(f=e.memoizedState,f!==null&&(c=f.dehydrated,c!==null)){if(u)t.flags&256?(el(t),t.flags&=-257,t=sc(e,t,l)):t.memoizedState!==null?(tl(),t.child=e.child,t.flags|=128,t=null):(tl(),n=a.fallback,c=t.mode,a=ru({mode:"visible",children:a.children},c),n=Sl(n,c,l,null),n.flags|=2,a.return=t,n.return=t,a.sibling=n,t.child=a,ua(t,e.child,null,l),a=t.child,a.memoizedState=uc(l),a.childLanes=ic(e,i,l),t.memoizedState=nc,t=n);else if(el(t),Qc(c)){if(i=c.nextSibling&&c.nextSibling.dataset,i)var b=i.dgst;i=b,a=Error(r(419)),a.stack="",a.digest=i,Ya({value:a,source:null,stack:null}),t=sc(e,t,l)}else if(Ce||Ba(e,t,l,!1),i=(l&e.childLanes)!==0,Ce||i){if(i=pe,i!==null&&(a=l&-l,a=(a&42)!==0?1:Vu(a),a=(a&(i.suspendedLanes|l))!==0?0:a,a!==0&&a!==f.retryLane))throw f.retryLane=a,Jl(e,a),rt(i,e,a),Ar;c.data==="$?"||jc(),t=sc(e,t,l)}else c.data==="$?"?(t.flags|=192,t.child=e.child,t=null):(e=f.treeContext,Ee=Et(c.nextSibling),Je=t,ue=!0,zl=null,At=!1,e!==null&&(pt[vt++]=Rt,pt[vt++]=wt,pt[vt++]=Tl,Rt=e.id,wt=e.overflow,Tl=t),t=cc(t,a.children),t.flags|=4096);return t}return n?(tl(),n=a.fallback,c=t.mode,f=e.child,b=f.sibling,a=Mt(f,{mode:"hidden",children:a.children}),a.subtreeFlags=f.subtreeFlags&65011712,b!==null?n=Mt(b,n):(n=Sl(n,c,l,null),n.flags|=2),n.return=t,a.return=t,a.sibling=n,t.child=a,a=n,n=t.child,c=e.child.memoizedState,c===null?c=uc(l):(f=c.cachePool,f!==null?(b=Re._currentValue,f=f.parent!==b?{parent:b,pool:b}:f):f=xf(),c={baseLanes:c.baseLanes|l,cachePool:f}),n.memoizedState=c,n.childLanes=ic(e,i,l),t.memoizedState=nc,a):(el(t),l=e.child,e=l.sibling,l=Mt(l,{mode:"visible",children:a.children}),l.return=t,l.sibling=null,e!==null&&(i=t.deletions,i===null?(t.deletions=[e],t.flags|=16):i.push(e)),t.child=l,t.memoizedState=null,l)}function cc(e,t){return t=ru({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function ru(e,t){return e=ut(22,e,null,t),e.lanes=0,e.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null},e}function sc(e,t,l){return ua(t,e.child,null,l),e=cc(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Hr(e,t,l){e.lanes|=t;var a=e.alternate;a!==null&&(a.lanes|=t),ji(e.return,t,l)}function fc(e,t,l,a,n){var u=e.memoizedState;u===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:a,tail:l,tailMode:n}:(u.isBackwards=t,u.rendering=null,u.renderingStartTime=0,u.last=a,u.tail=l,u.tailMode=n)}function Cr(e,t,l){var a=t.pendingProps,n=a.revealOrder,u=a.tail;if(Le(e,t,a.children,l),a=we.current,(a&2)!==0)a=a&1|2,t.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Hr(e,l,t);else if(e.tag===19)Hr(e,l,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}a&=1}switch(R(we,a),n){case"forwards":for(l=t.child,n=null;l!==null;)e=l.alternate,e!==null&&iu(e)===null&&(n=l),l=l.sibling;l=n,l===null?(n=t.child,t.child=null):(n=l.sibling,l.sibling=null),fc(t,!1,n,l,u);break;case"backwards":for(l=null,n=t.child,t.child=null;n!==null;){if(e=n.alternate,e!==null&&iu(e)===null){t.child=n;break}e=n.sibling,n.sibling=l,l=n,n=e}fc(t,!0,l,null,u);break;case"together":fc(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function qt(e,t,l){if(e!==null&&(t.dependencies=e.dependencies),il|=t.lanes,(l&t.childLanes)===0)if(e!==null){if(Ba(e,t,l,!1),(l&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(r(153));if(t.child!==null){for(e=t.child,l=Mt(e,e.pendingProps),t.child=l,l.return=t;e.sibling!==null;)e=e.sibling,l=l.sibling=Mt(e,e.pendingProps),l.return=t;l.sibling=null}return t.child}function rc(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&Vn(e)))}function k0(e,t,l){switch(t.tag){case 3:ye(t,t.stateNode.containerInfo),$t(t,Re,e.memoizedState.cache),Ca();break;case 27:case 5:qu(t);break;case 4:ye(t,t.stateNode.containerInfo);break;case 10:$t(t,t.type,t.memoizedProps.value);break;case 13:var a=t.memoizedState;if(a!==null)return a.dehydrated!==null?(el(t),t.flags|=128,null):(l&t.child.childLanes)!==0?wr(e,t,l):(el(t),e=qt(e,t,l),e!==null?e.sibling:null);el(t);break;case 19:var n=(e.flags&128)!==0;if(a=(l&t.childLanes)!==0,a||(Ba(e,t,l,!1),a=(l&t.childLanes)!==0),n){if(a)return Cr(e,t,l);t.flags|=128}if(n=t.memoizedState,n!==null&&(n.rendering=null,n.tail=null,n.lastEffect=null),R(we,we.current),a)break;return null;case 22:case 23:return t.lanes=0,Dr(e,t,l);case 24:$t(t,Re,e.memoizedState.cache)}return qt(e,t,l)}function Yr(e,t,l){if(e!==null)if(e.memoizedProps!==t.pendingProps)Ce=!0;else{if(!rc(e,l)&&(t.flags&128)===0)return Ce=!1,k0(e,t,l);Ce=(e.flags&131072)!==0}else Ce=!1,ue&&(t.flags&1048576)!==0&&gf(t,Qn,t.index);switch(t.lanes=0,t.tag){case 16:e:{e=t.pendingProps;var a=t.elementType,n=a._init;if(a=n(a._payload),t.type=a,typeof a=="function")yi(a)?(e=_l(a,e),t.tag=1,t=Mr(null,t,a,e,l)):(t.tag=0,t=ac(null,t,a,e,l));else{if(a!=null){if(n=a.$$typeof,n===qe){t.tag=11,t=jr(null,t,a,e,l);break e}else if(n===Oe){t.tag=14,t=Nr(null,t,a,e,l);break e}}throw t=ke(a)||a,Error(r(306,t,""))}}return t;case 0:return ac(e,t,t.type,t.pendingProps,l);case 1:return a=t.type,n=_l(a,t.pendingProps),Mr(e,t,a,n,l);case 3:e:{if(ye(t,t.stateNode.containerInfo),e===null)throw Error(r(387));a=t.pendingProps;var u=t.memoizedState;n=u.element,Ri(e,t),Za(t,a,null,l);var i=t.memoizedState;if(a=i.cache,$t(t,Re,a),a!==u.cache&&Ni(t,[Re],l,!0),Va(),a=i.element,u.isDehydrated)if(u={element:a,isDehydrated:!1,cache:i.cache},t.updateQueue.baseState=u,t.memoizedState=u,t.flags&256){t=Rr(e,t,a,l);break e}else if(a!==n){n=ht(Error(r(424)),t),Ya(n),t=Rr(e,t,a,l);break e}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName==="HTML"?e.ownerDocument.body:e}for(Ee=Et(e.firstChild),Je=t,ue=!0,zl=null,At=!0,l=mr(t,null,a,l),t.child=l;l;)l.flags=l.flags&-3|4096,l=l.sibling}else{if(Ca(),a===n){t=qt(e,t,l);break e}Le(e,t,a,l)}t=t.child}return t;case 26:return fu(e,t),e===null?(l=Xo(t.type,null,t.pendingProps,null))?t.memoizedState=l:ue||(l=t.type,e=t.pendingProps,a=zu(Z.current).createElement(l),a[Ve]=t,a[$e]=e,Qe(a,l,e),He(a),t.stateNode=a):t.memoizedState=Xo(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return qu(t),e===null&&ue&&(a=t.stateNode=qo(t.type,t.pendingProps,Z.current),Je=t,At=!0,n=Ee,rl(t.type)?(Vc=n,Ee=Et(a.firstChild)):Ee=n),Le(e,t,t.pendingProps.children,l),fu(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&ue&&((n=a=Ee)&&(a=Sg(a,t.type,t.pendingProps,At),a!==null?(t.stateNode=a,Je=t,Ee=Et(a.firstChild),At=!1,n=!0):n=!1),n||Al(t)),qu(t),n=t.type,u=t.pendingProps,i=e!==null?e.memoizedProps:null,a=u.children,Gc(n,u)?a=null:i!==null&&Gc(n,i)&&(t.flags|=32),t.memoizedState!==null&&(n=qi(e,t,q0,null,null,l),hn._currentValue=n),fu(e,t),Le(e,t,a,l),t.child;case 6:return e===null&&ue&&((e=l=Ee)&&(l=Tg(l,t.pendingProps,At),l!==null?(t.stateNode=l,Je=t,Ee=null,e=!0):e=!1),e||Al(t)),null;case 13:return wr(e,t,l);case 4:return ye(t,t.stateNode.containerInfo),a=t.pendingProps,e===null?t.child=ua(t,null,a,l):Le(e,t,a,l),t.child;case 11:return jr(e,t,t.type,t.pendingProps,l);case 7:return Le(e,t,t.pendingProps,l),t.child;case 8:return Le(e,t,t.pendingProps.children,l),t.child;case 12:return Le(e,t,t.pendingProps.children,l),t.child;case 10:return a=t.pendingProps,$t(t,t.type,a.value),Le(e,t,a.children,l),t.child;case 9:return n=t.type._context,a=t.pendingProps.children,Nl(t),n=Ze(n),a=a(n),t.flags|=1,Le(e,t,a,l),t.child;case 14:return Nr(e,t,t.type,t.pendingProps,l);case 15:return Or(e,t,t.type,t.pendingProps,l);case 19:return Cr(e,t,l);case 31:return a=t.pendingProps,l=t.mode,a={mode:a.mode,children:a.children},e===null?(l=ru(a,l),l.ref=t.ref,t.child=l,l.return=t,t=l):(l=Mt(e.child,a),l.ref=t.ref,t.child=l,l.return=t,t=l),t;case 22:return Dr(e,t,l);case 24:return Nl(t),a=Ze(Re),e===null?(n=_i(),n===null&&(n=pe,u=Oi(),n.pooledCache=u,u.refCount++,u!==null&&(n.pooledCacheLanes|=l),n=u),t.memoizedState={parent:a,cache:n},Mi(t),$t(t,Re,n)):((e.lanes&l)!==0&&(Ri(e,t),Za(t,null,null,l),Va()),n=e.memoizedState,u=t.memoizedState,n.parent!==a?(n={parent:a,cache:a},t.memoizedState=n,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=n),$t(t,Re,a)):(a=u.cache,$t(t,Re,a),a!==n.cache&&Ni(t,[Re],l,!0))),Le(e,t,t.pendingProps.children,l),t.child;case 29:throw t.pendingProps}throw Error(r(156,t.tag))}function Gt(e){e.flags|=4}function Br(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!ko(t)){if(t=bt.current,t!==null&&((te&4194048)===te?jt!==null:(te&62914560)!==te&&(te&536870912)===0||t!==jt))throw Xa=Ui,Sf;e.flags|=8192}}function ou(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?ms():536870912,e.lanes|=t,fa|=t)}function Pa(e,t){if(!ue)switch(e.tailMode){case"hidden":t=e.tail;for(var l=null;t!==null;)t.alternate!==null&&(l=t),t=t.sibling;l===null?e.tail=null:l.sibling=null;break;case"collapsed":l=e.tail;for(var a=null;l!==null;)l.alternate!==null&&(a=l),l=l.sibling;a===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:a.sibling=null}}function Te(e){var t=e.alternate!==null&&e.alternate.child===e.child,l=0,a=0;if(t)for(var n=e.child;n!==null;)l|=n.lanes|n.childLanes,a|=n.subtreeFlags&65011712,a|=n.flags&65011712,n.return=e,n=n.sibling;else for(n=e.child;n!==null;)l|=n.lanes|n.childLanes,a|=n.subtreeFlags,a|=n.flags,n.return=e,n=n.sibling;return e.subtreeFlags|=a,e.childLanes=l,t}function J0(e,t,l){var a=t.pendingProps;switch(Ei(t),t.tag){case 31:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Te(t),null;case 1:return Te(t),null;case 3:return l=t.stateNode,a=null,e!==null&&(a=e.memoizedState.cache),t.memoizedState.cache!==a&&(t.flags|=2048),Ct(Re),Zt(),l.pendingContext&&(l.context=l.pendingContext,l.pendingContext=null),(e===null||e.child===null)&&(Ha(t)?Gt(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,pf())),Te(t),null;case 26:return l=t.memoizedState,e===null?(Gt(t),l!==null?(Te(t),Br(t,l)):(Te(t),t.flags&=-16777217)):l?l!==e.memoizedState?(Gt(t),Te(t),Br(t,l)):(Te(t),t.flags&=-16777217):(e.memoizedProps!==a&&Gt(t),Te(t),t.flags&=-16777217),null;case 27:Tn(t),l=Z.current;var n=t.type;if(e!==null&&t.stateNode!=null)e.memoizedProps!==a&&Gt(t);else{if(!a){if(t.stateNode===null)throw Error(r(166));return Te(t),null}e=L.current,Ha(t)?hf(t):(e=qo(n,a,l),t.stateNode=e,Gt(t))}return Te(t),null;case 5:if(Tn(t),l=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==a&&Gt(t);else{if(!a){if(t.stateNode===null)throw Error(r(166));return Te(t),null}if(e=L.current,Ha(t))hf(t);else{switch(n=zu(Z.current),e){case 1:e=n.createElementNS("http://www.w3.org/2000/svg",l);break;case 2:e=n.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;default:switch(l){case"svg":e=n.createElementNS("http://www.w3.org/2000/svg",l);break;case"math":e=n.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;case"script":e=n.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild);break;case"select":e=typeof a.is=="string"?n.createElement("select",{is:a.is}):n.createElement("select"),a.multiple?e.multiple=!0:a.size&&(e.size=a.size);break;default:e=typeof a.is=="string"?n.createElement(l,{is:a.is}):n.createElement(l)}}e[Ve]=t,e[$e]=a;e:for(n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.tag!==27&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break e;for(;n.sibling===null;){if(n.return===null||n.return===t)break e;n=n.return}n.sibling.return=n.return,n=n.sibling}t.stateNode=e;e:switch(Qe(e,l,a),l){case"button":case"input":case"select":case"textarea":e=!!a.autoFocus;break e;case"img":e=!0;break e;default:e=!1}e&&Gt(t)}}return Te(t),t.flags&=-16777217,null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==a&&Gt(t);else{if(typeof a!="string"&&t.stateNode===null)throw Error(r(166));if(e=Z.current,Ha(t)){if(e=t.stateNode,l=t.memoizedProps,a=null,n=Je,n!==null)switch(n.tag){case 27:case 5:a=n.memoizedProps}e[Ve]=t,e=!!(e.nodeValue===l||a!==null&&a.suppressHydrationWarning===!0||Mo(e.nodeValue,l)),e||Al(t)}else e=zu(e).createTextNode(a),e[Ve]=t,t.stateNode=e}return Te(t),null;case 13:if(a=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(n=Ha(t),a!==null&&a.dehydrated!==null){if(e===null){if(!n)throw Error(r(318));if(n=t.memoizedState,n=n!==null?n.dehydrated:null,!n)throw Error(r(317));n[Ve]=t}else Ca(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;Te(t),n=!1}else n=pf(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),n=!0;if(!n)return t.flags&256?(Bt(t),t):(Bt(t),null)}if(Bt(t),(t.flags&128)!==0)return t.lanes=l,t;if(l=a!==null,e=e!==null&&e.memoizedState!==null,l){a=t.child,n=null,a.alternate!==null&&a.alternate.memoizedState!==null&&a.alternate.memoizedState.cachePool!==null&&(n=a.alternate.memoizedState.cachePool.pool);var u=null;a.memoizedState!==null&&a.memoizedState.cachePool!==null&&(u=a.memoizedState.cachePool.pool),u!==n&&(a.flags|=2048)}return l!==e&&l&&(t.child.flags|=8192),ou(t,t.updateQueue),Te(t),null;case 4:return Zt(),e===null&&Hc(t.stateNode.containerInfo),Te(t),null;case 10:return Ct(t.type),Te(t),null;case 19:if(H(we),n=t.memoizedState,n===null)return Te(t),null;if(a=(t.flags&128)!==0,u=n.rendering,u===null)if(a)Pa(n,!1);else{if(ze!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(u=iu(e),u!==null){for(t.flags|=128,Pa(n,!1),e=u.updateQueue,t.updateQueue=e,ou(t,e),t.subtreeFlags=0,e=l,l=t.child;l!==null;)df(l,e),l=l.sibling;return R(we,we.current&1|2),t.child}e=e.sibling}n.tail!==null&&zt()>hu&&(t.flags|=128,a=!0,Pa(n,!1),t.lanes=4194304)}else{if(!a)if(e=iu(u),e!==null){if(t.flags|=128,a=!0,e=e.updateQueue,t.updateQueue=e,ou(t,e),Pa(n,!0),n.tail===null&&n.tailMode==="hidden"&&!u.alternate&&!ue)return Te(t),null}else 2*zt()-n.renderingStartTime>hu&&l!==536870912&&(t.flags|=128,a=!0,Pa(n,!1),t.lanes=4194304);n.isBackwards?(u.sibling=t.child,t.child=u):(e=n.last,e!==null?e.sibling=u:t.child=u,n.last=u)}return n.tail!==null?(t=n.tail,n.rendering=t,n.tail=t.sibling,n.renderingStartTime=zt(),t.sibling=null,e=we.current,R(we,a?e&1|2:e&1),t):(Te(t),null);case 22:case 23:return Bt(t),Yi(),a=t.memoizedState!==null,e!==null?e.memoizedState!==null!==a&&(t.flags|=8192):a&&(t.flags|=8192),a?(l&536870912)!==0&&(t.flags&128)===0&&(Te(t),t.subtreeFlags&6&&(t.flags|=8192)):Te(t),l=t.updateQueue,l!==null&&ou(t,l.retryQueue),l=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(l=e.memoizedState.cachePool.pool),a=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),a!==l&&(t.flags|=2048),e!==null&&H(Ol),null;case 24:return l=null,e!==null&&(l=e.memoizedState.cache),t.memoizedState.cache!==l&&(t.flags|=2048),Ct(Re),Te(t),null;case 25:return null;case 30:return null}throw Error(r(156,t.tag))}function $0(e,t){switch(Ei(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Ct(Re),Zt(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Tn(t),null;case 13:if(Bt(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(r(340));Ca()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return H(we),null;case 4:return Zt(),null;case 10:return Ct(t.type),null;case 22:case 23:return Bt(t),Yi(),e!==null&&H(Ol),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return Ct(Re),null;case 25:return null;default:return null}}function qr(e,t){switch(Ei(t),t.tag){case 3:Ct(Re),Zt();break;case 26:case 27:case 5:Tn(t);break;case 4:Zt();break;case 13:Bt(t);break;case 19:H(we);break;case 10:Ct(t.type);break;case 22:case 23:Bt(t),Yi(),e!==null&&H(Ol);break;case 24:Ct(Re)}}function Ia(e,t){try{var l=t.updateQueue,a=l!==null?l.lastEffect:null;if(a!==null){var n=a.next;l=n;do{if((l.tag&e)===e){a=void 0;var u=l.create,i=l.inst;a=u(),i.destroy=a}l=l.next}while(l!==n)}}catch(c){me(t,t.return,c)}}function ll(e,t,l){try{var a=t.updateQueue,n=a!==null?a.lastEffect:null;if(n!==null){var u=n.next;a=u;do{if((a.tag&e)===e){var i=a.inst,c=i.destroy;if(c!==void 0){i.destroy=void 0,n=t;var f=l,b=c;try{b()}catch(z){me(n,f,z)}}}a=a.next}while(a!==u)}}catch(z){me(t,t.return,z)}}function Gr(e){var t=e.updateQueue;if(t!==null){var l=e.stateNode;try{Nf(t,l)}catch(a){me(e,e.return,a)}}}function Lr(e,t,l){l.props=_l(e.type,e.memoizedProps),l.state=e.memoizedState;try{l.componentWillUnmount()}catch(a){me(e,t,a)}}function en(e,t){try{var l=e.ref;if(l!==null){switch(e.tag){case 26:case 27:case 5:var a=e.stateNode;break;case 30:a=e.stateNode;break;default:a=e.stateNode}typeof l=="function"?e.refCleanup=l(a):l.current=a}}catch(n){me(e,t,n)}}function Nt(e,t){var l=e.ref,a=e.refCleanup;if(l!==null)if(typeof a=="function")try{a()}catch(n){me(e,t,n)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof l=="function")try{l(null)}catch(n){me(e,t,n)}else l.current=null}function Xr(e){var t=e.type,l=e.memoizedProps,a=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":l.autoFocus&&a.focus();break e;case"img":l.src?a.src=l.src:l.srcSet&&(a.srcset=l.srcSet)}}catch(n){me(e,e.return,n)}}function oc(e,t,l){try{var a=e.stateNode;pg(a,e.type,l,t),a[$e]=t}catch(n){me(e,e.return,n)}}function Qr(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&rl(e.type)||e.tag===4}function dc(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||Qr(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&rl(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function gc(e,t,l){var a=e.tag;if(a===5||a===6)e=e.stateNode,t?(l.nodeType===9?l.body:l.nodeName==="HTML"?l.ownerDocument.body:l).insertBefore(e,t):(t=l.nodeType===9?l.body:l.nodeName==="HTML"?l.ownerDocument.body:l,t.appendChild(e),l=l._reactRootContainer,l!=null||t.onclick!==null||(t.onclick=Eu));else if(a!==4&&(a===27&&rl(e.type)&&(l=e.stateNode,t=null),e=e.child,e!==null))for(gc(e,t,l),e=e.sibling;e!==null;)gc(e,t,l),e=e.sibling}function du(e,t,l){var a=e.tag;if(a===5||a===6)e=e.stateNode,t?l.insertBefore(e,t):l.appendChild(e);else if(a!==4&&(a===27&&rl(e.type)&&(l=e.stateNode),e=e.child,e!==null))for(du(e,t,l),e=e.sibling;e!==null;)du(e,t,l),e=e.sibling}function Vr(e){var t=e.stateNode,l=e.memoizedProps;try{for(var a=e.type,n=t.attributes;n.length;)t.removeAttributeNode(n[0]);Qe(t,a,l),t[Ve]=e,t[$e]=l}catch(u){me(e,e.return,u)}}var Lt=!1,Ne=!1,hc=!1,Zr=typeof WeakSet=="function"?WeakSet:Set,Ye=null;function W0(e,t){if(e=e.containerInfo,Bc=_u,e=tf(e),di(e)){if("selectionStart"in e)var l={start:e.selectionStart,end:e.selectionEnd};else e:{l=(l=e.ownerDocument)&&l.defaultView||window;var a=l.getSelection&&l.getSelection();if(a&&a.rangeCount!==0){l=a.anchorNode;var n=a.anchorOffset,u=a.focusNode;a=a.focusOffset;try{l.nodeType,u.nodeType}catch{l=null;break e}var i=0,c=-1,f=-1,b=0,z=0,j=e,x=null;t:for(;;){for(var T;j!==l||n!==0&&j.nodeType!==3||(c=i+n),j!==u||a!==0&&j.nodeType!==3||(f=i+a),j.nodeType===3&&(i+=j.nodeValue.length),(T=j.firstChild)!==null;)x=j,j=T;for(;;){if(j===e)break t;if(x===l&&++b===n&&(c=i),x===u&&++z===a&&(f=i),(T=j.nextSibling)!==null)break;j=x,x=j.parentNode}j=T}l=c===-1||f===-1?null:{start:c,end:f}}else l=null}l=l||{start:0,end:0}}else l=null;for(qc={focusedElem:e,selectionRange:l},_u=!1,Ye=t;Ye!==null;)if(t=Ye,e=t.child,(t.subtreeFlags&1024)!==0&&e!==null)e.return=t,Ye=e;else for(;Ye!==null;){switch(t=Ye,u=t.alternate,e=t.flags,t.tag){case 0:break;case 11:case 15:break;case 1:if((e&1024)!==0&&u!==null){e=void 0,l=t,n=u.memoizedProps,u=u.memoizedState,a=l.stateNode;try{var V=_l(l.type,n,l.elementType===l.type);e=a.getSnapshotBeforeUpdate(V,u),a.__reactInternalSnapshotBeforeUpdate=e}catch(X){me(l,l.return,X)}}break;case 3:if((e&1024)!==0){if(e=t.stateNode.containerInfo,l=e.nodeType,l===9)Xc(e);else if(l===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":Xc(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((e&1024)!==0)throw Error(r(163))}if(e=t.sibling,e!==null){e.return=t.return,Ye=e;break}Ye=t.return}}function Kr(e,t,l){var a=l.flags;switch(l.tag){case 0:case 11:case 15:al(e,l),a&4&&Ia(5,l);break;case 1:if(al(e,l),a&4)if(e=l.stateNode,t===null)try{e.componentDidMount()}catch(i){me(l,l.return,i)}else{var n=_l(l.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(n,t,e.__reactInternalSnapshotBeforeUpdate)}catch(i){me(l,l.return,i)}}a&64&&Gr(l),a&512&&en(l,l.return);break;case 3:if(al(e,l),a&64&&(e=l.updateQueue,e!==null)){if(t=null,l.child!==null)switch(l.child.tag){case 27:case 5:t=l.child.stateNode;break;case 1:t=l.child.stateNode}try{Nf(e,t)}catch(i){me(l,l.return,i)}}break;case 27:t===null&&a&4&&Vr(l);case 26:case 5:al(e,l),t===null&&a&4&&Xr(l),a&512&&en(l,l.return);break;case 12:al(e,l);break;case 13:al(e,l),a&4&&$r(e,l),a&64&&(e=l.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(l=ug.bind(null,l),Eg(e,l))));break;case 22:if(a=l.memoizedState!==null||Lt,!a){t=t!==null&&t.memoizedState!==null||Ne,n=Lt;var u=Ne;Lt=a,(Ne=t)&&!u?nl(e,l,(l.subtreeFlags&8772)!==0):al(e,l),Lt=n,Ne=u}break;case 30:break;default:al(e,l)}}function kr(e){var t=e.alternate;t!==null&&(e.alternate=null,kr(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&ku(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var xe=null,Pe=!1;function Xt(e,t,l){for(l=l.child;l!==null;)Jr(e,t,l),l=l.sibling}function Jr(e,t,l){if(lt&&typeof lt.onCommitFiberUnmount=="function")try{lt.onCommitFiberUnmount(Sa,l)}catch{}switch(l.tag){case 26:Ne||Nt(l,t),Xt(e,t,l),l.memoizedState?l.memoizedState.count--:l.stateNode&&(l=l.stateNode,l.parentNode.removeChild(l));break;case 27:Ne||Nt(l,t);var a=xe,n=Pe;rl(l.type)&&(xe=l.stateNode,Pe=!1),Xt(e,t,l),rn(l.stateNode),xe=a,Pe=n;break;case 5:Ne||Nt(l,t);case 6:if(a=xe,n=Pe,xe=null,Xt(e,t,l),xe=a,Pe=n,xe!==null)if(Pe)try{(xe.nodeType===9?xe.body:xe.nodeName==="HTML"?xe.ownerDocument.body:xe).removeChild(l.stateNode)}catch(u){me(l,t,u)}else try{xe.removeChild(l.stateNode)}catch(u){me(l,t,u)}break;case 18:xe!==null&&(Pe?(e=xe,Yo(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,l.stateNode),bn(e)):Yo(xe,l.stateNode));break;case 4:a=xe,n=Pe,xe=l.stateNode.containerInfo,Pe=!0,Xt(e,t,l),xe=a,Pe=n;break;case 0:case 11:case 14:case 15:Ne||ll(2,l,t),Ne||ll(4,l,t),Xt(e,t,l);break;case 1:Ne||(Nt(l,t),a=l.stateNode,typeof a.componentWillUnmount=="function"&&Lr(l,t,a)),Xt(e,t,l);break;case 21:Xt(e,t,l);break;case 22:Ne=(a=Ne)||l.memoizedState!==null,Xt(e,t,l),Ne=a;break;default:Xt(e,t,l)}}function $r(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{bn(e)}catch(l){me(t,t.return,l)}}function F0(e){switch(e.tag){case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Zr),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Zr),t;default:throw Error(r(435,e.tag))}}function mc(e,t){var l=F0(e);t.forEach(function(a){var n=ig.bind(null,e,a);l.has(a)||(l.add(a),a.then(n,n))})}function it(e,t){var l=t.deletions;if(l!==null)for(var a=0;a<l.length;a++){var n=l[a],u=e,i=t,c=i;e:for(;c!==null;){switch(c.tag){case 27:if(rl(c.type)){xe=c.stateNode,Pe=!1;break e}break;case 5:xe=c.stateNode,Pe=!1;break e;case 3:case 4:xe=c.stateNode.containerInfo,Pe=!0;break e}c=c.return}if(xe===null)throw Error(r(160));Jr(u,i,n),xe=null,Pe=!1,u=n.alternate,u!==null&&(u.return=null),n.return=null}if(t.subtreeFlags&13878)for(t=t.child;t!==null;)Wr(t,e),t=t.sibling}var Tt=null;function Wr(e,t){var l=e.alternate,a=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:it(t,e),ct(e),a&4&&(ll(3,e,e.return),Ia(3,e),ll(5,e,e.return));break;case 1:it(t,e),ct(e),a&512&&(Ne||l===null||Nt(l,l.return)),a&64&&Lt&&(e=e.updateQueue,e!==null&&(a=e.callbacks,a!==null&&(l=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=l===null?a:l.concat(a))));break;case 26:var n=Tt;if(it(t,e),ct(e),a&512&&(Ne||l===null||Nt(l,l.return)),a&4){var u=l!==null?l.memoizedState:null;if(a=e.memoizedState,l===null)if(a===null)if(e.stateNode===null){e:{a=e.type,l=e.memoizedProps,n=n.ownerDocument||n;t:switch(a){case"title":u=n.getElementsByTagName("title")[0],(!u||u[za]||u[Ve]||u.namespaceURI==="http://www.w3.org/2000/svg"||u.hasAttribute("itemprop"))&&(u=n.createElement(a),n.head.insertBefore(u,n.querySelector("head > title"))),Qe(u,a,l),u[Ve]=e,He(u),a=u;break e;case"link":var i=Zo("link","href",n).get(a+(l.href||""));if(i){for(var c=0;c<i.length;c++)if(u=i[c],u.getAttribute("href")===(l.href==null||l.href===""?null:l.href)&&u.getAttribute("rel")===(l.rel==null?null:l.rel)&&u.getAttribute("title")===(l.title==null?null:l.title)&&u.getAttribute("crossorigin")===(l.crossOrigin==null?null:l.crossOrigin)){i.splice(c,1);break t}}u=n.createElement(a),Qe(u,a,l),n.head.appendChild(u);break;case"meta":if(i=Zo("meta","content",n).get(a+(l.content||""))){for(c=0;c<i.length;c++)if(u=i[c],u.getAttribute("content")===(l.content==null?null:""+l.content)&&u.getAttribute("name")===(l.name==null?null:l.name)&&u.getAttribute("property")===(l.property==null?null:l.property)&&u.getAttribute("http-equiv")===(l.httpEquiv==null?null:l.httpEquiv)&&u.getAttribute("charset")===(l.charSet==null?null:l.charSet)){i.splice(c,1);break t}}u=n.createElement(a),Qe(u,a,l),n.head.appendChild(u);break;default:throw Error(r(468,a))}u[Ve]=e,He(u),a=u}e.stateNode=a}else Ko(n,e.type,e.stateNode);else e.stateNode=Vo(n,a,e.memoizedProps);else u!==a?(u===null?l.stateNode!==null&&(l=l.stateNode,l.parentNode.removeChild(l)):u.count--,a===null?Ko(n,e.type,e.stateNode):Vo(n,a,e.memoizedProps)):a===null&&e.stateNode!==null&&oc(e,e.memoizedProps,l.memoizedProps)}break;case 27:it(t,e),ct(e),a&512&&(Ne||l===null||Nt(l,l.return)),l!==null&&a&4&&oc(e,e.memoizedProps,l.memoizedProps);break;case 5:if(it(t,e),ct(e),a&512&&(Ne||l===null||Nt(l,l.return)),e.flags&32){n=e.stateNode;try{Ll(n,"")}catch(T){me(e,e.return,T)}}a&4&&e.stateNode!=null&&(n=e.memoizedProps,oc(e,n,l!==null?l.memoizedProps:n)),a&1024&&(hc=!0);break;case 6:if(it(t,e),ct(e),a&4){if(e.stateNode===null)throw Error(r(162));a=e.memoizedProps,l=e.stateNode;try{l.nodeValue=a}catch(T){me(e,e.return,T)}}break;case 3:if(Nu=null,n=Tt,Tt=Au(t.containerInfo),it(t,e),Tt=n,ct(e),a&4&&l!==null&&l.memoizedState.isDehydrated)try{bn(t.containerInfo)}catch(T){me(e,e.return,T)}hc&&(hc=!1,Fr(e));break;case 4:a=Tt,Tt=Au(e.stateNode.containerInfo),it(t,e),ct(e),Tt=a;break;case 12:it(t,e),ct(e);break;case 13:it(t,e),ct(e),e.child.flags&8192&&e.memoizedState!==null!=(l!==null&&l.memoizedState!==null)&&(Sc=zt()),a&4&&(a=e.updateQueue,a!==null&&(e.updateQueue=null,mc(e,a)));break;case 22:n=e.memoizedState!==null;var f=l!==null&&l.memoizedState!==null,b=Lt,z=Ne;if(Lt=b||n,Ne=z||f,it(t,e),Ne=z,Lt=b,ct(e),a&8192)e:for(t=e.stateNode,t._visibility=n?t._visibility&-2:t._visibility|1,n&&(l===null||f||Lt||Ne||Ul(e)),l=null,t=e;;){if(t.tag===5||t.tag===26){if(l===null){f=l=t;try{if(u=f.stateNode,n)i=u.style,typeof i.setProperty=="function"?i.setProperty("display","none","important"):i.display="none";else{c=f.stateNode;var j=f.memoizedProps.style,x=j!=null&&j.hasOwnProperty("display")?j.display:null;c.style.display=x==null||typeof x=="boolean"?"":(""+x).trim()}}catch(T){me(f,f.return,T)}}}else if(t.tag===6){if(l===null){f=t;try{f.stateNode.nodeValue=n?"":f.memoizedProps}catch(T){me(f,f.return,T)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;l===t&&(l=null),t=t.return}l===t&&(l=null),t.sibling.return=t.return,t=t.sibling}a&4&&(a=e.updateQueue,a!==null&&(l=a.retryQueue,l!==null&&(a.retryQueue=null,mc(e,l))));break;case 19:it(t,e),ct(e),a&4&&(a=e.updateQueue,a!==null&&(e.updateQueue=null,mc(e,a)));break;case 30:break;case 21:break;default:it(t,e),ct(e)}}function ct(e){var t=e.flags;if(t&2){try{for(var l,a=e.return;a!==null;){if(Qr(a)){l=a;break}a=a.return}if(l==null)throw Error(r(160));switch(l.tag){case 27:var n=l.stateNode,u=dc(e);du(e,u,n);break;case 5:var i=l.stateNode;l.flags&32&&(Ll(i,""),l.flags&=-33);var c=dc(e);du(e,c,i);break;case 3:case 4:var f=l.stateNode.containerInfo,b=dc(e);gc(e,b,f);break;default:throw Error(r(161))}}catch(z){me(e,e.return,z)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Fr(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Fr(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function al(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)Kr(e,t.alternate,t),t=t.sibling}function Ul(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:ll(4,t,t.return),Ul(t);break;case 1:Nt(t,t.return);var l=t.stateNode;typeof l.componentWillUnmount=="function"&&Lr(t,t.return,l),Ul(t);break;case 27:rn(t.stateNode);case 26:case 5:Nt(t,t.return),Ul(t);break;case 22:t.memoizedState===null&&Ul(t);break;case 30:Ul(t);break;default:Ul(t)}e=e.sibling}}function nl(e,t,l){for(l=l&&(t.subtreeFlags&8772)!==0,t=t.child;t!==null;){var a=t.alternate,n=e,u=t,i=u.flags;switch(u.tag){case 0:case 11:case 15:nl(n,u,l),Ia(4,u);break;case 1:if(nl(n,u,l),a=u,n=a.stateNode,typeof n.componentDidMount=="function")try{n.componentDidMount()}catch(b){me(a,a.return,b)}if(a=u,n=a.updateQueue,n!==null){var c=a.stateNode;try{var f=n.shared.hiddenCallbacks;if(f!==null)for(n.shared.hiddenCallbacks=null,n=0;n<f.length;n++)jf(f[n],c)}catch(b){me(a,a.return,b)}}l&&i&64&&Gr(u),en(u,u.return);break;case 27:Vr(u);case 26:case 5:nl(n,u,l),l&&a===null&&i&4&&Xr(u),en(u,u.return);break;case 12:nl(n,u,l);break;case 13:nl(n,u,l),l&&i&4&&$r(n,u);break;case 22:u.memoizedState===null&&nl(n,u,l),en(u,u.return);break;case 30:break;default:nl(n,u,l)}t=t.sibling}}function pc(e,t){var l=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(l=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==l&&(e!=null&&e.refCount++,l!=null&&qa(l))}function vc(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&qa(e))}function Ot(e,t,l,a){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)Pr(e,t,l,a),t=t.sibling}function Pr(e,t,l,a){var n=t.flags;switch(t.tag){case 0:case 11:case 15:Ot(e,t,l,a),n&2048&&Ia(9,t);break;case 1:Ot(e,t,l,a);break;case 3:Ot(e,t,l,a),n&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&qa(e)));break;case 12:if(n&2048){Ot(e,t,l,a),e=t.stateNode;try{var u=t.memoizedProps,i=u.id,c=u.onPostCommit;typeof c=="function"&&c(i,t.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(f){me(t,t.return,f)}}else Ot(e,t,l,a);break;case 13:Ot(e,t,l,a);break;case 23:break;case 22:u=t.stateNode,i=t.alternate,t.memoizedState!==null?u._visibility&2?Ot(e,t,l,a):tn(e,t):u._visibility&2?Ot(e,t,l,a):(u._visibility|=2,ia(e,t,l,a,(t.subtreeFlags&10256)!==0)),n&2048&&pc(i,t);break;case 24:Ot(e,t,l,a),n&2048&&vc(t.alternate,t);break;default:Ot(e,t,l,a)}}function ia(e,t,l,a,n){for(n=n&&(t.subtreeFlags&10256)!==0,t=t.child;t!==null;){var u=e,i=t,c=l,f=a,b=i.flags;switch(i.tag){case 0:case 11:case 15:ia(u,i,c,f,n),Ia(8,i);break;case 23:break;case 22:var z=i.stateNode;i.memoizedState!==null?z._visibility&2?ia(u,i,c,f,n):tn(u,i):(z._visibility|=2,ia(u,i,c,f,n)),n&&b&2048&&pc(i.alternate,i);break;case 24:ia(u,i,c,f,n),n&&b&2048&&vc(i.alternate,i);break;default:ia(u,i,c,f,n)}t=t.sibling}}function tn(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var l=e,a=t,n=a.flags;switch(a.tag){case 22:tn(l,a),n&2048&&pc(a.alternate,a);break;case 24:tn(l,a),n&2048&&vc(a.alternate,a);break;default:tn(l,a)}t=t.sibling}}var ln=8192;function ca(e){if(e.subtreeFlags&ln)for(e=e.child;e!==null;)Ir(e),e=e.sibling}function Ir(e){switch(e.tag){case 26:ca(e),e.flags&ln&&e.memoizedState!==null&&Cg(Tt,e.memoizedState,e.memoizedProps);break;case 5:ca(e);break;case 3:case 4:var t=Tt;Tt=Au(e.stateNode.containerInfo),ca(e),Tt=t;break;case 22:e.memoizedState===null&&(t=e.alternate,t!==null&&t.memoizedState!==null?(t=ln,ln=16777216,ca(e),ln=t):ca(e));break;default:ca(e)}}function eo(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function an(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var l=0;l<t.length;l++){var a=t[l];Ye=a,lo(a,e)}eo(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)to(e),e=e.sibling}function to(e){switch(e.tag){case 0:case 11:case 15:an(e),e.flags&2048&&ll(9,e,e.return);break;case 3:an(e);break;case 12:an(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,gu(e)):an(e);break;default:an(e)}}function gu(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var l=0;l<t.length;l++){var a=t[l];Ye=a,lo(a,e)}eo(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:ll(8,t,t.return),gu(t);break;case 22:l=t.stateNode,l._visibility&2&&(l._visibility&=-3,gu(t));break;default:gu(t)}e=e.sibling}}function lo(e,t){for(;Ye!==null;){var l=Ye;switch(l.tag){case 0:case 11:case 15:ll(8,l,t);break;case 23:case 22:if(l.memoizedState!==null&&l.memoizedState.cachePool!==null){var a=l.memoizedState.cachePool.pool;a!=null&&a.refCount++}break;case 24:qa(l.memoizedState.cache)}if(a=l.child,a!==null)a.return=l,Ye=a;else e:for(l=e;Ye!==null;){a=Ye;var n=a.sibling,u=a.return;if(kr(a),a===l){Ye=null;break e}if(n!==null){n.return=u,Ye=n;break e}Ye=u}}}var P0={getCacheForType:function(e){var t=Ze(Re),l=t.data.get(e);return l===void 0&&(l=e(),t.data.set(e,l)),l}},I0=typeof WeakMap=="function"?WeakMap:Map,ce=0,pe=null,P=null,te=0,se=0,st=null,ul=!1,sa=!1,bc=!1,Qt=0,ze=0,il=0,Ml=0,yc=0,yt=0,fa=0,nn=null,Ie=null,xc=!1,Sc=0,hu=1/0,mu=null,cl=null,Xe=0,sl=null,ra=null,oa=0,Tc=0,Ec=null,ao=null,un=0,zc=null;function ft(){if((ce&2)!==0&&te!==0)return te&-te;if(h.T!==null){var e=Pl;return e!==0?e:Uc()}return bs()}function no(){yt===0&&(yt=(te&536870912)===0||ue?hs():536870912);var e=bt.current;return e!==null&&(e.flags|=32),yt}function rt(e,t,l){(e===pe&&(se===2||se===9)||e.cancelPendingCommit!==null)&&(da(e,0),fl(e,te,yt,!1)),Ea(e,l),((ce&2)===0||e!==pe)&&(e===pe&&((ce&2)===0&&(Ml|=l),ze===4&&fl(e,te,yt,!1)),Dt(e))}function uo(e,t,l){if((ce&6)!==0)throw Error(r(327));var a=!l&&(t&124)===0&&(t&e.expiredLanes)===0||Ta(e,t),n=a?lg(e,t):Nc(e,t,!0),u=a;do{if(n===0){sa&&!a&&fl(e,t,0,!1);break}else{if(l=e.current.alternate,u&&!eg(l)){n=Nc(e,t,!1),u=!1;continue}if(n===2){if(u=t,e.errorRecoveryDisabledLanes&u)var i=0;else i=e.pendingLanes&-536870913,i=i!==0?i:i&536870912?536870912:0;if(i!==0){t=i;e:{var c=e;n=nn;var f=c.current.memoizedState.isDehydrated;if(f&&(da(c,i).flags|=256),i=Nc(c,i,!1),i!==2){if(bc&&!f){c.errorRecoveryDisabledLanes|=u,Ml|=u,n=4;break e}u=Ie,Ie=n,u!==null&&(Ie===null?Ie=u:Ie.push.apply(Ie,u))}n=i}if(u=!1,n!==2)continue}}if(n===1){da(e,0),fl(e,t,0,!0);break}e:{switch(a=e,u=n,u){case 0:case 1:throw Error(r(345));case 4:if((t&4194048)!==t)break;case 6:fl(a,t,yt,!ul);break e;case 2:Ie=null;break;case 3:case 5:break;default:throw Error(r(329))}if((t&62914560)===t&&(n=Sc+300-zt(),10<n)){if(fl(a,t,yt,!ul),jn(a,0,!0)!==0)break e;a.timeoutHandle=Ho(io.bind(null,a,l,Ie,mu,xc,t,yt,Ml,fa,ul,u,2,-0,0),n);break e}io(a,l,Ie,mu,xc,t,yt,Ml,fa,ul,u,0,-0,0)}}break}while(!0);Dt(e)}function io(e,t,l,a,n,u,i,c,f,b,z,j,x,T){if(e.timeoutHandle=-1,j=t.subtreeFlags,(j&8192||(j&16785408)===16785408)&&(gn={stylesheets:null,count:0,unsuspend:Hg},Ir(t),j=Yg(),j!==null)){e.cancelPendingCommit=j(ho.bind(null,e,t,u,l,a,n,i,c,f,z,1,x,T)),fl(e,u,i,!b);return}ho(e,t,u,l,a,n,i,c,f)}function eg(e){for(var t=e;;){var l=t.tag;if((l===0||l===11||l===15)&&t.flags&16384&&(l=t.updateQueue,l!==null&&(l=l.stores,l!==null)))for(var a=0;a<l.length;a++){var n=l[a],u=n.getSnapshot;n=n.value;try{if(!nt(u(),n))return!1}catch{return!1}}if(l=t.child,t.subtreeFlags&16384&&l!==null)l.return=t,t=l;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function fl(e,t,l,a){t&=~yc,t&=~Ml,e.suspendedLanes|=t,e.pingedLanes&=~t,a&&(e.warmLanes|=t),a=e.expirationTimes;for(var n=t;0<n;){var u=31-at(n),i=1<<u;a[u]=-1,n&=~i}l!==0&&ps(e,l,t)}function pu(){return(ce&6)===0?(cn(0),!1):!0}function Ac(){if(P!==null){if(se===0)var e=P.return;else e=P,Ht=jl=null,Xi(e),na=null,Wa=0,e=P;for(;e!==null;)qr(e.alternate,e),e=e.return;P=null}}function da(e,t){var l=e.timeoutHandle;l!==-1&&(e.timeoutHandle=-1,bg(l)),l=e.cancelPendingCommit,l!==null&&(e.cancelPendingCommit=null,l()),Ac(),pe=e,P=l=Mt(e.current,null),te=t,se=0,st=null,ul=!1,sa=Ta(e,t),bc=!1,fa=yt=yc=Ml=il=ze=0,Ie=nn=null,xc=!1,(t&8)!==0&&(t|=t&32);var a=e.entangledLanes;if(a!==0)for(e=e.entanglements,a&=t;0<a;){var n=31-at(a),u=1<<n;t|=e[n],a&=~u}return Qt=t,Bn(),l}function co(e,t){$=null,h.H=au,t===La||t===kn?(t=zf(),se=3):t===Sf?(t=zf(),se=4):se=t===Ar?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,st=t,P===null&&(ze=1,su(e,ht(t,e.current)))}function so(){var e=h.H;return h.H=au,e===null?au:e}function fo(){var e=h.A;return h.A=P0,e}function jc(){ze=4,ul||(te&4194048)!==te&&bt.current!==null||(sa=!0),(il&134217727)===0&&(Ml&134217727)===0||pe===null||fl(pe,te,yt,!1)}function Nc(e,t,l){var a=ce;ce|=2;var n=so(),u=fo();(pe!==e||te!==t)&&(mu=null,da(e,t)),t=!1;var i=ze;e:do try{if(se!==0&&P!==null){var c=P,f=st;switch(se){case 8:Ac(),i=6;break e;case 3:case 2:case 9:case 6:bt.current===null&&(t=!0);var b=se;if(se=0,st=null,ga(e,c,f,b),l&&sa){i=0;break e}break;default:b=se,se=0,st=null,ga(e,c,f,b)}}tg(),i=ze;break}catch(z){co(e,z)}while(!0);return t&&e.shellSuspendCounter++,Ht=jl=null,ce=a,h.H=n,h.A=u,P===null&&(pe=null,te=0,Bn()),i}function tg(){for(;P!==null;)ro(P)}function lg(e,t){var l=ce;ce|=2;var a=so(),n=fo();pe!==e||te!==t?(mu=null,hu=zt()+500,da(e,t)):sa=Ta(e,t);e:do try{if(se!==0&&P!==null){t=P;var u=st;t:switch(se){case 1:se=0,st=null,ga(e,t,u,1);break;case 2:case 9:if(Tf(u)){se=0,st=null,oo(t);break}t=function(){se!==2&&se!==9||pe!==e||(se=7),Dt(e)},u.then(t,t);break e;case 3:se=7;break e;case 4:se=5;break e;case 7:Tf(u)?(se=0,st=null,oo(t)):(se=0,st=null,ga(e,t,u,7));break;case 5:var i=null;switch(P.tag){case 26:i=P.memoizedState;case 5:case 27:var c=P;if(!i||ko(i)){se=0,st=null;var f=c.sibling;if(f!==null)P=f;else{var b=c.return;b!==null?(P=b,vu(b)):P=null}break t}}se=0,st=null,ga(e,t,u,5);break;case 6:se=0,st=null,ga(e,t,u,6);break;case 8:Ac(),ze=6;break e;default:throw Error(r(462))}}ag();break}catch(z){co(e,z)}while(!0);return Ht=jl=null,h.H=a,h.A=n,ce=l,P!==null?0:(pe=null,te=0,Bn(),ze)}function ag(){for(;P!==null&&!Ad();)ro(P)}function ro(e){var t=Yr(e.alternate,e,Qt);e.memoizedProps=e.pendingProps,t===null?vu(e):P=t}function oo(e){var t=e,l=t.alternate;switch(t.tag){case 15:case 0:t=Ur(l,t,t.pendingProps,t.type,void 0,te);break;case 11:t=Ur(l,t,t.pendingProps,t.type.render,t.ref,te);break;case 5:Xi(t);default:qr(l,t),t=P=df(t,Qt),t=Yr(l,t,Qt)}e.memoizedProps=e.pendingProps,t===null?vu(e):P=t}function ga(e,t,l,a){Ht=jl=null,Xi(t),na=null,Wa=0;var n=t.return;try{if(K0(e,n,t,l,te)){ze=1,su(e,ht(l,e.current)),P=null;return}}catch(u){if(n!==null)throw P=n,u;ze=1,su(e,ht(l,e.current)),P=null;return}t.flags&32768?(ue||a===1?e=!0:sa||(te&536870912)!==0?e=!1:(ul=e=!0,(a===2||a===9||a===3||a===6)&&(a=bt.current,a!==null&&a.tag===13&&(a.flags|=16384))),go(t,e)):vu(t)}function vu(e){var t=e;do{if((t.flags&32768)!==0){go(t,ul);return}e=t.return;var l=J0(t.alternate,t,Qt);if(l!==null){P=l;return}if(t=t.sibling,t!==null){P=t;return}P=t=e}while(t!==null);ze===0&&(ze=5)}function go(e,t){do{var l=$0(e.alternate,e);if(l!==null){l.flags&=32767,P=l;return}if(l=e.return,l!==null&&(l.flags|=32768,l.subtreeFlags=0,l.deletions=null),!t&&(e=e.sibling,e!==null)){P=e;return}P=e=l}while(e!==null);ze=6,P=null}function ho(e,t,l,a,n,u,i,c,f){e.cancelPendingCommit=null;do bu();while(Xe!==0);if((ce&6)!==0)throw Error(r(327));if(t!==null){if(t===e.current)throw Error(r(177));if(u=t.lanes|t.childLanes,u|=vi,Hd(e,l,u,i,c,f),e===pe&&(P=pe=null,te=0),ra=t,sl=e,oa=l,Tc=u,Ec=n,ao=a,(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?(e.callbackNode=null,e.callbackPriority=0,cg(En,function(){return yo(),null})):(e.callbackNode=null,e.callbackPriority=0),a=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||a){a=h.T,h.T=null,n=_.p,_.p=2,i=ce,ce|=4;try{W0(e,t,l)}finally{ce=i,_.p=n,h.T=a}}Xe=1,mo(),po(),vo()}}function mo(){if(Xe===1){Xe=0;var e=sl,t=ra,l=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||l){l=h.T,h.T=null;var a=_.p;_.p=2;var n=ce;ce|=4;try{Wr(t,e);var u=qc,i=tf(e.containerInfo),c=u.focusedElem,f=u.selectionRange;if(i!==c&&c&&c.ownerDocument&&ef(c.ownerDocument.documentElement,c)){if(f!==null&&di(c)){var b=f.start,z=f.end;if(z===void 0&&(z=b),"selectionStart"in c)c.selectionStart=b,c.selectionEnd=Math.min(z,c.value.length);else{var j=c.ownerDocument||document,x=j&&j.defaultView||window;if(x.getSelection){var T=x.getSelection(),V=c.textContent.length,X=Math.min(f.start,V),de=f.end===void 0?X:Math.min(f.end,V);!T.extend&&X>de&&(i=de,de=X,X=i);var m=Is(c,X),d=Is(c,de);if(m&&d&&(T.rangeCount!==1||T.anchorNode!==m.node||T.anchorOffset!==m.offset||T.focusNode!==d.node||T.focusOffset!==d.offset)){var v=j.createRange();v.setStart(m.node,m.offset),T.removeAllRanges(),X>de?(T.addRange(v),T.extend(d.node,d.offset)):(v.setEnd(d.node,d.offset),T.addRange(v))}}}}for(j=[],T=c;T=T.parentNode;)T.nodeType===1&&j.push({element:T,left:T.scrollLeft,top:T.scrollTop});for(typeof c.focus=="function"&&c.focus(),c=0;c<j.length;c++){var A=j[c];A.element.scrollLeft=A.left,A.element.scrollTop=A.top}}_u=!!Bc,qc=Bc=null}finally{ce=n,_.p=a,h.T=l}}e.current=t,Xe=2}}function po(){if(Xe===2){Xe=0;var e=sl,t=ra,l=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||l){l=h.T,h.T=null;var a=_.p;_.p=2;var n=ce;ce|=4;try{Kr(e,t.alternate,t)}finally{ce=n,_.p=a,h.T=l}}Xe=3}}function vo(){if(Xe===4||Xe===3){Xe=0,jd();var e=sl,t=ra,l=oa,a=ao;(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?Xe=5:(Xe=0,ra=sl=null,bo(e,e.pendingLanes));var n=e.pendingLanes;if(n===0&&(cl=null),Zu(l),t=t.stateNode,lt&&typeof lt.onCommitFiberRoot=="function")try{lt.onCommitFiberRoot(Sa,t,void 0,(t.current.flags&128)===128)}catch{}if(a!==null){t=h.T,n=_.p,_.p=2,h.T=null;try{for(var u=e.onRecoverableError,i=0;i<a.length;i++){var c=a[i];u(c.value,{componentStack:c.stack})}}finally{h.T=t,_.p=n}}(oa&3)!==0&&bu(),Dt(e),n=e.pendingLanes,(l&4194090)!==0&&(n&42)!==0?e===zc?un++:(un=0,zc=e):un=0,cn(0)}}function bo(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,qa(t)))}function bu(e){return mo(),po(),vo(),yo()}function yo(){if(Xe!==5)return!1;var e=sl,t=Tc;Tc=0;var l=Zu(oa),a=h.T,n=_.p;try{_.p=32>l?32:l,h.T=null,l=Ec,Ec=null;var u=sl,i=oa;if(Xe=0,ra=sl=null,oa=0,(ce&6)!==0)throw Error(r(331));var c=ce;if(ce|=4,to(u.current),Pr(u,u.current,i,l),ce=c,cn(0,!1),lt&&typeof lt.onPostCommitFiberRoot=="function")try{lt.onPostCommitFiberRoot(Sa,u)}catch{}return!0}finally{_.p=n,h.T=a,bo(e,t)}}function xo(e,t,l){t=ht(l,t),t=lc(e.stateNode,t,2),e=Pt(e,t,2),e!==null&&(Ea(e,2),Dt(e))}function me(e,t,l){if(e.tag===3)xo(e,e,l);else for(;t!==null;){if(t.tag===3){xo(t,e,l);break}else if(t.tag===1){var a=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof a.componentDidCatch=="function"&&(cl===null||!cl.has(a))){e=ht(l,e),l=Er(2),a=Pt(t,l,2),a!==null&&(zr(l,a,t,e),Ea(a,2),Dt(a));break}}t=t.return}}function Oc(e,t,l){var a=e.pingCache;if(a===null){a=e.pingCache=new I0;var n=new Set;a.set(t,n)}else n=a.get(t),n===void 0&&(n=new Set,a.set(t,n));n.has(l)||(bc=!0,n.add(l),e=ng.bind(null,e,t,l),t.then(e,e))}function ng(e,t,l){var a=e.pingCache;a!==null&&a.delete(t),e.pingedLanes|=e.suspendedLanes&l,e.warmLanes&=~l,pe===e&&(te&l)===l&&(ze===4||ze===3&&(te&62914560)===te&&300>zt()-Sc?(ce&2)===0&&da(e,0):yc|=l,fa===te&&(fa=0)),Dt(e)}function So(e,t){t===0&&(t=ms()),e=Jl(e,t),e!==null&&(Ea(e,t),Dt(e))}function ug(e){var t=e.memoizedState,l=0;t!==null&&(l=t.retryLane),So(e,l)}function ig(e,t){var l=0;switch(e.tag){case 13:var a=e.stateNode,n=e.memoizedState;n!==null&&(l=n.retryLane);break;case 19:a=e.stateNode;break;case 22:a=e.stateNode._retryCache;break;default:throw Error(r(314))}a!==null&&a.delete(t),So(e,l)}function cg(e,t){return Lu(e,t)}var yu=null,ha=null,Dc=!1,xu=!1,_c=!1,Rl=0;function Dt(e){e!==ha&&e.next===null&&(ha===null?yu=ha=e:ha=ha.next=e),xu=!0,Dc||(Dc=!0,fg())}function cn(e,t){if(!_c&&xu){_c=!0;do for(var l=!1,a=yu;a!==null;){if(e!==0){var n=a.pendingLanes;if(n===0)var u=0;else{var i=a.suspendedLanes,c=a.pingedLanes;u=(1<<31-at(42|e)+1)-1,u&=n&~(i&~c),u=u&201326741?u&201326741|1:u?u|2:0}u!==0&&(l=!0,Ao(a,u))}else u=te,u=jn(a,a===pe?u:0,a.cancelPendingCommit!==null||a.timeoutHandle!==-1),(u&3)===0||Ta(a,u)||(l=!0,Ao(a,u));a=a.next}while(l);_c=!1}}function sg(){To()}function To(){xu=Dc=!1;var e=0;Rl!==0&&(vg()&&(e=Rl),Rl=0);for(var t=zt(),l=null,a=yu;a!==null;){var n=a.next,u=Eo(a,t);u===0?(a.next=null,l===null?yu=n:l.next=n,n===null&&(ha=l)):(l=a,(e!==0||(u&3)!==0)&&(xu=!0)),a=n}cn(e)}function Eo(e,t){for(var l=e.suspendedLanes,a=e.pingedLanes,n=e.expirationTimes,u=e.pendingLanes&-62914561;0<u;){var i=31-at(u),c=1<<i,f=n[i];f===-1?((c&l)===0||(c&a)!==0)&&(n[i]=wd(c,t)):f<=t&&(e.expiredLanes|=c),u&=~c}if(t=pe,l=te,l=jn(e,e===t?l:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),a=e.callbackNode,l===0||e===t&&(se===2||se===9)||e.cancelPendingCommit!==null)return a!==null&&a!==null&&Xu(a),e.callbackNode=null,e.callbackPriority=0;if((l&3)===0||Ta(e,l)){if(t=l&-l,t===e.callbackPriority)return t;switch(a!==null&&Xu(a),Zu(l)){case 2:case 8:l=ds;break;case 32:l=En;break;case 268435456:l=gs;break;default:l=En}return a=zo.bind(null,e),l=Lu(l,a),e.callbackPriority=t,e.callbackNode=l,t}return a!==null&&a!==null&&Xu(a),e.callbackPriority=2,e.callbackNode=null,2}function zo(e,t){if(Xe!==0&&Xe!==5)return e.callbackNode=null,e.callbackPriority=0,null;var l=e.callbackNode;if(bu()&&e.callbackNode!==l)return null;var a=te;return a=jn(e,e===pe?a:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),a===0?null:(uo(e,a,t),Eo(e,zt()),e.callbackNode!=null&&e.callbackNode===l?zo.bind(null,e):null)}function Ao(e,t){if(bu())return null;uo(e,t,!0)}function fg(){yg(function(){(ce&6)!==0?Lu(os,sg):To()})}function Uc(){return Rl===0&&(Rl=hs()),Rl}function jo(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:Un(""+e)}function No(e,t){var l=t.ownerDocument.createElement("input");return l.name=t.name,l.value=t.value,e.id&&l.setAttribute("form",e.id),t.parentNode.insertBefore(l,t),e=new FormData(e),l.parentNode.removeChild(l),e}function rg(e,t,l,a,n){if(t==="submit"&&l&&l.stateNode===n){var u=jo((n[$e]||null).action),i=a.submitter;i&&(t=(t=i[$e]||null)?jo(t.formAction):i.getAttribute("formAction"),t!==null&&(u=t,i=null));var c=new Hn("action","action",null,a,n);e.push({event:c,listeners:[{instance:null,listener:function(){if(a.defaultPrevented){if(Rl!==0){var f=i?No(n,i):new FormData(n);Fi(l,{pending:!0,data:f,method:n.method,action:u},null,f)}}else typeof u=="function"&&(c.preventDefault(),f=i?No(n,i):new FormData(n),Fi(l,{pending:!0,data:f,method:n.method,action:u},u,f))},currentTarget:n}]})}}for(var Mc=0;Mc<pi.length;Mc++){var Rc=pi[Mc],og=Rc.toLowerCase(),dg=Rc[0].toUpperCase()+Rc.slice(1);St(og,"on"+dg)}St(nf,"onAnimationEnd"),St(uf,"onAnimationIteration"),St(cf,"onAnimationStart"),St("dblclick","onDoubleClick"),St("focusin","onFocus"),St("focusout","onBlur"),St(D0,"onTransitionRun"),St(_0,"onTransitionStart"),St(U0,"onTransitionCancel"),St(sf,"onTransitionEnd"),Bl("onMouseEnter",["mouseout","mouseover"]),Bl("onMouseLeave",["mouseout","mouseover"]),Bl("onPointerEnter",["pointerout","pointerover"]),Bl("onPointerLeave",["pointerout","pointerover"]),vl("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),vl("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),vl("onBeforeInput",["compositionend","keypress","textInput","paste"]),vl("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),vl("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),vl("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var sn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),gg=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(sn));function Oo(e,t){t=(t&4)!==0;for(var l=0;l<e.length;l++){var a=e[l],n=a.event;a=a.listeners;e:{var u=void 0;if(t)for(var i=a.length-1;0<=i;i--){var c=a[i],f=c.instance,b=c.currentTarget;if(c=c.listener,f!==u&&n.isPropagationStopped())break e;u=c,n.currentTarget=b;try{u(n)}catch(z){cu(z)}n.currentTarget=null,u=f}else for(i=0;i<a.length;i++){if(c=a[i],f=c.instance,b=c.currentTarget,c=c.listener,f!==u&&n.isPropagationStopped())break e;u=c,n.currentTarget=b;try{u(n)}catch(z){cu(z)}n.currentTarget=null,u=f}}}}function I(e,t){var l=t[Ku];l===void 0&&(l=t[Ku]=new Set);var a=e+"__bubble";l.has(a)||(Do(t,e,2,!1),l.add(a))}function wc(e,t,l){var a=0;t&&(a|=4),Do(l,e,a,t)}var Su="_reactListening"+Math.random().toString(36).slice(2);function Hc(e){if(!e[Su]){e[Su]=!0,xs.forEach(function(l){l!=="selectionchange"&&(gg.has(l)||wc(l,!1,e),wc(l,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Su]||(t[Su]=!0,wc("selectionchange",!1,t))}}function Do(e,t,l,a){switch(Io(t)){case 2:var n=Gg;break;case 8:n=Lg;break;default:n=$c}l=n.bind(null,t,l,e),n=void 0,!ai||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(n=!0),a?n!==void 0?e.addEventListener(t,l,{capture:!0,passive:n}):e.addEventListener(t,l,!0):n!==void 0?e.addEventListener(t,l,{passive:n}):e.addEventListener(t,l,!1)}function Cc(e,t,l,a,n){var u=a;if((t&1)===0&&(t&2)===0&&a!==null)e:for(;;){if(a===null)return;var i=a.tag;if(i===3||i===4){var c=a.stateNode.containerInfo;if(c===n)break;if(i===4)for(i=a.return;i!==null;){var f=i.tag;if((f===3||f===4)&&i.stateNode.containerInfo===n)return;i=i.return}for(;c!==null;){if(i=Hl(c),i===null)return;if(f=i.tag,f===5||f===6||f===26||f===27){a=u=i;continue e}c=c.parentNode}}a=a.return}ws(function(){var b=u,z=ti(l),j=[];e:{var x=ff.get(e);if(x!==void 0){var T=Hn,V=e;switch(e){case"keypress":if(Rn(l)===0)break e;case"keydown":case"keyup":T=c0;break;case"focusin":V="focus",T=ci;break;case"focusout":V="blur",T=ci;break;case"beforeblur":case"afterblur":T=ci;break;case"click":if(l.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":T=Ys;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":T=$d;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":T=r0;break;case nf:case uf:case cf:T=Pd;break;case sf:T=d0;break;case"scroll":case"scrollend":T=kd;break;case"wheel":T=h0;break;case"copy":case"cut":case"paste":T=e0;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":T=qs;break;case"toggle":case"beforetoggle":T=p0}var X=(t&4)!==0,de=!X&&(e==="scroll"||e==="scrollend"),m=X?x!==null?x+"Capture":null:x;X=[];for(var d=b,v;d!==null;){var A=d;if(v=A.stateNode,A=A.tag,A!==5&&A!==26&&A!==27||v===null||m===null||(A=ja(d,m),A!=null&&X.push(fn(d,A,v))),de)break;d=d.return}0<X.length&&(x=new T(x,V,null,l,z),j.push({event:x,listeners:X}))}}if((t&7)===0){e:{if(x=e==="mouseover"||e==="pointerover",T=e==="mouseout"||e==="pointerout",x&&l!==ei&&(V=l.relatedTarget||l.fromElement)&&(Hl(V)||V[wl]))break e;if((T||x)&&(x=z.window===z?z:(x=z.ownerDocument)?x.defaultView||x.parentWindow:window,T?(V=l.relatedTarget||l.toElement,T=b,V=V?Hl(V):null,V!==null&&(de=O(V),X=V.tag,V!==de||X!==5&&X!==27&&X!==6)&&(V=null)):(T=null,V=b),T!==V)){if(X=Ys,A="onMouseLeave",m="onMouseEnter",d="mouse",(e==="pointerout"||e==="pointerover")&&(X=qs,A="onPointerLeave",m="onPointerEnter",d="pointer"),de=T==null?x:Aa(T),v=V==null?x:Aa(V),x=new X(A,d+"leave",T,l,z),x.target=de,x.relatedTarget=v,A=null,Hl(z)===b&&(X=new X(m,d+"enter",V,l,z),X.target=v,X.relatedTarget=de,A=X),de=A,T&&V)t:{for(X=T,m=V,d=0,v=X;v;v=ma(v))d++;for(v=0,A=m;A;A=ma(A))v++;for(;0<d-v;)X=ma(X),d--;for(;0<v-d;)m=ma(m),v--;for(;d--;){if(X===m||m!==null&&X===m.alternate)break t;X=ma(X),m=ma(m)}X=null}else X=null;T!==null&&_o(j,x,T,X,!1),V!==null&&de!==null&&_o(j,de,V,X,!0)}}e:{if(x=b?Aa(b):window,T=x.nodeName&&x.nodeName.toLowerCase(),T==="select"||T==="input"&&x.type==="file")var q=ks;else if(Zs(x))if(Js)q=j0;else{q=z0;var F=E0}else T=x.nodeName,!T||T.toLowerCase()!=="input"||x.type!=="checkbox"&&x.type!=="radio"?b&&Iu(b.elementType)&&(q=ks):q=A0;if(q&&(q=q(e,b))){Ks(j,q,l,z);break e}F&&F(e,x,b),e==="focusout"&&b&&x.type==="number"&&b.memoizedProps.value!=null&&Pu(x,"number",x.value)}switch(F=b?Aa(b):window,e){case"focusin":(Zs(F)||F.contentEditable==="true")&&(Zl=F,gi=b,wa=null);break;case"focusout":wa=gi=Zl=null;break;case"mousedown":hi=!0;break;case"contextmenu":case"mouseup":case"dragend":hi=!1,lf(j,l,z);break;case"selectionchange":if(O0)break;case"keydown":case"keyup":lf(j,l,z)}var G;if(fi)e:{switch(e){case"compositionstart":var Q="onCompositionStart";break e;case"compositionend":Q="onCompositionEnd";break e;case"compositionupdate":Q="onCompositionUpdate";break e}Q=void 0}else Vl?Qs(e,l)&&(Q="onCompositionEnd"):e==="keydown"&&l.keyCode===229&&(Q="onCompositionStart");Q&&(Gs&&l.locale!=="ko"&&(Vl||Q!=="onCompositionStart"?Q==="onCompositionEnd"&&Vl&&(G=Hs()):(Jt=z,ni="value"in Jt?Jt.value:Jt.textContent,Vl=!0)),F=Tu(b,Q),0<F.length&&(Q=new Bs(Q,e,null,l,z),j.push({event:Q,listeners:F}),G?Q.data=G:(G=Vs(l),G!==null&&(Q.data=G)))),(G=b0?y0(e,l):x0(e,l))&&(Q=Tu(b,"onBeforeInput"),0<Q.length&&(F=new Bs("onBeforeInput","beforeinput",null,l,z),j.push({event:F,listeners:Q}),F.data=G)),rg(j,e,b,l,z)}Oo(j,t)})}function fn(e,t,l){return{instance:e,listener:t,currentTarget:l}}function Tu(e,t){for(var l=t+"Capture",a=[];e!==null;){var n=e,u=n.stateNode;if(n=n.tag,n!==5&&n!==26&&n!==27||u===null||(n=ja(e,l),n!=null&&a.unshift(fn(e,n,u)),n=ja(e,t),n!=null&&a.push(fn(e,n,u))),e.tag===3)return a;e=e.return}return[]}function ma(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function _o(e,t,l,a,n){for(var u=t._reactName,i=[];l!==null&&l!==a;){var c=l,f=c.alternate,b=c.stateNode;if(c=c.tag,f!==null&&f===a)break;c!==5&&c!==26&&c!==27||b===null||(f=b,n?(b=ja(l,u),b!=null&&i.unshift(fn(l,b,f))):n||(b=ja(l,u),b!=null&&i.push(fn(l,b,f)))),l=l.return}i.length!==0&&e.push({event:t,listeners:i})}var hg=/\r\n?/g,mg=/\u0000|\uFFFD/g;function Uo(e){return(typeof e=="string"?e:""+e).replace(hg,`
`).replace(mg,"")}function Mo(e,t){return t=Uo(t),Uo(e)===t}function Eu(){}function oe(e,t,l,a,n,u){switch(l){case"children":typeof a=="string"?t==="body"||t==="textarea"&&a===""||Ll(e,a):(typeof a=="number"||typeof a=="bigint")&&t!=="body"&&Ll(e,""+a);break;case"className":On(e,"class",a);break;case"tabIndex":On(e,"tabindex",a);break;case"dir":case"role":case"viewBox":case"width":case"height":On(e,l,a);break;case"style":Ms(e,a,u);break;case"data":if(t!=="object"){On(e,"data",a);break}case"src":case"href":if(a===""&&(t!=="a"||l!=="href")){e.removeAttribute(l);break}if(a==null||typeof a=="function"||typeof a=="symbol"||typeof a=="boolean"){e.removeAttribute(l);break}a=Un(""+a),e.setAttribute(l,a);break;case"action":case"formAction":if(typeof a=="function"){e.setAttribute(l,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof u=="function"&&(l==="formAction"?(t!=="input"&&oe(e,t,"name",n.name,n,null),oe(e,t,"formEncType",n.formEncType,n,null),oe(e,t,"formMethod",n.formMethod,n,null),oe(e,t,"formTarget",n.formTarget,n,null)):(oe(e,t,"encType",n.encType,n,null),oe(e,t,"method",n.method,n,null),oe(e,t,"target",n.target,n,null)));if(a==null||typeof a=="symbol"||typeof a=="boolean"){e.removeAttribute(l);break}a=Un(""+a),e.setAttribute(l,a);break;case"onClick":a!=null&&(e.onclick=Eu);break;case"onScroll":a!=null&&I("scroll",e);break;case"onScrollEnd":a!=null&&I("scrollend",e);break;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(r(61));if(l=a.__html,l!=null){if(n.children!=null)throw Error(r(60));e.innerHTML=l}}break;case"multiple":e.multiple=a&&typeof a!="function"&&typeof a!="symbol";break;case"muted":e.muted=a&&typeof a!="function"&&typeof a!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(a==null||typeof a=="function"||typeof a=="boolean"||typeof a=="symbol"){e.removeAttribute("xlink:href");break}l=Un(""+a),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",l);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":a!=null&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(l,""+a):e.removeAttribute(l);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":a&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(l,""):e.removeAttribute(l);break;case"capture":case"download":a===!0?e.setAttribute(l,""):a!==!1&&a!=null&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(l,a):e.removeAttribute(l);break;case"cols":case"rows":case"size":case"span":a!=null&&typeof a!="function"&&typeof a!="symbol"&&!isNaN(a)&&1<=a?e.setAttribute(l,a):e.removeAttribute(l);break;case"rowSpan":case"start":a==null||typeof a=="function"||typeof a=="symbol"||isNaN(a)?e.removeAttribute(l):e.setAttribute(l,a);break;case"popover":I("beforetoggle",e),I("toggle",e),Nn(e,"popover",a);break;case"xlinkActuate":_t(e,"http://www.w3.org/1999/xlink","xlink:actuate",a);break;case"xlinkArcrole":_t(e,"http://www.w3.org/1999/xlink","xlink:arcrole",a);break;case"xlinkRole":_t(e,"http://www.w3.org/1999/xlink","xlink:role",a);break;case"xlinkShow":_t(e,"http://www.w3.org/1999/xlink","xlink:show",a);break;case"xlinkTitle":_t(e,"http://www.w3.org/1999/xlink","xlink:title",a);break;case"xlinkType":_t(e,"http://www.w3.org/1999/xlink","xlink:type",a);break;case"xmlBase":_t(e,"http://www.w3.org/XML/1998/namespace","xml:base",a);break;case"xmlLang":_t(e,"http://www.w3.org/XML/1998/namespace","xml:lang",a);break;case"xmlSpace":_t(e,"http://www.w3.org/XML/1998/namespace","xml:space",a);break;case"is":Nn(e,"is",a);break;case"innerText":case"textContent":break;default:(!(2<l.length)||l[0]!=="o"&&l[0]!=="O"||l[1]!=="n"&&l[1]!=="N")&&(l=Zd.get(l)||l,Nn(e,l,a))}}function Yc(e,t,l,a,n,u){switch(l){case"style":Ms(e,a,u);break;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(r(61));if(l=a.__html,l!=null){if(n.children!=null)throw Error(r(60));e.innerHTML=l}}break;case"children":typeof a=="string"?Ll(e,a):(typeof a=="number"||typeof a=="bigint")&&Ll(e,""+a);break;case"onScroll":a!=null&&I("scroll",e);break;case"onScrollEnd":a!=null&&I("scrollend",e);break;case"onClick":a!=null&&(e.onclick=Eu);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!Ss.hasOwnProperty(l))e:{if(l[0]==="o"&&l[1]==="n"&&(n=l.endsWith("Capture"),t=l.slice(2,n?l.length-7:void 0),u=e[$e]||null,u=u!=null?u[l]:null,typeof u=="function"&&e.removeEventListener(t,u,n),typeof a=="function")){typeof u!="function"&&u!==null&&(l in e?e[l]=null:e.hasAttribute(l)&&e.removeAttribute(l)),e.addEventListener(t,a,n);break e}l in e?e[l]=a:a===!0?e.setAttribute(l,""):Nn(e,l,a)}}}function Qe(e,t,l){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":I("error",e),I("load",e);var a=!1,n=!1,u;for(u in l)if(l.hasOwnProperty(u)){var i=l[u];if(i!=null)switch(u){case"src":a=!0;break;case"srcSet":n=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(r(137,t));default:oe(e,t,u,i,l,null)}}n&&oe(e,t,"srcSet",l.srcSet,l,null),a&&oe(e,t,"src",l.src,l,null);return;case"input":I("invalid",e);var c=u=i=n=null,f=null,b=null;for(a in l)if(l.hasOwnProperty(a)){var z=l[a];if(z!=null)switch(a){case"name":n=z;break;case"type":i=z;break;case"checked":f=z;break;case"defaultChecked":b=z;break;case"value":u=z;break;case"defaultValue":c=z;break;case"children":case"dangerouslySetInnerHTML":if(z!=null)throw Error(r(137,t));break;default:oe(e,t,a,z,l,null)}}Os(e,u,c,f,b,i,n,!1),Dn(e);return;case"select":I("invalid",e),a=i=u=null;for(n in l)if(l.hasOwnProperty(n)&&(c=l[n],c!=null))switch(n){case"value":u=c;break;case"defaultValue":i=c;break;case"multiple":a=c;default:oe(e,t,n,c,l,null)}t=u,l=i,e.multiple=!!a,t!=null?Gl(e,!!a,t,!1):l!=null&&Gl(e,!!a,l,!0);return;case"textarea":I("invalid",e),u=n=a=null;for(i in l)if(l.hasOwnProperty(i)&&(c=l[i],c!=null))switch(i){case"value":a=c;break;case"defaultValue":n=c;break;case"children":u=c;break;case"dangerouslySetInnerHTML":if(c!=null)throw Error(r(91));break;default:oe(e,t,i,c,l,null)}_s(e,a,n,u),Dn(e);return;case"option":for(f in l)if(l.hasOwnProperty(f)&&(a=l[f],a!=null))switch(f){case"selected":e.selected=a&&typeof a!="function"&&typeof a!="symbol";break;default:oe(e,t,f,a,l,null)}return;case"dialog":I("beforetoggle",e),I("toggle",e),I("cancel",e),I("close",e);break;case"iframe":case"object":I("load",e);break;case"video":case"audio":for(a=0;a<sn.length;a++)I(sn[a],e);break;case"image":I("error",e),I("load",e);break;case"details":I("toggle",e);break;case"embed":case"source":case"link":I("error",e),I("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(b in l)if(l.hasOwnProperty(b)&&(a=l[b],a!=null))switch(b){case"children":case"dangerouslySetInnerHTML":throw Error(r(137,t));default:oe(e,t,b,a,l,null)}return;default:if(Iu(t)){for(z in l)l.hasOwnProperty(z)&&(a=l[z],a!==void 0&&Yc(e,t,z,a,l,void 0));return}}for(c in l)l.hasOwnProperty(c)&&(a=l[c],a!=null&&oe(e,t,c,a,l,null))}function pg(e,t,l,a){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var n=null,u=null,i=null,c=null,f=null,b=null,z=null;for(T in l){var j=l[T];if(l.hasOwnProperty(T)&&j!=null)switch(T){case"checked":break;case"value":break;case"defaultValue":f=j;default:a.hasOwnProperty(T)||oe(e,t,T,null,a,j)}}for(var x in a){var T=a[x];if(j=l[x],a.hasOwnProperty(x)&&(T!=null||j!=null))switch(x){case"type":u=T;break;case"name":n=T;break;case"checked":b=T;break;case"defaultChecked":z=T;break;case"value":i=T;break;case"defaultValue":c=T;break;case"children":case"dangerouslySetInnerHTML":if(T!=null)throw Error(r(137,t));break;default:T!==j&&oe(e,t,x,T,a,j)}}Fu(e,i,c,f,b,z,u,n);return;case"select":T=i=c=x=null;for(u in l)if(f=l[u],l.hasOwnProperty(u)&&f!=null)switch(u){case"value":break;case"multiple":T=f;default:a.hasOwnProperty(u)||oe(e,t,u,null,a,f)}for(n in a)if(u=a[n],f=l[n],a.hasOwnProperty(n)&&(u!=null||f!=null))switch(n){case"value":x=u;break;case"defaultValue":c=u;break;case"multiple":i=u;default:u!==f&&oe(e,t,n,u,a,f)}t=c,l=i,a=T,x!=null?Gl(e,!!l,x,!1):!!a!=!!l&&(t!=null?Gl(e,!!l,t,!0):Gl(e,!!l,l?[]:"",!1));return;case"textarea":T=x=null;for(c in l)if(n=l[c],l.hasOwnProperty(c)&&n!=null&&!a.hasOwnProperty(c))switch(c){case"value":break;case"children":break;default:oe(e,t,c,null,a,n)}for(i in a)if(n=a[i],u=l[i],a.hasOwnProperty(i)&&(n!=null||u!=null))switch(i){case"value":x=n;break;case"defaultValue":T=n;break;case"children":break;case"dangerouslySetInnerHTML":if(n!=null)throw Error(r(91));break;default:n!==u&&oe(e,t,i,n,a,u)}Ds(e,x,T);return;case"option":for(var V in l)if(x=l[V],l.hasOwnProperty(V)&&x!=null&&!a.hasOwnProperty(V))switch(V){case"selected":e.selected=!1;break;default:oe(e,t,V,null,a,x)}for(f in a)if(x=a[f],T=l[f],a.hasOwnProperty(f)&&x!==T&&(x!=null||T!=null))switch(f){case"selected":e.selected=x&&typeof x!="function"&&typeof x!="symbol";break;default:oe(e,t,f,x,a,T)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var X in l)x=l[X],l.hasOwnProperty(X)&&x!=null&&!a.hasOwnProperty(X)&&oe(e,t,X,null,a,x);for(b in a)if(x=a[b],T=l[b],a.hasOwnProperty(b)&&x!==T&&(x!=null||T!=null))switch(b){case"children":case"dangerouslySetInnerHTML":if(x!=null)throw Error(r(137,t));break;default:oe(e,t,b,x,a,T)}return;default:if(Iu(t)){for(var de in l)x=l[de],l.hasOwnProperty(de)&&x!==void 0&&!a.hasOwnProperty(de)&&Yc(e,t,de,void 0,a,x);for(z in a)x=a[z],T=l[z],!a.hasOwnProperty(z)||x===T||x===void 0&&T===void 0||Yc(e,t,z,x,a,T);return}}for(var m in l)x=l[m],l.hasOwnProperty(m)&&x!=null&&!a.hasOwnProperty(m)&&oe(e,t,m,null,a,x);for(j in a)x=a[j],T=l[j],!a.hasOwnProperty(j)||x===T||x==null&&T==null||oe(e,t,j,x,a,T)}var Bc=null,qc=null;function zu(e){return e.nodeType===9?e:e.ownerDocument}function Ro(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function wo(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function Gc(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Lc=null;function vg(){var e=window.event;return e&&e.type==="popstate"?e===Lc?!1:(Lc=e,!0):(Lc=null,!1)}var Ho=typeof setTimeout=="function"?setTimeout:void 0,bg=typeof clearTimeout=="function"?clearTimeout:void 0,Co=typeof Promise=="function"?Promise:void 0,yg=typeof queueMicrotask=="function"?queueMicrotask:typeof Co<"u"?function(e){return Co.resolve(null).then(e).catch(xg)}:Ho;function xg(e){setTimeout(function(){throw e})}function rl(e){return e==="head"}function Yo(e,t){var l=t,a=0,n=0;do{var u=l.nextSibling;if(e.removeChild(l),u&&u.nodeType===8)if(l=u.data,l==="/$"){if(0<a&&8>a){l=a;var i=e.ownerDocument;if(l&1&&rn(i.documentElement),l&2&&rn(i.body),l&4)for(l=i.head,rn(l),i=l.firstChild;i;){var c=i.nextSibling,f=i.nodeName;i[za]||f==="SCRIPT"||f==="STYLE"||f==="LINK"&&i.rel.toLowerCase()==="stylesheet"||l.removeChild(i),i=c}}if(n===0){e.removeChild(u),bn(t);return}n--}else l==="$"||l==="$?"||l==="$!"?n++:a=l.charCodeAt(0)-48;else a=0;l=u}while(l);bn(t)}function Xc(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var l=t;switch(t=t.nextSibling,l.nodeName){case"HTML":case"HEAD":case"BODY":Xc(l),ku(l);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(l.rel.toLowerCase()==="stylesheet")continue}e.removeChild(l)}}function Sg(e,t,l,a){for(;e.nodeType===1;){var n=l;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!a&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(a){if(!e[za])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(u=e.getAttribute("rel"),u==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(u!==n.rel||e.getAttribute("href")!==(n.href==null||n.href===""?null:n.href)||e.getAttribute("crossorigin")!==(n.crossOrigin==null?null:n.crossOrigin)||e.getAttribute("title")!==(n.title==null?null:n.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(u=e.getAttribute("src"),(u!==(n.src==null?null:n.src)||e.getAttribute("type")!==(n.type==null?null:n.type)||e.getAttribute("crossorigin")!==(n.crossOrigin==null?null:n.crossOrigin))&&u&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var u=n.name==null?null:""+n.name;if(n.type==="hidden"&&e.getAttribute("name")===u)return e}else return e;if(e=Et(e.nextSibling),e===null)break}return null}function Tg(e,t,l){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!l||(e=Et(e.nextSibling),e===null))return null;return e}function Qc(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState==="complete"}function Eg(e,t){var l=e.ownerDocument;if(e.data!=="$?"||l.readyState==="complete")t();else{var a=function(){t(),l.removeEventListener("DOMContentLoaded",a)};l.addEventListener("DOMContentLoaded",a),e._reactRetry=a}}function Et(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="F!"||t==="F")break;if(t==="/$")return null}}return e}var Vc=null;function Bo(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var l=e.data;if(l==="$"||l==="$!"||l==="$?"){if(t===0)return e;t--}else l==="/$"&&t++}e=e.previousSibling}return null}function qo(e,t,l){switch(t=zu(l),e){case"html":if(e=t.documentElement,!e)throw Error(r(452));return e;case"head":if(e=t.head,!e)throw Error(r(453));return e;case"body":if(e=t.body,!e)throw Error(r(454));return e;default:throw Error(r(451))}}function rn(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);ku(e)}var xt=new Map,Go=new Set;function Au(e){return typeof e.getRootNode=="function"?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var Vt=_.d;_.d={f:zg,r:Ag,D:jg,C:Ng,L:Og,m:Dg,X:Ug,S:_g,M:Mg};function zg(){var e=Vt.f(),t=pu();return e||t}function Ag(e){var t=Cl(e);t!==null&&t.tag===5&&t.type==="form"?ur(t):Vt.r(e)}var pa=typeof document>"u"?null:document;function Lo(e,t,l){var a=pa;if(a&&typeof t=="string"&&t){var n=gt(t);n='link[rel="'+e+'"][href="'+n+'"]',typeof l=="string"&&(n+='[crossorigin="'+l+'"]'),Go.has(n)||(Go.add(n),e={rel:e,crossOrigin:l,href:t},a.querySelector(n)===null&&(t=a.createElement("link"),Qe(t,"link",e),He(t),a.head.appendChild(t)))}}function jg(e){Vt.D(e),Lo("dns-prefetch",e,null)}function Ng(e,t){Vt.C(e,t),Lo("preconnect",e,t)}function Og(e,t,l){Vt.L(e,t,l);var a=pa;if(a&&e&&t){var n='link[rel="preload"][as="'+gt(t)+'"]';t==="image"&&l&&l.imageSrcSet?(n+='[imagesrcset="'+gt(l.imageSrcSet)+'"]',typeof l.imageSizes=="string"&&(n+='[imagesizes="'+gt(l.imageSizes)+'"]')):n+='[href="'+gt(e)+'"]';var u=n;switch(t){case"style":u=va(e);break;case"script":u=ba(e)}xt.has(u)||(e=w({rel:"preload",href:t==="image"&&l&&l.imageSrcSet?void 0:e,as:t},l),xt.set(u,e),a.querySelector(n)!==null||t==="style"&&a.querySelector(on(u))||t==="script"&&a.querySelector(dn(u))||(t=a.createElement("link"),Qe(t,"link",e),He(t),a.head.appendChild(t)))}}function Dg(e,t){Vt.m(e,t);var l=pa;if(l&&e){var a=t&&typeof t.as=="string"?t.as:"script",n='link[rel="modulepreload"][as="'+gt(a)+'"][href="'+gt(e)+'"]',u=n;switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":u=ba(e)}if(!xt.has(u)&&(e=w({rel:"modulepreload",href:e},t),xt.set(u,e),l.querySelector(n)===null)){switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(l.querySelector(dn(u)))return}a=l.createElement("link"),Qe(a,"link",e),He(a),l.head.appendChild(a)}}}function _g(e,t,l){Vt.S(e,t,l);var a=pa;if(a&&e){var n=Yl(a).hoistableStyles,u=va(e);t=t||"default";var i=n.get(u);if(!i){var c={loading:0,preload:null};if(i=a.querySelector(on(u)))c.loading=5;else{e=w({rel:"stylesheet",href:e,"data-precedence":t},l),(l=xt.get(u))&&Zc(e,l);var f=i=a.createElement("link");He(f),Qe(f,"link",e),f._p=new Promise(function(b,z){f.onload=b,f.onerror=z}),f.addEventListener("load",function(){c.loading|=1}),f.addEventListener("error",function(){c.loading|=2}),c.loading|=4,ju(i,t,a)}i={type:"stylesheet",instance:i,count:1,state:c},n.set(u,i)}}}function Ug(e,t){Vt.X(e,t);var l=pa;if(l&&e){var a=Yl(l).hoistableScripts,n=ba(e),u=a.get(n);u||(u=l.querySelector(dn(n)),u||(e=w({src:e,async:!0},t),(t=xt.get(n))&&Kc(e,t),u=l.createElement("script"),He(u),Qe(u,"link",e),l.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},a.set(n,u))}}function Mg(e,t){Vt.M(e,t);var l=pa;if(l&&e){var a=Yl(l).hoistableScripts,n=ba(e),u=a.get(n);u||(u=l.querySelector(dn(n)),u||(e=w({src:e,async:!0,type:"module"},t),(t=xt.get(n))&&Kc(e,t),u=l.createElement("script"),He(u),Qe(u,"link",e),l.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},a.set(n,u))}}function Xo(e,t,l,a){var n=(n=Z.current)?Au(n):null;if(!n)throw Error(r(446));switch(e){case"meta":case"title":return null;case"style":return typeof l.precedence=="string"&&typeof l.href=="string"?(t=va(l.href),l=Yl(n).hoistableStyles,a=l.get(t),a||(a={type:"style",instance:null,count:0,state:null},l.set(t,a)),a):{type:"void",instance:null,count:0,state:null};case"link":if(l.rel==="stylesheet"&&typeof l.href=="string"&&typeof l.precedence=="string"){e=va(l.href);var u=Yl(n).hoistableStyles,i=u.get(e);if(i||(n=n.ownerDocument||n,i={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},u.set(e,i),(u=n.querySelector(on(e)))&&!u._p&&(i.instance=u,i.state.loading=5),xt.has(e)||(l={rel:"preload",as:"style",href:l.href,crossOrigin:l.crossOrigin,integrity:l.integrity,media:l.media,hrefLang:l.hrefLang,referrerPolicy:l.referrerPolicy},xt.set(e,l),u||Rg(n,e,l,i.state))),t&&a===null)throw Error(r(528,""));return i}if(t&&a!==null)throw Error(r(529,""));return null;case"script":return t=l.async,l=l.src,typeof l=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(t=ba(l),l=Yl(n).hoistableScripts,a=l.get(t),a||(a={type:"script",instance:null,count:0,state:null},l.set(t,a)),a):{type:"void",instance:null,count:0,state:null};default:throw Error(r(444,e))}}function va(e){return'href="'+gt(e)+'"'}function on(e){return'link[rel="stylesheet"]['+e+"]"}function Qo(e){return w({},e,{"data-precedence":e.precedence,precedence:null})}function Rg(e,t,l,a){e.querySelector('link[rel="preload"][as="style"]['+t+"]")?a.loading=1:(t=e.createElement("link"),a.preload=t,t.addEventListener("load",function(){return a.loading|=1}),t.addEventListener("error",function(){return a.loading|=2}),Qe(t,"link",l),He(t),e.head.appendChild(t))}function ba(e){return'[src="'+gt(e)+'"]'}function dn(e){return"script[async]"+e}function Vo(e,t,l){if(t.count++,t.instance===null)switch(t.type){case"style":var a=e.querySelector('style[data-href~="'+gt(l.href)+'"]');if(a)return t.instance=a,He(a),a;var n=w({},l,{"data-href":l.href,"data-precedence":l.precedence,href:null,precedence:null});return a=(e.ownerDocument||e).createElement("style"),He(a),Qe(a,"style",n),ju(a,l.precedence,e),t.instance=a;case"stylesheet":n=va(l.href);var u=e.querySelector(on(n));if(u)return t.state.loading|=4,t.instance=u,He(u),u;a=Qo(l),(n=xt.get(n))&&Zc(a,n),u=(e.ownerDocument||e).createElement("link"),He(u);var i=u;return i._p=new Promise(function(c,f){i.onload=c,i.onerror=f}),Qe(u,"link",a),t.state.loading|=4,ju(u,l.precedence,e),t.instance=u;case"script":return u=ba(l.src),(n=e.querySelector(dn(u)))?(t.instance=n,He(n),n):(a=l,(n=xt.get(u))&&(a=w({},l),Kc(a,n)),e=e.ownerDocument||e,n=e.createElement("script"),He(n),Qe(n,"link",a),e.head.appendChild(n),t.instance=n);case"void":return null;default:throw Error(r(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(a=t.instance,t.state.loading|=4,ju(a,l.precedence,e));return t.instance}function ju(e,t,l){for(var a=l.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),n=a.length?a[a.length-1]:null,u=n,i=0;i<a.length;i++){var c=a[i];if(c.dataset.precedence===t)u=c;else if(u!==n)break}u?u.parentNode.insertBefore(e,u.nextSibling):(t=l.nodeType===9?l.head:l,t.insertBefore(e,t.firstChild))}function Zc(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function Kc(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var Nu=null;function Zo(e,t,l){if(Nu===null){var a=new Map,n=Nu=new Map;n.set(l,a)}else n=Nu,a=n.get(l),a||(a=new Map,n.set(l,a));if(a.has(e))return a;for(a.set(e,null),l=l.getElementsByTagName(e),n=0;n<l.length;n++){var u=l[n];if(!(u[za]||u[Ve]||e==="link"&&u.getAttribute("rel")==="stylesheet")&&u.namespaceURI!=="http://www.w3.org/2000/svg"){var i=u.getAttribute(t)||"";i=e+i;var c=a.get(i);c?c.push(u):a.set(i,[u])}}return a}function Ko(e,t,l){e=e.ownerDocument||e,e.head.insertBefore(l,t==="title"?e.querySelector("head > title"):null)}function wg(e,t,l){if(l===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function ko(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}var gn=null;function Hg(){}function Cg(e,t,l){if(gn===null)throw Error(r(475));var a=gn;if(t.type==="stylesheet"&&(typeof l.media!="string"||matchMedia(l.media).matches!==!1)&&(t.state.loading&4)===0){if(t.instance===null){var n=va(l.href),u=e.querySelector(on(n));if(u){e=u._p,e!==null&&typeof e=="object"&&typeof e.then=="function"&&(a.count++,a=Ou.bind(a),e.then(a,a)),t.state.loading|=4,t.instance=u,He(u);return}u=e.ownerDocument||e,l=Qo(l),(n=xt.get(n))&&Zc(l,n),u=u.createElement("link"),He(u);var i=u;i._p=new Promise(function(c,f){i.onload=c,i.onerror=f}),Qe(u,"link",l),t.instance=u}a.stylesheets===null&&(a.stylesheets=new Map),a.stylesheets.set(t,e),(e=t.state.preload)&&(t.state.loading&3)===0&&(a.count++,t=Ou.bind(a),e.addEventListener("load",t),e.addEventListener("error",t))}}function Yg(){if(gn===null)throw Error(r(475));var e=gn;return e.stylesheets&&e.count===0&&kc(e,e.stylesheets),0<e.count?function(t){var l=setTimeout(function(){if(e.stylesheets&&kc(e,e.stylesheets),e.unsuspend){var a=e.unsuspend;e.unsuspend=null,a()}},6e4);return e.unsuspend=t,function(){e.unsuspend=null,clearTimeout(l)}}:null}function Ou(){if(this.count--,this.count===0){if(this.stylesheets)kc(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var Du=null;function kc(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Du=new Map,t.forEach(Bg,e),Du=null,Ou.call(e))}function Bg(e,t){if(!(t.state.loading&4)){var l=Du.get(e);if(l)var a=l.get(null);else{l=new Map,Du.set(e,l);for(var n=e.querySelectorAll("link[data-precedence],style[data-precedence]"),u=0;u<n.length;u++){var i=n[u];(i.nodeName==="LINK"||i.getAttribute("media")!=="not all")&&(l.set(i.dataset.precedence,i),a=i)}a&&l.set(null,a)}n=t.instance,i=n.getAttribute("data-precedence"),u=l.get(i)||a,u===a&&l.set(null,n),l.set(i,n),this.count++,a=Ou.bind(this),n.addEventListener("load",a),n.addEventListener("error",a),u?u.parentNode.insertBefore(n,u.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(n,e.firstChild)),t.state.loading|=4}}var hn={$$typeof:be,Provider:null,Consumer:null,_currentValue:B,_currentValue2:B,_threadCount:0};function qg(e,t,l,a,n,u,i,c){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=Qu(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Qu(0),this.hiddenUpdates=Qu(null),this.identifierPrefix=a,this.onUncaughtError=n,this.onCaughtError=u,this.onRecoverableError=i,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=c,this.incompleteTransitions=new Map}function Jo(e,t,l,a,n,u,i,c,f,b,z,j){return e=new qg(e,t,l,i,c,f,b,j),t=1,u===!0&&(t|=24),u=ut(3,null,null,t),e.current=u,u.stateNode=e,t=Oi(),t.refCount++,e.pooledCache=t,t.refCount++,u.memoizedState={element:a,isDehydrated:l,cache:t},Mi(u),e}function $o(e){return e?(e=$l,e):$l}function Wo(e,t,l,a,n,u){n=$o(n),a.context===null?a.context=n:a.pendingContext=n,a=Ft(t),a.payload={element:l},u=u===void 0?null:u,u!==null&&(a.callback=u),l=Pt(e,a,t),l!==null&&(rt(l,e,t),Qa(l,e,t))}function Fo(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var l=e.retryLane;e.retryLane=l!==0&&l<t?l:t}}function Jc(e,t){Fo(e,t),(e=e.alternate)&&Fo(e,t)}function Po(e){if(e.tag===13){var t=Jl(e,67108864);t!==null&&rt(t,e,67108864),Jc(e,67108864)}}var _u=!0;function Gg(e,t,l,a){var n=h.T;h.T=null;var u=_.p;try{_.p=2,$c(e,t,l,a)}finally{_.p=u,h.T=n}}function Lg(e,t,l,a){var n=h.T;h.T=null;var u=_.p;try{_.p=8,$c(e,t,l,a)}finally{_.p=u,h.T=n}}function $c(e,t,l,a){if(_u){var n=Wc(a);if(n===null)Cc(e,t,a,Uu,l),ed(e,a);else if(Qg(n,e,t,l,a))a.stopPropagation();else if(ed(e,a),t&4&&-1<Xg.indexOf(e)){for(;n!==null;){var u=Cl(n);if(u!==null)switch(u.tag){case 3:if(u=u.stateNode,u.current.memoizedState.isDehydrated){var i=pl(u.pendingLanes);if(i!==0){var c=u;for(c.pendingLanes|=2,c.entangledLanes|=2;i;){var f=1<<31-at(i);c.entanglements[1]|=f,i&=~f}Dt(u),(ce&6)===0&&(hu=zt()+500,cn(0))}}break;case 13:c=Jl(u,2),c!==null&&rt(c,u,2),pu(),Jc(u,2)}if(u=Wc(a),u===null&&Cc(e,t,a,Uu,l),u===n)break;n=u}n!==null&&a.stopPropagation()}else Cc(e,t,a,null,l)}}function Wc(e){return e=ti(e),Fc(e)}var Uu=null;function Fc(e){if(Uu=null,e=Hl(e),e!==null){var t=O(e);if(t===null)e=null;else{var l=t.tag;if(l===13){if(e=C(t),e!==null)return e;e=null}else if(l===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return Uu=e,null}function Io(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Nd()){case os:return 2;case ds:return 8;case En:case Od:return 32;case gs:return 268435456;default:return 32}default:return 32}}var Pc=!1,ol=null,dl=null,gl=null,mn=new Map,pn=new Map,hl=[],Xg="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function ed(e,t){switch(e){case"focusin":case"focusout":ol=null;break;case"dragenter":case"dragleave":dl=null;break;case"mouseover":case"mouseout":gl=null;break;case"pointerover":case"pointerout":mn.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":pn.delete(t.pointerId)}}function vn(e,t,l,a,n,u){return e===null||e.nativeEvent!==u?(e={blockedOn:t,domEventName:l,eventSystemFlags:a,nativeEvent:u,targetContainers:[n]},t!==null&&(t=Cl(t),t!==null&&Po(t)),e):(e.eventSystemFlags|=a,t=e.targetContainers,n!==null&&t.indexOf(n)===-1&&t.push(n),e)}function Qg(e,t,l,a,n){switch(t){case"focusin":return ol=vn(ol,e,t,l,a,n),!0;case"dragenter":return dl=vn(dl,e,t,l,a,n),!0;case"mouseover":return gl=vn(gl,e,t,l,a,n),!0;case"pointerover":var u=n.pointerId;return mn.set(u,vn(mn.get(u)||null,e,t,l,a,n)),!0;case"gotpointercapture":return u=n.pointerId,pn.set(u,vn(pn.get(u)||null,e,t,l,a,n)),!0}return!1}function td(e){var t=Hl(e.target);if(t!==null){var l=O(t);if(l!==null){if(t=l.tag,t===13){if(t=C(l),t!==null){e.blockedOn=t,Cd(e.priority,function(){if(l.tag===13){var a=ft();a=Vu(a);var n=Jl(l,a);n!==null&&rt(n,l,a),Jc(l,a)}});return}}else if(t===3&&l.stateNode.current.memoizedState.isDehydrated){e.blockedOn=l.tag===3?l.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Mu(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var l=Wc(e.nativeEvent);if(l===null){l=e.nativeEvent;var a=new l.constructor(l.type,l);ei=a,l.target.dispatchEvent(a),ei=null}else return t=Cl(l),t!==null&&Po(t),e.blockedOn=l,!1;t.shift()}return!0}function ld(e,t,l){Mu(e)&&l.delete(t)}function Vg(){Pc=!1,ol!==null&&Mu(ol)&&(ol=null),dl!==null&&Mu(dl)&&(dl=null),gl!==null&&Mu(gl)&&(gl=null),mn.forEach(ld),pn.forEach(ld)}function Ru(e,t){e.blockedOn===t&&(e.blockedOn=null,Pc||(Pc=!0,g.unstable_scheduleCallback(g.unstable_NormalPriority,Vg)))}var wu=null;function ad(e){wu!==e&&(wu=e,g.unstable_scheduleCallback(g.unstable_NormalPriority,function(){wu===e&&(wu=null);for(var t=0;t<e.length;t+=3){var l=e[t],a=e[t+1],n=e[t+2];if(typeof a!="function"){if(Fc(a||l)===null)continue;break}var u=Cl(l);u!==null&&(e.splice(t,3),t-=3,Fi(u,{pending:!0,data:n,method:l.method,action:a},a,n))}}))}function bn(e){function t(f){return Ru(f,e)}ol!==null&&Ru(ol,e),dl!==null&&Ru(dl,e),gl!==null&&Ru(gl,e),mn.forEach(t),pn.forEach(t);for(var l=0;l<hl.length;l++){var a=hl[l];a.blockedOn===e&&(a.blockedOn=null)}for(;0<hl.length&&(l=hl[0],l.blockedOn===null);)td(l),l.blockedOn===null&&hl.shift();if(l=(e.ownerDocument||e).$$reactFormReplay,l!=null)for(a=0;a<l.length;a+=3){var n=l[a],u=l[a+1],i=n[$e]||null;if(typeof u=="function")i||ad(l);else if(i){var c=null;if(u&&u.hasAttribute("formAction")){if(n=u,i=u[$e]||null)c=i.formAction;else if(Fc(n)!==null)continue}else c=i.action;typeof c=="function"?l[a+1]=c:(l.splice(a,3),a-=3),ad(l)}}}function Ic(e){this._internalRoot=e}Hu.prototype.render=Ic.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(r(409));var l=t.current,a=ft();Wo(l,a,e,t,null,null)},Hu.prototype.unmount=Ic.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Wo(e.current,2,null,e,null,null),pu(),t[wl]=null}};function Hu(e){this._internalRoot=e}Hu.prototype.unstable_scheduleHydration=function(e){if(e){var t=bs();e={blockedOn:null,target:e,priority:t};for(var l=0;l<hl.length&&t!==0&&t<hl[l].priority;l++);hl.splice(l,0,e),l===0&&td(e)}};var nd=p.version;if(nd!=="19.1.0")throw Error(r(527,nd,"19.1.0"));_.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(r(188)):(e=Object.keys(e).join(","),Error(r(268,e)));return e=D(t),e=e!==null?y(e):null,e=e===null?null:e.stateNode,e};var Zg={bundleType:0,version:"19.1.0",rendererPackageName:"react-dom",currentDispatcherRef:h,reconcilerVersion:"19.1.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Cu=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Cu.isDisabled&&Cu.supportsFiber)try{Sa=Cu.inject(Zg),lt=Cu}catch{}}return xn.createRoot=function(e,t){if(!E(e))throw Error(r(299));var l=!1,a="",n=yr,u=xr,i=Sr,c=null;return t!=null&&(t.unstable_strictMode===!0&&(l=!0),t.identifierPrefix!==void 0&&(a=t.identifierPrefix),t.onUncaughtError!==void 0&&(n=t.onUncaughtError),t.onCaughtError!==void 0&&(u=t.onCaughtError),t.onRecoverableError!==void 0&&(i=t.onRecoverableError),t.unstable_transitionCallbacks!==void 0&&(c=t.unstable_transitionCallbacks)),t=Jo(e,1,!1,null,null,l,a,n,u,i,c,null),e[wl]=t.current,Hc(e),new Ic(t)},xn.hydrateRoot=function(e,t,l){if(!E(e))throw Error(r(299));var a=!1,n="",u=yr,i=xr,c=Sr,f=null,b=null;return l!=null&&(l.unstable_strictMode===!0&&(a=!0),l.identifierPrefix!==void 0&&(n=l.identifierPrefix),l.onUncaughtError!==void 0&&(u=l.onUncaughtError),l.onCaughtError!==void 0&&(i=l.onCaughtError),l.onRecoverableError!==void 0&&(c=l.onRecoverableError),l.unstable_transitionCallbacks!==void 0&&(f=l.unstable_transitionCallbacks),l.formState!==void 0&&(b=l.formState)),t=Jo(e,1,!0,t,l??null,a,n,u,i,c,f,b),t.context=$o(null),l=t.current,a=ft(),a=Vu(a),n=Ft(a),n.callback=null,Pt(l,n,a),l=a,t.current.lanes=l,Ea(t,l),Dt(t),e[wl]=t.current,Hc(e),new Hu(t)},xn.version="19.1.0",xn}var md;function nh(){if(md)return ls.exports;md=1;function g(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(g)}catch(p){console.error(p)}}return g(),ls.exports=ah(),ls.exports}var uh=nh();const ih=xd(uh);/*! Capacitor: https://capacitorjs.com/ - MIT License */var ya;(function(g){g.Unimplemented="UNIMPLEMENTED",g.Unavailable="UNAVAILABLE"})(ya||(ya={}));class is extends Error{constructor(p,S,r){super(p),this.message=p,this.code=S,this.data=r}}const ch=g=>{var p,S;return g!=null&&g.androidBridge?"android":!((S=(p=g==null?void 0:g.webkit)===null||p===void 0?void 0:p.messageHandlers)===null||S===void 0)&&S.bridge?"ios":"web"},sh=g=>{const p=g.CapacitorCustomPlatform||null,S=g.Capacitor||{},r=S.Plugins=S.Plugins||{},E=()=>p!==null?p.name:ch(g),O=()=>E()!=="web",C=U=>{const M=y.get(U);return!!(M!=null&&M.platforms.has(E())||Y(U))},Y=U=>{var M;return(M=S.PluginHeaders)===null||M===void 0?void 0:M.find(W=>W.name===U)},D=U=>g.console.error(U),y=new Map,w=(U,M={})=>{const W=y.get(U);if(W)return console.warn(`Capacitor plugin "${U}" already registered. Cannot register plugins twice.`),W.proxy;const K=E(),ve=Y(U);let ie;const ot=async()=>(!ie&&K in M?ie=typeof M[K]=="function"?ie=await M[K]():ie=M[K]:p!==null&&!ie&&"web"in M&&(ie=typeof M.web=="function"?ie=await M.web():ie=M.web),ie),et=(le,he)=>{var Me,De;if(ve){const fe=ve==null?void 0:ve.methods.find(Ae=>he===Ae.name);if(fe)return fe.rtype==="promise"?Ae=>S.nativePromise(U,he.toString(),Ae):(Ae,ke)=>S.nativeCallback(U,he.toString(),Ae,ke);if(le)return(Me=le[he])===null||Me===void 0?void 0:Me.bind(le)}else{if(le)return(De=le[he])===null||De===void 0?void 0:De.bind(le);throw new is(`"${U}" plugin is not implemented on ${K}`,ya.Unimplemented)}},be=le=>{let he;const Me=(...De)=>{const fe=ot().then(Ae=>{const ke=et(Ae,le);if(ke){const Se=ke(...De);return he=Se==null?void 0:Se.remove,Se}else throw new is(`"${U}.${le}()" is not implemented on ${K}`,ya.Unimplemented)});return le==="addListener"&&(fe.remove=async()=>he()),fe};return Me.toString=()=>`${le.toString()}() { [capacitor code] }`,Object.defineProperty(Me,"name",{value:le,writable:!1,configurable:!1}),Me},qe=be("addListener"),J=be("removeListener"),Ge=(le,he)=>{const Me=qe({eventName:le},he),De=async()=>{const Ae=await Me;J({eventName:le,callbackId:Ae},he)},fe=new Promise(Ae=>Me.then(()=>Ae({remove:De})));return fe.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await De()},fe},Oe=new Proxy({},{get(le,he){switch(he){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return ve?Ge:qe;case"removeListener":return J;default:return be(he)}}});return r[U]=Oe,y.set(U,{name:U,proxy:Oe,platforms:new Set([...Object.keys(M),...ve?[K]:[]])}),Oe};return S.convertFileSrc||(S.convertFileSrc=U=>U),S.getPlatform=E,S.handleError=D,S.isNativePlatform=O,S.isPluginAvailable=C,S.registerPlugin=w,S.Exception=is,S.DEBUG=!!S.DEBUG,S.isLoggingEnabled=!!S.isLoggingEnabled,S},fh=g=>g.Capacitor=sh(g),xa=fh(typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}),Bu=xa.registerPlugin;class Sd{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(p,S){let r=!1;this.listeners[p]||(this.listeners[p]=[],r=!0),this.listeners[p].push(S);const O=this.windowListeners[p];O&&!O.registered&&this.addWindowListener(O),r&&this.sendRetainedArgumentsForEvent(p);const C=async()=>this.removeListener(p,S);return Promise.resolve({remove:C})}async removeAllListeners(){this.listeners={};for(const p in this.windowListeners)this.removeWindowListener(this.windowListeners[p]);this.windowListeners={}}notifyListeners(p,S,r){const E=this.listeners[p];if(!E){if(r){let O=this.retainedEventArguments[p];O||(O=[]),O.push(S),this.retainedEventArguments[p]=O}return}E.forEach(O=>O(S))}hasListeners(p){var S;return!!(!((S=this.listeners[p])===null||S===void 0)&&S.length)}registerWindowListener(p,S){this.windowListeners[S]={registered:!1,windowEventName:p,pluginEventName:S,handler:r=>{this.notifyListeners(S,r)}}}unimplemented(p="not implemented"){return new xa.Exception(p,ya.Unimplemented)}unavailable(p="not available"){return new xa.Exception(p,ya.Unavailable)}async removeListener(p,S){const r=this.listeners[p];if(!r)return;const E=r.indexOf(S);this.listeners[p].splice(E,1),this.listeners[p].length||this.removeWindowListener(this.windowListeners[p])}addWindowListener(p){window.addEventListener(p.windowEventName,p.handler),p.registered=!0}removeWindowListener(p){p&&(window.removeEventListener(p.windowEventName,p.handler),p.registered=!1)}sendRetainedArgumentsForEvent(p){const S=this.retainedEventArguments[p];S&&(delete this.retainedEventArguments[p],S.forEach(r=>{this.notifyListeners(p,r)}))}}const pd=g=>encodeURIComponent(g).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),vd=g=>g.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class rh extends Sd{async getCookies(){const p=document.cookie,S={};return p.split(";").forEach(r=>{if(r.length<=0)return;let[E,O]=r.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");E=vd(E).trim(),O=vd(O).trim(),S[E]=O}),S}async setCookie(p){try{const S=pd(p.key),r=pd(p.value),E=`; expires=${(p.expires||"").replace("expires=","")}`,O=(p.path||"/").replace("path=",""),C=p.url!=null&&p.url.length>0?`domain=${p.url}`:"";document.cookie=`${S}=${r||""}${E}; path=${O}; ${C};`}catch(S){return Promise.reject(S)}}async deleteCookie(p){try{document.cookie=`${p.key}=; Max-Age=0`}catch(S){return Promise.reject(S)}}async clearCookies(){try{const p=document.cookie.split(";")||[];for(const S of p)document.cookie=S.replace(/^ +/,"").replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(p){return Promise.reject(p)}}async clearAllCookies(){try{await this.clearCookies()}catch(p){return Promise.reject(p)}}}Bu("CapacitorCookies",{web:()=>new rh});const oh=async g=>new Promise((p,S)=>{const r=new FileReader;r.onload=()=>{const E=r.result;p(E.indexOf(",")>=0?E.split(",")[1]:E)},r.onerror=E=>S(E),r.readAsDataURL(g)}),dh=(g={})=>{const p=Object.keys(g);return Object.keys(g).map(E=>E.toLocaleLowerCase()).reduce((E,O,C)=>(E[O]=g[p[C]],E),{})},gh=(g,p=!0)=>g?Object.entries(g).reduce((r,E)=>{const[O,C]=E;let Y,D;return Array.isArray(C)?(D="",C.forEach(y=>{Y=p?encodeURIComponent(y):y,D+=`${O}=${Y}&`}),D.slice(0,-1)):(Y=p?encodeURIComponent(C):C,D=`${O}=${Y}`),`${r}&${D}`},"").substr(1):null,hh=(g,p={})=>{const S=Object.assign({method:g.method||"GET",headers:g.headers},p),E=dh(g.headers)["content-type"]||"";if(typeof g.data=="string")S.body=g.data;else if(E.includes("application/x-www-form-urlencoded")){const O=new URLSearchParams;for(const[C,Y]of Object.entries(g.data||{}))O.set(C,Y);S.body=O.toString()}else if(E.includes("multipart/form-data")||g.data instanceof FormData){const O=new FormData;if(g.data instanceof FormData)g.data.forEach((Y,D)=>{O.append(D,Y)});else for(const Y of Object.keys(g.data))O.append(Y,g.data[Y]);S.body=O;const C=new Headers(S.headers);C.delete("content-type"),S.headers=C}else(E.includes("application/json")||typeof g.data=="object")&&(S.body=JSON.stringify(g.data));return S};class mh extends Sd{async request(p){const S=hh(p,p.webFetchExtra),r=gh(p.params,p.shouldEncodeUrlParams),E=r?`${p.url}?${r}`:p.url,O=await fetch(E,S),C=O.headers.get("content-type")||"";let{responseType:Y="text"}=O.ok?p:{};C.includes("application/json")&&(Y="json");let D,y;switch(Y){case"arraybuffer":case"blob":y=await O.blob(),D=await oh(y);break;case"json":D=await O.json();break;case"document":case"text":default:D=await O.text()}const w={};return O.headers.forEach((U,M)=>{w[M]=U}),{data:D,headers:w,status:O.status,url:O.url}}async get(p){return this.request(Object.assign(Object.assign({},p),{method:"GET"}))}async post(p){return this.request(Object.assign(Object.assign({},p),{method:"POST"}))}async put(p){return this.request(Object.assign(Object.assign({},p),{method:"PUT"}))}async patch(p){return this.request(Object.assign(Object.assign({},p),{method:"PATCH"}))}async delete(p){return this.request(Object.assign(Object.assign({},p),{method:"DELETE"}))}}const rs=Bu("CapacitorHttp",{web:()=>new mh}),Sn="https://www.euscagency.com/etsm3/platforme/transport/apk",ph=async(g,p)=>{try{let S;if(xa.isNativePlatform())if(S=await rs.post({url:`${Sn}/login.php`,headers:{"Content-Type":"application/json"},data:{email:g,password:p}}),S.status===200){const r=S.data;if(r.status==="success"&&r.token)return{status:r.status,token:r.token};throw new Error("Autentificare eșuată")}else throw new Error("Autentificare eșuată");else{const r=await fetch(`${Sn}/login.php`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:g,password:p})});if(!r.ok)throw new Error(`HTTP error! status: ${r.status}`);const E=await r.json();if(E.status==="success"&&E.token)return{status:E.status,token:E.token};throw new Error("Autentificare eșuată")}}catch(S){throw console.error("Login error:",S),new Error("Eroare de conexiune la serverul de autentificare")}},vh=async(g,p)=>{try{const S=await rs.get({url:`${Sn}/vehicul.php?nr=${g}`,headers:{Authorization:`Bearer ${p}`,"Content-Type":"application/json"}});if(S.status===200){const r=S.data;return r.status==="success"&&Array.isArray(r.data)?r.data.map((E,O)=>{var C;return{id:((C=E.ikRoTrans)==null?void 0:C.toString())||`course_${O}`,name:`Transport ${E.codDeclarant} - ${E.ikRoTrans}`,departure_location:`${E.denumireLocStart||E.Vama}, ${E.Judet||""}`.trim().replace(/, $/,""),destination_location:`${E.denumireLocStop||E.VamaStop}, ${E.JudetStop||""}`.trim().replace(/, $/,""),departure_time:E.dataTransport||null,arrival_time:null,description:E.denumireDeclarant||"Transport marfă",status:1,uit:E.UIT,ikRoTrans:E.ikRoTrans,codDeclarant:E.codDeclarant,denumireDeclarant:E.denumireDeclarant,nrVehicul:E.nrVehicul,dataTransport:E.dataTransport,vama:E.Vama,birouVamal:E.BirouVamal,judet:E.Judet,vamaStop:E.VamaStop,birouVamalStop:E.BirouVamalStop,judetStop:E.JudetStop}}):[]}else throw new Error("Eroare la încărcarea curselor")}catch(S){throw console.error("Get vehicle courses error:",S),new Error("Eroare de conexiune la serverul de curse")}},bh=async g=>{try{let p;return xa.isNativePlatform()?p=await rs.post({url:`${Sn}/login.php`,headers:{"Content-Type":"application/json",Authorization:`Bearer ${g}`},data:{iesire:1}}):p=await fetch(`${Sn}/login.php`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g}`},body:JSON.stringify({iesire:1})}),p.status===200}catch(p){return console.error("Logout error:",p),!1}},yh=({onLogin:g})=>{const[p,S]=ge.useState(""),[r,E]=ge.useState(""),[O,C]=ge.useState(!1),[Y,D]=ge.useState(""),[y,w]=ge.useState(!1),U=async M=>{if(M.preventDefault(),!p||!r){D("Te rog să completezi toate câmpurile");return}C(!0),D("");try{if(p==="admin@itrack.app"&&r==="parola123"){console.log("Admin login detected"),g("ADMIN_TOKEN");return}const W=await ph(p,r);W.token?g(W.token):D(W.error||"Date de conectare incorecte")}catch(W){D(W.message||"Eroare la conectare")}finally{C(!1)}};return s.jsxs("div",{className:"login-container",children:[s.jsx("style",{children:`
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
        `}),s.jsxs("div",{className:"login-card",children:[s.jsxs("div",{className:"login-header",children:[s.jsx("div",{className:"transport-logo",children:s.jsx("div",{className:"corporate-emblem",children:s.jsx("div",{className:"emblem-ring",children:s.jsx("div",{className:"emblem-core",children:s.jsx("div",{className:"emblem-center",children:s.jsx("i",{className:"fas fa-truck"})})})})})}),s.jsx("h1",{className:"app-title",children:"iTrack"})]}),s.jsxs("form",{onSubmit:U,className:"login-form",children:[Y&&s.jsxs("div",{className:"error-alert",children:[s.jsx("i",{className:"fas fa-exclamation-triangle error-icon"}),s.jsx("span",{className:"error-text",children:Y})]}),s.jsx("div",{className:"form-group",children:s.jsxs("div",{className:"input-container",children:[s.jsx("input",{type:"email",className:"form-input",value:p,onChange:M=>S(M.target.value),disabled:O,placeholder:"Email",autoComplete:"email"}),s.jsx("i",{className:"fas fa-user input-icon"})]})}),s.jsx("div",{className:"form-group",children:s.jsxs("div",{className:"input-container",children:[s.jsx("input",{type:y?"text":"password",className:"form-input",value:r,onChange:M=>E(M.target.value),disabled:O,placeholder:"Parolă",autoComplete:"current-password"}),s.jsx("i",{className:"fas fa-lock input-icon"}),s.jsx("button",{type:"button",className:"password-toggle",onClick:()=>w(!y),disabled:O,title:y?"Ascunde parola":"Afișează parola",children:s.jsx("i",{className:`fas ${y?"fa-eye-slash":"fa-eye"}`})})]})}),s.jsx("button",{type:"submit",className:"login-button",disabled:O,children:O?s.jsxs(s.Fragment,{children:[s.jsx("div",{className:"loading-spinner"}),s.jsx("span",{children:"Autentificare în curs..."})]}):s.jsxs(s.Fragment,{children:[s.jsx("i",{className:"fas fa-sign-in-alt"}),s.jsx("span",{children:"Autentificare"})]})})]}),s.jsx("div",{className:"login-footer",children:s.jsxs("div",{className:"version-info",children:[s.jsx("i",{className:"fas fa-code-branch"}),s.jsx("span",{children:"Versiunea 1807.99"})]})})]})]})},Yu=Bu("GPSTracking");class xh{constructor(){ud(this,"activeCourses",new Map)}async startTracking(p,S,r,E,O=2){var Y,D;console.log(`Starting GPS tracking for course ${p}, UIT: ${r}`);const C={courseId:p,vehicleNumber:S,uit:r,token:E,status:O};this.activeCourses.set(p,C),console.log("Plugin Diagnostics:"),console.log(`- Capacitor available: ${!!(window!=null&&window.Capacitor)}`),console.log(`- Platform: ${((Y=window==null?void 0:window.Capacitor)==null?void 0:Y.platform)||"unknown"}`),console.log(`- Available plugins: ${Object.keys(((D=window==null?void 0:window.Capacitor)==null?void 0:D.Plugins)||{})}`),console.log(`- User agent: ${navigator.userAgent}`),console.log(`- GPSTracking registered: ${typeof Yu<"u"}`);try{console.log("Calling Capacitor GPS plugin with parameters:"),console.log(`- Vehicle: ${S}`),console.log(`- Course: ${p}`),console.log(`- UIT: ${r}`),console.log(`- Status: ${O}`);const y=await Yu.startGPSTracking({vehicleNumber:S,courseId:p,uit:r,authToken:E,status:O});console.log("Capacitor GPS plugin response:",y),y&&y.success?(console.log(`GPS tracking started successfully for UIT: ${r}`),console.log("EnhancedGPSService will transmit coordinates every 60 seconds")):console.warn(`GPS tracking failed for UIT: ${r}`,y)}catch(y){throw console.error(`GPS plugin error for UIT: ${r}:`,y),console.error("Plugin not available on this platform"),y}}async stopTracking(p){console.log(`Stopping GPS tracking for course ${p}`);try{const S=await Yu.stopGPSTracking({courseId:p});console.log("GPS stop result:",S),this.activeCourses.delete(p)}catch(S){throw console.error(`Error stopping GPS tracking for ${p}:`,S),S}}getActiveCourses(){return Array.from(this.activeCourses.keys())}hasActiveCourses(){return this.activeCourses.size>0}async isTrackingActive(){try{return(await Yu.isGPSTrackingActive()).isActive}catch(p){return console.error("Error checking GPS tracking status:",p),!1}}}const Td=new xh,cs=(g,p,S,r,E=2)=>Td.startTracking(g,p,r,S,E),bd=g=>Td.stopTracking(g),Sh="modulepreload",Th=function(g){return"/"+g},yd={},Eh=function(p,S,r){let E=Promise.resolve();if(S&&S.length>0){let C=function(y){return Promise.all(y.map(w=>Promise.resolve(w).then(U=>({status:"fulfilled",value:U}),U=>({status:"rejected",reason:U}))))};document.getElementsByTagName("link");const Y=document.querySelector("meta[property=csp-nonce]"),D=(Y==null?void 0:Y.nonce)||(Y==null?void 0:Y.getAttribute("nonce"));E=C(S.map(y=>{if(y=Th(y),y in yd)return;yd[y]=!0;const w=y.endsWith(".css"),U=w?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${y}"]${U}`))return;const M=document.createElement("link");if(M.rel=w?"stylesheet":Sh,w||(M.as="script"),M.crossOrigin="",M.href=y,D&&M.setAttribute("nonce",D),document.head.appendChild(M),w)return new Promise((W,K)=>{M.addEventListener("load",W),M.addEventListener("error",()=>K(new Error(`Unable to preload CSS for ${y}`)))})}))}function O(C){const Y=new Event("vite:preloadError",{cancelable:!0});if(Y.payload=C,window.dispatchEvent(Y),!Y.defaultPrevented)throw C}return E.then(C=>{for(const Y of C||[])Y.status==="rejected"&&O(Y.reason);return p().catch(O)})},Ed=Bu("Preferences",{web:()=>Eh(()=>import("./web-TwG-suh-.js"),[]).then(g=>new g.PreferencesWeb)}),zd="auth_token",zh=async()=>{try{return(await Ed.get({key:zd})).value}catch(g){return console.error("Error getting stored token:",g),null}},ss=async()=>{try{await Ed.remove({key:zd})}catch(g){throw console.error("Error clearing token:",g),g}},Ah=({course:g,onStatusUpdate:p,isLoading:S})=>{const[r,E]=ge.useState(!1),O=D=>{switch(D){case 1:return"Disponibilă";case 2:return"În progres";case 3:return"Pauzată";case 4:return"Finalizată";default:return"Necunoscut"}},C=D=>{let y;switch(D){case"start":y=2;break;case"pause":y=3;break;case"resume":y=2;break;case"finish":y=4;break;default:return}p(g.id,y)},Y=()=>{if(S)return s.jsx("div",{className:"text-center py-2",children:s.jsx("div",{className:"spinner-border spinner-border-sm text-primary",role:"status",children:s.jsx("span",{className:"visually-hidden",children:"Se încarcă..."})})});switch(g.status){case 1:return s.jsxs("button",{className:"btn btn-success btn-sm w-100",onClick:()=>C("start"),children:[s.jsx("i",{className:"fas fa-play me-2"}),"Start"]});case 2:return s.jsxs("div",{className:"d-flex gap-2",children:[s.jsxs("button",{className:"btn btn-warning btn-sm flex-fill",onClick:()=>C("pause"),children:[s.jsx("i",{className:"fas fa-pause me-1"}),"Pauzează"]}),s.jsxs("button",{className:"btn btn-danger btn-sm flex-fill",onClick:()=>C("finish"),children:[s.jsx("i",{className:"fas fa-stop me-1"}),"Finalizează"]})]});case 3:return s.jsxs("button",{className:"btn btn-primary btn-sm w-100",onClick:()=>C("resume"),children:[s.jsx("i",{className:"fas fa-play me-2"}),"Continuă"]});default:return null}};return s.jsx("div",{className:"course-detail-card mb-4",children:s.jsxs("div",{className:"card shadow-lg border-0 course-card-modern",children:[s.jsxs("div",{className:"card-header-modern d-flex justify-content-between align-items-center",children:[s.jsxs("div",{className:"course-header-info",children:[s.jsxs("div",{className:"course-name-section",children:[s.jsxs("h5",{className:"course-title-main",children:["UIT: ",g.uit]}),s.jsxs("span",{className:"course-id-badge",children:["ikRoTrans: ",g.ikRoTrans]})]}),s.jsx("div",{className:"course-route-info",children:s.jsx("div",{className:"route-display",children:s.jsxs("span",{className:"route-start",children:["Cod: ",g.codDeclarant]})})})]}),s.jsxs("div",{className:"course-header-actions",children:[s.jsxs("span",{className:`status-badge-modern status-${g.status}`,children:[s.jsx("i",{className:"fas fa-circle status-indicator"}),O(g.status)]}),s.jsx("button",{className:"btn-info-toggle",onClick:()=>{console.log("Info button clicked, current state:",r),E(!r)},title:"Afișează/Ascunde detalii complete",children:s.jsx("i",{className:`fas fa-${r?"chevron-up":"info-circle"}`})})]})]}),s.jsxs("div",{className:"card-body",children:[s.jsxs("div",{className:"course-summary mb-3",children:[s.jsxs("div",{className:"summary-item",children:[s.jsx("i",{className:"fas fa-calendar text-primary"}),s.jsx("span",{className:"summary-label",children:"Data Transport:"}),s.jsx("span",{className:"summary-value",children:g.dataTransport||"Nu este specificată"})]}),s.jsxs("div",{className:"summary-item",children:[s.jsx("i",{className:"fas fa-map-marker-alt text-primary"}),s.jsx("span",{className:"summary-label",children:"Traseu:"}),s.jsxs("span",{className:"summary-value",children:[g.vama," → ",g.vamaStop]})]})]}),r&&s.jsxs("div",{className:"course-details",children:[s.jsxs("h6",{className:"details-title",children:[s.jsx("i",{className:"fas fa-info-circle me-2"}),"Informații Complete Transport"]}),s.jsxs("div",{className:"details-grid",children:[s.jsxs("div",{className:"detail-group",children:[s.jsxs("h6",{className:"group-title",children:[s.jsx("i",{className:"fas fa-building me-2"}),"Declarant"]}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Cod Declarant:"}),s.jsx("div",{className:"detail-value",children:g.codDeclarant})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Denumire:"}),s.jsx("div",{className:"detail-value",children:g.denumireDeclarant})]})})]}),s.jsxs("div",{className:"detail-group",children:[s.jsxs("h6",{className:"group-title",children:[s.jsx("i",{className:"fas fa-truck me-2"}),"Transport"]}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"ikRoTrans:"}),s.jsx("div",{className:"detail-value",children:g.ikRoTrans})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Număr Vehicul:"}),s.jsx("div",{className:"detail-value",children:g.nrVehicul})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Data Transport:"}),s.jsx("div",{className:"detail-value",children:g.dataTransport})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"UIT:"}),s.jsx("div",{className:"detail-value font-monospace",children:g.uit})]})})]}),s.jsxs("div",{className:"detail-group",children:[s.jsxs("h6",{className:"group-title",children:[s.jsx("i",{className:"fas fa-map-marker-alt me-2"}),"Plecare"]}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Vamă:"}),s.jsx("div",{className:"detail-value",children:g.vama})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Birou Vamal:"}),s.jsx("div",{className:"detail-value",children:g.birouVamal})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Județ:"}),s.jsx("div",{className:"detail-value",children:g.judet})]})})]}),s.jsxs("div",{className:"detail-group",children:[s.jsxs("h6",{className:"group-title",children:[s.jsx("i",{className:"fas fa-flag-checkered me-2"}),"Destinație"]}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Vamă Stop:"}),s.jsx("div",{className:"detail-value",children:g.vamaStop})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Birou Vamal Stop:"}),s.jsx("div",{className:"detail-value",children:g.birouVamalStop})]})}),s.jsx("div",{className:"detail-item",children:s.jsxs("div",{className:"detail-content",children:[s.jsx("div",{className:"detail-label",children:"Județ Stop:"}),s.jsx("div",{className:"detail-value",children:g.judetStop})]})})]})]})]}),s.jsx("div",{className:"course-actions",children:Y()})]})]})})},jh=({token:g,onLogout:p})=>{const[S,r]=ge.useState(""),[E,O]=ge.useState([]),[C,Y]=ge.useState(!1),[D,y]=ge.useState(""),[w,U]=ge.useState(!1),[M,W]=ge.useState(null),[K,ve]=ge.useState(!1),[ie,ot]=ge.useState(0),[et,be]=ge.useState(!1),[qe,J]=ge.useState(""),[Ge,Oe]=ge.useState(!1),le=async()=>{if(!S.trim()){y("Vă rugăm să introduceți numărul vehiculului");return}Y(!0),y("");try{const h=await vh(S,g);if(!h||h.length===0){y("Nu există curse disponibile pentru acest vehicul. Verificați numărul și încercați din nou."),O([]),U(!1);return}O(h),U(!0)}catch(h){console.error("Error loading courses:",h),y(h.message||"Eroare la încărcarea curselor. Verificați numărul vehiculului."),O([]),U(!1)}finally{Y(!1)}},he=async(h,_)=>{try{const B=await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/reportStatus.php",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g}`},body:JSON.stringify({courseId:h.id,vehicleNumber:S,status:_,uit:h.uit})});if(!B.ok)throw new Error(`Server error: ${B.status}`);const ee=await B.json();console.log("Status sent to server:",ee)}catch(B){console.error("Error updating status:",B)}},Me=async(h,_)=>{const B=E.find(o=>o.id===h);if(!B)return;const ee=B.status;W(h);try{O(o=>o.map(N=>N.id===h?{...N,status:_}:N)),console.log(`Updating status for course ${h}: ${ee} → ${_}`),_===2&&ee!==2?(console.log(`Starting GPS tracking for course ${h} with UIT ${B.uit}`),await cs(h,S,g,B.uit,_)):_===3&&ee===2?(console.log(`Pausing GPS tracking for course ${h} with UIT ${B.uit}`),await bd(h),await cs(h,S,g,B.uit,_)):_===4?(console.log(`Stopping GPS tracking for course ${h} with UIT ${B.uit}`),await bd(h)):_===2&&ee===3&&(console.log(`Resuming GPS tracking for course ${h} with UIT ${B.uit}`),await cs(h,S,g,B.uit,_)),await he(B,_),console.log(`Status updated on server for course ${h}: ${_}`)}catch(o){console.error(`Error updating status for course ${h}:`,o),O(N=>N.map(H=>H.id===h?{...H,status:ee}:H)),y(`Eroare la actualizarea statusului: ${o instanceof Error?o.message:"Eroare necunoscută"}`)}finally{W(null)}},De=()=>{U(!1),O([]),y(""),r("")},fe=async()=>{try{await bh(g),await ss(),p()}catch(h){console.error("Logout error:",h),await ss(),p()}},Ae=()=>{ot(h=>{const _=h+1;return _>=20&&(be(!0),ot(0)),_})},ke=()=>{qe==="parola123"?(Oe(!0),be(!1),J("")):(alert("Parolă incorectă"),J(""))},Se=()=>{Oe(!1)};return w?s.jsxs("div",{className:"courses-container",children:[s.jsx("style",{children:`
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
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(25px);
            color: #1e3c72;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
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
            gap: 15px;
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(124, 58, 237, 0.2));
            padding: 15px 25px;
            border-radius: 20px;
            backdrop-filter: blur(15px);
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }

          .vehicle-display:hover {
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.3), rgba(124, 58, 237, 0.3));
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 15px 40px rgba(79, 70, 229, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
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
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
            padding: 20px;
            border-radius: 20px;
            backdrop-filter: blur(15px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: all 0.4s ease;
            cursor: pointer;
          }

          .courses-stats:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 12px 30px rgba(16, 185, 129, 0.2);
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3));
          }

          .stats-number {
            font-size: 2.5rem;
            font-weight: 800;
            display: block;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #059669, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: countUp 1s ease-out;
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
            padding: 20px 20px 120px 20px;
            max-width: 1200px;
            margin: 0 auto;
            min-height: calc(100vh - 200px);
          }

          .courses-grid {
            display: grid;
            gap: 20px;
            grid-template-columns: 1fr;
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
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            padding: 15px 20px calc(15px + env(safe-area-inset-bottom, 20px)) 20px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }

          .nav-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            padding: 10px 15px;
            border: none;
            background: none;
            color: #64748b;
            cursor: pointer;
            border-radius: 12px;
            transition: all 0.3s ease;
            min-width: 70px;
          }

          .nav-button:hover {
            background: rgba(79, 70, 229, 0.1);
            color: #4f46e5;
            transform: translateY(-2px);
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
          }

          .logout-nav-button:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #dc2626;
          }

          .version-info-bottom {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            color: #94a3b8;
            font-size: 0.8rem;
            background: rgba(255, 255, 255, 0.8);
            padding: 5px 15px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            cursor: pointer;
            user-select: none;
            transition: all 0.3s ease;
          }

          .version-info-bottom:hover {
            background: rgba(255, 255, 255, 0.9);
            transform: translateX(-50%) scale(1.05);
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
        `}),s.jsx("div",{className:"courses-header",children:s.jsxs("div",{className:"vehicle-header-info",children:[s.jsxs("div",{className:"vehicle-display",onClick:De,children:[s.jsx("i",{className:"fas fa-truck"}),s.jsx("span",{className:"vehicle-number-text",children:S}),s.jsx("i",{className:"fas fa-edit vehicle-edit-icon"})]}),s.jsxs("div",{className:"courses-stats",children:[s.jsx("span",{className:"stats-number",children:E.length}),s.jsx("span",{className:"stats-label",children:"Transporturi Active"})]})]})}),s.jsxs("div",{className:"courses-content",children:[D&&s.jsxs("div",{className:"courses-error-alert",children:[s.jsx("i",{className:"fas fa-exclamation-triangle courses-error-icon"}),s.jsx("span",{className:"courses-error-text",children:D})]}),s.jsx("div",{className:"courses-grid",children:E.map(h=>s.jsx(Ah,{course:h,onStatusUpdate:Me,isLoading:M===h.id},h.id))})]}),s.jsxs("div",{className:"courses-bottom-nav",children:[s.jsxs("button",{className:"nav-button",onClick:()=>ve(!K),children:[s.jsx("i",{className:"fas fa-info-circle"}),s.jsx("span",{className:"nav-button-label",children:"Info"})]}),s.jsxs("button",{className:"nav-button logout-nav-button",onClick:fe,children:[s.jsx("i",{className:"fas fa-sign-out-alt"}),s.jsx("span",{className:"nav-button-label",children:"Ieșire"})]})]}),K&&s.jsx("div",{className:"info-modal",onClick:()=>ve(!1),children:s.jsxs("div",{className:"info-content",onClick:h=>h.stopPropagation(),children:[s.jsxs("div",{className:"info-header",children:[s.jsx("h3",{children:"iTrack - Informații Aplicație"}),s.jsx("button",{className:"info-close",onClick:()=>ve(!1),children:s.jsx("i",{className:"fas fa-times"})})]}),s.jsxs("div",{className:"info-body",children:[s.jsxs("div",{className:"info-section",children:[s.jsxs("h4",{children:[s.jsx("i",{className:"fas fa-truck"})," Vehicul"]}),s.jsxs("p",{children:["Număr înmatriculare: ",s.jsx("strong",{children:S})]}),s.jsxs("p",{children:["Curse active: ",s.jsx("strong",{children:E.filter(h=>h.status===2).length})]}),s.jsxs("p",{children:["Curse în pauză: ",s.jsx("strong",{children:E.filter(h=>h.status===3).length})]})]}),s.jsxs("div",{className:"info-section",children:[s.jsxs("h4",{children:[s.jsx("i",{className:"fas fa-satellite"})," GPS Tracking"]}),E.filter(h=>h.status===2).length>0?s.jsxs(s.Fragment,{children:[s.jsxs("p",{children:["Status: ",s.jsxs("strong",{children:["Activ pentru ",E.filter(h=>h.status===2).length," curse"]})]}),s.jsx("p",{children:"Curse în tracking:"}),s.jsx("div",{style:{marginLeft:"15px",fontSize:"0.9rem"},children:E.filter(h=>h.status===2).map(h=>s.jsxs("p",{style:{margin:"2px 0",color:"#059669"},children:["• UIT: ",s.jsx("strong",{children:h.uit})]},h.id))}),s.jsxs("p",{children:["Interval transmisie: ",s.jsx("strong",{children:"60 secunde"})]}),s.jsxs("p",{children:["Background tracking: ",s.jsx("strong",{children:"Activat (nativ Android)"})]}),s.jsxs("p",{children:["Funcționează când: ",s.jsx("strong",{children:"telefon blocat, app minimizată"})]})]}):s.jsxs(s.Fragment,{children:[s.jsxs("p",{children:["Status: ",s.jsx("strong",{children:"Inactiv"})]}),s.jsx("p",{children:"Nu există curse în desfășurare"}),s.jsx("p",{children:"GPS va porni automat la Start Cursă"})]})]}),s.jsxs("div",{className:"info-section",children:[s.jsxs("h4",{children:[s.jsx("i",{className:"fas fa-mobile-alt"})," Aplicație"]}),s.jsxs("p",{children:["Versiune: ",s.jsx("strong",{children:"1807.99"})]}),s.jsxs("p",{children:["Platform: ",s.jsx("strong",{children:"Android/Web"})]}),s.jsx("p",{children:"© 2025 iTrack Business Solutions"})]})]})]})}),s.jsxs("div",{className:"version-info-bottom",onClick:Ae,children:["Versiunea 1807.99",ie>0&&`+${ie}`]}),et&&s.jsx("div",{className:"debug-prompt-overlay",children:s.jsxs("div",{className:"debug-prompt-content",children:[s.jsx("h3",{children:"Mod Debug Dezvoltator"}),s.jsx("p",{children:"Introduceți parola pentru accesul la panelul de debug:"}),s.jsx("input",{type:"password",value:qe,onChange:h=>J(h.target.value),placeholder:"Parola debug",className:"debug-password-input",onKeyPress:h=>h.key==="Enter"&&ke()}),s.jsxs("div",{className:"debug-prompt-buttons",children:[s.jsx("button",{onClick:ke,className:"debug-submit-btn",children:"Accesează Debug"}),s.jsx("button",{onClick:()=>be(!1),className:"debug-cancel-btn",children:"Anulează"})]})]})}),Ge&&s.jsx("div",{className:"mobile-debug-overlay",children:s.jsxs("div",{className:"mobile-debug-panel",children:[s.jsxs("div",{className:"debug-header",children:[s.jsx("h3",{children:"📱 Debug Panel (Mobile)"}),s.jsx("button",{onClick:Se,className:"debug-close-btn",children:"✕"})]}),s.jsx("div",{className:"debug-content",children:s.jsxs("div",{className:"debug-logs-container",children:[s.jsxs("div",{className:"debug-status",children:[s.jsx("span",{className:"debug-indicator",children:"🟢 Debug Activ"}),s.jsx("span",{className:"debug-platform",children:"Platform: Android APK"})]}),s.jsxs("div",{className:"debug-log-output",id:"debugLogOutput",children:[s.jsxs("div",{className:"debug-log-item info",children:[s.jsx("span",{className:"log-time",children:new Date().toLocaleTimeString()}),s.jsx("span",{className:"log-level",children:"INFO"}),s.jsx("span",{className:"log-message",children:"Debug panel activat pentru diagnosticare GPS"})]}),s.jsxs("div",{className:"debug-log-item warn",children:[s.jsx("span",{className:"log-time",children:new Date().toLocaleTimeString()}),s.jsx("span",{className:"log-level",children:"WARN"}),s.jsx("span",{className:"log-message",children:"Verificați logurile Android ADB pentru detalii complete"})]})]}),s.jsxs("div",{className:"debug-actions",children:[s.jsx("button",{className:"debug-action-btn",onClick:()=>console.log("Test GPS Plugin"),children:"Test GPS Plugin"}),s.jsx("button",{className:"debug-action-btn",onClick:()=>console.log("Clear Logs"),children:"Clear Logs"})]})]})})]})})]}):s.jsxs("div",{className:"vehicle-input-container",children:[s.jsx("style",{children:`
            .vehicle-input-container {
              min-height: 100vh;
              min-height: 100dvh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: calc(env(safe-area-inset-top, 0px) + 60px) env(safe-area-inset-right) max(20px, env(safe-area-inset-bottom)) env(safe-area-inset-left);
              position: relative;
              overflow: hidden;
            }

            .vehicle-input-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
              pointer-events: none;
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
          `}),s.jsxs("div",{className:"vehicle-card",children:[s.jsxs("div",{className:"vehicle-header",children:[s.jsx("div",{className:"vehicle-logo",children:s.jsx("i",{className:"fas fa-truck"})}),s.jsx("h1",{className:"vehicle-title",children:"iTrack"}),s.jsx("p",{className:"vehicle-subtitle",children:"Selectați Vehiculul de Transport"})]}),s.jsxs("div",{className:"vehicle-form",children:[D&&s.jsxs("div",{className:"vehicle-error-alert",children:[s.jsx("i",{className:"fas fa-exclamation-triangle vehicle-error-icon"}),s.jsx("span",{className:"vehicle-error-text",children:D})]}),s.jsxs("div",{className:"vehicle-form-group",children:[s.jsx("i",{className:"fas fa-truck vehicle-input-icon"}),s.jsx("input",{type:"text",className:"vehicle-form-input",value:S,onChange:h=>{const _=h.target.value.replace(/[^A-Za-z0-9]/g,"").toUpperCase();r(_)},placeholder:"Numărul de înmatriculare (ex: B123ABC)",disabled:C,maxLength:10,onKeyPress:h=>{h.key==="Enter"&&le()}})]}),s.jsx("button",{className:"vehicle-load-button",onClick:le,disabled:C||!S.trim(),children:C?s.jsxs(s.Fragment,{children:[s.jsx("div",{className:"vehicle-loading-spinner"}),s.jsx("span",{children:"Căutare curse în progres..."})]}):s.jsxs(s.Fragment,{children:[s.jsx("i",{className:"fas fa-search"}),s.jsx("span",{children:"Încarcă Transporturile"})]})})]})]}),s.jsx("div",{className:"vehicle-footer-actions",children:s.jsxs("button",{className:"vehicle-logout-button",onClick:fe,children:[s.jsx("i",{className:"fas fa-sign-out-alt"}),s.jsx("span",{children:"Deconectare"})]})})]})},Nh=({onLogout:g})=>{const[p,S]=ge.useState([]),[r,E]=ge.useState([]),[O,C]=ge.useState(""),[Y,D]=ge.useState("");ge.useEffect(()=>{const U=[],M={log:console.log,warn:console.warn,error:console.error,debug:console.debug,info:console.info},W=(K,ve)=>{const ie={id:Date.now().toString()+Math.random().toString(36).substr(2,9),timestamp:new Date().toLocaleString("ro-RO"),level:K,message:ve};U.unshift(ie),U.length>200&&U.pop(),S([...U])};return console.log=(...K)=>{M.log(...K),W("INFO",K.join(" "))},console.warn=(...K)=>{M.warn(...K),W("WARN",K.join(" "))},console.error=(...K)=>{M.error(...K),W("ERROR",K.join(" "))},console.debug=(...K)=>{M.debug(...K),W("DEBUG",K.join(" "))},W("INFO","Admin Panel - Console logging started"),W("INFO","Ready for debugging on mobile device"),()=>{console.log=M.log,console.warn=M.warn,console.error=M.error,console.debug=M.debug}},[]),ge.useEffect(()=>{let U=p;O&&(U=U.filter(M=>M.message.toLowerCase().includes(O.toLowerCase()))),Y&&(U=U.filter(M=>M.level===Y)),E(U)},[p,O,Y]);const y=U=>{switch(U){case"INFO":return"#10b981";case"WARN":return"#f59e0b";case"ERROR":return"#ef4444";case"DEBUG":return"#6b7280";default:return"#6b7280"}},w=()=>{S([]),console.log("Logs cleared by admin")};return s.jsxs("div",{style:{minHeight:"100vh",background:"linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",padding:"20px",fontFamily:"Arial, sans-serif"},children:[s.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.95)",borderRadius:"15px",padding:"20px",marginBottom:"20px",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.1)"},children:[s.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"15px"},children:[s.jsx("h2",{style:{margin:0,color:"#1e293b"},children:"🔧 Admin Debug Panel"}),s.jsx("button",{onClick:g,style:{background:"#ef4444",color:"white",border:"none",padding:"10px 20px",borderRadius:"8px",cursor:"pointer",fontWeight:"bold"},children:"Logout"})]}),s.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:"10px",marginBottom:"10px"},children:[s.jsx("input",{type:"text",placeholder:"Caută în logs...",value:O,onChange:U=>C(U.target.value),style:{padding:"10px",borderRadius:"8px",border:"2px solid #e5e7eb",fontSize:"14px"}}),s.jsxs("select",{value:Y,onChange:U=>D(U.target.value),style:{padding:"10px",borderRadius:"8px",border:"2px solid #e5e7eb",fontSize:"14px"},children:[s.jsx("option",{value:"",children:"Toate nivelurile"}),s.jsx("option",{value:"INFO",children:"INFO"}),s.jsx("option",{value:"WARN",children:"WARN"}),s.jsx("option",{value:"ERROR",children:"ERROR"}),s.jsx("option",{value:"DEBUG",children:"DEBUG"})]}),s.jsx("button",{onClick:w,style:{background:"#6b7280",color:"white",border:"none",padding:"10px 15px",borderRadius:"8px",cursor:"pointer",whiteSpace:"nowrap"},children:"Clear"})]}),s.jsxs("div",{style:{color:"#6b7280",fontSize:"14px"},children:["📊 Total logs: ",r.length]})]}),s.jsx("div",{style:{background:"rgba(255, 255, 255, 0.95)",borderRadius:"15px",overflow:"hidden",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.1)",maxHeight:"calc(100vh - 200px)",overflowY:"auto"},children:r.length>0?s.jsx("div",{children:r.map(U=>s.jsxs("div",{style:{padding:"12px 15px",borderBottom:"1px solid #e5e7eb",fontSize:"13px",lineHeight:"1.4"},children:[s.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"8px",marginBottom:"4px"},children:[s.jsx("span",{style:{background:y(U.level),color:"white",padding:"2px 6px",borderRadius:"4px",fontSize:"11px",fontWeight:"bold",minWidth:"45px",textAlign:"center"},children:U.level}),s.jsx("span",{style:{color:"#6b7280",fontSize:"11px",minWidth:"120px"},children:U.timestamp})]}),s.jsx("div",{style:{color:"#374151",marginLeft:"57px",wordBreak:"break-word",fontFamily:"Monaco, Menlo, monospace",fontSize:"12px"},children:U.message})]},U.id))}):s.jsxs("div",{style:{textAlign:"center",padding:"40px",color:"#6b7280"},children:[s.jsx("div",{style:{fontSize:"48px",marginBottom:"10px"},children:"📱"}),s.jsx("div",{children:"Niciun log găsit"}),s.jsx("div",{style:{fontSize:"12px",marginTop:"5px"},children:"Interacționează cu aplicația pentru a vedea log-urile"})]})})]})},Oh=()=>{const[g,p]=ge.useState("login"),[S,r]=ge.useState(""),[E,O]=ge.useState(!0);ge.useEffect(()=>{(async()=>{try{const y=await zh();y?(console.log("Found stored token - auto login"),r(y),p("vehicle")):console.log("No stored token - showing login")}catch(y){console.error("Error initializing app:",y)}finally{O(!1)}})()},[]);const C=D=>{r(D),p(D==="ADMIN_TOKEN"?"admin":"vehicle")},Y=async()=>{try{const D=await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/login.php",{method:"POST",headers:{Authorization:`Bearer ${S}`,"Content-Type":"application/json"},body:JSON.stringify({iesire:1})});console.log("Logout API response:",D.status)}catch(D){console.error("Error calling logout API:",D)}finally{await ss(),r(""),p("login"),console.log("Logged out - cleared local storage")}};return E?s.jsx("div",{className:"app",style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"},children:s.jsx("div",{children:"Loading..."})}):s.jsxs("div",{className:"app",children:[g==="login"&&s.jsx(yh,{onLogin:C}),g==="vehicle"&&s.jsx(jh,{token:S,onLogout:Y}),g==="admin"&&s.jsx(Nh,{onLogout:Y})]})};xa.isNativePlatform()&&console.log("Running on native platform");ih.createRoot(document.getElementById("root")).render(s.jsx(Pg.StrictMode,{children:s.jsx(Oh,{})}));export{Sd as W};
