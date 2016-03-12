/// <reference path="../references.d.ts" />
import {Observable} from "rxjs/Rx";
import {ReactiveObject} from "../src/reactive-object";
import {PropertyChangedEventArgs} from "../src/events/property-changed-event-args";
import {expect} from "chai";

describe("ReactiveObject", () => {
    describe(".set()", () => {
        it("should change the value retrieved by .get()", () => {
            var obj: ReactiveObject = new ReactiveObject();

            var firstVal = obj.get("prop");
            var newVal = "NewValue";

            obj.set("prop", newVal);

            expect(obj.get("prop")).to.not.equal(firstVal);
            expect(obj.get("prop")).to.equal(newVal);
        });

        it("should emit new PropertyChangedEventArgs after set() is called", (done) => {
            var obj: ReactiveObject = new ReactiveObject();

            obj.propertyChanged.subscribe(e => {
                expect(e).to.not.be.null;
                expect(e.propertyName).to.equal("message");
                expect(e.sender).to.equal(obj);
                expect(e.newPropertyValue).to.equal("Hello, World!");
                done();
            }, err => done(err));

            obj.set("message", "Hello, World!");
        });
    });

    describe(".emitPropertyChanged()", () => {
        it("should emit new PropertyChangedEventArgs when called", (done) => {
            class MyReactiveObj extends ReactiveObject {
                public triggerChangeEvent(): void {
                    this.emitPropertyChanged("prop", "newVal");
                }
            }

            var obj: MyReactiveObj = new MyReactiveObj();
            obj.propertyChanged.subscribe(e => {
                expect(e).to.not.be.null;
                expect(e.propertyName).to.equal("prop");
                expect(e.sender).to.equal(obj);
                expect(e.newPropertyValue).to.equal("newVal");
                done();
            }, err => done(err));
            obj.triggerChangeEvent();
        });

        it("should use value stored in object when new value is not provided", (done) => {
            class MyReactiveObj extends ReactiveObject {
                public triggerChangeEvent(): void {
                    this.emitPropertyChanged("prop");
                }
            }

            var obj: MyReactiveObj = new MyReactiveObj();
            obj.set("prop", "value");
            obj.propertyChanged.subscribe(e => {
                expect(e).to.not.be.null;
                expect(e.propertyName).to.equal("prop");
                expect(e.sender).to.equal(obj);
                expect(e.newPropertyValue).to.equal("value");
                done();
            }, err => done(err));
            obj.triggerChangeEvent();
        });
    });

    describe(".whenAny(prop)", () => {
        it("should return an observable", () => {
            var obj: ReactiveObject = new ReactiveObject();
            var observable = obj.whenAny("prop");

            expect(observable).to.be.instanceOf(Observable);
        });

        it("should observe property events for the given property name", (done) => {
            var obj: ReactiveObject = new ReactiveObject();

            obj.whenAny("prop").subscribe((e: PropertyChangedEventArgs<any>) => {
                expect(e).to.not.be.null;
                expect(e.propertyName).to.equal("prop");
                expect(e.sender).to.equal(obj);
                expect(e.newPropertyValue).to.equal("value");
                done();
            }, err => done(err));

            obj.set("prop", "value");
        });

        it("should observe property events for child reactive objects", (done) => {
            var obj: ReactiveObject = new ReactiveObject();
            var child: ReactiveObject = new ReactiveObject();
            obj.set("child", child);

            obj.whenAny("child.prop").subscribe((e: PropertyChangedEventArgs<any>) => {
                expect(e).to.not.be.null;
                expect(e.propertyName).to.equal("prop");
                expect(e.sender).to.equal(child);
                expect(e.newPropertyValue).to.equal("value");
                done();
            }, err => done(err));

            obj.get("child").set("prop", "value");
        });

        it("should observe property events for the entire child tree", (done) => {
            var obj: ReactiveObject = new ReactiveObject();
            var child: ReactiveObject = new ReactiveObject();
            var child2: ReactiveObject = new ReactiveObject();
            var child3: ReactiveObject = new ReactiveObject();
            var child4: ReactiveObject = new ReactiveObject();
            obj.set("child", child);
            child.set("child2", child2);
            child2.set("child3", child3);
            child3.set("child4", child4);

            obj.whenAny("child.child2.child3.child4.prop").subscribe((e: PropertyChangedEventArgs<any>) => {
                expect(e).to.not.be.null;
                expect(e.propertyName).to.equal("prop");
                expect(e.sender).to.equal(child4);
                expect(e.newPropertyValue).to.equal("value");
                done();
            }, err => done(err));

            obj.get("child").get("child2").get("child3").get("child4").set("prop", "value");
        });

        it("should observe property events for the swapped children", (done) => {
            var obj: ReactiveObject = new ReactiveObject();
            var child: ReactiveObject = new ReactiveObject();
            var child2: ReactiveObject = new ReactiveObject();
            var child3: ReactiveObject = new ReactiveObject();
            var child4: ReactiveObject = new ReactiveObject();

            var newChild2: ReactiveObject = new ReactiveObject();
            var newChild3: ReactiveObject = new ReactiveObject();
            var newChild4: ReactiveObject = new ReactiveObject();

            obj.set("child", child);
            child.set("child2", child2);
            child2.set("child3", child3);
            child3.set("child4", child4);

            newChild2.set("child3", newChild3);
            newChild3.set("child4", newChild4);
            newChild4.set("prop", "newValue");
            var num = 0;
            obj.whenAny("child.child2.child3.child4.prop").take(2).subscribe((e: PropertyChangedEventArgs<any>) => {
                //expect(events.length).to.equal(2);
                num++;
                if (num == 1) {
                    expect(e).to.not.be.null;
                    expect(e.propertyName).to.equal("prop");
                    expect(e.sender).to.equal(child4);
                    expect(e.newPropertyValue).to.equal("value");
                }
                else if (num == 2) {
                    expect(e).to.not.be.null;
                    expect(e.propertyName).to.equal("prop");
                    expect(e.sender).to.equal(newChild4);
                    expect(e.newPropertyValue).to.equal("newValue");
                    done();
                }
            }, err => done(err));

            child4.set("prop", "value");
            obj.get("child").set("child2", newChild2);
            child4.set("prop", "notObservedValue");
        });
    });
});