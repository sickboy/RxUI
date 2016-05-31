import {Observable, Subject, Subscription} from "rxjs/Rx";
import {Scheduler} from "rxjs/Scheduler";
import {PropertyChangedEventArgs} from "./events/property-changed-event-args";
import {invokeCommand} from "./operator/invoke-command";
import {ReactiveCommand} from "./reactive-command";
import {ReactivePropertyInfo} from "./reactive-property-info";
import {IViewBindingHelper} from "./view";
import "harmony-reflect";

/**
 * Defines a class that represents a reactive object.
 * This is the base class for View Model classes, and it implements an event system that 
 * allows notification of property changes, which is the basis of the observable pipeline.
 */
export class ReactiveObject {

    private static IE_FIREFOX_CHROME_PROPERTY_ERROR_REGEX: RegExp = /property\s+'(\w+)'/g;
    private static SAFARI_IOS_PROPERTY_ERROR_REGEX: RegExp = /property\s+'(\w+)'/g;
    private _propertyChanged: Subject<PropertyChangedEventArgs<any>>;

    /**
     * The property that stores all of the data stored in this object.
     */
    private __data: any;

    /**
     * Creates a new reactive object.
     */
    constructor() {
        this._propertyChanged = new Subject<PropertyChangedEventArgs<any>>();
        this.__data = {};
    }

    /**
     * Gets the observable that represents the stream of "propertyChanged" events from this object.
     */
    public get propertyChanged(): Observable<PropertyChangedEventArgs<any>> {
        return this._propertyChanged;
    }

    protected createPropertyChangedEventArgs(propertyName: string, value: any): PropertyChangedEventArgs<any> {
        return new PropertyChangedEventArgs(this, propertyName, value)
    }

    /**
     * Emits a new property changed event for the given property from this object.
     */
    protected emitPropertyChanged(propertyName: string, newPropertyValue?: any): void {
        var propValue = newPropertyValue != null ? newPropertyValue : this.get(propertyName);
        this._propertyChanged.next(this.createPropertyChangedEventArgs(propertyName, propValue));
    }

    private static get<TObj, T>(obj: TObj, property: string | ((vm: TObj) => T)): T | any {
        var evaluated = ReactiveObject.evaluateLambdaOrString(obj, property);
        if (evaluated.children.length === 1) {
            if (obj instanceof ReactiveObject) {
                return (<ReactiveObject><any>obj).__data[evaluated.property] || null;
            } else {
                return obj[evaluated.property];
            }
        } else {
            var firstProp = evaluated.children[0];
            var otherProperties = evaluated.property.substring(firstProp.length + 1);
            var firstVal = ReactiveObject.get(obj, firstProp);
            if (typeof firstVal !== "undefined") {
                if (firstVal !== null) {
                    if (typeof firstVal.get === "function") {
                        return firstVal.get(otherProperties);
                    } else {
                        var current = firstVal;
                        for (var i = 1; i < evaluated.children.length; i++) {
                            current = current[evaluated.children[i]];
                        }
                        return current;
                    }
                }
                else {
                    return null;
                }
            } else {
                return undefined;
            }
        }
    }

    /**
     * Gets the value of the given property from this object.
     * @param property The name of the property whose value should be retrieved. 
     */
    public get<T>(property: string | ((vm: this) => T)): T | any {
        return ReactiveObject.get(this, property);
    }

    private static set<TObj, T>(obj: TObj, property: string | ((vm: TObj) => T), value: T) {
        var evaluated = ReactiveObject.evaluateLambdaOrString(obj, property);
        var oldValue: T = ReactiveObject.get(obj, property);
        if (oldValue !== value) {
            if (evaluated.children.length === 1) {
                if (obj instanceof ReactiveObject) {
                    var rObj: ReactiveObject = <any>obj;
                    rObj.__data[evaluated.property] = value;
                    rObj.emitPropertyChanged(evaluated.property, value);
                } else {
                    obj[evaluated.property] = value;
                }
            } else {
                var firstProp = evaluated.children[0];
                var otherProperties = evaluated.property.substring(firstProp.length + 1);
                var firstVal = ReactiveObject.get(obj, firstProp);
                if (firstVal != null) {
                    if (typeof firstVal.set === "function") {
                        firstVal.set(otherProperties, value);
                    } else {
                        var current = firstVal;
                        for (var i = 1; i < evaluated.children.length - 1; i++) {
                            current = current[evaluated.children[i]];
                        }
                        current[evaluated.children[evaluated.children.length - 1]] = value;
                    }
                } else {
                    throw new Error("Null Reference Exception. Cannot set a child property on a null or undefined property of this object.");
                }
            }
        }
    }

