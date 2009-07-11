/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
Version: master-7bf74da460c9904c4a2bacfa7d728df9748fb7d2
Build:   source
*/

/**
 * <p>The <tt>Paginator</tt> class is used to replace large blocks of content with a smaller,
 * scrollable area with an API for controlling the area. The content will typically be made up
 * of series of items of the same size that can be grouped into pages. For example, an image
 * gallery could be set up as a series of floated divs or a list...</p>
 *
 *     &lt;div id="gallery"&gt;
 *         &lt;div class="item"&gt;&lt;img src="01.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="02.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="03.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="04.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="05.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="06.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="07.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="08.jpg" /&gt;&lt;/div&gt;
 *     &lt;/div&gt;
 *
 * <p>A <tt>Paginator</tt>, when applied to <tt>#gallery</tt>, will wrap its child elements in
 * a scrollable element that can be controlled using the <tt>Paginator</tt> API. So, your markup
 * will now look like:</p>
 *
 *     &lt;div class="paginator"&gt;
 *         &lt;div id="gallery"&gt;
 *             &lt;div class="page"&gt;
 *                 &lt;div class="item"&gt;&lt;img src="01.jpg" /&gt;&lt;/div&gt;
 *                 &lt;div class="item"&gt;&lt;img src="02.jpg" /&gt;&lt;/div&gt;
 *                 &lt;div class="item"&gt;&lt;img src="03.jpg" /&gt;&lt;/div&gt;
 *             &lt;/div&gt;
 *             &lt;div class="page"&gt;
 *                 &lt;div class="item"&gt;&lt;img src="04.jpg" /&gt;&lt;/div&gt;
 *                 &lt;div class="item"&gt;&lt;img src="05.jpg" /&gt;&lt;/div&gt;
 *                 &lt;div class="item"&gt;&lt;img src="06.jpg" /&gt;&lt;/div&gt;
 *             &lt;/div&gt;
 *             &lt;div class="page"&gt;
 *                 &lt;div class="item"&gt;&lt;img src="07.jpg" /&gt;&lt;/div&gt;
 *                 &lt;div class="item"&gt;&lt;img src="08.jpg" /&gt;&lt;/div&gt;
 *             &lt;/div&gt;
 *         &lt;/div&gt;
 *     &lt;/div&gt;
 *
 * <p>The outer element is referred to as the 'container', and the inner element the 'subject'.
 * <tt>Paginator</tt> objects publish a number of events -- they are as follows:</p>
 *
 * <ul>
 *      <li><tt>pagechange</tt> - when the current page number changes</li>
 *      <li><tt>scroll</tt> when any scrolling takes place</li>
 *      <li><tt>firstpage</tt> - when the paginator reaches the first page</li>
 *      <li><tt>lastpage</tt> - when the paginator reaches the last page</li>
 *      <li><tt>focusitem</tt> - when <tt>focusItem()</tt> is called</li>
 * </ul>
 *
 * <p>See the website for further documentation and graphical examples.</p> 
 *
 * @constructor
 * @class Paginator
 */
