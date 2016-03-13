import {Observable} from "rxjs/Observable";
import {ReactiveObject} from "./reactive-object";
import {ReactiveCommand} from "./reactive-command";
import * as InvokeCommand from "./operator/invoke-command";

/**
 * Defines an interface that represents an observable that is able to invoke commands upon observation of a value. 
 */
export interface ReactiveObservable<T> extends Observable<T> {
    /**
    * Subscribes to an Observable and attempts to execute a command on the given reactive object when the subscribed observable emits a value.
    * @param obj The Reactive Object that the command exists on.
    * @param command The name of the property that holds the ReactiveCommand that should be subscribed to.
    */
    invokeCommand<TObj extends ReactiveObject, TResult>(obj: TObj, command: string): ReactiveObservable<TResult>;
}

