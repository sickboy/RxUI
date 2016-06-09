import {ReactiveObject} from "../src/reactive-object";
import {ReactiveArray, DerivedReactiveArrayBuilder} from "../src/reactive-array";
import {CollectionChangedEventArgs} from "../src/events/collection-changed-event-args";
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
});