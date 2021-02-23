/* eslint-disable no-underscore-dangle */
// За основу берём ДЗ 16. Todolist (на максималках)

// Необходимо сделать так, чтоб у нас была кнопка Добавить при клике на которую отображался Dialog из jQueryUI. В нём форма с двумя полями Todo Name - input и Done - checkbox.
// При нажатии на кнопку Добавить внутри Dialog отправляем запрос на create с названием и статусом, после чего закрываем Dialog и добавляем новый элемент вверх списка.

// При нажатии на edit icon показываем Dialog с такими же полями как те, что описаны выше, но они заполнены в значения выбранной todo.
// После нажатия на Обновить внутри Edit Dialog отправляем запрос на обновлении и после этого закрываем Edit Dialog и обновляем todo в списке.

// Если по ДЗ что то не понятно, пересмотрите конец занятия где я об этом рассказываю.

const $todoList = $('.js-todo-list');
const $addListButton = $('.js-add-todo');
const $formWithTodos = $('.js-todo-form');
const $inputForAddList = $('.js-todo-name');
const $emptyListMessage = $('.js-hidden-text');
const $inputForEditList = $('.js-todo-name-edit');
const $cancelEditButton = $('.js-cancel-todo-edit');
const $updateEditButton = $('.js-update-todo-edit');
const $addModalTodoButton = $('.js-show-add-modal');
const $addTodoModalWidget = $('.js-add-modal-widget');
const $editTodoModalWidget = $('.js-edit-modal-widget');
const $todoListCheckStateInput = $('.js-edit-check-input');
class TodoListRequests {
    static sendGetTodosRequest() {
        return fetch('https://jsonplaceholder.typicode.com/todos').then((response) => response.json());
    }

    static sendPostTodosRequest(title, id) {
        return fetch('https://jsonplaceholder.typicode.com/todos', {
            method: 'POST',
            body: JSON.stringify({ title, id }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then((response) => response.json());
    }

    static sendPutEditTodosRequest(id, title, completed) {
        return fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                id,
                title,
                completed,
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then((response) => response.json());
    }

    static sendDeleteTodosRequest(id) {
        return fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
            method: 'DELETE',
        });
    }
}

class TodoUI {
    static initModals() {
        const baseModalOptions = {
            autoOpen: false,
            modal: true,
            show: {
                effect: 'blind',
                duration: 700,
            },
            hide: {
                effect: 'explode',
                duration: 900,
            },
        };
        $addTodoModalWidget.dialog(baseModalOptions);
        $editTodoModalWidget.dialog(baseModalOptions);
    }
}

class TodosRepository {
    constructor() {
        this._todos = [];
        this._selectedTodoId = null;
    }

    get selectedTodoId() {
        return this._selectedTodoId;
    }

    set selectedTodoId(selectedTodoId) {
        this._selectedTodoId = selectedTodoId;
    }

    get todos() {
        return this._todos;
    }

    set todos(todos) {
        this._todos = todos;
    }

    getTodoById(id) {
        return this._todos.find((todo) => todo.id === id);
    }
}

const todosRepository = new TodosRepository();

class TodoListLogic {
    static getTodosList() {
        const promiseTodoList = TodoListRequests.sendGetTodosRequest();
        promiseTodoList
            .then((todos) => {
                renderTodoslist(todos);
                todosRepository.todos = todos;
            });
    }

    static createTodolist() {
        const currentAddInputValue = $inputForAddList.val();
        const initialAddInputValue = $inputForAddList.val('');

        if (currentAddInputValue && currentAddInputValue.trim().length) {
            changeVisibilityEmptyListMessage();
            const promisePostTodoList = TodoListRequests.sendPostTodosRequest(currentAddInputValue);
            promisePostTodoList.then((todo) => {
                renderTodolist(todo);
                todosRepository.todos = [...todosRepository.todos, todo];
            });
            $addTodoModalWidget.dialog('close');
            return initialAddInputValue;
        }

        alert('Your input is empty');
        return initialAddInputValue;
    }

    static removeTodolist(event) {
        const todoCloseButton = $(event.target).hasClass('bi-x-square');
        const todoListElement = $(event.target).closest('li');
        const listId = todoListElement[0].id;

        if (todoCloseButton) {
            const promiseDeleteTodoList = TodoListRequests.sendDeleteTodosRequest(listId);
            promiseDeleteTodoList.then(() => {
                todoListElement.remove();
                todosRepository.todos = todosRepository.todos.filter((todo) => todo.id !== listId);
                changeVisibilityEmptyListMessage();
            });
        }
    }

