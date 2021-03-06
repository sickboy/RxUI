import {Observable, Subject , Subscription} from "rxjs/Rx";
import {Scheduler} from "rxjs/Scheduler";
import {RxApp} from "./rx-app";

// Implementation mostly stolen from:
// https://github.com/reactiveui/ReactiveUI/blob/rxui7-master/ReactiveUI/ReactiveCommand.cs
// All credit goes to those creators

/**
 * Defines a class that represents a command that can run operations in the background.
 */
export class ReactiveCommand<TArgs, TResult> {

    private _executionInfo: Subject<ExecutionInfo<TResult>>;
    private _synchronizedExcecutionInfo: Subject<ExecutionInfo<TResult>>;
    private _results: Observable<TResult>;
    private _canExecute: Observable<boolean>;
    private _isExecuting: Observable<boolean>;
    private _canExecuteSubscription: Subscription;
    private _exceptions: Subject<any>;

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
     * @param scheduler The scheduler that all of the results should be observed on.
     */
    constructor(private task: (args: TArgs) => Observable<TResult>, private canRun: Observable<boolean>, private scheduler: Scheduler) {
        if (!task) {
            throw new Error("The task parameter must be supplied");
        }
        if (!canRun) {
            throw new Error("The canRun parameter must be supplied");
        }
        if (!scheduler) {
            throw new Error("The scheduler parameter must be supplied");
        }
        this._executionInfo = new Subject<ExecutionInfo<TResult>>();
        this._synchronizedExcecutionInfo = this._executionInfo;
        this._exceptions = new Subject<any>();

        // Implementation mostly taken from:
        // https://github.com/reactiveui/ReactiveUI/blob/rxui7-master/ReactiveUI/ReactiveCommand.cs#L628
        
        this._isExecuting = this._synchronizedExcecutionInfo
            .observeOn(scheduler)
            .map(info => info.demarcation === ExecutionDemarcation.Begin)
            .startWith(false)
            .distinctUntilChanged()
            .publishReplay(1)
            .refCount();
        this._canExecute = this.canRun
            .catch(ex => {
                this._exceptions.next(ex);
                return Observable.of(false);
            })
            .startWith(false)
            .combineLatest(this._isExecuting, (canRun, isExecuting) => {
                return canRun && !isExecuting;
            })
            .distinctUntilChanged()
            .publishReplay(1)
            .refCount();
        this._results = this._synchronizedExcecutionInfo
            .observeOn(scheduler)
            .filter(info => info.demarcation === ExecutionDemarcation.EndWithResult)
            .map(info => info.result);

        // Make sure that can execute is triggered to be a hot observable.
        this._canExecuteSubscription = this._canExecute.subscribe();
    }

    private static defaultScheduler(scheduler: Scheduler): Scheduler {
        return scheduler || RxApp.mainThreadScheduler;
    }

    private static defaultCanRun(canRun: Observable<boolean>): Observable<boolean> {
        return canRun || Observable.of(true);
    }

    /**
     * Creates a new Reactive Command that can run the given synchronous task when executed.
     * @param task A function that executes some synchronous task and returns an optional value.
     * @param canRun An Observable whose stream of values determine whether the command is allowed to run at a certain time.
     * @param scheduler The scheduler that all of the results from the task should be observed on.
     */
    public static create<TArgs, TResult>(task: (args: TArgs) => (TResult | void), canRun?: Observable<boolean>, scheduler?: Scheduler): ReactiveCommand<TArgs, TResult> {
        return new ReactiveCommand<TArgs, TResult>((args) => {
            var result = task(args);
            if (typeof result !== "undefined") {
                return Observable.of(result);
            } else {
                // TODO: replace with Unit
                return Observable.of(null);
            }
        }, ReactiveCommand.defaultCanRun(canRun), ReactiveCommand.defaultScheduler(scheduler));
    }

