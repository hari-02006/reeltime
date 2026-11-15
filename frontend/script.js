const API_URL = "/api/movies";
const FALLBACK_POSTER = "https://placehold.co/600x900/171622/b9a1f2?text=No+Poster";

const elements = {
  grid: document.querySelector("#movie-grid"),
  dialog: document.querySelector("#movie-dialog"),
  form: document.querySelector("#movie-form"),
  search: document.querySelector("#search-input"),
  genre: document.querySelector("#genre-filter"),
  status: document.querySelector("#status-filter"),
  sort: document.querySelector("#sort-select"),
  resultCount: document.querySelector("#result-count"),
  toastRegion: document.querySelector("#toast-region"),
};

let movies = [];
let editingId = null;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function toast(message, isError = false) {
  const notice = document.createElement("div");
  notice.className = `toast${isError ? " error" : ""}`;
  notice.textContent = message;
  elements.toastRegion.append(notice);
  window.setTimeout(() => notice.remove(), 3600);
}

async function request(path = "", options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Something went wrong. Please try again.");
  }
  return payload;
}

function updateStats() {
  document.querySelector("#total-count").textContent = movies.length;
  document.querySelector("#watched-count").textContent = movies.filter((movie) => movie.status === "Watched").length;
  document.querySelector("#unwatched-count").textContent = movies.filter((movie) => movie.status === "Want to Watch").length;
  document.querySelector("#watching-count").textContent = movies.filter((movie) => movie.status === "Watching").length;
}

function updateGenres() {
  const selected = elements.genre.value;
  const genres = [...new Set(movies.map((movie) => movie.genre).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));
  elements.genre.innerHTML = '<option value="">All genres</option>';
  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    elements.genre.append(option);
  });
  if (genres.includes(selected)) elements.genre.value = selected;
}

function createMovieCard(movie) {
  const title = escapeHtml(movie.title);
  const poster = escapeHtml(movie.posterUrl || FALLBACK_POSTER);
  const year = movie.releaseYear || "Year unknown";
  const rating = movie.rating ? `★ ${Number(movie.rating).toFixed(1)}` : "Not rated";
  const genre = escapeHtml(movie.genre || "Uncategorized");
  const description = movie.description ? `<p class="card-description">${escapeHtml(movie.description)}</p>` : "";
  const card = document.createElement("article");
  card.className = "movie-card";
  card.innerHTML = `
    <div class="poster-wrap">
      <img class="poster" src="${poster}" alt="Poster for ${title}" loading="lazy">
      <span class="status-badge" data-status="${escapeHtml(movie.status)}">${escapeHtml(movie.status)}</span>
      <span class="card-rating">${rating}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title" title="${title}">${title}</h3>
      <div class="card-meta"><span>${escapeHtml(String(year))}</span><span class="meta-dot">•</span><span>${genre}</span></div>
      ${description}
      <div class="card-actions">
        <button class="card-action" type="button" data-action="edit" data-id="${escapeHtml(movie._id)}">Edit</button>
        <button class="card-action delete" type="button" data-action="delete" data-id="${escapeHtml(movie._id)}">Delete</button>
      </div>
    </div>`;
  const image = card.querySelector(".poster");
  image.addEventListener("error", () => {
    image.replaceWith(Object.assign(document.createElement("div"), {
      className: "poster-placeholder",
      textContent: movie.title.trim().charAt(0).toUpperCase() || "🎬",
      role: "img",
      ariaLabel: `No poster available for ${movie.title}`,
    }));
  }, { once: true });
  return card;
}

function renderMovies() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const genre = elements.genre.value;
  const status = elements.status.value;
  const visibleMovies = movies.filter((movie) => (
    movie.title.toLocaleLowerCase().includes(query)
    && (!genre || movie.genre === genre)
    && (!status || movie.status === status)
  ));
  const sortBy = elements.sort.value;
  visibleMovies.sort((first, second) => {
    if (sortBy === "year-desc") return (second.releaseYear || 0) - (first.releaseYear || 0);
    if (sortBy === "year-asc") return (first.releaseYear || 0) - (second.releaseYear || 0);
    if (sortBy === "rating-desc") return (second.rating || 0) - (first.rating || 0);
    if (sortBy === "rating-asc") return (first.rating || 0) - (second.rating || 0);
    return new Date(second.createdAt) - new Date(first.createdAt);
  });

  elements.resultCount.textContent = `${visibleMovies.length} ${visibleMovies.length === 1 ? "movie" : "movies"}`;
  elements.grid.replaceChildren();
  if (!visibleMovies.length) {
    const filtered = Boolean(query || genre || status);
    const state = document.createElement("div");
    state.className = "empty-state";
    state.innerHTML = `<strong>${filtered ? "No movies found" : "Your library is waiting"}</strong>
      <p>${filtered ? "Try adjusting your search or filters." : "Add a movie to start building your collection."}</p>
      ${filtered ? "" : '<button class="primary-button" type="button" data-action="add">＋ Add your first movie</button>'}`;
    elements.grid.append(state);
    return;
  }
  elements.grid.append(...visibleMovies.map(createMovieCard));
}

