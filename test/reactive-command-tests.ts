import {ReactiveCommand} from "../src/reactive-command";
import {TestScheduler} from "rxjs/testing/TestScheduler";
import {Observable} from "rxjs/Rx";
import {expect} from "chai";

describe("ReactiveCommand", () => {
    describe(".canExecute", () => {
        it("should default to false", (done) => {
            var command: ReactiveCommand<boolean> = new ReactiveCommand(Observable.empty(), (a) => Observable.fromArray([true]));

            command.canExecute.take(1).subscribe(can => {
                expect(can).to.be.false;
                done();
            }, err => done(err));
        });
        it("should use what the given canRun observable observes", (done) => {
            var command: ReactiveCommand<boolean> = new ReactiveCommand(Observable.fromArray([true]).delay(5), (a) => Observable.fromArray([false]));

            command.canExecute.bufferTime(10).take(1).subscribe((can: boolean[]) => {
                expect(can.length).to.equal(2);
                expect(can[0]).to.be.false;
                expect(can[1]).to.be.true;
                done();
            }, err => done(err));
        });
        it("should be false while the command is executing", (done) => {
            var command: ReactiveCommand<boolean> = new ReactiveCommand(Observable.fromArray([true]), (a) => {
                return Observable.fromArray([false]);
            });

            command.canExecute.bufferCount(3).take(1).subscribe((can: boolean[]) => {
                expect(can.length).to.equal(3);
                expect(can[0]).to.be.true;
                expect(can[1]).to.be.false; // Cannot Execute While Running. 
                expect(can[2]).to.be.true;
                done();
            }, err => done(err));

            command.executeAsync(null);
        });
    });

    describe(".isExecuting", () => {
        it("should default to false", (done) => {
            var command: ReactiveCommand<boolean> = new ReactiveCommand(Observable.empty(), (a) => Observable.fromArray([true]));

            command.isExecuting.take(1).subscribe(executing => {
                expect(executing).to.be.false;
                done();
            }, err => done(err));
        });
        it("should be true while the command is executing", (done) => {
            var command: ReactiveCommand<boolean> = new ReactiveCommand(Observable.fromArray([true]), (a) => Observable.fromArray([true]));

            command.isExecuting.bufferCount(3).take(1).subscribe((executing: boolean[]) => {
                expect(executing.length).to.equal(3);
                expect(executing[0]).to.be.false;
                expect(executing[1]).to.be.true;
                expect(executing[2]).to.be.false;
                done();
            });
            
            command.executeAsync(null);
        });
    });
});