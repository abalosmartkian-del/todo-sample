import { useEffect, useState } from "react";
import "./App.css";

type Task = { text: string; done: boolean };

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [text, setText] = useState("");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    if (!text.trim()) return;
    setTasks([...tasks, { text: text.trim(), done: false }]);
    setText("");
  }

  function toggle(i: number) {
    setTasks(tasks.map((t, idx) => (idx === i ? { ...t, done: !t.done } : t)));
  }

  function remove(i: number) {
    setTasks(tasks.filter((_, idx) => idx !== i));
  }

  const left = tasks.filter((t) => !t.done).length;

  return (
    <div className="card">
      <h1>My To-Do List</h1>
      <p className="count">
        {tasks.length ? `${left} of ${tasks.length} tasks left` : ""}
      </p>

      <div className="add-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="What do you need to do?"
          autoComplete="off"
        />
        <button onClick={addTask}>Add</button>
      </div>

      <ul>
        {tasks.length === 0 && (
          <p className="empty">No tasks yet. Add one above!</p>
        )}
        {tasks.map((t, i) => (
          <li key={i} className={t.done ? "done" : ""}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(i)}
            />
            <span onClick={() => toggle(i)}>{t.text}</span>
            <button className="del" onClick={() => remove(i)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}