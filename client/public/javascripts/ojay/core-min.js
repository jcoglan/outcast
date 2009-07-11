/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
Version: master-7bf74da460c9904c4a2bacfa7d728df9748fb7d2
Build:   min
*/

var Ojay=function(){var a=[],b,c,d;for(c=0,d=arguments.length;c<d;c++){b=arguments[c];if(typeof b=='string')b=Ojay.cssEngine.query(b);if(b.toArray)b=b.toArray();if(!(b instanceof Array))b=[b];a=a.concat(b)}return new Ojay.DomCollection(a.unique())};Ojay.VERSION='master-7bf74da460c9904c4a2bacfa7d728df9748fb7d2';Array.from=JS.array;Function.prototype.bind=function(){return JS.bind.apply(JS,[this].concat(JS.array(arguments)))};(function(c){JS.extend(Ojay,{byId:function(a){var b=document.getElementById(a);return new this.DomCollection(b?[b]:[])},changeAlias:function(a){this.surrenderAlias();this.ALIAS=String(a);this.__alias=(typeof window[this.ALIAS]=='undefined')?null:window[this.ALIAS];window[this.ALIAS]=this},surrenderAlias:function(){if(this.__alias===null){if(this.ALIAS)delete window[this.ALIAS];return false}window[this.ALIAS]=this.__alias;return true},log:function(){Array.from(arguments).forEach(function(a){this[a]=this[a].traced(a+'()')},Ojay.DomCollection.prototype)},getDocumentSize:function(){return{width:c.getDocumentWidth(),height:c.getDocumentHeight()}},getScrollOffsets:function(){return{left:c.getDocumentScrollLeft(),top:c.getDocumentScrollTop()}},getViewportSize:function(){return{width:c.getViewportWidth(),height:c.getViewportHeight()}},getVisibleRegion:function(){var a=this.getViewportSize(),b=this.getScrollOffsets();return new this.Region({top:b.top,bottom:b.top+a.height,left:b.left,right:b.left+a.width})}})})(YAHOO.util.Dom);Ojay.changeAlias('$');Ojay.ARRAY_METHODS={indexOf:function(a){var b=this.length;var c=Number(arguments[1])||0;c=(c<0)?Math.ceil(c):Math.floor(c);if(c<0)c+=b;for(;c<b;c++){if(c in this&&this[c]===a)return c}return-1},lastIndexOf:function(a){var b=this.length;var c=Number(arguments[1]);if(isNaN(c)){c=b-1}else{c=(c<0)?Math.ceil(c):Math.floor(c);if(c<0)c+=b;else if(c>=b)c=b-1}for(;c>-1;c--){if(c in this&&this[c]===a)return c}return-1},filter:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=new Array();var d=arguments[1];for(var f=0;f<b;f++){if(f in this){var g=this[f];if(a.call(d,g,f,this))c.push(g)}}return c},forEach:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=arguments[1];for(var d=0;d<b;d++){if(d in this)a.call(c,this[d],d,this)}},every:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=arguments[1];for(var d=0;d<b;d++){if(d in this&&!a.call(c,this[d],d,this))return false}return true},map:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=new Array(b);var d=arguments[1];for(var f=0;f<b;f++){if(f in this)c[f]=a.call(d,this[f],f,this)}return c},some:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=arguments[1];for(var d=0;d<b;d++){if(d in this&&a.call(c,this[d],d,this))return true}return false},reduce:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();if(b==0&&arguments.length==1)throw new TypeError();var c=0;if(arguments.length>=2){var d=arguments[1]}else{do{if(c in this){d=this[c++];break}if(++c>=b)throw new TypeError();}while(true)}for(;c<b;c++){if(c in this)d=a.call(null,d,this[c],c,this)}return d},reduceRight:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();if(b==0&&arguments.length==1)throw new TypeError();var c=b-1;if(arguments.length>=2){var d=arguments[1]}else{do{if(c in this){d=this[c--];break}if(--c<0)throw new TypeError();}while(true)}for(;c>=0;c--){if(c in this)d=a.call(null,d,this[c],c,this)}return d},unique:function(){var a=[],b,c,d;for(b=0,c=this.length;b<c;b++){d=this[b];if(a.indexOf(d)==-1)a.push(d)}return a},count:function(a,b){return this.filter(a,b).length}};JS.extend(Array.prototype,Ojay.ARRAY_METHODS);JS.extend(Function.prototype,{_1:function(a){this.valueOf=function(){return a};this.toString=function(){return a.toString()};return this},partial:function(){if(!arguments.length)return this;var a=this,b=Array.from(arguments);return function(){return a.apply(this,b.concat(Array.from(arguments)))}._1(this)},curry:function(a){var b=this,a=a||this.length;return function(){if(arguments.length>=a)return b.apply(this,arguments);return b.partial.apply(arguments.callee,arguments)}._1(this)},wrap:function(a){var b=this;return function(){return a.apply(this,[b.bind(this)].concat(Array.from(arguments)))}._1(this)},methodize:function(){if(this._b)return this._b;var a=this;return this._b=function(){return a.apply(null,[this].concat(Array.from(arguments)))}._1(this)},functionize:function(){if(this._c)return this._c;var b=this;return this._c=function(){var a=Array.from(arguments);return b.apply(a.shift(),a)}._1(this)},traced:function(b,c){var d=this,b=b||this,c=c||'info';return function(){window.console&&console[c](b,' called on ',this,' with ',arguments);var a=d.apply(this,arguments);window.console&&console[c](b,' -> ',a);return a}._1(this)},runs:function(a){var b=this,c=0;return function(){return(c++<a)?b.apply(this,arguments):undefined}._1(this)}});String.SCRIPT_FRAGMENT='<script[^>]*>([\\S\\s]*?)<\/script>';JS.extend(String.prototype,{extractScripts:function(){var b=new RegExp(String.SCRIPT_FRAGMENT,'img');var c=new RegExp(String.SCRIPT_FRAGMENT,'im');return(this.match(b)||[]).map(function(a){return(a.match(c)||['',''])[1]})},evalScripts:function(){return this.extractScripts().map(function(a){return eval(a)})},parseJSON:function(){return YAHOO.lang.JSON.parse(this.valueOf())},stripScripts:function(){return this.replace(new RegExp(String.SCRIPT_FRAGMENT,'img'),'')},stripTags:function(){return this.replace(/<\/?[^>]+>/gi,'').trim()},trim:YAHOO.lang.trim.methodize()});'abs acos asin atan ceil cos exp floor log pow round sin sqrt tan'.split(/\s+/).forEach(function(a){Number.prototype[a]=Math[a].methodize()});Number.prototype.times=function(a,b){if(this<0)return;for(var c=0;c<this;c++)a.call(b||null,c)};Number.prototype.between=function(a,b,c){if(this>a&&this<b)return true;return(this==a||this==b)?(c!==false):false};Function.from=function(b){if(b.toFunction)return b.toFunction();if(typeof b=='function')return b;if(typeof b=='object')return Function.fromObject(b);return function(a){return a}};String.prototype.toFunction=function(){var h=this.split('.');if(!h[0])return function(x){return x};return function(a){var b,c=a,d;for(var f=0,g=h.length;f<g;f++){d=h[f];b=c;c=b[d];if(typeof c=='function')c=c.apply(b)}return c}};Array.prototype.toFunction=function(){var c=this[0],d=this.slice(1);if(!c)return function(x){return x};return function(a){var b=(typeof c=='function')?c:a[c];return(typeof b=='function')?b.apply(a,d):undefined}};Function.fromObject=function(j){var k=[];for(var i in j){if(j.hasOwnProperty(i))k.push(i)}if(k.length===0)return function(x){return x};return function(a){var b=true,c,d,f;for(var g=0,h=k.length;g<h;g++){c=k[g];d=a[c];f=j[c];if(typeof d=='function'&&!(f instanceof Array))f=[f];b=b&&((typeof d=='function')?d.apply(a,f):d==f)}return b}};'filter forEach every map some'.split(/\s+/).forEach(function(d){this[d]=this[d].wrap(function(a,b,c){if(b)b=Function.from(b);return a(b,c)})},Array.prototype);Ojay.Selectors={Native:{query:function(a,b){return Array.from((b||document).querySelectorAll(a))},test:function(a,b){var c=this.query(b,a.parentNode);return c.indexOf(a)!=-1}},Yahoo:{query:function(a,b){return YAHOO.util.Selector.query(a,b)},test:function(a,b){return YAHOO.util.Selector.test(a,b)}},Ext:{query:function(a,b){return Ext.DomQuery.select(a,b)},test:function(a,b){return Ext.DomQuery.is(a,b)}},Sizzle:{query:function(a,b){return Sizzle(a,b)},test:function(a,b){return Sizzle.filter(b,[a]).length===1}},Peppy:{query:function(a,b){return peppy.query(a,b)},test:function(a,b){var c=peppy.query(b,a,true);return c.indexOf(a)!=-1}}};Ojay.cssEngine=document.querySelectorAll?Ojay.Selectors.Native:Ojay.Selectors.Yahoo;(function(j){JS.extend(Ojay,{stopDefault:function(a,b){j.preventDefault(b)},stopPropagate:function(a,b){j.stopPropagation(b)},stopEvent:function(a,b){Ojay.stopDefault(a,b);Ojay.stopPropagate(a,b)},delegateEvent:function(g,h){return function(a,b){var c=b.getTarget(),d;for(var f in g){if(!c.matches(f)&&!h)continue;d=c;if(h)while(d&&!d.matches(f)){d=Ojay(d.node.parentNode);if(d.node==document.body)d=null}if(d)Function.from(g[f]).call(this,d,b)}}},_g:function(){return Ojay(j.getTarget(this))}});Ojay.stopDefault.method=Ojay.stopDefault.partial(null).methodize();Ojay.stopPropagate.method=Ojay.stopPropagate.partial(null).methodize();Ojay.stopEvent.method=Ojay.stopEvent.partial(null).methodize();['onDOMReady','onContentReady','onAvailable'].forEach(function(a){Ojay[a]=j[a].bind(j)})})(YAHOO.util.Event);Ojay.Observable=new JS.Module('Ojay.Observable',{include:JS.Observable,on:function(c,d,f){var g=new JS.MethodChain;if(d&&typeof d!='function')f=d;this.addObserver(function(){var a=Array.from(arguments),b=a.shift();if(b!=c)return;if(typeof d=='function')d.apply(f||null,a);g.fire(f||a[0])},this);return g},notifyObservers:function(){var a=Array.from(arguments),b=(a[1]||{}).receiver||this;if(b==this)a.splice(1,0,b);else a[1]=b;this.callSuper.apply(this,a);a[1]={receiver:b};var c=this.klass.ancestors(),d;while(d=c.pop())d.notifyObservers&&d.notifyObservers.apply(d,a);return this},extend:{included:function(a){a.extend(this)}}});Ojay.Observable.extend(Ojay.Observable);(function(i,l){i.DomCollection=new JS.Class('Ojay.DomCollection',{initialize:function(a){this.length=0;for(var b=0,c=a.length,d,f=[].push;b<c;b++){d=a[b].nodeType;if(d===i.HTML.ELEMENT_NODE||d===i.HTML.DOCUMENT_NODE||a[b]==window)f.call(this,a[b])}this.node=this[0];return this},toArray:function(a){if(a)a=Function.from(a);var b=[],c,d=this.length;for(c=0;c<d;c++)b.push(a?a(this[c]):this[c]);return b},at:function(a){a=Number(a).round();var b=(a>=0&&a<this.length)?[this[a]]:[];return new this.klass(b)},on:function(c,d,f){var g=new JS.MethodChain;if(d&&typeof d!='function')f=d;var h=function(a){if(a.eventName!==undefined&&a.eventName!=c)return;var b=i(this);a.stopDefault=i.stopDefault.method;a.stopPropagate=i.stopPropagate.method;a.stopEvent=i.stopEvent.method;a.getTarget=i._g;if(typeof d=='function')d.call(f||null,b,a);g.fire(f||b)};if(/:/.test(c)){for(var j=0,k=this.length;j<k;j++)(function(a){var b=h.bind(a);if(a.addEventListener){a.addEventListener('dataavailable',b,false)}else{a.attachEvent('ondataavailable',b);a.attachEvent('onfilterchange',b)}})(this[j])}else{YAHOO.util.Event.on(this,c,h)}return g},trigger:function(c,d,f){f=(f===undefined)?true:false;for(var g=0,h=this.length;g<h;g++)(function(a){if(a==document&&document.createEvent&&!a.dispatchEvent)a=document.documentElement;var b;if(document.createEvent){b=document.createEvent('HTMLEvents');b.initEvent('dataavailable',f,true)}else{b=document.createEventObject();b.eventType=f?'ondataavailable':'onfilterchange'}b.eventName=c;JS.extend(b,d||{});try{document.createEvent?a.dispatchEvent(b):a.fireEvent(b.eventType,b)}catch(e){}})(this[g]);return this},animate:function(a,b,c){var d=new i.Animation(this,a,b,c);d.run();return d.chain},scroll:function(a,b,c){if(b){var d=new i.Animation(this,{scroll:{to:a}},b,c,YAHOO.util.Scroll);d.run();return d.chain}else{for(var f=0,g=this.length;f<g;f++){this[f].scrollLeft=a[0];this[f].scrollTop=a[1]}return this}},addClass:function(a){l.addClass(this,a);this.trigger('ojay:classadded',{className:a},false);return this},removeClass:function(a){l.removeClass(this,a);this.trigger('ojay:classremoved',{className:a},false);return this},replaceClass:function(a,b){l.replaceClass(this,a,b);this.trigger('ojay:classremoved',{className:a},false);this.trigger('ojay:classadded',{className:b},false);return this},setClass:function(a){for(var b=0,c=this.length;b<c;b++)this[b].className=a;this.trigger('ojay:classadded',{className:a},false);return this},hasClass:function(a){if(!this.node)return undefined;return l.hasClass(this.node,a)},getStyle:function(a){if(!this.node)return undefined;return l.getStyle(this.node,String(a))},setStyle:function(a){var b,c=!!YAHOO.env.ua.ie;for(var d in a){if(c&&d=='opacity'){b=Number(a[d]);if(b===0)a[d]=0.001;if(b===1){l.setStyle(this,'filter','');continue}}l.setStyle(this,d,a[d])}this.trigger('ojay:stylechange',{styles:a},false);return this},set:function(a){for(var b=0,c=this.length;b<c;b++){for(var d in a){switch(a[d]){case true:this[b].setAttribute(d,d);break;case false:this[b].removeAttribute(d);break;default:this[b].setAttribute(d,a[d])}}}this.trigger('ojay:attrchange',{attributes:a},false);return this},setAttributes:function(){return this.set.apply(this,arguments)}.traced('setAttributes() is deprecated; used set() instead','warn'),hide:function(){this.setStyle({display:'none'});this.trigger('ojay:hide',{},false);return this},show:function(){this.setStyle({display:''});this.trigger('ojay:show',{},false);return this},setContent:function(b){if(!this.node)return this;if(b instanceof this.klass)b=b.node;if(b&&b.nodeType===i.HTML.ELEMENT_NODE){this.node.innerHTML='';this.node.appendChild(b)}else{this.forEach(function(a){a.node.innerHTML='';a.insert(b,'bottom')})}this.trigger('ojay:contentchange',{content:b},true);return this},insert:function(a,b){if(b=='replace')return this.setContent(a);if(a instanceof this.klass)a=a.node;new i.DomInsertion(this.toArray(),a,b);this.trigger('ojay:insert',{content:a,position:b},true);return this},remove:function(){this.toArray().forEach(function(a){if(a.parentNode)a.parentNode.removeChild(a)});this.trigger('ojay:remove',{},true);return this},matches:function(a){if(!this.node)return undefined;return i.cssEngine.test(this.node,a)},query:function(a,b){var c=b?i(b):this;if(!a)return new this.klass(c.toArray());c=c.filter({matches:a});return new this.klass(c.toArray())},parents:function(a){var b=this.toArray('parentNode');return this.query(a,b.unique())},ancestors:function(b){var c=[];this.toArray().forEach(function(a){while((a.tagName.toLowerCase()!='body')&&(a=a.parentNode)){if(c.indexOf(a)==-1)c.push(a)}});return this.query(b,c)},children:function(d){var f=[];this.toArray().forEach(function(a){var b=l.getChildren(a),c;while(c=b.shift()){if(f.indexOf(c)==-1)f.push(c)}});return this.query(d,f)},descendants:function(d){d=d||'*';var f=[];this.toArray().forEach(function(a){var b=i.cssEngine.query(d,a),c;while(c=b.shift()){if(f.indexOf(c)==-1)f.push(c)}});return new this.klass(f)},siblings:function(d){var f=this.toArray(),g=[];f.forEach(function(a){var b=i(a).parents().children(d).toArray(),c;while(c=b.shift()){if((f.indexOf(c)==-1)&&(g.indexOf(c)==-1))g.push(c)}});return new this.klass(g)},getRegion:function(){if(!this.node)return undefined;return new i.Region(l.getRegion(this.node))},fitToRegion:function(f){var g=f.getWidth(),h=f.getHeight();this.forEach(function(a){a.setStyle({width:g+'px',height:h+'px'});var b=a.getRegion(),c=b.getWidth(),d=b.getHeight();a.setStyle({width:(2*g-c)+'px',height:(2*h-d)+'px'})});this.trigger('ojay:regionfit',{},false);return this},getWidth:function(){if(!this.node)return undefined;return this.getRegion().getWidth()},getHeight:function(){if(!this.node)return undefined;return this.getRegion().getHeight()},getTop:function(){if(!this.node)return undefined;return this.getRegion().top},getBottom:function(){if(!this.node)return undefined;return this.getRegion().bottom},getLeft:function(){if(!this.node)return undefined;return this.getRegion().left},getRight:function(){if(!this.node)return undefined;return this.getRegion().right},getCenter:function(){if(!this.node)return undefined;return this.getRegion().getCenter()},areaIntersects:function(a){if(!this.node)return undefined;var b=i(a);return this.getRegion().intersects(b.getRegion())},intersection:function(a){if(!this.node)return undefined;var b=i(a);var c=this.getRegion(),d=b.getRegion();return c.intersects(d)?c.intersection(d):null},areaContains:function(a){if(!this.node)return undefined;var b=i(a);return this.getRegion().contains(b.getRegion())}})})(Ojay,YAHOO.util.Dom);(function(){var f={};for(var g in Ojay.ARRAY_METHODS)(function(c){var d=/^(?:indexOf|lastIndexOf|unique)$/.test(c);f[c]=function(){var a=d?this.toArray():this.toArray(Ojay);var b=a[c].apply(a,arguments);if(c=='filter')b=Ojay(b.map(function(el){return el.node}));return b}})(g);Ojay.DomCollection.include(f)})();Ojay.fn=Ojay.DomCollection.prototype;Ojay.DomInsertion=new JS.Class('Ojay.DomInsertion',{initialize:function(b,c,d){if(!(b instanceof Array))b=[b];if(!(/^(?:top|bottom|before|after)$/i.test(d)))d='bottom';this._8=b.filter(function(a){return a&&a.nodeType===Ojay.HTML.ELEMENT_NODE});this._2=c;this._4=d.toLowerCase();if(this._8.length===0)return;if(this._2&&this._2.nodeType)this._h();if(typeof this._2=='string')this._i()},_h:function(){var b=this.klass._d[this._4];this._8.forEach(function(a){b(a,this._2)},this)},_i:function(){var d=this.klass._d[this._4];this._8.forEach(function(a){var b=(/^(?:before|after)$/.test(this._4)?a.parentNode:a).tagName.toUpperCase();var c=this._j(b);if(/^(?:top|after)$/.test(this._4))c.reverse();c.forEach(d.partial(a))},this)},_j:function(a){var b=this.klass._k[a];var c=Ojay.HTML.div();if(b){c.innerHTML=b[0]+this._2+b[1];for(var d=0,f=b[2];d<f;d++)c=c.firstChild}else c.innerHTML=this._2;return Array.from(c.childNodes)},extend:{_d:{top:function(a,b){a.insertBefore(b,a.firstChild)},bottom:function(a,b){a.appendChild(b)},before:function(a,b){a.parentNode.insertBefore(b,a)},after:function(a,b){a.parentNode.insertBefore(b,a.nextSibling)}},_k:{TABLE:['<table>','</table>',1],THEAD:['<table><tbody>','</tbody></table>',2],TBODY:['<table><tbody>','</tbody></table>',2],TFOOT:['<table><tbody>','</tbody></table>',2],TR:['<table><tbody><tr>','</tr></tbody></table>',3],TD:['<table><tbody><tr><td>','</td></tr></tbody></table>',4],TH:['<table><tbody><tr><td>','</td></tr></tbody></table>',4],SELECT:['<select>','</select>',1]}}});Ojay.HtmlBuilder=new JS.Class('Ojay.HtmlBuilder',{initialize:function(a){this._5=a||null},concat:function(a){if(this._5)this._5.appendChild(a);return a},extend:{addTagNames:function(){var a=(arguments[0]instanceof Array)?arguments[0]:arguments;for(var b=0,c=a.length;b<c;b++)this.addTagName(a[b])},addTagName:function(k){this.define(k,function(){var a=document.createElement(k),b,c,d,f,g=(arguments[0]||{}).type||'text';if(YAHOO.env.ua.ie&&k=='input')a=document.createElement('<input type="'+g+'">');loop:for(var h=0,j=arguments.length;h<j;h++){b=arguments[h];switch(typeof b){case'object':f=b.node||b;if(f.nodeType===Ojay.HTML.ELEMENT_NODE){a.appendChild(f)}else{for(c in b){if(Number(c)==c)continue;if(c=='style')for(d in b[c])a.style[d]=b[c][d];else a[c]=b[c]}}break;case'function':b(new Ojay.HtmlBuilder(a));break;case'string':a.appendChild(document.createTextNode(b));break}}if(this._5)this._5.appendChild(a);return a})},TAG_NAMES:("a abbr acronym address applet area b base basefont bdo big blockquote body br button caption center cite code col colgroup dd del dfn dir div dl dt em embed fieldset font form frame frameset h1 h2 h3 h4 h5 h6 head hr html i iframe img input ins isindex kbd label legend li link map menu meta noframes noscript object ol optgroup option p param pre q s samp script select small span strike strong style sub sup table tbody td textarea tfoot th thead title tr tt u ul var").split(/\s+/)}});Ojay.HtmlBuilder.addTagNames(Ojay.HtmlBuilder.TAG_NAMES);Ojay.HTML=new Ojay.HtmlBuilder();JS.extend(Ojay.HTML,{ELEMENT_NODE:1,ATTRIBUTE_NODE:2,TEXT_NODE:3,CDATA_SECTION_NODE:4,ENTITY_REFERENCE_NODE:5,ENTITY_NODE:6,PROCESSING_INSTRUCTION_NODE:7,COMMENT_NODE:8,DOCUMENT_NODE:9,DOCUMENT_TYPE_NODE:10,DOCUMENT_FRAGMENT_NODE:11,NOTATION_NODE:12});Ojay.Animation=new JS.Class('Ojay.Animation',{extend:{DEFAULT_YUI_CLASS:YAHOO.util.ColorAnim},initialize:function(a,b,c,d,f){this._3=a;this._l=b||{};this._m=c||1.0;this._9=d||{};this._n=f||this.klass.DEFAULT_YUI_CLASS;this._o=YAHOO.util.Easing[this._9.easing||'easeBoth'];var g=this._9.after,h=this._9.before;this._p=g&&Function.from(g);this._q=h&&Function.from(h);this.chain=new JS.MethodChain},_e:function(a,b,c){if(typeof a=='function')a=a(c,b);if((a instanceof Array)||(typeof a!='object'))return a;var d={};for(var f in a)d[f]=arguments.callee(a[f],b,c);return d}.curry(),run:function(){var g=this._3.map(this._e(this._l));var h=this._3.map(this._e(this._m));var j=h.reduce(function(a,b){return a>b?a:b},-Infinity);var k=false;var i=this._p,l=this._q;this._3.trigger('ojay:animstart',{},false);this._3.forEach(function(a,b){var c=g[b],d=h[b];var f=new this._n(a.node,c,d,this._o);f.onComplete.subscribe(function(){if(YAHOO.env.ua.ie&&(c.opacity||{}).to!==undefined)a.setStyle({opacity:c.opacity.to});a.trigger('ojay:animend',{},false);if(i)i(a,b);if(d==j&&!k){k=true;this.chain.fire(this._3)}}.bind(this));if(l)l(a,b);f.animate()},this)}});(function(g){Ojay.Region=new JS.Class('Ojay.Region',{contains:g.prototype.contains,getArea:g.prototype.getArea,_r:g.prototype.intersect,_s:g.prototype.union,initialize:function(b){['top','right','bottom','left'].forEach(function(a){this[a]=b[a]||0},this)},getWidth:function(){return this.right-this.left},getHeight:function(){return this.bottom-this.top},getDiagonal:function(){return(this.getWidth().pow(2)+this.getHeight().pow(2)).sqrt()},getCenter:function(){return{left:(this.left+this.right)/2,top:(this.top+this.bottom)/2}},shift:function(a,b){this.left+=a;this.right+=a;this.top+=b;this.bottom+=b;return this},scale:function(a){var b=this.getWidth(),c=this.getHeight();if(b<=0||c<=0)return this;var d=(a-1)*b,f=(a-1)*c;this.left-=d/2;this.right+=d/2;this.top-=f/2;this.bottom+=f/2;return this},centerOn:function(a,b){var c=this.getCenter(),d;if(typeof a=='object'){d=a.getCenter();a=d.left;b=d.top}this.shift(a-c.left,b-c.top);return this},intersection:function(a){var b=this._r(a);return new Ojay.Region(b)},intersects:function(a){var b=Math.max(this.top,a.top),c=Math.min(this.bottom,a.bottom),d=Math.max(this.left,a.left),f=Math.min(this.right,a.right);return(b<c)&&(d<f)},union:function(a){var b=this._s(a);return new Ojay.Region(b)},toString:function(){return'('+this.left+','+this.top+') ['+this.getWidth()+'x'+this.getHeight()+']'},extend:{convert:function(a){if(a instanceof g)return new this(a);if(!(a instanceof this))a=Ojay(a).getRegion();if(!a)return undefined;else return a}}})})(YAHOO.util.Region);Ojay.Sequence=new JS.Class('Ojay.Sequence',{initialize:function(a,b,c){this._f=a;this._6=0;this._t=Function.from(b);this._u=c||null;this._7=null;this._0=false;this._a=false},_v:function(){this._t.call(this._u,this._f[this._6])},stepForward:function(){if(this._0===null){this._0=false;return this}this._v();this._6++;if(this._6>=this._f.length){this._6=0;if(this._a)this._0=this._a=false}if(this._0)setTimeout(this.method('stepForward'),this._7);return this},loop:function(a){this._7=1000*Number(a||0)||this._7;if(!this._7||this._0)return this;this._0=true;return this.stepForward()},pause:function(){if(this._0)this._0=null;return this},finish:function(){if(this._0)this._a=true;return this}});Array.prototype.sequence=function(a){return new Ojay.Sequence(this,a)};Ojay.DomCollection.include({sequence:function(b){return[].map.call(this,function(a){return Ojay(a)}).sequence(b)}});JS.MethodChain.addMethods(Ojay);(function(){var c=JS.ObjectMethods||JS.Kernel;var d=function(){var a=Array.from(arguments),b=a.shift();if(typeof a[0]=='string')return b(Ojay,a[0]);else return b.apply(this,a)};JS.MethodChain.prototype._=JS.MethodChain.prototype._.wrap(d);c.include({_:c.instanceMethod('_').wrap(d)})})();