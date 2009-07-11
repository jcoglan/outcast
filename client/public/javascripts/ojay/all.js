/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
Version: master-7bf74da460c9904c4a2bacfa7d728df9748fb7d2
Build:   source
*/

/**
 * JS.Class: Ruby-style JavaScript
 * Copyright (c) 2007-2009 James Coglan
 * 
 * http://jsclass.jcoglan.com
 * http://github.com/jcoglan/js.class
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * Parts of this software are derived from the following open-source projects:
 * 
 *     - The Prototype framework, (c) 2005-2009 Sam Stephenson
 *     - Alex Arnell's Inheritance library, (c) 2006, Alex Arnell
 *     - Base, (c) 2006-9, Dean Edwards
 */

/**
 * == core ==
 **/

/** section: core
 * JS
 * 
 * The `JS` object is used as a namespace by the rest of the JS.Class framework, and hosts
 * various utility methods used throughout. None of these methods should be taken as being
 * public API, they are all 'plumbing' and may be removed or changed at any time.
 **/
JS = {
  /**
   * JS.extend(target, extensions) -> Object
   * - target (Object): object to be extended
   * - extensions (Object): object containing key/value pairs to add to target
   *
   * Adds the properties of the second argument to the first, and returns the first. Will not
   * needlessly overwrite fields with identical values; if an object has inherited a property
   * we should not add the property to the object itself.
   **/
  extend: function(target, extensions) {
    extensions = extensions || {};
    for (var prop in extensions) {
      if (target[prop] === extensions[prop]) continue;
      target[prop] = extensions[prop];
    }
    return target;
  },
  
  /**
   * JS.makeFunction() -> Function
   *
   * Returns a function for use as a constructor. These functions are used as the basis for
   * classes. The constructor calls the object's `initialize()` method if it exists.
   **/
  makeFunction: function() {
    return function() {
      return this.initialize
          ? (this.initialize.apply(this, arguments) || this)
          : this;
    };
  },
  
  /**
   * JS.makeBridge(klass) -> Object
   * - klass (JS.Class): class from which you want to inherit
   *
   * Takes a class and returns an instance of it, without calling the class's constructor.
   * Used for forging prototype links between objects using JavaScript's inheritance model.
   **/
  makeBridge: function(klass) {
    var bridge = function() {};
    bridge.prototype = klass.prototype;
    return new bridge;
  },
  
  /**
   * JS.bind(object, func) -> Function
   * - object (Object): object to bind the function to
   * - func (Function): function that the bound function should call
   *
   * Takes a function and an object, and returns a new function that calls the original
   * function with `this` set to refer to the `object`. Used to implement `JS.Kernel#method`,
   * amongst other things.
   **/
  bind: function() {
    var args   = JS.array(arguments),
        method = args.shift(),
        object = args.shift() || null;
    
    return function() {
      return method.apply(object, args.concat(JS.array(arguments)));
    };
  },
  
  /**
   * JS.callsSuper(func) -> Boolean
   * - func (Function): function to test for super() calls
   *
   * Takes a function and returns `true` iff the function makes a call to `callSuper()`.
   * Result is cached on the function itself since functions are immutable and decompiling
   * them is expensive. We use this to determine whether to wrap the function when it's
   * added to a class; wrapping impedes performance and should be avoided where possible.
   **/
  callsSuper: function(func) {
    return func.SUPER === undefined
        ? func.SUPER = /\bcallSuper\b/.test(func.toString())
        : func.SUPER;
  },
  
  /**
   * JS.mask(func) -> Function
   * - func (Function): function to obfuscate
   *
   * Disguises a function so that we cannot tell if it uses `callSuper()`. Sometimes we don't
   * want such functions to be wrapped by the inheritance system. Modifies the function's
   * `toString()` method and returns the function.
   **/
  mask: function(func) {
    var string = func.toString().replace(/callSuper/g, 'super');
    func.toString = function() { return string };
    return func;
  },
  
  /**
   * JS.array(iterable) -> Array
   * - iterable (Object): object you want to cast to an array
   *
   * Takes any iterable object (something with a `length` property) and returns a native
   * JavaScript `Array` containing the same elements.
   **/
  array: function(iterable) {
    if (!iterable) return [];
    if (iterable.toArray) return iterable.toArray();
    
    var length  = iterable.length,
        results = [];
    
    while (length--) results[length] = iterable[length];
    return results;
  },
  
  /**
   * JS.indexOf(haystack, needle) -> Number
   * - haystack (Array): array to search
   * - needle (Object): object to search for
   *
   * Returns the index of the `needle` in the `haystack`, which is typically an `Array` or an
   * array-like object. Returns -1 if no matching element is found. We need this as older
   * IE versions don't implement `Array#indexOf`.
   **/
  indexOf: function(haystack, needle) {
    for (var i = 0, n = haystack.length; i < n; i++) {
      if (haystack[i] === needle) return i;
    }
    return -1;
  },
  
  /**
   * JS.isFn(object) -> Boolean
   * - object (Object): object to test
   *
   * Returns `true` iff the argument is a `Function`.
   **/
  isFn: function(object) {
    return object instanceof Function;
  },
  
  /**
   * JS.isType(object, type) -> Boolean
   * - object (Object): object whose type we wish to check
   * - type (JS.Module): type to match against
   * 
   * Returns `true` iff `object is of the given `type`.
   **/
  isType: function(object, type) {
    if (!object || !type) return false;
    return (type instanceof Function && object instanceof type) ||
           (typeof type === 'string' && typeof object === type) ||
           (object.isA && object.isA(type));
  },
  
  /**
   * JS.ignore(key, object) -> Boolean
   * - key (String): name of field being added to an object
   * - object (Object): value of the given field
   *
   * Used to determine whether a key-value pair should be added to a class or module. Pairs
   * may be ignored if they have some special function, like `include` or `extend`.
   **/
  ignore: function(key, object) {
    return /^(include|extend)$/.test(key) && typeof object === 'object';
  }
};


/** section: core
 * class JS.Module
 * includes JS.Kernel
 * 
 * `Module` is the core class in JS.Class. A module is simply an object that stores methods,
 * and is responsible for handling method lookups, inheritance relationships and the like.
 * All of Ruby's inheritance semantics are handled using modules in JS.Class.
 * 
 * The basic object/module/class model in Ruby is expressed in the diagram at
 * http://ruby-doc.org/core/classes/Class.html -- `Class` inherits from `Module`, which
 * inherits from `Object` (as do all custom classes). `Kernel` is a `Module` which is mixed
 * into `Object` to provide methods common to all objects.
 * 
 * In JS.Class, there is no `Object` class, but we do have `Module`, `Class` and `Kernel`.
 * All top-level (parentless) classes include the `JS.Kernel` module, so all classes in effect
 * inherit from `Kernel`. All classes are instances of `JS.Class`, and all modules instances
 * of `JS.Module`. `Module` is a top-level class, from which `Class` inherits.
 * 
 * The following diagram shows this relationship; vertical lines indicate parent/child
 * class relationships, horizontal lines indicate module inclusions. (`C`) means a class,
 * (`M`) a module.
 * 
 * 
 *      ==============      ==============      ===================      ==============
 *      | M | Kernel |----->| C | Module |      | C | ParentClass |<-----| M | Kernel |
 *      ==============      ==============      ===================      ==============
 *                                ^                     ^
 *                                |                     |
 *                                |                     |
 *                          =============       ==================
 *                          | C | Class |       | C | ChildClass |
 *                          =============       ==================
 * 
 * 
 * All objects have a metamodule attached to them; this handles storage of singleton
 * methods as metaclasses do in Ruby. This is handled by mixing the object's class into
 * the object's metamodule.
 * 
 * 
 *                class
 *          =================
 *          | C | SomeClass |------------------------------------------------
 *          =================                                               |
 *                  |                                                       |
 *                  V                                                       |
 *          ====================      =================================     |
 *          | <SomeClass:0xb7> |<>----| M | <Module:<SomeClass:0xb7>> |<-----
 *          ====================      =================================
 *                instance                       metamodule
 * 
 * 
 * Similarly, inheritance of class methods is handled by mixing the parent class's
 * metamodule into the child class's metamodule, like so:
 * 
 * 
 *            ===================      ============================
 *            | C | ParentClass |<>----| M | <Module:ParentClass> |------
 *            ===================      ============================     |
 *                    ^                                                 |
 *                    |                                                 |
 *                    |                                                 |
 *            ===================      ===========================      |
 *            | C | ChildClass  |<>----| M | <Module:ChildClass> |<------
 *            ===================      ===========================
 * 
 * 
 * The parent-child relationships are also implemented using module inclusion, with some
 * extra checks and optimisations. Also, bear in mind that although `Class` appears to be a
 * subclass of `Module`, this particular parent-child relationship is faked using manual
 * delegation; every class has a hidden module attached to it that handles all the method
 * storage and lookup responsibilities.
 **/
JS.Module = JS.makeFunction();
JS.extend(JS.Module.prototype, {
  END_WITHOUT_DOT: /([^\.])$/,
  
  /**
   * new JS.Module(name, methods, options)
   * - name (String): the name of the module, used for debugging
   * - methods (Object): list of methods for the class
   * - options (Object): configuration options
   * 
   * The `name` argument is optional and may be omitted; `name` is not used to assign
   * the class to a variable, it is only uses as metadata. The `options` object is used
   * to specify the target object that the module is storing methods for.
   * 
   *     var Runnable = new JS.Module('Runnable', {
   *         run: function(args) {
   *             // ...
   *         }
   *     });
   **/
  initialize: function(name, methods, options) {
    this.__mod__ = this;      // Mirror property found in Class. Think of this as toModule()
    this.__inc__ = [];        // List of modules included in this module
    this.__fns__ = {};        // Object storing methods belonging to this module
    this.__dep__ = [];        // List modules and classes that depend on this module
    this.__mct__ = {};        // Cache table for method call lookups
    
    if (typeof name === 'string') {
      this.__nom__ = this.displayName = name;
    } else {
      this.__nom__ = this.displayName = '';
      options = methods;
      methods = name;
    }
    
    options = options || {};
    
    // Object to resolve methods onto
    this.__res__ = options._resolve || null;
    
    if (methods) this.include(methods, false);
  },
  
  /**
   * JS.Module#setName(name) -> undefined
   * - name (String): the name for the module
   * 
   * Sets the `displayName` of the module to the given value. Should be the fully-qualified
   * name, including names of the containing modules.
   **/
  setName: function(name) {
    this.__nom__ = this.displayName = name || '';
    for (var key in this.__mod__.__fns__)
      this.__name__(key);
    if (name && this.__meta__) this.__meta__.setName(name + '.');
  },
  
  /**
   * JS.Module#__name__(name) -> undefined
   * - name (String): the name of the method to assign a `displayName` to
   * 
   * Assigns the `displayName` property to the named method using Ruby conventions for naming
   * instance and singleton methods. If the named field points to another `Module`, the name
   * change is applied recursively.
   **/
  __name__: function(name) {
    if (!this.__nom__) return;
    var object = this.__mod__.__fns__[name] || {};
    name = this.__nom__.replace(this.END_WITHOUT_DOT, '$1#') + name;
    if (JS.isFn(object.setName)) return object.setName(name);
    if (JS.isFn(object)) object.displayName = name;
  },
  
  /**
   * JS.Module#define(name, func[, resolve = true[, options = {}]]) -> undefined
   * - name (String): the name of the method
   * - func (Function): a function implementing the method
   * - resolve (Boolean): sets whether to refresh method tables afterward
   * - options (Object): execution options
   * 
   * Adds an instance method to the module with the given `name`. The `options` parameter is
   * for internal use to make sure callbacks fire on the correct objects, e.g. a class
   * uses a hidden module to store its methods, but callbacks should fire on the class,
   * not the module.
   **/
  define: function(name, func, resolve, options) {
    var notify = (options || {})._notify || this;
    this.__fns__[name] = func;
    this.__name__(name);
    if (JS.Module._notify && notify && JS.isFn(func))
        JS.Module._notify(name, notify);
    if (resolve !== false) this.resolve();
  },
  
  /**
   * JS.Module#instanceMethod(name) -> Function
   * - name (String): the name of the method
   * 
   * Returns the named instance method from the module as an unbound function.
   **/
  instanceMethod: function(name) {
    var method = this.lookup(name).pop();
    return JS.isFn(method) ? method : null;
  },
  
  /**
   * JS.Module#instanceMethods([includeSuper = true[, results]]) -> Array
   * - includeSuper (Boolean): whether to include ancestor methods
   * - results (Array): list of found method names (internal use)
   * 
   * Returns an array of all the method names from the module. Pass `false` to ignore methods
   * inherited from ancestors.
   **/
  instanceMethods: function(includeSuper, results) {
    var self      = this.__mod__,
        results   = results || [],
        ancestors = self.ancestors(),
        n         = ancestors.length,
        name;
    
    for (name in self.__fns__) {
      if (self.__fns__.hasOwnProperty(name) &&
          JS.isFn(self.__fns__[name]) &&
          JS.indexOf(results, name) === -1)
        results.push(name);
    }
    if (includeSuper === false) return results;
    
    while (n--) ancestors[n].instanceMethods(false, results);
    return results;
  },
  
  /**
   * JS.Module#include(module[, resolve = true[, options = {}]]) -> undefined
   * - module (JS.Module): the module to mix in
   * - resolve (Boolean): sets whether to refresh method tables afterward
   * - options (Object): flags to control execution
   * 
   * Mixes `module` into the receiver or, if `module` is plain old object (rather than a
   * `JS.Module`) adds methods directly into the receiver. The `options` and `resolve` arguments
   * are mostly for internal use; `options` specifies objects that callbacks should fire on,
   * and `resolve` tells the module whether to resolve methods onto its target after adding
   * the methods.
   **/
  include: function(module, resolve, options) {
    resolve = (resolve !== false);
    if (!module) return resolve ? this.resolve() : this.uncache();
    options = options || {};
    
    if (module.__mod__) module = module.__mod__;
    
    var inc      = module.include,
        ext      = module.extend,
        includer = options._included || this,
        modules, method, i, n;
    
    if (module.__inc__ && module.__fns__) {
      // module is a Module instance: make links and fire callbacks
      
      this.__inc__.push(module);
      module.__dep__.push(this);
      if (options._extended) module.extended && module.extended(options._extended);
      else module.included && module.included(includer);
      
    } else {
      // module is a normal object: add methods directly to this module
      
      if (options._recall) {
        // Second call: add all the methods
        for (method in module) {
          if (JS.ignore(method, module[method])) continue;
          this.define(method, module[method], false, {_notify: includer || options._extended || this});
        }
      } else {
        // First call: handle include and extend blocks
        
        // Handle inclusions
        if (typeof inc === 'object' || JS.isType(inc, JS.Module)) {
          modules = [].concat(inc);
          for (i = 0, n = modules.length; i < n; i++)
            includer.include(modules[i], resolve, options);
        }
        
        // Handle extensions
        if (typeof ext === 'object' || JS.isType(ext, JS.Module)) {
          modules = [].concat(ext);
          for (i = 0, n = modules.length; i < n; i++)
            includer.extend(modules[i], false);
          includer.extend();
        }
        
        // Make a second call to include(). This allows mixins to modify the
        // include() method and affect the addition of methods to this module
        options._recall = true;
        return includer.include(module, resolve, options);
      }
    }
    resolve ? this.resolve() : this.uncache();
  },
  
  /**
   * JS.Module#includes(module) -> Boolean
   * - module (JS.Module): a module to check for inclusion
   * 
   * Returns `true` iff the receiver includes (i.e. inherits from) the given `module`, or
   * if the receiver and given `module` are the same object. Recurses over the receiver's
   * inheritance tree, could get expensive.
   **/
  includes: function(module) {
    var self = this.__mod__,
        i    = self.__inc__.length;
    
    if (Object === module || self === module || self.__res__ === module.prototype)
      return true;
    
    while (i--) {
      if (self.__inc__[i].includes(module))
        return true;
    }
    return false;
  },
  
  /**
   * JS.Module#match(object) -> Boolean
   * - object (Object): object to type-check
   * 
   * Returns `true` if the receiver is in the inheritance chain of `object`.
   **/
  match: function(object) {
    return object.isA && object.isA(this);
  },
  
  /**
   * JS.Module#ancestors([results]) -> Array
   * - results (Array): list of found ancestors (internal use)
   * 
   * Returns an array of the module's ancestor modules/classes, with the most distant
   * first and the receiver last. This is the opposite order to that given by Ruby, but
   * this order makes it easier to eliminate duplicates and preserve Ruby's inheritance
   * semantics with respect to the diamond problem. The `results` parameter is for internal
   * use; we recurse over the tree passing the same array around rather than generating
   * lots of arrays and concatenating.
   **/
  ancestors: function(results) {
    var self     = this.__mod__,
        cachable = (results === undefined),
        klass    = (self.__res__||{}).klass,
        result   = (klass && self.__res__ === klass.prototype) ? klass : self,
        i, n;
    
    if (cachable && self.__anc__) return self.__anc__.slice();
    results = results || [];
    
    // Recurse over inclusions first
    for (i = 0, n = self.__inc__.length; i < n; i++)
      self.__inc__[i].ancestors(results);
    
    // If this module is not already in the list, add it
    if (JS.indexOf(results, result) === -1) results.push(result);
    
    if (cachable) self.__anc__ = results.slice();
    return results;
  },
  
  /**
   * JS.Module#lookup(name) -> Array
   * - name (String): the name of the method to search for
   * 
   * Returns an array of all the methods in the module's inheritance tree with the given
   * `name`. Methods are returned in the same order as the modules in `JS.Module#ancestors`,
   * so the last method in the list will be called first, the penultimate on the first
   * `callSuper()`, and so on back through the list.
   **/
  lookup: function(name) {
    var self  = this.__mod__,
        cache = self.__mct__;
    
    if (cache[name]) return cache[name].slice();
    
    var ancestors = self.ancestors(),
        results   = [],
        i, n, method;
    
    for (i = 0, n = ancestors.length; i < n; i++) {
      method = ancestors[i].__mod__.__fns__[name];
      if (method) results.push(method);
    }
    cache[name] = results.slice();
    return results;
  },
  
  /**
   * JS.Module#make(name, func) -> Function
   * - name (String): the name of the method being produced
   * - func (Function): a function implementing the method
   * 
   * Returns a version of the function ready to be added to a prototype object. Functions
   * that use `callSuper()` must be wrapped to support that behaviour, other functions can
   * be used raw.
   **/
  make: function(name, func) {
    if (!JS.isFn(func) || !JS.callsSuper(func)) return func;
    var module = this;
    return function() {
      return module.chain(this, name, arguments);
    };
  },
  
  /**
   * JS.Module#chain(self, name, args) -> Object
   * - self (Object): the receiver of the call
   * - name (String): the name of the method being called
   * - args (Array): list of arguments to begin the call
   * 
   * Performs calls to functions that use `callSuper()`. Ancestor methods are looked up
   * dynamically at call-time; this allows `callSuper()` to be late-bound as in Ruby at the
   * cost of a little performance. Arguments to the call are stored so they can be passed
   * up the call stack automatically without the developer needing to pass them by hand.
   **/
  chain: JS.mask( function(self, name, args) {
    var callees      = this.lookup(name),     // List of method implementations
        stackIndex   = callees.length - 1,    // Current position in the call stack
        currentSuper = self.callSuper,        // Current super method attached to the receiver
        params       = JS.array(args),        // Copy of argument list
        result;
    
    // Set up the callSuper() method
    self.callSuper = function() {
    
      // Overwrite arguments specified explicitly
      var i = arguments.length;
      while (i--) params[i] = arguments[i];
      
      // Step up the stack, call and step back down
      stackIndex -= 1;
      var returnValue = callees[stackIndex].apply(self, params);
      stackIndex += 1;
      
      return returnValue;
    };
    
    // Call the last method in the stack
    result = callees.pop().apply(self, params);
    
    // Remove or reassign callSuper() method
    currentSuper ? self.callSuper = currentSuper : delete self.callSuper;
    
    return result;
  } ),
  
  /**
   * JS.Module#resolve([target = this]) -> undefined
   * - target (Object): the object to reflect methods onto
   * 
   * Copies methods from the module onto the `target` object, wrapping methods where
   * necessary. The target will typically be a native JavaScript prototype object used
   * to represent a class. Recurses over this module's ancestors to make sure all applicable
   * methods exist.
   **/
  resolve: function(target) {
    var self     = this.__mod__,
        target   = target || self,
        resolved = target.__res__, i, n, key, made;
    
    // Resolve all dependent modules if the target is this module
    if (target === self) {
      self.uncache(false);
      i = self.__dep__.length;
      while (i--) self.__dep__[i].resolve();
    }
    
    if (!resolved) return;
    
    // Recurse over this module's ancestors
    for (i = 0, n = self.__inc__.length; i < n; i++)
      self.__inc__[i].resolve(target);
    
    // Wrap and copy methods to the target
    for (key in self.__fns__) {
      made = target.make(key, self.__fns__[key]);
      if (resolved[key] !== made) resolved[key] = made;
    }
  },
  
  /**
   * JS.Module#uncache([recursive = true]) -> undefined
   * - recursive (Boolean): whether to clear the cache of all dependent modules
   * 
   * Clears the ancestor and method table cahces for the module. This is used to invalidate
   * caches when modules are modified, to avoid some of the bugs that exist in Ruby.
   **/
  uncache: function(recursive) {
    var self = this.__mod__,
        i    = self.__dep__.length;
    
    self.__anc__ = null;
    self.__mct__ = {};
    if (recursive === false) return;
    while (i--) self.__dep__[i].uncache();
  }
});


/** section: core
 * class JS.Class < JS.Module
 * 
 * `Class` is a subclass of `JS.Module`; classes not only store methods but also spawn
 * new objects. In addition, classes have an extra type of inheritance on top of mixins,
 * in that each class can have a single parent class from which it will inherit both
 * instance and singleton methods.
 * 
 * Refer to `JS.Module` for details of how inheritance is implemented in JS.Class. Though
 * `Class` is supposed to appear to be a subclass of `Module`, this relationship is
 * implemented by letting each `Class` hold a reference to an anonymous `Module` and
 * using manual delegation where necessary.
 **/
JS.Class = JS.makeFunction();
JS.extend(JS.Class.prototype = JS.makeBridge(JS.Module), {
  
  /**
   * new JS.Class(name, parent, methods)
   * - name (String): the name of the class, used for debugging
   * - parent (JS.Class): the parent class to inherit from
   * - methods (Object): list of methods for the class
   * 
   * The `name` and `parent` arguments are both optional and may be omitted. `name`
   * is not used to assign the class to a variable, it is only uses as metadata.
   * The default parent class is `Object`, and all classes include the JS.Kernel
   * module.
   **/
  initialize: function(name, parent, methods) {
    if (typeof name === 'string') {
      this.__nom__ = this.displayName = name;
    } else {
      this.__nom__ = this.displayName = '';
      methods = parent;
      parent = name;
    }
    var klass = JS.extend(JS.makeFunction(), this);
    klass.klass = klass.constructor = this.klass;
    
    if (!JS.isFn(parent)) {
      methods = parent;
      parent = Object;
    }
    
    // Set up parent-child relationship, then add methods. Setting up a parent
    // class in JavaScript wipes the existing prototype object.
    klass.inherit(parent);
    klass.include(methods, false);
    klass.resolve();
    
    // Fire inherited() callback on ancestors
    do {
      parent.inherited && parent.inherited(klass);
    } while (parent = parent.superclass);
    
    return klass;
  },
  
  /**
   * JS.Class#inherit(klass) -> undefined
   * - klass (JS.Class): the class to inherit from
   * 
   * Sets up the parent-child relationship to the parent class. This is a destructive action
   * in that the existing prototype will be discarded; always call this before adding any
   * methods to the class.
   **/
  inherit: function(klass) {
    this.superclass = klass;
    
    // Mix the parent's metamodule into this class's metamodule
    if (this.__eigen__ && klass.__eigen__) this.extend(klass.__eigen__(), true);
    
    this.subclasses = [];
    (klass.subclasses || []).push(this);
    
    // Bootstrap JavaScript's prototypal inheritance model
    var p = this.prototype = JS.makeBridge(klass);
    p.klass = p.constructor = this;
    
    // Set up a module to store methods and delegate calls to
    // -- Class does not really subclass Module, instead each
    // Class has a Module that it delegates to
    this.__mod__ = new JS.Module(this.__nom__, {}, {_resolve: this.prototype});
    this.include(JS.Kernel, false);
    
    if (klass !== Object) this.include(klass.__mod__ || new JS.Module(klass.prototype,
        {_resolve: klass.prototype}), false);
  },
  
  /**
   * JS.Class#include(module[, resolve = true[, options = {}]]) -> undefined
   * - module (JS.Module): the module to mix in
   * - resolve (Boolean): sets whether to refresh method tables afterward
   * - options (Object): flags to control execution
   * 
   * Mixes a `module` into the class if it's a `JS.Module` instance, or adds instance
   * methods to the class itself if given a plain old object. Overrides `JS.Module#include`
   * to make sure callbacks fire on the class rather than its delegating module.
   **/
  include: function(module, resolve, options) {
    if (!module) return;
    
    var mod     = this.__mod__,
        options = options || {};
    
    options._included = this;
    return mod.include(module, resolve, options);
  },
  
  /**
   * JS.Class#define(name, func[, resolve = true[, options = {}]]) -> undefined
   * - name (String): the name of the method
   * - func (Function): a function to implement the method
   * - resolve (Boolean): sets whether to refresh method tables afterward
   * - options (Object): options for internal use
   * 
   * Adds an instance method to the class with the given `name`. The `options` parameter is
   * for internal use to make sure callbacks fire on the correct objects, e.g. a class
   * uses a hidden module to store its methods, but callbacks should fire on the class,
   * not the module.
   **/
  define: function(name, func, resolve, options) {
    var module = this.__mod__;
    options = options || {};
    options._notify = this;
    module.define(name, func, resolve, options);
  }
});


// This file bootstraps the framework by redefining Module and Class using their
// own prototypes and mixing in methods from Kernel, making these classes appear
// to be instances of themselves.

JS.Module = new JS.Class('Module', JS.Module.prototype);
JS.Class = new JS.Class('Class', JS.Module, JS.Class.prototype);
JS.Module.klass = JS.Module.constructor =
JS.Class.klass = JS.Class.constructor = JS.Class;

JS.extend(JS.Module, {
  _observers: [],
  methodAdded: function(block, context) {
    this._observers.push([block, context]);
  },
  _notify: function(name, object) {
    var obs = this._observers, i = obs.length;
    while (i--) obs[i][0].call(obs[i][1] || null, name, object);
  }
});


/** section: core
 * mixin JS.Kernel
 * 
 * `Kernel` is the base module; all classes include the `Kernel`, so its methods become
 * available to all objects instantiated by JS.Class. As in Ruby, the core `Object`
 * methods are implemented here rather than in the base `Object` class. JS.Class does
 * not in fact have an `Object` class and does not modify the builtin JavaScript `Object`
 * class either.
 **/
JS.Kernel = JS.extend(new JS.Module('Kernel', {
  /**
   * JS.Kernel#__eigen__() -> JS.Module
   * 
   * Returns the object's metamodule, analogous to calling `(class << self; self; end)`
   * in Ruby. Ruby's metaclasses are `Class`es, not just `Module`s, but so far I've not found
   * a compelling reason to enforce this. You cannot instantiate or subclass metaclasses
   * in Ruby, they only really exist to store methods so a module will suffice.
   **/
  __eigen__: function() {
    if (this.__meta__) return this.__meta__;
    
    var me     = this.__nom__,
        klass  = this.klass.__nom__,
        name   = me || (klass ? '#<' + klass + '>' : ''),
        module = this.__meta__ = new JS.Module(name ? name + '.' : '', {}, {_resolve: this});
    
    module.include(this.klass.__mod__, false);
    return module;
  },
  
  /**
   * JS.Kernel#equals(object) -> Boolean
   * - object (Object): object to compare to the receiver
   * 
   * Returns `true` iff `object` is the same object as the receiver. Override to provide a
   * more meaningful comparison for use in sets, hashtables etc.
   **/
  equals: function(object) {
    return this === object;
  },
  
  /**
   * JS.Kernel#extend(module[, resolve = true]) -> undefined
   * - module (JS.Module): module with which to extend the object
   * - resolve (Boolean): whether to refresh method tables afterward
   * 
   * Extends the object using the methods from `module`. If `module` is an instance of
   * `JS.Module`, it becomes part of the object's inheritance chain and any methods added
   * directly to the object will take precedence. Pass `false` as a second argument
   * to prevent the method resolution process from firing.
   **/
  extend: function(module, resolve) {
    return this.__eigen__().include(module, resolve, {_extended: this});
  },
  
  /**
   * JS.Kernel#hash() -> String
   * 
   * Returns a hexadecimal hashcode for the object for use in hashtables. By default,
   * this is a random number guaranteed to be unique to the object. If you override
   * this method, make sure that `a.equals(b)` implies `a.hash() === b.hash()`.
   **/
  hash: function() {
    return this.__hashcode__ = this.__hashcode__ || JS.Kernel.getHashCode();
  },
  
  /**
   * JS.Kernel#isA(type) -> Boolean
   * - type (JS.Module): module or class to check the object's type against
   * 
   * Returns `true` iff the object is an instance of `type` or one of its
   * subclasses, or if the object's class includes the module `type`.
   **/
  isA: function(moduleOrClass) {
    return this.__eigen__().includes(moduleOrClass);
  },
  
  /**
   * JS.Kernel#method(name) -> Function
   * - name (String): the name of the required method
   * 
   * Returns the named method from the object as a bound function.
   **/
  method: function(name) {
    var self  = this,
        cache = self.__mcache__ = self.__mcache__ || {};
    
    if ((cache[name] || {}).fn === self[name]) return cache[name].bd;
    return (cache[name] = {fn: self[name], bd: JS.bind(self[name], self)}).bd;
  },
  
  /**
   * JS.Kernel#methods() -> Array
   * 
   * Returns a list of all the method names defined on the object.
   **/
  methods: function() {
    return this.__eigen__().instanceMethods(true);
  },
  
  /**
   * JS.Kernel#tap(block[, context]) -> this
   * - block (Function): block of code to execute
   * - context (Object): sets the binding of `this` within `block`
   * 
   * Executes the given function passing the object as a parameter, and returns the
   * object rather than the result of the function. Designed to 'tap into' a method
   * chain to inspect intermediate values. From the Ruby docs:
   * 
   *     list                   .tap(function(x) { console.log("original: ", x) })
   *         .toArray()         .tap(function(x) { console.log("array: ", x) })
   *         .select(condition) .tap(function(x) { console.log("evens: ", x) })
   *         .map(square)       .tap(function(x) { console.log("squares: ", x) })
   **/
  tap: function(block, context) {
    block.call(context || null, this);
    return this;
  }
}),

{
  __hashIndex__: 0,
  
  getHashCode: function() {
    this.__hashIndex__ += 1;
    return (Math.floor(new Date().getTime() / 1000) + this.__hashIndex__).toString(16);
  }
});

JS.Module.include(JS.Kernel);
JS.extend(JS.Module, JS.Kernel.__fns__);
JS.Class.include(JS.Kernel);
JS.extend(JS.Class, JS.Kernel.__fns__);


/** section: core
 * class JS.Interface
 * 
 * `Interface` is a class used to encapsulate sets of methods and check whether objects
 * implement them. Think of interfaces as a means of duck-typing rather than as they are
 * used in Java.
 **/
