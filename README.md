# RxUI
A Cross-Framework [MVVM](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel) framework that utilizes [RxJS](https://github.com/ReactiveX/RxJS) to build declarative, composable, and testable User Interfaces in JavaScript.

Inspired by [ReactiveUI](https://github.com/reactiveui/ReactiveUI) ([website](http://www.reactiveui.net/))

## Installation

```
npm install rxui --save
```

## Usage

### TypeScript (Recommended)

```
import {ReactiveObject} from "rxui/reactive-object";
import {ReactiveCommand} from "rxui/reactive-command";
import {Observable} from "rxjs/Observable";

// Example from ReactiveUI Documentation (http://docs.reactiveui.net/en/user-guide/commands/an-example.html)
class LoginViewModel extends ReactiveObject {
    
    public loginCommand: ReactiveCommand<boolean>;
    public resetCommand: ReactiveCommand<boolean>;
    
    constructor() {
        var canLogin = this.whenAnyValue<string, string, boolean>(
            "userName",
            "password",
            (userName, password) => userName && password
        );
        
        this.loginCommand = ReactiveCommand.createFromObservable(
            (a) => this.loginAsync(),
            canLogin
        );
        
        this.resetCommand = ReactiveCommand.create(() => {
            this.set("userName", "");
            this.set("password", "");
        });
    }
    
    loginAsync(): Observable<boolean> {
        // Cool login logic   
    }
}
```

### ES5

Comming Soon!
