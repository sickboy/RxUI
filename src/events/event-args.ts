/**
 * Defines a base class that represents event arguments for an event. 
 */
export class EventArgs {
    
    private _sender: any;
    
    /**
     * Creates a new event args object.
     * @param sender The object that is emitting the event.
     */
    constructor(sender: any) {
        this._sender = sender;    
    }
    
    /**
     * Gets the object that emitted the event.
     */
    public get sender(): any {
        return this._sender;
    }
}