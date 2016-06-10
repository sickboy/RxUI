(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("Rx"), require("null"), require("Rx.Scheduler"));
	else if(typeof define === 'function' && define.amd)
		define(["Rx", "null", "Rx.Scheduler"], factory);
	else if(typeof exports === 'object')
		exports["RxUI"] = factory(require("Rx"), require("null"), require("Rx.Scheduler"));
	else
		root["RxUI"] = factory(root["Rx"], root["null"], root["Rx.Scheduler"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_7__, __WEBPACK_EXTERNAL_MODULE_10__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(3));
	__export(__webpack_require__(4));
	__export(__webpack_require__(8));
	__export(__webpack_require__(9));
	__export(__webpack_require__(6));
	//# sourceMappingURL=main.js.map

/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports) {

	module.exports = Rx;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Rx_1 = __webpack_require__(2);
	var property_changed_event_args_1 = __webpack_require__(4);
	var invoke_command_1 = __webpack_require__(6);
	__webpack_require__(7);
	/**
	 * Defines a class that represents a reactive object.
	 * This is the base class for View Model classes, and it implements an event system that
	 * allows notification of property changes, which is the basis of the observable pipeline.
	 */
	var ReactiveObject = (function () {
	    /**
	     * Creates a new reactive object.
	     */
	    function ReactiveObject() {
	        this._propertyChanged = new Rx_1.Subject();
	        this.__data = {};
	    }
	    Object.defineProperty(ReactiveObject.prototype, "propertyChanged", {
	        /**
	         * Gets the observable that represents the stream of "propertyChanged" events from this object.
	         */
	        get: function () {
	            return this._propertyChanged;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ReactiveObject.prototype.createPropertyChangedEventArgs = function (propertyName, value) {
	        return new property_changed_event_args_1.PropertyChangedEventArgs(this, propertyName, value);
	    };
	    /**
	     * Emits a new property changed event for the given property from this object.
	     */
	    ReactiveObject.prototype.emitPropertyChanged = function (propertyName, newPropertyValue) {
	        var propValue = newPropertyValue != null ? newPropertyValue : this.get(propertyName);
	        this._propertyChanged.next(this.createPropertyChangedEventArgs(propertyName, propValue));
	    };
	    /**
	     * Emits a new property changed event for the given property if it has changed from the previous value.
	     */
	    ReactiveObject.prototype.emitIfPropertyChanged = function (propertyName, oldPropertyValue) {
	        var currentValue = ReactiveObject.get(this, propertyName);
	        if (currentValue !== oldPropertyValue) {
	            this.emitPropertyChanged(propertyName, currentValue);
	        }
	    };
	    /**
	     * Records the given property before and after the given function is run and raises a property changed notification
	     * if the property value changed.
	     */
	    ReactiveObject.prototype.trackPropertyChanges = function (prop, callback) {
	        var val = ReactiveObject.get(this, prop);
	        var ret = callback();
	        this.emitIfPropertyChanged(prop, val);
	        return ret;
	    };
	    ReactiveObject.getSingleProperty = function (obj, property) {
	        if (typeof obj[property] !== "undefined" || !(obj instanceof ReactiveObject)) {
	            return obj[property];
	        }
	        else {
	            return ReactiveObject.getReactiveProperty(obj, property);
	        }
	    };
	    ReactiveObject.getReactiveProperty = function (obj, property) {
	        return obj.__data[property] || null;
	    };
	    ReactiveObject.getDeepProperty = function (obj, evaluated) {
	        var firstProp = evaluated.children[0];
	        var otherProperties = evaluated.property.substring(firstProp.length + 1);
	        var firstVal = ReactiveObject.get(obj, firstProp);
	        if (typeof firstVal !== "undefined") {
	            if (firstVal !== null) {
	                return ReactiveObject.get(firstVal, otherProperties);
	            }
	            else {
	                return null;
	            }
	        }
	        else {
	            return undefined;
	        }
	    };
	    ReactiveObject.get = function (obj, property) {
	        var evaluated = ReactiveObject.evaluateLambdaOrString(obj, property);
	        if (evaluated.children.length === 1) {
	            return ReactiveObject.getSingleProperty(obj, evaluated.property);
	        }
	        else {
	            return ReactiveObject.getDeepProperty(obj, evaluated);
	        }
	    };
	    /**
	     * Gets the value of the given property from this object.
	     * @param property The name of the property whose value should be retrieved.
	     */
	    ReactiveObject.prototype.get = function (property) {
	        var evaluated = ReactiveObject.evaluateLambdaOrString(this, property);
	        if (evaluated.children.length === 1) {
	            return ReactiveObject.getReactiveProperty(this, evaluated.property);
	        }
	        else {
	            return ReactiveObject.getDeepProperty(this, evaluated);
	        }
	    };
	    ReactiveObject.setSingleProperty = function (obj, property, value) {
	        if (typeof obj[property] !== "undefined" || !(obj instanceof ReactiveObject)) {
	            obj[property] = value;
	        }
	        else {
	            ReactiveObject.setReactiveProperty(obj, property, value);
	        }
	    };
	    ReactiveObject.setReactiveProperty = function (obj, property, value) {
	        var rObj = obj;
	        var oldValue = rObj.__data[property];
	        if (value !== oldValue) {
	            rObj.__data[property] = value;
	            rObj.emitPropertyChanged(property, value);
	        }
	    };
	    ReactiveObject.setDeepProperty = function (obj, evaluated, value) {
	        var firstProp = evaluated.children[0];
	        var otherProperties = evaluated.property.substring(firstProp.length + 1);
	        var firstVal = ReactiveObject.get(obj, firstProp);
	        if (firstVal != null) {
	            ReactiveObject.set(firstVal, otherProperties, value);
	        }
	        else {
	            throw new Error("Null Reference Exception. Cannot set a child property on a null or undefined property of this object.");
	        }
	    };
	    ReactiveObject.setCore = function (obj, property, value, setSingle, setDeep) {
	        var evaluated = ReactiveObject.evaluateLambdaOrString(obj, property);
	        if (evaluated.children.length === 1) {
	            setSingle(evaluated);
	        }
	        else {
	            setDeep(evaluated);
	        }
	    };
	    ReactiveObject.set = function (obj, property, value) {
	        ReactiveObject.setCore(obj, property, value, function (evaluated) {
	            ReactiveObject.setSingleProperty(obj, evaluated.property, value);
	        }, function (evaluated) {
	            ReactiveObject.setDeepProperty(obj, evaluated, value);
	        });
	    };
	    /**
	     * Sets the value of the given property on this object and emits the "propertyChanged" event.
	     * @param property The name of the property to change.
	     * @param value The value to give the property.
	     */
	    ReactiveObject.prototype.set = function (property, value) {
	        var _this = this;
	        ReactiveObject.setCore(this, property, value, function (evaluated) {
	            ReactiveObject.setReactiveProperty(_this, evaluated.property, value);
	        }, function (evaluated) {
	            ReactiveObject.setDeepProperty(_this, evaluated, value);
	        });
	    };
	    /**
	     * Builds a proxy object that adds accessed property names to the given array if proxies are supported.
	     * Returns null if proxies are not supported.
	     */
	    ReactiveObject.buildGhostObject = function (arr) {
	        function buildProxy() {
	            return new Proxy({}, {
	                get: function (target, prop, reciever) {
	                    arr.push(prop);
	                    return buildProxy();
	                }
	            });
	        }
	        if (typeof Proxy !== 'undefined') {
	            return buildProxy();
	        }
	        return null;
	    };
	    /**
	     * Runs the given function against a dummy version of the given object.
	     * object that builds a string that represents the properties that should be watched.
	     * @param expr The function that represents the lambda expression.
	     */
	    ReactiveObject.evaluateLambdaExpression = function (obj, expr) {
	        var path = [];
	        var ghost = ReactiveObject.buildGhostObject(path);
	        if (ghost) {
	            expr(ghost);
	        }
	        else {
	            ReactiveObject.evaluateLambdaErrors(path, expr);
	        }
	        return path.join(".");
	    };
	    ReactiveObject.evaluateLambdaErrors = function (path, expr, currentObj) {
	        if (currentObj === void 0) { currentObj = null; }
	        // Hack the errors that null reference exceptions return to retrieve property names
	        // Works in IE 9+, Chrome 35+, Firefox 30+, Safari 7+
	        // This hack is needed to support lambda expressions in browsers where proxy support is
	        // not yet available. 
	        // Because lambda expressions need to represent any combination of valid property names for an object,
	        // we need to be able to intercept any call to retrieve a property value.
	        // In browsers that do not provide this functionality, we take advantage of the fact that error messages
	        // include property names in them. 
	        // For example, in Chrome 50+, the following code:
	        // 
	        // var myObj = null;
	        // var myPropVar = myObj.myProp;
	        //
	        // throws the following error:
	        //
	        // "TypeError: Cannot read property 'myProp' of null"
	        //
	        // As you can read, the error contains the name of the property that was attempted to be accessed, which is exactly what we want. :)
	        // The error message is mostly the same for IE and Firefox, but not for Safari, hence the second regex. 
	        try {
	            expr(currentObj);
	        }
	        catch (ex) {
	            if (ex instanceof TypeError) {
	                var error = ex;
	                var propertyName = null;
	                // Regex for IE, Chrome & Firefox error messages
	                var match = (/property\s+'(\w+)'/g).exec(error.message);
	                if (match) {
	                    propertyName = match[1];
	                }
	                if (!propertyName) {
	                    // Regex for Safari (iOS & OS X) error messages
	                    match = (/evaluating \'([\w]+\.?)+\'/g).exec(error.message);
	                    if (match) {
	                        propertyName = match[match.length - 1];
	                    }
	                }
	                if (propertyName) {
	                    path.push(propertyName);
	                    currentObj = currentObj || {};
	                    var currentPath = currentObj;
	                    path.forEach(function (p, i) {
	                        currentPath[p] = i < path.length - 1 ? {} : null;
	                        currentPath = currentPath[p];
	                    });
	                    ReactiveObject.evaluateLambdaErrors(path, expr, currentObj);
	                    return;
	                }
	            }
	            throw ex;
	        }
	    };
	    ReactiveObject.evaluateLambdaOrString = function (obj, expression) {
	        var property;
	        if (typeof expression === "function") {
	            property = ReactiveObject.evaluateLambdaExpression(obj, expression);
	        }
	        else {
	            property = expression;
	        }
	        var children = property.split(".");
	        return { children: children, property: property };
	    };
	    ReactiveObject.whenSingleProp = function (obj, prop, emitCurrentVal) {
	        if (emitCurrentVal === void 0) { emitCurrentVal = false; }
	        if (obj instanceof ReactiveObject) {
	            var reactive = obj;
	            var observable = reactive.propertyChanged.filter(function (e) {
	                return e.propertyName == prop;
	            });
	            if (emitCurrentVal) {
	                return Rx_1.Observable.of(reactive.createPropertyChangedEventArgs(prop, reactive.get(prop))).concat(observable);
	            }
	            else {
	                return observable;
	            }
	        }
	        else {
	            if (obj.__viewBindingHelper) {
	                var helper = obj.__viewBindingHelper;
	                return Rx_1.Observable.create(function (observer) {
	                    return helper.observeProp(obj, prop, emitCurrentVal, function (e) {
	                        observer.next(e);
	                    });
	                });
	            }
	            else {
	                throw new Error("Unable to bind to objects that do not inherit from ReactiveObject or provide __viewBindingHelper");
	            }
	        }
	    };
	    ReactiveObject.whenSingle = function (obj, expression, emitCurrentVal) {
	        if (emitCurrentVal === void 0) { emitCurrentVal = false; }
	        var evaulatedExpression = ReactiveObject.evaluateLambdaOrString(obj, expression);
	        var children = evaulatedExpression.children;
	        var prop = evaulatedExpression.property;
	        if (children.length === 1) {
	            return ReactiveObject.whenSingleProp(obj, prop, emitCurrentVal);
	        }
	        else {
	            // Assuming prop = "first.second.third"
	            var firstProp = children[0]; // = "first"
	            // All of the other properties = "second.third"
	            var propertiesWithoutFirst = prop.substring(firstProp.length + 1);
	            // Watch for changes to the "first" property on this object,
	            // and subscribe to the rest of the properties on that object.
	            // Switch between the observed values, so that only the most recent object graph
	            // property changes are observed.
	            // Store the number of times that the property has been changed at this level.
	            // This way, we can be sure about whether to emit the current value or not, based on whether
	            // we have observed 2 or more events at this level.
	            var observationCount = 0;
	            return ReactiveObject.whenSingleProp(obj, firstProp, true).map(function (change) {
	                var obj = change.newPropertyValue;
	                observationCount++;
	                if (obj) {
	                    return ReactiveObject.whenSingle(obj, propertiesWithoutFirst, emitCurrentVal || observationCount > 1);
	                }
	                else if (emitCurrentVal) {
	                    return Rx_1.Observable.of(change);
	                }
	                else {
	                    return Rx_1.Observable.empty();
	                }
	            }).switch();
	        }
	    };
	    /**
	     * Gets an observable that resolves with the related property changed event whenever the given property updates.
	     */
	    ReactiveObject.prototype.whenSingle = function (expression, emitCurrentVal) {
	        if (emitCurrentVal === void 0) { emitCurrentVal = false; }
	        return ReactiveObject.whenSingle(this, expression, emitCurrentVal);
	    };
	    /**
	     * Gets an observable that resolves with the related property changed event whenever the given properties update.
	     * @param properties The names of the properties.
	     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
	     */
	    ReactiveObject.prototype.whenAny = function () {
	        var _this = this;
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        var finalProperties = [];
	        var map = this.getMapFunction(args);
	        function iterateProperties(properties) {
	            properties.forEach(function (p, i) {
	                var type = typeof p;
	                if (type === "string" || type === "function") {
	                    finalProperties.push(p);
	                }
	                else if (Array.isArray(p)) {
	                    iterateProperties(p);
	                }
	            });
	        }
	        iterateProperties(map ? args.slice(0, args.length - 1) : args);
	        var observableList = finalProperties.map(function (prop) {
	            return _this.whenSingle(prop, true);
	        }).filter(function (o) { return o != null; });
	        if (map) {
	            return Rx_1.Observable.combineLatest.apply(Rx_1.Observable, observableList.concat([map]));
	        }
	        else {
	            return Rx_1.Observable.combineLatest.apply(Rx_1.Observable, observableList.concat([function () {
	                var events = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    events[_i - 0] = arguments[_i];
	                }
	                if (events.length == 1) {
	                    return events[0];
	                }
	                else {
	                    return events;
	                }
	            }]));
	        }
	    };
	    ReactiveObject.prototype.getMapFunction = function (values) {
	        var mapFunction = null;
	        var lastArg = values[values.length - 1];
	        if (values.length > 1 && typeof lastArg === "function") {
	            mapFunction = lastArg;
	        }
	        return mapFunction;
	    };
	    /**
	     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
	     * @map A function that, given the values for the properties, maps to the desired return value.
	     */
	    ReactiveObject.prototype.whenAnyValue = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        var mapFunction = this.getMapFunction(args);
	        var whenAnyArgs = mapFunction ? args.slice(0, args.length - 1) : args;
	        var whenAny = this.whenAny.bind(this);
	        return whenAny.apply(void 0, whenAnyArgs.concat([function () {
	            var events = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                events[_i - 0] = arguments[_i];
	            }
	            var eventValues = events.map(function (e) { return e.newPropertyValue; });
	            if (mapFunction) {
	                return mapFunction.apply(void 0, eventValues);
	            }
	            else if (eventValues.length == 1) {
	                return eventValues[0];
	            }
	            else {
	                return eventValues;
	            }
	        }]));
	    };
	    ReactiveObject.prototype.mergeChanges = function () {
	        var changes = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            changes[_i - 0] = arguments[_i];
	        }
	        return Rx_1.Observable.merge.apply(Rx_1.Observable, changes)
	            .distinctUntilChanged(function (v1, v2) { return v1 === v2; }, function (c) { return c.value; });
	    };
	    /**
	     * Binds the specified property on this object to the specified property on the given other object.
	     * @param view The view whose property should be bound to one of this object's properties.
	     * @param viewModelProp A function that maps this object to the property that should be bound to the view. Alternatively, a string can be used to point out the property.
	     * @param viewProp A function that maps the view to the property that should be bound to this object. Alternatively, a string can be used.
	     * @param scheduler The scheduler that changes to the properties should be observed on.
	     */
	    ReactiveObject.prototype.bind = function (view, viewModelProp, viewProp, scheduler) {
	        // Changes to the view and view model need to be consolidated
	        // and mapped so that we can figure out two things:
	        // 1. Whether the change is comming from the view model or the view.
	        // 2. Whether the value changed, or if it is feedback from already propagating a change.
	        var _this = this;
	        var viewChanges = ReactiveObject.whenSingle(view, viewProp).map(function (c) { return ({
	            fromVm: false,
	            value: c.newPropertyValue
	        }); });
	        var viewModelChanges = this.whenAny(viewModelProp).map(function (c) { return ({
	            fromVm: true,
	            value: c.newPropertyValue
	        }); });
	        var changes = this.mergeChanges(viewChanges, viewModelChanges)
	            .startWith({
	            fromVm: true,
	            value: this.get(viewModelProp)
	        });
	        // TODO: Add support for error handling
	        return changes.subscribe(function (c) {
	            if (c.fromVm) {
	                // set property on view
	                ReactiveObject.set(view, viewProp, c.value);
	            }
	            else {
	                // set property on view model
	                _this.set(viewModelProp, c.value);
	            }
	        });
	    };
	    /**
	     * Propagates values from the specified property on this object to the specified property on the given view object.
	     * @param view The object that should be bound to this object.
	     * @param viewModelProp The property on this object that should set to the other property.
	     * @param viewProp The property on the view object that should recieve values from the other property.
	     * @return Subscription
	     */
	    ReactiveObject.prototype.oneWayBind = function (view, viewModelProp, viewProp, scheduler) {
	        var viewModelChanges = this.whenAny(viewModelProp).map(function (c) { return ({
	            fromVm: true,
	            value: c.newPropertyValue
	        }); });
	        var changes = this.mergeChanges(viewModelChanges)
	            .startWith({
	            fromVm: true,
	            value: this.get(viewModelProp)
	        });
	        if (scheduler) {
	            changes = changes.observeOn(scheduler);
	        }
	        // TODO: Add support for error handling
	        return changes.subscribe(function (c) {
	            if (c.fromVm) {
	                // set property on view
	                ReactiveObject.set(view, viewProp, c.value);
	            }
	        });
	    };
	    /**
	     * Binds values recieved from the given observable to the specified property on the given object.
	     * @param observable The Observable object whose values should be piped to the specified property.
	     * @param view The object that the values should be piped to.
	     * @param viewProp The property on the object that the values should be piped to.
	     */
	    ReactiveObject.bindObservable = function (observable, view, viewProp, scheduler) {
	        var o = observable.distinctUntilChanged();
	        if (scheduler) {
	            o = o.observeOn(scheduler);
	        }
	        return o.subscribe(function (value) {
	            ReactiveObject.set(view, viewProp, value);
	        });
	    };
	    ReactiveObject.prototype.when = function (observable) {
	        if (typeof observable === "string") {
	            return this.whenSingle(observable, true).map(function (e) { return e.newPropertyValue; }).switch();
	        }
	        else {
	            return observable;
	        }
	    };
	    /**
	     * Attempts to invoke the given command when the given Observable resolves with a new value.
	     * The command will not be invoked unless it can execute.
	     * Returns a cold Observable that resolves with the results of the executions.
	     * The returned Observable MUST be subscribed to in order for the command to execute.
	     *
	     * @param observable The Observable object that should be used as the trigger for the command.
	     *                   Additionally, if a property name is passed in, the most recent Observable stored at that property is used.
	     * @param command The ReactiveCommand object that should be executed.
	     *                If a property name is passed in, the most recent command stored at that property is used.
	     */
	    ReactiveObject.prototype.invokeCommandWhen = function (observable, command) {
	        return invoke_command_1.invokeCommand(this.when(observable), this, command);
	    };
	    /**
	     * Creates a one way binding between the given observable and the specified property on this object.
	     * @param observable The observable that should be bound to the property.
	     * @param property The property that should assume the most recently observed value from the observable.
	     * @param scheduler The scheduler that should be used to observe values from the given observable.
	     */
	    ReactiveObject.prototype.toProperty = function (observable, property, scheduler) {
	        return ReactiveObject.bindObservable(observable, this, property, scheduler);
	    };
	    return ReactiveObject;
	}());
	exports.ReactiveObject = ReactiveObject;
	//# sourceMappingURL=reactive-object.js.map

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var event_args_1 = __webpack_require__(5);
	/**
	 * Defines a class that represents the arguments for events that notify when properties change.
	 */
	var PropertyChangedEventArgs = (function (_super) {
	    __extends(PropertyChangedEventArgs, _super);
	    /**
	     * Creates a new object that represents the event arguments for a property changed event.
	     * @param sender The object whose property has changed.
	     * @param propertyName The name of the property that changed.
	     * @param newPropertyValue The new value that the property now possesses.
	     */
	    function PropertyChangedEventArgs(sender, propertyName, newPropertyValue) {
	        _super.call(this, sender);
	        this._propertyName = propertyName;
	        this._newPropertyValue = newPropertyValue;
	    }
	    Object.defineProperty(PropertyChangedEventArgs.prototype, "propertyName", {
	        /**
	         * Gets the name of the property that changed.
	         */
	        get: function () {
	            return this._propertyName;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PropertyChangedEventArgs.prototype, "newPropertyValue", {
	        /**
	         * Gets the value that the property now has.
	         */
	        get: function () {
	            return this._newPropertyValue;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return PropertyChangedEventArgs;
	}(event_args_1.EventArgs));
	exports.PropertyChangedEventArgs = PropertyChangedEventArgs;
	//# sourceMappingURL=property-changed-event-args.js.map

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * Defines a base class that represents event arguments for an event.
	 */
	var EventArgs = (function () {
	    /**
	     * Creates a new event args object.
	     * @param sender The object that is emitting the event.
	     */
	    function EventArgs(sender) {
	        this._sender = sender;
	    }
	    Object.defineProperty(EventArgs.prototype, "sender", {
	        /**
	         * Gets the object that emitted the event.
	         */
	        get: function () {
	            return this._sender;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return EventArgs;
	}());
	exports.EventArgs = EventArgs;
	//# sourceMappingURL=event-args.js.map

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Rx_1 = __webpack_require__(2);
	/**
	 * Creates a new cold observable that maps values observed from the source Observable to values resolved from a ReactiveCommand.
	 * Essentially, this means that the command is executed whenever the source Observable resolves a new value, so long as the command is executable at the moment.
	 * @param source The Observable that should be used as the trigger for the command.
	 * @param obj The Reactive Object that the command exists on.
	 * @param command The name of the property that holds the ReactiveCommand that should be subscribed to.
	 *                Alternatively, the actual command object that should be executed can be passed in.
	 */
	function invokeCommand(source, obj, command) {
	    var commandObservable;
	    var canExecute;
	    var isExecuting;
	    if (typeof command === "string") {
	        // Make sure that the current command is observed
	        commandObservable = obj.whenSingle(command, true).map(function (e) { return e.newPropertyValue; });
	        canExecute = commandObservable.map(function (c) { return c.canExecute; }).switch();
	    }
	    else {
	        commandObservable = Rx_1.Observable.of(command);
	        canExecute = command.canExecute;
	    }
	    var results = source
	        .withLatestFrom(commandObservable, canExecute, function (v1, command, canExecute) {
	        return {
	            canExecute: canExecute,
	            command: command,
	            observedValue: v1
	        };
	    })
	        .filter(function (o) { return o.canExecute && o.command != null; })
	        .distinctUntilChanged()
	        .flatMap(function (o) {
	        return o.command.execute(o.observedValue);
	    });
	    return results;
	}
	exports.invokeCommand = invokeCommand;
	//# sourceMappingURL=invoke-command.js.map

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = null;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Rx_1 = __webpack_require__(2);
	var rx_app_1 = __webpack_require__(9);
	// Implementation mostly stolen from:
	// https://github.com/reactiveui/ReactiveUI/blob/rxui7-master/ReactiveUI/ReactiveCommand.cs
	// All credit goes to those creators
	/**
	 * Defines a class that represents a command that can run operations in the background.
	 */
	var ReactiveCommand = (function () {
	    /**
	     * Creates a new Reactive Command.
	     * @param canRun An observable that determines whether the given task is allowed to run at a given moment.
	     * @param task A function that returns an observable that represents the asynchronous operation.
	     * @param scheduler The scheduler that all of the results should be observed on.
	     */
	    function ReactiveCommand(task, canRun, scheduler) {
	        var _this = this;
	        this.task = task;
	        this.canRun = canRun;
	        this.scheduler = scheduler;
	        if (!task) {
	            throw new Error("The task parameter must be supplied");
	        }
	        if (!canRun) {
	            throw new Error("The canRun parameter must be supplied");
	        }
	        if (!scheduler) {
	            throw new Error("The scheduler parameter must be supplied");
	        }
	        this._executionInfo = new Rx_1.Subject();
	        this._synchronizedExcecutionInfo = this._executionInfo;
	        this._exceptions = new Rx_1.Subject();
	        // Implementation mostly taken from:
	        // https://github.com/reactiveui/ReactiveUI/blob/rxui7-master/ReactiveUI/ReactiveCommand.cs#L628
	        this._isExecuting = this._synchronizedExcecutionInfo
	            .observeOn(scheduler)
	            .map(function (info) { return info.demarcation === ExecutionDemarcation.Begin; })
	            .startWith(false)
	            .distinctUntilChanged()
	            .publishReplay(1)
	            .refCount();
	        this._canExecute = this.canRun
	            .catch(function (ex) {
	            _this._exceptions.next(ex);
	            return Rx_1.Observable.of(false);
	        })
	            .startWith(false)
	            .combineLatest(this._isExecuting, function (canRun, isExecuting) {
	            return canRun && !isExecuting;
	        })
	            .distinctUntilChanged()
	            .publishReplay(1)
	            .refCount();
	        this._results = this._synchronizedExcecutionInfo
	            .observeOn(scheduler)
	            .filter(function (info) { return info.demarcation === ExecutionDemarcation.EndWithResult; })
	            .map(function (info) { return info.result; });
	        // Make sure that can execute is triggered to be a hot observable.
	        this._canExecuteSubscription = this._canExecute.subscribe();
	    }
	    Object.defineProperty(ReactiveCommand.prototype, "isExecuting", {
	        /**
	         * Gets an observable that represents whether the command is currently executing.
	         */
	        get: function () {
	            return this._isExecuting;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ReactiveCommand.prototype, "canExecute", {
	        /**
	         * Gets an observable that represents whether this command can execute.
	         */
	        get: function () {
	            return this._canExecute;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ReactiveCommand.defaultScheduler = function (scheduler) {
	        return scheduler || rx_app_1.RxApp.mainThreadScheduler;
	    };
	    ReactiveCommand.defaultCanRun = function (canRun) {
	        return canRun || Rx_1.Observable.of(true);
	    };
	    /**
	     * Creates a new Reactive Command that can run the given synchronous task when executed.
	     * @param task A function that executes some synchronous task and returns an optional value.
	     * @param canRun An Observable whose stream of values determine whether the command is allowed to run at a certain time.
	     * @param scheduler The scheduler that all of the results from the task should be observed on.
	     */
	    ReactiveCommand.create = function (task, canRun, scheduler) {
	        return new ReactiveCommand(function (args) {
	            var result = task(args);
	            if (typeof result !== "undefined") {
	                return Rx_1.Observable.of(result);
	            }
	            else {
	                // TODO: replace with Unit
	                return Rx_1.Observable.of(null);
	            }
	        }, ReactiveCommand.defaultCanRun(canRun), ReactiveCommand.defaultScheduler(scheduler));
	    };
	    /**
	     * Creates a new Reactive Command that can run the given task when executed.
	     * @param task A function that returns a promise that completes when the task has finished executing.
	     * @param canRun An Observable whose stream of values determine whether the command is allowed to run at a certain time.
	     * @param scheduler The scheduler that all of the results from the task should be observed on.
	     */
	    ReactiveCommand.createFromTask = function (task, canRun, scheduler) {
	        return new ReactiveCommand(function (args) { return Rx_1.Observable.fromPromise(task(args)); }, ReactiveCommand.defaultCanRun(canRun), ReactiveCommand.defaultScheduler(scheduler));
	    };
	    /**
	     * Creates a new Reactive Command that can run the given task when executed.
	     * @param task A function that returns an observable that completes when the task has finished executing.
	     * @param canRun An Observable whose stream of values determine whether the command is allowed to run at a certain time.
	     * @param scheduler The scheduler that all of the results from the task should be observed on.
	     */
	    ReactiveCommand.createFromObservable = function (task, canRun, scheduler) {
	        return new ReactiveCommand(task, ReactiveCommand.defaultCanRun(canRun), ReactiveCommand.defaultScheduler(scheduler));
	    };
	    /**
	     * Executes this command asynchronously.
	     * Note that this method does not check whether the command is currently executable.
	     */
	    ReactiveCommand.prototype.execute = function (arg) {
	        var _this = this;
	        if (arg === void 0) { arg = null; }
	        try {
	            return Rx_1.Observable.defer(function () {
	                _this._synchronizedExcecutionInfo.next(ExecutionInfo.createBegin());
	                return Rx_1.Observable.empty();
	            })
	                .concat(this.task(arg))
	                .do(function (result) { return _this._synchronizedExcecutionInfo.next(ExecutionInfo.createResult(result)); }, null, function () { return _this._synchronizedExcecutionInfo.next(ExecutionInfo.createEnded()); })
	                .catch(function (ex) {
	                _this._synchronizedExcecutionInfo.next(ExecutionInfo.createFail());
	                _this._exceptions.next(ex);
	                return Rx_1.Observable.throw(ex);
	            })
	                .publishLast()
	                .refCount();
	        }
	        catch (ex) {
	            this._exceptions.next(ex);
	            return Rx_1.Observable.throw(ex);
	        }
	    };
	    /**
	     * Executes this command asynchronously if the latest observed value from canExecute is true.
	     */
	    ReactiveCommand.prototype.invoke = function (arg) {
	        var _this = this;
	        if (arg === void 0) { arg = null; }
	        return this.canExecuteNow().filter(function (canExecute) { return canExecute; }).flatMap(function (c) {
	            return _this.execute(arg);
	        });
	    };
	    /**
	     * Gets an observable that determines whether the command is able to execute at the moment it is subscribed to.
	     */
	    ReactiveCommand.prototype.canExecuteNow = function () {
	        return this.canExecute.first();
	    };
	    Object.defineProperty(ReactiveCommand.prototype, "results", {
	        /**
	         * Gets the observable that represents the results of this command's operations.
	         */
	        get: function () {
	            return this._results;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return ReactiveCommand;
	}());
	exports.ReactiveCommand = ReactiveCommand;
	var ExecutionInfo = (function () {
	    function ExecutionInfo(demarcation, result) {
	        this.demarcation = demarcation;
	        this.result = result;
	    }
	    ExecutionInfo.createBegin = function () {
	        return new ExecutionInfo(ExecutionDemarcation.Begin, null);
	    };
	    ExecutionInfo.createResult = function (result) {
	        return new ExecutionInfo(ExecutionDemarcation.EndWithResult, result);
	    };
	    ExecutionInfo.createFail = function () {
	        return new ExecutionInfo(ExecutionDemarcation.EndWithException, null);
	    };
	    ExecutionInfo.createEnded = function () {
	        return new ExecutionInfo(ExecutionDemarcation.Ended, null);
	    };
	    return ExecutionInfo;
	}());
	var ExecutionDemarcation;
	(function (ExecutionDemarcation) {
	    ExecutionDemarcation[ExecutionDemarcation["Begin"] = 0] = "Begin";
	    ExecutionDemarcation[ExecutionDemarcation["EndWithResult"] = 1] = "EndWithResult";
	    ExecutionDemarcation[ExecutionDemarcation["EndWithException"] = 2] = "EndWithException";
	    ExecutionDemarcation[ExecutionDemarcation["Ended"] = 3] = "Ended";
	})(ExecutionDemarcation || (ExecutionDemarcation = {}));
	//# sourceMappingURL=reactive-command.js.map

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var asap_1 = __webpack_require__(10);
	var queue_1 = __webpack_require__(10);
	var Schedulers = {
	    asap: asap_1.asap,
	    queue: queue_1.queue
	};
	/**
	 * Defines a class that contains static properties that are useful for a Reactive Application.
	 */
	var RxApp = (function () {
	    function RxApp() {
	    }
	    return RxApp;
	}());
	exports.RxApp = RxApp;
	RxApp.mainThreadScheduler = Schedulers.queue;
	RxApp.immediateScheduler = Schedulers.asap;
	//# sourceMappingURL=rx-app.js.map

/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = Rx.Scheduler;

/***/ }
/******/ ])
});
;