/// <reference path="../references.d.ts" />
import {Observable, Subscription} from "rxjs/Rx";
import {ReactiveObject} from "../src/reactive-object";
import {ReactiveCommand} from "../src/reactive-command";
import {PropertyChangedEventArgs} from "../src/events/property-changed-event-args";
import {expect} from "chai";
import {MyObject} from "./models/my-object";
import {MyOtherObject} from "./models/my-other-object";
import {IViewBindingHelper} from "../src/view";

describe("ReactiveObject", () => {
    class ViewBindingHelper implements IViewBindingHelper {
        public observeProp(obj: any, prop: string, emitCurrentVal: boolean, callback: Function): Function {
            obj.changed = (newVal: any) => {
                callback(new PropertyChangedEventArgs<any>(obj, prop, newVal));
            };

            return () => {
                obj.changed = null;
            }
        }
    }
    describe("#set()", () => {
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
        it("should handle deep properties with multiple reactive objects", () => {
            var obj: ReactiveObject = new ReactiveObject();
            var prop: ReactiveObject = new ReactiveObject();
            var prop2: ReactiveObject = new ReactiveObject();
            obj.set("prop", prop);
            obj.set("prop.prop2", prop2);

            expect(obj.get("prop.prop2")).to.equal(prop2);
        });
        it("should handle properties specified as lambdas", () => {
            var obj = new MyObject();
            var prop = new MyOtherObject();
            var prop2 = new MyOtherObject();

            obj.set(o => o.child, prop);
            obj.set(o => o.child.child, prop2);

            expect(obj.get(o => o.child.child)).to.equal(prop2);
        });
        it("should handle non reactive objects", () => {
            var obj: ReactiveObject = new ReactiveObject();
            var child = {
                val: "stuff"
            };
            var child2 = {
                otherValue: "other stuff"
            };

            obj.set("child", child);
            obj.set("child.child2", child2);

            expect(obj.get("child.child2")).to.equal(child2);
        });
    });

    describe("#get(prop)", () => {
        it("should return the value at obj.__data[prop]", () => {
            var obj: ReactiveObject = new ReactiveObject();
            (<any>obj).__data["prop"] = "value";
            var val = obj.get("prop");
            expect(val).to.equal("value");
        });
        it("should return null when the property is undefined", () => {
            var obj: ReactiveObject = new ReactiveObject();
            var val = obj.get("prop");
            expect(val).to.be.null;
        });
        it("should return null when trying to access property on already null property", () => {
            var obj: ReactiveObject = new ReactiveObject();
            expect(obj.get("prop.other.does.not.exist")).to.be.null;
        });
    });

    describe("#emitPropertyChanged()", () => {
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

    describe("#whenAny(lambda)", () => {
        it("should return an observable", () => {
            var obj: MyObject = new MyObject();
            var observable = obj.whenAny(o => o.otherProp);
            expect(observable).to.be.instanceOf(Observable);
        });

        it("should observe property events for the given property", (done) => {
            var obj: MyObject = new MyObject();
            var observable = obj.whenAny(o => o.otherProp).take(1).subscribe(e => {
                expect(e).to.not.be.null;
                expect(e.propertyName).to.equal("otherProp");
                expect(e.sender).to.equal(obj);
                expect(e.newPropertyValue).to.equal("value");

                done();
            }, err => done(err));

            obj.otherProp = "value";
        });

        it("should observe property events for child reactive objects", (done) => {
            var obj: MyObject = new MyObject();
            obj.child = new MyOtherObject();
            var observable = obj.whenAny(o => o.child.prop).take(1).subscribe(e => {
                expect(e).to.not.be.null;
                expect(e.propertyName).to.equal("prop");
                expect(e.sender).to.equal(obj.child);
                expect(e.newPropertyValue).to.equal("value");

                done();
            }, err => done(err));

            obj.child.prop = "value";
        });

        it("should observe property events for the entire child tree", (done) => {
            var obj: MyObject = new MyObject();
            var child: MyOtherObject = new MyOtherObject();
            var child2: MyOtherObject = new MyOtherObject();
            var child3: MyOtherObject = new MyOtherObject();
            var child4: MyOtherObject = new MyOtherObject();

            obj.child = child;
            child.child = child2;
            child2.child = child3;
            child3.child = child4;

            obj.whenAny(o => o.child.child.child.child.prop).subscribe(e => {
                expect(e).to.not.be.null;
                expect(e.propertyName).to.equal("prop");
                expect(e.sender).to.equal(child4);
                expect(e.newPropertyValue).to.equal("value");

                done();
            }, err => done(err));

            obj.child.child.child.child.prop = "value";
        });

        it("should observe mapped property events for the entire child tree", (done) => {
            var obj: MyObject = new MyObject();
            var child: MyOtherObject = new MyOtherObject();
            var child2: MyOtherObject = new MyOtherObject();
            var child3: MyOtherObject = new MyOtherObject();
            var child4: MyOtherObject = new MyOtherObject();

            obj.child = child;
            child.child = child2;
            child2.child = child3;
            child3.child = child4;

            obj.whenAny(o => o.child.child.child.child.prop, e => e.newPropertyValue).subscribe(value => {
                expect(value).to.equal("value");
                done();
            }, err => done(err));

            obj.child.child.child.child.prop = "value";
        });

        it("should observe property events for swapped children", (done) => {
            var obj: MyObject = new MyObject();
            var child: MyOtherObject = new MyOtherObject();
            var child2: MyOtherObject = new MyOtherObject();
            var child3: MyOtherObject = new MyOtherObject();
            var child4: MyOtherObject = new MyOtherObject();

            var newChild2: MyOtherObject = new MyOtherObject();
            var newChild3: MyOtherObject = new MyOtherObject();
            var newChild4: MyOtherObject = new MyOtherObject();

            obj.child = child;
            child.child = child2;
            child2.child = child3;
            child3.child = child4;

            newChild2.child = newChild3;
            newChild3.child = newChild4;
            newChild4.prop = "newValue";

            obj.whenAny(o => o.child.child.child.child.prop).take(2).bufferTime(10).subscribe(events => {
                expect(events.length).to.equal(2);

                expect(events[0]).to.not.be.null;
                expect(events[0].propertyName).to.equal("prop");
                expect(events[0].sender).to.equal(child4);
                expect(events[0].newPropertyValue).to.equal("value");

                expect(events[1]).to.not.be.null;
                expect(events[1].propertyName).to.equal("prop");
                expect(events[1].sender).to.equal(newChild4);
                expect(events[1].newPropertyValue).to.equal("newValue");

                done();
            }, err => done(err));

            obj.child.child.child.child.prop = "value";
            obj.child.child = newChild2;
            child4.prop = "notObservedValue";
        });
    });

    describe("#whenAny(prop)", () => {
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

        it("should observe property events for swapped children", (done) => {
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

            obj.whenAny("child.child2.child3.child4.prop").take(2).bufferTime(10).subscribe((events: PropertyChangedEventArgs<any>[]) => {
                expect(events.length).to.equal(2);

                expect(events[0]).to.not.be.null;
                expect(events[0].propertyName).to.equal("prop");
                expect(events[0].sender).to.equal(child4);
                expect(events[0].newPropertyValue).to.equal("value");

                expect(events[1]).to.not.be.null;
                expect(events[1].propertyName).to.equal("prop");
                expect(events[1].sender).to.equal(newChild4);
                expect(events[1].newPropertyValue).to.equal("newValue");

                done();
            }, err => done(err));

            child4.set("prop", "value");
            obj.get("child").set("child2", newChild2);
        });
    });

    describe("#whenAny(lambda1, lambda2, lambda3)", () => {
        it("should observe property changes for multiple children", (done) => {
            var obj: MyObject = new MyObject();
            obj.prop1 = "prop1Value";
            obj.prop2 = "prop2Value";
            obj.prop3 = "prop3Value";

            // The last parameter needs to be the map function.
            // Otherwise the selector functions and map function could not be distinguished.
            obj.whenAny(o => o.prop1, o => o.prop2, o => o.prop3, (prop1, prop2, prop3) => [prop1, prop2, prop3])
                .subscribe(events => {
                    expect(events.length).to.equal(3);
                    expect(events[0].propertyName).to.equal("prop1");
                    expect(events[1].propertyName).to.equal("prop2");
                    expect(events[2].propertyName).to.equal("prop3");

                    expect(events[0].newPropertyValue).to.equal("newProp1Value");
                    expect(events[1].newPropertyValue).to.equal("newProp2Value");
                    expect(events[2].newPropertyValue).to.equal("newProp3Value");

                    expect(events[0].sender).to.equal(obj);
                    expect(events[1].sender).to.equal(obj);
                    expect(events[2].sender).to.equal(obj);

                    done();
                });

            obj.prop1 = "newProp1Value";
            obj.prop2 = "newProp2Value";
            obj.prop3 = "newProp3Value";
        });

        it("should map observed property changes for multiple children", (done) => {
            var obj: MyObject = new MyObject();
            obj.prop1 = "prop1Value";
            obj.prop2 = "prop2Value";
            obj.prop3 = "prop3Value";

            obj.whenAny(o => o.prop1, o => o.prop2, o => o.prop3, (prop1, prop2, prop3) => {
                return {
                    prop1,
                    prop2,
                    prop3
                }
            }).subscribe(e => {
                expect(e.prop1.propertyName).to.equal("prop1");
                expect(e.prop2.propertyName).to.equal("prop2");
                expect(e.prop3.propertyName).to.equal("prop3");

                expect(e.prop1.newPropertyValue).to.equal("newProp1Value");
                expect(e.prop2.newPropertyValue).to.equal("newProp2Value");
                expect(e.prop3.newPropertyValue).to.equal("newProp3Value");

                expect(e.prop1.sender).to.equal(obj);
                expect(e.prop2.sender).to.equal(obj);
                expect(e.prop3.sender).to.equal(obj);

                done();
            });

            obj.prop1 = "newProp1Value";
            obj.prop2 = "newProp2Value";
            obj.prop3 = "newProp3Value";
        });

        it("should handle recursive calls to #whenAny(lambda) via properties", () => {
            class C extends ReactiveObject {
                prop: string;
                other: string;

                get observable(): Observable<boolean> {
                    return this.whenAnyValue(vm => vm.prop).map(p => p === "value");
                }

                get otherObservable(): Observable<boolean> {
                    return this.whenAnyValue(vm => vm.other).map(p => p === "other");
                }

                constructor() {
                    super();
                    // Triggers a call to observable(),
                    // which in turn triggers whenAnyValue(),
                    // which in turn tries to build a ghost object for this one,
                    // which in turn triggers otherObservable()
                    // which in turn triggers whenAnyValue(),
                    // which repeats the process.
                    var command = ReactiveCommand.create(() => {
                        return true;
                    }, this.observable);
                }
            }

            new C();
        });
    });

    describe("#whenAny(prop1, prop2, prop3)", () => {
        it("should observe property changes for multiple children", (done) => {
            var obj: ReactiveObject = new ReactiveObject();
            obj.set("prop1", "prop1Value");
            obj.set("prop2", "prop2Value");
            obj.set("prop3", "prop3Value");

            obj.whenAny<string, string, string>("prop1", "prop2", "prop3").subscribe((events: PropertyChangedEventArgs<any>[]) => {
                expect(events.length).to.equal(3);
                expect(events[0].propertyName).to.equal("prop1");
                expect(events[1].propertyName).to.equal("prop2");
                expect(events[2].propertyName).to.equal("prop3");

                expect(events[0].newPropertyValue).to.equal("newProp1Value");
                expect(events[1].newPropertyValue).to.equal("newProp2Value");
                expect(events[2].newPropertyValue).to.equal("newProp3Value");

                expect(events[0].sender).to.equal(obj);
                expect(events[1].sender).to.equal(obj);
                expect(events[2].sender).to.equal(obj);

                done();
            }, err => done(err));

            obj.set("prop1", "newProp1Value");
            obj.set("prop2", "newProp2Value");
            obj.set("prop3", "newProp3Value");
        });

        it("should map observed property changes for multiple children", (done) => {
            var obj: ReactiveObject = new ReactiveObject();
            obj.set("prop1", "prop1Value");
            obj.set("prop2", "prop2Value");
            obj.set("prop3", "prop3Value");

            obj.whenAny<string, string, string, any>("prop1", "prop2", "prop3", (prop1, prop2, prop3) => {
                return {
                    prop1,
                    prop2,
                    prop3
                };
            }).subscribe(e => {
                expect(e.prop1.propertyName).to.equal("prop1");
                expect(e.prop2.propertyName).to.equal("prop2");
                expect(e.prop3.propertyName).to.equal("prop3");

                expect(e.prop1.newPropertyValue).to.equal("newProp1Value");
                expect(e.prop2.newPropertyValue).to.equal("newProp2Value");
                expect(e.prop3.newPropertyValue).to.equal("newProp3Value");

                expect(e.prop1.sender).to.equal(obj);
                expect(e.prop2.sender).to.equal(obj);
                expect(e.prop3.sender).to.equal(obj);

                done();
            }, err => done(err));

            obj.set("prop1", "newProp1Value");
            obj.set("prop2", "newProp2Value");
            obj.set("prop3", "newProp3Value");
        });
    });

    describe("#whenAnyValue(lambda)", () => {
        it("should return an observable", () => {
            var obj: MyObject = new MyObject();
            var observable = obj.whenAnyValue(o => o.otherProp);

            expect(observable).to.be.instanceOf(Observable);
        });

        it("should observe property values for the given property name", (done) => {
            var obj: MyObject = new MyObject();
            obj.whenAnyValue(o => o.otherProp).subscribe(value => {
                expect(value).to.equal("value");
                done();
            }, err => done(err));

            obj.otherProp = "value";
        });

        it("should observe property values for the given property names", (done) => {
            var obj: MyObject = new MyObject();

            obj.whenAnyValue(o => o.prop1, o => o.prop2, (prop1, prop2) => [prop1, prop2]).subscribe(values => {
                expect(values.length).to.equal(2);
                expect(values[0]).to.equal("value");
                expect(values[1]).to.equal("value2");
                done();
            }, err => done(err));

            obj.prop1 = "value";
            obj.prop2 = "value2";
        });

        it("should observe deep property value changes", (done) => {
            var obj: MyObject = new MyObject();
            var child: MyOtherObject = new MyOtherObject();
            var child2: MyOtherObject = new MyOtherObject();
            var child3: MyOtherObject = new MyOtherObject();
            var child4: MyOtherObject = new MyOtherObject();

            obj.child = child;
            child.child = child2;
            child2.child = child3;
            child3.child = child4;

            obj.whenAnyValue(o => o.child.child.child.child.prop).subscribe(value => {
                expect(value).to.equal("value");
                done();
            }, err => done(err));

            obj.child.child.child.child.prop = "value";
        });

        it("should observe mapped deep property value changes", (done) => {
            var obj: MyObject = new MyObject();
            var child: MyOtherObject = new MyOtherObject();
            var child2: MyOtherObject = new MyOtherObject();
            var child3: MyOtherObject = new MyOtherObject();
            var child4: MyOtherObject = new MyOtherObject();

            obj.child = child;
            child.child = child2;
            child2.child = child3;
            child3.child = child4;

            obj.whenAnyValue(o => o.child.child.child.child.prop, v => v === "value").subscribe(value => {
                expect(value).to.be.true;
                done();
            }, err => done(err));

            obj.child.child.child.child.prop = "value";
        });

        it("should handle properties that are currently null or undefined on the source object", (done) => {
            class MySpecialObject extends ReactiveObject {
                public get prop(): MyOtherObject {
                    return this.get("prop");
                }
                public set prop(val: MyOtherObject) {
                    this.set("prop", val);
                }

                // Notice no setting prop to null in the constructor.
            }

            var obj: MySpecialObject = new MySpecialObject();

            obj.whenAnyValue(o => o.prop.child.child.prop, v => v === "value").subscribe(value => {
                expect(value).to.be.true;
                done();
            }, err => done(err));

            var other = new MyOtherObject();
            other.child = new MyOtherObject();
            other.child.child = new MyOtherObject();
            other.child.child.prop = "value";
            obj.prop = other;
        });

        it("should handle nulls along the entire path", (done) => {
            class MySpecialObject extends ReactiveObject {
                public get prop(): MyOtherObject {
                    return this.get("prop");
                }
                public set prop(val: MyOtherObject) {
                    this.set("prop", val);
                }

                // Notice no setting prop to null in the constructor.
            }

            var obj: MySpecialObject = new MySpecialObject();
            var events: any[] = [];
            obj.whenAnyValue(o => o.prop.child.child.prop)
                .subscribe(event => {
                    events.push(event);
                }, err => done(err));

            var other = new MyOtherObject();
            var child1 = new MyOtherObject();
            var child2 = new MyOtherObject();
            other.child = child1;
            other.child.child = child2;
            other.child.child.prop = "value";
            obj.prop = other;
            other.child = null;
            child2.prop = "great!";
            other.child = child1;
            child2.prop = null;

            expect(events.length).to.equal(4);
            expect(events[0]).to.equal("value");
            expect(events[1]).to.be.null;
            expect(events[2]).to.equal("great!");
            expect(events[3]).to.be.null;
            done();
        });
    });

    describe("#whenAnyValue(prop)", () => {
        it("should return an observable", () => {
            var obj: ReactiveObject = new ReactiveObject();
            var observable = obj.whenAnyValue("prop");

            expect(observable).to.be.instanceOf(Observable);
        });

        it("should observe property values for the given property name", (done) => {
            var obj: ReactiveObject = new ReactiveObject();

            obj.whenAnyValue<string>("prop").subscribe(value => {
                expect(value).to.equal("value");
                done();
            }, err => done(err));

            obj.set("prop", "value");
        });

        // it("should resolve immediately with the current property value", (done) => {

        // });

        it("should observe multiple property values for the given property names", (done) => {
            var obj: ReactiveObject = new ReactiveObject();

            obj.whenAnyValue<string, string>("prop", "prop2").subscribe(values => {
                expect(values.length).to.equal(2);
                expect(values[0]).to.equal("value");
                expect(values[1]).to.equal("value2");
                done();
            }, err => done(err));

            obj.set("prop", "value");
            obj.set("prop2", "value2");
        });

        it("should observe deep property value changes", (done) => {
            var obj: ReactiveObject = new ReactiveObject();
            var child: ReactiveObject = new ReactiveObject();
            var child2: ReactiveObject = new ReactiveObject();
            var child3: ReactiveObject = new ReactiveObject();
            var child4: ReactiveObject = new ReactiveObject();
            obj.set("child", child);
            child.set("child2", child2);
            child2.set("child3", child3);
            child3.set("child4", child4);

            obj.whenAnyValue("child.child2.child3.child4.prop").subscribe(value => {
                expect(value).to.equal("value");
                done();
            }, err => done(err));

            obj.get("child").get("child2").get("child3").get("child4").set("prop", "value");
        });
    });

    describe("#bind(view, prop, prop)", () => {
        class MyView extends ReactiveObject {
            public get prop(): string {
                return this.get("prop");
            }
            public set prop(val: string) {
                this.set("prop", val);
            }
        }
        it("should return a subscription", () => {
            var vm = new MyObject();
            var view = new MyView();
            view.prop = "value";
            var ret = vm.bind(<any>view, vm => vm.prop1, view => view.prop);
            expect(ret).to.be.instanceOf(Subscription);
        });
        it("should set the bound property on the view object when the view model property changes", () => {
            var vm = new MyObject();
            var view = new MyView();
            var viewPropChanges: PropertyChangedEventArgs<string>[] = [];
            vm.prop1 = "Old Value";
            view.prop = "View Value";
            view.whenAny(v => v.prop).subscribe(change => viewPropChanges.push(change));

            expect(viewPropChanges.length).to.equal(0);

            var sub = vm.bind(view, vm => vm.prop1, view => view.prop);

            expect(viewPropChanges.length).to.equal(1);

            vm.prop1 = "New Value";

            expect(viewPropChanges.length).to.equal(2);
            expect(viewPropChanges[0].newPropertyValue).to.equal("Old Value");
            expect(viewPropChanges[1].newPropertyValue).to.equal("New Value");
            sub.unsubscribe();
        });
        it("should set the bound property on the view model when the view property changes", () => {
            var vm = new MyObject();
            var view = new MyView();
            var vmPropChanges: PropertyChangedEventArgs<string>[] = [];
            vm.prop1 = "Old Value";
            view.prop = "View Value";
            vm.whenAny(v => v.prop1).subscribe(change => vmPropChanges.push(change));

            var sub = vm.bind(view, vm => vm.prop1, view => view.prop);

            expect(vmPropChanges.length).to.equal(0);

            view.prop = "New Value";

            expect(vmPropChanges.length).to.equal(1);
            expect(vmPropChanges[0].newPropertyValue).to.equal("New Value");
            sub.unsubscribe();
        });
        it("should stop binding values when unsubscribed from", () => {
            var vm = new MyObject();
            var view = new MyView();
            var viewPropChanges: PropertyChangedEventArgs<string>[] = [];
            vm.prop1 = "Old Value";
            view.prop = "View Value";
            view.whenAny(v => v.prop).subscribe(change => viewPropChanges.push(change));

            var sub = vm.bind(view, vm => vm.prop1, view => view.prop);
            vm.prop1 = "New Value";
            var numChanges = viewPropChanges.length;
            sub.unsubscribe();
            vm.prop1 = "OtherNewValue";

            expect(viewPropChanges.length).to.equal(numChanges);
        });
        it("should throw error when binding to regular object without __viewBindingHelper", () => {
            var vm = new MyObject();
            var view = {
                customProp: "value"
            };

            expect(() => {
                var sub = vm.bind(view, vm => vm.prop1, view => view.customProp);
            }).to.throw("Unable to bind to objects that do not inherit from ReactiveObject or provide __viewBindingHelper");
        });
        it("should bind to non reactive object with __viewBindingHelper", () => {
            var vm = new MyObject();
            var helper = new ViewBindingHelper();
            var view = {
                __viewBindingHelper: helper,
                changed: null,
                prop: "property value"
            };
            vm.prop1 = "Old Value";

            var sub = vm.bind(view, vm => vm.prop1, view => view.prop);

            expect(view.prop).to.equal("Old Value");
            expect(view.changed).to.not.be.null;

            view.prop = "New Value";
            view.changed(view.prop);

            expect(vm.prop1).to.equal("New Value");

            sub.unsubscribe();
            expect(view.changed).to.be.null;
        });
        it("should recieve multiple changes from the view and apply them to the view model", () => {
            var vm = new MyObject();
            var helper = new ViewBindingHelper();
            var view = {
                __viewBindingHelper: helper,
                changed: null,
                prop: "property value"
            };
            vm.prop1 = "Old Value";

            var sub = vm.bind(view, vm => vm.prop1, view => view.prop);

            expect(view.prop).to.equal("Old Value");
            expect(view.changed).to.not.be.null;

            view.prop = "New Value";
            view.changed(view.prop);

            view.prop = "Newer Value";
            view.changed(view.prop);

            sub.unsubscribe();
            expect(vm.prop1).to.equal("Newer Value");
        });
        it("should recieve multiple changes from the view model and apply them to the view", () => {
            var vm = new MyObject();
            var helper = new ViewBindingHelper();
            var view = {
                __viewBindingHelper: helper,
                changed: null,
                prop: "property value"
            };
            vm.prop1 = "Old Value";

            var sub = vm.bind(view, vm => vm.prop1, view => view.prop);

            expect(view.prop).to.equal("Old Value");
            expect(view.changed).to.not.be.null;

            vm.prop1 = "New Value";
            vm.prop1 = "Newer Value";

            sub.unsubscribe();
            expect(view.prop).to.equal("Newer Value");
        });
    });
    describe("#oneWayBind(view, prop, prop)", () => {
        it("should one way bind to regular objects", () => {
            var vm = new MyObject();
            var view = {
                customProp: "value"
            };

            var sub = vm.oneWayBind(view, vm => vm.prop1, view => view.customProp);

            vm.prop1 = "New value";

            expect(view.customProp).to.equal("New value");
        });
        it("should not propagate values from view", () => {
            var vm = new MyObject();
            var view = {
                customProp: "value"
            };
            vm.prop1 = "customValue";
            var sub = vm.oneWayBind(view, vm => vm.prop1, view => view.customProp);

            view.customProp = "New value";

            expect(vm.prop1).to.equal("customValue");
        });
        it("should return a subscription", () => {
            var vm = new MyObject();
            var view = {
                customProp: "value"
            };
            var sub = vm.oneWayBind(view, vm => vm.prop1, view => view.customProp);

            expect(sub).to.be.instanceOf(Subscription);
        });
        it("should recieve multiple values from the view model and apply them to the view", () => {
            var vm = new MyObject();
            var helper = new ViewBindingHelper();
            var view = {
                __viewBindingHelper: helper,
                changed: null,
                prop: "property value"
            };
            vm.prop1 = "Old Value";

            var sub = vm.oneWayBind(view, vm => vm.prop1, view => view.prop);

            expect(view.prop).to.equal("Old Value");

            vm.prop1 = "New Value";
            vm.prop1 = "Newer Value";

            sub.unsubscribe();
            expect(view.prop).to.equal("Newer Value");
        });
    });
    describe(".bindObservable", () => {
        it("should return a subscription", () => {
            var observable = Observable.of(true, false);
            var view = {
                customProp: "value"
            };
            var sub = ReactiveObject.bindObservable(observable, view, view => view.customProp);

            expect(sub).to.be.instanceOf(Subscription);
        });
        it("should pipe values from the observable to the view", () => {
            var observable = Observable.of(true, false);
            var view = {
                customProp: "value"
            };
            var sub = ReactiveObject.bindObservable(observable, view, view => view.customProp);

            // Both values are piped through immediately
            expect(view.customProp).to.be.false;
        });
    });
    describe("#toProperty(observable, prop)", () => {
        it("should return a subscription", () => {
            var obj = new ReactiveObject();
            var sub = obj.toProperty(Observable.of(true), "prop");
            expect(sub).to.be.instanceOf(Subscription);
        });
        it("should bind the latest value from the given observable to the given property", () => {
            var obj = new ReactiveObject();
            var sub = obj.toProperty(Observable.of(false, true), "prop");
            expect(obj.get("prop")).to.be.true;
        });
        it("should raise a property changed event when the given observable resolves", () => {
            var obj = new ReactiveObject();
            var events: PropertyChangedEventArgs<boolean>[] = [];
            obj.whenAny("prop").subscribe(e => events.push(e));
            var sub = obj.toProperty(Observable.of(false, true), "prop");
            expect(events.length).to.equal(2);
            expect(events[0].newPropertyValue).to.be.false;
            expect(events[1].newPropertyValue).to.be.true;
        });
        it("should ignore consecutive duplicate values", () => {
            var obj = new ReactiveObject();
            var events: PropertyChangedEventArgs<boolean>[] = [];
            obj.whenAny("prop").subscribe(e => events.push(e));
            var sub = obj.toProperty(Observable.of(false, false, false, true), "prop");
            expect(events.length).to.equal(2);
            expect(events[0].newPropertyValue).to.be.false;
            expect(events[1].newPropertyValue).to.be.true;
        });
        it("should not support setting nested values", () => {
            var obj = new ReactiveObject();
            expect(() => {
                var sub = obj.toProperty(Observable.of(false, true), "prop.val");
            }).to.throw("Null Reference Exception. Cannot set a child property on a null or undefined property of this object.");
        });
    });
});