    /**
     * Sets the value of the given property on this object and emits the "propertyChanged" event.
     * @param property The name of the property to change.
     * @param value The value to give the property.
     */
    public set<T>(property: string | ((vm: this) => T), value: T): void {
        ReactiveObject.set(this, property, value);
    }

    /**
     * Builds a proxy object that adds accessed property names to the given array if proxies are supported.
     * Returns null if proxies are not supported.
     */
    private static buildGhostObject(arr: string[]): any {
        function buildProxy(): Proxy {
            return new Proxy({}, {
                get(target: any, prop: string, reciever: Proxy): any {
                    arr.push(prop);
                    return buildProxy();
                }
            });
        }
        if (typeof Proxy !== 'undefined') {
            return buildProxy();
        }
        return null;
    }

    /**
     * Runs the given function against a dummy version of the given object.
     * object that builds a string that represents the properties that should be watched.
     * @param expr The function that represents the lambda expression.
     */
    private static evaluateLambdaExpression<TObj>(obj: TObj, expr: (o: TObj) => any): string {
        var path: string[] = [];
        var ghost = ReactiveObject.buildGhostObject(path);
        if (ghost) {
            expr(ghost);
        } else {
            ReactiveObject.evaluateLambdaErrors(path, expr);
        }
        return path.join(".");
    }

    private static evaluateLambdaErrors(path: string[], expr: (o: any) => any, currentObj: any = null): void {
        // Hack the errors that null reference exceptions return to retrieve property names
        // Works in IE 11, Chrome 35 and Firefox 30
        try {
            expr(currentObj);
        } catch (ex) {
            if (ex instanceof TypeError) {
                var error = <TypeError>ex;
                var propertyName: string = null;
                // We may be able to retrieve the property name from the error
                // TODO: Add Support for Mobile Safari Error Messages
                
                var match = ReactiveObject.IE_FIREFOX_CHROME_PROPERTY_ERROR_REGEX.exec(error.message);
                if (match) {
                    propertyName = match[1];
                }
                if(!propertyName) {
                    match = ReactiveObject.SAFARI_IOS_PROPERTY_ERROR_REGEX.exec(error.message);
                    if(match) {
                        propertyName = match[match.length - 1];
                    }
                }
                if(propertyName) {
                    path.push(propertyName);
                    currentObj = currentObj || {};
                    var currentPath = currentObj;
                    path.forEach((p, i) => {
                        currentPath[p] = i < path.length - 1 ? {} : null;
                        currentPath = currentPath[p];
                    });
                    ReactiveObject.evaluateLambdaErrors(path, expr, currentObj);
                    return;
                    
                }
            }
            throw ex;
        }
    }

    private static evaluateLambdaOrString<TObj>(obj: TObj, expression: string | ((o: TObj) => any)) {
        var property: string;
        if (typeof expression === "function") {
            property = ReactiveObject.evaluateLambdaExpression(obj, expression);
        } else {
            property = <string>expression;
        }
        var children = property.split(".");
        return { children, property };
    }

    private static whenSingleProp(obj: any, prop: string, emitCurrentVal: boolean = false): Observable<PropertyChangedEventArgs<any>> {
        if (obj instanceof ReactiveObject) {
            var reactive: ReactiveObject = <ReactiveObject>obj;
            var observable = reactive.propertyChanged.filter(e => {
                return e.propertyName == prop;
            });
            if (emitCurrentVal) {
                return Observable.of(reactive.createPropertyChangedEventArgs(prop, reactive.get(prop))).concat(observable);
            } else {
                return observable;
            }
        } else {
            if (obj.__viewBindingHelper) {
                var helper: IViewBindingHelper = obj.__viewBindingHelper;
                return Observable.create((observer) => {
                    return helper.observeProp(obj, prop, emitCurrentVal, e => {
                        observer.next(e);
                    });
                });
            } else {
                throw new Error("Unable to bind to objects that do not inherit from ReactiveObject or provide __viewBindingHelper");
            }
        }
    }

