/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
Version: master-7bf74da460c9904c4a2bacfa7d728df9748fb7d2
Build:   source
*/

/**
 * <p><tt>Accordion</tt> implements the well-known accordion menu widget. It allows for both
 * horizontal and vertical collapse directions, and allows the animation to be configured. Like
 * all Ojay widgets, it comes with a set of events that you can use to couple an accordion
 * instance to other parts of your application.</p>
 *
 * <p>Creating an accordion is straightforward. Start with a list of elements, each of which
 * should contain an element that you want to collapse. For example:</p>
 *
 * <pre><code>    &lt;div class="section"&gt;
 *         &lt;h3&gt;Section 1&lt;/h3&gt;
 *         &lt;p&gt;Lorem ipsum...&lt;/p&gt;
 *     &lt;/div&gt;
 *     &lt;div class="section"&gt;
 *         &lt;h3&gt;Section 2&lt;/h3&gt;
 *         &lt;p&gt;Dolor sit amet...&lt;/p&gt;
 *     &lt;/div&gt;
 *     &lt;div class="section"&gt;
 *         &lt;h3&gt;Section 3&lt;/h3&gt;
 *         &lt;p&gt;Quaniam omnes...&lt;/p&gt;
 *     &lt;/div&gt;</code></pre>
 *
 * <p>In this example, the paragraphs will collapse and the headings will be the menu tabs.
 * The following script sets up the menu:</p>
 *
 * <pre><code>    var acc = new Ojay.Accordion('horizontal',
 *             '.section', 'p');</code></pre>
 *
 * <p>This will make a few changes to the markup, which you'll need to be aware of in order
 * to apply CSS. After the script runs, the document will look like this:</p>
 *
 * <pre><code>    &lt;div class="section accordion-section"&gt;
 *         &lt;h3&gt;Section 1&lt;/h3&gt;
 *     &lt;/div&gt;
 *     &lt;div class="accordion-collapsible"&gt;
 *         &lt;p&gt;Lorem ipsum...&lt;/p&gt;
 *     &lt;/div&gt;
 *     &lt;div class="section accordion-section"&gt;
 *         &lt;h3&gt;Section 2&lt;/h3&gt;
 *     &lt;/div&gt;
 *     &lt;div class="accordion-collapsible"&gt;
 *         &lt;p&gt;Dolor sit amet...&lt;/p&gt;
 *     &lt;/div&gt;
 *     &lt;div class="section accordion-section"&gt;
 *         &lt;h3&gt;Section 3&lt;/h3&gt;
 *     &lt;/div&gt;
 *     &lt;div class="accordion-collapsible"&gt;
 *         &lt;p&gt;Quaniam omnes...&lt;/p&gt;
 *     &lt;/div&gt;</code></pre>
 *
 * <p>The original sections get an additional class to indicate that they're part of an
 * <tt>Accordion</tt> instance, and the collapsible elements get placed inside a new wrapper
 * element, outside their original parent. This seems a little odd but is required to work
 * around a layout bug in WebKit.</p>
        
 * @constructor
 * @class Accordion
 */
