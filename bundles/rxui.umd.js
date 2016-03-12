(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require(undefined));
	else if(typeof define === 'function' && define.amd)
		define(["rxjs/Rx"], factory);
	else if(typeof exports === 'object')
		exports["RxUI"] = factory(require("rxjs/Rx"));
	else
		root["RxUI"] = factory(root["Rx"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__) {
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
	__export(__webpack_require__(1));
	__export(__webpack_require__(3));


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Rx_1 = __webpack_require__(2);
	var property_changed_event_args_1 = __webpack_require__(3);
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
	     * Gets the value of the given property from this object.
	     * @param property The name of the property whose value should be retrieved.
	     */
	    ReactiveObject.prototype.get = function (property) {
	        return this[property] || null;
	    };
	    /**
	     * Sets the value of the given property on this object and emits the "propertyChanged" event.
	     * @param property The name of the property to change.
	     * @param value The value to give the property.
	     */
	    ReactiveObject.prototype.set = function (property, value) {
	        this[property] = value;
	        this.emitPropertyChanged(property, value);
	    };
	    /**
	     * Gets an observable that resolves with the related property changed event whenever the given property updates.
	     */
	    ReactiveObject.prototype.whenSingle = function (prop, emitCurrentVal) {
	        if (emitCurrentVal === void 0) { emitCurrentVal = false; }
	        var children = prop.split(".");
	        if (children.length === 1) {
	            var child = this;
	            var observable = child.propertyChanged.filter(function (e) {
	                console.log(e.propertyName + ":" + prop);
	                return e.propertyName == prop;
	            });
	            if (emitCurrentVal) {
	                return Rx_1.Observable.fromArray([this.createPropertyChangedEventArgs(prop, this.get(prop))]).concat(observable);
	            }
	            else {
	                return observable;
	            }
	        }
	        else {
	            // Assuming prop = "first.second.third"
	            var firstProp = children[0]; // = "first"
	            // All of the other properties = "second.third"
	            var propertiesWithoutFirst = prop.substring(firstProp.length + 1);
	            console.log("Properties without first: " + propertiesWithoutFirst);
	            // Get the object/value that is at the "first" key of this object.
	            var firstChild = this.get(firstProp);
	            if (typeof firstChild.whenSingle === "function") {
	                // Watch for changes to the "first" property on this object,
	                // and subscribe to the rest of the properties on that object.
	                // Switch between the observed values, so that only the most recent object graph
	                // property changes are observed.
	                // Store the number of times that the property has been changed at this level.
	                // This way, we can be sure about whether to emit the current value or not, based on whether
	                // we have observed 2 or more events at this level.
	                var observationCount = 0;
	                return this.whenSingle(firstProp, true).map(function (change) {
	                    var obj = change.newPropertyValue;
	                    observationCount++;
	                    return obj.whenSingle(propertiesWithoutFirst, emitCurrentVal || observationCount > 1);
	                }).switch();
	            }
	            else {
	                throw new Error("Not all of the objects in the chain of properties are Reactive Objects. Specifically, the property '" + firstProp + "', is not a Reactive Object when it should be.");
	            }
	        }
	        // child.child2.prop
	        // observe child
	        // observe child2
	        // observe prop (pipe)
	        // newChild
	        // observe newChild.child2
	        // observe prop (pipe)
	        // newChild2
	        // observe prop (pipe)
	    };
	    /**
	     * Gets an observable that resolves with the related property changed event whenever the given properties update.
	     * @param properties The names of the properties.
	     * @param map A function that, given the event arguments for the properties, maps to the desired return value.
	     */
	    ReactiveObject.prototype.whenAny = function (properties, map) {
	        var _this = this;
	        if (typeof properties === "string") {
	            return this.whenSingle(properties);
	        }
	        else {
	            var propertyList = properties;
	            var observableList = propertyList.map(function (prop) {
	                return _this.whenSingle(prop);
	            }).filter(function (o) { return o != null; });
	            if (map) {
	                return Rx_1.Observable.combineLatest.apply(Rx_1.Observable, observableList.concat([map]));
	            }
	            else {
	                return Rx_1.Observable.combineLatest.apply(Rx_1.Observable, observableList);
	            }
	        }
	    };
	    /**
	     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
	     * @param properties The names of the properties to watch.
	     * @map A function that, given the values for the properties, maps to the desired return value.
	     */
	    ReactiveObject.prototype.whenAnyValue = function (properties, map) {
	        if (typeof properties === "string") {
	            var mapFunc = map || (function () {
	                var values = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    values[_i - 0] = arguments[_i];
	                }
	                return values[0];
	            });
	            return this.whenAny(properties).map(function (e) { return mapFunc(e.newPropertyValue); });
	        }
	        else {
	            var multiMapFunc = map || (function () {
	                var values = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    values[_i - 0] = arguments[_i];
	                }
	                return values;
	            });
	            return this.whenAny(properties, function () {
	                var events = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    events[_i - 0] = arguments[_i];
	                }
	                var a = events.map(function (e) { return e.newPropertyValue; });
	                return multiMapFunc.apply(void 0, a);
	            });
	        }
	    };
	    return ReactiveObject;
	}());
	exports.ReactiveObject = ReactiveObject;


/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var event_args_1 = __webpack_require__(4);
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


/***/ },
/* 4 */
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


/***/ }
/******/ ])
});
;