import {ReactiveObject} from "./reactive-object";

export class ReactiveArray<T> extends ReactiveObject {

    private _array: T[];

    constructor(arr?: T[] | ReactiveArray<T>) {
        super();
        var copied = arr ? arr.slice() : [];
        if (Array.isArray(copied)) {
            this._array = copied;
        } else {
            this._array = copied._array;
        }
    }

    public getItem(index: number): T {
        return this._array[index];
    }

    public push(...values: T[]): void {
        this._array.push(...values);
    }

    public pop(): T {
        return this._array.pop();
    }

    public get length(): number {
        return this._array.length;
    }

    public slice(start?: number, end?: number): ReactiveArray<T> {
        return new ReactiveArray<T>(this._array.slice(start, end));
    }

    public splice(start: number, deleteCount: number, ...items: T[]): ReactiveArray<T> {
        var deleted = this._array.splice(start, deleteCount, ...items);
        return ReactiveArray.from(deleted);
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