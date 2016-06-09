import {ReactiveObject} from "../src/reactive-object";
import {ReactiveArray} from "../src/reactive-array";
import {Observable, Subject, TestScheduler} from "rxjs/Rx";
import {expect} from "chai";
import {MyObject} from "./models/my-object";
import {MyOtherObject} from "./models/my-other-object";

describe("ReactiveArray", () => {
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
});