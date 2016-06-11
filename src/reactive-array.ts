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

export class ReactiveArray<T> extends ReactiveObject {
    private _array: T[];
    private _changed: Subject<CollectionChangedEventArgs<T>>;

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

    public get changed(): Observable<CollectionChangedEventArgs<T>> {
        return this._changed.asObservable();
    }

    public get itemsAdded(): Observable<CollectionChangedEventArgs<T>> {
        return this.changed.filter(e => e.addedItems.length > 0);
    }

    public get itemsRemoved(): Observable<CollectionChangedEventArgs<T>> {
        return this.changed.filter(e => e.removedItems.length > 0);
    }

    public getItem(index: number): T {
        return this._array[index];
    }

    public setItem(index: number, value: T): void {
        this._array[index] = value;
    }

    public unshift(...values: T[]): void {
        this.trackPropertyChanges("length", () => {
            this._array.unshift(...values);
            this.emitArrayChanges(0, values, 0, [])
        });
    }

    public shift(): T {
        return this.trackPropertyChanges("length", () => {
            var removed = this._array.shift();
            if (typeof removed !== "undefined") {
                this.emitArrayChanges(0, [], 0, [removed]);
            }
            return removed;
        });
    }

    public push(...values: T[]): void {
        this.trackPropertyChanges("length", () => {
            this._array.push(...values);
            this.emitArrayChanges(this._array.length - values.length, values, 0, []);
        });
    }

    public pop(): T {
        return this.trackPropertyChanges("length", () => {
            var removed = this._array.pop();
            if (typeof removed !== "undefined") {
                this.emitArrayChanges(0, [], this._array.length, [removed]);
            }
            return removed;
        });
    }

    public get length(): number {
        return this._array.length;
    }

    public slice(start?: number, end?: number): ReactiveArray<T> {
        return new ReactiveArray<T>(this._array.slice(start, end));
    }

    public splice(start: number, deleteCount: number, ...items: T[]): ReactiveArray<T> {
        return this.trackPropertyChanges("length", () => {
            var deleted = this._array.splice(start, deleteCount, ...items);
            this.emitArrayChanges(start, items, start, deleted);
            return ReactiveArray.from(deleted);
        });
    }

    public sort(compareFunction?: (first: T, second: T) => number): ReactiveArray<T> {
        var newArr = new ReactiveArray<T>();
        newArr._array = this._array.sort(compareFunction);
        return newArr;
    }

    public map<TNew>(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => TNew, thisArg?: any): ReactiveArray<TNew> {
        var newArr = new ReactiveArray<TNew>();
        var bound = _bindFunction(callback, thisArg);
        newArr._array = this._array.map((value, index, arr) => bound(value, index, this));
        return newArr;
    }

