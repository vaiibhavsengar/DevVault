const STORAGE_KEY = "devvault-resources";
const SEEDED_KEY = "devvault-seeded";

const CATEGORIES = [
  "AI",
  "Web Development",
  "GitHub",
  "CSS",
  "JavaScript",
  "DevOps",
  "Tools",
  "Other"
];

const SAMPLE_RESOURCES = [
  {
    id: "sample-1",
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    description: "Authoritative docs for HTML, CSS, JavaScript, and the web platform.",
    category: "Web Development",
    tags: ["docs", "html", "css", "javascript"],
    favorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4
  },
  {
    id: "sample-2",
    title: "GitHub Docs",
    url: "https://docs.github.com",
    description: "Guides for Git, pull requests, Actions, and collaborating on GitHub.",
    category: "GitHub",
    tags: ["git", "docs"],
    favorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
  {
    id: "sample-3",
    title: "CSS-Tricks",
    url: "https://css-tricks.com",
    description: "Practical articles, snippets, and guides for modern CSS.",
    category: "CSS",
    tags: ["css", "layout"],
    favorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2
  },
  {
    id: "sample-4",
    title: "javascript.info",
    url: "https://javascript.info",
    description: "A modern tutorial covering JavaScript from fundamentals to advanced topics.",
    category: "JavaScript",
    tags: ["tutorial", "js"],
    favorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 20
  },
  {
    id: "sample-5",
    title: "Claude",
    url: "https://claude.ai",
    description: "AI assistant useful for coding help, writing, and research.",
    category: "AI",
    tags: ["ai", "assistant"],
    favorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 8
  }
];

const state = {
  resources: [],
  view: "dashboard",
  filter: "all",
  search: "",
  pendingDeleteId: null
};

const els = {
  sidebar: document.getElementById("sidebar"),
  overlay: document.getElementById("overlay"),
  menuBtn: document.getElementById("menuBtn"),
  searchInput: document.getElementById("searchInput"),
  addBtn: document.getElementById("addBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  dashboardView: document.getElementById("dashboardView"),
  resourcesView: document.getElementById("resourcesView"),
  recentGrid: document.getElementById("recentGrid"),
  resourceGrid: document.getElementById("resourceGrid"),
  statTotal: document.getElementById("statTotal"),
  statFavorites: document.getElementById("statFavorites"),
  statCategories: document.getElementById("statCategories"),
  filterHint: document.getElementById("filterHint"),
  resourceModal: document.getElementById("resourceModal"),
  confirmModal: document.getElementById("confirmModal"),
  resourceForm: document.getElementById("resourceForm"),
  modalTitle: document.getElementById("modalTitle"),
  resourceId: document.getElementById("resourceId"),
  titleInput: document.getElementById("titleInput"),
  urlInput: document.getElementById("urlInput"),
  descriptionInput: document.getElementById("descriptionInput"),
  categoryInput: document.getElementById("categoryInput"),
  tagsInput: document.getElementById("tagsInput"),
  favoriteInput: document.getElementById("favoriteInput"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelModalBtn: document.getElementById("cancelModalBtn"),
  cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
  confirmText: document.getElementById("confirmText"),
  toasts: document.getElementById("toasts")
};

function loadResources() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const seeded = localStorage.getItem(SEEDED_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        state.resources = parsed;
        return;
      }
    } catch (error) {
      showToast("Saved data was invalid. Starting fresh.");
    }
  }

  if (!seeded) {
    state.resources = SAMPLE_RESOURCES.slice();
    localStorage.setItem(SEEDED_KEY, "true");
    persist();
  } else {
    state.resources = [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.resources));
}

function createId() {
  return "res-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function parseTags(value) {
  return value
    .split(",")
    .map(function (tag) {
      return tag.trim().toLowerCase();
    })
    .filter(Boolean);
}

function matchesSearch(resource, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    resource.title,
    resource.description,
    resource.category,
    (resource.tags || []).join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return haystack.indexOf(query) !== -1;
}

