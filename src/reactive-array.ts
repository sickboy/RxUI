import {ReactiveObject} from "./reactive-object";
import {Observable, Subject} from "rxjs/Rx";
import {CollectionChangedEventArgs} from "./events/collection-changed-event-args";
import {PropertyChangedEventArgs} from "./events/property-changed-event-args";

// Array.find polyfill
if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

// Array.findIndex polyfill
if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function (predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.findIndex called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return i;
            }
        }
        return -1;
    };
}

function _bindFunction<TFunction extends Function>(fn: TFunction, thisArg: any): TFunction {
    var bound = fn;
    if (thisArg) {
        bound = fn.bind(thisArg);
    }
    return bound;
}

/**
 * Defines a class that provides powerful observable functionality
 * around a traditional array.
 */
export class ReactiveArray<T> extends ReactiveObject {
    private _array: T[];
    private _changed: Subject<CollectionChangedEventArgs<T>>;

    /**
     * Creates a new ReactiveArray.
     * Optionally copies the values from the given array.
     * @param arr The array that should be used to create this array.
     */
    constructor(arr?: T[] | ReactiveArray<T>) {
        super();
        this._changed = new Subject<CollectionChangedEventArgs<T>>();
        var copied = arr ? arr.slice() : [];
        if (Array.isArray(copied)) {
            this._array = copied;
        } else {
            this._array = copied._array;
        }
    }

    private emitArrayChanges(addStartIndex: number, addedItems: T[], deleteStartIndex: number, deletedItems: T[]): void {
        if (addedItems.length > 0 || deletedItems.length > 0) {
            var e = new CollectionChangedEventArgs<T>(this);
            e.addedItems = addedItems.slice();
            e.addedItemsIndex = addStartIndex;
            e.removedItems = deletedItems.slice();
            e.removedItemsIndex = deleteStartIndex;
            this._changed.next(e);
        }
    }

    /**
     * Gets an observable that resolves whenever the array changes.
     * Note that changes are only observed for the ReactiveArray itself.
     * This means that only operations such as push(), pop(), splice(), shift(), and unshift()
     * emit changed() events.
     */
    public get changed(): Observable<CollectionChangedEventArgs<T>> {
        return this._changed.asObservable();
    }

    /**
     * Gets an observable that resolves whenever a new item is added to the array.
     */
    public get itemsAdded(): Observable<CollectionChangedEventArgs<T>> {
        return this.changed.filter(e => e.addedItems.length > 0);
    }

    /**
     * Gets an observable that resolves whenever a item is removed from the array.
     */
    public get itemsRemoved(): Observable<CollectionChangedEventArgs<T>> {
        return this.changed.filter(e => e.removedItems.length > 0);
    }

    /**
     * Gets the item at the given index in the array.
     */
    public getItem(index: number): T {
        return this._array[index];
    }

    /**
     * Sets the value of the given index to the given item in the array.
     */
    public setItem(index: number, value: T): void {
        this._array[index] = value;
    }

    /**
     * Adds each of the given arguments to the beginning of this array.
     * @param values The values that should be added to the array. 
     */
    public unshift(...values: T[]): void {
        this.trackPropertyChanges("length", () => {
            this._array.unshift(...values);
            this.emitArrayChanges(0, values, 0, [])
        });
    }

    /**
     * Removes a single item from the beginning of this array and returns it.
     */
    public shift(): T {
        return this.trackPropertyChanges("length", () => {
            var removed = this._array.shift();
            if (typeof removed !== "undefined") {
                this.emitArrayChanges(0, [], 0, [removed]);
            }
            return removed;
        });
    }

    /**
     * Adds each of the given arguments to the end of this array.
     * @param values The values that should be added to the array.
     */
    public push(...values: T[]): void {
        this.trackPropertyChanges("length", () => {
            this._array.push(...values);
            this.emitArrayChanges(this._array.length - values.length, values, 0, []);
        });
    }

    /**
     * Removes a single item from the end of this array and returns it. 
     */
    public pop(): T {
        return this.trackPropertyChanges("length", () => {
            var removed = this._array.pop();
            if (typeof removed !== "undefined") {
                this.emitArrayChanges(0, [], this._array.length, [removed]);
            }
            return removed;
        });
    }

