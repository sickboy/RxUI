import {Observable, Subject} from "rxjs/Rx";
import {PropertyChangedEventArgs} from "./events/property-changed-event-args";

/**
 * Defines a class that represents a reactive object.
 * This is the base class for View Model classes, and it implements an event system that 
 * allows notification of property changes, which is the basis of the observable pipeline.
 */
export class ReactiveObject {
    
    private _propertyChanged: Subject<PropertyChangedEventArgs>;
    
    /**
     * Creates a new reactive object.
     */
    constructor() {
        this._propertyChanged = new Subject<PropertyChangedEventArgs>();
    }
    
    /**
     * Gets the observable that represents the stream of "propertyChanged" events from this object.
     */
    public get propertyChanged(): Observable<PropertyChangedEventArgs> {
        return this._propertyChanged;
    }
    
    /**
     * Emits a new property changed event for the given property from this object.
     */
    protected emitPropertyChanged(propertyName: string, newPropertyValue?: any): void {
        var propValue = newPropertyValue != null ? newPropertyValue : this.get(propertyName);
        this._propertyChanged.next(new PropertyChangedEventArgs(this, propertyName, propValue));
    }
    
    /**
     * Gets the value of the given property from this object.
     * @param property The name of the property whose value should be retrieved. 
     */
    public get<T>(property: string): T {
        return this[property];
    }
    
    /**
     * Sets the value of the given property on this object and emits the "propertyChanged" event.
     * @param property The name of the property to change.
     * @param value The value to give the property.
     */
    public set<T>(property: string, value: T): void {
        this[property] = value;
        this.emitPropertyChanged(property, value);
    }
}