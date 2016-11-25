import { ReactiveObject } from "../../src/reactive-object";
import { MyObject } from "./my-object";

export class MyOtherObject extends ReactiveObject {
    public prop: string;
    public child: MyOtherObject;

    constructor() {
        super(['prop', 'child']);
    }
}