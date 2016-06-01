/// <reference path="../references.d.ts" />
import {Observable, Subscription} from "rxjs/Rx";
import {ReactiveObject} from "../src/reactive-object";
import {ReactiveCommand} from "../src/reactive-command";
import {PropertyChangedEventArgs} from "../src/events/property-changed-event-args";
import {expect} from "chai";
import {MyObject} from "./models/my-object";
import {MyOtherObject} from "./models/my-other-object";
import {IViewBindingHelper} from "../src/view";
import {ViewBindingHelper} from "./models/view-binding-helper";

// These tests are more for finding the performance limits in the library,
// and not for hard tests that must hold true in every situation.
describe("Performance", () => {
    describe("ReactiveObject", () => {
        it("should be able to setup and tear down 100000 objects without timeout", () => {
            var objs: ReactiveObject[] = [];
            for (var i = 0; i < 100000; i++) {
                var obj = new ReactiveObject();
                obj.set("value", "obj" + i);
                objs.push(obj);
            }

            expect(objs.length).to.equal(100000);
            for (var i = 0; i < 100000; i++) {
                expect(objs[i].get("value")).to.equal("obj" + i);
            }
        });
        it("should be able to setup and dispose 10000 bindings between unique objects", () => {
            var helper = new ViewBindingHelper();
            var reactiveObjects: ReactiveObject[] = [];
            for (var i = 0; i < 10000; i++) {
                var obj = new ReactiveObject();
                obj.set("value", "obj" + i);
                reactiveObjects.push(obj);
            }

            var normalObjects = [];
            for (var i = 0; i < reactiveObjects.length; i++) {
                normalObjects.push({
                    __viewBindingHelper: helper,
                    normalValue: "view" + i
                });
            }

            var bindings = reactiveObjects.map((o, i) => o.bind(normalObjects[i], "value", "normalValue"));

            for (var i = 0; i < reactiveObjects.length; i++) {
                expect(normalObjects[i].normalValue).to.equal(reactiveObjects[i].get("value"));
                var newVal = "new Value" + i;
                normalObjects[i].normalValue = newVal;
                normalObjects[i].changed(newVal);
                expect(reactiveObjects[i].get("value")).to.equal(newVal);
                bindings[i].unsubscribe();
            }
        });
    });
});