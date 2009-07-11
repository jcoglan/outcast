/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
Version: master-7bf74da460c9904c4a2bacfa7d728df9748fb7d2
Build:   min
*/

Ojay.Paginator=new JS.Class('Ojay.Paginator',{include:[Ojay.Observable,JS.State],extend:{CONTAINER_CLASS:'paginator',PAGE_CLASS:'page',ITEM_CLASS:'item',SCROLL_TIME:0.5,PUSH_FADE_TIME:0.7,PUSH_SLIDE_TIME:0.3,DIRECTION:'horizontal',EASING:'easeBoth',makePageElement:function(a,b){var c=Ojay(Ojay.HTML.div({className:this.PAGE_CLASS}));c.setStyle({'float':'left',width:a+'px',height:b+'px',margin:'0 0 0 0',padding:'0 0 0 0',border:'none'});return c}},initialize:function(a,b){this._m=a;this._0={};b=this._2=b||{};b.scrollTime=b.scrollTime||this.klass.SCROLL_TIME;b.pushFade=b.pushFade||this.klass.PUSH_FADE_TIME;b.pushSlide=b.pushSlide||this.klass.PUSH_SLIDE_TIME;b.direction=b.direction||this.klass.DIRECTION;b.easing=b.easing||this.klass.EASING;b.looped=!!b.looped;b.infinite=!!b.infinite;this.setState('CREATED')},getInitialState:function(){return{page:1}},changeState:function(a,b,c){if(a.page!==undefined)this._d(a.page,b,c);return this},getHTML:function(){var a=this._0,b=this._2;if(a._7)return a._7;var c=Ojay(Ojay.HTML.div({className:this.klass.CONTAINER_CLASS}));c.addClass(this._2.direction);var e=b.width,d=b.height,f;if(b.rows||b.columns){f=this.getItems();if(b.rows)d=(b.rows*f.getHeight())+'px';if(b.columns)e=(b.columns*f.getWidth())+'px'}c.setStyle({width:e,height:d,overflow:'hidden',padding:'0 0 0 0',border:'none',position:'relative'});return a._7=c},getDirection:function(){return this._2.direction},isLooped:function(){return!!this._2.looped||!!this._2.infinite},getContainer:function(){return this.getHTML()},getSubject:function(){return this._0._5||undefined},getRegion:function(){if(!this._0._7)return undefined;return this._0._7.getRegion()},getTotalOffset:function(){var a=(this._2.direction=='vertical')?'getHeight':'getWidth';return this.getRegion()[a]()*(this._1-1)},getCurrentOffset:function(){return this._n},getItems:function(){var a=this._0;if(!a._5)return undefined;if(a._3)return a._3;a._3=a._5.children(this._2.selector);a._3.setStyle({margin:'0 0 0 0'});return a._3},getPages:function(){if(this._1)return this._1;var a=this.getItems();if(!a)return undefined;if(a.length===0)return 0;var b=this.getRegion(),c=a.at(0).getRegion();this._o=c.getWidth();this._p=c.getHeight();this._e=(b.getHeight()/this._p).floor()||1;this._f=(b.getWidth()/this._o).floor()||1;this._b=this._f*this._e;this._1=(a.length/this._b).ceil();if(this._2.grouping!==false)this._q();return this._1},_q:function(){var e=this.getRegion(),d=e.getWidth(),f=e.getHeight(),g=this._b,i=this._0._3.toArray();this._0._6=[];this._1.times(function(a){var b=i.slice(a*g,(a+1)*g);var c=this.klass.makePageElement(d,f);b.forEach(c.method('insert'));this._0._6.push(c);this._0._5.insert(c.node)},this);this._i=this.klass.makePageElement(d,f)},getCurrentPage:function(){return this._4||undefined},pageForItem:function(a){if(!this._1)return undefined;var b=this._0._3.length;if(a<1||a>b)return undefined;return((a-1)/this._b).floor()+1},addControls:function(a){if(this.inState('CREATED')||!/^(?:before|after)$/.test(a))return undefined;var b=new this.klass.Controls(this);this.getContainer().insert(b.getHTML().node,a);return b},states:{CREATED:{setup:function(){var a=this._0._5=Ojay(this._m).at(0);if(!a.node)return this;var b=this.getHTML();a.insert(b.node,'after');b.insert(a.node);a.setStyle({padding:'0 0 0 0',border:'none',position:'absolute',left:0,right:0});var c=this._1=this.getPages(),e=this.getRegion();var d=(this._2.direction=='vertical')?{width:e.getWidth()+'px',height:(c*e.getHeight()+1000)+'px'}:{width:(c*e.getWidth()+1000)+'px',height:e.getHeight()+'px'};a.setStyle(d);var f=this.getInitialState();this.setState('READY');if(this._4===undefined)this._4=f.page;this._d(this._4);return this},setPage:function(a){this._4=Number(a);return this}},READY:{setPage:function(a,b,c){a=Number(a);if(this._2.looped&&a<1)a+=this._1;if(this._2.looped&&a>this._1)a-=this._1;if(!this.isLooped()&&(a==this._4||a<1||a>this._1))return this;this.changeState({page:a},b,c);return this},_d:function(a,b,c){this.setScroll(this.getTotalOffset()*(a-1)/(this._1-1),{animate:true},b,c)},incrementPage:function(){var a=this._2.infinite&&(this._4==this._1),b=this._0._6[0];if(a)this._0._5.insert(b,'bottom').insert(this._i,'top');return this.setPage(this._4+1,function(){if(!a)return;this._i.remove();this._0._5.insert(b,'top');this.setScroll(0,{animate:false,silent:true})},this)},decrementPage:function(){var a=this._2.infinite&&(this._4==1),b=(this._2.direction=='vertical')?'marginTop':'marginLeft',c=this._0._6[this._1-1],e={};if(a){this._0._5.insert(c,'top');e[b]=(-this.getTotalOffset()/(this._1-1))+'px';this._0._5.setStyle(e)}return this.setPage(this._4-1,function(){if(!a)return;this._0._5.insert(c,'bottom');e[b]=0;this._0._5.setStyle(e);this.setScroll(1,{animate:false,silent:true})},this)},snapToPage:function(a){this.setScroll((this._4-1)/(this._1-1),{animate:a!==false,silent:true});return this},focusItem:function(a){var b=this.pageForItem(a);if(!b)return this;var c=this._0._3.at(a-1);this.notifyObservers('focusitem',a,c);this.setPage(b);this._0._3.removeClass('focused');c.addClass('focused');return this},setScroll:function(b,c,e,d){var c=c||{},f=this._2.direction,g=c._r||this._2.scrollTime,i=this._1,h=this.getTotalOffset(),j=new JS.MethodChain(),m;if(b>=0&&b<=1)b=b*h;this._0._3.removeClass('focused');c=c||{};if(c.animate&&YAHOO.util.Anim){this.setState('SCROLLING');m=(f=='vertical')?{top:{to:-b}}:{left:{to:-b}};this._0._5.animate(m,g,{easing:this._2.easing})._(function(a){a.setState('READY');j.fire(d||a);if(e)e.call(d||null)},this)}else{m=(f=='vertical')?{top:(-b)+'px'}:{left:(-b)+'px'};this._0._5.setStyle(m)}var k=b/h;if(k<0)k=1;if(k>1)k=0;this._n=b;if(!c.silent)this.notifyObservers('scroll',k,h);var l=(i*k).ceil()||1;if(l!=this._4){this._4=l;this.notifyObservers('pagechange',l);if(l==1)this.notifyObservers('firstpage');if(l==i)this.notifyObservers('lastpage')}return(c.animate&&YAHOO.util.Anim)?j:this},push:function(a,b){b=(b===undefined)?this._1-1:b;var c=(b===this._1-1);if(c)this._c();a=Ojay(a).setStyle({margin:'0 0 0 0'});var e=this._0._6[c?this._1-1:b];e.insert(a,'bottom');this.notifyObservers('itemadd');var d=this._0._3;if(c)[].push.call(d,a.node);return this},pop:function(b){b=(b===undefined)?this._1-1:b;var c=(b===this._1-1);var e=this._0._6[b],d=Ojay(e.children().toArray().pop());this.notifyObservers('itemremove');if(!c)return d.remove();this._0._3=this._0._3.filter(function(a){return a.node!==d.node});if(c)this._c();return d.remove()},shift:function(b){b=(b===undefined)?0:b;var c=(b===0);var e=this._0._6[b],d=e.children().at(0);this.notifyObservers('itemremove');if(!c)return d.remove();for(var f=1;f<this._1;f++)this.push(this.shift(f),f-1);this._0._3=this._0._3.filter(function(a){return a.node!==d.node});this._c();return d.remove()},unshift:function(a,b){if(typeof b=='object'&&b.animate)return this._s(a);b=(b===undefined)?0:b;var c=(b===0);if(c)this._c();a=Ojay(a).setStyle({margin:'0 0 0 0'});var e=this._0._6[b];e.insert(a,'top');this.notifyObservers('itemadd');if(!c)return this;for(var d=1;d<this._1;d++)this.unshift(this.pop(d-1),d);var f=this._0._3;[].unshift.call(f,a.node);return this},_s:function(a){if((this._2.direction=='vertical'&&this._f>1)||(this._2.direction=='horizontal'&&this._e>1))throw new Error('Cannot perform animated push/unshift onto a Paginator with more than one column and row');var b=Ojay(a).setStyle({opacity:0});var c=this.getCurrentOffset(),e=(this._2.direction=='vertical')?this._e:this._f,d=c-this.getTotalOffset()/(e*(this.getPages()-1));return this.setScroll(d,{animate:true,_r:this._2.pushSlide}).unshift(b).setScroll(c)._(b).animate({opacity:{to:1}},this._2.pushFade)._(this)},_c:function(){var a=this._0._3.length,b=this._1,c=this._b,e=b*c;if(a==e)this._t();if(a==e-c)this._u()},_t:function(){var a=this.getRegion(),b=this.klass.makePageElement(a.getWidth(),a.getHeight());this._0._5.insert(b,'bottom');this._0._6.push(b);this._1+=1;var c=(this._4-1)/(this._1-1);this.notifyObservers('pagecreate');this.notifyObservers('scroll',c,this.getTotalOffset())},_u:function(){this._0._6.pop().remove();if(this._4==this._1){this._4-=1;this.notifyObservers('pagechange',this._4)}this._1-=1;var a=(this._4-1)/(this._1-1);if(a==1)this.setScroll(1,{animate:true,silent:true});this.notifyObservers('pagedestroy');this.notifyObservers('scroll',a,this.getTotalOffset())}},SCROLLING:{}}});Ojay.AjaxPaginator=new JS.Class('Ojay.AjaxPaginator',Ojay.Paginator,{initialize:function(b,c){this.callSuper();this._2.urls=this._2.urls.map(function(a){return{_g:a,_j:false}})},getItems:function(){var c=this._0;if(c._3)return c._3;if(!c._5)return undefined;var e=this._2.urls;if(!e.length)return undefined;e.length.times(function(a){var b=Ojay(Ojay.HTML.div({className:this.klass.ITEM_CLASS}));c._5.insert(b.node,'bottom')},this);var d=this.callSuper();d.fitToRegion(this.getRegion());return d},pageLoaded:function(a){return!!(this._2.urls[a-1]||{})._j},loadPage:function(b,c,e){if(this.pageLoaded(b)||this.inState('CREATED'))return this;var d=this._2.urls[b-1],f=this;this.notifyObservers('pagerequest',d._g);Ojay.HTTP.GET(d._g,{},{onSuccess:function(a){a.insertInto(f._0._3.at(b-1));d._j=true;f.notifyObservers('pageload',d._g,a);if(typeof c=='function')c.call(e||null)}});return this},states:{READY:{_d:function(a){var b=this._2.urls.length;if(a>b)a-=b;if(a<1)a+=b;if(this.pageLoaded(a))return this.callSuper();var c=this.method('callSuper');this.setState('REQUESTING');this.loadPage(a,function(){this.setState('READY');c()},this)}},REQUESTING:{}}});Ojay.Paginator.extend({Controls:new JS.Class('Ojay.Paginator.Controls',{extend:{CONTAINER_CLASS:'paginator-controls',PREVIOUS_CLASS:'previous',NEXT_CLASS:'next',PAGE_LINKS_CLASS:'pages'},initialize:function(a){this._8=a;this._0={};this._8.on('pagecreate')._(this)._v();this._8.on('pagedestroy')._(this)._w()},getHTML:function(){if(this._8.inState('CREATED'))return null;var d=this._0,f=this.klass,g=this._8;if(d._7)return d._7;var i=this;d._7=Ojay(Ojay.HTML.div({className:f.CONTAINER_CLASS},function(e){d._a=Ojay(e.div({className:f.PREVIOUS_CLASS},'Previous'));d._h=Ojay(e.div({className:f.PAGE_LINKS_CLASS},function(c){d._6=[];g.getPages().times(function(a){var b=d._6[a]=i._k(a+1);c.concat(b.node)})}));d._9=Ojay(e.div({className:f.NEXT_CLASS},'Next'))}));d._a.on('click')._(g).decrementPage();d._9.on('click')._(g).incrementPage();d._h.on('click',Ojay.delegateEvent({span:function(a,b){g.setPage(a.node.innerHTML)}}));var h=[d._a,d._9];h.forEach(it().on('mouseover').addClass('hovered'));h.forEach(it().on('mouseout').removeClass('hovered'));g.on('pagechange',function(a,b){this._l(b);h.forEach(it().removeClass('disabled'))},this);var j=g.getCurrentPage();this._l(j);if(!g.isLooped()){g.on('firstpage')._(d._a).addClass('disabled');g.on('lastpage')._(d._9).addClass('disabled');if(j==1)d._a.addClass('disabled');if(j==g.getPages())d._9.addClass('disabled')}d._7.addClass(g.getDirection());return d._7},_k:function(a){var b=Ojay(Ojay.HTML.span(String(a)));b.on('mouseover').addClass('hovered');b.on('mouseout').removeClass('hovered');return b},_v:function(){var a=this._k(this._8.getPages());this._0._6.push(a);this._0._h.insert(a,'bottom');this._0._9.removeClass('disabled')},_w:function(){this._0._6.pop().remove();var a=this._8;if(a.isLooped())return;if(a.getCurrentPage()==a.getPages())this._0._9.addClass('disabled')},_l:function(a){this._0._6.forEach({removeClass:'selected'});this._0._6[a-1].addClass('selected')},getPreviousButton:function(){if(this._8.inState('CREATED'))return null;return this._0._a},getNextButton:function(){if(this._8.inState('CREATED'))return null;return this._0._9},getPageButtons:function(){if(this._8.inState('CREATED'))return null;return this._0._h}})});