    /**
     * Gets the number of items that are currently stored in the array.
     */
    public get length(): number {
        return this._array.length;
    }

    /**
     * Creates a new ReactiveArray from the given subset of this array.
     * @param start If specified, marks the index of the first element that should be included in the new array.
     * @param end If specified, marks the index of the last element that should be included in the new array.
     */
    public slice(start?: number, end?: number): ReactiveArray<T> {
        return new ReactiveArray<T>(this._array.slice(start, end));
    }

    /**
     * Changes the contents of this array by removing a specified number of elements
     * at the given index, and optionally inserting any number of items in their place.
     * @param start The index that the array should be changed at.
     * @param deleteCount The number of items that should be deleted from the start index.
     * @param items The items that should be inserted at the start index.  
     */
    public splice(start: number, deleteCount: number, ...items: T[]): ReactiveArray<T> {
        return this.trackPropertyChanges("length", () => {
            var deleted = this._array.splice(start, deleteCount, ...items);
            this.emitArrayChanges(start, items, start, deleted);
            return ReactiveArray.from(deleted);
        });
    }

    /**
     * Sorts the array, optionally using the given comparator to determin the sort order of each element, and returns 
     * a new ReactiveArray that represents the reorded items.
     * @param compareFunction If specified, determines the relative sort order between two given elements in the array.
     *                        If omitted, elements are sorted by the sort order of the numerical representation of their toString() unicode code points.
     */
    public sort(compareFunction?: (first: T, second: T) => number): ReactiveArray<T> {
        var newArr = new ReactiveArray<T>();
        newArr._array = this._array.sort(compareFunction);
        return newArr;
    }

    /**
     * Produces a new ReactiveArray from this array where each element from this array has been transformed by the given callback function.
     * elements.
     * @param callback A function that, given an element, index, and the containing array, produces a new value for the element at that index.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public map<TNew>(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => TNew, thisArg?: any): ReactiveArray<TNew> {
        var newArr = new ReactiveArray<TNew>();
        var bound = _bindFunction(callback, thisArg);
        newArr._array = this._array.map((value, index, arr) => bound(value, index, this));
        return newArr;
    }

    /**
     * Produces a new ReactiveArray from this array where only elements that passed the given predicate callback function from this array
     * are included in the new array.
     * @param callback A function that, given an element, index, and the containing array, produces `true` if the value should be included 
     *                 in the new array, or `false` if it should be omitted.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public filter(callback: (value: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): ReactiveArray<T> {
        var newArr = new ReactiveArray<T>();
        var bound = _bindFunction(callback, thisArg);
        newArr._array = this._array.filter((value, index, arr) => bound(value, index, this));
        return newArr;
    }

    /**
     * Returns the index of the first element in this array that equals the given value.
     * Returns -1 if no element in the array equals the given value.
     * @param value The value that the array should be searched for.
     * @param fromIndex Optional. The lower-bound index that the search should begin from. 
     */
    public indexOf(value: T, fromIndex?: number): number {
        return this._array.indexOf(value, fromIndex);
    }

    /**
     * Returns the index of the last element in this array that equals the given value.
     * Returns -1 if no element in the array equals the given value.
     * @param value The value that the array should be searched for.
     * @param fromIndex The upper-bound index that the search should begin from.
     */
    public lastIndexOf(value: T, fromIndex: number = this.length - 1): number {
        return this._array.lastIndexOf(value, fromIndex);
    }

    /**
     * Iterates over each of the elements in this array and executes the given callback function on each of them.
     * @param callback A function that, given an element, index, and the containing array, performs an operation.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public forEach(callback: (value: T, index?: number, array?: ReactiveArray<T>) => void, thisArg?: any): void {
        var bound = _bindFunction(callback, thisArg);
        this._array.forEach((value, index, arr) => bound(value, index, this));
    }

    /**
     * Applies the given accumulator callback function across each of the elements in the array and returns the final value from the chain.
     * @param callback A function that, given two values, index and the containing array, produces a value.
     * @param initialValue Optional. The value that should be used as the `previousValue` in the given callback function for the first index.
     */
    public reduce(callback: (previousValue: T, currentValue: T, currentIndex: number, arr: ReactiveArray<T>) => T, initialValue?: T): T {
        if (typeof initialValue !== "undefined") {
            return this._array.reduce((prev, current, index) => callback(prev, current, index, this), initialValue);
        } else {
            return this._array.reduce((prev, current, index) => callback(prev, current, index, this));
        }
    }

