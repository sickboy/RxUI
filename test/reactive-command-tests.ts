import {ReactiveCommand} from "../src/reactive-command";
import {Observable} from "rxjs/Rx";

describe("ReactiveCommand", () => {
    describe(".canExecute", () => {
       it("should default to false", (done) => {
           var command: ReactiveCommand<boolean> = new ReactiveCommand(Observable.empty(), (a) => Observable.fromArray([false]));
           
           
       });
    });
});