Ojay.Accordion = new JS.Class('Ojay.Accordion', /** @scope Ojay.Accordion.prototype */{
    include: Ojay.Observable,
    
    extend: /** @scope Ojay.Accordion */{
        DIRECTIONS: {
            horizontal:     'HorizontalSection',
            vertical:       'VerticalSection'
        }
    },
    
    /**
     * @param {String} direction
     * @param {HTMLElement|String} sections
     * @param {String} collapsible
     * @param {Object} options
     */
    initialize: function(direction, sections, collapsible, options) {
        this._options     = options || {};
        this._direction   = direction;
        this._sections    = sections;
        this._collapsible = collapsible;
    },
    
    /**
     * @returns {Accordion}
     */
    setup: function() {
        var SectionClass = this.klass[this.klass.DIRECTIONS[this._direction]];
        this._sections = Ojay(this._sections).map(function(section, index) {
            var section = new SectionClass(this, index, section, this._collapsible, this._options);
            section.on('expand')._(this).notifyObservers('sectionexpand', index, section);
            section.on('collapse')._(this).notifyObservers('sectioncollapse', index, section);
            return section;
        }, this);
        var state = this.getInitialState();
        this._sections[state.section].expand(false);
        return this;
    },
    
    /**
     * @returns {Object}
     */
    getInitialState: function() {
        return {section: 0};
    },
    
    /**
     * @param {Object} state
     * @returns {Accordion}
     */
    changeState: function(state) {
        this._sections[state.section].expand();
        return this;
    },
    
    /**
     * @param {Accordion.Section} section
     * @param {Boolean} animate
     */
    _expand: function(section, animate) {
        if (this._currentSection) this._currentSection.collapse(animate);
        this._currentSection = section;
    },
    
    /**
     * @returns {Array}
     */
    getSections: function() {
        return this._sections.slice();
    },
    
    /**
     * @param {Number} n
     * @param {Boolean} animate
     * @returns {Accordion}
     */
    expand: function(n, animate) {
        var section = this._sections[n];
        if (section) section.expand(animate);
        return this;
    },
    
    /**
     * @param {Number} n
     * @param {Boolean} animate
     * @returns {Accordion}
     */
    collapse: function(n, animate) {
        var section = this._sections[n];
        if (section) section.collapse(animate);
        return this;
    }
});


Ojay.Accordion.extend(/** @scope Ojay.Accordion */{
    /**
     * <p>The <tt>Accordion.Section</tt> class models a single collapsible section within an
     * accordion menu. Only one section of an accordion may be open at any time. Ojay supports
     * both vertical and horizontal accordions; these have different methods for size calculations
     * and are implemented as subclasses. This class should be considered abstract.</p>
     * @constructor
     * @class Accordion.Section
     */
    Section: new JS.Class('Ojay.Accordion.Section', /** @scope Ojay.Accordion.Section.prototype */{
        include: Ojay.Observable,
        
        extend: /** @scope Ojay.Accordion.Section */{
            SECTION_CLASS:      'accordion-section',
            COLLAPSER_CLASS:    'accordion-collapsible',
            DEFAULT_EVENT:      'click',
            DEFAULT_DURATION:   0.4,
            DEFAULT_EASING:     'easeBoth'
        },
        
        /**
         * <p>To instantiate a section, pass in an <tt>Accordion</tt> instance, the section's
         * container element, and an element within the container that should be collapsible.
         * The final argument sets configuration options, passed through from the <tt>Accordion</tt>
         * constructor.</p>
         * @param {Accordion} accordion
         * @param {Number} index
         * @param {DomCollection} element
         * @param {String} collapsible
         * @param {Object} options
         */
        initialize: function(accordion, index, element, collapsible, options) {
            this._accordion = accordion;
            this._element = element;
            
            // Restructure the HTML - wrap the collapsing element with a div for resizing,
            // and move the collapsing element outside its original parent (workaround for
            // WebKit layout bug affecting horizontal menus).
            var target = element.descendants(collapsible).at(0);
            this._collapser = Ojay( Ojay.HTML.div({className: this.klass.COLLAPSER_CLASS}) );
            target.insert(this._collapser, 'before');
            this._collapser.insert(target);
            this._element.insert(this._collapser, 'after');
            
            // Fixes some layout issues in IE
            this._collapser.setStyle({position: 'relative', zoom: 1});
            
            options = options || {};
            this._duration = options.duration || this.klass.DEFAULT_DURATION;
            this._easing = options.easing || this.klass.DEFAULT_EASING;
            
            this._element.addClass(this.klass.SECTION_CLASS);
            this._element.on(options.event || this.klass.DEFAULT_EVENT)._(this._accordion).changeState({section: index});
            
            if (options.collapseOnClick)
                this._element.on('click', function() {
                    if (this._open) this.collapse();
                }, this);
            
            this._open = true;
            this.collapse(false);
        },
        
        /**
         * <p>Returns a reference to the outer container element for the section. This element
         * acts as the click target for toggling visibility.</p>
         * @returns {DomCollection}
         */
        getContainer: function() {
            return this._element;
        },
        
        /**
         * <p>Returns a reference to the element that collapses, hiding its content.</p>
         * @returns {DomCollection}
         */
        getCollapser: function() {
            return this._collapser;
        },
        
        /**
         * <p>Causes the section to collapse. Pass the parameter <tt>false</tt> to prevent
         * animation.</p>
         * @param {Boolean} animate
         * @returns {Accordion.Section}
         */
        collapse: function(animate) {
            if (!this._open) return this;
            this._collapser.setStyle({overflow: 'hidden'});
            this._element.removeClass('expanded').addClass('collapsed');
            
            var settings = {};
            settings[this.param] = (animate === false) ? 0 : {to: 0};
            
            var acc = this._accordion;
            if (animate !== false ) this.notifyObservers('collapse');
            
            if (animate === false) {
                this._collapser.setStyle(settings).setStyle({overflow: 'hidden'});
                this._open = false;
                return this;
            } else {
                return this._collapser.animate(settings, this._duration, {easing: this._easing})
                .setStyle({overflow: 'hidden'})
                ._(function(self) { self._open = false; }, this)
                ._(this);
            }
        },
        
        /**
         * <p>Causes the section to expand. Pass the parameter <tt>false</tt> to prevent
         * animation. Any section in the same accordion that is currently open will collapse.</p>
         * @param {Boolean} animate
         * @returns {Accordion.Section}
         */
        expand: function(animate) {
            if (this._open) return this;
            this._accordion._expand(this, animate);
            this._collapser.setStyle({overflow: 'hidden'});
            this._element.addClass('expanded').removeClass('collapsed');
            
            var size = this.getSize(),
                settings = {},
                postAnim = {overflow: ''};
            
            settings[this.param] = (animate === false) ? '' : {to: size};
            postAnim[this.param] = '';
            
            var acc = this._accordion;
            if (animate !== false ) this.notifyObservers('expand');
            
            if (animate === false) {
                this._collapser.setStyle(settings).setStyle({overflow: ''});
                this._open = true;
                return this;
            } else {
                return this._collapser.animate(settings, this._duration, {easing: this._easing})
                .setStyle(postAnim)
                ._(function(self) { self._open = true; }, this)
                ._(this);
            }
        }
    })
});

