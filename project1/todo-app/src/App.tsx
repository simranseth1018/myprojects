import React, { useState } from "react";
import "./App.css";
import { Todo } from "./types/todo";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = (title: string) => {
    setTodos([
      ...todos,
      {
        id: Date.now(),
        title,
        completed: false,
      },
    ]);
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="app">
      <h1>Todo App</h1>

      <TodoForm addTodo={addTodo} />

      <TodoList
        todos={todos}
        toggleTodo={toggleTodo}
        deleteTodo={deleteTodo}
      />
    </div>
  );
};

export default App;
