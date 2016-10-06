import { ReactiveObject } from "../../src/reactive-object";
import { ReactiveCommand } from "../../src/reactive-command";
import { MyOtherObject } from "./my-other-object";
import { Observable } from "rxjs/Rx";

export class MyObject extends ReactiveObject {
    public child: MyOtherObject;
    public otherProp: string;
    public prop1: string;
    public prop2: string;
    public prop3: string;
    public newTodo: MyOtherObject = new MyOtherObject();

    public canAddNewTodo(): Observable<boolean> {
        // TODO: Work on Why The Constructor is blocking right here: 
        return this.whenAnyValue(vm => {
            return vm.newTodo;
        }).map(todo => {
            todo.prop = todo.prop.trim();
            return !!todo.prop;
        }).startWith(false);
    }

    private command: ReactiveCommand<number, boolean>;

    constructor() {
        super(["child", "otherProp", "prop1", "prop2", "prop3", "newTodo"]);

        this.command = ReactiveCommand.createFromObservable(() => {
            return Observable.of(true);
        }, this.canAddNewTodo());
    }
}