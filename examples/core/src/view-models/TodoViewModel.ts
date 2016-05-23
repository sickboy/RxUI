import {ReactiveObject, ReactiveCommand} from "rxui";
import {Todo} from "../models/Todo";
import {TodoStorage} from "../services/TodoStorage";
import {Observable} from "rxjs/Rx";

/**
 * Defines a view model that provides functionality for viewing and editing TODOs.
 */
export class TodoViewModel extends ReactiveObject {

    private _store: TodoStorage;
    private _saveCommand: ReactiveCommand<{}, boolean>;
    private _loadCommand: ReactiveCommand<{}, Todo[]>;
    private _deleteCommand: ReactiveCommand<Todo, boolean>;
    private _toggleTodo: ReactiveCommand<Todo, boolean>;
    private _addCommand: ReactiveCommand<{}, boolean>;
    private _editCommand: ReactiveCommand<{}, boolean>;
    private _undoCommand: ReactiveCommand<{}, boolean>;

    private _originalTodo: Todo;

    public get save(): ReactiveCommand<{}, boolean> {
        return this._saveCommand;
    }
    public get loadTodos(): ReactiveCommand<{}, Todo[]> {
        return this._loadCommand;
    }
    
    public get deleteTodo(): ReactiveCommand<Todo, boolean> {
        return this._deleteCommand;
    }
    public get toggleTodo(): ReactiveCommand<Todo, boolean> {
        return this._toggleTodo;
    }
    public get addTodo(): ReactiveCommand<{}, boolean> {
        return this._addCommand;
    }
    public get edit(): ReactiveCommand<{}, boolean> {
        return this._editCommand;
    }
    public get undo(): ReactiveCommand<{}, boolean> {
        return this._undoCommand;
    }

    /**
     * Gets the array of TODOs that are being presented by this view model.
     */
    public get todos(): Todo[] {
        return this.get("todos");
    }

    /**
     * Sets the array of TODOs that are being presented by this view model.
     */
    public set todos(todos: Todo[]) {
        this.set("todos", todos);
    }

    /**
     * Gets the TODO that is currently being edited.
     */
    public get editedTodo(): Todo {
        return this.get("editedTodo");
    }

    /**
     * Sets the TODO that is currently being edited.
     */
    public set editedTodo(todo: Todo) {
        this.set("editedTodo", todo);
    }

    /**
     * Gets the TODO that is being created.
     */
    public get newTodo(): Todo {
        var todo = this.get("newTodo");
        if (!todo) {
            todo = new Todo();
            this.newTodo = todo;
        }
        return todo;
    }

    /**
     * Sets the TODO that is being created.
     */
    public set newTodo(todo: Todo) {
        this.set("newTodo", todo);
    }

    /**
     * Gets an observable that resolves with whenever a TODO is being edited.
     */
    public isEditingAsync(): Observable<boolean> {
        return this.whenAnyValue(vm => vm.editedTodo).map(todo => todo != null);
    }

    private isValidTitle(title: string): boolean {
        var valid = !!title.trim();
        return valid;
    }

    constructor(todoStore: TodoStorage) {
        super();
        this._store = todoStore;
        this.editedTodo = null;
        this.newTodo = new Todo();

        this._saveCommand = ReactiveCommand.createFromTask((a) => {
            return this._store.putTodos(this.todos);
        });
        
        var isNotSaving = this.save.isExecuting.map(executing => !executing);

        this._loadCommand = ReactiveCommand.createFromTask((a) => {
            return this._store.getTodos();
        });

        this._deleteCommand = ReactiveCommand.createFromObservable((a: Todo) => {
            var todoIndex = this.todos.indexOf(a);
            if (todoIndex >= 0) {
                this.todos.splice(todoIndex, 1);
                return this.save.executeAsync();
            }

            return Observable.of(false);
        });

        this._toggleTodo = ReactiveCommand.createFromObservable((todo: Todo) => {
            todo.completed = !todo.completed;
            return this.save.executeAsync();
        }, isNotSaving);

        var hasValidNewTodo = this.whenAnyValue(vm => {
            return vm.newTodo.title;
        }).map(title => {
            return this.isValidTitle(title)
        });

        var canAddTodo = Observable.combineLatest(
            hasValidNewTodo, 
            isNotSaving, 
            (validTodo, isNotSaving) => validTodo && isNotSaving);

        this._addCommand = ReactiveCommand.createFromObservable((a) => {
            this.todos.push(this.newTodo);
            this.resetNewTodo();       
            return this.save.executeAsync();
        }, canAddTodo);

        this._editCommand = ReactiveCommand.createFromObservable(a => {
            if (this.editedTodo) {
                this.todos.push(this.editedTodo);
                this.editedTodo = null;
            }
            return this.save.executeAsync().do(saved => {
                if (saved) {
                    this._originalTodo = null;
                    this.editedTodo = null;
                }
            });
        }, isNotSaving);

        var canUndo = this.whenAnyValue(vm => vm.editedTodo, vm => vm.todos, (e, todos) => e !== null && todos !== null);

        this._undoCommand = ReactiveCommand.create(a => {
            var index = this.todos.indexOf(this.editedTodo);
            this.todos[index] = this._originalTodo;
            this._originalTodo = null;
            this.editedTodo = null;
            return true;
        }, canUndo);
    }

    public resetNewTodo(): Todo {
        return this.newTodo = new Todo();
    }

    public editTodo(todo: Todo): void {
        this._originalTodo = todo.copy();
        this.editedTodo = todo;
    }

    public doneEditing(): Observable<boolean> {
        return this._editCommand.executeAsync();
    }
}