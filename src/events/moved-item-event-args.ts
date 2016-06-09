import {EventArgs} from "./event-args";

/**
 * Defines a class that represents event arguments for an item that was moved.
 */
export class MovedItemEventArgs<T> extends EventArgs {

    constructor(item: T, before: number, after: number) {
        super(item);
        this.beforeIndex = before;
        this.afterIndex = after;
    }

    public get item(): T {
        return this.sender;
    }

    public beforeIndex: number;
    public afterIndex: number;

}