function getFilteredResources() {
  const query = state.search.trim().toLowerCase();

  return state.resources
    .filter(function (resource) {
      if (state.filter === "favorites" && !resource.favorite) {
        return false;
      }
      if (
        state.filter !== "all" &&
        state.filter !== "favorites" &&
        resource.category !== state.filter
      ) {
        return false;
      }
      return matchesSearch(resource, query);
    })
    .sort(function (a, b) {
      return b.createdAt - a.createdAt;
    });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCard(resource) {
  const tags = (resource.tags || [])
    .map(function (tag) {
      return '<span class="chip">' + escapeHtml(tag) + "</span>";
    })
    .join("");

  const favoriteClass = resource.favorite ? " icon-btn is-favorite" : " icon-btn";
  const favoriteLabel = resource.favorite ? "Remove from favorites" : "Add to favorites";

  return (
    '<article class="resource-card">' +
    '<div class="card-top">' +
    '<p class="card-title">' +
    escapeHtml(resource.title) +
    "</p>" +
    '<button class="' +
    favoriteClass.trim() +
    '" type="button" data-action="favorite" data-id="' +
    resource.id +
    '" aria-label="' +
    favoriteLabel +
    '" aria-pressed="' +
    String(Boolean(resource.favorite)) +
    '">★</button>' +
    "</div>" +
    '<p class="card-desc">' +
    escapeHtml(resource.description || "No description") +
    "</p>" +
    '<div class="meta">' +
    '<span class="chip">' +
    escapeHtml(resource.category) +
    "</span>" +
    tags +
    "</div>" +
    '<div class="card-actions">' +
    '<a class="btn btn-ghost" href="' +
    escapeHtml(resource.url) +
    '" target="_blank" rel="noopener noreferrer">Open</a>' +
    '<button class="btn btn-ghost" type="button" data-action="edit" data-id="' +
    resource.id +
    '">Edit</button>' +
    '<button class="btn btn-danger" type="button" data-action="delete" data-id="' +
    resource.id +
    '">Delete</button>' +
    "</div>" +
    "</article>"
  );
}

function renderEmpty(message) {
  return (
    '<div class="empty-state">' +
    "<h2>Nothing here yet</h2>" +
    '<p class="muted">' +
    escapeHtml(message) +
    "</p>" +
    "</div>"
  );
}

function render() {
  const total = state.resources.length;
  const favorites = state.resources.filter(function (item) {
    return item.favorite;
  }).length;
  const usedCategories = {};

  state.resources.forEach(function (item) {
    usedCategories[item.category] = true;
  });

  els.statTotal.textContent = String(total);
  els.statFavorites.textContent = String(favorites);
  els.statCategories.textContent = String(Object.keys(usedCategories).length);

  const recent = state.resources
    .slice()
    .sort(function (a, b) {
      return b.createdAt - a.createdAt;
    })
    .slice(0, 6);

  els.recentGrid.innerHTML = recent.length
    ? recent.map(renderCard).join("")
    : renderEmpty("Add your first resource to see it on the dashboard.");

  const filtered = getFilteredResources();
  els.resourceGrid.innerHTML = filtered.length
    ? filtered.map(renderCard).join("")
    : renderEmpty("No resources match this search or filter.");

  if (state.filter === "all") {
    els.filterHint.textContent = "Showing all resources";
  } else if (state.filter === "favorites") {
    els.filterHint.textContent = "Showing favorites";
  } else {
    els.filterHint.textContent = "Showing " + state.filter;
  }

  els.dashboardView.hidden = state.view !== "dashboard";
  els.resourcesView.hidden = state.view !== "resources";

  document.querySelectorAll(".nav-item").forEach(function (button) {
    const view = button.getAttribute("data-view");
    const filter = button.getAttribute("data-filter");
    let active = false;

    if (view) {
      active = state.view === view && state.filter === "all";
    } else if (filter === "favorites") {
      active = state.filter === "favorites";
    } else if (filter === "all") {
      active = state.view === "resources" && state.filter === "all";
    } else {
      active = state.filter === filter;
    }

    button.classList.toggle("is-active", active);
  });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  els.toasts.appendChild(toast);
  setTimeout(function () {
    toast.remove();
  }, 2600);
}

function openSidebar() {
  els.sidebar.classList.add("is-open");
  els.overlay.hidden = false;
  els.menuBtn.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  els.sidebar.classList.remove("is-open");
  els.overlay.hidden = true;
  els.menuBtn.setAttribute("aria-expanded", "false");
}

function openResourceModal(resource) {
  els.resourceModal.hidden = false;
  els.modalTitle.textContent = resource ? "Edit resource" : "Add resource";
  els.resourceId.value = resource ? resource.id : "";
  els.titleInput.value = resource ? resource.title : "";
  els.urlInput.value = resource ? resource.url : "";
  els.descriptionInput.value = resource ? resource.description : "";
  els.categoryInput.value = resource ? resource.category : "Web Development";
  els.tagsInput.value = resource ? (resource.tags || []).join(", ") : "";
  els.favoriteInput.checked = resource ? Boolean(resource.favorite) : false;
  els.titleInput.focus();
}

function closeResourceModal() {
  els.resourceModal.hidden = true;
  els.resourceForm.reset();
  els.resourceId.value = "";
}

function openConfirmModal(resource) {
  state.pendingDeleteId = resource.id;
  els.confirmText.textContent = 'Delete "' + resource.title + '"? This cannot be undone.';
  els.confirmModal.hidden = false;
  els.confirmDeleteBtn.focus();
}

function closeConfirmModal() {
  state.pendingDeleteId = null;
  els.confirmModal.hidden = true;
}

function saveResource(event) {
  event.preventDefault();

  const id = els.resourceId.value;
  const title = els.titleInput.value.trim();
  const url = els.urlInput.value.trim();
  const description = els.descriptionInput.value.trim();
  const category = els.categoryInput.value;
  const tags = parseTags(els.tagsInput.value);
  const favorite = els.favoriteInput.checked;

  if (!title || !url) {
    showToast("Title and URL are required.");
    return;
  }

  if (CATEGORIES.indexOf(category) === -1) {
    showToast("Choose a valid category.");
    return;
  }

  if (id) {
    const existing = state.resources.find(function (item) {
      return item.id === id;
    });
    if (!existing) {
      showToast("Resource not found.");
      return;
    }
    existing.title = title;
    existing.url = url;
    existing.description = description;
    existing.category = category;
    existing.tags = tags;
    existing.favorite = favorite;
    showToast("Resource updated.");
  } else {
    state.resources.push({
      id: createId(),
      title: title,
      url: url,
      description: description,
      category: category,
      tags: tags,
      favorite: favorite,
      createdAt: Date.now()
    });
    showToast("Resource saved.");
  }

  persist();
  closeResourceModal();
  render();
}

function toggleFavorite(id) {
  const resource = state.resources.find(function (item) {
    return item.id === id;
  });
  if (!resource) {
    return;
  }
  resource.favorite = !resource.favorite;
  persist();
  render();
  showToast(resource.favorite ? "Added to favorites." : "Removed from favorites.");
}

function deleteResource() {
  const id = state.pendingDeleteId;
  state.resources = state.resources.filter(function (item) {
    return item.id !== id;
  });
  persist();
  closeConfirmModal();
  render();
  showToast("Resource deleted.");
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.resources, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "devvault-resources.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Exported resources.");
}

