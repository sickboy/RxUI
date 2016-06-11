import {ReactiveObject} from "../src/reactive-object";
import {ReactiveArray, DerivedReactiveArrayBuilder} from "../src/reactive-array";
import {CollectionChangedEventArgs} from "../src/events/collection-changed-event-args";
import {PropertyChangedEventArgs} from "../src/events/property-changed-event-args";
import {Observable, Subject, TestScheduler} from "rxjs/Rx";
import {expect} from "chai";
import {MyObject} from "./models/my-object";
import {MyOtherObject} from "./models/my-other-object";

describe("ReactiveArray", () => {
    describe("#getItem()", () => {
        it("should return the value at the given index", () => {
            var arr = ReactiveArray.of("First", "Second");
            expect(arr.getItem(0)).to.equal("First");
        });
        it("should return undefined if the value doesnt exist", () => {
            var arr = new ReactiveArray<string>();
            expect(arr.getItem(0)).to.be.undefined;
        });
    });
    describe("#setItem()", () => {
        it("should set the item at the index to the given value", () => {
            var arr = ReactiveArray.of("First", "Second");
            arr.setItem(0, "New");
            expect(arr.getItem(0)).to.equal("New");
        });
    });
    describe("#unshift()", () => {
        it("should add the given value to the beginning of the array", () => {
            var arr = new ReactiveArray<string>();
            arr.unshift("Hello");
            arr.unshift("World");
            expect(arr.length).to.equal(2);
            expect(arr.getItem(0)).to.equal("World");
            expect(arr.getItem(1)).to.equal("Hello");
        });
        it("should add multple arguments as multiple values", () => {
            var arr = new ReactiveArray<string>();
            arr.unshift("Hello", "World");
            expect(arr.length).to.equal(2);
            expect(arr.getItem(0)).to.equal("Hello");
            expect(arr.getItem(1)).to.equal("World");
        });
    });
    describe("#shift()", () => {
        it("should remove the first element from the array", () => {
            var arr = ReactiveArray.of("Hello", "World");
            arr.shift();
            expect(arr.length).to.equal(1);
            expect(arr.getItem(0)).to.equal("World");
        });
        it("should return the removed value", () => {
            var arr = ReactiveArray.of("Hello", "World");
            var ret = arr.shift();
            expect(ret).to.equal("Hello");
        });
    });
    describe("#push()", () => {
        it("should add the given value to the end of the array", () => {
            var arr = new ReactiveArray<string>();
            arr.push("Hello");
            arr.push("World");
            expect(arr.length).to.equal(2);
            expect(arr.getItem(0)).to.equal("Hello");
            expect(arr.getItem(1)).to.equal("World");
        });
        it("should add multiple arguments as multiple values", () => {
            var arr = new ReactiveArray<string>();
            arr.push("Hello", "World");
            expect(arr.length).to.equal(2);
            expect(arr.getItem(0)).to.equal("Hello");
            expect(arr.getItem(1)).to.equal("World");
        });
    });
    describe("#pop()", () => {
        it("should remove the last value from the array", () => {
            var arr = new ReactiveArray<string>();
            arr.push("Hello", "World");
            arr.pop();
            expect(arr.length).to.equal(1);
            expect(arr.getItem(0)).to.equal("Hello");
        });
        it("should return the removed value", () => {
            var arr = new ReactiveArray<string>();
            arr.push("Hello", "World");
            var ret = arr.pop();
            expect(ret).to.equal("World");
        });
    });
    describe("#slice()", () => {
        it("should create a new ReactiveArray", () => {
            var arr = new ReactiveArray<string>();
            arr.push("Stuff", "Great!");
            var other = arr.slice();
            arr.pop();
            expect(other.length).to.equal(2);
            expect(other.getItem(0)).to.equal("Stuff");
            expect(other.getItem(1)).to.equal("Great!");
        });
        it("should return a subset of the total array", () => {
            var arr = new ReactiveArray<string>();
            arr.push("More", "Values", "That", "are", "kinda");
            var other = arr.slice(1, 4);
            expect(other.length).to.equal(3);
            expect(other.getItem(0)).to.equal("Values");
            expect(other.getItem(1)).to.equal("That");
            expect(other.getItem(2)).to.equal("are");
        });
    });
    describe("#splice()", () => {
        it("should remove the specified number of elements from the given starting point", () => {
            var arr = ReactiveArray.of("First", "Second", "Third", "Fourth", "Fifth", "Sixth");
            arr.splice(1, 3);
            expect(arr.length).to.equal(3);
            expect(arr.getItem(0)).to.equal("First");
            expect(arr.getItem(1)).to.equal("Fifth");
            expect(arr.getItem(2)).to.equal("Sixth");
        });
        it("should return a new ReactiveArray that contains the deleted elements", () => {
            var arr = ReactiveArray.of("First", "Second", "Third", "Fourth", "Fifth", "Sixth");
            var deleted = arr.splice(1, 3);
            expect(deleted.length).to.equal(3);
            expect(deleted.getItem(0)).to.equal("Second");
            expect(deleted.getItem(1)).to.equal("Third");
            expect(deleted.getItem(2)).to.equal("Fourth");
        });
        it("should insert the given elements into the array", () => {
            var arr = ReactiveArray.of("First", "Second", "Third", "Fourth", "Fifth", "Sixth");
            arr.splice(1, 0, "Seventh", "Eighth");
            expect(arr.length).to.equal(8);
            expect(arr.getItem(0)).to.equal("First");
            expect(arr.getItem(1)).to.equal("Seventh");
            expect(arr.getItem(2)).to.equal("Eighth");
            expect(arr.getItem(3)).to.equal("Second");
            expect(arr.getItem(4)).to.equal("Third");
            expect(arr.getItem(5)).to.equal("Fourth");
            expect(arr.getItem(6)).to.equal("Fifth");
            expect(arr.getItem(7)).to.equal("Sixth");
        });
    });
    describe("#map()", () => {
        it("should return a new ReactiveArray with the transformed elements", () => {
            var arr = ReactiveArray.of("Hello", "World");
            var mapped = arr.map(str => str.length);
            expect(mapped.length).to.equal(2);
            expect(mapped.getItem(0)).to.equal(5);
            expect(mapped.getItem(1)).to.equal(5);
        });
    });
    describe("#filter()", () => {
        it("should return a new ReactiveArray with the unmatched values removed", () => {
            var arr = ReactiveArray.of("Hello", "World");
            var filtered = arr.filter(str => str[0] === 'H');
            expect(filtered.length).to.equal(1);
            expect(filtered.getItem(0)).to.equal("Hello");
        });
    });
    describe("#sort()", () => {
        it("should return a new ReactiveArray that is sorted", () => {
            var arr = ReactiveArray.of("Value", "Zed", "Add");
            var sorted = arr.sort();
            expect(sorted.length).to.equal(3);
            expect(sorted.getItem(0)).to.equal("Add");
            expect(sorted.getItem(1)).to.equal("Value");
            expect(sorted.getItem(2)).to.equal("Zed");
        });
        it("should use the given compare function", () => {
            var arr = ReactiveArray.of("Value", "Zed", "Good");
            var sorted = arr.sort((a, b) => a.length > b.length ? 1 : a.length == b.length ? 0 : -1);
            expect(sorted.length).to.equal(3);
            expect(sorted.getItem(0)).to.equal("Zed");
            expect(sorted.getItem(1)).to.equal("Good");
            expect(sorted.getItem(2)).to.equal("Value");
        });
    });
    describe("#forEach()", () => {
        it("should iterate over each of the elements", () => {
            var arr = ReactiveArray.of("Hello", "World");
            var other = new ReactiveArray<string>();
            arr.forEach((value, index) => {
                other.push(value + index);
            });
            expect(other.length).to.equal(2);
            expect(other.getItem(0)).to.equal("Hello0");
            expect(other.getItem(1)).to.equal("World1");
        });
    });
    describe("#indexOf()", () => {
        it("should return the index of the first item that was matched", () => {
            var arr = ReactiveArray.of("Hello", "World", "Hello", "World");
            var index = arr.indexOf("World");
            expect(index).to.equal(1);
        });
        it("should return -1 if the item wasn't found", () => {
            var arr = ReactiveArray.of("Hello", "World", "Hello", "World");
            var index = arr.indexOf("Not Found");
            expect(index).to.equal(-1);
        });
    });
    describe("#lastIndexOf()", () => {
        it("should return the index of the last item that was matched", () => {
            var arr = ReactiveArray.of("Hello", "World", "Hello", "World");
            var index = arr.lastIndexOf("World");
            expect(index).to.equal(3);
        });
        it("should return -1 if the item wasn't found", () => {
            var arr = ReactiveArray.of("Hello", "World", "Hello", "World");
            var index = arr.lastIndexOf("Not Found");
            expect(index).to.equal(-1);
        });
    });
    describe("#reduce()", () => {
        it("should produce a single value from the array", () => {
            var arr = ReactiveArray.of(10, 10, 10);
            var result = arr.reduce((a, b) => a + b);
            expect(result).to.equal(30);
        });
        it("should handle having only a single element in the array", () => {
            var arr = ReactiveArray.of(10);
            var result = arr.reduce((a, b) => a + b);
            expect(result).to.equal(10);
        });
    });
    describe("#every()", () => {
        it("should should return true if the given condition is true for every element", () => {
            var arr = ReactiveArray.of(10, 15, 20);
            var result = arr.every(n => n >= 10);
            expect(result).to.be.true;
        });
        it("should should return false if the given condition is not true for every element", () => {
            var arr = ReactiveArray.of(9, 15, 20);
            var result = arr.every(n => n >= 10);
            expect(result).to.be.false;
        });
        it("should return true when no elements are in the array", () => {
            var arr = new ReactiveArray<number>();
            var result = arr.every(n => n >= 10);
            expect(result).to.be.true;
        });
    });
    describe("#some()", () => {
        it("should should return true if the given condition is true for any element", () => {
            var arr = ReactiveArray.of(9, 10, 8);
            var result = arr.some(n => n >= 10);
            expect(result).to.be.true;
        });
        it("should should return false if the given condition is not true for any element", () => {
            var arr = ReactiveArray.of(9, 7, 6);
            var result = arr.some(n => n >= 10);
            expect(result).to.be.false;
        });
        it("should return false when no elements are in the array", () => {
            var arr = new ReactiveArray<number>();
            var result = arr.some(n => n >= 10);
            expect(result).to.be.false;
        });
    });
    describe("#find()", () => {
        it("should return the first element in the array that matches the given condition", () => {
            var arr = ReactiveArray.of(0, 10, 8);
            var result = arr.find(n => n >= 10);
            expect(result).to.equal(10);
        });
        it("should return undefined if an element could not be found", () => {
            var arr = ReactiveArray.of(0, 1, 2);
            var result = arr.find(n => n >= 10);
            expect(result).to.be.undefined;
        });
    });
    describe("#findIndex()", () => {
        it("should return the index of the first element in the array that matches the given condition", () => {
            var arr = ReactiveArray.of(0, 10, 8);
            var result = arr.findIndex(n => n >= 10);
            expect(result).to.equal(1);
        });
        it("should return -1 if an element could not be found", () => {
            var arr = ReactiveArray.of(0, 1, 2);
            var result = arr.findIndex(n => n >= 10);
            expect(result).to.equal(-1);
        });
    });
    describe("#toString()", () => {
        it("should present each of the array values surrounded by brackets", () => {
            var arr = ReactiveArray.of(undefined, "First", "Second", "Third", null);
            var str = arr.toString();
            expect(str).to.equal("[undefined, 'First', 'Second', 'Third', null]");
        });
        it("should handle objects", () => {
            var arr = ReactiveArray.of({ hello: "world!" });
            var str = arr.toString();
            expect(str).to.equal("[[object Object]]");
        });
    });
    describe("#toJSON()", () => {
        it("should return an array of objects", () => {
            var arr = ReactiveArray.of("First", "Second");
            var json = arr.toJSON();
            expect(json).to.eql(["First", "Second"]);
        });
        it("should map internal objects with their toJSON implementations", () => {
            var obj1 = {
                toJSON() {
                    return "Custom"
                }
            };
            var obj2 = {
                toJSON() {
                    return "Value"
                }
            };

            var arr = ReactiveArray.of(obj1, obj2);
            var json = arr.toJSON();
            expect(json).to.eql(["Custom", "Value"]);
        });
    });
    describe("#toObservable()", () => {
        it("should resolve when subscribed to", () => {
            var arr = ReactiveArray.of("First", "Second");
            var events = [];
            arr.toObservable().subscribe(a => events.push(a));
            expect(events.length).to.equal(1);
            expect(events[0]).to.eql(["First", "Second"]);
        });
        it("should resolve when the array changes", () => {
            var arr = ReactiveArray.of("First", "Second");
            var events = [];
            arr.toObservable().skip(1).subscribe(a => events.push(a));
            arr.push("Third");
            expect(events.length).to.equal(1);
            expect(events[0]).to.eql(["First", "Second", "Third"]);
        });
    });
    describe("#whenAnyValue('length')", () => {
        it("should resolve after #push() has been called", () => {
            var arr = ReactiveArray.of("Value");
            var lengthEvents = [];
            arr.whenAnyValue("length").skip(1).subscribe(l => lengthEvents.push(l));
            arr.push("New", "Values");
            expect(lengthEvents.length).to.equal(1);
            expect(lengthEvents[0]).to.equal(3);
        });
        it("should resolve after #unshift() has been called", () => {
            var arr = ReactiveArray.of("Value");
            var lengthEvents = [];
            arr.whenAnyValue("length").skip(1).subscribe(l => lengthEvents.push(l));
            arr.unshift("New", "Values");
            expect(lengthEvents.length).to.equal(1);
            expect(lengthEvents[0]).to.equal(3);
        });
        it("should resolve after #pop() has been called", () => {
            var arr = ReactiveArray.of("Value");
            var lengthEvents = [];
            arr.whenAnyValue("length").skip(1).subscribe(l => lengthEvents.push(l));
            arr.pop();
            expect(lengthEvents.length).to.equal(1);
            expect(lengthEvents[0]).to.equal(0);
        });
        it("should resolve after #shift() has been called", () => {
            var arr = ReactiveArray.of("Value");
            var lengthEvents = [];
            arr.whenAnyValue("length").skip(1).subscribe(l => lengthEvents.push(l));
            arr.shift();
            expect(lengthEvents.length).to.equal(1);
            expect(lengthEvents[0]).to.equal(0);
        });
        it("should resolve after #splice() has been called with changed property value", () => {
            var arr = ReactiveArray.of("Value1", "Value2", "Value3");
            var lengthEvents = [];
            arr.whenAnyValue("length").skip(1).subscribe(l => lengthEvents.push(l));
            arr.splice(0, 2);
            expect(lengthEvents.length).to.equal(1);
            expect(lengthEvents[0]).to.equal(1);
        });
    });
    describe("#whenAnyItem(prop)", () => {
        it("should resolve when the given property changes on any of the items", () => {
            var obj1 = new ReactiveObject();
            var obj2 = new ReactiveObject();
            var obj3 = new ReactiveObject();

            var arr = ReactiveArray.of(obj1, obj2, obj3);
            var events: PropertyChangedEventArgs<string>[] = [];
            arr.whenAnyItem("prop").subscribe(e => events.push(e));

            obj1.set("prop", "Value");
            expect(events.length).to.equal(4);
            expect(events[0].sender).to.equal(obj1);
            expect(events[0].propertyName).to.equal("prop");
            expect(events[0].newPropertyValue).to.be.null;
            expect(events[1].sender).to.equal(obj2);
            expect(events[1].propertyName).to.equal("prop");
            expect(events[1].newPropertyValue).to.be.null;
            expect(events[2].sender).to.equal(obj3);
            expect(events[2].propertyName).to.equal("prop");
            expect(events[2].newPropertyValue).to.be.null;
            expect(events[3].sender).to.equal(obj1);
            expect(events[3].propertyName).to.equal("prop");
            expect(events[3].newPropertyValue).to.equal("Value");
        });
        it("should resolve when a new item is added", () => {
            var obj1 = new ReactiveObject();
            var obj2 = new ReactiveObject();
            var obj3 = new ReactiveObject();
            var obj4 = new ReactiveObject();

            var arr = ReactiveArray.of(obj1, obj2, obj3);
            var events: PropertyChangedEventArgs<string>[] = [];
            arr.whenAnyItem("prop").skip(3).subscribe(e => events.push(e));
            arr.push(obj4);
            expect(events.length).to.equal(1);
            expect(events[0].sender).to.equal(obj4);
            expect(events[0].propertyName).to.equal("prop");
            expect(events[0].newPropertyValue).to.be.null;
        });
    });
    describe("#whenAnyItemValue()", () => {
        it("should resolve when the given property changes on any of the items", () => {
            var obj1 = new ReactiveObject();
            var obj2 = new ReactiveObject();
            var obj3 = new ReactiveObject();

            var arr = ReactiveArray.of(obj1, obj2, obj3);
            var events: string[] = [];
            arr.whenAnyItemValue<string>("prop").subscribe(e => events.push(e));

            obj1.set("prop", "Value");
            expect(events).to.eql([null, null, null, "Value"]);
        });
        it("should resolve when a new item is added", () => {
            var obj1 = new ReactiveObject();
            var obj2 = new ReactiveObject();
            var obj3 = new ReactiveObject();
            var obj4 = new ReactiveObject();
            obj4.set("prop", "Value");
            var arr = ReactiveArray.of(obj1, obj2, obj3);
            var events: string[] = [];
            arr.whenAnyItemValue<string>("prop").skip(3).subscribe(e => events.push(e));
            arr.push(obj4);
            expect(events.length).to.equal(1);
            expect(events).to.eql(["Value"]);
        });
    });
    describe("#whenAnyItemObservable()", () => {
        it("should resolve when any of the observables from the items resolve", () => {
            var obj1 = new ReactiveObject();
            var obj2 = new ReactiveObject();
            var obj1Subject = new Subject<string>();
            var obj2Subject = new Subject<string>();
            var arr = ReactiveArray.of(obj1, obj2);

            obj1.set("observable", obj1Subject);
            obj2.set("observable", obj2Subject);

            var events: string[] = [];
            arr.whenAnyItemObservable<string>("observable").subscribe(e => events.push(e));
            expect(events).to.eql([]);
            obj1Subject.next("First");
            expect(events).to.eql(["First"]);
            obj2Subject.next("Second");
            expect(events).to.eql(["First", "Second"]);
            obj1.set("observable", Observable.of("Other"));
            expect(events).to.eql(["First", "Second", "Other"]);
        });
        it("should resolve when an observable from an added item resolves", () => {
            var obj1 = new ReactiveObject();
            var obj2 = new ReactiveObject();
            var obj3 = new ReactiveObject();
            var obj1Subject = new Subject<string>();
            var obj2Subject = new Subject<string>();
            var arr = ReactiveArray.of(obj1, obj2);

            obj1.set("observable", obj1Subject);
            obj2.set("observable", obj2Subject);

            var events: string[] = [];
            arr.whenAnyItemObservable<string>("observable").subscribe(e => events.push(e));
            expect(events).to.eql([]);
            obj1Subject.next("First");
            obj2Subject.next("Second");
            arr.push(obj3);
            expect(events).to.eql(["First", "Second"]);
            obj3.set("observable", Observable.of("Great!"));
            obj1.set("observable", Observable.of("Other"));
            expect(events).to.eql(["First", "Second", "Great!", "Other"]);
        });
    });
    describe("#itemsAdded", () => {
        it("should resolve after #push() has been called", () => {
            var arr = ReactiveArray.of("Value");
            var addedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.itemsAdded.subscribe(e => addedEvents.push(e));
            arr.push("New", "Values");
            expect(addedEvents.length).to.equal(1);
            expect(addedEvents[0].addedItemsIndex).to.equal(1);
            expect(addedEvents[0].addedItems.length).to.equal(2);
            expect(addedEvents[0].addedItems[0]).to.equal("New");
            expect(addedEvents[0].addedItems[1]).to.equal("Values");
        });
        it("should resolve after #unshift() has been called", () => {
            var arr = ReactiveArray.of("Value");
            var addedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.itemsAdded.subscribe(e => addedEvents.push(e));
            arr.unshift("New", "Values");
            expect(addedEvents.length).to.equal(1);
            expect(addedEvents[0].addedItemsIndex).to.equal(0);
            expect(addedEvents[0].addedItems.length).to.equal(2);
            expect(addedEvents[0].addedItems[0]).to.equal("New");
            expect(addedEvents[0].addedItems[1]).to.equal("Values");
        });
        it("should resolve after items are added with #splice()", () => {
            var arr = ReactiveArray.of("Value");
            var addedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.itemsAdded.subscribe(e => addedEvents.push(e));
            arr.splice(0, 0, "New", "Values");
            expect(addedEvents.length).to.equal(1);
            expect(addedEvents[0].addedItemsIndex).to.equal(0);
            expect(addedEvents[0].addedItems.length).to.equal(2);
            expect(addedEvents[0].addedItems[0]).to.equal("New");
            expect(addedEvents[0].addedItems[1]).to.equal("Values");
        });
    });
    describe("#itemsRemoved", () => {
        it("should resolve after #pop() has been called on a non empty array", () => {
            var arr = ReactiveArray.of("Value");
            var removedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.itemsRemoved.subscribe(e => removedEvents.push(e));
            arr.pop();
            expect(removedEvents.length).to.equal(1);
            expect(removedEvents[0].removedItemsIndex).to.equal(0);
            expect(removedEvents[0].removedItems.length).to.equal(1);
            expect(removedEvents[0].removedItems[0]).to.equal("Value");
        });
        it("should resolve after #shift() has been called on a non empty array", () => {
            var arr = ReactiveArray.of("Value");
            var removedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.itemsRemoved.subscribe(e => removedEvents.push(e));
            arr.shift();
            expect(removedEvents.length).to.equal(1);
            expect(removedEvents[0].removedItemsIndex).to.equal(0);
            expect(removedEvents[0].removedItems.length).to.equal(1);
            expect(removedEvents[0].removedItems[0]).to.equal("Value");
        });
        it("should not resolve after #pop() has been called on an empty array", () => {
            var arr = new ReactiveArray<string>();
            var removedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.itemsRemoved.subscribe(e => removedEvents.push(e));
            arr.pop();
            expect(removedEvents.length).to.equal(0);
        });
    });
    describe("#changed", () => {
        it("should resolve after #push() has been called", () => {
            var arr = ReactiveArray.of("Value");
            var changedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.changed.subscribe(e => changedEvents.push(e));
            arr.push("New", "Values");
            expect(changedEvents.length).to.equal(1);
            expect(changedEvents[0].addedItemsIndex).to.equal(1);
            expect(changedEvents[0].addedItems.length).to.equal(2);
            expect(changedEvents[0].addedItems[0]).to.equal("New");
            expect(changedEvents[0].addedItems[1]).to.equal("Values");
        });
        it("should resolve after #unshift() has been called", () => {
            var arr = ReactiveArray.of("Value");
            var changedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.changed.subscribe(e => changedEvents.push(e));
            arr.unshift("New", "Values");
            expect(changedEvents.length).to.equal(1);
            expect(changedEvents[0].addedItemsIndex).to.equal(0);
            expect(changedEvents[0].addedItems.length).to.equal(2);
            expect(changedEvents[0].addedItems[0]).to.equal("New");
            expect(changedEvents[0].addedItems[1]).to.equal("Values");
        });
        it("should resolve after items are added or removed with #splice()", () => {
            var arr = ReactiveArray.of("Value");
            var events: CollectionChangedEventArgs<string>[] = [];
            arr.itemsRemoved.subscribe(e => events.push(e));

            // Try to remove 2 items, knowing that only one should be recorded as removed
            // because there's only one item in the array. 
            arr.splice(0, 2, "New", "Values");
            expect(events.length).to.equal(1);
            expect(events[0].addedItemsIndex).to.equal(0);
            expect(events[0].addedItems.length).to.equal(2);
            expect(events[0].addedItems[0]).to.equal("New");
            expect(events[0].addedItems[1]).to.equal("Values");
            expect(events[0].removedItemsIndex).to.equal(0);
            expect(events[0].removedItems.length).to.equal(1);
            expect(events[0].removedItems[0]).to.equal("Value");
        });
        it("should resolve after items are removed with #pop()", () => {
            var arr = ReactiveArray.of("Value");
            var changedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.changed.subscribe(e => changedEvents.push(e));
            arr.pop();
            expect(changedEvents.length).to.equal(1);
            expect(changedEvents[0].removedItemsIndex).to.equal(0);
            expect(changedEvents[0].removedItems.length).to.equal(1);
            expect(changedEvents[0].removedItems[0]).to.equal("Value");
        });
        it("should not resolve if no items are added/removed", () => {
            var arr = ReactiveArray.of("Value");
            var changedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.changed.subscribe(e => changedEvents.push(e));
            arr.splice(0, 0);
            expect(changedEvents.length).to.equal(0);
        });
        it("should resolve after items are removed with #shift()", () => {
            var arr = ReactiveArray.of("Value");
            var changedEvents: CollectionChangedEventArgs<string>[] = [];
            arr.changed.subscribe(e => changedEvents.push(e));
            arr.shift();
            expect(changedEvents.length).to.equal(1);
            expect(changedEvents[0].removedItemsIndex).to.equal(0);
            expect(changedEvents[0].removedItems.length).to.equal(1);
            expect(changedEvents[0].removedItems[0]).to.equal("Value");
        });
    });
    describe(".of()", () => {
        it("should create a ReactiveArray from the given values", () => {
            var arr = ReactiveArray.of("First", "Second", "Third", null);
            expect(arr.length).to.equal(4);
            expect(arr.getItem(0)).to.equal("First");
            expect(arr.getItem(1)).to.equal("Second");
            expect(arr.getItem(2)).to.equal("Third");
            expect(arr.getItem(3)).to.be.null;
        });
    });
    describe(".from()", () => {
        it("should create a ReactiveArray from the given array", () => {
            var normalArr = ["Hello", "World", null];
            var arr = ReactiveArray.from(normalArr);
            expect(arr.length).to.equal(3);
            expect(arr.getItem(0)).to.equal("Hello");
            expect(arr.getItem(1)).to.equal("World");
            expect(arr.getItem(2)).to.be.null;
        });
        it("should create a ReactiveArray from another ReactiveArray", () => {
            var first = new ReactiveArray(["Hello", "World", null]);
            var second = ReactiveArray.from(first);
            expect(second.length).to.equal(3);
            expect(second.getItem(0)).to.equal("Hello");
            expect(second.getItem(1)).to.equal("World");
            expect(second.getItem(2)).to.be.null;
        });
    });
    describe("#derived", () => {
        it("should return a new DerivedReactiveArrayBuilder", () => {
            var arr = ReactiveArray.of("Worlds!");
            var builder = arr.derived;
            expect(builder).to.be.instanceOf(DerivedReactiveArrayBuilder);
        });
        it("should not allow modification", () => {
            var first = ReactiveArray.of("Stuff");
            var second = first.derived.build();
            expect(() => {
                second.push("More Stuff");
            }).to.throw();
            expect(() => {
                second.pop();
            }).to.throw();
            expect(() => {
                second.splice(0, 1);
            }).to.throw();
            expect(() => {
                second.setItem(0, "More Stuff");
            }).to.throw();
            expect(() => {
                second.unshift("More Stuff");
            }).to.throw();
            expect(() => {
                second.shift();
            }).to.throw();
        });
        it("should be able to combine multiple transforms", () => {
            var first = ReactiveArray.of("Hello", "World", null, "Greatness", "from", "Small", "Beginnings");
            var second = first.derived
                .filter(str => str != null)
                .map(str => str.length)
                .filter(l => l > 4)
                .sort((a, b) => a - b)
                .build();

            expect(second.length).to.equal(5);
            expect(second.getItem(0)).to.equal(5);
            expect(second.getItem(1)).to.equal(5);
            expect(second.getItem(2)).to.equal(5);
            expect(second.getItem(3)).to.equal(9);
            expect(second.getItem(4)).to.equal(10);
        });
        describe("#filter()", () => {
            it("should produce a ReactiveArray that only contains items that match the predicate", () => {
                var first = ReactiveArray.of("Hello", "World");
                var second = first.derived.filter(s => s[0] === "H").build();

                expect(second.length).to.equal(1);
                expect(second.getItem(0)).to.equal("Hello");

                first.push("Honest");

                expect(second.length).to.equal(2);
                expect(second.getItem(0)).to.equal("Hello");
                expect(second.getItem(1)).to.equal("Honest");
            });
            it("should handle removed items from the parent array", () => {
                var first = ReactiveArray.of("Hello", "World", "Honest");
                var second = first.derived.filter(s => s[0] === "H").build();
                first.pop();
                expect(second.length).to.equal(1);
                expect(second.getItem(0)).to.equal("Hello");
            });
            it("should only be called once for each item", () => {
                var callCount = 0;
                var first = ReactiveArray.of("Hello", "World");
                var second = first.derived.filter(s => {
                    callCount++;
                    return s[0] === "H";
                }).build();
                expect(callCount).to.equal(2);
                first.push("Honest");
                expect(callCount).to.equal(3);
                first.pop();
                expect(callCount).to.equal(3);
            });
        });
        describe("#map()", () => {
            it("should produce a ReactiveArray that contains items transformed with the given function", () => {
                var first = ReactiveArray.of("Hello", "World");
                var second = first.derived.map(s => s.length).build();

                expect(second.length).to.equal(2);
                expect(second.getItem(0)).to.equal(5);
                expect(second.getItem(1)).to.equal(5);

                first.push("Honest");

                expect(second.length).to.equal(3);
                expect(second.getItem(0)).to.equal(5);
                expect(second.getItem(1)).to.equal(5);
                expect(second.getItem(2)).to.equal(6);
            });
            it("should only be called once for each item", () => {
                var callCount = 0;
                var first = ReactiveArray.of("Hello", "World");
                var second = first.derived.map(s => {
                    callCount++;
                    return s.length;
                }).build();
                expect(callCount).to.equal(2);
                first.push("Honest");
                expect(callCount).to.equal(3);
                first.pop();
                expect(callCount).to.equal(3);
            });
        });
        describe("#sort()", () => {
            it("should produce a ReactiveArray that contains sorted items", () => {
                var first = ReactiveArray.of("B", "Q", "A");
                var second = first.derived.sort().build();

                expect(second.length).to.equal(3);
                expect(second.getItem(0)).to.equal("A");
                expect(second.getItem(1)).to.equal("B");
                expect(second.getItem(2)).to.equal("Q");

                first.push("C");

                expect(second.length).to.equal(4);
                expect(second.getItem(0)).to.equal("A");
                expect(second.getItem(1)).to.equal("B");
                expect(second.getItem(2)).to.equal("C");
                expect(second.getItem(3)).to.equal("Q");
            });
        });
    });
    describe("#computed", () => {
        describe("#reduce()", () => {
            it("should produce an Observable that resolves with the results of array.reduce()", () => {
                var arr = ReactiveArray.of(10, 20, 30);
                var reduced = arr.computed.reduce((a, b) => a + b, 0);
                var events: number[] = [];
                reduced.subscribe(n => events.push(n));
                arr.pop();
                expect(reduced).to.be.instanceOf(Observable);
                expect(events).to.eql([60, 30]);
            });
            it("should be called for each value in the array", () => {
                var calls = 0;
                var arr = ReactiveArray.of(10, 20, 30); // 3 calls
                var reduced = arr.computed.reduce((a, b) => {
                    calls++;
                    return a + b
                }, 0);
                var events: number[] = [];
                reduced.subscribe(n => events.push(n));
                arr.pop(); // 2 new calls
                expect(calls).to.equal(5);
            });
        });
        describe("#every()", () => {
            it("should produce an Observable that resolves with the results of array.every()", () => {
                var arr = ReactiveArray.of(10, 20, 30);
                var reduced = arr.computed.every(n => n >= 10);
                var events: boolean[] = [];
                reduced.subscribe(n => events.push(n));
                arr.push(9);
                expect(reduced).to.be.instanceOf(Observable);
                expect(events).to.eql([true, false]);
            });
            it("should be called for each value in the array", () => {
                var calls = 0;
                var arr = ReactiveArray.of(10, 20, 30); // 3 calls
                var reduced = arr.computed.every(n => {
                    calls++;
                    return n >= 10;
                });
                var events: boolean[] = [];
                reduced.subscribe(n => events.push(n));
                arr.push(9); // 4 new calls
                expect(calls).to.equal(7);
            });
        });
        describe("#some()", () => {
            it("should produce an Observable that resolves with the results of array.some()", () => {
                var arr = ReactiveArray.of(9, 8, 30);
                var reduced = arr.computed.some(n => n >= 10);
                var events: boolean[] = [];
                reduced.subscribe(n => events.push(n));
                arr.pop();
                expect(reduced).to.be.instanceOf(Observable);
                expect(events).to.eql([true, false]);
            });
            it("should be called for each value in the array", () => {
                var calls = 0;
                var arr = ReactiveArray.of(1, 2, 3); // 3 calls because they are all false
                var reduced = arr.computed.some(n => {
                    calls++;
                    return n >= 10;
                });
                var events: boolean[] = [];
                reduced.subscribe(n => events.push(n));
                arr.push(9); // 4 new calls
                expect(calls).to.equal(7);
            });
        });
        describe("#find()", () => {
            it("should produce an Observable that resolves with the results of array.find()", () => {
                var arr = ReactiveArray.of(9, 8, 30);
                var reduced = arr.computed.find(n => n >= 10);
                var events: number[] = [];
                reduced.subscribe(n => events.push(n));
                arr.pop();
                expect(reduced).to.be.instanceOf(Observable);
                expect(events).to.eql([30, undefined]);
            });
            it("should be called for each value in the array", () => {
                var calls = 0;
                var arr = ReactiveArray.of(1, 2, 3); // 3 calls because they are all false
                var reduced = arr.computed.find(n => {
                    calls++;
                    return n >= 10;
                });
                var events: number[] = [];
                reduced.subscribe(n => events.push(n));
                arr.push(9); // 4 new calls
                expect(calls).to.equal(7);
            });
        });
        describe("#findIndex()", () => {
            it("should produce an Observable that resolves with the results of array.find()", () => {
                var arr = ReactiveArray.of(9, 8, 30);
                var reduced = arr.computed.findIndex(n => n >= 10);
                var events: number[] = [];
                reduced.subscribe(n => events.push(n));
                arr.pop();
                expect(reduced).to.be.instanceOf(Observable);
                expect(events).to.eql([2, -1]);
            });
            it("should be called for each value in the array", () => {
                var calls = 0;
                var arr = ReactiveArray.of(1, 2, 3); // 3 calls because they are all false
                var reduced = arr.computed.findIndex(n => {
                    calls++;
                    return n >= 10;
                });
                var events: number[] = [];
                reduced.subscribe(n => events.push(n));
                arr.push(9); // 4 new calls
                expect(calls).to.equal(7);
            });
        });
    });
});