    private static whenSingle<TObj, TProp>(obj: TObj, expression: (((o: TObj) => TProp) | string), emitCurrentVal: boolean = false): Observable<PropertyChangedEventArgs<TProp>> {
        var evaulatedExpression = ReactiveObject.evaluateLambdaOrString(obj, expression);
        var children = evaulatedExpression.children;
        var prop = evaulatedExpression.property;
        if (children.length === 1) {
            return ReactiveObject.whenSingleProp(obj, prop, emitCurrentVal);
        } else {
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
            var observationCount: number = 0;
            return ReactiveObject.whenSingleProp(obj, firstProp, true).map(change => {
                var obj: ReactiveObject = change.newPropertyValue;
                observationCount++;
                if (obj) {
                    return ReactiveObject.whenSingle(obj, propertiesWithoutFirst, emitCurrentVal || observationCount > 1);
                } else if (emitCurrentVal) {
                    return Observable.of(change);
                } else {
                    return Observable.empty<PropertyChangedEventArgs<any>>();
                }
            }).switch();
        }
    }

    /**
     * Gets an observable that resolves with the related property changed event whenever the given property updates.
     */
    public whenSingle(expression: string | ((o: this) => any), emitCurrentVal: boolean = false): Observable<PropertyChangedEventArgs<any>> {
        return ReactiveObject.whenSingle(this, expression, emitCurrentVal);
    }

