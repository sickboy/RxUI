import {ReactiveInteraction} from "../src/reactive-interaction";
import {expect} from "chai";
import {Subscription} from "rxjs/Subscription";

describe("ReactiveInteraction", () => {
    describe("#registerHandler(handler)", () => {
        it("should throw when given a null handler function", () => {
            var interaction = new ReactiveInteraction();
            expect(() => {
                interaction.registerHandler(null);
            }).to.throw();
        });
        it("should return a subscription", () => {
            var interaction = new ReactiveInteraction();
            var sub = interaction.registerHandler(() => ({}));
            expect(sub).to.be.instanceOf(Subscription);
        });
        it("should remove the handler when the subscription is disposed", (done) => {
            var interaction = new ReactiveInteraction();
            var ret = {};
            var handler = () => ret;
            var sub = interaction.registerHandler(handler);
            sub.unsubscribe();

            // no handlers
            interaction.handle().catch(ex => {
                done();
            });
        });
    });
    describe("#handle(value)", () => {
        it("should call the registered handler", (done) => {
            var interaction = new ReactiveInteraction();
            var ret = {};
            var handler = () => ret;
            var sub = interaction.registerHandler(handler);

            interaction.handle().then(val => {
                expect(val).to.equal(ret);
                done();
            }, err => done(err));
        });
        it("should call the newest handler first", (done) => {
            var interaction = new ReactiveInteraction();
            var ret = {};
            var first = () => ({});
            var handler = () => ret;

            interaction.registerHandler(first);
            interaction.registerHandler(handler);

            interaction.handle().then(val => {
                expect(val).to.equal(ret);
                done();
            }, err => done(err));
        });
        it("should reject when no handlers are registered", (done) => {
            var interaction = new ReactiveInteraction();
            interaction.handle().catch(ex => {
                done();
            });
        });
        it("should call second handler when first returns undefined", (done) => {
            var interaction = new ReactiveInteraction();
            var ret = {};
            var first = () => ret;
            var handler = () => { };

            interaction.registerHandler(first);
            interaction.registerHandler(<any>handler);

            interaction.handle().then(val => {
                expect(val).to.equal(ret);
                done();
            }, err => done(err));
        });
        it("should use handlers that return promises", (done) => {
            var interaction = new ReactiveInteraction();
            var ret = {};
            var first = () => Promise.resolve({});
            var handler = () => Promise.resolve(ret);

            interaction.registerHandler(first);
            interaction.registerHandler(handler);

            interaction.handle().then(val => {
                expect(val).to.equal(ret);
                done();
            }, err => done(err));
        });
        it("should surface thrown exceptions from handlers through the promise", (done) => {
            var interaction = new ReactiveInteraction();
            var ret = {};
            var first = () => { throw new Error("Error") };

            interaction.registerHandler(<any>first);

            interaction.handle().then(val => done(new Error("Error Expected")), err => {
                expect(err.message).to.equal("Error");
                done();
            });
        });
        it("should surface rejected promises from handlers through the promise", (done) => {
            var interaction = new ReactiveInteraction();
            var ret = {};
            var first = () => Promise.reject(new Error("Error"));

            interaction.registerHandler(first);

            interaction.handle().then(val => done(new Error("Error Expected")), err => {
                expect(err.message).to.equal("Error");
                done();
            });
        });
    });
});