Ojay.Paginator = new JS.Class('Ojay.Paginator', /** @scope Ojay.Paginator.prototype */{
    include: [Ojay.Observable, JS.State],
    
    extend: /** @scope Ojay.Paginator */{
        CONTAINER_CLASS:    'paginator',
        PAGE_CLASS:         'page',
        ITEM_CLASS:         'item',
        SCROLL_TIME:        0.5,
        PUSH_FADE_TIME:     0.7,
        PUSH_SLIDE_TIME:    0.3,
        DIRECTION:          'horizontal',
        EASING:             'easeBoth',
        
        /**
         * @param {Number} width
         * @param {Number} height
         * @returns {DomCollection}
         */
        makePageElement: function(width, height) {
            var div = Ojay( Ojay.HTML.div({className: this.PAGE_CLASS}) );
            div.setStyle({
                'float': 'left', width: width + 'px', height: height + 'px',
                margin: '0 0 0 0', padding: '0 0 0 0', border: 'none'
            });
            return div;
        }
    },
    
    /**
     * <p>To initialize, the <tt>Paginator</tt> instance needs a CSS selector and some configuration
     * options. Available options are:</p>
     *
     * <ul>
     *      <li><tt>width</tt> - the width as a string, in any units, e.g. '512px'. Required.</li>
     *      <li><tt>height</tt> - the height as a string, in any units, e.g. '512px'. Required.</li>
     *      <li><tt>scrollTime</tt> - the duration of the scoll effect in seconds. Optional.</li>
     *      <li><tt>easing</tt> - sets the name of the easing effect to use. Optional.</li>
     *      <li><tt>direction</tt> - 'horizontal' or 'vertical', sets scroll direction. Required.</li>
     * </ul>
     *
     * @param {String|HTMLElement|DomCollection} subject
     * @param {Object} options
     */
    initialize: function(subject, options) {
        this._selector = subject;
        this._elements = {};
        
        options = this._options = options || {};
        options.scrollTime = options.scrollTime || this.klass.SCROLL_TIME;
        options.pushFade   = options.pushFade   || this.klass.PUSH_FADE_TIME;
        options.pushSlide  = options.pushSlide  || this.klass.PUSH_SLIDE_TIME;
        options.direction  = options.direction  || this.klass.DIRECTION;
        options.easing     = options.easing     || this.klass.EASING;
        options.looped     = !!options.looped;
        options.infinite   = !!options.infinite;
        
        this.setState('CREATED');
    },
    
    /**
     * @returns {Object}
     */
    getInitialState: function() {
        return {page: 1};
    },
    
    /**
     * @param {Object} state
     * @param {Function} callback
     * @param {Object} scope
     * @returns {Paginator}
     */
    changeState: function(state, callback, scope) {
        if (state.page !== undefined) this._handleSetPage(state.page, callback, scope);
        return this;
    },
    
    /**
     * <p>Returns an Ojay collection wrapping all the HTML used by the paginator.</p>
     * @returns {DomCollection}
     */
    getHTML: function() {
        var elements = this._elements, options = this._options;
        if (elements._container) return elements._container;
        var container = Ojay( Ojay.HTML.div({className: this.klass.CONTAINER_CLASS}) );
        container.addClass(this._options.direction);
        
        var width = options.width, height = options.height, items;
        if (options.rows || options.columns) {
            items = this.getItems();
            if (options.rows) height = (options.rows * items.getHeight()) + 'px';
            if (options.columns) width = (options.columns * items.getWidth()) + 'px';
        }
        
        container.setStyle({
            width:      width,
            height:     height,
            overflow:   'hidden',
            padding:    '0 0 0 0',
            border:     'none',
            position:   'relative'
        });
        return elements._container = container;
    },
    
    /**
     * <p>Returns the direction of the paginator.</p>
     * @returns {String}
     */
    getDirection: function() {
        return this._options.direction;
    },
    
    /**
     * <p>Returns a boolean to indicate whether the paginator loops.</p>
     * @returns {Boolean}
     */
    isLooped: function() {
        return !!this._options.looped || !!this._options.infinite;
    },
    
    /**
     * <p>Returns an Ojay collection wrapping the wrapper element added to your document to
     * contain the original content element and let it slide.</p>
     * @returns {DomCollection}
     */
    getContainer: function() {
        return this.getHTML();
    },
    
    /**
     * <p>Returns an Ojay collection wrapping the sliding element, i.e. the element you specify
     * when creating the <tt>Paginator</tt> instance.</p>
     * @returns {DomCollection}
     */
    getSubject: function() {
        return this._elements._subject || undefined;
    },
    
    /**
     * <p>Returns a <tt>Region</tt> object representing the area of the document occupied by
     * the <tt>Paginator</tt>'s container element.</p>
     * @returns {Region}
     */
    getRegion: function() {
        if (!this._elements._container) return undefined;
        return this._elements._container.getRegion();
    },
    
    /**
     * @returns {Number}
     */
    getTotalOffset: function() {
        var method = (this._options.direction == 'vertical') ? 'getHeight' : 'getWidth';
        return this.getRegion()[method]() * (this._numPages - 1);
    },
    
    /**
     * @returns {Number}
     */
    getCurrentOffset: function() {
        return this._reportedOffset;
    },
    
    /**
     * <p>Returns an Ojay collection wrapping the child elements of the subject.</p>
     * @returns {DomCollection}
     */
    getItems: function() {
        var elements = this._elements;
        if (!elements._subject) return undefined;
        if (elements._items) return elements._items;
        elements._items = elements._subject.children(this._options.selector);
        elements._items.setStyle({margin: '0 0 0 0'});
        return elements._items;
    },
    
    /**
     * <p>Returns the number of pages of content the <tt>Paginator</tt> has.</p>
     * @returns {Number}
     */
    getPages: function() {
        if (this._numPages) return this._numPages;
        var items = this.getItems();
        if (!items) return undefined;
        if (items.length === 0) return 0;
        var containerRegion = this.getRegion(), itemRegion = items.at(0).getRegion();
        this._itemWidth     = itemRegion.getWidth();
        this._itemHeight    = itemRegion.getHeight();
        this._itemsPerCol   = (containerRegion.getHeight() / this._itemHeight).floor() || 1;
        this._itemsPerRow   = (containerRegion.getWidth() / this._itemWidth).floor() || 1;
        this._itemsPerPage  = this._itemsPerRow * this._itemsPerCol;
        this._numPages = (items.length / this._itemsPerPage).ceil();
        if (this._options.grouping !== false) this._groupItemsByPage();
        return this._numPages;
    },
    
    /**
     * <p>Splits the list of item elements into groups by page, and wraps each group of items
     * in a <tt>div</tt> that represents the page. This allows horizontal galleries to avoid
     * stringing all the items onto one row.</p>
     */
    _groupItemsByPage: function() {
        var containerRegion = this.getRegion(),
            width           = containerRegion.getWidth(),
            height          = containerRegion.getHeight(),
            n               = this._itemsPerPage,
            allItems        = this._elements._items.toArray();
        
        this._elements._pages = [];
        
        this._numPages.times(function(i) {
            var items = allItems.slice(i * n, (i+1) * n);
            var div = this.klass.makePageElement(width, height);
            items.forEach(div.method('insert'));
            this._elements._pages.push(div);
            this._elements._subject.insert(div.node);
        }, this);
        
        this._dummyPage = this.klass.makePageElement(width, height);
    },
    
    /**
     * <p>Returns the number of the current page, numbered from 1.</p>
     * @returns {Number}
     */
    getCurrentPage: function() {
        return this._currentPage || undefined;
    },
    
    /**
     * <p>Returns the page number containing the nth child element. Pages and items are
     * both numbered from 1 upwards.</p>
     * @param {Number} id
     * @returns {Number}
     */
    pageForItem: function(id) {
        if (!this._numPages) return undefined;
        var n = this._elements._items.length;
        if (id < 1 || id > n) return undefined;
        return ((id - 1) / this._itemsPerPage).floor() + 1;
    },
    
    /**
     * <p>Places a default set of UI controls before or after the <tt>Paginator</tt> in the
     * document and returns a <tt>Paginator.Controls</tt> instance representing this UI.</p>
     * @returns {Paginator.Controls}
     */
    addControls: function(position) {
        if (this.inState('CREATED') || !/^(?:before|after)$/.test(position)) return undefined;
        var controls = new this.klass.Controls(this);
        this.getContainer().insert(controls.getHTML().node, position);
        return controls;
    },
    
    states: {
        /**
         * <p>The <tt>Paginator</tt> is in the CREATED state when it has been instantiated but
         * none of its DOM interactions have taken place. This attachment is deferred to the
         * <tt>setup()</tt> call so that object can be history-managed before its UI is set up.</p>
         */
        CREATED: /** @scope Ojay.Paginator.prototype */{
            /**
             * <p>Sets up all the DOM changes the <tt>Paginator</tt> needs. If you want to history
             * manage the object, make sure you set up history management before calling this method.
             * Moves the object to the READY state if successful.</p>
             * @returns {Paginator}
             */
            setup: function() {
                var subject = this._elements._subject = Ojay(this._selector).at(0);
                if (!subject.node) return this;
                
                var container = this.getHTML();
                subject.insert(container.node, 'after');
                container.insert(subject.node);
                subject.setStyle({padding: '0 0 0 0', border: 'none', position: 'absolute', left: 0, right: 0});
                
                var pages = this._numPages = this.getPages(), region = this.getRegion();
                
                var style = (this._options.direction == 'vertical')
                        ? { width: region.getWidth() + 'px', height: (pages * region.getHeight() + 1000) + 'px' }
                        : { width: (pages * region.getWidth() + 1000) + 'px', height: region.getHeight() + 'px' };
                
                subject.setStyle(style);
                
                var state = this.getInitialState();
                this.setState('READY');
                if (this._currentPage === undefined) this._currentPage = state.page;
                this._handleSetPage(this._currentPage);
                
                return this;
            },
            
            /**
             * <p>Sets the initial page for the paginator to start at when in the CREATED
             * state. No scrolling takes place, and the number set will override the initial
             * page setting and any setting pulled in by the history manager.</p>
             * @param {Number} page
             * @returns {Paginator}
             */
            setPage: function(page) {
                this._currentPage = Number(page);
                return this;
            }
        },
        
        /**
         * <p>The <tt>Paginator</tt> is in the READY state when all its DOM behaviour has been
         * set up and it is not in the process of scrolling.</p>
         */
        READY: /** @scope Ojay.Paginator.prototype */{
            /**
             * <p>Sets the current page of the <tt>Paginator</tt> by scrolling the subject
             * element. Will fire a <tt>pagechange</tt> event if the page specified is not
             * equal to the current page.</p>
             * @param {Number} page
             * @param {Function} callback
             * @param {Object} scope
             * @returns {Paginator}
             */
            setPage: function(page, callback, scope) {
                page = Number(page);
                if (this._options.looped && page < 1) page += this._numPages;
                if (this._options.looped && page > this._numPages) page -= this._numPages;
                if (!this.isLooped() && (page == this._currentPage || page < 1 || page > this._numPages)) return this;
                this.changeState({page: page}, callback, scope);
                return this;
            },
            
            /**
             * <p>Handles request to <tt>changeState()</tt>.</p>
             * @param {Number} page
             * @param {Function} callback
             * @param {Object} scope
             */
            _handleSetPage: function(page, callback, scope) {
                this.setScroll(this.getTotalOffset() * (page - 1) / (this._numPages - 1), {animate: true}, callback, scope);
            },
            
            /**
             * <p>Increments the current page by one, firing a <tt>pagechange</tt> event.</p>
             * @returns {Paginator}
             */
            incrementPage: function() {
                var wrapping  = this._options.infinite && (this._currentPage == this._numPages),
                    firstPage = this._elements._pages[0];
                
                if (wrapping)
                    this._elements._subject
                      .insert(firstPage, 'bottom')
                      .insert(this._dummyPage, 'top');
                
                return this.setPage(this._currentPage + 1, function() {
                    if (!wrapping) return;
                    this._dummyPage.remove();
                    this._elements._subject.insert(firstPage, 'top');
                    this.setScroll(0, {animate: false, silent: true});
                }, this);
            },
            
            /**
             * <p>Decrements the current page by one, firing a <tt>pagechange</tt> event.</p>
             * @returns {Paginator}
             */
            decrementPage: function() {
                var wrapping = this._options.infinite && (this._currentPage == 1),
                    property = (this._options.direction == 'vertical') ? 'marginTop' : 'marginLeft',
                    lastPage = this._elements._pages[this._numPages - 1],
                    settings = {};
                
                if (wrapping) {
                    this._elements._subject.insert(lastPage, 'top');
                    settings[property] = (-this.getTotalOffset() / (this._numPages - 1)) + 'px';
                    this._elements._subject.setStyle(settings);
                }
                
                return this.setPage(this._currentPage - 1, function() {
                    if (!wrapping) return;
                    this._elements._subject.insert(lastPage, 'bottom');
                    settings[property] = 0;
                    this._elements._subject.setStyle(settings);
                    this.setScroll(1, {animate: false, silent: true});
                }, this);
            },
            
            /**
             * <p>Snaps the scroll offset of the <tt>Paginator</tt> to that of the current
             * page. The optional <tt>animate</tt> parameter, if set to <tt>false</tt>, will
             * prevent animation.</p>
             * @param {Boolean} animate
             * @returns {Paginator}
             */
            snapToPage: function(animate) {
                this.setScroll((this._currentPage - 1) / (this._numPages - 1),
                        {animate: animate !== false, silent: true});
                return this;
            },
            
            /**
             * <p>Scrolls to the page for the given item (numbered from 1) and adds a class
             * off <tt>focused</tt> to that item's element.</p>
             * @param {Number} id
             * @returns {Paginator}
             */
            focusItem: function(id) {
                var page = this.pageForItem(id);
                if (!page) return this;
                var element = this._elements._items.at(id - 1);
                this.notifyObservers('focusitem', id, element);
                this.setPage(page);
                this._elements._items.removeClass('focused');
                element.addClass('focused');
                return this;
            },
            
            /**
             * <p>Sets the scroll offset of the subject element. If <tt>amount</tt> is between
             * 0 and 1, it is taken as a fraction of the total offset. If it is greater than 1,
             * it is taken as an absolute pixel value. The options hash may specify <tt>animate</tt>,
             * to say whether the scroll move should be animated, and <tt>silent</tt>, which if
             * set to <tt>true</tt> will prevent any <tt>scroll</tt> events from firing.</p>
             * @param {Number} amount
             * @param {Object} options
             * @param {Function} callback
             * @param {Object} scope
             * @returns {Paginator}
             */
            setScroll: function(amount, options, callback, scope) {
                var options     = options || {},
                    orientation = this._options.direction,
                    scrollTime  = options._scrollTime || this._options.scrollTime,
                    pages       = this._numPages,
                    total       = this.getTotalOffset(),
                    chain       = new JS.MethodChain(),
                    settings;
                
                if (amount >= 0 && amount <= 1) amount = amount * total;
                
                this._elements._items.removeClass('focused');
                options = options || {};
                
                if (options.animate && YAHOO.util.Anim) {
                    this.setState('SCROLLING');
                    settings = (orientation == 'vertical')
                            ? { top: {to: -amount} }
                            : { left: {to: -amount} };
                    this._elements._subject.animate(settings,
                        scrollTime, {easing: this._options.easing})._(function(self) {
                        self.setState('READY');
                        chain.fire(scope || self);
                        if (callback) callback.call(scope || null);
                    }, this);
                } else {
                    settings = (orientation == 'vertical')
                            ? { top: (-amount) + 'px' }
                            : { left: (-amount) + 'px' };
                    this._elements._subject.setStyle(settings);
                }
                
                var reportedOffset = amount/total;
                if (reportedOffset < 0) reportedOffset = 1;
                if (reportedOffset > 1) reportedOffset = 0;
                this._reportedOffset = amount;
                
                if (!options.silent) this.notifyObservers('scroll', reportedOffset, total);
                
                var page = (pages * reportedOffset).ceil() || 1;
                if (page != this._currentPage) {
                    this._currentPage = page;
                    this.notifyObservers('pagechange', page);
                    
                    if (page == 1) this.notifyObservers('firstpage');
                    if (page == pages) this.notifyObservers('lastpage');
                }
                
                return (options.animate && YAHOO.util.Anim) ? chain : this;
            },
            
            /**
             * <p>Pushes a new element onto the end of the list of elements contained in the
             * <tt>Paginator</tt>, creating a new page and firing the <tt>pagecreate</tt>
             * event if necessary. The <tt>n</tt> parameter is for internal use only, for when
             * items need to be moved across page boundaries by <tt>shift</tt>/<tt>unshift</tt>
             * operations.</p>
             * @param {HTMLElement} element
             * @param {Number} n
             * @returns {Paginator}
             */
            push: function(element, n) {
                n = (n === undefined) ? this._numPages - 1 : n;
                var last = (n === this._numPages - 1);
                if (last) this._checkPages();
                
                element = Ojay(element).setStyle({margin: '0 0 0 0'});
                var page = this._elements._pages[last ? this._numPages - 1 : n];
                
                page.insert(element, 'bottom');
                this.notifyObservers('itemadd');
                
                var items = this._elements._items;
                if (last) [].push.call(items, element.node);
                
                return this;
            },
            
            /**
             * <p>Removes the final item from the final page of the <tt>Paginator</tt>. If
             * the final page subsequently contains no items, it is removed and a
             * <tt>pagedestroy</tt> event is fired. The <tt>n</tt> parameter is for internal
             * use only, for when items need to be moved across page boundaries by
             * <tt>shift</tt>/<tt>unshift</tt> operations.</p>
             * @param {Number} n
             * @returns {DomCollection}
             */
            pop: function(n) {
                n = (n === undefined) ? this._numPages - 1 : n;
                var last = (n === this._numPages - 1);
                
                var page = this._elements._pages[n],
                    item = Ojay(page.children().toArray().pop());
                
                this.notifyObservers('itemremove');
                if (!last) return item.remove();
                
                this._elements._items = this._elements._items.filter(function(member) {
                    return member.node !== item.node;
                });
                if (last) this._checkPages();
                
                return item.remove();
            },
            
            /**
             * <p>Removes the first item from the first page of the <tt>Paginator</tt>. If
             * the final page subsequently contains no items, it is removed and a
             * <tt>pagedestroy</tt> event is fired. The <tt>n</tt> parameter is for internal
             * use only, for when items need to be moved across page boundaries by
             * <tt>shift</tt>/<tt>unshift</tt> operations.</p>
             * @param {Number} n
             * @returns {DomCollection}
             */
            shift: function(n) {
                n = (n === undefined) ? 0 : n;
                var first = (n === 0);
                var page = this._elements._pages[n],
                    item = page.children().at(0);
                
                this.notifyObservers('itemremove');
                if (!first) return item.remove();
                
                for (var i = 1; i < this._numPages; i++)
                    this.push(this.shift(i), i-1);
                
                this._elements._items = this._elements._items.filter(function(member) {
                    return member.node !== item.node;
                });
                this._checkPages();
                
                return item.remove();
            },
            
            /**
             * <p>Pushes a new element onto the start of the list of elements contained in the
             * <tt>Paginator</tt>, creating a new page and firing the <tt>pagecreate</tt>
             * event if necessary. The <tt>n</tt> parameter is for internal use only, for when
             * items need to be moved across page boundaries by <tt>shift</tt>/<tt>unshift</tt>
             * operations.</p>
             * @param {HTMLElement} element
             * @param {Number} n
             * @returns {Paginator}
             */
            unshift: function(element, n) {
                if (typeof n == 'object' && n.animate) return this._animatedUnshift(element);
                
                n = (n === undefined) ? 0 : n;
                var first = (n === 0);
                if (first) this._checkPages();
                
                element = Ojay(element).setStyle({margin: '0 0 0 0'});
                var page = this._elements._pages[n];
                
                page.insert(element, 'top');
                this.notifyObservers('itemadd');
                if (!first) return this;
                
                for (var i = 1; i < this._numPages; i++)
                    this.unshift(this.pop(i-1), i);
                
                var items = this._elements._items;
                [].unshift.call(items, element.node);
                
                return this;
            },
            
            /**
             * @returns {MethodChain}
             */
            _animatedUnshift: function(element) {
                if ((this._options.direction == 'vertical' && this._itemsPerRow > 1) ||
                    (this._options.direction == 'horizontal' && this._itemsPerCol > 1))
                    throw new Error('Cannot perform animated push/unshift ' +
                                    'onto a Paginator with more than one ' +
                                    'column and row');
                
                var item = Ojay(element).setStyle({opacity: 0});
                
                var current = this.getCurrentOffset(),
                    
                    nItems  = (this._options.direction == 'vertical') ?
                              this._itemsPerCol : this._itemsPerRow,
                    
                    offset  = current - this.getTotalOffset() /
                              (nItems * (this.getPages() - 1));
                
                return this.setScroll(offset, {animate: true, _scrollTime: this._options.pushSlide})
                     .unshift(item)
                     .setScroll(current)
                     ._(item).animate({opacity: {to: 1}}, this._options.pushFade)
                     ._(this);
            },
            
            /**
             * <p>Used by the <tt>push</tt>, <tt>pop</tt>, <tt>shift</tt> and <tt>unshift</tt>
             * operations to decide whether pages need to be created or destroyed.</p>
             */
            _checkPages: function() {
                var items   = this._elements._items.length,
                    pages   = this._numPages,
                    perPage = this._itemsPerPage,
                    total   = pages * perPage;
                
                if (items == total) this._createPage();
                if (items == total - perPage) this._destroyPage();
            },
            
            /**
             * <p>Adds a new page at the end of the <tt>Paginator</tt>, firing the
             * <tt>pagecreate</tt> and <tt>scroll</tt> events.</p>
             */
            _createPage: function() {
                var region = this.getRegion(),
                    page = this.klass.makePageElement(region.getWidth(), region.getHeight());
                this._elements._subject.insert(page, 'bottom');
                this._elements._pages.push(page);
                
                this._numPages += 1;
                var offset = (this._currentPage - 1) / (this._numPages - 1);
                this.notifyObservers('pagecreate');
                this.notifyObservers('scroll', offset, this.getTotalOffset());
            },
            
            /**
             * <p>Removes the final page of the <tt>Paginator</tt>, firing the
             * <tt>pagedestroy</tt>, <tt>scroll</tt> and (if needed) the
             * <tt>pagechange</tt> events.
             */
            _destroyPage: function() {
                this._elements._pages.pop().remove();
                if (this._currentPage == this._numPages) {
                    this._currentPage -= 1;
                    this.notifyObservers('pagechange', this._currentPage);
                }
                this._numPages -= 1;
                var offset = (this._currentPage - 1) / (this._numPages - 1);
                if (offset == 1) this.setScroll(1, {animate: true, silent: true});
                this.notifyObservers('pagedestroy');
                this.notifyObservers('scroll', offset, this.getTotalOffset());
            }
        },
        
        SCROLLING: {}
    }
});


