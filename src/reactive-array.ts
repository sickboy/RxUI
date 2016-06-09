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

    public static from<T>(arr: T[] | ReactiveArray<T>): ReactiveArray<T> {
        return new ReactiveArray<T>(arr);
    }

    public static of<T>(...values: T[]): ReactiveArray<T> {
        return ReactiveArray.from(values);
    }
}