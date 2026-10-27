import { useEffect, useState } from "react";
import "./App.css";

type Task = {
  id: number;
  text: string;
  done: boolean;
  due: string;
  cat: string;
};
type Filter = "all" | "active" | "done";

const CATEGORIES = ["Work", "Personal", "Study"];

function todayString() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function formatDue(due: string) {
  return new Date(due + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    if (!saved) return [];
    // older saved tasks may be missing newer fields
    return JSON.parse(saved).map((t: Partial<Task>, i: number) => ({
      id: t.id ?? i,
      text: t.text ?? "",
      done: !!t.done,
      due: t.due ?? "",
      cat: t.cat ?? "",
    }));
  });
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [cat, setCat] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [catFilter, setCatFilter] = useState("");
  const [sortByDue, setSortByDue] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    if (!text.trim()) return;
    const id = Math.max(0, ...tasks.map((t) => t.id)) + 1;
    setTasks([...tasks, { id, text: text.trim(), done: false, due, cat }]);
    setText("");
    setDue("");
    setCat("");
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

  const today = todayString();
  const left = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - left;

  const visible = tasks
    .filter((t) =>
      filter === "all" ? true : filter === "active" ? !t.done : t.done
    )
    .filter((t) => (catFilter ? t.cat === catFilter : true))
    .sort((a, b) => {
      if (!sortByDue) return 0;
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });

  const emptyMessage =
    tasks.length === 0
      ? "No tasks yet. Add one above."
      : filter === "active"
      ? "Nothing left to do."
      : filter === "done"
      ? "No completed tasks yet."
      : "No tasks in this category.";

  return (
    <div className="card">
      <h1>My To-Do List</h1>
      {tasks.length > 0 && (
  <div className="progress">
    <div
      className="bar"
      style={{ width: `${(doneCount / tasks.length) * 100}%` }}
    />
  </div>
)}
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
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          title="Due date (optional)"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          title="Category (optional)"
        >
          <option value="">No category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
        <button
          className={"sort" + (sortByDue ? " active" : "")}
          onClick={() => setSortByDue(!sortByDue)}
        >
          Sort by date
        </button>
      </div>

      <select
        className="cat-filter"
        value={catFilter}
        onChange={(e) => setCatFilter(e.target.value)}
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <ul>
        {visible.length === 0 && <p className="empty">{emptyMessage}</p>}
        {visible.map((t) => {
          const overdue = !t.done && t.due !== "" && t.due < today;
          return (
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
                <span
                  onDoubleClick={() => startEdit(t)}
                  title="Double-click to edit"
                >
                  {t.text}
                </span>
              )}
              {t.cat && <small className="tag">{t.cat}</small>}
              {t.due && (
                <small className={overdue ? "due overdue" : "due"}>
                  {overdue ? "Overdue · " : ""}
                  {formatDue(t.due)}
                </small>
              )}
              <button className="del" onClick={() => remove(t.id)}>✕</button>
            </li>
          );
        })}
      </ul>

      {doneCount > 0 && (
        <button className="clear" onClick={clearCompleted}>
          Clear completed ({doneCount})
        </button>
      )}
    </div>
  );
}