    static editTodoList(event) {
        const editModalTodoButton = $(event.target).hasClass('js-show-edit-modal');
        const todoListItem = $(event.target).closest('li');
        todosRepository.selectedTodoId = parseInt(todoListItem[0].id, 10);
        todosRepository.getTodoById(todosRepository.selectedTodoId);

        if (editModalTodoButton) {
            $editTodoModalWidget.dialog('open');
            $inputForEditList[0].value = todoListItem.text().trim();
        }

        if (todoListItem.hasClass('list-group-item-warning')) {
            $todoListCheckStateInput[0].checked = false;
        } else {
            $todoListCheckStateInput[0].checked = true;
        }
    }

    static cancelEdit() {
        const initialEditInputValue = $inputForEditList.val('');
        $editTodoModalWidget.dialog('close');
        return initialEditInputValue;
    }

    static updateTodoList() {
        const listTitle = $inputForEditList.val();
        const listId = todosRepository.selectedTodoId;
        let changedListState = null;
        if ($todoListCheckStateInput[0].checked === false) {
            changedListState = false;
        } else if ($todoListCheckStateInput[0].checked === true) {
            changedListState = true;
        }

        const promisePutEditTodoList = TodoListRequests.sendPutEditTodosRequest(listId, listTitle, changedListState);

        promisePutEditTodoList.then((updatedTodoList) => {
            todosRepository.selectedTodoId = null;

            todosRepository.todos = todosRepository.todos.map((todo) => {
                if (todo.id === listId) {
                    return updatedTodoList;
                }

                return todo;
            });

            const updatedListItem = getListItem(updatedTodoList);
            const listItem = $todoList.find(`li[id="${listId}"]`);
            listItem.replaceWith(updatedListItem);
            $inputForEditList.val('');
            $editTodoModalWidget.dialog('close');
        });
    }
}

function createAddTodolistEventListener() {
    $addListButton.click(() => TodoListLogic.createTodolist());
}

function createAddTodolistModalEventListener() {
    $addModalTodoButton.click(() => $addTodoModalWidget.dialog('open'));
}

function createCancelEditEventListener() {
    $cancelEditButton.click(() => TodoListLogic.cancelEdit());
}

function createUpdateEditEventListener() {
    $updateEditButton.click(() => TodoListLogic.updateTodoList());
}

function createEditTodolistModalEventListener() {
    $todoList.delegate('.js-show-edit-modal', 'click', (event) => TodoListLogic.editTodoList(event));
}

function createRemoveTodoListEventListener() {
    $todoList.click((event) => TodoListLogic.removeTodolist(event));
}

function disableEnterKeyEventListener() {
    $formWithTodos.keypress((event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
        }
    });
}

function renderTodoslist(todos) {
    const todoListItem = todos.map((list) => getListItem(list));
    $todoList.html(todoListItem.join(''));
    changeVisibilityEmptyListMessage();
}

function renderTodolist(list) {
    const todoListItem = getListItem(list);
    $todoList.prepend(todoListItem);
    changeVisibilityEmptyListMessage();
}

function getListItem(item) {
    let todoListElementState = item.completed;
    if (item.completed === false || item.completed === undefined) {
        todoListElementState = 'list-group-item-warning';
    } else if (item.completed === true) {
        todoListElementState = 'list-group-item-success';
    }
    return `
    <li class="list-group-item ${todoListElementState} my-1 d-flex bd-highlight" id=${item.id}>${item.title}
        <i class="bi bi-pencil-square ms-3 bd-highlight me-auto js-show-edit-modal"></i>
        <i class="bi bi-x-square mx-3 bd-highlight"></i>
    </li>
    `;
}

function changeVisibilityEmptyListMessage() {
    if ($todoList.children().length >= 1) {
        $emptyListMessage.hide();
    } else {
        $emptyListMessage.show();
    }
}

function init() {
    TodoUI.initModals();
    TodoListLogic.getTodosList();
    disableEnterKeyEventListener();
    createUpdateEditEventListener();
    createCancelEditEventListener();
    createAddTodolistEventListener();
    createRemoveTodoListEventListener();
    createAddTodolistModalEventListener();
    createEditTodolistModalEventListener();
}

init();