    /**
     * Determines whether every value in the array passes the given predicate callback function.
     * @param callback A function that, given an element, index, and the containing array, produces a predicate value.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public every(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): boolean {
        var bound = _bindFunction(callback, thisArg);
        return this._array.every((value, index, arr) => bound(value, index, this));
    }

    /**
     * Determines whether at least one value in the array passes the given predicate callback function.
     * @param callback A function that, given an element, index, and the containing array, produces a predicate value.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public some(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): boolean {
        var bound = _bindFunction(callback, thisArg);
        return this._array.some((value, index, arr) => bound(value, index, this));
    }

    /**
     * Returns the first element in the array that passes the given predicate callback function.
     * If no element passes the callback, undefined is returned.
     * @param callback A function that, given an element, index, and the containing array, produces a predicate value.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public find(callback: (element: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): T {
        var bound = _bindFunction(callback, thisArg);
        return this._array.find((value, index, arr) => bound(value, index, this));
    }

    /**
     * Returns the index of the first element in the array that passes the given predicate callback function.
     * If no element passes the callback, -1 is returned.
     * @param callback A function that, given an element, index, and the containing array, produces a predicate value.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public findIndex(callback: (element: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): number {
        var bound = _bindFunction(callback, thisArg);
        return this._array.findIndex(<any>((value, index, arr) => bound(value, index, this)));
    }

    /**
     * Gets a cold observable that resolves with the PropertyChangedEventArgs of any item in the array when
     * the specified property changes any item.
     * @param property The name of the property that should be watched on each item in the array.  
     */
    public whenAnyItem<TProp>(property: (((vm: T) => TProp) | string)): Observable<PropertyChangedEventArgs<TProp>> {
        var derived = this.derived
            .filter(i => i != null)
            .map(i => {
                var obj = (<ReactiveObject><any>i);
                var when = obj.whenAny<TProp>(<any>property);

                // unique behavior to get the first element to be emitted
                // but never re-emitted when resubscribed to.
                return when.publish().refCount();
            }).build();

        return derived
            .toObservable()
            .map(o => Observable.merge(...o))
            .switch()
            .distinct(); // May be a performance hit for long running sequences.
    }

    /**
     * Gets a cold observable that resolves when any property on any item in the array
     * changes.
     */
    public whenAnyItemProperty(): Observable<PropertyChangedEventArgs<any>> {
        var derived = this.derived
            .filter(i => i != null)
            .map(i => {
                var obj = (<ReactiveObject><any>i);
                var when = obj.propertyChanged;
                return when.publish().refCount();
            }).build();
        return derived
            .toObservable()
            .map(o => Observable.merge(...o))
            .switch()
            .distinct(); // May be a performance hit for long running sequences.
    }

    /**
     * Gets a cold observable that resolves with the specified property value of any item in the array when
     * the property changes on any item.
     * @param property The name of the property that should be watched on each item in the array.
     */
    public whenAnyItemValue<TProp>(property: (((vm: T) => TProp) | string)): Observable<TProp> {
        return this.whenAnyItem(property).map(e => e.newPropertyValue);
    }

    /**
     * Gets a cold observable that resolves with the values from the observables from the specified property
     * on all of the items in the array.
     * @param properth The name of the property that should be watched.
     */
    public whenAnyItemObservable<TProp>(property: (((vm: T) => Observable<TProp>) | string)): Observable<TProp> {
        return this.whenAnyItemValue(property).filter(o => o != null).mergeAll();
    }

    /**
     * Gets a new builder object that can be used to create a child array from this array that tracks the changes made to this array.
     */
    public get derived(): DerivedReactiveArrayBuilder<T> {
        return new DerivedReactiveArrayBuilder(this);
    }

    /**
     * Gets a new builder object that can be used to create an observable that calculates a single value
     * from this array. 
     */
    public get computed(): ComputedReactiveArrayBuilder<T> {
        return new ComputedReactiveArrayBuilder(this);
    }

    /**
     * Creates a new ReactiveArray from the given array.
     * @param arr The array that should be converted into a ReactiveArray.
     */
    public static from<T>(arr: T[] | ReactiveArray<T>): ReactiveArray<T> {
        return new ReactiveArray<T>(arr);
    }