/**
 * <p>The <tt>AjaxPaginator</tt> class extends the <tt>Paginator</tt> with functionality that
 * allows you to load content for the pages from the server using Ajax. Content is lazy-loaded,
 * which is to say that each page is not loaded until the user selects to view that page.</p>
 * @constructor
 * @class AjaxPaginator
 */
Ojay.AjaxPaginator = new JS.Class('Ojay.AjaxPaginator', Ojay.Paginator, /** @scope Ojay.AjaxPaginator.prototype */{
    /**
     * <p><tt>AjaxPaginator</tt> takes the same initialization data as <tt>Paginator</tt>, but
     * with one extra required option: <tt>urls</tt>. This should be an array of URLs that
     * the paginator will pull content from.</p>
     * @param {String|HTMLElement|DomCollection} subject
     * @param {Object} options
     */
    initialize: function(subject, options) {
        this.callSuper();
        this._options.urls = this._options.urls.map(function(url) {
            return {_url: url, _loaded: false};
        });
    },
    
    /**
     * <p>Returns an Ojay collection wrapping the child elements of the subject.</p>
     * @returns {DomCollection}
     */
    getItems: function() {
        var elements = this._elements;
        if (elements._items) return elements._items;
        if (!elements._subject) return undefined;
        var urls = this._options.urls;
        if (!urls.length) return undefined;
        urls.length.times(function(i) {
            var item = Ojay( Ojay.HTML.div({className: this.klass.ITEM_CLASS}) );
            elements._subject.insert(item.node, 'bottom');
        }, this);
        var items = this.callSuper();
        items.fitToRegion(this.getRegion());
        return items;
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the given page has its content loaded.</p>
     * @param {Number} page
     * @returns {Boolean}
     */
    pageLoaded: function(page) {
        return !!(this._options.urls[page - 1]||{})._loaded;
    },
    
    /**
     * <p>Tells the <tt>AjaxPaginator</tt> to load the content for the given page, if
     * the content is not already loaded. Fires <tt>pagerequest</tt> and
     * <tt>pageload</tt> events.</p>
     * @param {Number} page
     * @param {Function} callback
     * @param {Object} scope
     * @returns {AjaxPaginator}
     */
    loadPage: function(page, callback, scope) {
        if (this.pageLoaded(page) || this.inState('CREATED')) return this;
        var url = this._options.urls[page - 1], self = this;
        this.notifyObservers('pagerequest', url._url);
        Ojay.HTTP.GET(url._url, {}, {
            onSuccess: function(response) {
                response.insertInto(self._elements._items.at(page - 1));
                url._loaded = true;
                self.notifyObservers('pageload', url._url, response);
                if (typeof callback == 'function') callback.call(scope || null);
            }
        });
        return this;
    },
    
    states: {
        READY: {
            /**
             * <p>Handles request to <tt>changeState()</tt>.</p>
             * @param {Number} page
             */
            _handleSetPage: function(page) {
                var n = this._options.urls.length;
                if (page > n) page -= n;
                if (page < 1) page += n;
                
                if (this.pageLoaded(page)) return this.callSuper();
                
                var _super = this.method('callSuper');
                this.setState('REQUESTING');
                this.loadPage(page, function() {
                    this.setState('READY');
                    _super();
                }, this);
            }
        },
        
        REQUESTING: {}
    }
});


/**
 * <p>The <tt>Paginator.Controls</tt> class implements a default UI for <tt>Paginator</tt>
 * instances, which includes previous/next links, individual page links, and event listeners
 * that add class names to the elements in the UI in response to state changes in the
 * observed paginator object.</p>
 * @constructor
 * @class Paginator.Controls
 */
Ojay.Paginator.extend(/** @scope Ojay.Paginator */{
    Controls: new JS.Class('Ojay.Paginator.Controls', /** @scope Ojay.Paginator.Controls.prototype */{
        extend: /** @scope Ojay.Paginator.Controls */{
            CONTAINER_CLASS:    'paginator-controls',
            PREVIOUS_CLASS:     'previous',
            NEXT_CLASS:         'next',
            PAGE_LINKS_CLASS:   'pages'
        },
        
        /**
         * <p>To initialize a <tt>Paginator.Controls</tt> instance, pass in the <tt>Paginator</tt>
         * to which you want the generated UI elements to apply.</p>
         * @param {Paginator}
         */
        initialize: function(paginator) {
            this._paginator = paginator;
            this._elements = {};
            this._paginator.on('pagecreate')._(this)._addPage();
            this._paginator.on('pagedestroy')._(this)._removePage();
        },
        
        /**
         * <p>Returns the collection of HTML elements used to implement the UI. When the
         * elements are first generated, all required event handlers (both DOM and
         * Observable-based) are set up.</p>
         * @returns {DomCollection}
         */
        getHTML: function() {
            if (this._paginator.inState('CREATED')) return null;
            var elements = this._elements, klass = this.klass, paginator = this._paginator;
            if (elements._container) return elements._container;
            var self = this;
            
            elements._container = Ojay( Ojay.HTML.div(
                {className: klass.CONTAINER_CLASS}, function(HTML) {
            
                // Previous button - decrements page
                elements._previous = Ojay( HTML.div(
                        {className: klass.PREVIOUS_CLASS},
                        'Previous') );
                
                // Page buttons - skip to individual pages
                elements._pageLinks = Ojay( HTML.div(
                    {className: klass.PAGE_LINKS_CLASS}, function(HTML) {
                    elements._pages = [];
                    paginator.getPages().times(function(page) {
                        var span = elements._pages[page] = self._makeLink(page+1);
                        HTML.concat(span.node);
                    });
                }) );
                
                // Next button - increments page
                elements._next = Ojay( HTML.div(
                        {className: klass.NEXT_CLASS},
                        'Next') );
            }) );
            
            elements._previous.on('click')._(paginator).decrementPage();
            elements._next.on('click')._(paginator).incrementPage();
            
            // Delegate page click events to the container
            elements._pageLinks.on('click', Ojay.delegateEvent({
                span: function(element, evnt) {
                    paginator.setPage(element.node.innerHTML);
                }
            }));
            
            // Add hover states to previous and next buttons
            var buttons = [elements._previous, elements._next];
            buttons.forEach(it().on('mouseover').addClass('hovered'));
            buttons.forEach(it().on('mouseout').removeClass('hovered'));
            
            // Monitor page changes to highlight page links
            paginator.on('pagechange', function(paginator, page) {
                this._highlightPage(page);
                buttons.forEach(it().removeClass('disabled'));
            }, this);
            var page = paginator.getCurrentPage();
            this._highlightPage(page);
            
            // Disable previous and next buttons at the ends of the run
            if (!paginator.isLooped()) {
                paginator.on('firstpage')._(elements._previous).addClass('disabled');
                paginator.on('lastpage')._(elements._next).addClass('disabled');
                if (page == 1) elements._previous.addClass('disabled');
                if (page == paginator.getPages()) elements._next.addClass('disabled');
            }
            
            elements._container.addClass(paginator.getDirection());
            return elements._container;
        },
        
        /**
         * <p>Creates and returns an element to use as a numbered page link.</p>
         * @param {Number} page
         * @returns {DomCollection}
         */
        _makeLink: function(page) {
            var link = Ojay( Ojay.HTML.span(String(page)) );
            link.on('mouseover').addClass('hovered');
            link.on('mouseout').removeClass('hovered');
            return link;
        },
        
        /**
         * <p>Responds to the <tt>pagecreate</tt> event on the associated <tt>Paginator</tt>
         * instance by adding a new page link to the list.</p>
         */
        _addPage: function() {
            var link = this._makeLink(this._paginator.getPages());
            this._elements._pages.push(link);
            this._elements._pageLinks.insert(link, 'bottom');
            this._elements._next.removeClass('disabled');
        },
        
        /**
         * <p>Responds to the <tt>pagedestroy</tt> event on the associated <tt>Paginator</tt>
         * instance removing the final page link from the list.</p>
         */
        _removePage: function() {
            this._elements._pages.pop().remove();
            var pager = this._paginator;
            if (pager.isLooped()) return;
            if (pager.getCurrentPage() == pager.getPages())
                this._elements._next.addClass('disabled');
        },
        
        /**
         * <p>Adds the class 'selected' to the current page number.</p>
         * @param {Number}
         */
        _highlightPage: function(page) {
            this._elements._pages.forEach({removeClass: 'selected'});
            this._elements._pages[page - 1].addClass('selected');
        },
        
        /**
         * <p>Returns a reference to the 'previous' button.</p>
         * @returns {DomCollection}
         */
        getPreviousButton: function() {
            if (this._paginator.inState('CREATED')) return null;
            return this._elements._previous;
        },
        
        /**
         * <p>Returns a reference to the 'next' button.</p>
         * @returns {DomCollection}
         */
        getNextButton: function() {
            if (this._paginator.inState('CREATED')) return null;
            return this._elements._next;
        },
        
        /**
         * <p>Returns a reference to the collection of page number links.</p>
         * @returns {DomCollection}
         */
        getPageButtons: function() {
            if (this._paginator.inState('CREATED')) return null;
            return this._elements._pageLinks;
        }
    })
});