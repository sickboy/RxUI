# RxUI
A MVVM Framework that greatly simplifies asynchronous user interface programming by using Observables.  

Inspired by [ReactiveUI](https://github.com/reactiveui/ReactiveUI) ([website](http://www.reactiveui.net/))

| `master`  | `all` |
| ------------- | ------------- |
| [![wercker status](https://app.wercker.com/status/a2727fbb1085baff0a49e73761a9b7a6/s/master "wercker status")](https://app.wercker.com/project/bykey/a2727fbb1085baff0a49e73761a9b7a6) | [![wercker status](https://app.wercker.com/status/a2727fbb1085baff0a49e73761a9b7a6/s "wercker status")](https://app.wercker.com/project/bykey/a2727fbb1085baff0a49e73761a9b7a6)  |
| [![wercker status](https://app.wercker.com/status/a2727fbb1085baff0a49e73761a9b7a6/m/master "wercker status")](https://app.wercker.com/project/bykey/a2727fbb1085baff0a49e73761a9b7a6) | [![wercker status](https://app.wercker.com/status/a2727fbb1085baff0a49e73761a9b7a6/m "wercker status")](https://app.wercker.com/project/bykey/a2727fbb1085baff0a49e73761a9b7a6)  |


## Installation

```
npm install rxui --save
```

## Usage

### TypeScript (Recommended)

```TypeScript
import {ReactiveObject, ReactiveCommand} from "rxui";
import {Observable} from "rxjs/Rx";

// Example from ReactiveUI Documentation (http://docs.reactiveui.net/en/user-guide/commands/an-example.html)
class LoginViewModel extends ReactiveObject {
    
    public userName: string;
    public password: string;

    public loginCommand: ReactiveCommand<boolean>;
    public resetCommand: ReactiveCommand<boolean>;
    
    constructor() {
        
        // Tell the ReactiveObject constructor that we want
        // userName and password to be reactive properties that
        // can be watched with whenAny and whenAnyValue. 
        super(["userName", "password"]);

        // This is a strongly-typed observable
        // that notifies observers whether the user can login.
        var canLogin = this.whenAnyValue(
            vm => vm.userName,
            vm => vm.password,
            (userName, password) => userName && password
        );
        
        // Creates a command from a function that returns a promise.
        // This command is also strongly-typed, so observed values
        // will see the same results that are returned from this.loginAsync().
        this.loginCommand = ReactiveCommand.createFromTask(
            (a) => this.loginAsync(),
            canLogin
        );
        
        // Creates a synchronous command that just clears the userName and
        // password fields when executed. 
        this.resetCommand = ReactiveCommand.create(() => {
            this.userName = "";
            this.password = "";
        });
    }
    
    loginAsync(): Promise<boolean> {
        // Cool login logic   
    }
}
```

### ES5

```javascript
// If you decide to use ES5, you need to use traditional prototype-based inheritance.
// Generally, you will not define your reactive objects with ES5, only consume them.
var LoginViewModel = function() {
    RxUI.ReactiveObject.call(this, ["userName", "password"]);
    var _this = this;
    var canLogin = this.whenAnyValue(
        "userName",
        "password",
        function(userName, password) { return userName && password; }
    );

    this.loginCommand = RxUI.ReactiveCommand.createFromTask(
        function(a) { return _this.loginAsync() },
        canLogin
    );

    this.resetCommand = RxUI.ReactiveCommand.create(
        function() { 
            _this.userName = "";
            _this.password = "";
        });
}
LoginViewModel.prototype = Object.create(RxUI.ReactiveObject.prototype);
LoginViewModel.prototype.constructor = LoginViewModel;
LoginViewModel.prototype.loginAsync = function() {
    // Cool login logic
};
```

## Philosophy

There are two major goals of this framework:

1. To make asynchronous logic and it's presentation as simple as possible.
   - This is solved by encouraging minimal app state and encapsulated logic.
2. To make that same logic 100% testable and reusable.
   - This is solved by using Plain Old TypeScript Objects, and no global state.

We can solve both of these problems with Functional Reactive Programming.
As stated in the name, FRP is functional, which is to say it prefers stateless code, and reactive, which means it deals with asynchronous events.
With this in mind, we can treat changes to the state of our application as a stream of events, and compose them using traditional functional paradigms.

For example:

```typescript
// This object stores our state.
// It can be whatever state we want. Maybe it is UI state, maybe it is logic state.
class MyModel extends ReactiveObject {

    myProperty: string;
    
    constructor() {
        // We need to specify the properties that the object should setup setter and getters for.
        super(["myProperty"]);
    }
}

// Let's create a new model.
var model = new MyModel();

// Now, what should we do with it?

// Well, maybe we want to write the most recent myProperty of this new model object
// value out to the JS Console.

// How can we do this?

// In a traditional system, we would need to recheck the model whenever something happens that
// could change the value of the property on the model.
// In Angular for example, change detection is run when a browser event happens, a XHR occurs, or when setTimeout or setInterval resolves.
// But what if there was a different source of change? Well, then you are out of luck.

// In RxUI, properties can be backed by a store that observes all of the changes. In this respect, we don't need to know where or when
// state is going to change, we can just respond to it.

// It is done like this:
var observable = model.whenAnyValue(m => m.myProperty);

// We just retrieved an observable that can tell us when myProperty has changed on our model object.
// These observables represent a sequence of values. In this case, the sequence of values that have been set to
// myProperty. For what it's worth, observables are like promises, but instead of a single value that resolves, it is multiple values.
// Oh, and that fancy lambda function? It's just a RxUI way of avoiding strings for passing property names as parameters.

// So, let's listen to each value that myProperty takes:
var subscription = observable.subscribe(value => console.log(value));

// > null

// Hmm... looks like a value has already resolved. It is null.
// RxUI always sends the current value from the property because we will probably need it.

// Now let's change the value and see if we get notified:
model.myProperty = "Hello, RxUI!";

// > "Hello, RxUI"

// Sweet! So now whenever myProperty is changed on the model variable, the new value is
// printed on the console.

// Why is this useful? Well, it lets us talk about our application logic in terms of data and how that data should be manipulated and presented.
// We don't need to worry about notifying this object or that object about the change, that happens for us automatically.

// Oh, and when we want to stop listening for changes, we can unsubscribe:
subscription.unsubscribe();

// How about a slightly more compelling example.
// Say we have a button, and we want to increment a value by 10 whenever that button is clicked.
// Additionally, every 5 seconds, we want to increment that same value by 1.
// Finally, whenever the value is changed, we want to print "Hello {num} times!" to the console.

// This is really simple in RxUI:
class NumModel extends ReactiveObject {
    public num: number;
    
    constructor() {
        super(["num"]);
    }
}

var numModel = new NumModel();

// Everytime a button is pressed, increment num by 10
function buttonClickHandler() {
    numModel.num += 10;
}

// Every 5 seconds, increment num by 1
setInterval(() => numModel.num += 1, 5000);

// Whenever num changes, print "Hello {num} times!"
subscription = numModel.whenAnyValue(m => m.num)
    .map(n => `Hello ${n} times!`)
    .subscribe(message => console.log(message));

// > "Hello 0 times!"
// *buttonClickHandler() called*
// > "Hello 10 times!"
// *first 5 seconds passed*
// > "Hello 11 times!"
// *first 10 seconds passed*
// > "Hello 12 times!"
// ...etc...

// Notice that it doesn't matter how we change the num property, we still get updated when it changes.

// Now, most of the time, we will want to control how the property changes so that events are testable. 
// In the NumModel example for instance, we would want to place the buttonClickHandler() and setInterval() incrementing logic
// in the NumModel class.
// We can do this using commands.
// Commands in RxUI wrap operations that do things.
// These operations could be most anything, but typically they are either asynchronous promises or observables, or synchronous functions. 

class ImprovedNumModel extends NumModel {
    // commands can accept an optional parameter, and return an optional value.
    increment: ReactiveCommand<number, number>;
    
    constructor() {
        super();
        
        // Create a synchronous command that
        // takes the current number, adds the other number to it, and returns the result.
        this.increment = ReactiveCommand.create((num: number) => {
            return this.num + num;
        });
        // Set the most recent result of the command
        // to the num property on this object.
        this.toProperty(
            this.increment.results,
            m => m.num
        );
    }
}

var improvedModel = new ImprovedNumModel();

// then we could redefine the handlers as such:
function improvedButtonClickHandler() {
    improvedModel.increment.execute(10).subscribe();
}

setInterval(() => improvedModel.increment.execute(1).subscribe(), 5000);

// Then we could carry on exactly as normal.
// We have successfully refactored our model to use unidirectional data flow.
// Quite literally:
// 1. the events are translated into actions (improvedButtonClickHandler() and setInterval()).
// 2. the action transforms the event into the new state.
// 3. the observers are updated with the new state.
// event --> action --> new state --> update
``` 

## Examples

Check out the [examples repo](https://github.com/KallynGowdy/RxUI-Examples) for a set of demos spanning Angular, Ember, and React, sharing the same core logic between all of them.

## Contributing

If you encounter any issues, [please submit them](https://github.com/KallynGowdy/RxUI/issues). This framework is still very new and very incomplete, so there are bound to be issues :)

Additionally, I've been the only one working on this project, so it can be difficult for me to discover all of the bugs myself.

Finally, if you have suggestions for improvements, I would love to hear them! 
But I would love to review pull requests for your wonderful ideas even more.

Now, before you go and spend a couple hours on a [Pull Request](https://github.com/KallynGowdy/RxUI/pulls), make sure that you create a new issue and get a greenlight so that your
time isn't potentially wasted due to it not being the best fit. 