    /**
     * Gets an observable that resolves with the related property changed event whenever the given property updates.
     * @param first The name of the first property to watch.
     */
    public whenAny<T1>(
        first: string | ((o: this) => T1)
    ): Observable<PropertyChangedEventArgs<T1>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given property updates.
     * @param first The name of the first property to watch.
     * @param map A function that, given the event arguments for the property, maps to the desired return values.
     */
    public whenAny<T1, TResult>(
        first: string | ((o: this) => T1),
        map: (_1: PropertyChangedEventArgs<T1>) => TResult
    ): Observable<TResult>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     */
    public whenAny<T1, T2>(
        first: string | ((o: this) => T1),
        second: string
    ): Observable<PropertyChangedEventArgs<T1 | T2>[]>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        map: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>) => TResult
    ): Observable<TResult>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     */
    public whenAny<T1, T2, T3>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string
    ): Observable<PropertyChangedEventArgs<T1 | T2 | T3>[]>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        map: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>) => TResult
    ): Observable<TResult>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, T4>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string
    ): Observable<PropertyChangedEventArgs<T1 | T2 | T3 | T4>[]>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, T4, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string | ((o: this) => T4),
        map: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>, _4: PropertyChangedEventArgs<T4>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;

    // TODO: Add more variations
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, T4, T5, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string | ((o: this) => T4),
        fifth: string | ((o: this) => T5),
        map: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>, _4: PropertyChangedEventArgs<T4>, _5: PropertyChangedEventArgs<T5>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, T4, T5, T6, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string | ((o: this) => T4),
        fifth: string | ((o: this) => T5),
        sixth: string | ((o: this) => T6),
        map: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>, _4: PropertyChangedEventArgs<T4>, _5: PropertyChangedEventArgs<T5>, _6: PropertyChangedEventArgs<T6>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, T4, T5, T6, T7, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string | ((o: this) => T4),
        fifth: string | ((o: this) => T5),
        sixth: string | ((o: this) => T6),
        seventh: string | ((o: this) => T7),
        map: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>, _4: PropertyChangedEventArgs<T4>, _5: PropertyChangedEventArgs<T5>, _6: PropertyChangedEventArgs<T6>, _7: PropertyChangedEventArgs<T7>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<TResult>(
        ...args: (((o: this) => any) | string | ((...a: PropertyChangedEventArgs<any>[]) => TResult))[]
    ): Observable<TResult | PropertyChangedEventArgs<any>> {
        var finalProperties: string[] = [];
        var map: Function = this.getMapFunction(args);

        function iterateProperties(properties: any[]) {
            properties.forEach((p, i) => {
                var type = typeof p;
                if (type === "string" || type === "function") {
                    finalProperties.push(p);
                } else if (Array.isArray(p)) {
                    iterateProperties(p);
                }
            });
        }
        iterateProperties(map ? args.slice(0, args.length - 1) : args);
        var observableList = finalProperties.map(prop => {
            return this.whenSingle(prop);
        }).filter(o => o != null);
        if (map) {
            return Observable.combineLatest<TResult>(...observableList, map);
        } else {
            return Observable.combineLatest(...observableList, (...events: PropertyChangedEventArgs<any>[]): any => {
                if (events.length == 1) {
                    return events[0];
                } else {
                    return events;
                }
            });
        }
    }

    private getMapFunction(values: any[]): Function {
        var mapFunction: Function = null;
        var lastArg: any = values[values.length - 1];
        if (values.length > 1 && typeof lastArg === "function") {
            mapFunction = lastArg;
        }
        return mapFunction;
    }

    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     */
    public whenAnyValue<T1>(
        first: string | ((o: this) => T1)
    ): Observable<T1>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, TResult>(
        first: string | ((o: this) => T1),
        map: (_1: T1) => TResult
    ): Observable<TResult>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @param map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, T2>(
        first: string | ((o: this) => T1),
        second: string
    ): Observable<(T1 | T2)[]>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @param map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, T2, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        map: (_1: T1, _2: T2) => TResult
    ): Observable<TResult>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, T2, T3>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string
    ): Observable<(T1 | T2 | T3)[]>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, T2, T3, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        map: (_1: T1, _2: T2, _3: T3) => TResult
    ): Observable<TResult>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, T2, T3, T4>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string
    ): Observable<(T1 | T2 | T3 | T4)[]>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, T2, T3, T4, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string | ((o: this) => T4),
        map: (_1: T1, _2: T2, _3: T3, _4: T4) => TResult
    ): Observable<TResult>;

    // TODO: add more method alternatives

    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, T2, T3, T4, T5, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string | ((o: this) => T4),
        fifth: string | ((o: this) => T5),
        map: (_1: T1, _2: T2, _3: T3, _4: T4, _5: T5) => TResult
    ): Observable<TResult>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, T2, T3, T4, T5, T6, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string | ((o: this) => T4),
        fifth: string | ((o: this) => T5),
        sixth: string | ((o: this) => T6),
        map: (_1: T1, _2: T2, _3: T3, _4: T4, _5: T5, _6: T6) => TResult
    ): Observable<TResult>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<T1, T2, T3, T4, T5, T6, T7, TResult>(
        first: string | ((o: this) => T1),
        second: string | ((o: this) => T2),
        third: string | ((o: this) => T3),
        fourth: string | ((o: this) => T4),
        fifth: string | ((o: this) => T5),
        sixth: string | ((o: this) => T6),
        seventh: string | ((o: this) => T7),
        map: (_1: T1, _2: T2, _3: T3, _4: T4, _5: T5, _6: T6, _7: T7) => TResult
    ): Observable<TResult>;
    /**
     * Gets an observable that resolves with the related property value(s) whenever the given properties update.
     * @map A function that, given the values for the properties, maps to the desired return value.
     */
    public whenAnyValue<TResult>(
        ...args: (((o: this) => any) | string | ((...a: any[]) => TResult))[]
    ): Observable<TResult> {
        var mapFunction = this.getMapFunction(args);
        var whenAnyArgs: any = mapFunction ? args.slice(0, args.length - 1) : args;
        var whenAny = this.whenAny.bind(this);
        return whenAny(...whenAnyArgs, (...events: PropertyChangedEventArgs<any>[]) => {
            var eventValues = events.map(e => e.newPropertyValue);
            if (mapFunction) {
                return mapFunction(...eventValues);
            } else if (eventValues.length == 1) {
                return eventValues[0];
            } else {
                return eventValues;
            }
        });
    }

    /**
     * Binds the specified property on this object to the specified property on the given other object.
     * @param view The view whose property should be bound to one of this object's properties.
     * @param viewModelProp A function that maps this object to the property that should be bound to the view. Alternatively, a string can be used to point out the property.
     * @param viewProp A function that maps the view to the property that should be bound to this object. Alternatively, a string can be used. 
     * @param scheduler The scheduler that changes to the properties should be observed on.
     */
    public bind<TView, TViewModelProp, TViewProp>(
        view: TView,
        viewModelProp: (((o: this) => TViewModelProp) | string),
        viewProp: (((o: TView) => TViewProp) | string),
        scheduler?: Scheduler
    ): Subscription {
        // Changes to the view and view model need to be consolidated
        // and mapped so that we can figure out two things:
        // 1. Whether the change is comming from the view model or the view.
        // 2. Whether the value changed, or if it is feedback from already propagating a change.

        var viewChanges = ReactiveObject.whenSingle(view, viewProp).map(c => ({
            fromVm: false,
            value: c.newPropertyValue
        }));
        var viewModelChanges = this.whenAny(viewModelProp).map(c => ({
            fromVm: true,
            value: c.newPropertyValue
        }));
        var changes = Observable.merge(viewChanges, viewModelChanges)
            .distinctUntilChanged(c => c.value)

            // Make sure that the view model's value is piped to the
            // view at first.
            .startWith({
                fromVm: true,
                value: this.get<TViewModelProp>(viewModelProp)
            });

        // TODO: Add support for error handling
        return changes.subscribe(c => {
            if (c.fromVm) {
                // set property on view
                ReactiveObject.set(view, viewProp, c.value);
            } else {
                // set property on view model
                this.set(viewModelProp, c.value);
            }
        });
    }

    /**
     * Propagates values from the specified property on this object to the specified property on the given view object.
     * @param view The object that should be bound to this object.
     * @param viewModelProp The property on this object that should set to the other property.
     * @param viewProp The property on the view object that should recieve values from the other property.
     * @return Subscription
     */
    public oneWayBind<TView, TViewModelProp, TViewProp>(
        view: TView,
        viewModelProp: (((o: this) => TViewModelProp) | string),
        viewProp: (((o: TView) => TViewProp) | string),
        scheduler?: Scheduler
    ): Subscription {
        var viewModelChanges = this.whenAny(viewModelProp).map(c => ({
            fromVm: true,
            value: c.newPropertyValue
        }));
        var changes = Observable.merge(viewModelChanges)
            .distinctUntilChanged(c => c.value)

            // Make sure that the view model's value is piped to the
            // view at first.
            .startWith({
                fromVm: true,
                value: this.get<TViewModelProp>(viewModelProp)
            });

        // TODO: Add support for error handling
        return changes.subscribe(c => {
            if (c.fromVm) {
                // set property on view
                ReactiveObject.set(view, viewProp, c.value);
            }
        });
    }

    /**
     * Binds values recieved from the given observable to the specified property on the given object.
     * @param observable The Observable object whose values should be piped to the specified property.
     * @param view The object that the values should be piped to.
     * @param viewProp The property on the object that the values should be piped to.
     */
    public static bindObservable<TObserved, TView, TViewProp>(
        observable: Observable<TObserved>,
        view: TView,
        viewProp: (((o: TView) => TViewProp) | string),
        scheduler?: Scheduler): Subscription {
        return observable.subscribe(value => {
            ReactiveObject.set(view, viewProp, <any>value);
        });
    }

    public when<T>(observable: string | Observable<T>): Observable<T> {
        if (typeof observable === "string") {
            return this.whenSingle(observable, true).map(e => <Observable<T>>e.newPropertyValue).switch();
        } else {
            return observable;
        }
    }

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
    public invokeCommandWhen<T>(observable: string | Observable<any>, command: string | ReactiveCommand<any, T>): Observable<T> {
        return invokeCommand(this.when(observable), this, command);
    }
}