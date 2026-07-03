// ALBUMS comes from albums.js, which was generated from the Google Sheet.
// Each album looks like:
// { rank, year, artist, album, score, personalScore, trackCount, genre1, genre2, duration, favoriteSong }

const grid = document.getElementById("album-grid");
const emptyMessage = document.getElementById("empty-message");
const resultsCount = document.getElementById("results-count");
const searchInput = document.getElementById("search-input");
const genreFilter = document.getElementById("genre-filter");
const yearFilter = document.getElementById("year-filter");
const sortSelect = document.getElementById("sort-select");

// ---------- One-time setup ----------

function populateStats() {
  const statsBar = document.getElementById("stats-bar");
  const genres = new Set(ALBUMS.map((a) => a.genre1).filter(Boolean));
  const years = ALBUMS.map((a) => a.year).filter(Boolean);
  const artists = new Set(ALBUMS.map((a) => a.artist));

  const stats = [
    { value: ALBUMS.length, label: "Albums" },
    { value: artists.size, label: "Artists" },
    { value: genres.size, label: "Genres" },
    { value: `${Math.min(...years)}–${Math.max(...years)}`, label: "Years" },
  ];

  statsBar.innerHTML = stats
    .map(
      (s) => `
      <div class="stat">
        <span class="stat-value">${s.value}</span>
        <span class="stat-label">${s.label}</span>
      </div>`
    )
    .join("");
}

function populateFilters() {
  const genres = [...new Set(ALBUMS.map((a) => a.genre1).filter(Boolean))].sort();
  const years = [...new Set(ALBUMS.map((a) => a.year).filter(Boolean))].sort((a, b) => b - a);

  for (const genre of genres) {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  }

  for (const year of years) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  }
}

function renderPodium() {
  const podium = document.getElementById("podium");
  const top3 = ALBUMS.filter((a) => a.rank <= 3).sort((a, b) => a.rank - b.rank);

  podium.innerHTML = top3
    .map(
      (a) => `
      <div class="podium-card rank-${a.rank}">
        <div class="podium-rank">#${a.rank}</div>
        <div class="podium-album">${a.album}</div>
        <div class="podium-artist">${a.artist}</div>
      </div>`
    )
    .join("");
}

// ---------- Filtering, sorting, rendering ----------

function getFilteredAlbums() {
  const query = searchInput.value.trim().toLowerCase();
  const genre = genreFilter.value;
  const year = yearFilter.value;

  let result = ALBUMS.filter((a) => {
    const matchesQuery =
      !query ||
      a.artist.toLowerCase().includes(query) ||
      a.album.toLowerCase().includes(query);
    const matchesGenre = !genre || a.genre1 === genre;
    const matchesYear = !year || String(a.year) === year;
    return matchesQuery && matchesGenre && matchesYear;
  });

  switch (sortSelect.value) {
    case "score-desc":
      result.sort((a, b) => b.score - a.score);
      break;
    case "year-desc":
      result.sort((a, b) => b.year - a.year || a.rank - b.rank);
      break;
    case "year-asc":
      result.sort((a, b) => a.year - b.year || a.rank - b.rank);
      break;
    case "artist":
      result.sort((a, b) => a.artist.localeCompare(b.artist));
      break;
    default:
      result.sort((a, b) => a.rank - b.rank);
  }

  return result;
}

function albumCardHTML(a) {
  return `
    <article class="album-card" data-rank="${a.rank}" tabindex="0" role="button" aria-haspopup="dialog">
      <div class="card-top">
        <span class="card-rank">#${a.rank}</span>
        <span class="card-score">${a.score.toFixed(1)}</span>
      </div>
      <h3 class="card-album">${a.album}</h3>
      <p class="card-artist">${a.artist}</p>
      <div class="card-tags">
        <span class="tag year">${a.year}</span>
        ${a.genre1 ? `<span class="tag">${a.genre1}</span>` : ""}
      </div>
      <p class="card-favorite">Favorite track: <strong>${a.favoriteSong || "—"}</strong></p>
    </article>`;
}

function render() {
  const albums = getFilteredAlbums();

  resultsCount.textContent = `Showing ${albums.length} of ${ALBUMS.length} albums`;
  emptyMessage.hidden = albums.length !== 0;
  grid.innerHTML = albums.map(albumCardHTML).join("");
}

// ---------- Detail modal ----------

const modalOverlay = document.getElementById("modal-overlay");
const modalEl = modalOverlay.querySelector(".modal");
const modalClose = document.getElementById("modal-close");
let lastFocusedElement = null;