JS.Interface = new JS.Class({
  /**
   * new JS.Interface(methods)
   * - methods (Array): a list of method names
   * 
   * An `Interface` is instantiated using a list of method names; these methods are the
   * API the interface can be used to check for.
   * 
   *     var HistoryInterface = new JS.Interface([
   *         'getInitialState',
   *         'changeState'
   *     ]);
   **/
  initialize: function(methods) {
    this.test = function(object, returnName) {
      var n = methods.length;
      while (n--) {
        if (!JS.isFn(object[methods[n]]))
          return returnName ? methods[n] : false;
      }
      return true;
    };
  },
  
  /**
   * JS.Interface#test(object[, returnName = false]) -> Boolean | String
   * - object (Object): object whose API we wish to check
   * - returnName (Boolean): if true, return the first name found to be missing
   * 
   * Checks whether `object` implements the interface, returning `true` or `false`. If
   * the second argument is `true`, returns the name of the first method found to be
   * missing from the object's API.
   **/
  
  extend: {
    /**
     * JS.Interface.ensure(object, iface1[, iface2]) -> undefined
     * - object (Object): object whose API we wish to check
     * - iface (JS.Interface): interface the object should implement
     * 
     * Throws an `Error` unless `object` implements the required interface(s).
     **/
    ensure: function() {
      var args = JS.array(arguments), object = args.shift(), face, result;
      while (face = args.shift()) {
        result = face.test(object, true);
        if (result !== true) throw new Error('object does not implement ' + result + '()');
      }
    }
  }
});


/** section: core
 * class JS.Singleton
 * 
 * `Singleton` is a class used to construct custom objects with all the inheritance features
 * of `JS.Class`, the methods from `JS.Kernel`, etc. It constructs an anonymous class from the
 * objects you provide and returns an instance of this class.
 **/
JS.Singleton = new JS.Class({
  /**
   * new JS.Singleton(name, parent, methods)
   * - name (String): the name of the singleton, used for debugging
   * - parent (JS.Class): the parent class to inherit from
   * - methods (Object): list of methods for the singleton
   * 
   * `Singleton`s are instantiated the same way as instances of `JS.Class`, the only difference
   * being that `Singleton` returns an instance of the newly created class, rather than the
   * class itself.
   **/
  initialize: function(name, parent, methods) {
    return new (new JS.Class(name, parent, methods));
  }
});


JS.MethodChain = function(base) {
  var queue      = [],
      baseObject = base || {};
  
  this.____ = function(method, args) {
    queue.push({func: method, args: args});
  };
  
  this.fire = function(base) {
    return JS.MethodChain.fire(queue, base || baseObject);
  };
};

JS.MethodChain.fire = function(queue, object) {
  var method, property, i, n;
  loop: for (i = 0, n = queue.length; i < n; i++) {
    method = queue[i];
    if (object instanceof JS.MethodChain) {
      object.____(method.func, method.args);
      continue;
    }
    switch (typeof method.func) {
      case 'string':    property = object[method.func];       break;
      case 'function':  property = method.func;               break;
      case 'object':    object = method.func; continue loop;  break;
    }
    object = (typeof property === 'function')
        ? property.apply(object, method.args)
        : property;
  }
  return object;
};

JS.MethodChain.prototype = {
  _: function() {
    var base = arguments[0],
        args, i, n;
    
    switch (typeof base) {
      case 'object': case 'function':
        args = [];
        for (i = 1, n = arguments.length; i < n; i++) args.push(arguments[i]);
        this.____(base, args);
    }
    return this;
  },
  
  toFunction: function() {
    var chain = this;
    return function(object) { return chain.fire(object); };
  }
};

JS.MethodChain.reserved = (function() {
  var names = [], key;
  for (key in new JS.MethodChain) names.push(key);
  return new RegExp('^(?:' + names.join('|') + ')$');
})();

JS.MethodChain.addMethod = function(name) {
  if (this.reserved.test(name)) return;
  var func = this.prototype[name] = function() {
    this.____(name, arguments);
    return this;
  };
  func.displayName = 'MethodChain#' + name;
};

JS.MethodChain.displayName = 'MethodChain';

JS.MethodChain.addMethods = function(object) {
  var methods = [], property, i;
  
  for (property in object)
    Number(property) !== property && methods.push(property);
  
  if (object instanceof Array) {
    i = object.length;
    while (i--)
      typeof object[i] === 'string' && methods.push(object[i]);
  }
  i = methods.length;
  while (i--) this.addMethod(methods[i]);
  
  object.prototype &&
    this.addMethods(object.prototype);
};

it = its = function() { return new JS.MethodChain; };

JS.Module.methodAdded(function(name) {
  JS.MethodChain.addMethod(name);
});

JS.Kernel.include({
  wait: function(time) {
    var chain = new JS.MethodChain;
    
    typeof time === 'number' &&
      setTimeout(chain.fire.bind(chain, this), time * 1000);
    
    this.forEach && typeof time === 'function' &&
      this.forEach(function() {
        setTimeout(chain.fire.bind(chain, arguments[0]), time.apply(this, arguments) * 1000);
      });
    
    return chain;
  },
  
  _: function() {
    var base = arguments[0],
        args = [],
        i, n;
    
    for (i = 1, n = arguments.length; i < n; i++) args.push(arguments[i]);
    return  (typeof base === 'object' && base) ||
            (typeof base === 'function' && base.apply(this, args)) ||
            this;
  }
}, true);


JS.Observable = new JS.Module('Observable', {
  extend: {
    DEFAULT_METHOD: 'update'
  },
  
  addObserver: function(observer, context) {
    (this.__observers__ = this.__observers__ || []).push({_block: observer, _context: context || null});
  },
  
  removeObserver: function(observer, context) {
    this.__observers__ = this.__observers__ || [];
    context = context || null;
    var i = this.countObservers();
    while (i--) {
      if (this.__observers__[i]._block === observer && this.__observers__[i]._context === context) {
        this.__observers__.splice(i,1);
        return;
      }
    }
  },
  
  removeObservers: function() {
    this.__observers__ = [];
  },
  
  countObservers: function() {
    return (this.__observers__ = this.__observers__ || []).length;
  },
  
  notifyObservers: function() {
    if (!this.isChanged()) return;
    var i = this.countObservers(), observer, block, context;
    while (i--) {
      observer = this.__observers__[i];
      block    = observer._block;
      context  = observer._context;
      if (JS.isFn(block)) block.apply(context || null, arguments);
      else block[context || JS.Observable.DEFAULT_METHOD].apply(block, arguments);
    }
  },
  
  setChanged: function(state) {
    this.__changed__ = !(state === false);
  },
  
  isChanged: function() {
    if (this.__changed__ === undefined) this.__changed__ = true;
    return !!this.__changed__;
  }
});

JS.Observable.include({
  subscribe:    JS.Observable.instanceMethod('addObserver'),
  unsubscribe:  JS.Observable.instanceMethod('removeObserver')
}, true);


JS.State = new JS.Module('State', {
  __getState__: function(state) {
    return  (typeof state === 'object' && state) ||
            (typeof state === 'string' && ((this.states || {})[state] || {})) ||
            {};
  },
  
  setState: function(state) {
    this.__state__ = this.__getState__(state);
    JS.State.addMethods(this.__state__, this.klass);
  },
  
  inState: function() {
    var i = arguments.length;
    while (i--) {
      if (this.__state__ === this.__getState__(arguments[i])) return true;
    }
    return false;
  },
  
  extend: {
    stub: function() { return this; },
    
    buildStubs: function(stubs, collection, states) {
      var state, method;
      for (state in states) {
        collection[state] = {};
        for (method in states[state]) stubs[method] = this.stub;
    } },
    
    buildCollection: function(module, states) {
      var stubs       = {},
          collection  = {},
          superstates = module.lookup('states').pop() || {},
          state, klass, methods, name;
      
      this.buildStubs(stubs, collection, states);
      this.buildStubs(stubs, collection, superstates);
      
      for (state in collection) {
        klass = (superstates[state]||{}).klass;
        klass = klass ? new JS.Class(klass, states[state]) : new JS.Class(states[state]);
        methods = {};
        for (name in stubs) { if (!klass.prototype[name]) methods[name] = stubs[name]; }
        klass.include(methods, false);
        collection[state] = new klass;
      }
      if (module.__res__) this.addMethods(stubs, module.__res__.klass);
      return collection;
    },
    
    addMethods: function(state, klass) {
      if (!klass) return;
      
      var methods = {},
          p       = klass.prototype,
          method;
      
      for (method in state) {
        if (p[method]) continue;
        p[method] = klass.__mod__.__fns__[method] = this.wrapped(method);
      }
    },
    
    wrapped: function(method) {
      return function() {
        var func = (this.__state__ || {})[method];
        return func ? func.apply(this, arguments): this;
      };
    }
  }
});

JS.Module.include({define: (function(wrapped) {
  return function(name, block) {
    if (name === 'states' && typeof block === 'object')
      arguments[1] = JS.State.buildCollection(this, block);
    return wrapped.apply(this, arguments);
  };
})(JS.Module.prototype.define)}, true);


/**
 * <p>Returns an object that wraps a collection of DOM element references by parsing
 * the given query using a CSS selector engine.</p>
 *
 * <p>Aliased as <tt>$()</tt>.</p>
 *
 * @params {String|Array} query
 * @returns {DomCollection}
 */
var Ojay = function() {
    var elements = [], arg, i, n;
    for (i = 0, n = arguments.length; i < n; i++) {
        arg = arguments[i];
        if (typeof arg == 'string') arg = Ojay.cssEngine.query(arg);
        if (arg.toArray) arg = arg.toArray();
        if (!(arg instanceof Array)) arg = [arg];
        elements = elements.concat(arg);
    }
    return new Ojay.DomCollection(elements.unique());
};

Ojay.VERSION = 'master-7bf74da460c9904c4a2bacfa7d728df9748fb7d2';

Array.from = JS.array;

Function.prototype.bind = function() {
    return JS.bind.apply(JS, [this].concat(JS.array(arguments)));
};


(function(Dom) {
    JS.extend(Ojay, /** @scope Ojay */{
        
        /**
         * <p>Returns an Ojay Collection containing zero or one element that matches the ID. Used
         * for situations where IDs contains dots, slashes, etc.</p>
         * @param {String} id
         * @returns {DomCollection}
         */
        byId: function(id) {
            var element = document.getElementById(id);
            return new this.DomCollection(element ? [element] : []);
        },
        
        /**
         * <p>Changes the alias of the <tt>Ojay()</tt> function to the given <tt>alias</tt>.
         * If the alias is already the name of an existing function, that function will be
         * stored and overridden. The next call to <tt>changeAlias</tt> or <tt>surrenderAlias</tt>
         * will restore the original function.</p>
         * @param {String} alias
         */
        changeAlias: function(alias) {
            this.surrenderAlias();
            this.ALIAS = String(alias);
            this.__alias = (typeof window[this.ALIAS] == 'undefined') ? null : window[this.ALIAS];
            window[this.ALIAS] = this;
        },
        
        /**
         * <p>Gives control of the shorthand function back to whichever script implemented
         * it before Ojay. After using this function, use the <tt>Ojay()</tt> function
         * instead of the shorthand.</p>
         * @returns {Boolean}
         */
        surrenderAlias: function() {
            if (this.__alias === null) {
                if (this.ALIAS) delete window[this.ALIAS];
                return false;
            }
            window[this.ALIAS] = this.__alias;
            return true;
        },
        
        /**
         * <p>Tells Ojay to trace calls to the methods you name. Only accepts methods on
         * <tt>Ojay.DomCollection.prototype</tt>.</p>
         * @param {String}
         */
        log: function() {
            Array.from(arguments).forEach(function(method) {
                this[method] = this[method].traced(method + '()');
            }, Ojay.DomCollection.prototype);
        },
        
        /**
         * <p>Returns an object with width and height properties specifying the size of the
         * document.</p>
         * @returns {Object}
         */
        getDocumentSize: function() {
            return {
                width: Dom.getDocumentWidth(),
                height: Dom.getDocumentHeight()
            };
        },
        
        /**
         * <p>Returns an object with left and top properties specifying the scroll offsets
         * document.</p>
         * @returns {Object}
         */
        getScrollOffsets: function() {
            return {
                left: Dom.getDocumentScrollLeft(),
                top: Dom.getDocumentScrollTop()
            };
        },
        
        /**
         * <p>Returns an object with width and height properties specifying the size of the
         * viewport.</p>
         * @returns {Object}
         */
        getViewportSize: function() {
            return {
                width: Dom.getViewportWidth(),
                height: Dom.getViewportHeight()
            };
        },
        
        /**
         * <p>Returns a <tt>Region</tt> object representing the currently visible area of
         * the document within the browser viewport.</p>
         * @returns {Region}
         */
        getVisibleRegion: function() {
            var viewport = this.getViewportSize(), scrolls = this.getScrollOffsets();
            return new this.Region({
                top:    scrolls.top,    bottom: scrolls.top + viewport.height,
                left:   scrolls.left,   right:  scrolls.left + viewport.width
            });
        }
    });
})(YAHOO.util.Dom);

Ojay.changeAlias('$');


/**
 * <p>This object contains definitions for <tt>Array</tt> instance methods defined
 * by Mozilla in JavaScript versions 1.6 and 1.8. They are applied to the <tt>Array</tt>
 * prototype as required to bring all browsers up to scratch.</p>
 *
 * <p>Definitions are taken from <a
 * href="http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods">Mozilla's
 * implementations</a> (made available under the MIT license).</p>
 */
