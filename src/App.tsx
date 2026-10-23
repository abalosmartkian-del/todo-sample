import { useEffect, useState } from "react";
import "./App.css";

type Task = { id: number; text: string; done: boolean };
type Filter = "all" | "active" | "done";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    if (!saved) return [];
    // older saved tasks have no id, so give them one
    return JSON.parse(saved).map((t: Partial<Task>, i: number) => ({
      id: t.id ?? i,
      text: t.text ?? "",
      done: !!t.done,
    }));
  });
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    if (!text.trim()) return;
    const id = Math.max(0, ...tasks.map((t) => t.id)) + 1;
    setTasks([...tasks, { id, text: text.trim(), done: false }]);
    setText("");
  }

  function toggle(id: number) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id: number) {
    setTasks(tasks.filter((t) => t.id !== id));
  }

  function startEdit(t: Task) {
    setEditingId(t.id);
    setEditText(t.text);
  }

  function saveEdit() {
    if (editingId === null) return;
    if (editText.trim()) {
      setTasks(
        tasks.map((t) =>
          t.id === editingId ? { ...t, text: editText.trim() } : t
        )
      );
    }
    setEditingId(null);
  }

  function clearCompleted() {
    setTasks(tasks.filter((t) => !t.done));
  }

  const left = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - left;

  const visible = tasks.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );

  const emptyMessage =
    tasks.length === 0
      ? "No tasks yet. Add one above."
      : filter === "active"
      ? "Nothing left to do."
      : "No completed tasks yet.";

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

      <div className="filters">
        {(["all", "active", "done"] as Filter[]).map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "active" ? "Active" : "Done"}
          </button>
        ))}
      </div>

      <ul>
        {visible.length === 0 && <p className="empty">{emptyMessage}</p>}
        {visible.map((t) => (
          <li key={t.id} className={t.done ? "done" : ""}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t.id)}
            />
            {editingId === t.id ? (
              <input
                className="edit"
                value={editText}
                autoFocus
                onChange={(e) => setEditText(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
            ) : (
              <span onDoubleClick={() => startEdit(t)} title="Double-click to edit">
                {t.text}
              </span>
            )}
            <button className="del" onClick={() => remove(t.id)}>✕</button>
          </li>
        ))}
      </ul>

      {doneCount > 0 && (
        <button className="clear" onClick={clearCompleted}>
          Clear completed ({doneCount})
        </button>
      )}
    </div>
  );
}