    /**
     * Creates a new ReactiveArray from the given arguments.
     * @param values The values that should be in the array.
     */
    public static of<T>(...values: T[]): ReactiveArray<T> {
        return ReactiveArray.from(values);
    }

    /**
     * Converts this ReactiveArray into a traditional JavaScript array object.
     */
    public toArray(): T[] {
        return this._array.slice();
    }

    /**
     * Converts this reactive array into an observable stream that contains
     * the snapshots of this array's values.
     */
    public toObservable(): Observable<T[]> {
        return this.changed.map(e => this.toArray())
            .startWith(this.toArray())
            .publishReplay(1)
            .refCount();
    }

    /**
     * Gets the JSON object that represents the values in this array.
     */
    public toJSON(): any {
        return this.map((v: any) => {
            if (typeof v === "undefined" || v === null) {
                return null;
            } else if (typeof v.toJSON === "function") {
                return v.toJSON();
            } else {
                return v;
            }
        }).toArray();
    }

    /**
     * Gets the string representation of this ReactiveArray.
     */
    public toString(): string {
        var items = this._array.map(i => {
            var type = typeof i;
            if (type === "undefined") {
                return "undefined";
            } else if (i === null) {
                return "null";
            } else if (type === "string") {
                return `'${i}'`;
            } else {
                return i.toString();
            }
        }).join(", ");
        return `[${items}]`
    }
}

class DerivedReactiveArray<TIn, TOut> extends ReactiveArray<TOut> {
    private _trackedItems: TransformResult[];

    constructor(private parent: ReactiveArray<TIn>, private triggers: Observable<CollectionChangedEventArgs<TIn>>[], private eventSteps: BuilderItemTransform[], private arraySteps: BuilderArrayTransform[]) {
        super();
        this._trackedItems = [];
        var e = new CollectionChangedEventArgs<TIn>(this);
        e.addedItems = parent.toArray();
        e.addedItemsIndex = 0;
        e.movedItems = [];
        e.removedItems = [];
        e.removedItemsIndex = 0;
        this._apply(e);
        Observable.merge(parent.changed, ...triggers).subscribe(e => {
            this._apply(e);
        });
    }

    public splice(start: number, deleteCount: number, ...items: TOut[]): ReactiveArray<TOut> {
        return DerivedReactiveArray._throwNotSupported();
    }

    public push(...items: TOut[]): void {
        DerivedReactiveArray._throwNotSupported();
    }

    public pop(): TOut {
        return DerivedReactiveArray._throwNotSupported();
    }

    public shift(): TOut {
        return DerivedReactiveArray._throwNotSupported();
    }

    public unshift(...values: TOut[]): void {
        return DerivedReactiveArray._throwNotSupported();
    }

    public setItem(index: number, value: TOut): void {
        DerivedReactiveArray._throwNotSupported();
    }

    private static _throwNotSupported(): any {
        throw new Error("Derived arrays do not support modification. If you want support for two-way derived arrays, file an issue at https://github.com/KallynGowdy/RxUI/issues.");
    }

    private _applyItem(item: TIn, index: number, arr: TIn[]): TransformResult {
        var result: TransformResult = {
            keep: true,
            value: item
        };
        for (var i = 0; i < this.eventSteps.length; i++) {
            result = this.eventSteps[i].transform(result.value, index, arr);
            if (result.keep === false) {
                break;
            }
        }
        return result;
    }

    private _apply(event: CollectionChangedEventArgs<TIn>): void {
        var addedItems: TransformResult[] = [];
        for (var c = 0; c < event.addedItems.length; c++) {
            var item = event.addedItems[c];
            var result = this._applyItem(item, c, event.addedItems);
            addedItems.push(result);
        }
        var currentArr = this._trackedItems;
        currentArr.splice(event.removedItemsIndex, event.removedItems.length);
        currentArr.splice(event.addedItemsIndex, 0, ...addedItems);
        var finalArr = currentArr.filter(t => t.keep).map(t => t.value);
        var final = DerivedReactiveArray._transformArray(finalArr, this.arraySteps);
        super.splice.apply(this, [0, this.length, ...final]);
    }

