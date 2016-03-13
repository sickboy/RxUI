# RxUI
A Cross-Framework [MVVM](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel) framework that utilizes [RxJS](https://github.com/ReactiveX/RxJS) to build declarative, composable, and testable User Interfaces in JavaScript.

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

```
import {ReactiveObject} from "rxui/ReactiveObject";
import {ISearchService} from "wherever/search/service/is";

class SearchViewModel extends ReactiveObject {
    public get searchQuery(): string {
        return this.get("searchQuery");   
    }
    
    public set searchQuery(value: string): void {
        this.set("searchQuery", value);
    }
    
    constructor(private searchService: ISearchService) {
        var canSearch = this.whenAny("searchQuery", q => q.newPropertyValue != "");
        
        // TODO:
    }
}
```

### ES5

Comming Soon!
