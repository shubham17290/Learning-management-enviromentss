const STORAGE_KEY = "todos";

class TodoApp {
  constructor() {
    this.todos = [];
    this.nextId = 1;
    this.filter = "all";
    this.signedIn = false;

    this.els = {
      authUser: document.getElementById("auth-user"),
      signInBtn: document.getElementById("sign-in-btn"),
      signOutBtn: document.getElementById("sign-out-btn"),
      todoInput: document.getElementById("todo-input"),
      addBtn: document.getElementById("add-btn"),
      todoList: document.getElementById("todo-list"),
      emptyState: document.getElementById("empty-state"),
      todoCount: document.getElementById("todo-count"),
      clearCompleted: document.getElementById("clear-completed"),
      filterBtns: document.querySelectorAll(".filter-btn"),
      toast: document.getElementById("toast"),
      overlay: document.getElementById("overlay"),
    };

    this.toastTimer = null;
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.refreshAuth();
  }

  bindEvents() {
    this.els.signInBtn.addEventListener("click", () => this.signIn());
    this.els.signOutBtn.addEventListener("click", () => this.signOut());
    this.els.addBtn.addEventListener("click", () => this.addTodo());
    this.els.todoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.addTodo();
    });
    this.els.clearCompleted.addEventListener("click", () => this.clearCompleted());
    this.els.filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.setFilter(btn.dataset.filter));
    });
  }

  async refreshAuth() {
    this.signedIn = puter.auth.isSignedIn();
    this.updateAuthUI();

    if (this.signedIn) {
      await this.loadTodos();
    } else {
      this.todos = [];
      this.render();
    }
  }

  updateAuthUI() {
    const signedIn = this.signedIn;
    this.els.signInBtn.hidden = signedIn;
    this.els.signOutBtn.hidden = !signedIn;
    this.els.authUser.hidden = !signedIn;
    this.els.todoInput.disabled = !signedIn;
    this.els.addBtn.disabled = !signedIn;

    if (signedIn) {
      puter.auth.getUser().then((user) => {
        this.els.authUser.textContent = user.username || user.email || "Signed in";
      }).catch(() => {
        this.els.authUser.textContent = "Signed in";
      });
    } else {
      this.els.authUser.textContent = "";
    }
  }

  async signIn() {
    try {
      await puter.auth.signIn();
      this.signedIn = true;
      this.updateAuthUI();
      await this.loadTodos();
      this.showToast("Signed in — todos synced from cloud", "success");
    } catch (err) {
      console.error(err);
      this.showToast("Sign in cancelled or failed", "error");
    }
  }

  async signOut() {
    await puter.auth.signOut();
    this.signedIn = false;
    this.todos = [];
    this.updateAuthUI();
    this.render();
    this.showToast("Signed out", "success");
  }

  async loadTodos() {
    this.setLoading(true);
    try {
      const stored = await puter.kv.get(STORAGE_KEY);
      if (stored) {
        this.todos = typeof stored === "string" ? JSON.parse(stored) : stored;
      } else {
        this.todos = [];
      }
      this.nextId = Math.max(0, ...this.todos.map((t) => t.id)) + 1;
    } catch (err) {
      console.error(err);
      this.todos = [];
      this.showToast("Could not load todos from cloud", "error");
    } finally {
      this.setLoading(false);
      this.render();
    }
  }

  async saveTodos() {
    try {
      await puter.kv.set(STORAGE_KEY, this.todos);
    } catch (err) {
      console.error(err);
      this.showToast("Could not save todos to cloud", "error");
      throw err;
    }
  }

  async addTodo() {
    if (!this.signedIn) {
      this.showToast("Sign in to save todos", "error");
      return;
    }

    const text = this.els.todoInput.value.trim();
    if (!text) {
      this.showToast("Enter a task first", "error");
      return;
    }

    this.todos.unshift({
      id: this.nextId++,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    this.els.todoInput.value = "";
    await this.saveTodos();
    this.render();
  }

  async toggleTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) return;
    todo.completed = !todo.completed;
    await this.saveTodos();
    this.render();
  }

  async deleteTodo(id) {
    this.todos = this.todos.filter((t) => t.id !== id);
    await this.saveTodos();
    this.render();
  }

  editTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) return;

    const item = this.els.todoList.querySelector(`[data-id="${id}"]`);
    const textEl = item.querySelector(".todo-text");
    const actionsEl = item.querySelector(".todo-actions");

    const input = document.createElement("input");
    input.type = "text";
    input.className = "todo-edit-input";
    input.value = todo.text;
    input.maxLength = 500;

    const editActions = document.createElement("div");
    editActions.className = "edit-actions";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "icon-btn edit";
    saveBtn.textContent = "Save";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "icon-btn delete";
    cancelBtn.textContent = "Cancel";

    editActions.append(saveBtn, cancelBtn);
    textEl.replaceWith(input);
    actionsEl.replaceWith(editActions);
    input.focus();
    input.select();

    const finish = (save) => {
      if (save) this.saveEdit(id, input.value);
      else this.render();
    };

    saveBtn.addEventListener("click", () => finish(true));
    cancelBtn.addEventListener("click", () => finish(false));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
  }

  async saveEdit(id, newText) {
    const text = newText.trim();
    if (!text) {
      this.showToast("Task cannot be empty", "error");
      return;
    }

    const todo = this.todos.find((t) => t.id === id);
    if (!todo) return;

    todo.text = text;
    await this.saveTodos();
    this.render();
  }

  async clearCompleted() {
    const count = this.todos.filter((t) => t.completed).length;
    if (!count) return;

    this.todos = this.todos.filter((t) => !t.completed);
    await this.saveTodos();
    this.render();
    this.showToast(`Cleared ${count} completed task${count > 1 ? "s" : ""}`, "success");
  }

  setFilter(filter) {
    this.filter = filter;
    this.els.filterBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    this.render();
  }

  getFilteredTodos() {
    if (this.filter === "active") return this.todos.filter((t) => !t.completed);
    if (this.filter === "completed") return this.todos.filter((t) => t.completed);
    return this.todos;
  }

  render() {
    const filtered = this.getFilteredTodos();
    const activeCount = this.todos.filter((t) => !t.completed).length;
    const completedCount = this.todos.filter((t) => t.completed).length;

    this.els.todoList.innerHTML = "";

    if (filtered.length === 0) {
      this.els.todoList.hidden = true;
      this.els.emptyState.hidden = false;
      this.els.emptyState.querySelector(".empty-hint").textContent = this.signedIn
        ? "Add your first task above."
        : "Sign in and add your first task above.";
    } else {
      this.els.todoList.hidden = false;
      this.els.emptyState.hidden = true;

      filtered.forEach((todo) => {
        const li = document.createElement("li");
        li.className = `todo-item${todo.completed ? " completed" : ""}`;
        li.dataset.id = String(todo.id);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "todo-checkbox";
        checkbox.checked = todo.completed;
        checkbox.addEventListener("change", () => this.toggleTodo(todo.id));

        const text = document.createElement("span");
        text.className = "todo-text";
        text.textContent = todo.text;

        const actions = document.createElement("div");
        actions.className = "todo-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "icon-btn edit";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => this.editTodo(todo.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "icon-btn delete";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => this.deleteTodo(todo.id));

        actions.append(editBtn, deleteBtn);
        li.append(checkbox, text, actions);
        this.els.todoList.appendChild(li);
      });
    }

    this.els.todoCount.textContent = `${activeCount} item${activeCount === 1 ? "" : "s"} left`;
    this.els.clearCompleted.disabled = completedCount === 0;
  }

  setLoading(show) {
    this.els.overlay.hidden = !show;
  }

  showToast(message, type = "success") {
    clearTimeout(this.toastTimer);
    this.els.toast.textContent = message;
    this.els.toast.className = `toast show ${type}`;
    this.toastTimer = setTimeout(() => {
      this.els.toast.classList.remove("show");
    }, 2800);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new TodoApp();
});
