import {Scheduler} from "rxjs/Scheduler";
import {Scheduler as Schedulers} from "rxjs/Rx";

/**
 * Defines a class that contains static properties that are useful for a Reactive Application.
 */
export class RxApp {
    
    /**
     * Gets a scheduler that can be used to scheduler work on the main UI thread.
     */
    public static get mainThreadScheduler(): Scheduler {
        return Schedulers.queue;
    }
    
    /**
     * Gets a scheduler that executes work as soon as it is scheduled.
     */
    public static get immediateScheduler(): Scheduler {
        return Schedulers.asap;
    }
    
}