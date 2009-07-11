/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
Version: master-7bf74da460c9904c4a2bacfa7d728df9748fb7d2
Build:   source
*/

/**
 * @overview
 * <p><tt>Ojay.History</tt> makes it considerably easier to create interface modules that
 * are history-managed using <tt>YAHOO.util.History</tt>. It allows you to create objects
 * that can easily be made into history-managed modules by calling a single function on
 * them. Before we get into the specifics of working with it, let's see an example usage
 * on a web page:</p>
 *
 * <pre><code>    &lt;!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
 *       "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"&gt;
 *     
 *     &lt;html&gt;
 *     &lt;head&gt;
 *         &lt;meta http-equiv="Content-type" content="text/html; charset=utf-8"/&gt;
 *         &lt;title&gt;Ojay History&lt;/title&gt;
 *         &lt;script src="/yui/build/yahoo-dom-event/yahoo-dom-event.js" type="text/javascript"&gt;&lt;/script&gt;
 *         &lt;script src="/yui/build/history/history-min.js" type="text/javascript"&gt;&lt;/script&gt;
 *         &lt;script src="/ojay/ojay.js" type="text/javascript"&gt;&lt;/script&gt;
 *         &lt;script src="/gallery.js" type="text/javascript"&gt;&lt;/script&gt;
 *     &lt;/head&gt;
 *     &lt;body&gt;
 *         &lt;script type="text/javascript"&gt;
 *             var myGallery = new Gallery('galleryDiv');
 *             Ojay.History.manage(myGallery, 'gallery');
 *             Ojay.History.initialize();
 *         &lt;/script&gt;
 *         
 *         &lt;div id="galleryDiv"&gt;
 *             &lt;!-- Gallery markup goes here --&gt;
 *         &lt;/div&gt;
 *         &lt;script type="text/javascript"&gt;
 *             myGallery.setup();
 *         &lt;/script&gt;
 *     &lt;/body&gt;
 *     &lt;/html&gt;</code></pre>
 *
 * <p>This illustrates the basic structure of how to set up an object to be history-managed.
 * At the top of the <tt>body</tt>, you need to create any objects you want to manage, then
 * tell <tt>Ojay.History</tt> to manage them <em>before</em> calling <tt>initialize()</tt>.
 * This poses the problem of how to initialize interface elements before the page has loaded;
 * to work around this, your object should have some means of initializing its DOM requirements
 * at some time later than when it is created. In the example above, <tt>myGallery</tt> calls
 * its <tt>setup()</tt> method after its required DOM nodes are available.</p>
 *
 * <p>Each managed object must be given a unique name for the history manager to refer to it
 * by, and you must supply such a name when calling <tt>Ojay.History.manage</tt>. This name
 * will appear in URLs generated by the history manager for bookmarking purposes.</p>
 *
 * <p>Now, onto the business of how to implement objects that can be history managed. It should
 * go without saying that, if you're creating the kind of interface module that can have
 * history management applied to it, it should be controlled (at least in part) by a single
 * JavaScript object that maintains the module's state, rather than by a disorganised mass
 * of global functions and variables. Also, note that you cannot history-manage classes, it
 * only makes sense to talk about managing objects, or instances of classes. If you have several
 * instances of a particular interface class running on a page, you need to give each instance
 * its own name in the history manager.</p>
 *
 * <p>For an object to be history-managed, the only requirements are that it must have both
 * a <tt>getInitialState</tt> method, and a <tt>changeState</tt> method. There are also some
 * 'rules' about how to use these methods so that they work when converted to history-managing
 * actions.</p>
 *
 * <p><tt>getInitialState</tt> must return an object containing all the fields necessary to
 * specify the state of the object at any time, and their default values. When the object is
 * history-managed, this method will return the bookmarked state of the object from the
 * history manager.</p>
 *
 * <p><tt>changeState</tt> should accept an object as an argument, and modify the managed
 * object's UI according to the argument's properties. Any action which creates a bookmarkable
 * state should be carried out by calling <tt>changeState</tt>. When using history management,
 * <tt>changeState</tt> will be re-routed to create a new entry in the browser's history to
 * record the interface changes that take place. As its name implies, <tt>changeState</tt>
 * should not be used to initialize the object's UI as it will create a new history entry.</p>
 *
 * <p>Any state parameters provided to your <tt>changeState</tt> method by the history manager
 * will be <tt>String</tt>s, so you should cast to other data types if required. The only
 * exceptions to this rule are <tt>Number</tt>s, and the values <tt>true</tt>, <tt>false</tt>,
 * <tt>null</tt> and <tt>undefined</tt>. These will be converted from strings to the correct
 * data type automatically by <tt>Ojay.History</tt>.</p>
 *
 * <p>As an example, the following is an outline implementation of the <tt>Gallery</tt> class
 * used in the example page above.</p>
 *
 * <pre><code>    var Gallery = new JS.Class({
 *         
 *         // Store initialization data, do nothing with the DOM
 *         initialize: function(id) {
 *             this.elementID = id;
 *         },
 *         
 *         // Return default state of the module
 *         getInitialState: function() {
 *             return {
 *                 page: 1,
 *                 popupVisible: true,
 *                 popupID: 0
 *             };
 *         },
 *         
 *         // What to do when the state changes: change the UI
 *         changeState: function(state) {
 *             if (state.page !== undefined) this.setPage(state.page);
 *         },
 *         
 *         // Called when DOM elements are ready
 *         setup: function() {
 *             // ... Setup DOM stuff ...
 *             this.registerEventListeners();
 *             // Get initial state and set up the UI
 *             this.state = this.getInitialState();
 *             this.setPage(this.state.page);
 *         },
 *         
 *         // Attach object's methods to DOM events
 *         registerEventListeners: function() {
 *             this.prevControl.on('click', this.decrementPage, this);
 *             this.nextControl.on('click', this.incrementPage, this);
 *         },
 *         
 *         // Change the UI via the changeState() function
 *         decrementPage: function() {
 *             if (this.state.page > 1)
 *                 this.changeState({page: this.state.page - 1});
 *         },
 *         
 *         incrementPage: function() { ... },
 *         
 *         // Change the UI - should only be called through changeState()
 *         setPage: function(n) {
 *             this.state.page = n;  // Ojay casts this to a Number for you
 *             // ... DOM manipulation ...
 *         }
 *     });</code></pre>
 */
