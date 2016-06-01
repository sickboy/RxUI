import {IViewBindingHelper} from "../../src/view";
import {PropertyChangedEventArgs} from "../../src/events/property-changed-event-args";

export class ViewBindingHelper implements IViewBindingHelper {
    public observeProp(obj: any, prop: string, emitCurrentVal: boolean, callback: Function): Function {
        obj.changed = (newVal: any) => {
            callback(new PropertyChangedEventArgs<any>(obj, prop, newVal));
        };

        return () => {
            obj.changed = null;
        }
    }
}