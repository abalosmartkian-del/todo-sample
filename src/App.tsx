import { useEffect, useState, type ChangeEvent } from "react";
import "./App.css";

type Task = {
  id: number;
  text: string;
  done: boolean;
  due: string;
  cat: string;
  note: string;
  priority: string;
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
      note: t.note ?? "",
      priority: t.priority ?? "",
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
  const [theme, setTheme] = useState(
  () => localStorage.getItem("theme") ?? "dark");
  const [dragId, setDragId] = useState<number | null>(null);
  const [undo, setUndo] = useState<{ task: Task; index: number } | null>(null);
  const [query, setQuery] = useState("");
  const [noteId, setNoteId] = useState<number | null>(null);
  const [priority, setPriority] = useState("");
  

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}, [theme]);

useEffect(() => {
  if (!undo) return;
  const timer = setTimeout(() => setUndo(null), 5000);
  return () => clearTimeout(timer);
}, [undo]);

  function addTask() {
    if (!text.trim()) return;
    const id = Math.max(0, ...tasks.map((t) => t.id)) + 1;
    setTasks([...tasks,{ id, text: text.trim(), done: false, due, cat, note: "", priority },]);
    setText("");
    setDue("");
    setCat("");
    setPriority("");
  }

  function toggle(id: number) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

function remove(id: number) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return;
  setUndo({ task: tasks[index], index });
  setTasks(tasks.filter((t) => t.id !== id));
}

function undoDelete() {
  if (!undo) return;
  const copy = [...tasks];
  copy.splice(Math.min(undo.index, copy.length), 0, undo.task);
  setTasks(copy);
  setUndo(null);
}

function setNote(id: number, note: string) {
  setTasks(tasks.map((t) => (t.id === id ? { ...t, note } : t)));
}

function exportTasks() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "todo-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importTasks(e: ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data)) throw new Error("Not a list");
      const imported: Task[] = data.map((t: Partial<Task>, i: number) => ({
        id: i + 1,
        text: String(t.text ?? ""),
        done: !!t.done,
        due: t.due ?? "",
        cat: t.cat ?? "",
        note: String(t.note ?? ""),
        priority: t.priority ?? "",
      }));
      if (window.confirm(`Replace your current tasks with ${imported.length} imported tasks?`)) {
        setTasks(imported);
      }
    } catch {
      window.alert("That file isn't a valid backup.");
    }
  };
  reader.readAsText(file);
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

  function moveTask(targetId: number) {
  if (dragId === null || dragId === targetId) return;
  const from = tasks.findIndex((t) => t.id === dragId);
  const to = tasks.findIndex((t) => t.id === targetId);
  const copy = [...tasks];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  setTasks(copy);
}

function moveBy(id: number, dir: -1 | 1) {
  const i = visible.findIndex((t) => t.id === id);
  const other = visible[i + dir];
  if (!other) return;
  const a = tasks.findIndex((t) => t.id === id);
  const b = tasks.findIndex((t) => t.id === other.id);
  const copy = [...tasks];
  [copy[a], copy[b]] = [copy[b], copy[a]];
  setTasks(copy);
}

  const today = todayString();
  const left = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - left;

  const visible = tasks
    .filter((t) =>
      filter === "all" ? true : filter === "active" ? !t.done : t.done
    )
    .filter((t) => (catFilter ? t.cat === catFilter : true))
    .filter((t) => t.text.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      if (!sortByDue) return 0;
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });

    const emptyMessage =
    query.trim()
    ? "No tasks match your search."
    : tasks.length === 0
      ? "No tasks yet. Add one above."
      : filter === "active"
      ? "Nothing left to do."
      : filter === "done"
      ? "No completed tasks yet."
      : "No tasks in this category.";

  return (
    <div className="card">
      <button
  className="theme-toggle"
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
>
  {theme === "dark" ? "Light" : "Dark"}
</button>
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
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          title="Priority (optional)">
          <option value="">No priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        </select>
        <button onClick={addTask}>Add</button>
      </div>
      {tasks.length > 0 && (
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks..."
          autoComplete="off"/>
      )}
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
            <li
              key={t.id}
              className={(t.done ? "done" : "") +(dragId === t.id ? " dragging" : "") + (t.priority ? " p-" + t.priority : "")}
              draggable={!sortByDue && editingId !== t.id && noteId !== t.id}
              onDragStart={() => setDragId(t.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                moveTask(t.id);
                setDragId(null);
              }}
              onDragEnd={() => setDragId(null)}
            >
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
              <button
                    className="move"
                    onClick={() => moveBy(t.id, -1)}
                    disabled={sortByDue}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    className="move"
                    onClick={() => setNoteId(noteId === t.id ? null : t.id)}
                    title="Add or edit note">
                      ✎
                    </button>
                  <button
                    className="move"
                    onClick={() => moveBy(t.id, 1)}
                    disabled={sortByDue}
                    title="Move down">
                </button>
              <button className="del" onClick={() => remove(t.id)}>✕</button>
              {noteId === t.id ? (
              <textarea
                className="note-edit"
                value={t.note}
                autoFocus
                placeholder="Add a note..."
                onChange={(e) => setNote(t.id, e.target.value)}
                onBlur={() => setNoteId(null)}
              />
            ) : t.note ? (
              <p className="note" onClick={() => setNoteId(t.id)}>
                {t.note}
              </p>
            ) : null}
            </li>
          );
        })}
      </ul>

      {doneCount > 0 && (
        <button className="clear" onClick={clearCompleted}>
          Clear completed ({doneCount})
        </button>
      )}
      <div className="backup">
        <button onClick={exportTasks} disabled={tasks.length === 0}>
          Export
        </button>
        <label>
          Import
          <input type="file" accept=".json" onChange={importTasks} hidden />
        </label>
      </div>
      {undo && (
        <div className="toast">
          <span>Task deleted</span>
          <button onClick={undoDelete}>Undo</button>
        </div>
)}
    </div>
  );
}