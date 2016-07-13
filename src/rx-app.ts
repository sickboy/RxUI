import {Scheduler} from "rxjs/Scheduler";
import {asap} from "rxjs/scheduler/asap";
import {queue} from "rxjs/scheduler/queue";
import {IViewBindingHelper} from "./view";

let Schedulers = {
    asap,
    queue
};

/**
 * Defines a class that contains static properties that are useful for a Reactive Application.
 */
export class RxApp {
    /**
     * Gets the main thread scheduler for the app.
     * Use this scheduler for observing results from async operations.
     * Backed by queue scheduler.
     * Replace this property with a test scheduler for easy testing.
     */
    public static mainThreadScheduler: Scheduler;

    /**
     * Gets the immediate scheduler for the app.
     * Use this scheduler for tasks that should be executed once they are scheduled.
     * Backed by asap scheduler.
     * Replace this property with a test scheduler for easy testing.
     */
    public static immediateScheduler: Scheduler;

    public static globalViewBindingHelper: IViewBindingHelper;
}

RxApp.mainThreadScheduler = Schedulers.queue;
RxApp.immediateScheduler = Schedulers.asap;
