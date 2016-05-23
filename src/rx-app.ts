import {Scheduler as RxScheduler} from "rxjs/Scheduler";
import {AsapScheduler} from "rxjs/scheduler/AsapScheduler";
import {QueueScheduler} from "rxjs/scheduler/QueueScheduler";

// Odd Situation to be in (declaring globals that another library defines)
// But we should avoid importing values from library wide dependencies (like "rxjs/Rx") to reduce
// the amount of code that this library requires.
declare var Scheduler: {
    asap: AsapScheduler;
    queue: QueueScheduler;
};

/**
 * Defines a class that contains static properties that are useful for a Reactive Application.
 */
export class RxApp {
    
    /**
     * Gets a scheduler that can be used to scheduler work on the main UI thread.
     */
    public static get mainThreadScheduler(): RxScheduler {
        return Scheduler.queue;
    }
    
    /**
     * Gets a scheduler that executes work as soon as it is scheduled.
     */
    public static get immediateScheduler(): RxScheduler {
        return Scheduler.asap;
    }
    
}