    /**
     * Runs the given transform result through each of the defined steps in this object
     * and returns the result.
     */
    private static _transformArray(initial: any[], steps: BuilderArrayTransform[]): any[] {
        var current = initial;
        for (var i = 0; i < steps.length; i++) {
            current = steps[i].transform(current);
        }
        return current;
    }
}

interface TransformResult {
    value: any;
    keep: boolean;
}

/**
 * Transforms that run on individual items in the array.
 */
interface BuilderItemTransform {
    transform: (value: any, index: number, arry: any[]) => TransformResult;
}

/**
 * Transforms that run on the entire compiled array.
 */
interface BuilderArrayTransform {
    transform: (arr: any[]) => any[];
}

class FilterTransform<T> implements BuilderItemTransform {
    constructor(private predicate: (value: T, index: number, arr: T[]) => boolean) {
    }

    transform(value: any, index: number, arr: any[]): TransformResult {
        return {
            value: value,
            keep: this.predicate(value, index, arr)
        };
    }
}

class MapTransform<TIn, TOut> implements BuilderItemTransform {
    constructor(private map: (value: TIn, index: number, arr: TIn[]) => TOut) {
    }

    transform(value: any, index: number, arr: any[]): TransformResult {
        return {
            value: this.map(value, index, arr),
            keep: true
        };
    }
}

class SortTransform<T> implements BuilderArrayTransform {
    constructor(private compareFunction: (first: T, second: T) => number) {
    }

    transform(current: any[]): any[] {
        return current.sort(this.compareFunction);
    }
}

/**
 * Defines a class that acts as a builder for derived reactive arrays.
 */
export class DerivedReactiveArrayBuilder<T> {
    private parent: ReactiveArray<T>;
    private eventSteps: BuilderItemTransform[];
    private arraySteps: BuilderArrayTransform[];
    private triggers: Observable<CollectionChangedEventArgs<T>>[];
    constructor(parent: ReactiveArray<T>) {
        this.parent = parent;
        this.eventSteps = [];
        this.arraySteps = [];
        this.triggers = [];
    }

    private addEvent<T>(transform: BuilderItemTransform): DerivedReactiveArrayBuilder<T> {
        this.eventSteps.push(transform);
        return <DerivedReactiveArrayBuilder<T>><any>this;
    }

    private addArray<T>(transform: BuilderArrayTransform): DerivedReactiveArrayBuilder<T> {
        this.arraySteps.push(transform);
        return <DerivedReactiveArrayBuilder<T>><any>this;
    }

    /**
     * Instructs the child reactive array to trigger updates when one of the given properties on the parent array
     * has changed.
     * @param properties The list of properties that should be watched on the items in the parent array.
     */
    public whenAnyItem<TProp>(...properties: (string | ((obj: T) => TProp))[]): DerivedReactiveArrayBuilder<T> {
        var mapped = Observable.merge(...properties.map(p =>
            this.parent.whenAnyItem(p)
                .map(e => ({
                    sender: e.sender,
                    propertyName: e.propertyName,
                    newPropertyValue: e.newPropertyValue,
                    index: this.parent.indexOf(e.sender)
                }))));

        var triggers = mapped.map(e => {
            var args = new CollectionChangedEventArgs<T>(this);
            args.addedItems = [e.sender];
            args.addedItemsIndex = e.index;
            args.removedItems = [e.sender];
            args.removedItemsIndex = e.index;
            return args;
        });
        this.triggers.push(triggers);
        return this;
    }

    /**
     * Instructs the child reactive array to trigger updates when any property on one of the items from the parent
     * array has changed.
     */
    public whenAnyItemProperty(): DerivedReactiveArrayBuilder<T> {
        var mapped = this.parent.whenAnyItemProperty()
            .map(e => ({
                sender: e.sender,
                propertyName: e.propertyName,
                newPropertyValue: e.newPropertyValue,
                index: this.parent.indexOf(e.sender)
            }));
        var trigger = mapped.map(e => {
            var args = new CollectionChangedEventArgs<T>(this);
            args.addedItems = [e.sender];
            args.addedItemsIndex = e.index;
            args.removedItems = [e.sender];
            args.removedItemsIndex = e.index;
            return args;
        });
        this.triggers.push(trigger);
        return this;
    }

