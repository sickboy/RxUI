/// <reference path="../references.d.ts" />
import {TestScheduler} from "rxjs/Rx.KitchenSink";
import {ReactiveObject} from "../src/reactive-object";
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
});