function importJson(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!Array.isArray(parsed)) {
        throw new Error("Invalid file");
      }

      const imported = parsed
        .filter(function (item) {
          return item && item.title && item.url;
        })
        .map(function (item) {
          return {
            id: item.id || createId(),
            title: String(item.title),
            url: String(item.url),
            description: String(item.description || ""),
            category: CATEGORIES.indexOf(item.category) === -1 ? "Other" : item.category,
            tags: Array.isArray(item.tags) ? item.tags.map(String) : parseTags(String(item.tags || "")),
            favorite: Boolean(item.favorite),
            createdAt: Number(item.createdAt) || Date.now()
          };
        });

      state.resources = imported;
      persist();
      render();
      showToast("Imported " + imported.length + " resources.");
    } catch (error) {
      showToast("Could not import that JSON file.");
    }
  };
  reader.readAsText(file);
}

function handleNavClick(event) {
  const button = event.target.closest(".nav-item");
  if (!button) {
    return;
  }

  const view = button.getAttribute("data-view");
  const filter = button.getAttribute("data-filter");

  if (view) {
    state.view = view;
    state.filter = "all";
  } else if (filter) {
    state.view = "resources";
    state.filter = filter;
  }

  closeSidebar();
  render();
}

function handleCardClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const id = button.getAttribute("data-id");
  const action = button.getAttribute("data-action");
  const resource = state.resources.find(function (item) {
    return item.id === id;
  });

  if (!resource) {
    return;
  }

  if (action === "favorite") {
    toggleFavorite(id);
  } else if (action === "edit") {
    openResourceModal(resource);
  } else if (action === "delete") {
    openConfirmModal(resource);
  }
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    closeResourceModal();
    closeConfirmModal();
    closeSidebar();
  }
}

function bindEvents() {
  document.querySelector(".sidebar").addEventListener("click", handleNavClick);
  els.recentGrid.addEventListener("click", handleCardClick);
  els.resourceGrid.addEventListener("click", handleCardClick);
  els.searchInput.addEventListener("input", function (event) {
    state.search = event.target.value;
    state.view = "resources";
    render();
  });
  els.addBtn.addEventListener("click", function () {
    openResourceModal(null);
  });
  els.closeModalBtn.addEventListener("click", closeResourceModal);
  els.cancelModalBtn.addEventListener("click", closeResourceModal);
  els.resourceForm.addEventListener("submit", saveResource);
  els.cancelDeleteBtn.addEventListener("click", closeConfirmModal);
  els.confirmDeleteBtn.addEventListener("click", deleteResource);
  els.exportBtn.addEventListener("click", exportJson);
  els.importBtn.addEventListener("click", function () {
    els.importFile.click();
  });
  els.importFile.addEventListener("change", importJson);
  els.menuBtn.addEventListener("click", function () {
    if (els.sidebar.classList.contains("is-open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
  els.overlay.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) {
      closeSidebar();
    }
  });
}

loadResources();
bindEvents();
render();
