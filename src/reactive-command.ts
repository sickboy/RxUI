import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

/**
 * Defines a class that represents a command that can run operations in the background.
 */
export class ReactiveCommand<TResult> {

    private subject: Subject<TResult>;
    private executing: Subject<boolean>;
    private _canExecute: Observable<boolean>;
    private _isExecuting: Observable<boolean>;

    /**
     * Gets an observable that represents whether the command is currently executing.
     */
    public get isExecuting(): Observable<boolean> {
        return this._isExecuting;
    }
    
    /**
     * Gets an observable that represents whether this command can execute.
     */
    public get canExecute(): Observable<boolean> {
        return this._canExecute;
    }

    /**
     * Creates a new Reactive Command.
     * @param canRun An observable that determines whether the given task is allowed to run at a given moment.
     * @param task A function that returns an observable that represents the asynchronous operation.
     */
    constructor(private canRun: Observable<boolean>, private task: (args) => Observable<TResult>) {
        this.subject = new Subject<TResult>();
        this.executing = new Subject<boolean>();
        this._isExecuting = this.executing.startWith(false).distinctUntilChanged();
        this._canExecute = this.canRun
            .startWith(false)
            .combineLatest(this._isExecuting, (canRun, isExecuting) => {
                return canRun && !isExecuting;
            })
            .distinctUntilChanged()
            .repeat(1);
    }

    /**
     * Creates a new Reactive Command that can run the given task when executed.
     */
    public static createAsyncTask<TResult>(canRun: Observable<boolean>, task: (args) => Promise<TResult>): ReactiveCommand<TResult> {
        return new ReactiveCommand(canRun, (args) => Observable.fromPromise(task(args)));
    }

    /**
     * Executes this command.
     */
    public execute(arg): Observable<TResult> {
        this.executing.next(true);
        var observable = this.task(arg);
        var subscriber = observable.subscribe(result => {
            this.subject.next(result);
        }, err => {
            this.subject.error(err);
            this.executing.next(false);
        }, () => {
            subscriber.unsubscribe();
            this.executing.next(false);
        });
        return observable;
    }

    /**
     * Gets the observable that represents the result of this command's operations.
     */
    public get observable(): Observable<TResult> {
        return this.subject;
    }
}