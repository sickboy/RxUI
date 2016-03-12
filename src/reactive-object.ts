import {Observable, Subject, Subscription} from "rxjs/Rx";
import {PropertyChangedEventArgs} from "./events/property-changed-event-args";

/**
 * Defines a class that represents a reactive object.
 * This is the base class for View Model classes, and it implements an event system that 
 * allows notification of property changes, which is the basis of the observable pipeline.
 */
export class ReactiveObject {

    private _propertyChanged: Subject<PropertyChangedEventArgs<any>>;

    /**
     * Creates a new reactive object.
     */
    constructor() {
        this._propertyChanged = new Subject<PropertyChangedEventArgs<any>>();
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

    /**
     * Gets the value of the given property from this object.
     * @param property The name of the property whose value should be retrieved. 
     */
    public get<T>(property: string): T | any {
        return this[property];
    }

    /**
     * Sets the value of the given property on this object and emits the "propertyChanged" event.
     * @param property The name of the property to change.
     * @param value The value to give the property.
     */
    public set<T>(property: string, value: T): void {
        this[property] = value;
        this.emitPropertyChanged(property, value);
    }

    /**
     * Gets an observable that resolves with the related property changed event whenever the given property updates.
     */
    public whenSingle(prop: string, emitCurrentVal: boolean = false): Observable<PropertyChangedEventArgs<any>> {
        var children = prop.split(".");

        if (children.length === 1) {
            var child: ReactiveObject = this;
            var observable = child.propertyChanged.filter(e => {
                console.log(e.propertyName + ":" + prop);
                return e.propertyName == prop;
            });
            if(emitCurrentVal) {
                return Observable.fromArray([this.createPropertyChangedEventArgs(prop, this.get(prop))]).concat(observable);
            } else {
                return observable;
            }
        } else {
            // Assuming prop = "first.second.third"
            var firstProp = children[0]; // = "first"
            // All of the other properties = "second.third"
            var propertiesWithoutFirst = prop.substring(firstProp.length + 1);
            console.log("Properties without first: " + propertiesWithoutFirst);
            // Get the object/value that is at the "first" key of this object.
            var firstChild: ReactiveObject = this.get(firstProp);
            if (typeof firstChild.whenSingle === "function") {
                // Watch for changes to the "first" property on this object,
                // and subscribe to the rest of the properties on that object.
                // Switch between the observed values, so that only the most recent object graph
                // property changes are observed.
                
                // Store the number of times that the property has been changed at this level.
                // This way, we can be sure about whether to emit the current value or not, based on whether
                // we have observed 2 or more events at this level.
                var observationCount: number = 0;
                return this.whenSingle(firstProp, true).map(change => {
                    var obj: ReactiveObject = change.newPropertyValue;
                    
                    observationCount++;
                    return obj.whenSingle(propertiesWithoutFirst, emitCurrentVal || observationCount > 1);
                }).switch();
            } else {
                throw new Error(`Not all of the objects in the chain of properties are Reactive Objects. Specifically, the property '${firstProp}', is not a Reactive Object when it should be.`);
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

    }

    /**
     * Gets an observable that resolves with the related property changed event whenever the given property updates.
     * @param properties The name of the property.
     * @param map A function that, given the event arguments for the property, maps to the desired return values.
     */
    public whenAny<T1, TResult>(
        properties: string,
        map?: (_1: PropertyChangedEventArgs<T1>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, TResult>(
        properties: string[],
        map?: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, TResult>(
        properties: string[],
        map?: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, T4, TResult>(
        properties: string[],
        map?: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>, _4: PropertyChangedEventArgs<T4>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, T4, T5, TResult>(
        properties: string[],
        map?: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>, _4: PropertyChangedEventArgs<T4>, _5: PropertyChangedEventArgs<T5>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, T4, T5, T6, TResult>(
        properties: string[],
        map?: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>, _4: PropertyChangedEventArgs<T4>, _5: PropertyChangedEventArgs<T5>, _6: PropertyChangedEventArgs<T6>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<T1, T2, T3, T4, T5, T6, T7, TResult>(
        properties: string[],
        map?: (_1: PropertyChangedEventArgs<T1>, _2: PropertyChangedEventArgs<T2>, _3: PropertyChangedEventArgs<T3>, _4: PropertyChangedEventArgs<T4>, _5: PropertyChangedEventArgs<T5>, _6: PropertyChangedEventArgs<T6>, _7: PropertyChangedEventArgs<T7>) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>>;
    /**
     * Gets an observable that resolves with the related property changed event whenever the given properties update.
     * @param properties The names of the properties.
     * @param map A function that, given the event arguments for the properties, maps to the desired return values.
     */
    public whenAny<TResult>(
        properties: string[] | string,
        map?: (...values: PropertyChangedEventArgs<any>[]) => TResult
    ): Observable<TResult | PropertyChangedEventArgs<any>> {
        if (typeof properties === "string") {
            return this.whenSingle(properties);
        } else {
            var propertyList: string[] = <string[]>properties;

            var observableList = propertyList.map(prop => {
                console.log("Map");
                return this.whenSingle(prop);
            });
            return Observable.combineLatest(...observableList, map);
        }
    }
}