    public filter(callback: (value: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): ReactiveArray<T> {
        var newArr = new ReactiveArray<T>();
        var bound = _bindFunction(callback, thisArg);
        newArr._array = this._array.filter((value, index, arr) => bound(value, index, this));
        return newArr;
    }

    public indexOf(value: T, fromIndex?: number): number {
        return this._array.indexOf(value, fromIndex);
    }

    public lastIndexOf(value: T, fromIndex: number = this.length - 1): number {
        return this._array.lastIndexOf(value, fromIndex);
    }

    public forEach(callback: (value: T, index?: number, array?: ReactiveArray<T>) => void, thisArg?: any): void {
        var bound = _bindFunction(callback, thisArg);
        this._array.forEach((value, index, arr) => bound(value, index, this));
    }

    public reduce(callback: (previousValue: T, currentValue: T, currentIndex: number, arr: ReactiveArray<T>) => T, initialValue?: T): T {
        if (typeof initialValue !== "undefined") {
            return this._array.reduce((prev, current, index) => callback(prev, current, index, this), initialValue);
        } else {
            return this._array.reduce((prev, current, index) => callback(prev, current, index, this));
        }
    }

    public every(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): boolean {
        var bound = _bindFunction(callback, thisArg);
        return this._array.every((value, index, arr) => bound(value, index, this));
    }

    public some(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): boolean {
        var bound = _bindFunction(callback, thisArg);
        return this._array.some((value, index, arr) => bound(value, index, this));
    }

    public find(callback: (element: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): T {
        var bound = _bindFunction(callback, thisArg);
        return this._array.find((value, index, arr) => bound(value, index, this));
    }

    public findIndex(callback: (element: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): number {
        var bound = _bindFunction(callback, thisArg);
        return this._array.findIndex(<any>((value, index, arr) => bound(value, index, this)));
    }

    public whenAnyItem<TProp>(property: (((vm: T) => TProp) | string)): Observable<PropertyChangedEventArgs<TProp>> {
        var derived = this.derived
            .filter(i => i != null)
            .map(i => {
                var obj = (<ReactiveObject><any>i);
                var when = obj.whenAny<TProp>(<any>property);

                // unique behavior to get the first element to be emitted
                // but never re-emitted when resubscribed to.
                return when.publish().refCount();
            })
            .build();

        return derived
            .toObservable()
            .map(o => Observable.merge(...o))
            .switch()
            .distinct(); // May be a performance hit for long running sequences.
    }

    public whenAnyItemValue<TProp>(property: (((vm: T) => TProp) | string)): Observable<TProp> {
        return this.whenAnyItem(property).map(e => e.newPropertyValue);
    }

    public whenAnyItemObservable<TProp>(property: (((vm: T) => Observable<TProp>) | string)): Observable<TProp> {
        return this.whenAnyItemValue(property).filter(o => o != null).mergeAll();
    }

    public get derived(): DerivedReactiveArrayBuilder<T> {
        return new DerivedReactiveArrayBuilder(this);
    }

    public get computed(): ComputedReactiveArrayBuilder<T> {
        return new ComputedReactiveArrayBuilder(this);
    }

    public static from<T>(arr: T[] | ReactiveArray<T>): ReactiveArray<T> {
        return new ReactiveArray<T>(arr);
    }

    public static of<T>(...values: T[]): ReactiveArray<T> {
        return ReactiveArray.from(values);
    }

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

    constructor(private parent: ReactiveArray<TIn>, private eventSteps: BuilderItemTransform[], private arraySteps: BuilderArrayTransform[]) {
        super();
        this._trackedItems = [];
        var e = new CollectionChangedEventArgs<TIn>(this);
        e.addedItems = parent.toArray();
        e.addedItemsIndex = 0;
        e.movedItems = [];
        e.removedItems = [];
        e.removedItemsIndex = 0;
        this._apply(e);
        parent.changed.subscribe(e => {
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

    private _apply(event: CollectionChangedEventArgs<TIn>): void {
        var addedItems: TransformResult[] = [];
        for (var c = 0; c < event.addedItems.length; c++) {
            var item = event.addedItems[c];
            var result: TransformResult = {
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
        currentArr.splice(event.addedItemsIndex, 0, ...addedItems);
        currentArr.splice(event.removedItemsIndex, event.removedItems.length);
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
    constructor(parent: ReactiveArray<T>) {
        this.parent = parent;
        this.eventSteps = [];
        this.arraySteps = [];
    }

    private addEvent<T>(transform: BuilderItemTransform): DerivedReactiveArrayBuilder<T> {
        this.eventSteps.push(transform);
        return <DerivedReactiveArrayBuilder<T>><any>this;
    }

    private addArray<T>(transform: BuilderArrayTransform): DerivedReactiveArrayBuilder<T> {
        this.arraySteps.push(transform);
        return <DerivedReactiveArrayBuilder<T>><any>this;
    }

    public filter(predicate: (value: T, index: number, arr: T[]) => boolean): DerivedReactiveArrayBuilder<T> {
        return this.addEvent<T>(new FilterTransform<T>(predicate));
    }

    public map<TNew>(transform: (value: T, index: number, arr: T[]) => TNew): DerivedReactiveArrayBuilder<TNew> {
        return this.addEvent<TNew>(new MapTransform<T, TNew>(transform));
    }

    public sort(compareFunction?: (first: T, second: T) => number): DerivedReactiveArrayBuilder<T> {
        return this.addArray<T>(new SortTransform<T>(compareFunction));
    }

    public build(): ReactiveArray<T> {
        return new DerivedReactiveArray<any, T>(this.parent, this.eventSteps, this.arraySteps);
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

    public reduce(callback: (previousValue: T, currentValue: T, currentIndex: number, arr: ReactiveArray<T>) => T, initialValue?: T): Observable<T> {
        return this.parent.toObservable().map(arr => arr.reduce((prev, current, index, arr) => callback(prev, current, index, this.parent), initialValue));
    }

    public every(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): Observable<boolean> {
        var bound = _bindFunction(callback, thisArg);
        return this.parent.toObservable().map(arr => arr.every((value, index, arr) => bound(value, index, this.parent)));
    }

    public some(callback: (currentValue: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): Observable<boolean> {
        var bound = _bindFunction(callback, thisArg);
        return this.parent.toObservable().map(arr => arr.some((value, index, arr) => bound(value, index, this.parent)));
    }

    public find(callback: (element: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): Observable<T> {
        var bound = _bindFunction(callback, thisArg);
        return this.parent.toObservable().map(arr => arr.find((value, index, arr) => bound(value, index, this.parent)));
    }

    public findIndex(callback: (element: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): Observable<number> {
        var bound = _bindFunction(callback, thisArg);
        return this.parent.toObservable().map(arr => arr.findIndex(<any>((value, index, arr) => bound(value, index, this.parent))));
    }
}