function formatDuration(duration) {
  // Durations are stored as "H:MM:SS".
  const parts = (duration || "").split(":").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return duration || "—";
  const [h, m] = parts;
  const totalMinutes = h * 60 + m;
  return `${totalMinutes} min`;
}

function openModal(album) {
  document.getElementById("modal-rank").textContent = `#${album.rank} of ${ALBUMS.length}`;
  document.getElementById("modal-album-title").textContent = album.album;
  document.getElementById("modal-artist").textContent = album.artist;

  document.getElementById("modal-tags").innerHTML = [
    `<span class="tag year">${album.year}</span>`,
    album.genre1 ? `<span class="tag">${album.genre1}</span>` : "",
    album.genre2 ? `<span class="tag">${album.genre2}</span>` : "",
  ].join("");

  const metaItems = [
    ["Released", album.releaseDate || String(album.year)],
    ["Track count", album.trackCount ?? "—"],
    ["Duration", formatDuration(album.duration)],
  ];
  document.getElementById("modal-meta-grid").innerHTML = metaItems
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");

  document.getElementById("modal-score-value").textContent = `${album.score.toFixed(1)} / 100`;
  document.getElementById("modal-score-fill").style.width = `${album.score}%`;

  const personal = album.personalScore ?? 0;
  document.getElementById("modal-personal-value").textContent = `${personal.toFixed(1)} / 10`;
  document.getElementById("modal-personal-fill").style.width = `${(personal / 10) * 100}%`;

  document.getElementById("modal-favorite").innerHTML =
    `Favorite track: <strong>${album.favoriteSong || "—"}</strong>`;

  lastFocusedElement = document.activeElement;
  modalOverlay.hidden = false;
  modalClose.focus();
  document.addEventListener("keydown", onModalKeydown);
}

function closeModal() {
  modalOverlay.hidden = true;
  document.removeEventListener("keydown", onModalKeydown);
  if (lastFocusedElement) lastFocusedElement.focus();
}

function onModalKeydown(evt) {
  if (evt.key === "Escape") closeModal();
}

function albumCardFromEvent(evt) {
  const card = evt.target.closest(".album-card");
  if (!card) return null;
  const rank = Number(card.dataset.rank);
  return ALBUMS.find((a) => a.rank === rank) || null;
}

grid.addEventListener("click", (evt) => {
  const album = albumCardFromEvent(evt);
  if (album) openModal(album);
});

grid.addEventListener("keydown", (evt) => {
  if (evt.key !== "Enter" && evt.key !== " ") return;
  const album = albumCardFromEvent(evt);
  if (album) {
    evt.preventDefault();
    openModal(album);
  }
});

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (evt) => {
  if (evt.target === modalOverlay) closeModal();
});

// ---------- Insights charts ----------

function renderInsights() {
  const byYearMap = new Map();
  const genreMap = new Map();
  const artistMap = new Map();
  const scoreSumByYear = new Map();
  const scoreCountByYear = new Map();

  for (const a of ALBUMS) {
    byYearMap.set(a.year, (byYearMap.get(a.year) || 0) + 1);
    if (a.genre1) genreMap.set(a.genre1, (genreMap.get(a.genre1) || 0) + 1);
    artistMap.set(a.artist, (artistMap.get(a.artist) || 0) + 1);
    scoreSumByYear.set(a.year, (scoreSumByYear.get(a.year) || 0) + a.score);
    scoreCountByYear.set(a.year, (scoreCountByYear.get(a.year) || 0) + 1);
  }

  const years = [...byYearMap.keys()].sort((a, b) => a - b);

  renderVerticalBarChart(document.getElementById("chart-by-year"), {
    title: "Albums by release year",
    items: years.map((y) => ({ label: String(y), value: byYearMap.get(y) })),
  });

  const topGenres = [...genreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  renderHorizontalBarChart(document.getElementById("chart-top-genres"), {
    title: "Top genres",
    items: topGenres,
  });

  const topArtists = [...artistMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  renderHorizontalBarChart(document.getElementById("chart-top-artists"), {
    title: "Most-ranked artists",
    items: topArtists,
  });

  renderLineChart(document.getElementById("chart-score-trend"), {
    title: "Average score by year",
    items: years.map((y) => ({
      label: String(y),
      value: scoreSumByYear.get(y) / scoreCountByYear.get(y),
    })),
  });
}

// ---------- Wire up events ----------

searchInput.addEventListener("input", render);
genreFilter.addEventListener("change", render);
yearFilter.addEventListener("change", render);
sortSelect.addEventListener("change", render);

populateStats();
populateFilters();
renderPodium();
renderInsights();
render();