Ojay.ARRAY_METHODS = {
    
    /**
     * <p>Returns the first index at which a given element can be found in the array, or
     * <tt>-1</tt> if it is not present.</p>
     */
    indexOf: function(elt /*, from*/) {
        var len = this.length;
        
        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) from += len;
        
        for (; from < len; from++) {
            if (from in this && this[from] === elt)
                return from;
        }
        return -1;
    },
    
    /**
     * <p>Returns the last index at which a given element can be found in the array, or
     * <tt>-1</tt> if it is not present. The array is searched backwards,
     * starting at <tt>fromIndex</tt>.</p>
     */
    lastIndexOf: function(elt /*, from*/) {
        var len = this.length;
        
        var from = Number(arguments[1]);
        if (isNaN(from)) {
            from = len - 1;
        }
        else {
          from = (from < 0) ? Math.ceil(from) : Math.floor(from);
          if (from < 0)
                from += len;
          else if (from >= len)
                from = len - 1;
        }
        
        for (; from > -1; from--) {
            if (from in this && this[from] === elt)
                return from;
        }
        return -1;
    },
    
    /**
     * <p><tt>filter</tt> calls a provided callback function once for each element in an
     * array, and constructs a new array of all the values for which <tt>callback</tt>
     * returns a <tt>true</tt> value. <tt>callback</tt> is invoked only for indexes of
     * the array which have assigned values; it is not invoked for indexes which have been
     * deleted or which have never been assigned values. Array elements which do not pass
     * the callback test are simply skipped, and are not included in the new array.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element, the
     * index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>filter</tt>, it will be
     * used as the <tt>this</tt> for each invocation of the callback. If it is not provided,
     * or is <tt>null</tt>, the global object associated with callback is used instead.</p>
     *
     * <p><tt>filter</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by filter is set before the first invocation of
     * <tt>callback</tt>. Elements which are appended to the array after the call to
     * <tt>filter</tt> begins will not be visited by <tt>callback</tt>. If existing elements
     * of the array are changed, or deleted, their value as passed to <tt>callback</tt> will
     * be the value at the time <tt>filter</tt> visits them; elements that are deleted are
     * not visited.</p>
     */
    filter: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var res = new Array();
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this) {
                var val = this[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, this))
                    res.push(val);
            }
        }
        
        return res;
    },
    
    /**
     * <p><tt>forEach</tt> executes the provided function (<tt>callback</tt>) once for each
     * element present in the array. <tt>callback</tt> is invoked only for indexes of the
     * array which have assigned values; it is not invoked for indexes which have been
     * deleted or which have never been assigned values.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element, the
     * index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>forEach</tt>, it will be used
     * as the <tt>this</tt> for each invocation of the callback. If it is not provided, or is
     * <tt>null</tt>, the global object associated with <tt>callback</tt> is used instead.</p>
     *
     * <p><tt>forEach</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by <tt>forEach</tt> is set before the first
     * invocation of <tt>callback</tt>. Elements which are appended to the array after the call
     * to <tt>forEach</tt> begins will not be visited by <tt>callback</tt>. If existing elements
     * of the array are changed, or deleted, their value as passed to <tt>callback</tt> will be
     * the value at the time <tt>forEach</tt> visits them; elements that are deleted are not
     * visited.</p>
     */
    forEach: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this)
                fun.call(thisp, this[i], i, this);
        }
    },
    
    /**
     * <p><tt>every</tt> executes the provided callback function once for each element
     * present in the array until it finds one where <tt>callback</tt> returns a
     * <tt>false</tt> value. If such an element is found, the <tt>every</tt> method
     * immediately returns <tt>false</tt>. Otherwise, if <tt>callback</tt> returned a
     * <tt>true</tt> value for all elements, <tt>every</tt> will return <tt>true</tt>.
     * <tt>callback</tt> is invoked only for indexes of the array which have assigned
     * values; it is not invoked for indexes which have been deleted or which have never
     * been assigned values.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element,
     * the index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>every</tt>, it will be
     * used as the <tt>this</tt> for each invocation of the callback. If it is not
     * provided, or is <tt>null</tt>, the global object associated with <tt>callback</tt>
     * is used instead.</p>
     *
     * <p><tt>every</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by <tt>every</tt> is set before the first
     * invocation of <tt>callback</tt>. Elements which are appended to the array after
     * the call to <tt>every</tt> begins will not be visited by <tt>callback</tt>. If
     * existing elements of the array are changed, their value as passed to <tt>callback</tt>
     * will be the value at the time <tt>every</tt> visits them; elements that are deleted
     * are not visited. <tt>every</tt> acts like the "for all" quantifier in mathematics.
     * In particular, for an empty array, it returns <tt>true</tt>. (It is vacuously true
     * that all elements of the empty set satisfy any given condition.)</p>
     */
    every: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this && !fun.call(thisp, this[i], i, this))
                return false;
        }
        
        return true;
    },
    
    /**
     * <p><tt>map</tt> calls a provided callback function once for each element in an array,
     * in order, and constructs a new array from the results. <tt>callback</tt> is invoked
     * only for indexes of the array which have assigned values; it is not invoked for
     * indexes which have been deleted or which have never been assigned values.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element, the
     * index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>map</tt>, it will be used as
     * the <tt>this</tt> for each invocation of the callback. If it is not provided, or is
     * <tt>null</tt>, the global object associated with <tt>callback</tt> is used instead.</p>
     *
     * <p><tt>map</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by <tt>map</tt> is set before the first invocation
     * of <tt>callback</tt>. Elements which are appended to the array after the call to
     * <tt>map</tt> begins will not be visited by <tt>callback</tt>. If existing elements of
     * the array are changed, or deleted, their value as passed to <tt>callback</tt> will be
     * the value at the time <tt>map</tt> visits them; elements that are deleted are not
     * visited.</p>
     */
    map: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this)
                res[i] = fun.call(thisp, this[i], i, this);
        }
        
        return res;
    },
    
    /**
     * <p><tt>some</tt> executes the callback function once for each element present in the
     * array until it finds one where <tt>callback</tt> returns a <tt>true</tt> value. If such
     * an element is found, <tt>some</tt> immediately returns <tt>true</tt>. Otherwise,
     * <tt>some</tt> returns <tt>false</tt>. <tt>callback</tt> is invoked only for indexes of
     * the array which have assigned values; it is not invoked for indexes which have been
     * deleted or which have never been assigned values.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element, the
     * index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>some</tt>, it will be used as
     * the <tt>this</tt> for each invocation of the callback. If it is not provided, or is
     * <tt>null</tt>, the global object associated with <tt>callback</tt> is used instead.</p>
     *
     * <p><tt>some</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by <tt>some</tt> is set before the first invocation
     * of <tt>callback</tt>. Elements that are appended to the array after the call to
     * <tt>some</tt> begins will not be visited by <tt>callback</tt>. If an existing, unvisited
     * element of the array is changed by <tt>callback</tt>, its value passed to the visiting
     * callback will be the value at the time that <tt>some</tt> visits that element's index;
     * elements that are deleted are not visited.</p>
     */
    some: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this && fun.call(thisp, this[i], i, this))
                return true;
        }
        
        return false;
    },
    
    /**
     * <p>Apply a function simultaneously against two values of the array (from
     * left-to-right) as to reduce it to a single value.</p>
     *
     * <p><tt>reduce</tt> executes the callback function once for each element present in the
     * array, excluding holes in the array, receiving four arguments: the initial value (or
     * value from the previous callback call), the value of the current element, the current
     * index, and the array over which iteration is occurring.</p>
     */
    reduce: function(fun /*, initial*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        // no value to return if no initial value and an empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();
        
        var i = 0;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        }
        else {
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }
                
                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);
        }
        
        for (; i < len; i++) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }
        
        return rv;
    },
    
    /**
     * <p>Apply a function simultaneously against two values of the array (from
     * right-to-left) as to reduce it to a single value.</p>
     *
     * <p><tt>reduceRight</tt> executes the callback function once for each element present in
     * the array, excluding holes in the array, receiving four arguments: the initial value (or
     * value from the previous callback call), the value of the current element, the current
     * index, and the array over which iteration is occurring.</p>
     */
    reduceRight: function(fun /*, initial*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        // no value to return if no initial value, empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();
        
        var i = len - 1;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        }
        else {
            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }
                
                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError();
            } while (true);
        }
        
        for (; i >= 0; i--) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }
        
        return rv;
    },
    
    /**
     * <p>Returns a new array containing all the elements of the original array but with
     * any duplicate entries removed.</p>
     * @returns {Array}
     */
    unique: function() {
        var results = [], i, n, arg;
        for (i = 0, n = this.length; i < n; i++) {
            arg = this[i];
            if (results.indexOf(arg) == -1)
                results.push(arg);
        }
        return results;
    },
    
    /**
     * <p>A shorthand for <tt>array.filter(func).length</tt>.</p>
     */
    count: function(fun, thisp) {
        return this.filter(fun, thisp).length;
    }
};

JS.extend(Array.prototype, Ojay.ARRAY_METHODS);


/**
 * Functional extensions: Copyright (c) 2005-2008 Sam Stephenson / the Prototype team,
 * released under an MIT-style license.
 */
JS.extend(Function.prototype, /** @scope Function.prototype */{
    
    /**
     * <p>'Masks' the internals of a function by setting its toString and valueOf methods
     * to return the masking function instead of the receiver. This can be used to make sure,
     * for example, that functions like JS.Class's callSuper() that rely on stringifying
     * functions for intrspection still work as desired.</p>
     * @param {Function} wrapper
     * @returns {Function}
     */
    _mask: function(wrapper) {
        this.valueOf = function() { return wrapper; };
        this.toString = function() { return wrapper.toString(); };
        return this;
    },
    
    /**
     * <p>Returns a new function that does the same thing as the original function, but has
     * some of its arguments preset. A contrived example:</p>
     *
     * <pre><code>    var add = function(a, b) { return a + b; };
     *     add(3, 5)  // --> 8
     *     
     *     var add12 = add.partial(12);  // 'a' is preset to 12
     *     add12(7)  // --> 19</code></pre>
     *
     * <p>More information <a href="http://prototypejs.org/api/function/curry">in the
     * Prototype documentation</a>. (Prototype calls this method <tt>curry</tt>, though
     * that's not strictly what it does.)</p>
     *
     * @returns {Function}
     */
    partial: function() {
        if (!arguments.length) return this;
        var method = this, args = Array.from(arguments);
        return function() {
            return method.apply(this, args.concat(Array.from(arguments)));
        }._mask(this);
    },
    
    /**
     * <p>Returns a copy of the function that is self-currying, i.e. every time you call it, it
     * returns a curried version of itself until it's got all its required arguments.</p>
     *
     * <pre><code>    var adder = function(a,b,c) {
     *         return a + b + c;
     *     };
     *     
     *     var add = adder.curry();
     *     
     *     add(1)(2)(3)  // --> 6
     *     add(7,8)(23)  // --> 38</code></pre>
     *
     * @param {Number} n
     * @returns {Function}
     */
    curry: function(n) {
        var method = this, n = n || this.length;
        return function() {
            if (arguments.length >= n) return method.apply(this, arguments);
            return method.partial.apply(arguments.callee, arguments);
        }._mask(this);
    },
    
    /**
     * <p>Allows you to 'intercept' calls to existing functions and manipulate their input and
     * output, providing aspect-oriented programming functionality. More information and
     * examples <a href="http://prototypejs.org/api/function/wrap">in the Prototype docs</a>.</p>
     * @param {Function} wrapper
     * @returns {Function}
     */
    wrap: function(wrapper) {
        var method = this;
        return function() {
            return wrapper.apply(this, [method.bind(this)].concat(Array.from(arguments))); 
        }._mask(this);
    },
    
    /**
     * <p>Returns a version of the function that, rather taking some argument <tt>foo</tt> as
     * its first argument, can be applied as a method of <tt>foo</tt>.</p>
     *
     * <pre><code>    var hexToDec = function(string) {
     *         var number = ... // convert hex string to decimal
     *         return number;
     *     };
     *     
     *     hexToDec('ff')   // --> 255
     *     
     *     String.prototype.hexToDec = hexToDec.methodize();
     *     'ff'.hexToDec()  // --> 255</code></pre>
     *
     * @returns {Function}
     */
    methodize: function() {
        if (this._methodized) return this._methodized;
        var method = this;
        return this._methodized = function() {
            return method.apply(null, [this].concat(Array.from(arguments)));
        }._mask(this);
    },
    
    /**
     * <p>Effectively does the opposite of <tt>methodize</tt>: it converts a function from a
     * method that uses <tt>this</tt> to refer to its operand, into one that takes the operand
     * as its first argument. This is useful for building iterators, amongst other things.</p>
     *
     * <pre><code>    var upper = "".toUpperCase.functionize();
     *     var strings = ['foo', 'bar', 'baz', ... ];
     *     
     *     var caps = strings.map(upper);
     *     // --> ['FOO', 'BAR', 'BAZ', ... ]</code></pre>
     *
     * @returns {Function}
     */
    functionize: function() {
        if (this._functionized) return this._functionized;
        var method = this;
        return this._functionized = function() {
            var args = Array.from(arguments);
            return method.apply(args.shift(), args);
        }._mask(this);
    },
    
    /**
     * <p>Returns a function that returns the result of applying the function to its arguments,
     * but that logs its input and output to the Firebug console. Derived from a similar function
     * in Oliver Steele's Functional library.</p>
     *
     * Copyright: Copyright 2007 by Oliver Steele.  All rights reserved.
     * http://osteele.com/sources/javascript/functional/
     *
     * @param {String} name
     * @param {String} func
     * @returns {Function}
     */
    traced: function(name, func) {
        var method = this, name = name || this, func = func || 'info';
        return function() {
            window.console && console[func](name, ' called on ', this, ' with ', arguments);
            var result = method.apply(this, arguments);
            window.console && console[func](name, ' -> ', result);
            return result;
        }._mask(this);
    },
    
    /**
     * <p>Returns a copy of the function that will only run the specified number of times. Note
     * that if the function is an instance method, it will run the given number of times in total,
     * not per instance.</p>
     * @param {Number} times
     * @returns {Function}
     */
    runs: function(times) {
        var method = this, count = 0;
        return function() {
            return (count++ < times) ? method.apply(this, arguments) : undefined;
        }._mask(this);
    }
});


/**
 * String extensions: Copyright (c) 2005-2008 Sam Stephenson / the Prototype team,
 * released under an MIT-style license.
 */

String.SCRIPT_FRAGMENT = '<script[^>]*>([\\S\\s]*?)<\/script>';

JS.extend(String.prototype, /** @scope String.prototype */{
    
    /**
     * <p>Returns an array containing the content of any <tt>&lt;script&gt;</tt> tags present
     * in the string.</p>
     * @returns {Array}
     */
    extractScripts: function() {
        var matchAll = new RegExp(String.SCRIPT_FRAGMENT, 'img');
        var matchOne = new RegExp(String.SCRIPT_FRAGMENT, 'im');
        return (this.match(matchAll) || []).map(function(scriptTag) {
            return (scriptTag.match(matchOne) || ['', ''])[1];
        });
    },
    
    /**
     * <p>Extracts the content of any <tt>&lt;script&gt;</tt> tags present in the string and
     * <tt>eval</tt>s them. Returns an array containing the return value of each evaluated
     * script.</p>
     */
    evalScripts: function() {
        return this.extractScripts().map(function(script) { return eval(script); });
    },
    
    /**
     * <p>Returns the result of parsing the string as JSON. Requires the YUI JSON utility.</p>
     * @returns {Object|Array}
     */
    parseJSON: function() {
        return YAHOO.lang.JSON.parse(this.valueOf());
    },
    
    /**
     * <p>Returns a copy of the string with all &lt;script&gt; tags removed.</p>
     * @returns {String}
     */
    stripScripts: function() {
        return this.replace(new RegExp(String.SCRIPT_FRAGMENT, 'img'), '');
    },
    
    /**
     * <p>Returns a copy of the string with all HTML tags removed.</p>
     * @returns {String}
     */
    stripTags: function() {
        return this.replace(/<\/?[^>]+>/gi, '').trim();
    },
    
    /**
     * <p>Returns a copy of the string with all leading and trailing whitespace removed.</p>
     * @returns {String}
     */
    trim: YAHOO.lang.trim.methodize()
});


/**
 * @overview
 * <p>Ojay adds all the single-number functions in <tt>Math</tt> as methods to <tt>Number</tt>.
 * The following methods can all be called on numbers:</p>
 *
 * <pre><code>abs, acos, asin, atan, ceil, cos, exp, floor, log, pow, round, sin, sqrt, tan</code></pre>
 */
'abs acos asin atan ceil cos exp floor log pow round sin sqrt tan'.split(/\s+/).
        forEach(function(method) {
            Number.prototype[method] = Math[method].methodize();
        });

/**
 * <p>Calls the given <tt>block</tt> in the scope of <tt>context</tt> a given number of
 * times. The block receives the iteration index each time it is called.</p>
 * @param {Function} block
 * @param {Object} context
 */
Number.prototype.times = function(block, context) {
    if (this < 0) return;
    for (var i = 0; i < this; i++) block.call(context || null, i);
};

/**
 * <p>Returns <tt>true</tt> iff the number is between <tt>a</tt> and <tt>b</tt> inclusive.
 * To test the range without including the end points, pass <tt>false</tt> as the third
 * argument.</p>
 * @param {Number} a
 * @param {Number} b
 * @param {Boolean} inclusive
 * @returns {Boolean}
 */
Number.prototype.between = function(a, b, inclusive) {
    if (this > a && this < b) return true;
    return (this == a || this == b) ? (inclusive !== false) : false;
};


/**
 * Copyright (c) 2007-2008 James Coglan
 * http://blog.jcoglan.com/reiterate/
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

Function.from = function(iterator) {
  if (iterator.toFunction) return iterator.toFunction();
  if (typeof iterator == 'function') return iterator;
  if (typeof iterator == 'object') return Function.fromObject(iterator);
  return function(x) { return x; };
};

String.prototype.toFunction = function() {
  var properties = this.split('.');
  if (!properties[0]) return function(x) { return x; };
  return function(o) {
    var object, member = o, key;
    for (var i = 0, n = properties.length; i < n; i++) {
      key = properties[i];
      object = member;
      member = object[key];
      if (typeof member == 'function') member = member.apply(object);
    }
    return member;
  };
};

Array.prototype.toFunction = function() {
  var method = this[0], args = this.slice(1);
  if (!method) return function(x) { return x; };
  return function(o) {
    var fn = (typeof method == 'function') ? method : o[method];
    return (typeof fn == 'function') ? fn.apply(o, args) : undefined;
  };
};

Function.fromObject = function(object) {
  var keys = [];
  for (var field in object) { if (object.hasOwnProperty(field)) keys.push(field); }
  if (keys.length === 0) return function(x) { return x; };
  return function(o) {
    var result = true, key, fn, args;
    for (var i = 0, n = keys.length; i < n; i++) {
      key = keys[i];
      fn = o[key]; args = object[key];
      if (typeof fn == 'function' && !(args instanceof Array)) args = [args];
      result = result && ((typeof fn == 'function') ? fn.apply(o, args) : fn == args);
    }
    return result;
  };
};

'filter forEach every map some'.split(/\s+/).forEach(function(method) {
  this[method] = this[method].wrap(function(fn, iterator, thisObject) {
    if (iterator) iterator = Function.from(iterator);
    return fn(iterator, thisObject);
  });
}, Array.prototype);


/**
 * @overview
 * <p>This file contains adapter objects that allow Ojay to use a variety of CSS selector
 * backends. Given that CSS engines are now being released as standalone libraries, it
 * makes sense to let people choose which one they want to use.</p>
 * 
 * <p>Ojay includes support for <tt>YAHOO.util.Selector</tt>, <tt>Sizzle</tt> and
 * <tt>peppy</tt> engines, but it is trivial to add support for others.</p>
 */
Ojay.Selectors = {
    Native: {
        /**
         * @param {String} selector
         * @param {HTMLElement} context
         * @returns {Array}
         */
        query: function(selector, context) {
            return Array.from((context || document).querySelectorAll(selector));
        },
        
        /**
         * @param {HTMLElement} node
         * @param {String} selector
         * @returns {Boolean}
         */
        test: function(node, selector) {
            var results = this.query(selector, node.parentNode);
            return results.indexOf(node) != -1;
        }
    },
    
    Yahoo: {
        /**
         * @param {String} selector
         * @param {HTMLElement} context
         * @returns {Array}
         */
        query: function(selector, context) {
            return YAHOO.util.Selector.query(selector, context);
        },
        
        /**
         * @param {HTMLElement} node
         * @param {String} selector
         * @returns {Boolean}
         */
        test: function(node, selector) {
            return YAHOO.util.Selector.test(node, selector);
        }
    },
    
    Ext: {
        /**
         * @param {String} selector
         * @param {HTMLElement} context
         * @returns {Array}
         */
        query: function(selector, context) {
            return Ext.DomQuery.select(selector, context);
        },
        
        /**
         * @param {HTMLElement} node
         * @param {String} selector
         * @returns {Boolean}
         */
        test: function(node, selector) {
            return Ext.DomQuery.is(node, selector);
        }
    },
    
    Sizzle: {
        /**
         * @param {String} selector
         * @param {HTMLElement} context
         * @returns {Array}
         */
        query: function(selector, context) {
            return Sizzle(selector, context);
        },
        
        /**
         * @param {HTMLElement} node
         * @param {String} selector
         * @returns {Boolean}
         */
        test: function(node, selector) {
            return Sizzle.filter(selector, [node]).length === 1;
        }
    },
    
    Peppy: {
        /**
         * @param {String} selector
         * @param {HTMLElement} context
         * @returns {Array}
         */
        query: function(selector, context) {
            return peppy.query(selector, context);
        },
        
        /**
         * @param {HTMLElement} node
         * @param {String} selector
         * @returns {Boolean}
         */
        test: function(node, selector) {
            var results = peppy.query(selector, node, true);
            return results.indexOf(node) != -1;
        }
    }
};

// Default choice is YUI, or qSA if available
Ojay.cssEngine = document.querySelectorAll
               ? Ojay.Selectors.Native
               : Ojay.Selectors.Yahoo;


(function(Event) {
    JS.extend(Ojay, /** @scope Ojay */{
        /**
         * <p>Pre-built callback that stops the default browser reaction to an event.</p>
         * @param {DomCollection} element
         * @param {Event} evnt
         */
        stopDefault: function(element, evnt) {
            Event.preventDefault(evnt);
        },
        
        /**
         * <p>Pre-built callback that stops the event bubbling up the DOM tree.</p>
         * @param {DomCollection} element
         * @param {Event} evnt
         */
        stopPropagate: function(element, evnt) {
            Event.stopPropagation(evnt);
        },
        
        /**
         * <p>Pre-built callback that both stops the default behaviour and prevents bubbling.</p>
         * @param {DomCollection} element
         * @param {Event} evnt
         */
        stopEvent: function(element, evnt) {
            Ojay.stopDefault(element, evnt);
            Ojay.stopPropagate(element, evnt);
        },
        
        /**
         * <p>Returns an event callback that checks the event target against each given CSS
         * selector and fires all the applicable callbacks. Based on prior ideas from:</p>
         *
         * <ul>
         *     <li>http://icant.co.uk/sandbox/eventdelegation/</li>
         *     <li>http://www.danwebb.net/2008/2/8/event-delegation-made-easy-in-jquery</li>
         * </ul>
         *
         * <p>To delegate events, supply an object mapping CSS selectors to callback functions.
         * when the event fires, the target is compared against all given selectors all all
         * applicable callbacks are fired. If the secord parameter is set to <tt>true</tt>,
         * the delegator will crawl back up the DOM tree until it finds an element that contains
         * the target and matches the given selector.</p>
         *
         * @param {Object} map
         * @param {Boolean} includeAncestors
         * @returns {Function}
         */
        delegateEvent: function(map, includeAncestors) {
            return function(element, evnt) {
                var target = evnt.getTarget(), candidate;
                for (var selector in map) {
                    if (!target.matches(selector) && !includeAncestors) continue;
                    candidate = target;
                    if (includeAncestors) while (candidate && !candidate.matches(selector)) {
                        candidate = Ojay(candidate.node.parentNode);
                        if (candidate.node == document.body) candidate = null;
                    }
                    if (candidate) Function.from(map[selector]).call(this, candidate, evnt);
                }
            };
        },
        
        _getTarget: function() { return Ojay(Event.getTarget(this)); }
    });
    
    Ojay.stopDefault.method     = Ojay.stopDefault.partial(null).methodize();
    Ojay.stopPropagate.method   = Ojay.stopPropagate.partial(null).methodize();
    Ojay.stopEvent.method       = Ojay.stopEvent.partial(null).methodize();
    
    ['onDOMReady', 'onContentReady', 'onAvailable'].forEach(function(method) {
        Ojay[method] = Event[method].bind(Event);
    });
})(YAHOO.util.Event);


/**
 * <p>The <tt>Ojay.Observable</tt> module extends the <tt>JS.Observable</tt> module with an
 * <tt>on()</tt> method that behaves similarly to <tt>DomCollection#on()</tt>, used for
 * monitoring DOM events. It uses <tt>addObserver()</tt> to set up an interface through
 * which an object may publish named events, and other objects can listen to such events,
 * just as for DOM events. Here's an example of a class that uses the module:</p>
 *
 * <pre><code>    var Player = new JS.Class({
 *         include: Ojay.Observable,
 *         
 *         play: function() {
 *             this.startTime = this.getTime();
 *             this.notifyObservers('start');
 *         },
 *         
 *         pause: function() {
 *             var elapsed = this.getTime() - this.startTime;
 *             this.notifyObservers('pause', elapsed);
 *         },
 *         
 *         getTime: function() {
 *             return Number(new Date()) / 1000;
 *         }
 *     });</code></pre>
 *
 * <p>The <tt>getTime()</tt> method simply returns the current timestamp in seconds. The
 * <tt>play()</tt> method records the current time and fires the <tt>start</tt> event by using
 * <tt>notifyObservers()</tt> to send a message to its observers. The <tt>pause()</tt>
 * method simply publishes a <tt>pause</tt> event that sends the elapsed time to any
 * listeners.</p>
 *
 * <p>Some client code to listen to one of these objects might look like this:</p>
 *
 * <pre><code>    var p = new Player();
 *     
 *     p.on('start', function(player) {
 *         alert(player.startTime);
 *     });
 *     
 *     p.on('pause', function(player, timeElapsed) {
 *         alert(timeElapsed);
 *     });</code></pre>
 *
 * <p>All listeners receive the object that fired the event as their first argument, and
 * any data published by said object with the event as the subsequent arguments. An optional
 * third argument to <tt>on()</tt> specifies the execution context of the listener function,
 * so for example:</p>
 *
 * <pre><code>    p.on('start', function() {
 *         // this === someObject
 *     }, someObject);</code></pre>
 *
 * <p>All calls to <tt>on()</tt> return a <tt>MethodChain</tt> object that, by default, will
 * fire on the object publishing the event, so the following:</p>
 *
 * <pre><code>    p.on('start').pause();</code></pre>
 *
 * <p>Will cause <tt>p</tt> to call its <tt>pause()</tt> method whenever its <tt>start</tt>
 * event is fired.</p>
 *
 * <p>For further information on this module, see the <tt>JS.Observable</tt> documentation at
 * http://jsclass.jcoglan.com/observable.html.</p>
 *
 * @module Observable
 */
Ojay.Observable = new JS.Module('Ojay.Observable', {
    include: JS.Observable,
    
    /**
     * <p>Registers an event listener on the object. Takes an event name and an optional
     * callback function, and returns a <tt>MethodChain</tt> that will fire on the source
     * object. The callback receives the source object as the first parameter.</p>
     * @param {String} eventName
     * @param {Function} callback
     * @param {Object} scope
     * @returns {MethodChain}
     */
    on: function(eventName, callback, scope) {
        var chain = new JS.MethodChain;
        if (callback && typeof callback != 'function') scope = callback;
        this.addObserver(function() {
            var args = Array.from(arguments), message = args.shift();
            if (message != eventName) return;
            if (typeof callback == 'function') callback.apply(scope || null, args);
            chain.fire(scope || args[0]);
        }, this);
        return chain;
    },
    
    /**
     * <p>Notifies all observers of an object, sending them the supplied arguments. Use
     * the first argument to specify the event name for handlers registered using
     * <tt>Observable#on()</tt>.</p>
     * @returns {Observable}
     */
    notifyObservers: function() {
        var args = Array.from(arguments),
            receiver = (args[1]||{}).receiver || this;
        
        if (receiver == this) args.splice(1, 0, receiver);
        else args[1] = receiver;
        
        this.callSuper.apply(this, args);
        
        args[1] = {receiver: receiver};
        var classes = this.klass.ancestors(), klass;
        while (klass = classes.pop())
            klass.notifyObservers && klass.notifyObservers.apply(klass, args);
        
        return this;
    },
    
    extend: /** @scope Ojay.Observable */{
        /**
         * <p>Any module that includes <tt>Observable</tt> is also extended
         * using <tt>Observable</tt>.</p>
         * @param {Class|Module} base
         */
        included: function(base) {
            base.extend(this);
        }
    }
});

Ojay.Observable.extend(Ojay.Observable);


(function(Ojay, Dom) {
    /**
     * <p>Wraps collections of DOM element references with an API for manipulation of page
     * elements. Includes methods for getting/setting class names and style attributes,
     * traversing the DOM, setting up event handlers, and performing animation.</p>
     * @constructor
     * @class DomCollection
     */
    Ojay.DomCollection = new JS.Class('Ojay.DomCollection', /** @scope Ojay.DomCollection.prototype */{
        /**
         * @param {Array} collection
         * @returns {DomCollection}
         */
        initialize: function(collection) {
            this.length = 0;
            for (var i = 0, n = collection.length, nodeType, push = [].push; i < n; i++) {
                nodeType = collection[i].nodeType;
                if (nodeType === Ojay.HTML.ELEMENT_NODE ||
                    nodeType === Ojay.HTML.DOCUMENT_NODE ||
                    collection[i] == window)
                    push.call(this, collection[i]);
            }
            this.node = this[0];
            return this;
        },
        
        /**
         * <p>Returns the elements of the collection as a native Array type. Can optionally take
         * a function to convert values as the new array is constructed.</p>
         * @param {Function} via
         * @returns {Array}
         */
        toArray: function(via) {
            if (via) via = Function.from(via);
            var results = [], i, n = this.length;
            for (i = 0; i < n; i++) results.push(via ? via(this[i]) : this[i]);
            return results;
        },
        
        /**
         * <p> Returns a <tt>DomCollection</tt> wrapping the <tt>n</tt>th element in the current
         * collection.</p>
         * @param {Number} n
         * @returns {DomCollection}
         */
        at: function(n) {
            n = Number(n).round();
            var item = (n >= 0 && n < this.length) ? [this[n]] : [];
            return new this.klass(item);
        },
        
        /**
         * <p>Registers event listeners on all the members of the collection. You must supply at
         * least the name of the event to listen for, and you can supply a callback function and
         * (optionally) its scope as well. This method returns a <tt>MethodChain</tt> so you can
         * write more sentence-like code without needing to write explicit callback functions. Some
         * examples:</p>
         *
         * <pre><code>    Ojay('p').on('click').setStyle({textDecoration: 'underline'});
         *     
         *     Ojay('p').on('mouseout').hide().parents().setStyle( ... );
         *     
         *     Ojay('li').on('click')._('h1#title').setStyle({color: '#f00'});</code></pre>
         *
         * <p>When using chaining like this, the method chain is fired only on the element that
         * triggers each event, not on the whole collection you called <tt>on()</tt> on.</p>
         *
         * <p>When using explicit callback functions, the callback receives on <tt>Ojay</tt> object
         * wrapping the element that triggered the event, and the event object as arguments. If you
         * supply your own scope parameter, <tt>this</tt> refers to your supplied object inside the
         * callback.</p>
         *
         * <pre><code>    Ojay('div').on('click', function(element, ev) {
         *         // 'this' does not refer to anything useful
         *     });
         *     
         *     Ojay('p').on('mouseout', function(element, ev) {
         *         // 'this' refers to the object 'someObject'
         *     }, someObject);</code></pre>
         *
         * <p>Even when you supply an explicit function, <tt>on()</tt> returns a <tt>MethodChain</tt>
         * so you can use the chaining feature as well. You can store a reference to this collector
         * so you can modify the event handler at a later time, <em>without actually creating any new
         * handlers</em>:</p>
         *
         * <pre><code>    var chain = Ojay('a.external').on('click');
         *
         *     // somewhere else...
         *     chain.addClass('clicked');</code></pre>
         *
         * <p>Any <tt>a.external</tt> will then gain the class name when it is clicked.</p>
         *
         * <p>There is one final subtlety: if you supply a second argument that is NOT a function, it
         * will be used as the base object for any chain firings. e.g.:</p>
         *
         * <pre><code>    // When these &lt;p&gt;s are clicked, the &lt;h1&gt; changes
         *     Ojay('p.changer').on('click', Ojay('h1')).setStyle({textTransform: 'uppercase'})</code></pre>
         *
         *
         * <p>Ojay gives you easy control of how the browser should respond to events. Inside your
         * callback function, you can prevent the event's default behaviour and stop it bubbling up
         * the DOM like so:</p>
         *
         * <pre><ocde>    Ojay('a').on('click', function(element, ev) {
         *         ev.stopDefault();
         *         // ... your custom behaviour
         *     });</code></pre>
         *
         * <p><tt>stopDefault</tt> stops the browser running the default behaviour for the event, e.g.
         * loading a new page when a link is clicked. The method <tt>stopPropagate</tt> stops the
         * event bubbling, and <tt>stopEvent</tt> does both. If all your callback does is call one
         * of these methods, you can use on of Ojay's pre-stored callbacks instead:</p>
         *
         * <pre><code>    Ojay('a').on('click', Ojay.stopDefault).setStyle({textDecoration: 'underline'});</code></pre>
         *
         * <p>You can use <tt>stopDefault</tt>, <tt>stopPropagate</tt> and <tt>stopEvent</tt> in this
         * manner. Using these is recommended over writing your own callbacks to do this, as creating
         * new identical functions wastes memory.</p>
         *
         * @param {String} eventName
         * @param {Function} callback
         * @param {Object} scope
         * @returns {MethodChain}
         */
        on: function(eventName, callback, scope) {
            var chain = new JS.MethodChain;
            if (callback && typeof callback != 'function') scope = callback;
            
            var handler = function(evnt) {
                if (evnt.eventName !== undefined && evnt.eventName != eventName) return;
                var wrapper = Ojay(this);
                evnt.stopDefault   = Ojay.stopDefault.method;
                evnt.stopPropagate = Ojay.stopPropagate.method;
                evnt.stopEvent     = Ojay.stopEvent.method;
                evnt.getTarget     = Ojay._getTarget;
                if (typeof callback == 'function') callback.call(scope || null, wrapper, evnt);
                chain.fire(scope || wrapper);
            };
            
            if (/:/.test(eventName)) {
                for (var i = 0, n = this.length; i < n; i++) (function(element) {
                    var wrapped = handler.bind(element);
                    if (element.addEventListener) {
                        element.addEventListener('dataavailable', wrapped, false);
                    } else {
                        element.attachEvent('ondataavailable', wrapped);
                        element.attachEvent('onfilterchange', wrapped);
                    }
                })(this[i]);
            } else {
                YAHOO.util.Event.on(this, eventName, handler);
            }
            return chain;
        },
        
        /**
         * <p>Fires a custom event on each element in the collection, firing any custom event
         * handlers that have been registered on these elements. The first argument should be
         * the name of the event to fire, and the second argument (optional) should be a boolean
         * indicating whether the event should bubble or not (this defaults to true).</p>
         * @param {String} eventName
         * @param {Object} data
         * @param {Boolean} bubble
         * @returns {DomCollection}
         */
        trigger: function(eventName, data, bubble) {
            bubble = (bubble === undefined) ? true : false;
            
            for (var i = 0, n = this.length; i < n; i++) (function(element) {
                if (element == document && document.createEvent && !element.dispatchEvent)
                    element = document.documentElement;
                var event;
                if (document.createEvent) {
                    event = document.createEvent('HTMLEvents');
                    event.initEvent('dataavailable', bubble, true);
                } else {
                    event = document.createEventObject();
                    event.eventType = bubble ? 'ondataavailable' : 'onfilterchange';
                }
                event.eventName = eventName;
                JS.extend(event, data || {});
                
                try { document.createEvent ? element.dispatchEvent(event)
                                           : element.fireEvent(event.eventType, event);
                } catch (e) {}
            })(this[i]);
            
            return this;
        },
        
        /**
         * <p>Runs an animation on all the elements in the collection. The method expects you to supply
         * at least an object specifying CSS properties to animate, and the duration of the animation.</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({marginLeft: {to: 200}}, 1.5)</code></pre>
         *
         * <p>Functions can be used for any of these values to apply a different animation to each element
         * in the collection. Each function is passed the element's position in the collection (<tt>i</tt>)
         * and the element itself (<tt>el</tt>), and is evaluated just before the animation begins. <tt>el</tt>
         * is actually a <tt>DomCollection</tt> wrapping a single element. For example, to animate some
         * list elements out by a staggered amount, do:</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({
         *        marginLeft: {
         *            to: function(i, el) { return 40 * i; }
         *        }
         *    }, 2.0);</code></pre>
         *
         * <p>The functions can appear at any level of the <tt>parameters</tt> object, so you could write
         * the above as:</p>
         *
         * <pre><code>   Ojay('#some-list li').animate(function(i, el) {
         *        return {
         *            marginLeft: {to: 40 * i}
         *        };
         *    }, 2.0);</code></pre>
         *
         * <p>or</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({
         *        marginLeft: function(i, el) {
         *            return {to: 40 * i};
         *        }
         *    }, 2.0);</code></pre>
         *
         * <p>This allows for highly flexible animation definitions. You can also specify a function as
         * the <tt>duration</tt> parameter, so that each element takes a different time to animate:</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({marginLeft: {to: 200}},
         *            function(i) { return 0.5 + 2.0 * (i/5).sin().abs(); });</code></pre>
         *
         * <p>The final parameter, <tt>options</tt>, allows you to specify various optional arguments to
         * control the animation. They are:</p>
         *
         * <p><tt>easing</tt>: The easing function name (from <tt>YAHOO.util.Easing</tt>) to control the
         * flow of the animation. Default is <tt>'easeBoth'</tt>.</p>
         *
         * <p><tt>after</tt>: A function to be called for each memeber of the collection when it finishes
         * its animation. The function receives the element and its position in the list as arguments.</p>
         *
         * <p>An example:</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({marginLeft: {to: 40}}, 5.0, {easing: 'elasticOut'});</code></pre>
         *
         * @param {Object|Function} parameters
         * @param {Number|Function} duration
         * @param {Object} options
         * @returns {MethodChain}
         */
        animate: function(parameters, duration, options) {
            var animation = new Ojay.Animation(this, parameters, duration, options);
            animation.run();
            return animation.chain;
        },
        
        /**
         * @param {Object} parameters
         * @param {Number|Function} duration
         * @param {Object} options
         * @returns {MethodChain}
         */
        scroll: function(parameters, duration, options) {
            if (duration) {
                var animation = new Ojay.Animation(this, {scroll: {to: parameters}}, duration, options, YAHOO.util.Scroll);
                animation.run();
                return animation.chain;
            } else {
                for (var i = 0, n = this.length; i < n; i++) {
                    this[i].scrollLeft = parameters[0];
                    this[i].scrollTop = parameters[1];
                }
                return this;
            }
        },
        
        /**
         * <p>Adds the given string as a class name to all the elements in the collection and returns
         * a reference to the collection for chaining.</p>
         * @param {String} className
         * @returns {DomCollection}
         */
        addClass: function(className) {
            Dom.addClass(this, className);
            this.trigger('ojay:classadded', {className: className}, false);
            return this;
        },
        
        /**
         * <p>Removes the given class name(s) from all the elements in the collection and returns a
         * reference to the collection for chaining.</p>
         * @param {String} className
         * @returns {DomCollection}
         */
        removeClass: function(className) {
            Dom.removeClass(this, className);
            this.trigger('ojay:classremoved', {className: className}, false);
            return this;
        },
        
        /**
         * <p>Replaces <tt>oldClass</tt> with <tt>newClass</tt> for every element in the collection
         * and returns a reference to the collection for chaining.</p>
         * @param {String} oldClass
         * @param {String} newClass
         * @returns {DomCollection}
         */
        replaceClass: function(oldClass, newClass) {
            Dom.replaceClass(this, oldClass, newClass);
            this.trigger('ojay:classremoved', {className: oldClass}, false);
            this.trigger('ojay:classadded', {className: newClass}, false);
            return this;
        },
        
        /**
         * <p>Sets the class name of all the elements in the collection to the given value and
         * returns a reference to the collection for chaining.</p>
         * @param {String} className
         * @returns {DomCollection}
         */
        setClass: function(className) {
            for (var i = 0, n = this.length; i < n; i++)
                this[i].className = className;
            this.trigger('ojay:classadded', {className: className}, false);
            return this;
        },
        
        /**
         * <p>Returns true iff the first member of the collection has the given class name.</p>
         * @param {String} className
         * @returns {Boolean}
         */
        hasClass: function(className) {
            if (!this.node) return undefined;
            return Dom.hasClass(this.node, className);
        },
        
        /**
         * <p>Returns the value of the named style property for the first element in the collection.</p>
         * @param {String} name
         * @returns {String}
         */
        getStyle: function(name) {
            if (!this.node) return undefined;
            return Dom.getStyle(this.node, String(name));
        },
        
        /**
         * <p>Sets the style of all the elements in the collection using a series of key/value pairs.
         * Keys correspond to CSS style property names, and should be camel-cased where they would
         * be hyphentated in stylesheets. Returns the <tt>DomCollection</tt> instance for chaining.
         * You need to use a string key for <tt>'float'</tt> as it's a reserved word in JavaScript.</p>
         *
         * <pre><code>    Ojay('p').setStyle({color: '#f00', fontSize: '14px', 'float': 'left'});</code></pre>
         *
         * @param {Object} options
         * @returns {DomCollection}
         */
        setStyle: function(options) {
            var value, isIE = !!YAHOO.env.ua.ie;
            for (var property in options) {
                if (isIE && property == 'opacity') {
                    value = Number(options[property]);
                    if (value === 0) options[property] = 0.001;
                    if (value === 1) {
                        Dom.setStyle(this, 'filter', '');
                        continue;
                    }
                }
                Dom.setStyle(this, property, options[property]);
            }
            this.trigger('ojay:stylechange', {styles: options}, false);
            return this;
        },
        
        /**
         * <p>Sets the given HTML attributes of all the elements in the collection, and returns the
         * collection for chaining. Use <tt>setClass()</tt> to change class names.</p>
         *
         * <pre><code>    Ojay('img').set({src: 'images/tom.png'});</code></pre>
         *
         * <p>Boolean attributes can be set and unset by passing in the appropriate boolean value.</p>
         *
         * <pre><code>    Ojay('input[type=checkbox]').set({disabled: true});</code></pre>
         *
         * @param {Object} options
         * @returns {DomCollection}
         */
        set: function(options) {
            for (var i = 0, n = this.length; i < n; i++) {
                for (var key in options) {
                    switch (options[key]) {
                        case true:  this[i].setAttribute(key, key);     break;
                        case false: this[i].removeAttribute(key);       break;
                        default:    this[i].setAttribute(key, options[key]);
                    }
                }
            }
            this.trigger('ojay:attrchange', {attributes: options}, false);
            return this;
        },
        
        setAttributes: function() {
            return this.set.apply(this, arguments);
        }.traced('setAttributes() is deprecated; used set() instead', 'warn'),
        
        /**
         * <p>Hides every element in the collection and returns the collection.</p>
         * @returns {DomCollection}
         */
        hide: function() {
            this.setStyle({display: 'none'});
            this.trigger('ojay:hide', {}, false);
            return this;
        },
        
        /**
         * <p>Shows/unhides every element in the collection and returns the collection.</p>
         * @returns {DomCollection}
         */
        show: function() {
            this.setStyle({display: ''});
            this.trigger('ojay:show', {}, false);
            return this;
        },
        
        /**
         * <p>If <tt>html</tt> is a string, sets the <tt>innerHTML</tt> of every element in the
         * collection to the given string value. If <tt>html</tt> is an <tt>HTMLElement</tt>, inserts
         * the element into the first item in the collection (inserting DOM nodes multiple times just
         * moves them from place to place).</p>
         * @param {String|HTMLElement} html
         * @returns {DomCollection}
         */
        setContent: function(html) {
            if (!this.node) return this;
            if (html instanceof this.klass) html = html.node;
            if (html && html.nodeType === Ojay.HTML.ELEMENT_NODE) {
                this.node.innerHTML = '';
                this.node.appendChild(html);
            } else {
                this.forEach(function(element) {
                    element.node.innerHTML = '';
                    element.insert(html, 'bottom');
                });
            }
            this.trigger('ojay:contentchange', {content: html}, true);
            return this;
        },
        
        /**
         * <p>Inserts the given <tt>html</tt> (a <tt>String</tt> or an <tt>HTMLElement</tt>) into every
         * element in the collection at the given <tt>position</tt>. <tt>position</tt> can be one of
         * <tt>'top'</tt>, <tt>'bottom'</tt>, <tt>'before'</tt> or <tt>'after'</tt>, and it defaults to
         * <tt>'bottom'</tt>. Returns the <tt>DomCollection</tt> for chaining.</p>
         *
         * <p>If you supply an <tt>HTMLElement</tt> then it will only be inserted into the first element
         * of the collection; inserting an element multiple times simply moves it around the document.
         * If you want multiple insertions, you should clone the element yourself. Ojay does not clone it
         * for you as this removes event handlers you may have registered with the element.</p>
         *
         * <pre><code>    Ojay('#someDiv').insert('&lt;p&gt;Inserted after the DIV&lt;/p&gt;', 'after');
         *     
         *     Ojay('ul li').insert(Ojay.HTML.span({className: 'foo'}, 'Item: '), 'top');</code></pre>
         *
         * @param {String|HTMLElement} html
         * @param {String} position
         * @returns {DomCollection}
         */
        insert: function(html, position) {
            if (position == 'replace') return this.setContent(html);
            if (html instanceof this.klass) html = html.node;
            new Ojay.DomInsertion(this.toArray(), html, position);
            this.trigger('ojay:insert', {content: html, position: position}, true);
            return this;
        },
        
        /**
         * <p>Removes all the elements in the collection from the document, and returns the collection.</p>
         * @returns {DomCollection}
         */
        remove: function() {
            this.toArray().forEach(function(element) {
                if (element.parentNode)
                    element.parentNode.removeChild(element);
            });
            this.trigger('ojay:remove', {}, true);
            return this;
        },
        
        /**
         * <p>Returns true iff the first element in the collection matches the given CSS selector.</p>
         * @param {String} selector
         * @returns {Boolean}
         */
        matches: function(selector) {
            if (!this.node) return undefined;
            return Ojay.cssEngine.test(this.node, selector);
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> containing the elements of the collection
         * that match the selector if one is given.</p>
         * @param {String} selector
         * @returns {DomCollection}
         */
        query: function(selector, array) {
            var collection = array ? Ojay(array) : this;
            if (!selector) return new this.klass(collection.toArray());
            collection = collection.filter({matches: selector});
            return new this.klass(collection.toArray());
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique parent nodes of all the elements
         * in the collection. If a selector string is supplied, only elements that match the
         * selector are included.</p>
         * @param {String} selector
         * @returns {DomCollection}
         */
        parents: function(selector) {
            var parents = this.toArray('parentNode');
            return this.query(selector, parents.unique());
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique ancestor nodes of all the elements
         * in the collection. If a selector string is supplied, only elements that match the
         * selection are included.</p>
         * @param {String} selector
         * @returns {DomCollection}
         */
        ancestors: function(selector) {
            var ancestors = [];
            this.toArray().forEach(function(element) {
                while ((element.tagName.toLowerCase() != 'body') && (element = element.parentNode)) {
                    if (ancestors.indexOf(element) == -1)
                        ancestors.push(element);
                }
            });
            return this.query(selector, ancestors);
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique child nodes of all the elements
         * in the collection. If a selector string is supplied, only elements that match the
         * selection are included.</p>
         * @param {String} selector
         * @returns {DomCollection}
         */
        children: function(selector) {
            var children = [];
            this.toArray().forEach(function(element) {
                var additions = Dom.getChildren(element), arg;
                while (arg = additions.shift()) {
                    if (children.indexOf(arg) == -1)
                        children.push(arg);
                }
            });
            return this.query(selector, children);
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique descendant nodes of all the elements
         * in the collection. If a selector string is supplied, only elements that match the
         * selection are included.</p>
         * @param {String} selector
         * @returns {DomCollection}
         */
        descendants: function(selector) {
            selector = selector || '*';
            var descendants = [];
            this.toArray().forEach(function(element) {
                var additions = Ojay.cssEngine.query(selector, element), arg;
                while (arg = additions.shift()) {
                    if (descendants.indexOf(arg) == -1)
                        descendants.push(arg);
                }
            });
            return new this.klass(descendants);
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique siblings of all the elements in the
         * collection. The returned collection does not include elements present in the original
         * collection. If a selector string is supplied, only elements that match the selection are
         * included.</p>
         * @param {String} selector
         * @returns {DomCollection}
         */
        siblings: function(selector) {
            var these = this.toArray(), siblings = [];
            these.forEach(function(element) {
                var additions = Ojay(element).parents().children(selector).toArray(), arg;
                while (arg = additions.shift()) {
                    if ((these.indexOf(arg) == -1) && (siblings.indexOf(arg) == -1))
                        siblings.push(arg);
                }
            });
            return new this.klass(siblings);
        },
        
        /**
         * <p>Returns a <tt>Region</tt> object representing the rectangle occupied by the the first
         * element in the collection.</p>
         * @returns {Region}
         */
        getRegion: function() {
            if (!this.node) return undefined;
            return new Ojay.Region(Dom.getRegion(this.node));
        },
        
        /**
         * <p>Resizes every member of the collection so as to fit inside the given region exactly.</p>
         * @param {Region} region
         * @returns {DomCollection}
         */
        fitToRegion: function(region) {
            var width = region.getWidth(), height = region.getHeight();
            this.forEach(function(element) {
                element.setStyle({width: width + 'px', height: height + 'px'});
                var reg = element.getRegion(), w = reg.getWidth(), h = reg.getHeight();
                element.setStyle({width: (2 * width - w) + 'px', height: (2 * height - h) + 'px'});
            });
            this.trigger('ojay:regionfit', {}, false);
            return this;
        },
        
        /**
         * <p>Returns the total width of the region occupied by the element, including padding
         * and borders. Values returned are in pixels.</p>
         * @returns {Number}
         */
        getWidth: function() {
            if (!this.node) return undefined;
            return this.getRegion().getWidth();
        },
        
        /**
         * <p>Returns the total height of the region occupied by the element, including padding
         * and borders. Values returned are in pixels.</p>
         * @returns {Number}
         */
        getHeight: function() {
            if (!this.node) return undefined;
            return this.getRegion().getHeight();
        },
        
        /**
         * <p>Returns the position of the top edge of the first element in the collection relative
         * to the viewport, in pixels.</p>
         * @returns {Number}
         */
        getTop: function() {
            if (!this.node) return undefined;
            return this.getRegion().top;
        },
        
        /**
         * <p>Returns the position of the bottom edge of the first element in the collection relative
         * to the viewport, in pixels.</p>
         * @returns {Number}
         */
        getBottom: function() {
            if (!this.node) return undefined;
            return this.getRegion().bottom;
        },
        
        /**
         * <p>Returns the position of the left edge of the first element in the collection relative
         * to the viewport, in pixels.</p>
         * @returns {Number}
         */
        getLeft: function() {
            if (!this.node) return undefined;
            return this.getRegion().left;
        },
        
        /**
         * <p>Returns the position of the right edge of the first element in the collection relative
         * to the viewport, in pixels.</p>
         * @returns {Number}
         */
        getRight: function() {
            if (!this.node) return undefined;
            return this.getRegion().right;
        },
        
        /**
         * <p>Returns the position of the center of the element as an object with <tt>left</tt> and
         * <tt>top</tt> properties. Values returned are in pixels.</p>
         * @returns {Object}
         */
        getCenter: function() {
            if (!this.node) return undefined;
            return this.getRegion().getCenter();
        },
        
        /**
         * <p>Returns true iff the first element in the collection intersects the area of the element
         * given as an argument.</p>
         * @param {String|HTMLElement|DomCollection} element
         * @returns {Boolean}
         */
        areaIntersects: function(element) {
            if (!this.node) return undefined;
            var node = Ojay(element);
            return this.getRegion().intersects(node.getRegion());
        },
        
        /**
         * <p>Returns a <tt>Region</tt> representing the overlapping region of the first element in the
         * collection and the argument.</p>
         * @param {String|HTMLElement|DomCollection} element
         * @returns {Region}
         */
        intersection: function(element) {
            if (!this.node) return undefined;
            var node = Ojay(element);
            var A = this.getRegion(), B = node.getRegion();
            return A.intersects(B) ? A.intersection(B) : null;
        },
        
        /**
         * <p>Returns true iff the first element in the collection completely contains the area of the
         * element given as an argument.</p>
         * @param {String|HTMLElement|DomCollection} element
         * @returns {Boolean}
         */
        areaContains: function(element) {
            if (!this.node) return undefined;
            var node = Ojay(element);
            return this.getRegion().contains(node.getRegion());
        }
    });
})(Ojay, YAHOO.util.Dom);

(function() {
    var methods = {};
    for (var method in Ojay.ARRAY_METHODS) (function(name) {
        var noConvert = /^(?:indexOf|lastIndexOf|unique)$/.test(name);
        methods[name] = function() {
            var array = noConvert ? this.toArray() : this.toArray(Ojay);
            var result = array[name].apply(array, arguments);
            if (name == 'filter')
                result = Ojay(result.map(function(el) { return el.node; }));
            return result;
        };
    })(method);
    Ojay.DomCollection.include(methods);
})();

Ojay.fn = Ojay.DomCollection.prototype;


/**
 * <p>The <tt>DomInsertion</tt> class is used to insert new strings and elements into the DOM.
 * It should not be used as a public API; you should use <tt>DomCollection</tt>'s <tt>insert</tt>
 * method instead. Its implementation is based on <a href="http://prototypejs.org/api/element/insert">that
 * used by Prototype</a>.</p>
 *
 * Document insertion code: Copyright (c) 2005-2008 Sam Stephenson / the Prototype team,
 * released under an MIT-style license.
 *
 * @contructor
 * @class DomInsertion
 */
Ojay.DomInsertion = new JS.Class('Ojay.DomInsertion', /** @scope Ojay.DomInsertion.prototype */{
    
    /**
     * @param {Array|HTMLElement} elements
     * @param {String|HTMLElement} html
     * @param {String} position
     */
    initialize: function(elements, html, position) {
        if (!(elements instanceof Array)) elements = [elements];
        if (!(/^(?:top|bottom|before|after)$/i.test(position))) position = 'bottom';
        
        this._elements = elements.filter(function(el) { return el && el.nodeType === Ojay.HTML.ELEMENT_NODE; });
        this._html = html;
        this._position = position.toLowerCase();
        
        if (this._elements.length === 0) return;
        if (this._html && this._html.nodeType) this._insertElement();
        if (typeof this._html == 'string') this._insertString();
    },
    
    /**
     * <p>Performs insertion of <tt>HTMLElement</tt>s.</p>
     */
    _insertElement: function() {
        var insert = this.klass._TRANSLATIONS[this._position];
        this._elements.forEach(function(element) {
            insert(element, this._html);
        }, this);
    },
    
    /**
     * <p>Performs insertion of <tt>String</tt>s.</p>
     */
    _insertString: function() {
        var insert = this.klass._TRANSLATIONS[this._position];
        this._elements.forEach(function(element) {
            var tagName = (/^(?:before|after)$/.test(this._position) ? element.parentNode : element).tagName.toUpperCase();
            var childNodes = this._getContentFromElement(tagName);
            if (/^(?:top|after)$/.test(this._position)) childNodes.reverse();
            childNodes.forEach(insert.partial(element));
        }, this);
    },
    
    /**
     * <p>Returns a collection of nodes by creating a new DIV and using <tt>innerHTML</tt>
     * to create the elements. Used when inserting into table elements and SELECT boxes,
     * which don't allow <tt>innerHTML</tt>modifications quite like everything else.</p>
     * @param {String} tagName
     * @returns {Array}
     */
    _getContentFromElement: function(tagName) {
        var tag = this.klass._TAGS[tagName];
        var div = Ojay.HTML.div();
        if (tag) {
            div.innerHTML = tag[0] + this._html + tag[1];
            for (var i = 0, n = tag[2]; i < n; i++)
                div = div.firstChild;
        } else div.innerHTML = this._html;
        return Array.from(div.childNodes);
    },
    
    extend: /** @scope Ojay.DomInsertion */{
        
        /**
         * <p>Collection of definitions for how to perform insertions of strings and elements at
         * various positions.</p>
         */
        _TRANSLATIONS: {
            
            top: function(element, html) {
                element.insertBefore(html, element.firstChild);
            },
            
            bottom: function(element, html) {
                element.appendChild(html);
            },
            
            before: function(element, html) {
                element.parentNode.insertBefore(html, element);
            },
            
            after: function(element, html) {
                element.parentNode.insertBefore(html, element.nextSibling);
            }
        },
        
        /**
         * <p>Tags that need special treatment when trying to use <tt>innerHTML</tt>.</p>
         */
        _TAGS: {
            TABLE:  ['<table>',                '</table>',                   1],
            THEAD:  ['<table><tbody>',         '</tbody></table>',           2],
            TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
            TFOOT:  ['<table><tbody>',         '</tbody></table>',           2],
            TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
            TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
            TH:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
            SELECT: ['<select>',               '</select>',                  1]
        }
    }
});


/**
 * <p>Sane DOM node creation API, inspired by
 * <a href="http://api.rubyonrails.org/classes/Builder/XmlMarkup.html"><tt>Builder::XmlMarkup</tt></a>
 * in Ruby on Rails.</p>
 *
 * <p>This class lets you use a much nicer syntax for creating DOM nodes, without resorting to
 * <tt>document.createElement</tt> and friends. Essentially, you write JavaScript that mirrors
 * the HTML you're creating. The methods in the class return <tt>HTMLElement</tt> objects rather
 * than strings of HTML.</p>
 *
 * <p>To begin, you create a new <tt>HtmlBuilder</tt>:</p>
 *
 * <pre><code>    var html = new Ojay.HtmlBuilder();</code></pre>
 *
 * <p>Then write your HTML. Use hashes for tag attributes, strings for text nodes, and functions
 * to nest further tags inside the current node. The beauty of this is that you can easily add
 * whatever logic you want inside the functions to customize the HTML generated. A simple example:</p>
 *
 * <pre><code>    var div = html.div({id: 'container'}, function(html) {
 *         html.h1('This is the title');
 *         html.p({className: 'para'}, 'Lorem ipsum dolor sit amet...');
 *         html.ul(function(html) {
 *             ['One', 'Two', 'Three'].forEach(html.method('li'));
 *         });
 *     });</code></pre>
 *
 * <p>Now <tt>div</tt> is an <tt>HTMLElement</tt> object with the following structure:</p>
 *
 * <pre><code>    &lt;div id="container"&gt;
 *         &lt;h1&gt;This is the title&lt;/h1&gt;
 *         &lt;p class="para"&gt;Lorem ipsum dolor sit amet...&lt;/p&gt;
 *         &lt;ul&gt;
 *             &lt;li&gt;One&lt;/li&gt;
 *             &lt;li&gt;Two&lt;/li&gt;
 *             &lt;li&gt;Three&lt;/li&gt;
 *         &lt;/ul&gt;
 *     &lt;/div&gt;</code></pre>
 *
 * <p>If you prefer, there is a pre-initialized instance of <tt>HtmlBuilder</tt> named
 * <tt>Ojay.HTML</tt>. So, you can call <tt>Ojay.HTML.div('DIV content')</tt> and the like.</p>
 *
 * <p>One key advantage of writing HTML out using JavaScript is that you can assign references
 * to elements as they are being created, without needing to add IDs or class names to them for
 * later reference. For example:</p>
 *
 * <pre><code>    var FormController = new JS.Class({
 *         
 *         initialize: function(element) {
 *             element = Ojay(element);
 *             var self = this;
 *             var form = Ojay.HTML.form(function(html) {
 *                 html.h3('Enter your email address');
 *                 html.label('Email:');
 *                 self.emailField = html.input({type: 'text'});
 *                 self.button = html.input({type: 'submit', value: 'Go!'});
 *             });
 *             this.form = Ojay(form);
 *             element.setContent(form);
 *             this.registerEventHandlers();
 *         },
 *         
 *         registerEventHandlers: function() {
 *             this.form.on('submit', function(e) {
 *                 alert(this.emailField.value);
 *             }, this);
 *         }
 *     });</code></pre>
 *
 * <p>Note how the <tt>emailField</tt> property is set at the same time that the element is
 * being created. Storing this reference means you don't have to crawl the DOM for the right
 * node later on, so performance is improved. Also, the fact that you don't need to add IDs
 * or class names to the new elements means you've less chance of causing a naming collision
 * with existing page elements, or unintentionally inheriting stylesheet rules.</p>
 *
 * <p>All the tags defined in the HTML 4.01 spec are available in <tt>HtmlBuilder</tt>. You can
 * see which tags are implemented by inspecting the array <tt>Ojay.HtmlBuilder.TAG_NAMES</tt>.</p>
 *
 * @constructor
 * @class HtmlBuilder
 */
Ojay.HtmlBuilder = new JS.Class('Ojay.HtmlBuilder', /* @scope Ojay.HtmlBuilder.prototype */{
    
    /**
     * @param {HTMLElement} node
     */
    initialize: function(node) {
        this._rootNode = node || null;
    },
    
    /**
     * @param {HTMLElement} node
     */
    concat: function(node) {
        if (this._rootNode) this._rootNode.appendChild(node);
        return node;
    },
    
    extend: {
        addTagNames: function() {
            var args = (arguments[0] instanceof Array) ? arguments[0] : arguments;
            for (var i = 0, n = args.length; i < n; i++)
                this.addTagName(args[i]);
        },
        
        addTagName: function(name) {
            this.define(name, function() {
                var node = document.createElement(name), arg, attr, style, appendable,
                    type = (arguments[0]||{}).type || 'text';
                
                if (YAHOO.env.ua.ie && name == 'input')
                    node = document.createElement('<input type="' + type + '">');
                
                loop: for (var j = 0, m = arguments.length; j < m; j++) {
                    arg = arguments[j];
                    
                    switch (typeof arg) {
                    case 'object':
                        appendable = arg.node || arg;
                        if (appendable.nodeType === Ojay.HTML.ELEMENT_NODE) {
                            node.appendChild(appendable);
                        } else {
                            for (attr in arg) {
                                if (Number(attr) == attr) continue;
                                if (attr == 'style')
                                    for (style in arg[attr]) node.style[style] = arg[attr][style];
                                else
                                    node[attr] = arg[attr];
                            }
                        }
                        break;
                        
                    case 'function': arg(new Ojay.HtmlBuilder(node));
                        break;
                        
                    case 'string': node.appendChild(document.createTextNode(arg));
                        break;
                    }
                }
                if (this._rootNode) this._rootNode.appendChild(node);
                return node;
            });
        },
        
        /**
         * List of all HTML 4.01 tag names, culled from the <a
         * href="http://www.w3.org/TR/REC-html40/index/elements.html">W3C spec</a>.
         */
        TAG_NAMES: (
            "a abbr acronym address applet area b base basefont bdo big blockquote body " +
            "br button caption center cite code col colgroup dd del dfn dir div dl dt em " +
            "embed fieldset font form frame frameset h1 h2 h3 h4 h5 h6 head hr html i " +
            "iframe img input ins isindex kbd label legend li link map menu meta noframes " +
            "noscript object ol optgroup option p param pre q s samp script select small " +
            "span strike strong style sub sup table tbody td textarea tfoot th thead title " +
            "tr tt u ul var"
        ).split(/\s+/)
    }
});

Ojay.HtmlBuilder.addTagNames(Ojay.HtmlBuilder.TAG_NAMES);

/**
 * <p>A pre-initialized instance of <tt>HtmlBuilder</tt>.</p>
 */
Ojay.HTML = new Ojay.HtmlBuilder();

/**
 *<p>Named references to all types of DOM node -- these are defined in Mozilla but not in IE.</p>
 */
JS.extend(Ojay.HTML, /** @scope Ojay.HTML */{
    ELEMENT_NODE:                   1,
    ATTRIBUTE_NODE:                 2,
    TEXT_NODE:                      3,
    CDATA_SECTION_NODE:             4,
    ENTITY_REFERENCE_NODE:          5,
    ENTITY_NODE:                    6,
    PROCESSING_INSTRUCTION_NODE:    7,
    COMMENT_NODE:                   8,
    DOCUMENT_NODE:                  9,
    DOCUMENT_TYPE_NODE:             10,
    DOCUMENT_FRAGMENT_NODE:         11,
    NOTATION_NODE:                  12
});


/**
 * @overview
 * <p>The <tt>Animation</tt> class is used to set up all animations in Ojay. It is entirely
 * for internal consumption, and not to be accessed directly. Use the <tt>animate</tt> method
 * in <tt>DomCollection</tt> instead, and look to that for documentation.</p>
 * @constructor
 * @class Animation
 */
Ojay.Animation = new JS.Class('Ojay.Animation', /** @scope Ojay.Animation.prototype */{
    
    extend: /** @scope Ojay.Animation */{
        DEFAULT_YUI_CLASS: YAHOO.util.ColorAnim
    },
    
    /**
     * @param {DomCollection} elements
     * @param {Object|Function} parameters
     * @param {Number|Function} duration
     * @param {Object} options
     * @param {klass} animationClass
     */
    initialize: function(elements, parameters, duration, options, animationClass) {
        this._collection        = elements;
        this._parameters        = parameters || {};
        this._duration          = duration || 1.0;
        this._options           = options || {};
        this._animClass         = animationClass || this.klass.DEFAULT_YUI_CLASS;
        this._easing            = YAHOO.util.Easing[this._options.easing || 'easeBoth'];
        var after = this._options.after, before = this._options.before;
        this._afterCallback     = after && Function.from(after);
        this._beforeCallback    = before && Function.from(before);
        this.chain              = new JS.MethodChain;
    },
    
    /**
     * @param {Object|Function} options
     * @param {DomCollection} element
     * @param {Number} i
     * @returns {Object}
     */
    _evaluateOptions: function(options, element, i) {
        if (typeof options == 'function') options = options(i, element);
        if ((options instanceof Array) || (typeof options != 'object')) return options;
        var results = {};
        for (var field in options) results[field] = arguments.callee(options[field], element, i);
        return results;
    }.curry(),
    
    /**
     * <p>Runs the animation.</p>
     */
    run: function() {
        var paramSets = this._collection.map(this._evaluateOptions(this._parameters));
        var durations = this._collection.map(this._evaluateOptions(this._duration));
        
        var maxDuration = durations.reduce(function(a,b) { return a > b ? a : b; }, -Infinity);
        var callbackAttached = false;
        
        var after = this._afterCallback, before = this._beforeCallback;
        this._collection.trigger('ojay:animstart', {}, false);
        
        this._collection.forEach(function(element, i) {
            var parameters = paramSets[i], duration = durations[i];
            var anim = new this._animClass(element.node, parameters, duration, this._easing);
            anim.onComplete.subscribe(function() {
                if (YAHOO.env.ua.ie && (parameters.opacity || {}).to !== undefined)
                    element.setStyle({opacity: parameters.opacity.to});
                
                element.trigger('ojay:animend', {}, false);
                if (after) after(element, i);
                
                if (duration == maxDuration && !callbackAttached) {
                    callbackAttached = true;
                    this.chain.fire(this._collection);
                }
            }.bind(this));
            if (before) before(element, i);
            anim.animate();
        }, this);
    }
});


(function(Region) {
    /**
     * <p>The <tt>Region</tt> class wraps YUI's <tt>Region</tt> class and extends its API. This
     * class is mostly for internal consumption: methods should exist on <tt>DomCollection</tt>
     * for getting the geometric properties of DOM elements.</p>
     * @constructor
     * @class Region
     */
    Ojay.Region = new JS.Class('Ojay.Region', /** @scope Ojay.Region.prototype */{
        
        contains:   Region.prototype.contains,
        getArea:    Region.prototype.getArea,
        _intersect: Region.prototype.intersect,
        _union:     Region.prototype.union,
        
        /**
         * @param {YAHOO.util.Region} region
         */
        initialize: function(region) {
            ['top', 'right', 'bottom', 'left'].forEach(function(property) {
                this[property] = region[property] || 0;
            }, this);
        },
        
        /**
         * @returns {Number}
         */
        getWidth: function() {
            return this.right - this.left;
        },
        
        /**
         * @returns {Number}
         */
        getHeight: function() {
            return this.bottom - this.top;
        },
        
        /**
         * @returns {Number}
         */
        getDiagonal: function() {
            return (this.getWidth().pow(2) + this.getHeight().pow(2)).sqrt();
        },
        
        /**
         * @returns {Object}
         */
        getCenter: function() {
            return {
                left: (this.left + this.right) / 2,
                top: (this.top + this.bottom) / 2
            };
        },
        
        /**
         * @param {Number} x
         * @param {Number} y
         * @returns {Region}
         */
        shift: function(x,y) {
            this.left += x;     this.right += x;
            this.top += y;      this.bottom += y;
            return this;
        },
        
        /**
         * @param {Number} factor
         * @returns {Region}
         */
        scale: function(factor) {
            var w = this.getWidth(), h = this.getHeight();
            if (w <= 0 || h <= 0) return this;
            var dx = (factor - 1) * w, dy = (factor - 1) * h;
            this.left -= dx/2;      this.right += dx/2;
            this.top -= dy/2;       this.bottom += dy/2;
            return this;
        },
        
        /**
         * @param {Number} left
         * @param {Number} top
         * @returns {Region}
         */
        centerOn: function(left, top) {
            var myCenter = this.getCenter(), theirCenter;
            if (typeof left == 'object') {
                theirCenter = left.getCenter();
                left = theirCenter.left;
                top = theirCenter.top;
            }
            this.shift(left - myCenter.left, top - myCenter.top);
            return this;
        },
        
        /**
         * @param {Region} region
         * @returns {Region}
         */
        intersection: function(region) {
            var intersection = this._intersect(region);
            return new Ojay.Region(intersection);
        },
        
        /**
         * <p>Returns <tt>true</tt> iff this region intersects the given region.</p>
         * @param {Region} region
         * @returns {Boolean}
         */
        intersects: function(region) {
            var top = Math.max(this.top, region.top),
                bottom = Math.min(this.bottom, region.bottom),
                left = Math.max(this.left, region.left),
                right = Math.min(this.right, region.right);
            return (top < bottom) && (left < right);
        },
        
        /**
         * @param {Region} region
         * @returns {Region}
         */
        union: function(region) {
            var union = this._union(region);
            return new Ojay.Region(union);
        },
        
        /**
         * @returns {String}
         */
        toString: function() {
            return '(' + this.left + ',' + this.top + ') [' + this.getWidth() + 'x' + this.getHeight() + ']';
        },
        
        extend: /** @scope Ojay.Region */{
            convert: function(object) {
                if (object instanceof Region) return new this(object);
                if (!(object instanceof this)) object = Ojay(object).getRegion();
                if (!object) return undefined;
                else return object;
            }
        }
    });
})(YAHOO.util.Region);


/**
 * <p>The <tt>Sequence</tt> class allows iteration over an array using a timer to
 * skip from member to member. At each timeframe, the sequence object calls a user-
 * defined callback function, passing in the current member (the 'needle') and its
 * position in the list.</p>
 * @constructor
 * @class Ojay.Sequence
 */
Ojay.Sequence = new JS.Class('Ojay.Sequence', /** @scope Ojay.Sequence.prototype */{
    
    /**
     * @param {Array} list
     * @param {Function} callback
     * @param {Object} context
     */
    initialize: function(list, callback, context) {
        this._list = list;
        this._counter = 0;
        this._callback = Function.from(callback);
        this._context = context || null;
        this._interval = null;
        this._looping = false;
        this._pauseOnComplete = false;
    },
    
    _fireCallback: function() {
        this._callback.call(this._context, this._list[this._counter]);
    },
    
    /**
     * <p>Calls the callback function on the current needle and steps the counter forward by
     * one place. When looping, sets a timeout to call itself again after the specified time.</p>
     * @returns {Sequence}
     */
    stepForward: function() {
        if (this._looping === null) {
            this._looping = false;
            return this;
        }
        this._fireCallback();
        this._counter++;
        if (this._counter >= this._list.length) {
            this._counter = 0;
            if (this._pauseOnComplete)
                this._looping = this._pauseOnComplete = false;
        }
        if (this._looping) setTimeout(this.method('stepForward'), this._interval);
        return this;
    },
    
    /**
     * <p>Makes the sequence step forward indefinately at timed intervals.</p>
     * @param {Number} time
     * @returns {Sequence}
     */
    loop: function(time) {
        this._interval = 1000 * Number(time || 0) || this._interval;
        if (!this._interval || this._looping) return this;
        this._looping = true;
        return this.stepForward();
    },
    
    /**
     * <p>Stops the sequence looping. The needle will be placed after the last called-back needle.</p>
     * @returns {Sequence}
     */
    pause: function() {
        if (this._looping) this._looping = null;
        return this;
    },
    
    /**
     * <p>Causes the sequence to stop looping when it reaches the end of the list.</p>
     * @returns {Sequence}
     */
    finish: function() {
        if (this._looping) this._pauseOnComplete = true;
        return this;
    }
});

/**
 * <p>Returns a <tt>Sequence</tt> object that cycles over every member of the array over
 * the given <tt>time</tt> interval. Your <tt>callback</tt> function is called every <tt>time</tt>
 * seconds, being passed each member of the array in turn and its position in the list.</p>
 *
 * <pre><code>    // Cycle over a set of images
 *     var imgs = ['/imgs/one.png', 'imgs/two.png', 'imgs/three.png'];
 *     var element = Ojay('#something');
 *     
 *     var sequence = imgs.sequence(function(imgageSource, i) {
 *         element.set({src: imageSource});
 *     });
 *     
 *     // Start sequence looping with a time period
 *     sequence.loop(5);
 *     
 *     // Pause the sequence
 *     sequence.pause();
 *     
 *     // Start again where we left off
 *     sequence.loop();
 *     
 *     // Stop when it next gets to the end of the list
 *     sequence.finish();</code></pre>
 *
 * @param {Number} time
 * @param {Function} callback
 * @returns {Sequence}
 */
Array.prototype.sequence = function(callback) {
    return new Ojay.Sequence(this, callback);
};

Ojay.DomCollection.include(/** @scope Ojay.DomCollection.prototype */{
    /**
     * <p>Returns a <tt>Sequence</tt> operating on the members of the collection.
     * See <tt>Array#sequence</tt> for more information.</p>
     * @param {Number} time
     * @param {Function} callback
     * @returns {Sequence}
     */
    sequence: function(callback) {
        return [].map.call(this, function(el) { return Ojay(el); })
                .sequence(callback);
    }
});


JS.MethodChain.addMethods(Ojay);

(function() {
    // ObjectMethods will be renamed to Kernel in JS.Class 2.1
    var kernel = JS.ObjectMethods || JS.Kernel;
    
    var convertSelectors = function() {
        var args = Array.from(arguments), _ = args.shift();
        if (typeof args[0] == 'string') return _(Ojay, args[0]);
        else return _.apply(this, args);
    };
    
    // Modify MethodChain to allow CSS selectors
    JS.MethodChain.prototype._ = JS.MethodChain.prototype._.wrap(convertSelectors);
    
    kernel.include({
        _: kernel.instanceMethod('_').wrap(convertSelectors)
    });
})();


/**
 * @overview
 * <p><tt>Ojay.HTTP</tt> wraps the <tt>YAHOO.util.Connect</tt> module to provide a more succinct
 * API for making Ajax requests. It's called <tt>HTTP</tt> to emphasise what's actually going on
 * in an Ajax call: we're just making an HTTP request. <tt>Ojay.HTTP</tt> makes you use HTTP verbs
 * as methods, to make it clear what's going on to anyone reading the code. A quick example:</p>
 *
 * <pre><code>    Ojay.HTTP.GET('/index.html', {ajaxLayout: true}, {
 *         onSuccess: function(response) {
 *             alert(response.responseText);
 *         }
 *     });</code></pre>
 *
 * <p>This illustrates the basic pattern of making an HTTP request. Start with the verb (<tt>GET</tt>,
 * <tt>POST</tt>, <tt>PUT</tt>, <tt>DELETE</tt> or <tt>HEAD</tt>), then pass in the URL and the
 * parameters you want to send to the server. These parameters will be turned into a query string
 * or a POST message, depending on the verb used. The URL may contain a query string, but its
 * parameters will be overridden by the parameters object:</p>
 *
 * <pre><code>    // Request is: GET /index.html?id=900&ajaxLayout=true
 *     Ojay.HTTP.GET('/index.html?id=45&ajaxLayout=true', {id: 900})</code></pre>
 *
 * <p>You can define callbacks called <tt>onSuccess</tt> (fired on any reponse with a 2xx status
 * code), <tt>onFailure</tt> (fired on any 3xx, 4xx or 5xx response) or status-code-specific
 * callbacks, like <tt>on404</tt>:</p>
 *
 * <pre><code>    Ojay.HTTP.POST('/posts/create', {title: '...'}, {
 *         onSuccess: function(response) {
 *             alert('Post created!');
 *         },
 *         on403: function(response) {
 *             alert('Permission denied!);
 *         }
 *     });</code></pre>
 *
 * <p>The <tt>response</tt> object passed to your callbacks will be an instance of <tt>HTTP.Response</tt>,
 * which wraps the response object returned by YUI. It has convenience methods for manipulating
 * the response and inserting it into the document. Its methods are listed below. You can use the
 * <tt>response</tt> methods to chain after HTTP calls for more sentence-like code:</p>
 *
 * <pre><code>    Ojay.HTTP.GET('/index.html').insertInto('#container').evalScripts();</pre></code>
 *
 * <p>It's best to use this chaining for really simple stuff -- just remember the chain is called
 * asynchronously after the HTTP request completes, so any code following a chain like this should
 * not assume that the content has been inserted into the document or that the scripts have been
 * run.</p>
 *
 * <pre><ocde>    Ojay.HTTP.GET('/index.html').insertInto('#container');  // asynchronous insertion
 *     var text = Ojay('#container').node.innerHTML;
 *             // text does NOT contain the HTTP response yet!</code></pre>
 *
 * <p>For anything beyond really simple stuff, it's best to use explicit callback functions.</p>
 *
 * <p><tt>HTTP.Response</tt> methods are available in chains following calls to <tt>on()</tt>,
 * <tt>animate()</tt> and <tt>wait()</tt> on <tt>DomCollection</tt> objects. e.g.:</p>
 *
 * <pre><code>    Ojay('input[type=submit]').on('click')
 *             ._(Ojay.HTTP.POST, '/posts/update/34', ...)
 *             .insertInto('#message');</pre></code>
 *
 * <p>You can even pass functions into the parameters object, and <tt>HTTP</tt> will execute them
 * at the time the request is made:</p>
 *
 * <pre><code>    Ojay('#link').on('click')
 *             ._(Ojay.HTTP.POST, '/images/save_width', {width: Ojay('#foo').method('getWidth')});</code></pre>
 *
 * <p><tt>Ojay('#foo').method('getWidth')</tt> is a function bound to <tt>Ojay('#foo')</tt>; when
 * the POST request is made, it will be executed and the return value will be sent to the server
 * in the <tt>width</tt> parameter.</p>
 */
Ojay.HTTP = new JS.Singleton('Ojay.HTTP', /** @scope Ojay.HTTP */{
    include: Ojay.Observable,
    
    /**
     * <p>Object containing named references to XmlHttpRequest ready states.</p>
     */
    READY_STATE: {
        UNINITIALIZED:  0,
        LOADING:        1,
        LOADED:         2,
        INTERACTIVE:    3,
        COMPLETE:       4
    },
    
    /**
     * <p>List of verbs supported by <tt>Ojay.HTTP</tt>.</p>
     */
    VERBS: 'GET POST PUT DELETE HEAD'.split(/\s+/)
});

Ojay.HTTP.VERBS.forEach(function(verb) {
    Ojay.HTTP[verb] = function(url, parameters, callbacks) {
        var request = new Ojay.HTTP.Request(verb, url, parameters, callbacks);
        request._begin();
        return request.chain;
    };
});

/**
 * <p>The <tt>HTTP.Request</tt> class is used to instantiate Ajax calls to the server. This
 * is for internal consumption -- use <tt>HTTP.GET</tt> et al to make requests.</p>
 * @constructor
 * @class HTTP.Request
 */
Ojay.HTTP.Request = new JS.Class('Ojay.HTTP.Request', /** @scope Ojay.HTTP.Request.prototype */{
    
    /**
     * @param {String} verb         One of 'GET', 'POST', 'PUT', 'DELETE', or 'HEAD'
     * @param {String} url          The URL to request
     * @param {Object} parameters   Key-value pairs to be used as a query string or POST message;
     *                              alternatively, a string to be used as a POST request body.
     * @param {Object} callbacks    Object containing callback functions
     */
    initialize: function(verb, url, parameters, callbacks) {
        this.verb           = verb.toUpperCase();
        if (Ojay.HTTP.VERBS.indexOf(this.verb) == -1) return;
        this._url           = url;
        this._parameters    = parameters || {};
        if (typeof callbacks != 'object') callbacks = {onSuccess: callbacks};
        this._callbacks     = callbacks || {};
        this.chain          = new JS.MethodChain();
    },
    
    /**
     * <p>Returns the URI of the request.
     */
    getURI: function() {
        if (this.uri) return this.uri;
        var params = (typeof this._parameters == 'string') ? {} : this._parameters;
        return this.uri = Ojay.URI.build(this._url, params);
    },
    
    /**
     * <p>Makes the HTTP request and sets up all the callbacks.</p>
     */
    _begin: function() {
        var post        = (this.verb == 'POST'),
            uri         = this.getURI(),
            url         = post ? uri._getPathWithHost() : uri.toString(),
            postData    = post ? this._getPostData(uri) : undefined;
        
        Ojay.HTTP.notifyObservers('request', {receiver: this});
        
        YAHOO.util.Connect.asyncRequest(this.verb, url, {
            scope: this,
            
            // Will fire onSuccess, on2xx, and the chain
            success: function(transport) {
                var response = new Ojay.HTTP.Response(this, transport);
                var success  = this._callbacks.onSuccess;
                var onStatus = this._callbacks['on' + response.status];
                var complete = this._callbacks.onComplete;
                success  && Function.from(success)(response);
                onStatus && Function.from(onStatus)(response);
                complete && Function.from(complete)(response);
                this.chain.fire(response);
                Ojay.HTTP.notifyObservers('success', {receiver: response});
                Ojay.HTTP.notifyObservers(response.status, {receiver: response});
                Ojay.HTTP.notifyObservers('complete', {receiver: response});
            },
            
            // Will fire onFailure, on3xx, on4xx, on5xx
            failure: function(transport) {
                var response = new Ojay.HTTP.Response(this, transport);
                var failure  = this._callbacks.onFailure;
                var onStatus = this._callbacks['on' + response.status];
                var complete = this._callbacks.onComplete;
                failure  && Function.from(failure)(response);
                onStatus && Function.from(onStatus)(response);
                complete && Function.from(complete)(response);
                Ojay.HTTP.notifyObservers('failure', {receiver: response});
                Ojay.HTTP.notifyObservers(response.status, {receiver: response});
                Ojay.HTTP.notifyObservers('complete', {receiver: response});
            }
            
        }, postData);
    },
    
    /**
     * @param {URI} uri
     * @returns {String}
     */
    _getPostData: function(uri) {
        return (typeof this._parameters == 'string')
                ? this._parameters
                : uri.getQueryString();
    }
});

/**
 * <p>The <tt>HTTP.Response</tt> class is used to wrap XmlHttpRequest transport objects in Ajax
 * callback functions. The argument passed into your Ajax callbacks, and used as the base of chains
 * after <tt>GET</tt>/<tt>POST</tt>/etc calls, will be an object of this class. It contains fields
 * copied straight from the transport object, including <tt>status</tt>, <tt>statusText</tt>,
 * <tt>responseText</tt>, and <tt>responseXML</tt>.</p>
 * class.
 * @constructor
 * @class HTTP.Response
 */
Ojay.HTTP.Response = new JS.Class('Ojay.HTTP.Response', /** @scope Ojay.HTTP.Response.prototype */{
    
    /**
     * @param {HTTP.Request} request an HTTP.Request object
     * @param {Object} transport An XmlHttpRequest transport object
     */
    initialize: function(request, transport) {
        'status statusText responseText responseXML readyState'.split(/\s+/).forEach(function(key) {
            this[key] = transport[key];
        }, this);
        this.request = request;
        this.transport = transport;
    },
    
    /**
     * <p>Inserts the response's body text into the given <tt>elements</tt> at the given
     * <tt>position</tt> (default is <tt>'replace'</tt>). See <tt>DomCollection#insert.</tt>.
     * If no position is specified, will accept any object with a <tt>setContent()</tt> method.</p>
     * @param {String|HTMLElement|DomCollection} elements
     * @param {String} position
     * @returns {HTTP.Response}
     */
    insertInto: function(elements, position) {
        elements = elements.setContent ? elements : Ojay(elements);
        var content = (this.responseText || '').stripScripts();
        if (!position) elements.setContent(content);
        else elements.insert(content, position);
        return this;
    },
    
    /**
     * @returns {HTTP.Response}
     */
    evalScripts: function() {
        if (this.responseText) this.responseText.evalScripts();
        return this;
    },
    
    /**
     * <p>Returns the result of parsing the response body as JSON.</p>
     * @returns {Object|Array}
     */
    parseJSON: function() {
        return (this.responseText || '').parseJSON();
    }
});


(function() {
    
    var HTTP = Ojay.HTTP;
    
    // Precompiled regexps
    var PATTERNS = {
        JS:     /\.js$/i,
        CSS:    /\.css$/i
    };
    
    var IFRAME_NAME        = '__ojay_cross_domain__',
        JSONP_HANDLER_NAME = '__ojay_jsonp_handler__',
        HANDLER_COUNT      = 0;
    
    var createIframe = function() {
        Ojay(document.body).insert('<iframe name="' + IFRAME_NAME + '" style="display: none;"></iframe>', 'top');
    }.runs(1);
    
    var getHandlerId = function() {
        return JSONP_HANDLER_NAME + (HANDLER_COUNT++);
    };
    
    var handleJsonP = function(callback, id, data) {
        var args     = Array.from(arguments),
            callback = args.shift(),
            id       = args.shift();
        callback.apply(null, args);
        removeHandler(id);
    };
    
    var removeHandler = function(id) {
        window[id] = null;
        try { delete window[id] } catch (e) {}
    }.curry();
    
    var determineAssetType = function(url) {
        switch (true) {
            case PATTERNS.JS.test(url) :    return 'script';    break;
            case PATTERNS.CSS.test(url) :   return 'css';       break;
            default :                       return 'script';    break;
        }
    };
    
    JS.extend(HTTP, /** @scope Ojay.HTTP */{
        
        /**
         * <p><tt>Ojay.HTTP.GET</tt> is overloaded to provide support for <tt>YAHOO.util.Get</tt>,
         * which allows loading of new script/css assets into the document, even from other domains.
         * If you try to <tt>GET</tt> a URL from another domain, Ojay automatically uses the <tt>Get</tt>
         * utility to load the asset into the document. For example, to talk to a JSON web service on
         * another domain:</p>
         *
         * <pre><code>    Ojay.HTTP.GET('http://example.com/posts/45.json', {
         *         user: 'your_username',
         *         api_key: '4567rthdtyue566w34',
         *         callback: 'handleJSON'
         *     });
         *     
         *     var handleJSON = function(json) {
         *         // process json object
         *     };</code></pre>
         *
         * <p>If you request a URL on your own domain, Ojay will always make an Ajax request rather
         * than a Get-utility request. If you want to load assets from your own domain or talk to
         * your own web service, use <tt>Ojay.HTTP.load()</tt>.</p>
         *
         * @param {String} url          The URL to request
         * @param {Object} parameters   Key-value pairs to be used as a query string
         * @param {Object} callbacks    Object containing callback functions
         * @returns {MethodChain}
         */
        GET: HTTP.GET.wrap(function(ajax, url, parameters, callbacks) {
            if (Ojay.URI.parse(url).isLocal() || !YAHOO.util.Get) return ajax(url, parameters, callbacks);
            this.load(url, parameters, callbacks);
        }),
        
        /**
         * <p><tt>Ojay.HTTP.POST</tt> is overloaded to allow POST requests to other domains using
         * hidden forms and iframes. Using the same syntax as for Ajax requests to your own domain,
         * you can send data to any URL to like. An example:</p>
         *
         * <pre><code>    Ojay.HTTP.POST('http://example.com/posts/create', {
         *         user: 'your_username',
         *         api_key: '4567rthdtyue566w34',
         *         title: 'A new blog post',
         *         content: 'Lorem ipsum dolor sit amet...'
         *     });</code></pre>
         *
         * <p>Due to same-origin policy restrictions, you cannot access the response for cross-
         * domain POST requests, so no callbacks may be used.</p>
         *
         * @param {String} url          The URL to request
         * @param {Object} parameters   Key-value pairs to be used as a POST message
         * @param {Object} callbacks    Object containing callback functions
         * @returns {MethodChain}
         */
        POST: HTTP.POST.wrap(function(ajax, url, parameters, callbacks) {
            if (Ojay.URI.parse(url).isLocal()) return ajax(url, parameters, callbacks);
            this.send(url, parameters);
        }),
        
        /**
         * <p>Uses the YUI Get utility to load assets into the current document. Pass in the URL you
         * want to load, parameters for the query string, and callback functions if you need them.</p>
         *
         * <p>Ojay automatically infers which type of asset (script or stylesheet) you want to load
         * from the URL. If it ends in '.css', Ojay makes a stylesheet request, otherwise it loads
         * a script file.</p>
         *
         * @param {String} url          The URL to request
         * @param {Object} parameters   Key-value pairs to be used as a query string
         * @param {Object} callbacks    Object containing callback functions
         */
        load: function(url, parameters, callbacks) {
            var path      = Ojay.URI.parse(url).path,
                assetType = determineAssetType(path),
                uri       = Ojay.URI.build(url, parameters),
                callbacks = callbacks || {};
            
            if (typeof callbacks == 'function') callbacks = {onSuccess: callbacks};
            
            if (uri.params.jsonp && callbacks.onSuccess) {
                var handlerID = getHandlerId();
                uri.setParam(uri.params.jsonp, handlerID);
                if (uri.params.jsonp !== 'jsonp') delete uri.params.jsonp;
                window[handlerID] = handleJsonP.partial(callbacks.onSuccess, handlerID);
                callbacks.onSuccess = null;
            }
            
            YAHOO.util.Get[assetType](uri.toString(), callbacks);
        },
        
        /**
         * <p>Allows cross-domain POST requests by abstracting away the details required to implement
         * such a technique. An invisible form and iframe are injected into the document to send
         * the data you specify to the required URL. There is no way of communicating across frames
         * from different domains, so you cannot use any callbacks to see what happened to your data.</p>
         *
         * @param {String} url          The URL to send data to
         * @param {Object} parameters   Key-value pairs to be used as a POST message
         */
        send: function(url, parameters) {
            var form = this._buildPostForm(url, parameters, true);
            createIframe();
            Ojay(document.body).insert(form.node, 'top');
            form.node.submit();
            form.remove();
        },
        
        _buildPostForm: function(url, parameters, postToIframe) {
            var uri = Ojay.URI.build(url, parameters),
                postUrl = uri._getPathWithHost(),
                params = uri.params;
            
            var attributes = {action: postUrl, method: 'POST'};
            if (postToIframe) attributes.target = IFRAME_NAME;
            
            return Ojay( Ojay.HTML.form(attributes, function(HTML) {
                for (var field in params)
                    HTML.input({ type: 'hidden', name: field, value: String(params[field]) });
            }) ).hide();
        }
    });
    
    HTTP.GET.redirectTo = function(url, parameters) {
        window.location.href = Ojay.URI.build(url, parameters).toString();
    };
    
    HTTP.POST.redirectTo = function(url, parameters) {
        var form = HTTP._buildPostForm(url, parameters, false).node;
        Ojay(document.body).insert(form, 'top');
        form.submit();
    };
    
    JS.MethodChain.addMethods(HTTP);
})();


/**
 * @constructor
 * @class URI
 */
Ojay.URI = new JS.Class('Ojay.URI', {
    extend: {
        /**
         * @param {String} string
         * @returns {String}
         */
        sanitize: function(string) {
            return String(string).trim().replace('&amp;', '&').replace('&#38;', '&');
        },
        
        /**
         * @param {String} string
         * @returns {URI}
         */
        parse: function(string) {
            if (string instanceof this) return string;
            var uri = new this;
            
            string = this.sanitize(string)
                .replace(/^(\w+)(:\/+)/,    function(match, capture, keep) { uri.protocol = capture; return keep; })
                .replace(/^:\/+([^\:\/]+)/, function(match, capture) { uri.domain = capture;    return ''; })
                .replace(/^:(\d+)/,         function(match, capture) { uri.port = capture;      return ''; })
                .replace(/^[^\?\#]+/,       function(match, capture) { uri.path = match;        return ''; })
                .replace(/#(.*)$/,          function(match, capture) { uri.hash = capture;      return ''; });
            
            if (!uri.port) uri.port = (uri.domain == this.local.domain)
                    ? this.local.port
                    : this.DEFAULT_PORTS[uri.protocol];
            
            if (uri.path.charAt(0) != '/' && uri.domain == this.local.domain)
                uri.path = this.local.directory + uri.path;
            
            if (/^\?/.test(string)) string.slice(1).split('&').forEach(function(pair) {
                var bits = pair.split('=');
                uri.setParam(bits[0], bits[1].replace('+', ' '));
            });
            return uri;
        },
        
        /**
         * @param {String} url
         * @param {Object} params
         * @returns {URI}
         */
        build: function(url, params) {
            var uri = this.parse(url), params = params || {}, value;
            for (var key in params) {
                value = (typeof params[key] == 'function') ? params[key]() : params[key];
                uri.setParam(key, value);
            }
            return uri;
        },
        
        /**
         * @param {String|URI} a
         * @param {String|URI} b
         * @returns {Boolean}
         */
        compare: function(a,b) {
            return this.parse(a).equals(b);
        },
        
        DEFAULT_PORTS: {
            http:       '80',
            https:      '443'
        }
    },
    
    /**
     */
    initialize: function() {
        this.protocol = this.klass.local.protocol;
        this.domain   = this.klass.local.domain;
        this.path     = '';
        this.keys     = [];
        this.params   = {};
        this.toString = this._toString;
    },
    
    /**
     * @returns {String}
     */
    _toString: function() {
        var string = this._getPathWithHost(), params = [];
        var queryString = this.getQueryString();
        if (queryString.length) string += '?' + queryString;
        if (typeof this.hash === 'string') string += '#' + this.hash;
        return string;
    },
    
    _getPathWithHost: function() {
        return this._getProtocolString() + (this.domain||'') + this._getPortString() + (this.path||'');
    },
    
    /**
     * @returns {String}
     */
    getQueryString: function() {
        return this.keys.sort().map(function(key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(this.params[key]);
        }, this).join('&');
    },
    
    /**
     * @returns {String}
     */
    _getProtocolString: function() {
        return this.protocol ? this.protocol + '://' : '';
    },
    
    /**
     * @returns {String}
     */
    _getPortString: function() {
        if (!this.port || this.port == this.klass.DEFAULT_PORTS[this.protocol]) return '';
        return ':' + this.port;
    },
    
    /**
     * @param {String|URI} uri
     * @returns {Boolean}
     */
    equals: function(uri) {
        uri = this.klass.parse(uri);
        if (this.domain != uri.domain || this.protocol != uri.protocol || this.port != uri.port ||
                this.path != uri.path || this.hash != uri.hash) return false;
        if (!this.paramsEqual(uri)) return false;
        return true;
    },
    
    /**
     * @param {String} key
     * @param {String} value
     */
    setParam: function(key, value) {
        var bits = [key, value].map(decodeURIComponent).map('trim');
        if (this.keys.indexOf(bits[0]) == -1) this.keys.push(bits[0]);
        this.params[bits[0]] = bits[1];
    },
    
    /**
     * @param {String|URI} uri
     * @returns {Boolean}
     */
    paramsEqual: function(uri) {
        uri = this.klass.parse(uri);
        for (var key in this.params) { if (this.params[key] != uri.params[key]) return false; }
        for (key in uri.params) { if (this.params[key] != uri.params[key]) return false; }
        return true;
    },
    
    /**
     * @returns {Boolean}
     */
    isLocal: function() {
        return  this.protocol == this.klass.local.protocol &&
                this.domain == this.klass.local.domain &&
                this.port == this.klass.local.port;
    }
});

Ojay.URI.extend({
    local: {
        protocol:   window.location.protocol.replace(/\W/g, ''),
        domain:     window.location.hostname,
        directory:  window.location.pathname.replace(/[^\/]*$/, '')
    }
});

Ojay.URI.local.port = window.location.port || Ojay.URI.DEFAULT_PORTS[Ojay.URI.local.protocol || 'http'];

JS.extend(String.prototype, {
    parseURI:   Ojay.URI.method('parse').methodize(),
    equalsURI:  Ojay.URI.method('compare').methodize()
});


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


(function() {


JS.extend(Ojay, /** @scope Ojay */ {
    /**
     * <p>Returns <tt>true</tt> iff the given value is truthy and is not just whitespace.</p>
     * @param {String} value
     * @returns {Boolean}
     */
    isBlank: function(value) {
        return value ? false : (String(value).trim() == '');
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the given <tt>value</tt> is a number.</p>
     * @param {String} value
     * @returns {Boolean}
     */
    isNumeric: function(value) {
        return this.NUMBER_FORMAT.test(String(value));
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the given <tt>value</tt> is an email address.</p>
     * @param {String} value
     * @returns {Boolean}
     */
    isEmailAddress: function(value) {
        return this.EMAIL_FORMAT.test(String(value));
    },
    
    /**
     * <p>JSON number definition from http://json.org</p>
     */
    NUMBER_FORMAT: /^\-?(0|[1-9]\d*)(\.\d+)?(e[\+\-]?\d+)?$/i,
    
    /**
     * <p>Format for valid email addresses from http://www.regular-expressions.info/email.html</p>
     */
    EMAIL_FORMAT: /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b$/i
});

Ojay.Forms = function(description) {
    description.call(DSL);
};

// Stores all instances of styled form controls.
var styledInputs = [];

JS.extend(Ojay.Forms, /** @scope Ojay.Forms */{
    /**
     * <p>Returns an Ojay collection wrapping the label for the given input.</p>
     * @param {String|HTMLElement|DomCollection} input
     * @returns {DomCollection}
     */
    getLabel: function(input) {
        input = Ojay(input);
        if (!input.node) return Ojay();
        var label = input.ancestors('label');
        if (label.node) return label.at(0);
        var id = input.node.id;
        label = [].filter.call(document.getElementsByTagName('label'), function(label) { return id && label.htmlFor == id; });
        return Ojay(label.slice(0,1));
    },
    
    /**
     * <p>Returns the serialization of the given <tt>form</tt> as a string.</p>
     * @param {String|HTMLElement|DomCollection} form
     * @returns {String}
     */
    getQueryString: function(form) {
        var data = YAHOO.util.Connect.setForm(Ojay(form).node);
        YAHOO.util.Connect.resetFormState();
        return data;
    },
    
    /**
     * <p>Returns the serialization of the given <tt>form</tt> as an object.</p>
     * @param {String|HTMLElement|DomCollection} form
     * @returns {Object}
     */
    getData: function(form) {
        return this.getQueryString(form).split('&').reduce(function(memo, pair) {
            var data = pair.split('=').map(decodeURIComponent).map('trim');
            if (memo[data[0]] === undefined) memo[data[0]] = data[1];
            return memo;
        }, {});
    },
    
    /**
     * @param {String|HTMLElement|DomCollection}
     * @param {String|Boolean} value
     */
    setValue: function(element, value) {
        var selected, options, element = Ojay(element);
        switch (true) {
            
            case element.every({matches: '[type=radio]'}) :
                selected = element.map('node').filter({value: value})[0];
                if (!selected) return;
                element.set({checked: false});
                selected.checked = true;
                break;
            
            case element.matches('[type=checkbox]') :
                element.node.checked = !!(value === true || value == element.node.value);
                break;
            
            case element.matches('select') :
                options = Array.from(element.node.options);
                selected = options.filter(function(option) {
                    return (option.value == value) || (option.text == value);
                })[0];
                if (!selected) return;
                options.forEach(function(option) { option.selected = false });
                selected.selected = true;
                break;
            
            case element.matches('input') :
            case element.matches('[type=hidden]') :
            case element.matches('textarea') :
                element.node.value = String(value);
                break;
        }
    }.curry(),
    
    /**
     * <p>Submits the given form, routing the submission through our validdation and
     * ajax routines.</p>
     * @param {String|HTMLElement} form
     */
    submit: function(form) {
        form = Ojay(form);
        getForm(form.node.id)._submit();
    },
    
    /**
     * <p>Goes through all sets of form rules and makes sure each one is associated with
     * an existing form in the document. Useful for replacing a form dynamically and then
     * reattaching all the rules. Returns the number of reattached forms.</p>
     * @returns {Number}
     */
    reattach: function() {
        var n = 0;
        for (var id in forms) {
            if (forms[id]._attach()) ++n;
        }
        return n;
    },
    
    /**
     * <p>Makes sure all styled form inputs are displaying the right values from the
     * underlying form inputs.</p>
     */
    update: function() {
        styledInputs.forEach(function(input) {
            if (input.isA(Ojay.Forms.Select)) input._updateDisplayFromSelect();
            else input.setChecked();
        });
    }
});


/**
 * <p>The <tt>FormDescription</tt> class encapsulates sets of rules about how a form is to
 * behave. Each instance holds a set of requirements, which are tested against the form's
 * data each time the form is submitted in order to decide whether to allow submission to
 * the server.</p>
 * @constructor
 * @class FormDescription
 * @private
 */
var FormDescription = new JS.Class('Ojay.Forms.FormDescription', /** @scope FormDescription.prototype */{
    include: JS.Observable,
    
    /**
     * @param {String} id
     */
    initialize: function(id) {
        this._formID = id;
        this._displayNames = {};
        this._attach();
        
        this._requirements   = {};
        this._validators     = [];
        this._dataFilters    = [];
        this._ajaxResponders = [];
        this._dsl    = new FormDSL(this);
        this._when   = new WhenDSL(this);
        this._before = new BeforeDSL(this);
    },
    
    /**
     * <p>Finds the form element in the document and hijacks its submit event. Returns a
     * boolean to indicate whether the form was reattached.</p>
     * @returns {Boolean}
     */
    _attach: function() {
        if (this._hasForm()) return false;
        this._inputs = {};
        this._labels = {};
        this._names  = {};
        this._form = Ojay.byId(this._formID);
        if (!this._hasForm()) return false;
        for (var field in this._requirements) this._requirements[field]._attach();
        
        this._form.on('submit', function(form, evnt) {
            if (!this._handleSubmission()) evnt.stopDefault();
        }, this);
        
        return true;
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the description object has an associated <tt>form</tt>
     * element in the current document.</p>
     * @returns {Boolean}
     */
    _hasForm: function() {
        return this._form && this._form.ancestors('body').node;
    },
    
    /**
     * <p>Returns the <tt>FormRequirement</tt> object for the named field. If no existing
     * requirement object is found for the field, a new one is created for it.</p>
     * @param {String} name
     * @returns {FormRequirement}
     */
    _getRequirement: function(name) {
        return this._requirements[name] || (this._requirements[name] = new FormRequirement(this, name));
    },
    
    /**
     * <p>Submits the form, enforcing validation and Ajax rules.</p>
     */
    _submit: function() {
        if (this._handleSubmission()) this._form.node.submit();
    },
    
    /**
     * <p>Processes form submission events by validating the form and stopping the event
     * from proceeding if the form data is found to be invalid.</p>
     */
    _handleSubmission: function() {
        var allowed = true; valid = this._isValid();
        if (this._ajax || !valid) allowed = false;
        if (!this._ajax || !valid) return allowed;
        var form = this._form.node;
        Ojay.HTTP[(form.method || 'POST').toUpperCase()](form.action, this._data, {
            onSuccess: function(response) {
                this._ajaxResponders.forEach({call: [null, response]});
            }.bind(this)
        });
        return allowed;
    },
    
    /**
     * <p>Returns an Ojay collection representing all the inputs in the form with the given
     * <tt>name</tt>.</p>
     * @param {String} name
     * @return {DomCollection}
     */
    _getInputs: function(name) {
        if (this._inputs[name]) return this._inputs[name];
        var inputs = this._form.descendants('input, textarea, select');
        if (name) inputs = inputs.filter(function(element) { return element.node.name == name; });
        return this._inputs[name] = inputs;
    },
    
    /**
     * <p>Returns an Ojay collection for the <tt>label</tt> tag for a specified <tt>name</tt>
     * or element referece.</p>
     * @param {String|HTMLElement|DomCollection} name
     * @returns {DomCollection}
     */
    _getLabel: function(name) {
        if (name.node) name = name.node;
        if (name.name) name = name.name;
        return this._labels[name] || ( this._labels[name] = Ojay.Forms.getLabel(this._getInputs(name)) );
    },
    
    /**
     * <p>Returns a human-readable name for the given field. If the developer has not specified
     * a name, it is inferred from the field's label, or from the field's name itself if no label
     * is found.</p>
     * @param {String} name
     * @returns {String}
     */
    _getName: function(field) {
        if (this._names[field]) return this._names[field];
        if (this._displayNames[field]) return this._names[field] = this._displayNames[field];
        var label = this._getLabel(field);
        var name = ((label.node || {}).innerHTML || field).stripTags();
        
        name = name.replace(/(\w)[_-](\w)/g, '$1 $2')
                .replace(/([a-z])([A-Z])/g, function(match, a, b) {
                    return a + ' ' + b.toLowerCase();
                });
        
        return this._names[field] = name.charAt(0).toUpperCase() + name.substring(1);
    },
    
    /**
     * <p>Returns the data in the form using <tt>YAHOO.util.Connect</tt>.</p>
     * @returns {Object}
     */
    _getData: function() {
        return this._data = Ojay.Forms.getData(this._form);
    },
    
    /**
     * <p>Validates the form by applying the set of requirements to the form's current data and
     * building up a collection of errors, and notifies any observers that validation has taken
     * place.</p>
     */
    _validate: function() {
        this._errors = new FormErrors(this);
        var data = this._getData(), key, input;
        
        this._dataFilters.forEach(function(filter) { filter(data); });
        for (key in data) Ojay.Forms.setValue(this._getInputs(key), data[key]);
        Ojay.Forms.update();
        
        data = new FormData(data);
        for (key in this._requirements)
            this._requirements[key]._test(data.get(key), data);
        
        this._validators.forEach(function(validate) { validate(data, this._errors); }, this);
        
        var fields = this._errors._fields();
        for (key in this._inputs)
            [this._getInputs(key), this._getLabel(key)].forEach(
                it()[fields.indexOf(key) == -1 ? 'removeClass' : 'addClass']('invalid'));
        
        this.notifyObservers(this);
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the form's current data is valid according to the set
     * of stored requirements.</p>
     * @returns {Boolean}
     */
    _isValid: function() {
        this._validate();
        return this._errors._count() === 0;
    },
    
    /**
     * <p>Causes the form's inputs and labels to add/remove the class name 'focused' in response
     * to user interaction, to allow you to highlight the active field with CSS.</p>
     */
    _highlightActiveField: function() {
        this._getInputs('').forEach(function(input) {
            input.on('focus').addClass('focused')._(this)._getLabel(input).addClass('focused');
            input.on('blur').removeClass('focused')._(this)._getLabel(input).removeClass('focused');
        }, this);
    }
});


var isPresent = function(value) {
    return !Ojay.isBlank(value) || ['must not be blank'];
};

/**
 * <p>The <tt>FormRequirement</tt> class encapsulates a set of tests against the value of a single
 * form field. The tests are defined externally and added using the <tt>_add()</tt> method. Each
 * test should be a function that takes a value and decides whether or not it is valid. The
 * <tt>FormRequirement</tt> instance can be used to run all the tests against a field.</p>
 * @constructor
 * @class FormRequirement
 * @private
 */
var FormRequirement = new JS.Class('Ojay.Forms.FormRequirement', {
    /**
     * @param {FormDescription} form
     * @param {String} field
     */
    initialize: function(form, field) {
        this._form = form;
        this._field = field;
        this._tests = [];
        this._dsl = new RequirementDSL(this);
        this._attach();
    },
    
    /**
     */
    _attach: function() {
        this._elements = this._form._getInputs(this._field);
    },
    
    /**
     * @param {Function} block
     */
    _add: function(block) {
        this._tests.push(block);
    },
    
    /**
     * @param {String} value
     * @param {Object} data
     * @returns {Array|Boolean}
     */
    _test: function(value, data) {
        if (!this._visible()) return true;
        var errors = [], tests = this._tests.length ? this._tests : [isPresent], value = value || '';
        tests.forEach(function(block) {
            var result = block(value, data), message, field;
            if (result !== true) {
                message = result[0]; field = result[1] || this._field;
                this._form._errors.register(this._field);
                this._form._errors.add(field, message);
            }
        }, this);
    },
    
    /**
     * @returns {Boolean}
     */
    _visible: function() {
        return !!this._elements && this._elements.reduce(function(truth, element) {
            var node = element.node;
            do {
                if (node.parentNode && Ojay(node).getStyle('display') == 'none') return false;
            } while (node = node.parentNode)
            return truth;
        }, true);
    }
});


/**
 * <p>The <tt>FormData</tt> class provides read-only access to data objects for the
 * purposes of validation. Validation routines cannot modify form data through this
 * class. To use it, pass an object to the constructor. The resulting instance will
 * provide a <tt>get()</tt> method to retrieve fields from the object but will not
 * let you write to these fields.</p>
 * @contructor
 * @class FormData
 * @private
 */
var FormData = new JS.Class('Ojay.Forms.FormData', /** @scope FormData.prototype */{
    /**
     * @param {Object} data
     */
    initialize: function(data) {
        this.get = function(field) {
            return data[field] === undefined ? null : data[field];
        };
    }
});


/**
 * <p>The <tt>FormErrors</tt> class provides append-only access to error lists for the
 * purposes of validation. Validation routines cannot modify existing errors or remove
 * them from the list, so existing validation rules cannot be bypassed.</p>
 * @contructor
 * @class FormErrors
 * @private
 */
var FormErrors = new JS.Class('Ojay.Forms.FormErrors', /** @scope FormErrors.prototype */{
    initialize: function(form) {
        var errors = {}, base = [];
        
        /**
         * <p>Creates storage space to put errors for the named field</p>
         * @param {String} field
         * @returns {FormErrors}
         */
        this.register = function(field) {
            errors[field] = errors[field] || [];
            return this;
        };
        
        /**
         * <p>Adds an error to the given <tt>field</tt> with message <tt>message</tt>.</p>
         * @param {String} field
         * @param {String} message
         * @returns {FormErrors}
         */
        this.add = function(field, message) {
            this.register(field);
            if (errors[field].indexOf(message) == -1) errors[field].push(message);
            return this;
        };
        
        /**
         * <p>Adds an error to the form as a whole rather than to an individual field.</p>
         * @param {String} message
         * @returns {FormErrors}
         */
        this.addToBase = function(message) {
            base.push(message);
            return this;
        };
        
        /**
         * <p>Returns the number of errors.</p>
         * @returns {Number}
         */
        this._count = function() {
            var n = base.length;
            for (var field in errors) n += errors[field].length;
            return n;
        };
        
        /**
         * <p>Returns an array of objects representing the errors in the form.<p>
         * @returns {Array}
         */
        this._messages = function() {
            var name, messages = base.map(function(message) {
                return {field: null, message: message};
            });
            for (var field in errors) {
                name = form._getName(field);
                errors[field].forEach(function(message) {
                    messages.push({field: field, message: name + ' ' + message});
                });
            }
            return messages;
        };
        
        /**
         * <p>Returns a list of field names that currently are invalid.</p>
         * @returns {Array}
         */
        this._fields = function() {
            var fields = [];
            for (var field in errors) fields.push(field);
            return fields;
        };
    }
});


/**
 * @overview
 *
 * <p><tt>Ojay.Forms</tt> provides a DSL-style API for writing specs for validating form input,
 * handling errors when they occur, and allowing forms to be submitted using Ajax. Its most basic
 * building block is the <tt>requires</tt> statement, which expresses the fact that a given field
 * must contain some data in order to be valid. You write all your form specs within a block like
 * the following:</p>
 *
 * <pre><code>    Ojay.Forms(function() { with(this) {
 *         
 *         // The form with id 'foo' requires field named 'bar'
 *         form('foo').requires('bar');
 *     }});</code></pre>
 *
 * <p>Note that, although all these examples have their own <tt>Ojay.Forms()</tt> block, you could
 * put them all in one block together.</p>
 *
 * <p>You can also use the word <tt>expects</tt> in place of <tt>requires</tt> -- the two perform
 * exactly the same function. As well as simply requiring a field, you can say what form the input
 * should take using a variety of pre-built validator functions. Here's an example:</p>
 *
 * <pre><code>    Ojay.Forms(function() { with(this) {
 *         
 *         form('theForm')
 *             .requires('username').toHaveLength({minimum: 6})
 *             .requires('email').toMatch(EMAIL_FORMAT)
 *             .expects('tickets').toBeNumeric();
 *     }});</code></pre>
 *
 * <p>The full list of validator methods can be found in the <tt>RequirementDSL</tt> class. All
 * requirments take as their last argument an optional string specifying the text that should
 * be displayed in the error message if the field is invalid. Additionally, the <tt>requires</tt>
 * and <tt>expects</tt> methods take an optional argument to specify how the name of the field
 * should be presented. If no custom name is given for the field, a name is inferred from the field's
 * label or its <tt>name</tt> attribute.</p>
 *
 * <pre><code>    Ojay.Forms(function() { with(this) {
 *         
 *         // Gives message "User email is not valid"
 *         form('signup').requires('userEmail').toMatch(EMAIL_FORMAT);
 *         
 *         // Gives message "Your email address is not valid"
 *         form('signup').requires('userEmail', 'Your email address').toMatch(EMAIL_FORMAT);
 *         
 *         // Gives message "User email is not a valid email address"
 *         form('signup').requires('userEmail').toMatch(EMAIL_FORMAT, 'is not a valid email address');
 *     }});</code></pre>
 *
 * <p>You can add your own custom validation routines using the <tt>validates</tt> method. In
 * your validation callback, you have access to the form's data and its error list. You can
 * read from the data and add errors as follows:</p>
 *
 * <pre><code>    Ojay.Forms(function() { with(this) {
 *         
 *         form('purchase').validates(function(data, errors) {
 *             
 *             // Check a field and add error to that field
 *             if (data.get('ccNumber').length != 16)
 *                 errors.add('ccNumber', 'is not a valid credit card number');
 *             
 *             // Check two fields and add error to the form
 *             // rather than to a specific field
 *             if (data.get('start') > data.get('end'))
 *                 errors.addToBase('Start date must be before end date');
 *         });
 *     }});</code></pre>
 *
 * <p>Once you've set up all your rules you'll want to do something with the errors. This
 * is where the helper function <tt>when</tt> comes in. <tt>when</tt> is used to set up
 * responses to events, and can handle validation events. In the example below, the callback
 * is passed an array of errors, each of which has a <tt>field</tt> property that says which
 * input name it belongs to (null if it was added using <tt>addToBase</tt>) and a
 * <tt>message</tt> field that contains the full text of the error message.</p>
 *
 * <pre><code>    Ojay.Forms(function() { with(this) {
 *         
 *         when('purchase').isValidated(function(errors) {
 *             errors.forEach(function(error) {
 *                 Ojay('#someElement').insert(error.message, 'top');
 *             });
 *         });
 *         
 *         // Ojay provides a pre-build error handler that lists the
 *         // errors in the element you specify:
 *         when('purchase').isValidated(displayErrorsIn('#error-list'));
 *     }});</code></pre>
 *
 * <p>Finally, the DSL allows you specify that a form submits using Ajax. To use this
 * feature, you just need to tell Ojay what to do with the server response. For example:</p>
 *
 * <pre><code>    Ojay.Forms(function() { with(this) {
 *         
 *         form('login').submitsUsingAjax();
 *         
 *         when('login').responseArrives(function(response) {
 *             Ojay('#response').setContent(response.responseText);
 *         });
 *         
 *         // Or use Ojay's pre-built display method:
 *         when('login').responseArrives(displayResponseIn('#response'));
 *     }});</code></pre>
 */

// Store to hold sets of form rules, entry per page form.
var forms = {};

/**
 * <p>Returns the <tt>FormDescription</tt> for the given <tt>id</tt>. A new description is
 * created if one does not already exist for the <tt>id</tt>.</p>
 * @param {String} id
 * @returns {FormDescription}
 * @private
 */
var getForm = function(id) {
    return forms[id] || (forms[id] = new FormDescription(id));
};

/**
 * <p>This is the main DSL object for <tt>Ojay.Forms</tt>. It contains methods that should
 * act as top-level functions in the DSL. Do not put a method in here unless it needs to be
 * a top-level function.</p>
 * @private
 */
var DSL = {
    /**
     * <p>Returns a DSL object for describing the form with the given <tt>id</tt>.</p>
     * @param {String} id
     * @returns {FormDSL}
     */
    form: function(id) {
        return getForm(id)._dsl || null;
    },
    
    /**
     * <p>Returns a DSL object for handling events related to the form with the
     * given <tt>id</tt>.</p>
     * @param {String} id
     * @returns {WhenDSL}
     */
    when: function(id) {
        return getForm(id)._when || null;
    },
    
    /**
     * <p>Returns a DSL object for applying pre-processing filters before events take place.</p>
     * @param {String} id
     * @returns {BeforeDSL}
     */
    before: function(id) {
        return getForm(id)._before || null;
    },
    
    /**
     * <p>Returns a helper function for use with <tt>when().isValidated()</tt>. The returned
     * function will display the forms elements as a bulleted list inside the element you
     * supply, in a <tt>div</tt> with the class name <tt>error-explanation</tt>.</p>
     * @param {String|HTMLElement|DomCollection} element
     * @returns {Function}
     */
    displayErrorsIn: function(element) {
        return function(errors) {
            element = element.setContent ? element : Ojay(element);
            var n = errors.length;
            if (n == 0) return element.setContent('');
            var were = (n == 1) ? 'was' : 'were', s = (n == 1) ? '' : 's';
            element.setContent(Ojay.HTML.div({className: 'error-explanation'}, function(HTML) {
                HTML.p('There ' + were + ' ' + n + ' error' + s + ' with the form:');
                HTML.ul(function(HTML) {
                    errors.map('message').forEach(HTML.method('li'));
                });
            }));
        };
    },
    
    /**
     * <p>Returns a helper function for use with <tt>when().responseArrives()</tt>. The returned
     * function will take the HTTP response body and display it in the specified element.</p>
     * @param {String|HTMLElement|DomCollection} element
     * @returns {Function}
     */
    displayResponseIn: function(element) {
        return function(response) {
            response.insertInto(element);
        };
    },
    
    EMAIL_FORMAT: Ojay.EMAIL_FORMAT
};

/**
 * <p>The <tt>FormDSL</tt> class creates DSL objects used to describe forms. Every
 * <tt>FormDescription</tt> instance has one of these objects that provides DSL-level
 * access to the description.</p>
 * @constructor
 * @class FormDSL
 * @private
 */
var FormDSL = new JS.Class('Ojay.Forms.FormDSL', /** @scope FormDSL.prototype */{
    /**
     * @param {FormDescription} form
     */
    initialize: function(form) {
        this._form = form;
    },
    
    /**
     * <p>Returns a <tt>RequirementDSL</tt> object used to specify the requirement.</p>
     * @param {String} name
     * @param {String} displayed
     * @returns {RequirementDSL}
     */
    requires: function(name, displayed) {
        var requirement = this._form._getRequirement(name);
        if (displayed) this._form._displayNames[name] = displayed;
        return requirement._dsl;
    },
    
    /**
     * <p>Adds a validator function to the form that allows the user to inspect the data
     * and add new errors.</p>
     * @param {Function} block
     * @returns {FormDSL}
     */
    validates: function(block) {
        this._form._validators.push(block);
        return this;
    },
    
    /**
     * <p>Causes form submissions to be sent using Ajax rather than page-reloading requests.</p>
     * @param {Object} options
     * @returns {FormDSL}
     */
    submitsUsingAjax: function(options) {
        this._form._ajax = true;
        return this;
    },
    
    /**
     * <p>Causes the form to indicate which field in currently focused by applying a class
     * name to the focused input element.</p>
     * @returns {FormDSL}
     */
    highlightsActiveField: function() {
        this._form._highlightActiveField();
        return this;
    }
});

FormDSL.include({expects: FormDSL.prototype.requires});

var FormDSLMethods = ['requires', 'expects', 'validates', 'submitsUsingAjax', 'highlightsActiveField'];

/**
 * <p>The <tt>RequirementDSL</tt> class creates DSL objects used to describe form requirements.
 * All <tt>FormRequirement</tt> objects have one of these objects associated with them.</p>
 * @constructor
 * @class RequirementDSL
 * @private
 */
var RequirementDSL = new JS.Class('Ojay.Forms.RequirementDSL', /** @scope RequirementDSL.prototype */{
    /**
     * @param {FormRequirement} requirement
     */
    initialize: function(requirement) {
        this._requirement = requirement;
    },
    
    /**
     * <p>Specifies that the given checkbox field must be checked.</p>
     * @param {String} message
     * @returns {RequirementDSL}
     */
    toBeChecked: function(message) {
        var requirement = this._requirement;
        this._requirement._add(function(value) {
            var element = requirement._elements.node;
            return (value == element.value && element.checked) || [message || 'must be checked'];
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must be a number in order to be considered valid.</p>
     * @param {String} message
     * @returns {RequirementDSL}
     */
    toBeNumeric: function(message) {
        this._requirement._add(function(value) {
            return Ojay.isNumeric(value) || [message || 'must be a number'];
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must have one of the values in the given list in
     * order to be considered valid.</p>
     * @param {Array} list
     * @param {String} message
     * @returns {RequirementDSL}
     */
    toBeOneOf: function(list, message) {
        this._requirement._add(function(value) {
            return list.indexOf(value) != -1 || [message || 'is not valid'];
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must have none of the values in the given list in
     * order to be considered valid.</p>
     * @param {Array} list
     * @param {String} message
     * @returns {RequirementDSL}
     */
    toBeNoneOf: function(list, message) {
        this._requirement._add(function(value) {
            return list.indexOf(value) == -1 || [message || 'is not valid'];
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must not be blank in order to be considered valid.
     * Calling this method is only necessary if you want a custom message for the rule, otherwise
     * a simple <tt>requires()</tt> will do.</p>
     * @param {String} message
     * @returns {RequirementDSL}
     */
    toBePresent: function(message) {
        this._requirement._add(function(value) {
            return !Ojay.isBlank(value) || [message || 'must not be blank'];
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must confirm the value in another field.</p>
     * @param {String} field
     * @param {String} message
     * @returns {RequirementDSL}
     */
    toConfirm: function(field, message) {
        this._requirement._add(function(value, data) {
            return value == data.get(field) || [message || 'must be confirmed', field];
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must have a certain length in order to be considered
     * valid. Valid inputs are a number (to specify an exact length), or an object with
     * <tt>minimum</tt> and <tt>maximum</tt> fields.</p>
     * @param {Number|Object} options
     * @param {String} message
     * @returns {RequirementDSL}
     */
    toHaveLength: function(options, message) {
        var min = options.minimum, max = options.maximum;
        this._requirement._add(function(value) {
            return  (typeof options == 'number' && value.length != options &&
                        [message || 'must contain exactly ' + options + ' characters']) ||
                    (min !== undefined && value.length < min &&
                        [message || 'must contain at least ' + min + ' characters']) ||
                    (max !== undefined && value.length > max &&
                        [message || 'must contain no more than ' + max + ' characters']) ||
                    true;
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must have a certain value in order to be considered
     * valid. Input should be an object with <tt>minimum</tt> and <tt>maximum</tt> fields.</p>
     * @param {Object} options
     * @param {String} message
     * @returns {RequirementDSL}
     */
    toHaveValue: function(options, message) {
        var min = options.minimum, max = options.maximum;
        this._requirement._add(function(value) {
            if (!Ojay.isNumeric(value)) return [message || 'must be a number'];
            value = Number(value);
            return  (min !== undefined && value < min &&
                        [message || 'must be at least ' + min]) ||
                    (max !== undefined && value > max &&
                        [message || 'must not be greater than ' + max]) ||
                    true;
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must match a given regex in order to be considered
     * valid.</p>
     * @param {Regexp} format
     * @param {String} message
     * @returns {RequirementDSL}
     */
    toMatch: function(format, message) {
        this._requirement._add(function(value) {
            return format.test(value) || [message || 'is not valid'];
        });
        return this;
    }
});

RequirementDSL.include(FormDSLMethods.reduce(function(memo, method) {
    memo[method] = function() {
        var base = this._requirement._form._dsl;
        return base[method].apply(base, arguments);
    };
    return memo;
}, {}));

/**
 * <p>The <tt>WhenDSL</tt> class creates DSL objects used to describe form requirements. All
 * <tt>FormDescription</tt> objects have one of these objects associated with them. The WhenDSL
 * is used specifically to describe events linked to forms.</p>
 * @constructor
 * @class WhenDSL
 * @private
 */
var WhenDSL = new JS.Class('Ojay.Forms.WhenDSL', /** @scope WhenDSL.prototype */{
    /**
     * @param {FormDescription} form
     */
    initialize: function(form) {
        this._form = form;
    },
    
    /**
     * <p>Allows a hook to be registered to say what should be done with the list of error
     * messages when a particular form is validated.</p>
     * @param {Function} block
     * @param {Object} context
     */
    isValidated: function(block, context) {
        this._form.subscribe(function(form) {
            block.call(context || null, form._errors._messages());
        });
    },
    
    /**
     * <p>Registers a function to handle the HTTP response when an Ajax form submission completes.</p>
     * @param {Function} block
     * @param {Object} context
     */
    responseArrives: function(block, context) {
        block = Function.from(block);
        if (context) block = block.bind(context);
        this._form._ajaxResponders.push(block);
    }
});

/**
 * <p>The <tt>BeforeDSL</tt> class creates DSL objects used to describe pre-processing actions. All
 * <tt>FormDescription</tt> objects have one of these objects associated with them.</p>
 * @constructor
 * @class BeforeDSL
 * @private
 */
var BeforeDSL = new JS.Class('Ojay.Forms.BeforeDSL', {
    /**
     * @param {FormDescription} form
     */
    initialize: function(form) {
        this._form = form;
    },
    
    /**
     * @param {Function} block
     */
    isValidated: function(block) {
        this._form._dataFilters.push(block);
    }
});


/**
 * <p>The <tt>Inputable</tt> module is mixed into <tt>Forms.Select</tt>, and indirectly into
 * <tt>Forms.Checkbox</tt> and <tt>Forms.RadioButtons.Item</tt> through <tt>Checkable</tt>.
 * It provides methods for setting class names on form elements to indicate the hovered, focused
 * and disabled states of form inputs.</p>
 * @module Inputable
 * @private
 */
var Inputable = new JS.Module('Ojay.Forms.Inputable', /** @scope Inputable */{
    include: Ojay.Observable,
    
    extend: {
        DEFAULT_WRAPPER_POSITION: 'relative'
    },
    
    /**
     * <p>Called inside class constructors to set up the behaviour of the form input and
     * its associated label. Hides the input off the page, and sets up a set of events to
     * enable class names to be changed.</p>
     */
    _setupInput: function() {
        var wrapper = Ojay( Ojay.HTML.span() ).setStyle({position: this._options.wrapperPosition || Inputable.DEFAULT_WRAPPER_POSITION});
        this._input.insert(wrapper.node, 'before');
        wrapper.insert(this._input.node, 'bottom');
        this._input.setStyle({position: 'absolute', left: '-5000px', top: 0});
        
        this._input.on('focus')._(this).setFocused(true);
        this._input.on('blur')._(this).setFocused(false);
        
        this._label = Ojay.Forms.getLabel(this._input);
        if (this._label.node) this._label.addClass(this._inputType);
        
        this._interface = [this._input, this._label];
        if (this.getHTML) this._interface.push(this.getHTML());
        this._interface.forEach(it().on('mouseover')._(this).setHovered(true));
        this._interface.forEach(it().on('mouseout')._(this).setHovered(false));
        this._interface.forEach(it().addClass('js'));
        
        this.setDisabled();
    },
    
    /**
     * <p>Adds or removes the class name 'focused' from the input and its label depending on <tt>state</tt>.</p>
     * @param {Boolean} state
     * @returns {Inputable}
     */
    setFocused: function(state) {
        if (this._input.node.checked) this.setChecked();
        this._setClass(state, 'focused');
        return this;
    },
    
    /**
     * <p>Adds or removes the class name 'focused' from the input and its label depending on <tt>state</tt>.</p>
     * @param {Boolean} state
     * @returns {Inputable}
     */
    setHovered: function(state) {
        this._setClass(state, 'hovered');
        return this;
    },
    
    /**
     * <p>Adds or removes the class name 'disabled' from the input and its label depending on <tt>state</tt>.</p>
     * @param {Boolean} state
     * @returns {Inputable}
     */
    setDisabled: function(state) {
        this.disabled = (state === undefined) ? this._input.node.disabled : !!state;
        this._input.node.disabled = this.disabled;
        this._setClass(this.disabled, 'disabled');
        return this;
    },
    
    /**
     * <p>Adds or removes a class name from the input's elements according to its state.</p>
     * @param {Boolean} state
     * @param {String} name
     */
    _setClass: function(state, name) {
        this._stateClasses = this._stateClasses || [];
        if (state) {
            if (this._stateClasses.indexOf(name) == -1) this._stateClasses.push(name);
            this._stateClasses.sort();
        } else {
            this._stateClasses = this._stateClasses.filter(function(s) { return s != name });
        }
        
        this._interface.forEach(it()[state ? 'addClass' : 'removeClass'](name));
        var classes = this._interface[0].node.className.split(/\s+/);
        
        var type = this._inputType, pattern = new RegExp('^' + type + '-');
        
        var stateClass = classes.filter({match: pattern})[0];
        if (stateClass) this._interface.forEach({removeClass: stateClass});
        if (this._stateClasses.length) this._interface.forEach({addClass: type + '-' + this._stateClasses.join('-')});
    }
});


/**
 * <p>The <tt>Checkable</tt> module extends <tt>Inputable</tt> by providing methods to
 * handle checking and unchecking of form elements. It is used by the <tt>Forms.Checkbox</tt>
 * and <tt>Forms.RadioButtons.Item</tt> classes to add and remove class names from their
 * associated <tt>label</tt> tags.</p>
 * @private
 * @module Checkable
 */
var Checkable = new JS.Module('Ojay.Forms.Checkable', /** @scope Checkable */{
    include: Inputable,
    
    /**
     * <p>Called inside class constructors to set up the behaviour of a form input and its label.
     * Causes the input and its label to add/remove the 'checked' class name to indicate the state
     * of the input.</p>
     */
    _setupButton: function() {
        this._setupInput();
        this._input.on('click')._(this).setChecked()._(this._input.node).focus();
        this.setChecked();
    },
    
    /**
     * <p>Adds or removes the class name 'checked' from the input and its label depending on whether the
     * input is checked. If the input is part of a <tt>RadioButtons</tt> group, notifies the group in
     * order to change the state of the currently checked input.</p>
     * @param {Boolean} state
     * @param {Boolean} notify
     * @returns {Checkable}
     */
    setChecked: function(state, notify) {
        var oldChecked = !!this.checked;
        this.checked = (state === undefined) ? this._input.node.checked : !!state;
        if (this._group) {
            if (this.checked) {
                this._input.node.checked = true;
                this._group._check(this, notify);
            }
        } else {
            this._input.node.checked = this.checked;
            if (notify !== false && oldChecked != this.checked)
                this.notifyObservers('change');
        }
        this._setClass(this.checked, 'checked');
        return this;
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the element is checked.</p>
     * @returns {Boolean}
     */
    isChecked: function() {
        return !!this.checked;
    }
});

JS.MethodChain.addMethod('focus');


/**
 * <p>The <tt>Forms.RadioButtons</tt> class can be used to 'hijack' sets of radio buttons to
 * make them easier to style using CSS. The radio inputs themselves become hidden (they are positioned
 * off-screen rather than hidden using <tt>display</tt> or <tt>visibility</tt>) and their labels
 * have their class names changed to mirror changes to the inputs as the user interacts with the form.</p>
 *
 * <p>This class is designed as a light-weight and unobtrusive replacement for <tt>YAHOO.widget.ButtonGroup</tt>
 * for the simple case where you want to style your form inputs and retain programmatic access to them.
 * It encourages accessible markup through use of <tt>label</tt> elements, and does not alter the HTML
 * structure of your form in any way.</p>
 *
 * @constructor
 * @class Forms.RadioButtons
 */
Ojay.Forms.RadioButtons = new JS.Class('Ojay.Forms.RadioButtons', /** @scope Forms.RadioButtons.prototype */{
    include: Ojay.Observable,
    
    /**
     * @param {String|HTMLElement|DomCollection} inputs
     * @param {Object} options
     */
    initialize: function(inputs, options) {
        this._items = Ojay(inputs).map(function(input) { return new this.klass.Item(this, input, options); }, this);
        if (this._items.map('_input.node.name').unique().length > 1)
            throw new Error('Attempt to create a RadioButtons object with radios of different names');
        this._checkedItem = this._items.filter('checked')[0] || null;
    },
    
    /**
     * <p>This method is used to make sure that only one input appears checked at any time. Items
     * must notify their group when they become checked so the group can uncheck the previously
     * checked item.</p>
     * @param {Forms.RadioButtons.Item} item
     * @param {Boolean} notify
     */
    _check: function(item, notify) {
        var current = this._checkedItem;
        if (current && current != item) current.setChecked(false);
        if (notify !== false && current != item) this.notifyObservers('change');
        this._checkedItem = item;
    },
    
    /**
     * <p>Returns the <tt>Item</tt> in the <tt>RadioButtons</tt> group with the given id or value.</p>
     * @param {String|Number} id
     * @returns {Forms.RadioButtons.Item}
     */
    getItem: function(id) {
        return this._items.filter(function(item) {
            return item._input.node.id == id || item._input.node.value == id;
        })[0];
    },
    
    /**
     * @returns {DomCollection}
     */
    getInput: function() {
        return Ojay(this._items.map('_input.node'));
    },
    
    /**
     * @returns {DomCollection}
     */
    getLabel: function() {
        return Ojay(this._items.map('_label.node'));
    },
    
    /**
     * <p>Returns the current value of the radio button group.</p>
     * @returns {String}
     */
    getValue: function() {
        var item = this._items.filter('_input.node.checked')[0];
        return item ? item._input.node.value : null;
    },
    
    /**
     * <p>Sets the value of the radio button group to the given <tt>value</tt>, if a button
     * with that value exists.</p>
     * @param {String} value
     * @param {Boolean} notify
     * @returns {Forms.RadioButtons}
     */
    setValue: function(value, notify) {
        var input = this.getItem(value);
        if (input) input.setChecked(true, notify);
        return this;
    },
    
    extend: /** @scope Forms.RadioButtons */{
        /**
         * @constructor
         * @class Forms.RadioButtons.Item
         */
        Item: new JS.Class('Ojay.Forms.RadioButtons.Item', /** @scope Forms.RadioButtons.Item.prototype */{
            include: Checkable,
            _inputType: 'radio',
            
            /**
             * @param {Forms.RadioButtons} group
             * @param {DomCollection} input
             * @param {Object} options
             */
            initialize: function(group, input, options) {
                this._options = options || {};
                styledInputs.push(this);
                if (!input || !input.node || input.node.type != 'radio')
                    throw new TypeError('Attempt to create a RadioButtons object with non-radio element');
                this._group = group;
                this._input = input;
                this._setupButton();
            }
        })
    }
});


/**
 * <p>The <tt>Forms.Checkbox</tt> class can be used to 'hijack' checkbox inputs in HTML forms to
 * make them easier to style using CSS. The checkbox inputs themselves become hidden (they are positioned
 * off-screen rather than hidden using <tt>display</tt> or <tt>visibility</tt>) and their labels
 * have their class names changed to mirror changes to the inputs as the user interacts with the form.</p>
 *
 * <p>This class is designed as a light-weight and unobtrusive replacement for <tt>YAHOO.widget.Button</tt>
 * for the simple case where you want to style your form inputs and retain programmatic access to them.
 * It encourages accessible markup through use of <tt>label</tt> elements, and does not alter the HTML
 * structure of your form in any way.</p>
 *
 * @constructor
 * @class Forms.Checkbox
 */
Ojay.Forms.Checkbox = new JS.Class('Ojay.Forms.Checkbox', /* @scope Forms.Checkbox.prototype */{
    include: Checkable,
    _inputType: 'checkbox',
    
    /**
     * @param {String|HTMLElement|DomCollection} input
     * @param {Object} options
     */
    initialize: function(input, options) {
        this._options = options || {};
        styledInputs.push(this);
        this._input = Ojay(input);
        if (!this._input || !this._input.node || this._input.node.type != 'checkbox')
            throw new TypeError('Attempt to create a Checkbox object with non-checkbox element');
        this._setupButton();
    },
    
    /**
     * @returns {DomCollection}
     */
    getInput: function() {
        return this._input;
    },
    
    /**
     * @returns {DomCollection}
     */
    getLabel: function() {
        return this._label;
    }
});

Ojay.Forms.Checkbox.include({
    getValue:   Ojay.Forms.Checkbox.prototype.isChecked,
    setValue:   Ojay.Forms.Checkbox.prototype.setChecked
});


/**
 * <p>The <tt>Forms.Select</tt> class can be used to 'hijack' drop-down menu inputs in HTML forms to
 * make them easier to style using CSS. The select inputs themselves become hidden (they are positioned
 * off-screen rather than hidden using <tt>display</tt> or <tt>visibility</tt>) and their labels
 * have their class names changed to mirror changes to the inputs as the user interacts with the form.</p>
 *
 * <p>This class is designed as a light-weight and unobtrusive replacement for <tt>YAHOO.widget.Button</tt>
 * for the simple case where you want to style your form inputs and retain programmatic access to them.
 * It encourages accessible markup through use of <tt>label</tt> elements, and does not alter the HTML
 * structure of your form in any way.</p>
 *
 * @constructor
 * @class Forms.Select
 */
Ojay.Forms.Select = new JS.Class('Ojay.Forms.Select', /** @scope Forms.Select.prototype */{
    include: [JS.State, Inputable],
    _inputType: 'select',
    
    extend: /** @scope Forms.Select */{
        CONTAINER_CLASS:    'select-container',
        DISPLAY_CLASS:      'select-display',
        BUTTON_CLASS:       'select-button',
        LIST_CLASS:         'select-list',
        
        /**
         * @constructor
         * @class Forms.Select.Option
         */
        Option: new JS.Class('Ojay.Forms.Select.Option', /** @scope Forms.Select.Option.prototype */{
            /**
             * @param {Forms.Select} select
             * @param {HTMLElement} option
             */
            initialize: function(select, option) {
                this._select = select;
                this._option = Ojay(option);
                this.value = option.value || '';
                this._label = option.text.stripTags();
                this.hovered = false;
                
                var element = this.getHTML();
                [element.on('mouseover'), element.on('mousemove')]
                        .forEach(it()._(this).setHovered(true));
            },
            
            /**
             * <p>Returns an Ojay collection wrapping the list item used to display the option.</p>
             * @returns {DomCollection}
             */
            getHTML: function() {
                if (this._html) return this._html;
                return this._html = Ojay( Ojay.HTML.li(this._label) );
            },
            
            /**
             * <p>Sets the option to be hovered, and notified its parent <tt>Select</tt> instance
             * so it can un-hover the currently hovered option.</p>
             * @param {Boolean} state
             * @returns {Forms.Select.Option}
             */
            setHovered: function(state) {
                this.hovered = (state !== false);
                if (this.hovered) {
                    this._select._setHoveredOption(this);
                    this._nudgeIntoView();
                }
                this.getHTML()[state === false ? 'removeClass' : 'addClass']('hovered');
                return this;
            },
            
            /**
             * <p>Makes sure the option is in view if the list container has a fixed height
             * and is using <tt>overflow: scroll</tt>.</p>
             */
            _nudgeIntoView: function() {
                var list = this._select._elements._listContainer;
                var listRegion = list.getRegion(), myRegion = this.getHTML().getRegion();
                if (listRegion.contains(myRegion)) return;
                var scroll = list.node.scrollTop || 0, edge = (myRegion.top > listRegion.top) ? 'bottom' : 'top';
                list.node.scrollTop = scroll + myRegion[edge] - listRegion[edge];
            }
        })
    },
    
    /**
     * @param {String|HTMLElement|DomCollection} select
     * @param {Object} options
     */
    initialize: function(select, options) {
        this._options = options || {};
        styledInputs.push(this);
        this._input = Ojay(select);
        if (!this._input || this._input.node.tagName.toLowerCase() != 'select')
            throw new TypeError('Attempt to create a Select object with non-select element');
        var elements = this._elements = {};
        this._input.insert(this.getHTML().node, 'after');
        this._setupInput();
        this.updateOptions();
        
        this.setState('LIST_OPEN');
        this.hideList(false);
        
        this._input.on('blur')._(this).hideList(true);
        
        // Wait a little bit because 'keydown' fires before the value changes
        [this._input.on('keydown'), this._input.on('change')]
                .forEach(it().wait(0.001)._(this)._updateDisplayFromSelect(false));
        
        this._input.on('keydown', function(element, evnt) {
            var code = evnt.keyCode || 0;
            if (code.between(48,57) || code.between(65,90) || code.between(37,40))
                this.wait(0.001).showList();
        }, this);
        
        elements._container.setStyle({position: 'relative', cursor: 'default'});
        [elements._display, elements._button].forEach(it().on('click')._(this).toggleList());
        
        var KeyListener = YAHOO.util.KeyListener;
        new KeyListener(this._input.node, {keys: KeyListener.KEY.ESCAPE}, {
            fn: this.method('hideList').partial(false)
        }).enable();
        new KeyListener(this._input.node, {keys: KeyListener.KEY.ENTER}, {
            fn: this.method('hideList').partial(true)
        }).enable();
        
        elements._listContainer.setStyle({position: 'absolute'});
    },
    
    /**
     * <p>Returns an Ojay collection wrapping the HTML used as a stand-in for the
     * <tt>select</tt> input.</p>
     * @returns {DomCollection}
     */
    getHTML: function() {
        var elements = this._elements, klass = this.klass;
        if (elements._container) return elements._container;
        return elements._container = Ojay( Ojay.HTML.div({className: this.klass.CONTAINER_CLASS}, function(HTML) {
            elements._display = Ojay( HTML.div({className: klass.DISPLAY_CLASS}) );
            elements._button = Ojay( HTML.div({className: klass.BUTTON_CLASS}) );
            elements._listContainer = Ojay( HTML.div({className: klass.LIST_CLASS}, function(HTML) {
                elements._list = Ojay( HTML.ul() );
            }) );
        }) );
    },
    
    /**
     * @returns {DomCollection}
     */
    getInput: function() {
        return this._input;
    },
    
    /**
     * @returns {DomCollection}
     */
    getLabel: function() {
        return this._label;
    },
    
    /**
     * <p>Focuses the <tt>select</tt> element.</p>
     * @returns {Forms.Select}
     */
    _focusInput: function() {
        this._input.node.focus();
    },
    
    /**
     * <p>Refreshes the list of displayed options. Use this method if you change the
     * contents of the <tt>select</tt> element.</p>
     * @returns {Forms.Select}
     */
    updateOptions: function() {
        this._elements._list.setContent('');
        this._options = Array.from(this._input.node.options).map(function(option) {
            option = new this.klass.Option(this, option);
            this._elements._list.insert(option.getHTML().node);
            return option;
        }, this);
        this._updateDisplayFromSelect();
        return this;
    },
    
    /**
     * <p>Updates the UI of the instance in response to the current state of the
     * underlying <tt>select</tt> input.</p>
     * @param {Boolean} notify
     */
    _updateDisplayFromSelect: function(notify) {
        var oldValue = this._currentValue;
        var selected = this.getSelectedOption();
        if (!selected) return;
        this._elements._display.setContent(selected.text.stripTags());
        this._getOption(selected.value).setHovered(true);
        if (this.inState('LIST_OPEN') || notify === false) return;
        this._currentValue = selected.value;
        if (oldValue !== undefined && oldValue != this._currentValue)
            this.notifyObservers('change');
    },
    
    /**
     * <p>Returns the <tt>Select.Option</tt> instance with the given value.</p>
     * @param {String} value
     * @returns {Forms.Select.Option}
     */
    _getOption: function(value) {
        return this._options.filter({value: value})[0] || null;
    },
    
    /**
     * <p>Sets the given <tt>Select.Option</tt> to be hovered, and removes hover state from
     * all other options.</p>
     * @param {Forms.Select.Option}
     */
    _setHoveredOption: function(option) {
        if (this._currentOption) this._currentOption.setHovered(false);
        this._currentOption = option;
    },
    
    /**
     * <p>Returns an array of references to <tt>option</tt> elements.</p>
     * @returns {Array}
     */
    _getOptions: function() {
        return Array.from(this._input.node.options);
    },
    
    /**
     * <p>Returns a reference to the currently selected <tt>option</tt> element, or a
     * reference to the first element if none is selected.</p>
     * @returns {HTMLElement}
     */
    getSelectedOption: function() {
        return this._getOptions().filter('selected')[0] || this._input.node.options[0] || null;
    },
    
    /**
     * <p>Returns all the <tt>option</tt> elements in the <tt>select</tt> whose value equals
     * the supplied <tt>value</tt>.</p>
     * @param {String|Number} value
     * @returns {Array}
     */
    getOptionsByValue: function(value) {
        return this._getOptions().filter({value: value});
    },
    
    /**
     * <p>Returns the current value of the <tt>select</tt> element.</p>
     * @returns {String}
     */
    getValue: function() {
        return this.getSelectedOption().value;
    },
    
    /**
     * <p>Sets the value of the <tt>select</tt> element to the given <tt>value</tt>, triggering
     * a <tt>change</tt> event unless you pass <tt>false</tt> as the second parameter.</p>
     * @param {String|Number} value
     * @param {Boolean} notify
     * @returns {Forms.Select}
     */
    setValue: function(value, notify) {
        Ojay.Forms.setValue(this._input, value);
        this._updateDisplayFromSelect(notify);
        return this;
    },
    
    /**
     * <p>Sets the position of the list relative to the container so the two are properly aligned.</p>
     * @returns {Forms.Select}
     */
    updateListPosition: function() {
        var region = this._elements._container.getRegion();
        if (!region) return this;
        var list = this._elements._listContainer;
        list.setStyle({width: region.getWidth() + 'px', left: 0, top: region.getHeight() + 'px'});
        return this;
    },
    
    states: {
        LIST_CLOSED: /** @scope Forms.Select.prototype */{
            /**
             * <p>Displays the drop-down list.</p>
             * @returns {Forms.Select}
             */
            showList: function() {
                if (this.disabled) return this;
                this.updateListPosition();
                this._elements._listContainer.show();
                this.setState('LIST_OPEN');
                this._focusInput();
                var selected = this.getSelectedOption();
                if (selected) this._getOption(selected.value).setHovered(true);
                return this;
            },
            
            /**
             * <p>Displays the drop-down list.</p>
             * @returns {Forms.Select}
             */
            toggleList: function() {
                return this.showList();
            }
        },
        
        LIST_OPEN: /** @scope Forms.Select.prototype */{
            /**
             * <p>Hides the drop-down list.</p>
             * @param {Boolean} update
             * @returns {Forms.Select}
             */
            hideList: function(update) {
                this._elements._listContainer.hide();
                this.setState('LIST_CLOSED');
                if (update !== false) {
                    this.setValue(this._currentOption.value);
                    this._focusInput();
                }
                return this;
            },
            
            /**
             * <p>Hides the drop-down list.</p>
             * @param {Boolean} update
             * @returns {Forms.Select}
             */
            toggleList: function(update) {
                return this.hideList(update);
            }
        }
    }
});


})();


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


(function(KeyListener, Event, doc) {
    var KEYS = KeyListener.KEY;


var /**
     * @param {String} string
     * @returns {Array}
     */
    w = function(string) {
        string = string.trim();
        return string ? string.split(/\s+/) : [];
    },
    
    /**
     * @param {Number} a
     * @param {Number} b
     * @returns {Number}
     */
    compareNumbers = function(a, b) {
        return a - b;
    },
    
    /**
     * @param {String} key
     * @returns {Number}
     */
    codeFor = function(key) {
        return key && String(key).toUpperCase().charCodeAt(0);
    },
    
    /**
     * @param {String|Array} keylist
     * @returns {Array}
     */
    codesFromKeys = function(keylist) {
        if (typeof keylist == 'string') keylist = w(keylist);
        return keylist.map(function(key) {
            var value = null;
            if (value = KEYS[String(key).toUpperCase()]) key = value;
            if (typeof key == 'string') key = codeFor(key);
            return key;
        }).sort(compareNumbers);
    },
    
    /**
     * @param {Array} codes
     * @returns {Object}
     */
    hashFromCodes = function(codes) {
        return codes.reduce(function(hash, code) {
            switch (code) {
                case KEYS.CONTROL:  hash.ctrl = true;   break;
                case KEYS.SHIFT:    hash.shift = true;  break;
                case KEYS.ALT:      hash.alt = true;    break;
                default:
                    hash.keys.push(code);
            }
            return hash;
        }, {keys: []});
    },
    
    /**
     * @param {Array} codes
     * @returns {String}
     */
    signature = function(codes) {
        return codes.sort(compareNumbers).join(':');
    };


/**
 * <p>The <tt>Keyboard</tt> package is used to set up event listeners that respond to keyboard
 * events. It acts as a wrapper around <tt>YAHOO.util.KeyListener</tt> and provides easier syntax
 * and more control of sets of keyboard rules. To set up a keyboard listener, call:</p>
 *
 * <pre><code>    Ojay.Keyboard.listen(document, 'SHIFT B', function() { ... });</code></pre>
 *
 * <p>This returns a <tt>Rule</tt> instance that lets you disable/enable the listener. See the
 * <tt>Rule</tt> class for more details.</p>
 */
var Keyboard = Ojay.Keyboard = new JS.Singleton('Ojay.Keyboard', {
    
    /**
     * <p>Returns a new <tt>Rule</tt> instance for the given node and key combination.</p>
     * @param {HTMLElement|String} node
     * @param {String} keys
     * @param {Function} callback
     * @param {Object} scope
     * @returns {Rule}
     */
    listen: function(node, keys, callback, scope) {
        var rule = new Rule(node, keys, callback, scope);
        rule.enable();
        return rule;
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the given key combination is currently pressed.</p>
     * @param {String} keys
     * @returns {Boolean}
     */
    isPressed: function(keys) {
        return codesFromKeys(keys).every(Monitor.method('_isPressed'));
    }
});


/**
 * <p> The <tt>Rule</tt> class encapsulates the binding of an action to a set of keys. It is
 * private, i.e. it is only accessible to the internals of the <tt>Keyboard</tt> module, but
 * instances of it may be returned by the <tt>Keyboard</tt> interface.</p>
 * @constructor
 * @private
 * @class Rule
 */
var Rule = new JS.Class('Ojay.Keyboard.Rule', {
    /**
     * @param {HTMLElement} node
     * @param {String|Array} keylist
     * @param {Function} callback
     * @param {Object} scope
     */
    initialize: function(node, keylist, callback, scope) {
        var args = Array.from(arguments);
        node = Ojay(node).node;
        if (!node) {
            node     = document;
            keylist  = args.shift();
            callback = args.shift();
            scope    = args.shift();
        }
        if (scope) callback = callback.bind(scope);
        this._codes = codesFromKeys(keylist);
        this._listener = new KeyListener(node, hashFromCodes(this._codes), callback);
    },
    
    /**
     * <p>Makes the rule active.</p>
     * @returns {Rule}
     */
    enable: function() {
        this._active = true;
        this._listener.enable();
        this._prevents_default && Disabler._register(this);
        return this;
    },
    
    /**
     * <p>Makes the rule inactive.</p>
     * @returns {Rule}
     */
    disable: function() {
        this._active = false;
        this._listener.disable();
        this._prevents_default && Disabler._unregister(this);
        return this;
    },
    
    /**
     * <p>Causes the rule to prevent the browser's default behaviour.</p>
     * @returns {Rule}
     */
    preventDefault: function() {
        this._prevents_default = true;
        this._active && Disabler._register(this);
        return this;
    },
    
    /**
     * <p>Causes the rule to allow the browser's default behaviour.</p>
     * @returns {Rule}
     */
    allowDefault: function() {
        this._prevents_default = false;
        this._active && Disabler._unregister(this);
        return this;
    },
    
    /**
     * <p>Returns a string that represents the set of key codes the rule applies to.</p>
     * @returns {String}
     */
    getSignature: function() {
        var sig = signature(this._codes);
        this.getSignature = function() { return sig; };
        return sig;
    }
});

/**
 * <p>The <tt>RuleSet</tt> class is used to set up contexts in which key combinations are mapped
 * to actions. These contexts can be activated and deactivated easily to modify the behaviour of
 * the keyboard. This class is publicly accessible. An example:</p>
 *
 * <pre><code>    var rules = new Ojay.Keyboard.RuleSet({
 *         'UP':            function() { console.log('up'); },
 *         'CONTROL DOWN':  function() { console.log('down'); },
 *         'ALT SHIFT K':   function() { console.log('weird') }
 *     });</code></pre>
 *
 * @constructor
 * @public
 * @class RuleSet
 */
Keyboard.RuleSet = new JS.Class('Ojay.Keyboard.RuleSet', {
    /**
     * @param {HTMLElement} node
     * @param {Object} definitions
     */
    initialize: function(node, definitions) {
        var args = Array.from(arguments);
        node = Ojay(node).node;
        if (!node) {
            node        = document;
            definitions = args.shift();
        }
        this._node = node;
        this._rules = {};
        var keylist, rule;
        for (keylist in definitions) {
            rule = new Rule(node, keylist, definitions[keylist]);
            // Store rules by signature to prevent duplicate key combinations
            this._rules[rule.getSignature()] = rule;
        }
    },
    
    /**
     * <p>Calls the given function with each rule in the set in turn.</p>
     * @param {Function} block
     * @param {Object} context
     */
    forEach: function(block, context) {
        block = Function.from(block);
        for (var signature in this._rules)
            block.call(context || null, this._rules[signature]);
    },
    
    /**
     * <p>Enables the set of rules.</p>
     * @returns {Keyboard.RuleSet}
     */
    enable: function() {
        this.forEach('enable');
        return this;
    },
    
    /**
     * <p>Disables the set of rules.</p>
     * @returns {Keyboard.RuleSet}
     */
    disable: function() {
        this.forEach('disable');
        return this;
    },
    
    /**
     * @param {String} keys
     * @returns {Rule}
     */
    get: function(keys) {
        return this._rules[signature(codesFromKeys(keys))] || null;
    },
    
    /**
     * @param {RuleSet} ruleSet
     * @returns {RuleSet}
     */
    merge: function(ruleSet) {
        var rules = {},
            addRule = function(rule) { rules[rule.getSignature()] = rule; };
        
        [this, ruleSet].forEach({forEach: addRule});
        var set = new this.klass({});
        set._rules = rules;
        return set;
    }
});


/**
 * <p>The <tt>Monitor</tt> is a private component used by the Keyboard package to track
 * the current combination of pressed keys. Event handlers notify this object with keys
 * to add and remove from the list. This object may be consulted to find out whether
 * a particular key code is pressed.</p>
 */
var Monitor = new JS.Singleton('Ojay.Keyboard.Monitor', {
    _list: [],
    
    /**
     * <p>Adds a key code to the list.</p>
     * @param {Number} key
     */
    _addKey: function(key) {
        if (!this._isPressed(key)) this._list.push(key);
    },
    
    /**
     * <p>Removes a key code from the list.</p>
     * @param {Number} key
     */
    _removeKey: function(key) {
        this._list = this._list.filter(function(x) { return x != key; });
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the given key code is currently pressed.</p>
     * @param {Number} key
     * @returns {Boolean}
     */
    _isPressed: function(key) {
        return this._list.indexOf(key) != -1;
    },
    
    /**
     * <p>Returns a string uniquely identifying the current set of pressed keys.</p>
     * @returns {String}
     */
    getSignature: function() {
        return signature(this._list);
    }
});


/**
 * <p>The <tt>Disabler</tt> is in charge of deciding whether to prevent the default browser
 * behaviour for a given set of keys. Keyboard rules register with this object to cause
 * their behaviour to override the default behaviour. Some browsers do not allow certain
 * key comibnations to be overridden, so choose your key combinations carefully.</p>
 */
var Disabler = new JS.Singleton('Ojay.Keyboard.Disabler', {
    _rules: [],
    
    /**
     * <p>Adds a <tt>Rule</tt> to the list.</p>
     * @param {Rule} rule
     */
    _register: function(rule) {
        this._rules.push(rule);
    },
    
    /**
     * <p>Removes a <tt>Rule</tt> from the list.</p>
     * @param {Rule} rule
     */
    _unregister: function(rule) {
        this._rules = this._rules.filter(function(x) { return x != rule; });
    },
    
    /**
     * <p>Given an event and the current key signature, decides whether to prevent the
     * default reaction to the event.</p>
     * @param {Event} evnt
     * @param {String} signature
     */
    _processEvent: function(evnt, signature) {
        if (this._recognizesSignature(signature))
            Event.preventDefault(evnt);
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the current list of rules contains any rule whose
     * key combination matches the given signature.</p>
     * @param {String} signature
     * @returns {Boolean}
     */
    _recognizesSignature: function(signature) {
        for (var i = 0, n = this._rules.length; i < n; i++) {
            if (this._rules[i].getSignature() == signature)
                return true;
        }
        return false;
    }
});


/**
 * <p>On keydown events, add the new key to the <tt>Monitor</tt> and decide whether
 * to stop the event in IE browsers.</p>
 */
Event.on(doc, 'keydown', function(evnt) {
    Monitor._addKey(evnt.keyCode);
    if (YAHOO.env.ua.ie)
        Disabler._processEvent(evnt, Monitor.getSignature());
});

/**
 * <p>On keypress events, decide whether to stop the event in non-IE browsers.</p>
 */
if (!YAHOO.env.ua.ie) {
    Event.on(doc, 'keypress', function(evnt) {
        Disabler._processEvent(evnt, Monitor.getSignature());
    });
}

/**
 * <p>On keyup events, remove the key from the <tt>Monitor</tt>.</p>
 */
Event.on(doc, 'keyup', function(evnt) {
    Monitor._removeKey(evnt.keyCode);
});


})(YAHOO.util.KeyListener, YAHOO.util.Event, document);


/**
 * @overview
 * <p>The <tt>Mouse</tt> module, when included in a web page, automatically keeps track
 * of the current mouse position by listening to the document's <tt>mousemove</tt> event. You
 * can grab the current mouse position from anywhere in your code by checking the <tt>left</tt> and
 * <tt>top</tt> properties of <tt>Ojay.Mouse.position</tt>.</p>
 *
 * <p>You can also use <tt>Mouse</tt> to listen for <tt>mouseenter</tt> and <tt>mouseleave</tt>
 * events, which are like <tt>mouseover</tt> and <tt>mouseout</tt> except without the problems
 * caused by missed events and nested elements. When <tt>Mouse</tt> is present on a page,
 * you can register event listeners as follows:</p>
 *
 * <pre><code>    Ojay('p').on('mouseenter', function(element, position) {
 *         // respond to event
 *     }, scope);</code></pre>
 *
 * <p>Within your callback function, <tt>element</tt> refers to the element the mouse entered,
 * and <tt>position</tt> is an object whose <tt>left</tt> and <tt>top</tt> properties represent
 * the position of the mouse at the time of the event. The optional <tt>scope</tt> argument sets
 * the meaning of <tt>this</tt> inside your callback.</p>
 *
 * <p>More generally, you can subscribe to all mouse movement as follows:</p>
 *
 * <pre><code>    Ojay.Mouse.subscribe(function(position) {
 *         // respond to mouse movement with
 *         // position.left and position.top
 *     }, scope);</code></pre>
 *
 * <p>Your callback is fired every time the mouse moves, and it is given the mouse position in
 * the <tt>position</tt> argument. Again, use <tt>scope</tt> to set the meaning of <tt>this</tt>
 * inside the callback.</p>
 */
Ojay.Mouse = new JS.Singleton('Ojay.Mouse', /** @scope Ojay.Mouse */{
    include: JS.Observable,
    
    initialize: function() {
        this.position = {left: null, top: null};
    },
    
    /**
     * <p>Callback used to respond to mousemove events. Calls <tt>notifyObservers</tt> with
     * the current mouse position.</p>
     * @param {Event} e
     */
    updatePosition: function(doc, e) {
        var xy = YAHOO.util.Event.getXY(e);
        this.position = {left: xy[0], top: xy[1]};
        this.notifyObservers(this.position);
    },
    
    /**
     * <p>Provides support for detecting events when the mouse pointer enters or leaves an
     * element, in a way that doesn't cause the problems of mouseover/mouseout. Firstly, the
     * mouse pointer is monitored across the whole document, so you've less chance of missing
     * a mouseout event due to fast movement. Second, this function will not fire a mouse-out
     * event if you mouse over an element nested inside the element you're listening to.</p>
     *
     * @param {String} movement Either 'entering' or 'leaving'
     * @param {Region|HTMLElement|String} element The element to watch for mouse events
     * @param {Function} callback A function to fire
     * @param {Object} scope The scope in which to fire the callback (optional)
     */
    on: function(movement, element, callback, scope) {
        if (!/^(?:entering|leaving)$/.test(movement))
            throw new TypeError('Movement is not recognised');
        
        var isRegion    = (element instanceof Ojay.Region);
        var region      = isRegion ? element : null;
        var element     = isRegion ? null: Ojay(element);
        var wasInside   = false;
        this.addObserver(function(position) {
            var currentRegion = region || element.getRegion();
            var isInside = this.isInside(currentRegion);
            if (movement == 'entering' && !wasInside && isInside)
                callback.call(scope || null, this.position);
            if (movement == 'leaving' && wasInside && !isInside)
                callback.call(scope || null, this.position);
            wasInside = isInside;
        }, this);
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the mouse pointer is currently inside the given region or
     * element. <tt>region</tt> can be an HTML element reference or a CSS selector, in which
     * case the test region will be the area of the first element that matches the selector.
     * Returns <tt>undefined</tt> if no region can be found.</p>
     * @param {Region|HTMLElement|String} region
     * @returns {Boolean}
     */
    isInside: function(region) {
        region = Ojay.Region.convert(region);
        if (!region) return undefined;
        var pos = this.position;
        return pos.left >= region.left && pos.left <= region.right &&
                pos.top >= region.top && pos.top <= region.bottom;
    }
});

Ojay(document).on('mousemove', Ojay.Mouse.method('updatePosition'));

/**
 * <p><tt>DomCollection#on</tt> is wrapped to provide <tt>mouseenter</tt> and <tt>mouseleave</tt>
 * event detection support.</p>
 */
Ojay.DomCollection.include({on: Ojay.DomCollection.prototype.on.wrap(function() {
    var args = Array.from(arguments), original = args.shift();
    var eventName = args[0], callback = args[1], scope = args[2];
    
    if (!/^mouse(enter|leave)$/.test(eventName))
        return original(eventName, callback, scope);
        
    var type = eventName.match(/^mouse(enter|leave)$/)[1].replace(/e?$/, 'ing');
    var collector = new JS.MethodChain();
    if (callback && typeof callback != 'function') scope = callback;
    
    this.forEach(function(element) {
        Ojay.Mouse.on(type, element, function(position) {
            if (typeof callback == 'function') callback.call(scope || null, element, position);
            collector.fire(scope || element);
        });
    });
    
    return collector;
})});


(function(Ojay) {
/**
 * <p>Returns a function that performs the given method while an overlay is hidden. Use
 * this to generate methods that require the overlay to be visible that can be run while
 * keeping an overlay hidden. The generated method will briefly show the overlay in order
 * to perform the method before hiding it again, and you should not see the overlay appear
 * in most situations.</p>
 * @private
 * @param {String} method
 * @returns {Function}
 */
var whileHidden = function(method) {
    return function() {
        var container = this._elements._container;
        container.setStyle({visibility: 'hidden'});
        this.show('none', {silent: true})[method]().hide('none', {silent: true});
        container.setStyle({visibility: ''});
        return this;
    };
};


/**
 * <p>The <tt>Overlay</tt> class is used to encapsulate the process of positioning a
 * container element on top of the rest of the document and allowing it to be positioned
 * and sized to order. The class provides a number of transition effects for showing and
 * hiding overlay elements, which you can use if you include <tt>YAHOO.util.Anim</tt> in
 * your pages.</p>
 *
 * <p>This class is unlikely to be directly useful to you in building pages, but it provides
 * a base class that other overlay types inherit from. It provides all the positioning,
 * sizing, layering, showing and hiding functionality useful for implementing any kind of
 * overlay behaviour. The set of classes implemented by Ojay is:</p>
 *
 * <pre>
 *                          ===============
 *                          ||  Overlay  ||
 *                          ===============
 *                                 |
 *                    --------------------------
 *                    |                        |
 *          ======================      ================
 *          ||  ContentOverlay  ||      ||  PageMask  ||
 *          ======================      ================
 *                    |
 *             ===============
 *             ||  Tooltip  ||
 *             ===============
 * </pre>
 *
 * <p>To create an overlay, simply call its contructor with a set of initialization options.
 * These options include (all sizing and position is in pixels):</p>
 *
 * <ul>
 *      <li><tt>left</tt>: the initial left position</li>
 *      <li><tt>top</tt>: the initial top position</li>
 *      <li><tt>width</tt>: the initial element width</li>
 *      <li><tt>height</tt>: the initial element height</li>
 *      <li><tt>layer</tt>: the initial layer (z-index)</li>
 *      <li><tt>opacity</tt>: the initial opacity (between 0 and 1 inclusive)</li>
 *      <li><tt>className</tt>: space-separated list of classes to give to the overlay element</li>
 * </ul>
 *
 * <p>All these options are optional - you can omit any of them and default values will be
 * applied. An example creation might look like:</p>
 *
 * <pre><code>    var overlay = new Ojay.Overlay({
 *         width:  600,
 *         height: 300,
 *         className: 'my-overlay panel'
 *     });</code></pre>
 *
 * <p>Which would insert the following elements at the top of the <tt>body</tt> element:</p>
 *
 * <pre><code>    &ltdiv class="overlay-container my-overlay panel"&gt;&lt/div&gt;</code></pre>
 *
 * <p>This new <tt>div</tt> will be absolutely positioned and sized according to the setup
 * options you specified. You can get a reference to it by calling <tt>overlay.getContainer()</tt>:</p>
 *
 * <pre><code>    overlay.getContainer().on('click', function() { ... });</code></pre>
 *
 * <p>See the method definitions in the class below for further API documentation.</p>
 *
 * @constructor
 * @class Overlay
 */
Ojay.Overlay = new JS.Class('Ojay.Overlay', /** @scope Ojay.Overlay.prototype */{
    include: [JS.State, Ojay.Observable],
    
    extend: /** @scope Ojay.Overlay */{
        BASE_LAYER:         1000,
        MINIMUM_OFFSET:     20,
        DEFAULT_SIZE:       {width: 400, height: 300},
        DEFAULT_POSITION:   {left: 50, top: 50},
        DEFAULT_OPACITY:    1,
        CONTAINER_CLASS:    'overlay-container',
        TRANSITION_TIME:    0.4,
        EASING:             'easeOutStrong',
        
        /**
         * <p>The <tt>Overlay.Transitions</tt> object stores transition effects used to hide and
         * show overlay instances. This allows new effects to be added without needing to modify
         * <tt>Overlay</tt> source code. To register new transitions, you need to implement a
         * <tt>show()</tt> and a <tt>hide()</tt> method, each of which must accept an <tt>Overlay</tt>
         * object and a <tt>MethodChain</tt> to allow code to be asynchronously chained after
         * the effect has run. You must decide when to fire the chain, and your methods must
         * return either the chain or the overlay. You will usually return the chain if your
         * transition involves animation. The basic pattern is thus:</p>
         *
         * <pre><code>    Ojay.Overlay.Transitions.add('myeffect', {
         *         show: function(overlay, chain) {
         *             // ...
         *             return chain;
         *         },
         *         hide: function(overlay, chain) {
         *             // ...
         *             return chain;
         *         }
         *     });</code></pre>
         *
         * <p>You will then be able to use this effect to show and hide overlays:</p>
         *
         * <pre><code>    overlay.show('myeffect');</code></pre>
         *
         * <p>See the transitions that ship with Ojay for some example implementations.</p>
         *
         * @class Overlay.Transitions
         */
        Transitions: new JS.Singleton('Ojay.Overlay.Transitions', /** @scope Ojay.Overlay.Transitions */{
            _store: {},
            
            /**
             * <p>The interface used to test registered transitions.</p>
             */
            INTERFACE: new JS.Interface(['hide', 'show']),
            
            /**
             * <p>A stub transition returned if none can be found for a given name.</p>
             */
            _stub: {
                hide: function(overlay) { return overlay; },
                show: function(overlay) { return overlay; }
            },
            
            /**
             * <p>Adds a new transition object to the set of registered transitions.</p>
             * @param {String} name
             * @param {Object} transitions Must implement Ojay.Overlay.Transitions.INTERFACE
             * @returns {Transitions}
             */
            add: function(name, transitions) {
                JS.Interface.ensure(transitions, this.INTERFACE);
                this._store[name] = transitions;
                return this;
            },
            
            /**
             * <p>Returns the transition object with the given name.</p>
             * @param {String} name
             * @returns {Object} Implements Ojay.Overlay.Transitions.INTERFACE
             */
            get: function(name) {
                return this._store[name] || this._stub;
            }
        }),
        
        /**
         * <p>Returns the layer (z-index) of the given object. Can accept <tt>Overlay</tt>
         * objects and <tt>HTMLElement</tt>/<tt>DomCollection</tt> objects, and anything
         * with a <tt>getLayer()</tt> method.</p>
         * @param {Object} object
         * @returns {Number}
         */
        getLayer: function(object) {
            if (object.getLayer) return Number(object.getLayer());
            if (object.nodeType == Ojay.HTML.ELEMENT_NODE || typeof object == 'string') object = Ojay(object);
            if (object.getStyle) return Number(object.getStyle('zIndex')) || 0;
            return 0;
        }
    },
    
    /**
     * @param {Object} options
     */
    initialize: function(options) {
        this._elements = {};
        options = this._options = options || {};
        Ojay(document.body).insert(this.getHTML().node, 'top');
        this.setState('INVISIBLE');
        this.setSize(options.width, options.height);
        this.setPosition(options.left, options.top);
        this.setLayer(options.layer);
        this.setOpacity(options.opacity);
    },
    
    /**
     * <tp>Returns a <tt>DomCollection</tt> wrapping the HTML elements for the overlay.</p>
     * @returns {DomCollection}
     */
    getHTML: function() {
        var self = this, elements = self._elements;
        if (elements._container) return elements._container;
        var container = Ojay( Ojay.HTML.div({className: this.klass.CONTAINER_CLASS}) );
        container.setStyle({position: 'absolute', overflow: 'hidden'}).hide();
        container.setStyle({padding: '0 0 0 0', border: 'none'});
        (this._options.className || '').trim().split(/\s+/).forEach(container.method('addClass'));
        return elements._container = container;
    },
    
    /**
     * <p>Returns a <tt>DomCollection</tt> wrapping the overlay's container element.
     * Effectively an alias for <tt>getHTML()</tt>.</p>
     * @returns {DomCollection}
     */
    getContainer: function() {
        return this._elements._container;
    },
    
    /**
     * <p>Sets the position of the overlay, measured in pixels from the top-left corner
     * of the document. Positioning is absolute rather than fixed.</p>
     * @param {Number|String} left
     * @param {Number|String} top
     * @returns {Overlay}
     */
    setPosition: function(left, top) {
        if (this.inState('CLOSED')) return this;
        var defaults = this.klass.DEFAULT_POSITION;
        left = this._addUnits(left === undefined ? defaults.left : left);
        top = this._addUnits(top === undefined ? defaults.top : top);
        this._position = {left: left, top: top};
        if (this.inState('VISIBLE'))
            this._elements._container.setStyle(this._position);
        return this;
    },
    
    /**
     * <p>Returns the current position of the overlay as an object with <tt>left</tt> and
     * <tt>top</tt> fields. If the <tt>strings</tt> flag is passed <tt>true</tt>, the positions
     * are returned as strings containing units, otherwise they are returned as numbers with
     * the units implcitly being pixels.</p>
     * @param {Boolean} strings
     * @returns {Object}
     */
    getPosition: function(strings) {
        var pos = this._position, left = pos.left, top = pos.top;
        return strings
                ? {left: left, top: top}
                : {left: parseInt(left), top: parseInt(top)};
    },
    
    /**
     * <p>Sets the size of the overlay element in pixels. You may also use strings to specify
     * the dimensions if you want to use units other than pixels, e.g. '67em'.</p>
     * @param {Number|String} width
     * @param {Number|String} height
     * @returns {Overlay}
     */
    setSize: function(width, height) {
        if (this.inState('CLOSED')) return this;
        var defaults = this.klass.DEFAULT_SIZE;
        width = this._addUnits(width === undefined ? defaults.width : width);
        height = this._addUnits(height === undefined ? defaults.height : height);
        this._dimensions = {width: width, height: height};
        if (this.inState('VISIBLE'))
            this._elements._container.setStyle(this._dimensions);
        return this;
    },
    
    /**
     * <p>Returns the current size of the overlay as an object with <tt>width</tt> and
     * <tt>height</tt> fields. If the <tt>strings</tt> flag is passed <tt>true</tt>, the dimensions
     * are returned as strings containing units, otherwise they are returned as numbers with
     * the units implcitly being pixels.</p>
     * @param {Boolean} strings
     * @returns {Object}
     */
    getSize: function(strings) {
        var size = this._dimensions, width = size.width, height = size.height;
        return strings
                ? {width: width, height: height}
                : {width: parseInt(width), height: parseInt(height)};
    },
    
    /**
     * <p>Returns an <tt>Ojay.Region</tt> instance representing the area occupied by the overlay.</p>
     * @returns {Region}
     */
    getRegion: function() {
        return !this.inState('INVISIBLE', 'CLOSED')
                ? this._elements._container.getRegion()
                : undefined;
    },
    
    /**
     * <p>Sets the opacity of the overlay as a number from 0 to 1 inclusive.</p>
     * @param {Number} opacity
     * @returns {PageMask}
     */
    setOpacity: function(opacity) {
        this._opacity = (opacity === undefined)
                ? this.klass.DEFAULT_OPACITY
                : Number(opacity);
        if (this._opacity > 1) this._opacity /= 100;
        if (this.inState('VISIBLE'))
            this._elements._container.setStyle({opacity: this._opacity});
        return this;
    },
    
    /**
     * <p>Returns the current opacity of the overlay, a number between 0 and 1 inclusive.</p>
     * @returns {Number}
     */
    getOpacity: function() {
        return this._opacity;
    },
    
    /**
     * <p>Positions the receiving overlay behind the passed parameter by setting the receiving
     * overlay's z-index.</p>
     * @param {Overlay} overlay
     * @returns {Overlay}
     */
    positionBehind: function(overlay) {
        return this.setLayer(this.klass.getLayer(overlay) - 1);
    },
    
    /**
     * <p>Positions the receiving overlay in front of the passed parameter by setting the receiving
     * overlay's z-index.</p>
     * @param {Overlay} overlay
     * @returns {Overlay}
     */
    positionInFront: function(overlay) {
        return this.setLayer(this.klass.getLayer(overlay) + 1);
    },
    
    /**
     * <p>Sets the layer (z-index) of the overlay to the given value.</p>
     * @param {Number} index
     * @returns {Overlay}
     */
    setLayer: function(index) {
        if (this.inState('CLOSED')) return this;
        this._layer = (index === undefined) ? this.klass.BASE_LAYER : Number(index);
        this._elements._container.setStyle({zIndex: this._layer});
        return this;
    },
    
    /**
     * <p>Returns the current layer (z-index) of the overlay.</p>
     * @returns {Number}
     */
    getLayer: function() {
        return this._layer;
    },
    
    states: /** @scope Ojay.Overlay.prototype */{
        
        /**
         * <p>An overlay is in the INVISIBLE state when it is present in the document
         * but is not visible.</p>
         */
        INVISIBLE: /** @scope Ojay.Overlay.prototype */{
            /**
             * <p>Centers the overlay within the viewport.</p>
             * @returns {Overlay}
             */
            center: whileHidden('center'),
            
            /**
             * <p>Shows the overlay using the given transition. Returns a <tt>MethodChain</tt>
             * object so you can chain code to run after the transition finishes. The root of
             * this chain is the receiving overlay instance.</p>
             * @param {String} transition
             * @param {Object} options
             * @returns {Overlay|MethodChain}
             */
            show: function(transition, options) {
                this.setState('SHOWING');
                transition = this.klass.Transitions.get(transition || 'none');
                var chain = new JS.MethodChain()._(this).setState('VISIBLE');
                if ((options||{}).silent !== true) chain._(this).notifyObservers('show');
                chain._(this);
                return transition.show(this, chain);
            },
            
            /**
             * <p>'Closes' the overlay by removing it from the document.</p>
             * @param {Object} options
             * @returns {Overlay}
             */
            close: function(options) {
                this._elements._container.remove();
                this.setState('CLOSED');
                if ((options||{}).silent !== true) this.notifyObservers('close');
                return this;
            }
        },
        
        /**
         * <p>An overlay is in the SHOWING state when it is transitioning between
         * INVISIBLE and VISIBLE.</p>
         */
        SHOWING: /** @scope Ojay.Overlay.prototype */{},
        
        /**
         * <p>An overlay is in the VISIBLE state when it is present in the document
         * and visible.</p>
         */
        VISIBLE: /** @scope Ojay.Overlay.prototype */{
            /**
             * <p>Centers the overlay within the viewport.</p>
             * @returns {Overlay}
             */
            center: function() {
                var region = this.getRegion(), screen = Ojay.getVisibleRegion(),
                    left = screen.left + (screen.getWidth() - region.getWidth()) / 2,
                    top = screen.top + (screen.getHeight() - region.getHeight()) / 2;
                if (left < this.klass.MINIMUM_OFFSET) left = this.klass.MINIMUM_OFFSET;
                if (top < this.klass.MINIMUM_OFFSET) top = this.klass.MINIMUM_OFFSET;
                return this.setPosition(left, top);
            },
            
            /**
             * <p>Hides the overlay using the named transition. Does not remove the overlay from
             * the document. Returns a <tt>MethodChain</tt> that will fire on the receiving
             * overlay instance on completion of the transition effect.</p>
             * @param {String} transition
             * @param {Object} options
             * @returns {Overlay|MethodChain}
             */
            hide: function(transition, options) {
                this.setState('HIDING');
                transition = this.klass.Transitions.get(transition || 'none');
                var chain = new JS.MethodChain()._(this).setState('INVISIBLE');
                if((options||{}).silent !== true) chain._(this).notifyObservers('hide');
                chain._(this);
                return transition.hide(this, chain);
            },
            
            /**
             * <p>Closes the overlay by hiding it using the named transition and removing it
             * from the document. Returns a <tt>MethodChain</tt> that will fire on the receiving
             * overlay instance on completion of the transition effect.</p>
             * @param {String} transition
             * @param {Object} options
             * @returns {MethodChain}
             */
            close: function(transition, options) {
                return this.hide(transition, options)._(this).close(options);
            },
            
            /**
             * <p>Resizes the overlay using an animation that can be controlled via an options
             * hash. You can specify the area to resize to using left, top, width, height params
             * individually, or using a region object. The method returns a <tt>MethodChain</tt>
             * that will fire on the receiving overlay once the animation has finished.</p>
             *
             * <p>Some examples:</p>
             *
             *      overlay.resize(50, 80, 100, 500);
             *      
             * <pre><code>    overlay.resize(Ojay.getVisibleRegion(), {
             *         duration:   4,
             *         easing:     'easeBoth'
             *     });</code></pre>
             *
             * @param {Number} left
             * @param {Number} top
             * @param {Number} width
             * @param {Number} height
             * @param {Object} options
             * @returns {MethodChain}
             */
            resize: function(left, top, width, height, options) {
                var region = left, options = options || {};
                if (typeof region == 'object') {
                    options = top || {};
                    left    = region.left;
                    top     = region.top;
                    width   = region.getWidth();
                    height  = region.getHeight();
                }
                this.setState('RESIZING');
                return this._elements._container.animate({
                    left:   {to:    left},
                    top:    {to:    top},
                    width:  {to:    width},
                    height: {to:    height}
                }, options.duration || this.klass.TRANSITION_TIME, {easing: options.easing || this.klass.EASING})
                ._(this).setSize(width, height)
                ._(this).setPosition(left, top)
                ._(this).setState('VISIBLE')._(this);
            }
        },
        
        /**
         * <p>An overlay is in the HIDING state when it is transitioning between
         * VISIBLE and INVISIBLE.</p>
         */
        HIDING: /** @scope Ojay.Overlay.prototype */{},
        
        /**
         * <p>An overlay is in the RESIZING state when it is in the process of being resized.</p>
         */
        RESIZING: /** @scope Ojay.Overlay.prototype */{},
        
        /**
         * <p>An overlay is in the CLOSED state when it has been removed from the document.
         * No further work can be done with the overlay once it is in this state.</p>
         */
        CLOSED: /** @scope Ojay.Overlay.prototype */{}
    },
    
    _addUnits: function(x) {
        return String(x).replace(/^(-?\d+(?:\.\d+)?)$/g, '$1px');
    }
});


/**
 * @overview
 * <p>This file defines a set of transition effects for hiding and showing overlay elements.
 * follow the pattern outlined below to implement your own custom transitions.</p>
 */
Ojay.Overlay.Transitions

.add('none', {
    hide: function(overlay, chain) {
        overlay.getContainer().hide();
        chain.fire();
        return overlay;
    },
    
    show: function(overlay, chain) {
        overlay.getContainer()
            .setStyle({opacity: overlay.getOpacity()})
            .setStyle(overlay.getSize(true))
            .setStyle(overlay.getPosition(true))
            .show();
        chain.fire();
        return overlay;
    }
})

.add('fade', {
    hide: function(overlay, chain) {
        overlay.getContainer()
            .animate({opacity: {to: 0}}, Ojay.Overlay.TRANSITION_TIME)
            .hide()
            ._(chain.toFunction());
        return chain;
    },
    
    show: function(overlay, chain) {
        overlay.getContainer()
            .setStyle({opacity: 0})
            .setStyle(overlay.getSize(true))
            .setStyle(overlay.getPosition(true))
            .show()
            .animate({opacity: {to: overlay.getOpacity()}}, Ojay.Overlay.TRANSITION_TIME)
            ._(chain.toFunction());
        return chain;
    }
})

.add('zoom', {
    hide: function(overlay, chain) {
        var region = overlay.getRegion().scale(0.5), center = region.getCenter();
        overlay.getContainer()
            .animate({
                opacity: {to: 0},
                left:   {to: region.left},      width:  {to: region.getWidth()},
                top:    {to: region.top},       height: {to: region.getHeight()}
            }, Ojay.Overlay.TRANSITION_TIME, {easing: Ojay.Overlay.EASING})
            .hide()
            ._(chain.toFunction());
        return chain;
    },
    
    show: function(overlay, chain) {
        var position = overlay.getPosition(), size = overlay.getSize();
        overlay.getContainer()
            .setStyle({
                opacity: 0,
                left: (position.left + size.width/4) + 'px',
                top: (position.top + size.height/4) + 'px',
                width: (size.width / 2) + 'px', height: (size.height / 2) + 'px'
            })
            .show()
            .animate({
                opacity: {to: overlay.getOpacity()},
                left:   {to: position.left},    width:  {to: size.width},
                top:    {to: position.top},     height: {to: size.height}
            }, Ojay.Overlay.TRANSITION_TIME, {easing: Ojay.Overlay.EASING})
            ._(chain.toFunction());
        return chain;
    }
});


/**
 * <p>The <tt>ContentOverlay</tt> class extends <tt>Overlay</tt> and provides the most generally
 * useful form of overlay. Much of its API it inherits from <tt>Overlay</tt>, but it provides a
 * few methods for dealing with changing the HTML content of an overlay. The markup generated by
 * the constructor is slightly different, as it contains an extra element for holding the content:</p>
 *
 * <pre><code>     &lt;div class="overlay-container"&gt;
 *         &lt;div class="overlay-content"&gt;
 *             &lt;!-- Content goes here -- &gt;
 *         &lt/div&gt;
 *     &lt;/div&gt;</code></pre>
 *
 * @constructor
 * @class ContentOverlay
 */
Ojay.ContentOverlay = new JS.Class('Ojay.ContentOverlay', Ojay.Overlay, /** @scope Ojay.ContentOverlay.prototype */{
    extend: /** @scope Ojay.ContentOverlay */{
        CONTENT_CLASS:      'overlay-content'
    },
    
    /**
     * <p>Initializes the overlay. Options are the same as for <tt>Overlay</tt> with one
     * addition: <tt>content</tt> specifies the initial HTML content of the overlay.</p>
     * @params {Object} options
     */
    initialize: function(options) {
        this.callSuper();
        this.setContent(this._options.content);
    },
    
    /**
     * <p>Returns a <tt>DomCollection</tt> wrapping the HTML elements for the overlay.</p>
     * @returns {DomCollection}
     */
    getHTML: function() {
        var self = this, elements = self._elements;
        if (elements._content) return elements._container;
        var container = this.callSuper().node, builder = new Ojay.HtmlBuilder(container);
        elements._content = Ojay( builder.div({className: self.klass.CONTENT_CLASS}) );
        return elements._container;
    },
    
    /**
     * <p>Sets the content of the overlay. May be a string or an <tt>HTMLElement</tt>.</p>
     * @param {String|HTMLElement} content
     * @returns {Overlay}
     */
    setContent: function(content) {
        if (this.inState('CLOSED')) return this;
        this._elements._content.setContent(content || '');
        return this;
    },
    
    /**
     * <p>Returns a reference to the content-holding element of the overlay, wrapped in
     * a <tt>DomCollection.</tt>
     * @returns {DomCollection}
     */
    getContentElement: function() {
        return this._elements._content;
    },
    
    /**
     * <p>Inserts new content into the overlay, using the same syntax as for
     * <tt>DomCollection#insert()</tt>.</p>
     * @param {String|HTMLElement} content
     * @param {String} position
     * @returns {Overlay}
     */
    insert: function(content, position) {
        if (this.inState('CLOSED')) return this;
        this._elements._content.insert(content, position);
        return this;
    },
    
    states: /** @scope Ojay.ContentOverlay.prototype */{
        
        /**
         * <p>An overlay is in the INVISIBLE state when it is present in the document
         * but is not visible.</p>
         */
        INVISIBLE: /** @scope Ojay.ContentOverlay.prototype */{
            /**
             * <p>Sets the size of the overlay to just contain its content.</p>
             * @returns {ContentOverlay}
             */
            fitToContent: whileHidden('fitToContent')
        },
        
        /**
         * <p>An overlay is in the VISIBLE state when it is present in the document
         * and visible.</p>
         */
        VISIBLE: /** @scope Ojay.ContentOverlay.prototype */{
            /**
             * <p>Sets the size of the overlay to just contain its content.</p>
             * @param {Object} options
             * @returns {ContentOverlay}
             */
            fitToContent: function(options) {
                var options     = options || {},
                    animate     = !!options.animate,
                    balance     = !!options.balance,
                    innerRegion = this._elements._content.getRegion(),
                    outerRegion = this.getRegion();
                
                if (balance) innerRegion.centerOn(outerRegion);
                
                if (animate) return this.resize(innerRegion, options);
                
                this.setSize(innerRegion.getWidth(), innerRegion.getHeight());
                this.setPosition(innerRegion.left, innerRegion.top);
                return this;
    }   }   }
});


/**
 * <p><tt>Tooltip</tt> is a subclass of <tt>ContentOverlay</tt> that provides overlays that
 * automatically follow the mouse pointer when visible. This class is very small and most
 * of its API comes from <tt>ContentOverlay</tt> and <tt>Overlay</tt> before it.</p>
 * @constructor
 * @class Tooltip
 */
Ojay.Tooltip = new JS.Class('Ojay.Tooltip', Ojay.ContentOverlay, /** @scope Ojay.Tooltip.prototype */{
    /**
     * <p>Initializes the tooltip. The constructor differs from that of its parent classes
     * in that you must pass in the text for the tooltip as the first argument, followed
     * by the options hash.</p>
     * @param {String} text
     * @param {Object} options
     */
    initialize: function(text, options) {
        this.callSuper(options);
        this._elements._container.addClass('tooltip');
        this.setContent(text);
        this.klass._instances.push(this);
    },
    
    extend: /** @scope Ojay.Tooltip */{
        /**
         * <p>Updates the position of all tooltips.</p>
         * @param {Document} doc
         * @param {Event} evnt
         */
        update: function(doc, evnt) {
            var xy = YAHOO.util.Event.getXY(evnt);
            this._instances.forEach(function(tooltip) {
                var region = tooltip.getRegion();
                width = region ? region.getWidth() : this.DEFAULT_WIDTH;
                tooltip.setPosition(xy[0] + this.MOUSE_OFFSET - width / 2, xy[1] + this.MOUSE_OFFSET);
            }, this);
        },
        
        /**
         * <p><tt>Tooltip</tt> maintains a list of all its instances in order to update
         * their positions.</p>
         */
        _instances: [],
        
        DEFAULT_WIDTH:      100,
        MOUSE_OFFSET:       20
    }
});

Ojay(document).on('mousemove', Ojay.Tooltip.method('update'));


/**
 * <p>The <tt>PageMask</tt> class is a subtype of <tt>Overlay</tt> that represents elements used
 * to obscure the rest of the document while an overlay is visible. This allows easy creation of
 * 'modal' windows and lightbox-style interfaces. The HTML generated is the same as for <tt>Overlay</tt>.
 * The main features added by <tt>PageMask</tt> are automatic sizing to fill the viewport, and
 * color control.</p>
 * @constructor
 * @class PageMask
 */
Ojay.PageMask = new JS.Class('Ojay.PageMask', Ojay.Overlay, /** @scope Ojay.PageMask.prototype */{
    extend: /** @scope Ojay.PageMask */{
        DEFAULT_COLOR:  '000000',
        DEFAULT_OPACITY:    0.5,
        
        _instances: [],
        
        /**
         *
         */
        resizeAll: function() {
            this._instances.forEach('setSize');
        }
    },
    
    /**
     * <p>Initializes the mask. Options are the same as for <tt>Overlay</tt>, with a single
     * addition: <tt>color</tt> sets the background color of the mask.</p>
     * @param {Object} options
     */
    initialize: function(options) {
        this.klass._instances.push(this);
        this.callSuper();
        this.setColor(this._options.color);
        if (!YAHOO.env.ua.ie)
            this._elements._container.setStyle({position: 'fixed'});
    },
    
    /**
     * <p><tt>PageMask</tt> overrides <tt>setPosition()</tt> so that the mask is always positioned
     * at the top-left corner of the screen. The overlay is position 'fixed' in supporting
     * user agents.</p>
     * @returns {PageMask}
     */
    setPosition: function() {
        return this.callSuper(0, 0);
    },
    
    /**
     * <p><tt>PageMask</tt> overrides <tt>setSize()</tt> so that the mask always completely covers
     * the visible area of the document.</p>
     * @returns {PageMask}
     */
    setSize: function() {
        if (!YAHOO.env.ua.ie) return this.callSuper('100%', '100%');
        var doc = Ojay(document.body).getRegion(), win = Ojay.getViewportSize();
        return this.callSuper(Math.max(doc.getWidth(), win.width), Math.max(doc.getHeight(), win.height));
    },
    
    /**
     * <p>Sets the background color of the mask. Can be three separate numbers from 0 to 255
     * (representing red, green and blue) or a single string representing all three as a hex
     * value.</p>
     * @param {String} color
     * @returns {PageMask}
     */
    setColor: function(color) {
        this._color = (arguments.length == 3)
                ?   Array.from(arguments).map(function(x) {
                        var part = Math.round(x % 256).toString(16);
                        return (part.length == 1 ? '0' : '') + part;
                    }).join('')
                : (color ? String(color).replace(/[^0-9a-f]/ig, '') : this.klass.DEFAULT_COLOR);
        this._elements._container.setStyle({backgroundColor: '#' + this._color});
        return this;
    },
    
    states: /** @scope Ojay.PageMask.prototype */{
        /**
         * <p>An overlay is in the INVISIBLE state when it is present in the document
         * but is not visible.</p>
         */
        INVISIBLE: /** @scope Ojay.PageMask.prototype */{
            /**
             * <p><tt>PageMask</tt> overrides <tt>INVISIBLE#show()</tt> to make sure the mask
             * is sized correctly before being made visible.</p>
             * @returns {MethodChain}
             */
            show: function() {
                this.setSize();
                return this.callSuper();
    }   }   }
});

if (YAHOO.env.ua.ie)
    Ojay(window).on('resize', Ojay.PageMask.method('resizeAll'));


})(Ojay);


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


/**
 * <p>The <tt>Tabs</tt> class is used to convert a list of document sections into a tabbed
 * interface. Each section should contain a heading or similar common element whose content
 * will be used as the text label for each tab.</p>
 *
 * <p>For example, the following starting markup:</p>
 *
 * <pre><code>    <div id="tabGroup">
 *         <div class="tab">
 *             <h3 class="toggle">J.G. Ballard</h3>
 *             <p>I believe in the power of the imagination to remake the
 *             world, to release the truth within us, to hold back the night...</p>
 *         </div>
 *         <div class="tab">
 *             <h3 class="toggle">Andrei Tarkovsky</h3>
 *             <p><q>We do not move in one direction, rather do we wander back and
 *             forth, turning now this way and now that. We go back on our own...</p>
 *         </div>
 *         <div class="tab">
 *             <h3 class="toggle">Philip K. Dick</h3>
 *             <p>I ask in my writing, What is real? Because unceasingly we
 *             are bombarded with pseudo-realities manufactured...</p>
 *         </div>
 *     </div></code></pre>
 *
 * <p>and the following script snippet:</p>
 *
 * <pre><code>    var tabs = Ojay.Tabs('#tabGroup .tab');
 *     tabs.setup();</code></pre>
 *
 * <p>the markup is transformed into:</p>
 *
 * <pre><code>    <ul class="toggles">
 *         <li class="toggle-1 first">J.G. Ballard</li>
 *         <li class="toggle-2">Andrei Tarkovsky</li>
 *         <li class="toggle-3 last">Philip K. Dick</li>
 *     </ul>
 *     <div id="tabGroup">
 *         <div class="tab">
 *             <p>I believe in the power of the imagination to remake the
 *             world, to release the truth within us, to hold back the night...</p>
 *         </div>
 *         <div class="tab">
 *             <p><q>We do not move in one direction, rather do we wander back and
 *             forth, turning now this way and now that. We go back on our own...</p>
 *         </div>
 *         <div class="tab">
 *             <p>I ask in my writing, What is real? Because unceasingly we
 *             are bombarded with pseudo-realities manufactured...</p>
 *         </div>
 *     </div></code></pre>
 *
 * @constructor
 * @class Tabs
 */
Ojay.Tabs = new JS.Class('Ojay.Tabs', /** @scope Ojay.Tabs.prototype */{
    include: [Ojay.Observable, JS.State],
      
    /**
     * <p>To initialize, <tt>Tabs</tt> requires a CSS selector to get the list of page
     * sections to convert to tabs, and optionally an options object. Available options
     * are:</p>
     *
     * <ul>
     *     <li><tt>toggleSelector</tt> - CSS selector used to get toggle elements
     *     <li><tt>togglesClass</tt> - class name added to the generated list of toggles
     *     <li><tt>togglesPosition</tt> - 'before' or 'after', position to insert toggles list
     *     <li><tt>switchTime</tt> - duration of tab switch animation in seconds
     * </ul>
     *
     * @param {String} tabs
     * @param {Object} options
     */
    initialize: function(tabs, options) {
        this._tabGroup = tabs;
        options  = options || {};
        
        options.toggleSelector  = options.toggleSelector  || this.klass.TOGGLE_SELECTOR;
        options.togglesClass    = options.togglesClass    || this.klass.TOGGLES_CLASS;
        options.switchTime      = options.switchTime      || this.klass.SWITCH_TIME;
        options.togglesPosition = options.togglesPosition || this.klass.INSERT_POSITION;
        this._options = options;
        
        this.setState('CREATED');
    },
    
    /**
     * @returns {Object}
     */
    getInitialState: function() {
        return {tab: 1};
    },
    
    /**
     * @param {Object} state
     * @param {Object} options
     * @returns {Tabs}
     */
    changeState: function(state, options) {
        if (state.tab !== undefined) this._handleSetPage(state.tab, options);
        return this;
    },
    
    states: {
        /**
         * <p>The <tt>Tabs</tt> instance is in the CREATED state until its <tt>setup()</tt>
         * method is called.</p>
         */
        CREATED: /** @scope Ojay.Tabs.prototype */{
            /**
             * <p>Sets up all the DOM changes the <tt>Tabs</tt> object needs. If you want to history
             * manage the object, make sure you set up history management before calling this method.
             * Moves the object to the READY state if successful.</p>
             * @returns {Tabs}
             */
            setup: function() {
                this._tabGroup  = Ojay(this._tabGroup);
                this._container = this._tabGroup.parents().at(0);
                
                this._makeToggles();
                this._makeViews();
                this._restoreState();
                
                return this;
            },
            
            /**
             * <p>Insert the toggle control group before or after the tabs' containing
             * element.</p>
             */
            _makeToggles: function() {
                this._toggles = [];
                var self = this, options = self._options;
                
                var toggles = Ojay( Ojay.HTML.ul({className: options.togglesClass}, function (HTML) {
                    self._tabGroup.children(options.toggleSelector).forEach(function(header, i) {
                        var toggle = Ojay( HTML.li() ).addClass('toggle-' + (i+1));
                        toggle.setContent(header.node.innerHTML);
                        if (i === 0) toggle.addClass('first');
                        if (i === self._tabGroup.length - 1) toggle.addClass('last');
                        self._toggles.push(toggle);
                        header.remove();
                        toggle.on('click')._(self).setPage(i+1);
                    });
                }) );
                
                if (typeof this._options.width != 'undefined')
                    toggles.setStyle({width: this._options.width});
                
                this._tabGroup.parents().at(0).insert(toggles, this._options.togglesPosition);
            },
            
            _makeViews: function() {
                var self = this, options = self._options;
                
                this._tabs = this._tabGroup.map(function(container) {
                    return new this.klass.Tab(this, container);
                }, this);
                
                if (options.width && options.height)
                    this._container.setStyle({height: options.height});
            },
            
            _restoreState: function() {
                this.setState('READY');
                var state = this.getInitialState();
                this._handleSetPage(state.tab);
                
                this.on('pagechange', function(tabs, page) {
                    tabs._highlightToggle(page - 1);
                });
            }
        },
        
        /**
         * <p>The <tt>Tabs</tt> object is in the READY state when all its DOM behaviour has been
         * set up and it is not in the process of switching tabs.</p>
         */
        READY: /** @scope Ojay.Tabs.prototype */{
            /**
             * <p>Switches the set of tabs to the given page (indexed from 1), inserting
             * history entry. Passing in the <tt>silent</tt> option will stop the
             * <tt>pagechange</tt> event from being published.</p>
             * @param {Number} page
             * @param {Object} options
             * @returns {Tabs}
             */
            setPage: function(page, options) {
                this.changeState({tab: page}, options);
                return this;
            },
            
            /**
             * <p>Switch to the tab with the index provided as the first argument.</p>
             * @param {Number} index
             * @param {Object} options
             */
            _handleSetPage: function(index, options) {
                index -= 1;
                
                if (index >= this._tabs.length) index = 0;
                if (this._currentTab == index) return;
                
                if ((options || {}).silent !== false) this.notifyObservers('pagechange', index+1);
                
                if (typeof this._currentTab == 'undefined') {
                    this._currentTab = index;
                    this._tabs[index].show();
                    this._highlightToggle(index);
                } else {
                    this.setState('ANIMATING');
                    this._tabs[this._currentTab].hide()._(function(self) {
                        self._currentTab = index;
                        self._tabs[index].show()
                        ._(self).setState('READY');
                    }, this);
                }
            },
            
            /**
             * <p>Sets the 'selected' class on the appropriate toggle.</p>
             * @param {Number} index
             */
            _highlightToggle: function(index) {
                this._toggles.forEach({removeClass: 'selected'});
                this._toggles[index].addClass('selected');
            }
        },
        
        /**
         * <p>The <tt>Tabs</tt> instance is in the ANIMATING state during tab transitions.</p>
         */
        ANIMATING: /** @scope Ojay.Tabs.prototype */{}
    },
    
    extend: /** @scope Ojay.Tabs */{
        TOGGLE_SELECTOR:  '.toggle',
        TOGGLES_CLASS:    'toggles',
        SWITCH_TIME:      0.2,
        INSERT_POSITION:  'before',
        
        /**
         * @constructor
         * @class Tab
         */
        Tab: new JS.Class('Ojay.Tabs.Tab', /** @scope Ojay.Tabs.Tab.prototype */{
            /**
             * @param {Ojay.Tab} group
             * @param {HTMLElement} container
             */
            initialize: function(group, container) {
                this._container = container, this._group = group;
                
                this._container.hide().setStyle({opacity: 0});
                
                if (this._group._options.height)
                    this._container.setStyle({position: 'absolute', top: 0, left: 0});
            },
            
            /**
             * @returns {JS.MethodChain}
             */
            hide: function() {
                return this._container.animate({opacity: {to: 0}},
                        this._group._options.switchTime)
                        .hide()
                        ._(this);
            },
            
            /**
             * @returns {JS.MethodChain}
             */
            show: function() {
                return this._container.show().animate({opacity: {to: 1}},
                        this._group._options.switchTime)
                        ._(this);
            }
        })
    }
});


/**
 * @class AjaxTabs
 * @constructor
 */
Ojay.AjaxTabs = new JS.Class('Ojay.AjaxTabs', Ojay.Tabs, /** @scope Ojay.AjaxTabs.prototype */{
    
    /**
     * <p><tt>AjaxTabs</tt> takes slightly different initialization data to <tt>Tabs</tt>.
     * This class requires two compulsory arguments. The first is a list of link elements
     * (or a CSS selector for same); these links will become the toggles for the tab group.
     * The second is an element into which to insert the content retrieved by the Ajax
     * requests.</p>
     * @param {String|DomCollection} links
     * @param {String|DomCollection} container
     * @param {Object} options
     */
    initialize: function(links, container, options) {
        this.callSuper(links, options);
        this._container = container;
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the given page is already loaded.</p>
     * @param {Number} index
     * @returns {Boolean}
     */
    pageLoaded: function(index) {
        return !!this._loaded[index - 1];
    },
    
    /**
     * <p>Tells the <tt>AjaxTabs</tt> to load the content for the given page, if
     * the content is not already loaded. Fires <tt>pagerequest</tt> and
     * <tt>pageload</tt> events.</p>
     * @param {Number} page
     * @param {Function} callback
     * @param {Object} scope
     * @returns {AjaxTabs}
     */
    loadPage: function(page, callback, scope) {
        if (this.pageLoaded(page) || this.inState('CREATED')) return this;
        var url = this._links[page - 1].href, self = this;
        this.notifyObservers('pagerequest', url);
        Ojay.HTTP.GET(url, {}, {
            onSuccess: function(response) {
                response.insertInto(self._tabGroup[page - 1]);
                self._loaded[page - 1] = true;
                self.notifyObservers('pageload', url, response);
                if (typeof callback == 'function') callback.call(scope || null);
            }
        });
        return this;
    },
    
    states: {
        CREATED: {
            /**
             * <p>Sets up all the DOM changes the <tt>Tabs</tt> object needs. If you want to history
             * manage the object, make sure you set up history management before calling this method.
             * Moves the object to the READY state if successful.</p>
             * @returns {Tabs}
             */
            setup: function() {
                this._links = Ojay(this._tabGroup);
                this._loaded = this._links.map(function() { return false; });
                this._container = Ojay(this._container);
                
                this._makeToggles();
                this._makeViews();
                this._restoreState();
                
                return this;
            },
            
            /**
             * <p>Sets up the links as toggles to control tab visibility.</p>
             */
            _makeToggles: function() {
                this._toggles = [];
                this._links.forEach(function(link, i) {
                    link.addClass('toggle-' + (i+1));
                    if (i === 0) link.addClass('first');
                    if (i === this._links.length - 1) link.addClass('last');
                    this._toggles.push(link);
                    link.on('click', Ojay.stopDefault)._(this).setPage(i+1);
                }, this);
            },
            
            /**
             * <p>Generates a set of elements to hold the content retrieved over Ajax
             * when the links are clicked.</p>
             */
            _makeViews: function() {
                this._container.setContent('');
                this._links.forEach(function(link, i) {
                    var div = Ojay.HTML.div({className: this.klass.TAB_CLASS});
                    this._container.insert(div);
                }, this);
                this._tabGroup = this._container.children();
                this.callSuper();
            }
        },
        
        READY: {
            /**
             * <p>Handles request to <tt>changeState()</tt>.</p>
             * @param {Number} page
             */
            _handleSetPage: function(index) {
                if (this.pageLoaded(index)) return this.callSuper();
                
                var _super = this.method('callSuper');
                this.setState('REQUESTING');
                this.loadPage(index, function() {
                    this.setState('READY');
                    _super();
                }, this);
            }
        },
        
        REQUESTING: {}
    },
    
    extend: /** @scope Ojay.AjaxTabs */{
        TAB_CLASS:    'tab',
        
        /**
         * <p>There's a pretty good chance of there being several good ways of instantiating
         * one of these, so for now let's encourage the default way to be used through a
         * factory method.</p>
         * @param {String|DomCollection} links
         * @param {String|DomCollection} container
         * @param {Object} options
         * @returns {AjaxTabs}
         */
        fromLinks: function(links, container, options) {
            return new this(links, container, options);
        }
    }
});