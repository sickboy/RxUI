import {Scheduler} from "rxjs/Scheduler";
import {asap} from "rxjs/scheduler/asap";
import {queue} from "rxjs/scheduler/queue";

let Schedulers = {
    asap,
    queue
};

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