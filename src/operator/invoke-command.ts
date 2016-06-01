import {Observable} from "rxjs/Rx";
import {ReactiveObject} from "../reactive-object";
import {ReactiveCommand} from "../reactive-command";

/**
 * Creates a new cold observable that maps values observed from the source Observable to values resolved from a ReactiveCommand.
 * Essentially, this means that the command is executed whenever the source Observable resolves a new value, so long as the command is executable at the moment.
 * @param source The Observable that should be used as the trigger for the command.
 * @param obj The Reactive Object that the command exists on.
 * @param command The name of the property that holds the ReactiveCommand that should be subscribed to. 
 *                Alternatively, the actual command object that should be executed can be passed in. 
 */
export function invokeCommand<TObj extends ReactiveObject, TArg, TResult>(source: Observable<TArg>, obj: TObj, command: string | ReactiveCommand<TArg, TResult>): Observable<TResult> {
    var commandObservable: Observable<ReactiveCommand<TArg, TResult>>;
    var canExecute: Observable<boolean>;
    var isExecuting: Observable<boolean>;
    if (typeof command === "string") {
        // Make sure that the current command is observed
        commandObservable = obj.whenSingle(command, true).map(e => e.newPropertyValue);
        canExecute = commandObservable.map(c => c.canExecute).switch();
    } else {
        commandObservable = Observable.of(command);
        canExecute = command.canExecute;
    }
    var results = source
        .withLatestFrom(commandObservable, canExecute, (v1, command, canExecute) => {
            return {
                canExecute,
                command,
                observedValue: v1
            };
        })
        .filter(o => o.canExecute && o.command != null)
        .distinctUntilChanged()
        .flatMap(o => {
            return o.command.executeAsync(o.observedValue);
        });
    return results;
}