    /**
     * Filters elements from the parent array so that only elements that pass the given
     * predicate function will appear in the child array.
     * @param predicate A function that, given an element, index, and containing array, returns whether the value should be piped to the child array.
     */
    public filter(predicate: (value: T, index: number, arr: T[]) => boolean): DerivedReactiveArrayBuilder<T> {
        return this.addEvent<T>(new FilterTransform<T>(predicate));
    }

    /**
     * Transforms elements from the parent array into the child array.
     * @param transform A function that, given an element, index, and containing array, returns the value that should be piped to the child array.
     */
    public map<TNew>(transform: (value: T, index: number, arr: T[]) => TNew): DerivedReactiveArrayBuilder<TNew> {
        return this.addEvent<TNew>(new MapTransform<T, TNew>(transform));
    }

    /**
     * Sorts the child array whenever a change is piped from the parent array into it.
     * @param compareFunction Optional. A function that, given two values, returns the relative sort order of those two values.
     *                        If omitted, the values will be sorted according to the default Array.prototype.sort() behavior.  
     */
    public sort(compareFunction?: (first: T, second: T) => number): DerivedReactiveArrayBuilder<T> {
        return this.addArray<T>(new SortTransform<T>(compareFunction));
    }

    /**
     * Creates a new child array according to the rules previously defined with this builder object and returns it.
     * Currently, derived reactive arrays do not support direct modification via push(), pop(), splice(), etc.
     */
    public build(): ReactiveArray<T> {
        return new DerivedReactiveArray<any, T>(this.parent, this.triggers, this.eventSteps, this.arraySteps);
    }
}

/**
 * Defines a class that acts as a builder for computed observables that are based on an array.
 */
export class ComputedReactiveArrayBuilder<T> {
    private parent: ReactiveArray<T>;
    constructor(parent: ReactiveArray<T>) {
        this.parent = parent;
    }

    /**
     * Applies the given accumulator callback function whenever a change is observed in the array
     * and pipes the resulting values via the returned observable object.
     * @param callback A function that, given two values, index and the containing array, produces a value.
     * @param initialValue Optional. The value that should be used as the `previousValue` in the given callback function for the first index.
     */
    public reduce(callback: (previousValue: T, currentValue: T, currentIndex: number, arr: ReactiveArray<T>) => T, initialValue?: T): Observable<T> {
        return this.parent.toObservable().map(arr => arr.reduce((prev, current, index, arr) => callback(prev, current, index, this.parent), initialValue));
    }

    /**
     * Determines whether every element in the array passes the given predicate function whenever a change is observed in the array
     * and pipes the resulting values via the the returned observable object.
     * @param callback A function that, given an element, index, and the containing array, produces a predicate value.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public every(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): Observable<boolean> {
        var bound = _bindFunction(callback, thisArg);
        return this.parent.toObservable().map(arr => arr.every((value, index, arr) => bound(value, index, this.parent)));
    }

    /**
     * Determines whether at least one value in the array passes the given predicate callback function whenever a change is observed in the array 
     * and pipes the resulting values via the returned observable object.
     * @param callback A function that, given an element, index, and the containing array, produces a predicate value.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public some(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): Observable<boolean> {
        var bound = _bindFunction(callback, thisArg);
        return this.parent.toObservable().map(arr => arr.some((value, index, arr) => bound(value, index, this.parent)));
    }
    /**
     * Returns the first element in the array that passes the given predicate callback function whenever a change is observed in the array
     * and pipes the resulting values via the returned observable object.
     * If no element passes the callback, undefined is returned.
     * @param callback A function that, given an element, index, and the containing array, produces a predicate value.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public find(callback: (element: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): Observable<T> {
        var bound = _bindFunction(callback, thisArg);
        return this.parent.toObservable().map(arr => arr.find((value, index, arr) => bound(value, index, this.parent)));
    }
    /**
     * Returns the index of the first element in the array that passes the given predicate callback function whenever a change is observed
     * in the array and pipes the resulting values via the returned observable object.
     * If no element passes the callback, -1 is returned.
     * @param callback A function that, given an element, index, and the containing array, produces a predicate value.
     * @param thisArg Optional. The value that should be used as `this` when executing the given callback function.
     */
    public findIndex(callback: (element: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): Observable<number> {
        var bound = _bindFunction(callback, thisArg);
        return this.parent.toObservable().map(arr => arr.findIndex(<any>((value, index, arr) => bound(value, index, this.parent))));
    }
}
