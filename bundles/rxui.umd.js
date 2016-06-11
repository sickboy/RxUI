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
	__export(__webpack_require__(27));
	__export(__webpack_require__(28));
	__export(__webpack_require__(8));
	__export(__webpack_require__(17));
	__export(__webpack_require__(26));
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
	    function ReactiveObject(obj) {
	        this._propertyChanged = new Rx_1.Subject();
	        this.__data = {};
	        if (obj && typeof obj === "object") {
	            for (var key in obj) {
	                if (obj.hasOwnProperty(key)) {
	                    this.set(key, obj[key]);
	                }
	            }
	        }
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
	    ReactiveObject.traverse = function (obj, property, setSingle, setDeep) {
	        var evaluated = ReactiveObject.evaluateLambdaOrString(obj, property);
	        if (evaluated.children.length === 1) {
	            setSingle(evaluated);
	        }
	        else {
	            setDeep(evaluated);
	        }
	    };
	    ReactiveObject.set = function (obj, property, value) {
	        ReactiveObject.traverse(obj, property, function (evaluated) {
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
	        ReactiveObject.traverse(this, property, function (evaluated) {
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
	    /**
	     * Returns the data that should be used to convert this reactive object into a JSON string.
	     */
	    ReactiveObject.prototype.toJSON = function () {
	        return ReactiveObject.clone(this.__data);
	    };
	    /**
	     * Returns the string representation of this reactive object.
	     */
	    ReactiveObject.prototype.toString = function () {
	        return JSON.stringify(this);
	    };
	    /**
	     * Gets the list of enumerable property names that have been set on the given object.
	     * @param obj The object whose enumerable property names should be returned.
	     */
	    ReactiveObject.keys = function (obj) {
	        if (obj instanceof ReactiveObject) {
	            return Object.keys(obj.__data);
	        }
	        else {
	            return Object.keys(obj);
	        }
	    };
	    ReactiveObject.clone = function (obj) {
	        var clone = {};
	        for (var key in obj) {
	            if (obj.hasOwnProperty(key)) {
	                clone[key] = obj[key];
	            }
	        }
	        return clone;
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

/***/ },
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Subscription_1 = __webpack_require__(18);
	/**
	 * Defines a class that represents an interaction.
	 * Interactions are designed to provide a means of resolving view-specific input mechanisms that occur
	 * during an operation that a ReactiveObject is performing.
	 */
	var ReactiveInteraction = (function () {
	    function ReactiveInteraction() {
	        this._handlerChain = [];
	    }
	    /**
	     * Adds the given handler to the beginning of the handler chain for this interaction and returns
	     * a subscription that, when unsubscribed from, removes the handler from the handler chain.
	     * @param handler The function that can handle the interaction.
	     */
	    ReactiveInteraction.prototype.registerHandler = function (handler) {
	        var _this = this;
	        if (!handler)
	            throw Error("Null or undefined handlers cannot be registered. Pass in a valid handler function to properly register it.");
	        this._handlerChain.unshift(handler);
	        return new Subscription_1.Subscription(function () {
	            var index = _this._handlerChain.indexOf(handler);
	            if (index >= 0) {
	                _this._handlerChain.splice(index, 1);
	            }
	        });
	    };
	    /**
	     * Attempts to handle an interaction. Returns a promise that represents the async operation.
	     * By default, handlers are called from most recently registered to least recently registered.
	     * If a handler returns (note that if the handler resolves a promise with undefined, that will be used as the output) undefined, then the next handler in line is called.
	     * If a handler errors, then the entire chain errors and the error is surfaced through the returned promise.
	     * @param param The input that should be provided to the handler.
	     */
	    ReactiveInteraction.prototype.handle = function (param) {
	        var _this = this;
	        return new Promise(function (resolve, reject) {
	            var currentHandler = 0;
	            do {
	                var handler = _this._handlerChain[currentHandler];
	                try {
	                    var result = handler(param);
	                    if (typeof result !== "undefined") {
	                        if (result instanceof Promise) {
	                            result.then(function (value) {
	                                resolve(value);
	                            }, function (err) {
	                                reject(err);
	                            });
	                        }
	                        else {
	                            resolve(result);
	                        }
	                        return;
	                    }
	                }
	                catch (err) {
	                    reject(err);
	                }
	            } while (++currentHandler < _this._handlerChain.length);
	            reject(new Error("No handler handled the interaction. Make sure that registerHandler is being called and that its returned subscription is not being disposed."));
	        });
	    };
	    return ReactiveInteraction;
	}());
	exports.ReactiveInteraction = ReactiveInteraction;
	//# sourceMappingURL=reactive-interaction.js.map

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var isArray_1 = __webpack_require__(19);
	var isObject_1 = __webpack_require__(20);
	var isFunction_1 = __webpack_require__(21);
	var tryCatch_1 = __webpack_require__(22);
	var errorObject_1 = __webpack_require__(23);
	var UnsubscriptionError_1 = __webpack_require__(24);
	/**
	 * Represents a disposable resource, such as the execution of an Observable. A
	 * Subscription has one important method, `unsubscribe`, that takes no argument
	 * and just disposes the resource held by the subscription.
	 *
	 * Additionally, subscriptions may be grouped together through the `add()`
	 * method, which will attach a child Subscription to the current Subscription.
	 * When a Subscription is unsubscribed, all its children (and its grandchildren)
	 * will be unsubscribed as well.
	 *
	 * @class Subscription
	 */
	var Subscription = (function () {
	    /**
	     * @param {function(): void} [unsubscribe] A function describing how to
	     * perform the disposal of resources when the `unsubscribe` method is called.
	     */
	    function Subscription(unsubscribe) {
	        /**
	         * A flag to indicate whether this Subscription has already been unsubscribed.
	         * @type {boolean}
	         */
	        this.isUnsubscribed = false;
	        if (unsubscribe) {
	            this._unsubscribe = unsubscribe;
	        }
	    }
	    /**
	     * Disposes the resources held by the subscription. May, for instance, cancel
	     * an ongoing Observable execution or cancel any other type of work that
	     * started when the Subscription was created.
	     * @return {void}
	     */
	    Subscription.prototype.unsubscribe = function () {
	        var hasErrors = false;
	        var errors;
	        if (this.isUnsubscribed) {
	            return;
	        }
	        this.isUnsubscribed = true;
	        var _a = this, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
	        this._subscriptions = null;
	        if (isFunction_1.isFunction(_unsubscribe)) {
	            var trial = tryCatch_1.tryCatch(_unsubscribe).call(this);
	            if (trial === errorObject_1.errorObject) {
	                hasErrors = true;
	                (errors = errors || []).push(errorObject_1.errorObject.e);
	            }
	        }
	        if (isArray_1.isArray(_subscriptions)) {
	            var index = -1;
	            var len = _subscriptions.length;
	            while (++index < len) {
	                var sub = _subscriptions[index];
	                if (isObject_1.isObject(sub)) {
	                    var trial = tryCatch_1.tryCatch(sub.unsubscribe).call(sub);
	                    if (trial === errorObject_1.errorObject) {
	                        hasErrors = true;
	                        errors = errors || [];
	                        var err = errorObject_1.errorObject.e;
	                        if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
	                            errors = errors.concat(err.errors);
	                        }
	                        else {
	                            errors.push(err);
	                        }
	                    }
	                }
	            }
	        }
	        if (hasErrors) {
	            throw new UnsubscriptionError_1.UnsubscriptionError(errors);
	        }
	    };
	    /**
	     * Adds a tear down to be called during the unsubscribe() of this
	     * Subscription.
	     *
	     * If the tear down being added is a subscription that is already
	     * unsubscribed, is the same reference `add` is being called on, or is
	     * `Subscription.EMPTY`, it will not be added.
	     *
	     * If this subscription is already in an `isUnsubscribed` state, the passed
	     * tear down logic will be executed immediately.
	     *
	     * @param {TeardownLogic} teardown The additional logic to execute on
	     * teardown.
	     * @return {Subscription} Returns the Subscription used or created to be
	     * added to the inner subscriptions list. This Subscription can be used with
	     * `remove()` to remove the passed teardown logic from the inner subscriptions
	     * list.
	     */
	    Subscription.prototype.add = function (teardown) {
	        if (!teardown || (teardown === this) || (teardown === Subscription.EMPTY)) {
	            return;
	        }
	        var sub = teardown;
	        switch (typeof teardown) {
	            case 'function':
	                sub = new Subscription(teardown);
	            case 'object':
	                if (sub.isUnsubscribed || typeof sub.unsubscribe !== 'function') {
	                    break;
	                }
	                else if (this.isUnsubscribed) {
	                    sub.unsubscribe();
	                }
	                else {
	                    (this._subscriptions || (this._subscriptions = [])).push(sub);
	                }
	                break;
	            default:
	                throw new Error('Unrecognized teardown ' + teardown + ' added to Subscription.');
	        }
	        return sub;
	    };
	    /**
	     * Removes a Subscription from the internal list of subscriptions that will
	     * unsubscribe during the unsubscribe process of this Subscription.
	     * @param {Subscription} subscription The subscription to remove.
	     * @return {void}
	     */
	    Subscription.prototype.remove = function (subscription) {
	        // HACK: This might be redundant because of the logic in `add()`
	        if (subscription == null || (subscription === this) || (subscription === Subscription.EMPTY)) {
	            return;
	        }
	        var subscriptions = this._subscriptions;
	        if (subscriptions) {
	            var subscriptionIndex = subscriptions.indexOf(subscription);
	            if (subscriptionIndex !== -1) {
	                subscriptions.splice(subscriptionIndex, 1);
	            }
	        }
	    };
	    Subscription.EMPTY = (function (empty) {
	        empty.isUnsubscribed = true;
	        return empty;
	    }(new Subscription()));
	    return Subscription;
	}());
	exports.Subscription = Subscription;
	//# sourceMappingURL=Subscription.js.map

/***/ },
/* 19 */
/***/ function(module, exports) {

	"use strict";
	exports.isArray = Array.isArray || (function (x) { return x && typeof x.length === 'number'; });
	//# sourceMappingURL=isArray.js.map

/***/ },
/* 20 */
/***/ function(module, exports) {

	"use strict";
	function isObject(x) {
	    return x != null && typeof x === 'object';
	}
	exports.isObject = isObject;
	//# sourceMappingURL=isObject.js.map

/***/ },
/* 21 */
/***/ function(module, exports) {

	"use strict";
	function isFunction(x) {
	    return typeof x === 'function';
	}
	exports.isFunction = isFunction;
	//# sourceMappingURL=isFunction.js.map

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var errorObject_1 = __webpack_require__(23);
	var tryCatchTarget;
	function tryCatcher() {
	    try {
	        return tryCatchTarget.apply(this, arguments);
	    }
	    catch (e) {
	        errorObject_1.errorObject.e = e;
	        return errorObject_1.errorObject;
	    }
	}
	function tryCatch(fn) {
	    tryCatchTarget = fn;
	    return tryCatcher;
	}
	exports.tryCatch = tryCatch;
	;
	//# sourceMappingURL=tryCatch.js.map

/***/ },
/* 23 */
/***/ function(module, exports) {

	"use strict";
	// typeof any so that it we don't have to cast when comparing a result to the error object
	exports.errorObject = { e: {} };
	//# sourceMappingURL=errorObject.js.map

/***/ },
/* 24 */
/***/ function(module, exports) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	/**
	 * An error thrown when one or more errors have occurred during the
	 * `unsubscribe` of a {@link Subscription}.
	 */
	var UnsubscriptionError = (function (_super) {
	    __extends(UnsubscriptionError, _super);
	    function UnsubscriptionError(errors) {
	        _super.call(this);
	        this.errors = errors;
	        this.name = 'UnsubscriptionError';
	        this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return ((i + 1) + ") " + err.toString()); }).join('\n') : '';
	    }
	    return UnsubscriptionError;
	}(Error));
	exports.UnsubscriptionError = UnsubscriptionError;
	//# sourceMappingURL=UnsubscriptionError.js.map

/***/ },
/* 25 */,
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var reactive_object_1 = __webpack_require__(3);
	var Rx_1 = __webpack_require__(2);
	var collection_changed_event_args_1 = __webpack_require__(27);
	function _bindFunction(fn, thisArg) {
	    var bound = fn;
	    if (thisArg) {
	        bound = fn.bind(thisArg);
	    }
	    return bound;
	}
	var ReactiveArray = (function (_super) {
	    __extends(ReactiveArray, _super);
	    function ReactiveArray(arr) {
	        _super.call(this);
	        this._changed = new Rx_1.Subject();
	        var copied = arr ? arr.slice() : [];
	        if (Array.isArray(copied)) {
	            this._array = copied;
	        }
	        else {
	            this._array = copied._array;
	        }
	    }
	    ReactiveArray.prototype.emitArrayChanges = function (addStartIndex, addedItems, deleteStartIndex, deletedItems) {
	        if (addedItems.length > 0 || deletedItems.length > 0) {
	            var e = new collection_changed_event_args_1.CollectionChangedEventArgs(this);
	            e.addedItems = addedItems.slice();
	            e.addedItemsIndex = addStartIndex;
	            e.removedItems = deletedItems.slice();
	            e.removedItemsIndex = deleteStartIndex;
	            this._changed.next(e);
	        }
	    };
	    Object.defineProperty(ReactiveArray.prototype, "changed", {
	        get: function () {
	            return this._changed.asObservable();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ReactiveArray.prototype, "itemsAdded", {
	        get: function () {
	            return this.changed.filter(function (e) { return e.addedItems.length > 0; });
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ReactiveArray.prototype, "itemsRemoved", {
	        get: function () {
	            return this.changed.filter(function (e) { return e.removedItems.length > 0; });
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ReactiveArray.prototype.getItem = function (index) {
	        return this._array[index];
	    };
	    ReactiveArray.prototype.setItem = function (index, value) {
	        this._array[index] = value;
	    };
	    ReactiveArray.prototype.unshift = function () {
	        var _this = this;
	        var values = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            values[_i - 0] = arguments[_i];
	        }
	        this.trackPropertyChanges("length", function () {
	            (_a = _this._array).unshift.apply(_a, values);
	            _this.emitArrayChanges(0, values, 0, []);
	            var _a;
	        });
	    };
	    ReactiveArray.prototype.shift = function () {
	        var _this = this;
	        return this.trackPropertyChanges("length", function () {
	            var removed = _this._array.shift();
	            if (typeof removed !== "undefined") {
	                _this.emitArrayChanges(0, [], 0, [removed]);
	            }
	            return removed;
	        });
	    };
	    ReactiveArray.prototype.push = function () {
	        var _this = this;
	        var values = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            values[_i - 0] = arguments[_i];
	        }
	        this.trackPropertyChanges("length", function () {
	            (_a = _this._array).push.apply(_a, values);
	            _this.emitArrayChanges(_this._array.length - values.length, values, 0, []);
	            var _a;
	        });
	    };
	    ReactiveArray.prototype.pop = function () {
	        var _this = this;
	        return this.trackPropertyChanges("length", function () {
	            var removed = _this._array.pop();
	            if (typeof removed !== "undefined") {
	                _this.emitArrayChanges(0, [], _this._array.length, [removed]);
	            }
	            return removed;
	        });
	    };
	    Object.defineProperty(ReactiveArray.prototype, "length", {
	        get: function () {
	            return this._array.length;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ReactiveArray.prototype.slice = function (start, end) {
	        return new ReactiveArray(this._array.slice(start, end));
	    };
	    ReactiveArray.prototype.splice = function (start, deleteCount) {
	        var _this = this;
	        var items = [];
	        for (var _i = 2; _i < arguments.length; _i++) {
	            items[_i - 2] = arguments[_i];
	        }
	        return this.trackPropertyChanges("length", function () {
	            var deleted = (_a = _this._array).splice.apply(_a, [start, deleteCount].concat(items));
	            _this.emitArrayChanges(start, items, start, deleted);
	            return ReactiveArray.from(deleted);
	            var _a;
	        });
	    };
	    ReactiveArray.prototype.sort = function (compareFunction) {
	        var newArr = new ReactiveArray();
	        newArr._array = this._array.sort(compareFunction);
	        return newArr;
	    };
	    ReactiveArray.prototype.map = function (callback, thisArg) {
	        var _this = this;
	        var newArr = new ReactiveArray();
	        var bound = _bindFunction(callback, thisArg);
	        newArr._array = this._array.map(function (value, index, arr) { return bound(value, index, _this); });
	        return newArr;
	    };
	    ReactiveArray.prototype.filter = function (callback, thisArg) {
	        var _this = this;
	        var newArr = new ReactiveArray();
	        var bound = _bindFunction(callback, thisArg);
	        newArr._array = this._array.filter(function (value, index, arr) { return bound(value, index, _this); });
	        return newArr;
	    };
	    ReactiveArray.prototype.indexOf = function (value, fromIndex) {
	        return this._array.indexOf(value, fromIndex);
	    };
	    ReactiveArray.prototype.lastIndexOf = function (value, fromIndex) {
	        if (fromIndex === void 0) { fromIndex = this.length - 1; }
	        return this._array.lastIndexOf(value, fromIndex);
	    };
	    ReactiveArray.prototype.forEach = function (callback, thisArg) {
	        var _this = this;
	        var bound = _bindFunction(callback, thisArg);
	        this._array.forEach(function (value, index, arr) { return bound(value, index, _this); });
	    };
	    ReactiveArray.prototype.reduce = function (callback, initialValue) {
	        var _this = this;
	        if (typeof initialValue !== "undefined") {
	            return this._array.reduce(function (prev, current, index) { return callback(prev, current, index, _this); }, initialValue);
	        }
	        else {
	            return this._array.reduce(function (prev, current, index) { return callback(prev, current, index, _this); });
	        }
	    };
	    ReactiveArray.prototype.every = function (callback, thisArg) {
	        var _this = this;
	        var bound = _bindFunction(callback, thisArg);
	        return this._array.every(function (value, index, arr) { return bound(value, index, _this); });
	    };
	    ReactiveArray.prototype.some = function (callback, thisArg) {
	        var _this = this;
	        var bound = _bindFunction(callback, thisArg);
	        return this._array.some(function (value, index, arr) { return bound(value, index, _this); });
	    };
	    ReactiveArray.prototype.whenAnyItem = function (property) {
	        var derived = this.derived
	            .filter(function (i) { return i != null; })
	            .map(function (i) {
	            var obj = i;
	            var when = obj.whenAny(property);
	            // unique behavior to get the first element to be emitted
	            // but never re-emitted when resubscribed to.
	            return when.publish().refCount();
	        })
	            .build();
	        return derived
	            .toObservable()
	            .map(function (o) { return Rx_1.Observable.merge.apply(Rx_1.Observable, o); })
	            .switch()
	            .distinct(); // May be a performance hit for long running sequences.
	    };
	    ReactiveArray.prototype.whenAnyItemValue = function (property) {
	        return this.whenAnyItem(property).map(function (e) { return e.newPropertyValue; });
	    };
	    ReactiveArray.prototype.whenAnyItemObservable = function (property) {
	        return this.whenAnyItemValue(property).filter(function (o) { return o != null; }).mergeAll();
	    };
	    Object.defineProperty(ReactiveArray.prototype, "derived", {
	        get: function () {
	            return new DerivedReactiveArrayBuilder(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ReactiveArray.prototype, "computed", {
	        get: function () {
	            return new ComputedReactiveArrayBuilder(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ReactiveArray.from = function (arr) {
	        return new ReactiveArray(arr);
	    };
	    ReactiveArray.of = function () {
	        var values = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            values[_i - 0] = arguments[_i];
	        }
	        return ReactiveArray.from(values);
	    };
	    ReactiveArray.prototype.toArray = function () {
	        return this._array.slice();
	    };
	    /**
	     * Converts this reactive array into an observable stream that contains
	     * the snapshots of this array's values.
	     */
	    ReactiveArray.prototype.toObservable = function () {
	        var _this = this;
	        return this.changed.map(function (e) { return _this.toArray(); })
	            .startWith(this.toArray())
	            .publishReplay(1)
	            .refCount();
	    };
	    ReactiveArray.prototype.toJSON = function () {
	        return this.map(function (v) {
	            if (typeof v === "undefined" || v === null) {
	                return null;
	            }
	            else if (typeof v.toJSON === "function") {
	                return v.toJSON();
	            }
	            else {
	                return v;
	            }
	        }).toArray();
	    };
	    ReactiveArray.prototype.toString = function () {
	        var items = this._array.map(function (i) {
	            var type = typeof i;
	            if (type === "undefined") {
	                return "undefined";
	            }
	            else if (i === null) {
	                return "null";
	            }
	            else if (type === "string") {
	                return "'" + i + "'";
	            }
	            else {
	                return i.toString();
	            }
	        }).join(", ");
	        return "[" + items + "]";
	    };
	    return ReactiveArray;
	}(reactive_object_1.ReactiveObject));
	exports.ReactiveArray = ReactiveArray;
	var DerivedReactiveArray = (function (_super) {
	    __extends(DerivedReactiveArray, _super);
	    function DerivedReactiveArray(parent, eventSteps, arraySteps) {
	        var _this = this;
	        _super.call(this);
	        this.parent = parent;
	        this.eventSteps = eventSteps;
	        this.arraySteps = arraySteps;
	        this._trackedItems = [];
	        var e = new collection_changed_event_args_1.CollectionChangedEventArgs(this);
	        e.addedItems = parent.toArray();
	        e.addedItemsIndex = 0;
	        e.movedItems = [];
	        e.removedItems = [];
	        e.removedItemsIndex = 0;
	        this._apply(e);
	        parent.changed.subscribe(function (e) {
	            _this._apply(e);
	        });
	    }
	    DerivedReactiveArray.prototype.splice = function (start, deleteCount) {
	        var items = [];
	        for (var _i = 2; _i < arguments.length; _i++) {
	            items[_i - 2] = arguments[_i];
	        }
	        return DerivedReactiveArray._throwNotSupported();
	    };
	    DerivedReactiveArray.prototype.push = function () {
	        var items = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            items[_i - 0] = arguments[_i];
	        }
	        DerivedReactiveArray._throwNotSupported();
	    };
	    DerivedReactiveArray.prototype.pop = function () {
	        return DerivedReactiveArray._throwNotSupported();
	    };
	    DerivedReactiveArray.prototype.shift = function () {
	        return DerivedReactiveArray._throwNotSupported();
	    };
	    DerivedReactiveArray.prototype.unshift = function () {
	        var values = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            values[_i - 0] = arguments[_i];
	        }
	        return DerivedReactiveArray._throwNotSupported();
	    };
	    DerivedReactiveArray.prototype.setItem = function (index, value) {
	        DerivedReactiveArray._throwNotSupported();
	    };
	    DerivedReactiveArray._throwNotSupported = function () {
	        throw new Error("Derived arrays do not support modification. If you want support for two-way derived arrays, file an issue at https://github.com/KallynGowdy/RxUI/issues.");
	    };
	    DerivedReactiveArray.prototype._apply = function (event) {
	        var addedItems = [];
	        for (var c = 0; c < event.addedItems.length; c++) {
	            var item = event.addedItems[c];
	            var result = {
	                keep: true,
	                value: item
	            };
	            for (var i = 0; i < this.eventSteps.length; i++) {
	                result = this.eventSteps[i].transform(result.value, c, event.addedItems);
	                if (result.keep === false) {
	                    break;
	                }
	            }
	            addedItems.push(result);
	        }
	        var currentArr = this._trackedItems;
	        currentArr.splice.apply(currentArr, [event.addedItemsIndex, 0].concat(addedItems));
	        currentArr.splice(event.removedItemsIndex, event.removedItems.length);
	        var finalArr = currentArr.filter(function (t) { return t.keep; }).map(function (t) { return t.value; });
	        var final = DerivedReactiveArray._transformArray(finalArr, this.arraySteps);
	        _super.prototype.splice.apply(this, [0, this.length].concat(final));
	    };
	    /**
	     * Runs the given transform result through each of the defined steps in this object
	     * and returns the result.
	     */
	    DerivedReactiveArray._transformArray = function (initial, steps) {
	        var current = initial;
	        for (var i = 0; i < steps.length; i++) {
	            current = steps[i].transform(current);
	        }
	        return current;
	    };
	    return DerivedReactiveArray;
	}(ReactiveArray));
	var FilterTransform = (function () {
	    function FilterTransform(predicate) {
	        this.predicate = predicate;
	    }
	    FilterTransform.prototype.transform = function (value, index, arr) {
	        return {
	            value: value,
	            keep: this.predicate(value, index, arr)
	        };
	    };
	    return FilterTransform;
	}());
	var MapTransform = (function () {
	    function MapTransform(map) {
	        this.map = map;
	    }
	    MapTransform.prototype.transform = function (value, index, arr) {
	        return {
	            value: this.map(value, index, arr),
	            keep: true
	        };
	    };
	    return MapTransform;
	}());
	var SortTransform = (function () {
	    function SortTransform(compareFunction) {
	        this.compareFunction = compareFunction;
	    }
	    SortTransform.prototype.transform = function (current) {
	        return current.sort(this.compareFunction);
	    };
	    return SortTransform;
	}());
	/**
	 * Defines a class that acts as a builder for derived reactive arrays.
	 */
	var DerivedReactiveArrayBuilder = (function () {
	    function DerivedReactiveArrayBuilder(parent) {
	        this.parent = parent;
	        this.eventSteps = [];
	        this.arraySteps = [];
	    }
	    DerivedReactiveArrayBuilder.prototype.addEvent = function (transform) {
	        this.eventSteps.push(transform);
	        return this;
	    };
	    DerivedReactiveArrayBuilder.prototype.addArray = function (transform) {
	        this.arraySteps.push(transform);
	        return this;
	    };
	    DerivedReactiveArrayBuilder.prototype.filter = function (predicate) {
	        return this.addEvent(new FilterTransform(predicate));
	    };
	    DerivedReactiveArrayBuilder.prototype.map = function (transform) {
	        return this.addEvent(new MapTransform(transform));
	    };
	    DerivedReactiveArrayBuilder.prototype.sort = function (compareFunction) {
	        return this.addArray(new SortTransform(compareFunction));
	    };
	    DerivedReactiveArrayBuilder.prototype.build = function () {
	        return new DerivedReactiveArray(this.parent, this.eventSteps, this.arraySteps);
	    };
	    return DerivedReactiveArrayBuilder;
	}());
	exports.DerivedReactiveArrayBuilder = DerivedReactiveArrayBuilder;
	/**
	 * Defines a class that acts as a builder for computed observables that are based on an array.
	 */
	var ComputedReactiveArrayBuilder = (function () {
	    function ComputedReactiveArrayBuilder(parent) {
	        this.parent = parent;
	    }
	    ComputedReactiveArrayBuilder.prototype.reduce = function (callback, initialValue) {
	        var _this = this;
	        return this.parent.toObservable().map(function (arr) { return arr.reduce(function (prev, current, index, arr) { return callback(prev, current, index, _this.parent); }, initialValue); });
	    };
	    ComputedReactiveArrayBuilder.prototype.every = function (callback, thisArg) {
	        var _this = this;
	        var bound = _bindFunction(callback, thisArg);
	        return this.parent.toObservable().map(function (arr) { return arr.every(function (value, index, arr) { return bound(value, index, _this.parent); }); });
	    };
	    ComputedReactiveArrayBuilder.prototype.some = function (callback, thisArg) {
	        var _this = this;
	        var bound = _bindFunction(callback, thisArg);
	        return this.parent.toObservable().map(function (arr) { return arr.some(function (value, index, arr) { return bound(value, index, _this.parent); }); });
	    };
	    return ComputedReactiveArrayBuilder;
	}());
	exports.ComputedReactiveArrayBuilder = ComputedReactiveArrayBuilder;
	//# sourceMappingURL=reactive-array.js.map

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var event_args_1 = __webpack_require__(5);
	/**
	 * Defines a class that represents the values that changed in a collection.
	 */
	var CollectionChangedEventArgs = (function (_super) {
	    __extends(CollectionChangedEventArgs, _super);
	    function CollectionChangedEventArgs(sender) {
	        _super.call(this, sender);
	    }
	    return CollectionChangedEventArgs;
	}(event_args_1.EventArgs));
	exports.CollectionChangedEventArgs = CollectionChangedEventArgs;
	//# sourceMappingURL=collection-changed-event-args.js.map

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var event_args_1 = __webpack_require__(5);
	/**
	 * Defines a class that represents event arguments for an item that was moved.
	 */
	var MovedItemEventArgs = (function (_super) {
	    __extends(MovedItemEventArgs, _super);
	    function MovedItemEventArgs(item, before, after) {
	        _super.call(this, item);
	        this.beforeIndex = before;
	        this.afterIndex = after;
	    }
	    Object.defineProperty(MovedItemEventArgs.prototype, "item", {
	        get: function () {
	            return this.sender;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return MovedItemEventArgs;
	}(event_args_1.EventArgs));
	exports.MovedItemEventArgs = MovedItemEventArgs;
	//# sourceMappingURL=moved-item-event-args.js.map

/***/ }
/******/ ])
});
;