async function loadMovies() {
  elements.grid.innerHTML = '<div class="loading-state">Getting your library ready<span class="loading-dots">...</span></div>';
  try {
    const response = await request();
    movies = response.data;
    updateStats();
    updateGenres();
    renderMovies();
  } catch (error) {
    elements.grid.innerHTML = `<div class="error-state"><span>${escapeHtml(error.message)}</span><button class="secondary-button" type="button" data-action="reload">Try again</button></div>`;
  }
}

function openDialog(movie = null) {
  editingId = movie?._id || null;
  elements.form.reset();
  clearFormErrors();
  document.querySelector("#form-error").hidden = true;
  document.querySelector("#dialog-title").textContent = editingId ? "Edit movie" : "Add a movie";
  document.querySelector("#save-movie").innerHTML = editingId ? "Save changes <span aria-hidden=\"true\">↗</span>" : "Save to library <span aria-hidden=\"true\">↗</span>";
  if (movie) {
    Object.entries({
      title: movie.title,
      genre: movie.genre || "",
      releaseYear: movie.releaseYear || "",
      rating: movie.rating || "",
      posterUrl: movie.posterUrl || "",
      status: movie.status,
      description: movie.description || "",
    }).forEach(([name, value]) => { elements.form.elements[name].value = value; });
  }
  elements.dialog.showModal();
  elements.form.elements.title.focus();
}

function clearFormErrors() {
  document.querySelectorAll(".field-error").forEach((field) => { field.textContent = ""; });
}

function validateForm(data) {
  clearFormErrors();
  const errors = {};
  const title = data.title.trim();
  if (!title) errors.title = "Please enter a movie name.";
  if (data.releaseYear && (!Number.isInteger(Number(data.releaseYear)) || Number(data.releaseYear) < 1888 || Number(data.releaseYear) > new Date().getFullYear() + 10)) {
    errors.releaseYear = `Enter a year between 1888 and ${new Date().getFullYear() + 10}.`;
  }
  if (data.rating && (Number(data.rating) < 1 || Number(data.rating) > 10)) errors.rating = "Rating must be between 1 and 10.";
  if (data.posterUrl) {
    try {
      if (!["http:", "https:"].includes(new URL(data.posterUrl).protocol)) throw new Error();
    } catch {
      errors.posterUrl = "Enter a valid image URL starting with http:// or https://.";
    }
  }
  Object.entries(errors).forEach(([name, message]) => {
    document.querySelector(`[data-error-for="${name}"]`).textContent = message;
  });
  return Object.keys(errors).length === 0;
}

async function saveMovie(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const data = Object.fromEntries(formData.entries());
  if (!validateForm(data)) return;
  const payload = {
    title: data.title.trim(),
    genre: data.genre.trim(),
    releaseYear: data.releaseYear ? Number(data.releaseYear) : null,
    rating: data.rating ? Number(data.rating) : null,
    posterUrl: data.posterUrl.trim(),
    status: data.status,
    description: data.description.trim(),
  };
  const saveButton = document.querySelector("#save-movie");
  saveButton.disabled = true;
  try {
    const result = await request(editingId ? `/${encodeURIComponent(editingId)}` : "", {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    elements.dialog.close();
    toast(editingId ? "Movie updated successfully." : "Movie added to your library.");
    await loadMovies();
    return result;
  } catch (error) {
    const formError = document.querySelector("#form-error");
    formError.textContent = error.message;
    formError.hidden = false;
  } finally {
    saveButton.disabled = false;
  }
}

async function deleteMovie(id) {
  const movie = movies.find((item) => item._id === id);
  if (!movie || !window.confirm(`Delete "${movie.title}" from your library? This cannot be undone.`)) return;
  try {
    await request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
    toast("Movie removed from your library.");
    await loadMovies();
  } catch (error) {
    toast(error.message, true);
  }
}

elements.form.addEventListener("submit", saveMovie);
document.querySelector("#open-add-movie").addEventListener("click", () => openDialog());
document.querySelector("#hero-add-movie").addEventListener("click", () => openDialog());
document.querySelector("#close-dialog").addEventListener("click", () => elements.dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});
elements.grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "add") openDialog();
  if (button.dataset.action === "reload") loadMovies();
  if (button.dataset.action === "edit") openDialog(movies.find((movie) => movie._id === button.dataset.id));
  if (button.dataset.action === "delete") deleteMovie(button.dataset.id);
});
[elements.search, elements.genre, elements.status, elements.sort].forEach((control) => {
  control.addEventListener(control === elements.search ? "input" : "change", renderMovies);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    elements.search.focus();
  }
});
document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short", month: "short", day: "numeric",
}).format(new Date());

loadMovies();
