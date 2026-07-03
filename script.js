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
    <article class="album-card">
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

// ---------- Wire up events ----------

searchInput.addEventListener("input", render);
genreFilter.addEventListener("change", render);
yearFilter.addEventListener("change", render);
sortSelect.addEventListener("change", render);

populateStats();
populateFilters();
renderPodium();
render();