Ojay.History = (function(History) {
    
    var CHARACTER_CONVERSIONS = {
        '?':    '--Qq--',
        '=':    '--Ee--',
        '&':    '--Aa--',
        '_':    '--Uu--',
        '/':    '--Ss--'
    },
    
        encode = function(param) {
            var string = encodeURIComponent(decode(param));
            for (var conv in CHARACTER_CONVERSIONS)
                string = string.replace(conv, CHARACTER_CONVERSIONS[conv]);
            return string;
        },
        
        decode = function(string) {
            string = decodeURIComponent(String(string));
            for (var conv in CHARACTER_CONVERSIONS)
                string = string.replace(CHARACTER_CONVERSIONS[conv], conv);
            return string;
        },
        
        castValue = function(value) {
            if (typeof value != 'string') return value;
            if ((/^\-?\d+(?:\.\d+)?$/.test(value))) value = Number(value);
            
            var keywords = {'true': true, 'false': false, 'undefined': undefined, 'null': null};
            for (var word in keywords) {
                if (value == word) value = keywords[word];
            }
            return value;
        },
        
        serializeState = function(state) {
            if (!state) return '';
            var parts = [];
            for (var property in state)
                parts.push(encode(property) + '_' + encode(state[property]));
            return parts.join('/');
        },
        
        parseState = function(string) {
            string = String(string).replace(/^\s*(.*?)\s*$/, '$1');
            if (!string) return {};
            var parts = string.split('/'), part, state = {}, value;
            for (var i = 0, n = parts.length; i < n; i++) {
                part = parts[i].split('_');
                value = castValue(decode(part[1]));
                state[decode(part[0])] = value;
            }
            return state;
        };
    
    return /** @scope Ojay.History */{
        /**
         * <p>The interface that objects must implement in order to be history managed.</p>
         */
        INTERFACE: new JS.Interface(['getInitialState', 'changeState']),
        
        /**
         * <p>Adds history management to a given object using <tt>name</tt> as a module
         * identifier. All calls to this must take place before <tt>Ojay.History.initialize()</tt>.</p>
         * @param {Object} object The object to history manage
         * @param {String} name A unique module ID for the history manager to use
         */
        manage: function(object, name) {
            JS.Interface.ensure(object, this.INTERFACE);
            
            var historyID   = String(name);
            var changeState = object.changeState.functionize();
            var objectState = {};
            
            object.getInitialState = object.getInitialState.wrap(function(getDefaultState) {
                objectState = History.getBookmarkedState(historyID);
                if (objectState) objectState = parseState(objectState);
                else objectState = getDefaultState();
                return objectState;
            });
            
            object.changeState = function(state) {
                state = state || {};
                for (var property in state)
                    objectState[property] = state[property];
                state = serializeState(objectState);
                History.navigate(historyID, state);
            };
            
            var init = serializeState(object.getInitialState());
            History.register(historyID, init, function(state) {
                state = parseState(state);
                changeState(object, state);
            });
            
            History.onLoadEvent.subscribe(function() {
                var state = History.getCurrentState(historyID);
                state = parseState(state);
                changeState(object, state);
            });
        },
        
        /**
         * <p>Initializes the Yahoo! History module. Should be called only after all required
         * modules have been registered, in a script tag at the beginning of the body.</p>
         *
         * <p>As of YUI 2.4.0, you need to create some HTML elements on the page for YUI to
         * store history state with. <tt>Ojay.History</tt> does this all for you, but you can
         * configure it using a set of optional arguments:</p>
         *
         * <p><tt>asset</tt> -- The URL of some asset on the same domain as the current page.
         * Can be an HTML page, image, script, anything really. Defaults to <tt>/robots.txt</tt>.</p>
         *
         * <p><tt>inputID</tt> -- The <tt>id</tt> to give to the hidden <tt>input</tt> field.
         * Defaults to <tt>yui-history-field</tt>.</p>
         *
         * <p><tt>iframeID</tt> -- The <tt>id</tt> to give to the hidden <tt>iframe</tt>. Defaults
         * to <tt>yui-history-iframe</tt>.</p>
         *
         * <pre><code>    // A quick example...
         *     Ojay.History.initialize({asset: '/javascripts/ojay.js', inputID: 'foo'});</code></pre>
         *
         * @param {Object} options
         */
        initialize: function(options) {
            options         = options || {};
            var assetSrc    = (options.asset || '/robots.txt').replace(/^http:\/\/[^\/]*/ig, '');
            var inputID     = options.inputID || 'yui-history-field';
            var iframeID    = options.iframeID || 'yui-history-iframe';
            
            var body = Ojay(document.body), input, iframe;
            
            input = Ojay.HTML.input({type: 'hidden', id: inputID});
            body.insert(input, 'top');
            
            iframe = Ojay.HTML.iframe({id: iframeID, src: assetSrc});
            Ojay(iframe).setStyle({position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', visibility: 'hidden'});
            body.insert(iframe, 'top');
            
            History.initialize(inputID, iframeID);
        }
    };
})(YAHOO.util.History);