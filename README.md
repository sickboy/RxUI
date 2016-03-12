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
