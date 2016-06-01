import {PropertyChangedEventArgs} from "./events/property-changed-event-args";

/**
 * Defines an interface for objects that represent a view that can be bound.
 */
export interface IView {
    
    /**
     * Gets the helper that should be used to watch for changes on the view.
     */
    __viewBindingHelper: IViewBindingHelper;
}

/**
 * Defines an interface that represents a view binding helper. That is, an object that 
 * provides watch/observe capabilities on an object. 
 */
export interface IViewBindingHelper {
    /**
     * Watches the given property on the given object and calls the given callback function when a change occurs.
     * @param obj The object whose property should be observed.
     * @param property The name of the property that should be watched. Always only one property, and not a property list. (i.e. "myProp" and not "myProp.myValue")
     * @param emitCurrentVal Whether the callback should be immediately called with the current property value.
     * @param callback The function that should be called when the property's value has changed.
     * @return A function that, when called, disposes of the observer.
     */
    observeProp(obj: Object, property: string, emitCurrentVal: boolean, callback: (args: PropertyChangedEventArgs<any>) => void): Function;
}