    /**
     * Creates a new Reactive Command that can run the given task when executed.
     * @param task A function that returns a promise that completes when the task has finished executing.
     * @param canRun An Observable whose stream of values determine whether the command is allowed to run at a certain time.
     * @param scheduler The scheduler that all of the results from the task should be observed on.
     */
    public static createFromTask<TArgs, TResult>(task: (args: TArgs) => Promise<TResult>, canRun?: Observable<boolean>, scheduler?: Scheduler): ReactiveCommand<TArgs, TResult> {
        return new ReactiveCommand<TArgs, TResult>((args) => Observable.fromPromise(task(args)), ReactiveCommand.defaultCanRun(canRun), ReactiveCommand.defaultScheduler(scheduler));
    }

    /**
     * Creates a new Reactive Command that can run the given task when executed.
     * @param task A function that returns an observable that completes when the task has finished executing.
     * @param canRun An Observable whose stream of values determine whether the command is allowed to run at a certain time.
     * @param scheduler The scheduler that all of the results from the task should be observed on.
     */
    public static createFromObservable<TArgs, TResult>(task: (args: TArgs) => Observable<TResult>, canRun?: Observable<boolean>, scheduler?: Scheduler): ReactiveCommand<TArgs, TResult> {
        return new ReactiveCommand<TArgs, TResult>(task, ReactiveCommand.defaultCanRun(canRun), ReactiveCommand.defaultScheduler(scheduler));
    }

    /**
     * Executes this command asynchronously.
     * Note that this method does not check whether the command is currently executable.
     */
    public execute(arg: TArgs = null): Observable<TResult> {
        try {
            return Observable.defer(() => {
                this._synchronizedExcecutionInfo.next(ExecutionInfo.createBegin<TResult>());
                return Observable.empty<TResult>();
            })
                .concat(this.task(arg))
                .do(
                    result => this._synchronizedExcecutionInfo.next(ExecutionInfo.createResult(result)),
                    null,
                    () => this._synchronizedExcecutionInfo.next(ExecutionInfo.createEnded<TResult>()))
                .catch(ex => {
                    this._synchronizedExcecutionInfo.next(ExecutionInfo.createFail<TResult>());
                    this._exceptions.next(ex);
                    return Observable.throw(ex);
                })
                .publishLast()
                .refCount();
        } catch (ex) {
            this._exceptions.next(ex);
            return Observable.throw(ex);
        }
    }

    /**
     * Executes this command asynchronously if the latest observed value from canExecute is true.
     */
    public invoke(arg: TArgs = null): Observable<TResult> {
        return this.canExecuteNow().filter(canExecute => canExecute).flatMap(c => {
            return this.execute(arg);
        });
    }

    /**
     * Gets an observable that determines whether the command is able to execute at the moment it is subscribed to.
     */
    public canExecuteNow(): Observable<boolean> {
        return this.canExecute.first();
    }

    /**
     * Gets the observable that represents the results of this command's operations.
     */
    public get results(): Observable<TResult> {
        return this._results;
    }
}

class ExecutionInfo<TResult> {
    public demarcation: ExecutionDemarcation;
    public result: TResult;
    
    constructor(demarcation: ExecutionDemarcation, result: TResult) {
        this.demarcation = demarcation;
        this.result = result;
    }
    
    public static createBegin<TResult>(): ExecutionInfo<TResult> {
        return new ExecutionInfo(ExecutionDemarcation.Begin, null);
    }
    public static createResult<TResult>(result: TResult): ExecutionInfo<TResult> {
        return new ExecutionInfo(ExecutionDemarcation.EndWithResult, result);
    }
    public static createFail<TResult>(): ExecutionInfo<TResult> {
        return new ExecutionInfo(ExecutionDemarcation.EndWithException, null);
    }
    public static createEnded<TResult>(): ExecutionInfo<TResult> {
        return new ExecutionInfo(ExecutionDemarcation.Ended, null);
    }
}

enum ExecutionDemarcation {
    Begin,
    EndWithResult,
    EndWithException,
    Ended
}