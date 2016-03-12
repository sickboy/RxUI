import {EventArgs} from "./event-args";

/**
 * Defines a class that represents the arguments for events that notify when properties change.
 */
export class PropertyChangedEventArgs<T> extends EventArgs {
    
    private _propertyName: string;
    private _newPropertyValue: any;
    
    /**
     * Creates a new object that represents the event arguments for a property changed event.
     * @param sender The object whose property has changed.
     * @param propertyName The name of the property that changed.
     * @param newPropertyValue The new value that the property now possesses.
     */
    constructor(sender: any, propertyName: string, newPropertyValue: any) {
        super(sender);
        this._propertyName = propertyName;
        this._newPropertyValue = newPropertyValue;
    }
    
    /**
     * Gets the name of the property that changed.
     */
    public get propertyName(): string {
        return this._propertyName;
    }
    
    /**
     * Gets the value that the property now has.
     */
    public get newPropertyValue(): any {
        return this._newPropertyValue;
    }    
}