Ojay.Accordion.extend(/** @scope Ojay.Accordion */{
    /**
     * @constructor
     * @class Ojay.Accordion.HorizontalSection
     */
    HorizontalSection:  new JS.Class('Ojay.Accordion.HorizontalSection', Ojay.Accordion.Section,
    /** @scope Ojay.Accordion.HorizontalSection.prototype */{
        param:  'width',
        
        /**
         * <p>Returns the width of the section at full expansion.</p>
         * @returns {Number}
         */
        getSize: function() {
            var sections = this._accordion.getSections();
            var sizes = sections.map(function(section) {
                var collapser = section._collapser, size = collapser.getRegion().getWidth();
                collapser.setStyle({width: section == this ? '' : 0});
                return size;
            }, this);
            var size = this._collapser.getRegion().getWidth();
            sections.forEach(function(section, i) {
                section._collapser.setStyle({width: sizes[i] + 'px'});
            });
            return size;
        }
    }),
    
    /**
     * @constructor
     * @class Ojay.Accordion.VerticalSection
     */
    VerticalSection:    new JS.Class('Ojay.Accordion.VerticalSection', Ojay.Accordion.Section,
    /** @scope Ojay.Accordion.VerticalSection.prototype */{
        param:  'height',
        
        /**
         * <p>Returns the height of the section at full expansion.</p>
         * @returns {Number}
         */
        getSize: function() {
            if (!this._open) this._collapser.setStyle({height: ''});
            var size = this._collapser.getRegion().getHeight();
            if (!this._open) this._collapser.setStyle({height: 0});
            return size;
        }
    })
});