import {ReactiveObject} from "./reactive-object";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {CollectionChangedEventArgs} from "./events/collection-changed-event-args";
import "rxjs/add/operator/filter";

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
        var bound = callback;
        if (thisArg) {
            bound = callback.bind(thisArg);
        }
        newArr._array = this._array.map((value, index, arr) => bound(value, index, this));
        return newArr;
    }

    public filter(callback: (value: T, index?: number, array?: ReactiveArray<T>) => boolean, thisArg?: any): ReactiveArray<T> {
        var newArr = new ReactiveArray<T>();
        var bound = callback;
        if (thisArg) {
            bound = callback.bind(thisArg);
        }
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
        var bound = callback;
        if (thisArg) {
            bound = callback.bind(thisArg);
        }
        this._array.forEach((value, index, arr) => bound(value, index, this));
    }

    public get derived(): DerivedReactiveArrayBuilder<T> {
        return new DerivedReactiveArrayBuilder(this);
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
}

class DerivedReactiveArray<TIn, TOut> extends ReactiveArray<TOut> {
    constructor(private parent: ReactiveArray<TIn>, private steps: BuilderTransform[]) {
        super(DerivedReactiveArray._transform(parent.toArray(), steps));
        parent.changed.subscribe(e => {
            var arr = <ReactiveArray<TIn>>e.sender;
            var transformed = DerivedReactiveArray._transform(arr.toArray(), steps);
            super.splice.apply(this, [0, this.length, ...transformed]);
        });
    }

    public splice(start: number, deleteCount: number, ...items: TOut[]): ReactiveArray<TOut> {
        return DerivedReactiveArray.throwNotSupported();
    }

    public push(...items: TOut[]): void {
        DerivedReactiveArray.throwNotSupported();
    }

    public pop(): TOut {
        return DerivedReactiveArray.throwNotSupported();
    }

    public setItem(index: number, value: TOut): void {
        DerivedReactiveArray.throwNotSupported();
    }

    private static throwNotSupported(): any {
        throw new Error("Derived arrays do not support modification.");
    }

    /**
     * Runs the given transform result through each of the defined steps in this object
     * and returns the result.
     */
    private static _transform(initial: any[], steps: BuilderTransform[]): any[] {
        var current = initial;
        for (var i = 0; i < steps.length; i++) {
            current = steps[i].transform(current);
        }
        return current;
    }
}

interface BuilderTransform {
    transform: (current: any[]) => any[];
}

class FilterTransform<T> implements BuilderTransform {
    constructor(private predicate: (value: T, index: number, arr: T[]) => boolean) {
    }

    transform(current: any[]): any[] {
        return current.filter(this.predicate);
    }
}

class MapTransform<TIn, TOut> implements BuilderTransform {
    constructor(private map: (value: TIn, index: number, arr: TIn[]) => TOut) {
    }

    transform(current: any[]): any[] {
        return current.map(this.map);
    }
}
class SortTransform<T> implements BuilderTransform {
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
    private steps: BuilderTransform[];
    constructor(parent: ReactiveArray<T>) {
        this.parent = parent;
        this.steps = [];
    }

    private add<T>(transform: BuilderTransform): DerivedReactiveArrayBuilder<T> {
        this.steps.push(transform);
        return <DerivedReactiveArrayBuilder<T>><any>this;
    }

    public filter(predicate: (value: T, index: number, arr: T[]) => boolean): DerivedReactiveArrayBuilder<T> {
        return this.add<T>(new FilterTransform<T>(predicate));
    }

    public map<TNew>(transform: (value: T, index: number, arr: T[]) => TNew): DerivedReactiveArrayBuilder<TNew> {
        return this.add<TNew>(new MapTransform<T, TNew>(transform));
    }

    public sort(compareFunction?: (first: T, second: T) => number): DerivedReactiveArrayBuilder<T> {
        return this.add<T>(new SortTransform<T>(compareFunction));
    }

    public build(): ReactiveArray<T> {
        return new DerivedReactiveArray<any, T>(this.parent, this.steps);
    }
}
