// Constants & DOM caches
const ROOT_ID = "root";
const SHOW_SEARCH_ID = "show-search-input";
const SHOW_COUNT_ID = "show-count-display";
const EPISODE_SEARCH_ID = "episode-search-input";
const EPISODE_COUNT_ID = "episode-count-display";
const BACK_LINK_ID = "back-to-shows";
const SHOW_SELECT_ID = "show-select";
const EPISODE_SELECT_ID = "episode-select";
const SHOW_ALL_BTN_ID = "show-all-btn";

const rootElem = document.getElementById(ROOT_ID);
const showSearchInput = document.getElementById(SHOW_SEARCH_ID);
const showCountDisplay = document.getElementById(SHOW_COUNT_ID);
const episodeSearchInput = document.getElementById(EPISODE_SEARCH_ID);
const episodeCountDisplay = document.getElementById(EPISODE_COUNT_ID);
const backLink = document.getElementById(BACK_LINK_ID);
const showSelect = document.getElementById(SHOW_SELECT_ID);
const episodeSelect = document.getElementById(EPISODE_SELECT_ID);
const showAllBtn = document.getElementById(SHOW_ALL_BTN_ID);

// Data caches & state
let allShows = [];
let allEpisodes = []; // episodes for currently selected show
const episodesCache = {}; // { showId: [episodes] }
let currentShow = null;

// Debounce timers
let showSearchTimer = null;
let episodeSearchTimer = null;

// App bootstrap
document.addEventListener("DOMContentLoaded", () => {
  showLoadingMessage();
  fetchShows();
  attachBackLinkHandler();
});

// UI helpers
function showLoadingMessage() {
  rootElem.setAttribute("aria-live", "polite");
  rootElem.innerHTML = `<p class="loading">Loading shows, please wait...</p>`;
}

function showErrorMessage(message) {
  rootElem.setAttribute("aria-live", "polite");
  rootElem.innerHTML = `<p class="error">${message}</p>`;
}

function toggleEpisodesControls(visible) {
  const controls = document.querySelectorAll(".episodes-controls");
  controls.forEach((el) => {
    if (visible) {
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  });
}

function toggleBackLink(show) {
  if (show) {
    backLink.classList.remove("hidden");
    backLink.setAttribute("aria-hidden", "false");
  } else {
    backLink.classList.add("hidden");
    backLink.setAttribute("aria-hidden", "true");
  }
}

function toggleShowAllButton(show) {
  if (show) {
    showAllBtn.classList.remove("hidden");
    showAllBtn.classList.add("visible");
    showAllBtn.disabled = false;
  } else {
    showAllBtn.classList.add("hidden");
    showAllBtn.classList.remove("visible");
    showAllBtn.disabled = true;
  }
}

// Fetching (cached)
function fetchShows() {
  if (allShows.length > 0) {
    renderShowsList(allShows);
    return;
  }

  fetch("https://api.tvmaze.com/shows")
    .then((res) => {
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
      return res.json();
    })
    .then((shows) => {
      // Sort alphabetically, case-insensitive
      allShows = shows.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      renderShowsList(allShows);
    })
    .catch((err) => {
      console.error(err);
      showErrorMessage("Failed to load shows. Please try again later.");
    });
}

function fetchEpisodesForShow(showId) {
  // ensure we only fetch once per show
  if (episodesCache[showId]) {
    return Promise.resolve(episodesCache[showId]);
  }
  return fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
    .then((res) => {
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
      return res.json();
    })
    .then((episodes) => {
      episodesCache[showId] = episodes;
      return episodes;
    });
}

// Shows listing & search
function renderShowsList(shows) {
  // Clear root and render grid
  rootElem.innerHTML = "";
  toggleBackLink(false);
  toggleEpisodesControls(false);

  // Update search & count UI
  showSearchInput.disabled = false;
  updateShowCount(shows.length, allShows.length);

  const grid = document.createElement("div");
  grid.className = "shows-grid";

  shows.forEach((show) => {
    const card = document.createElement("article");
    card.className = "show-card";

    const img = document.createElement("img");
    img.className = "poster";
    if (show.image && show.image.medium) {
      img.src = show.image.medium;
      img.alt = `${show.name} poster`;
    } else {
      img.alt = "No poster available";
    }

    const title = document.createElement("h3");
    // clickable name
    const titleBtn = document.createElement("button");
    titleBtn.type = "button";
    titleBtn.className = "show-title-btn";
    titleBtn.textContent = show.name;
    titleBtn.addEventListener("click", () => handleShowClick(show));
    title.appendChild(titleBtn);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <div><strong>Status:</strong> ${show.status || "N/A"}</div>
      <div><strong>Rating:</strong> ${show.rating && show.rating.average ? show.rating.average : "N/A"}</div>
      <div><strong>Runtime:</strong> ${show.runtime ? show.runtime + " min" : "N/A"}</div>
    `;

    const genres = document.createElement("div");
    genres.className = "genre-list";
    (show.genres || []).forEach((g) => {
      const chip = document.createElement("span");
      chip.className = "genre";
      chip.textContent = g;
      genres.appendChild(chip);
    });

    const summary = document.createElement("div");
    summary.className = "summary";
    summary.innerHTML = show.summary || "<em>No summary available.</em>";

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(genres);
    card.appendChild(summary);

    grid.appendChild(card);
  });

  rootElem.appendChild(grid);

  // credit footer
  const credit = document.createElement("p");
  credit.className = "credit";
  credit.innerHTML = `Data originally from <a href="https://www.tvmaze.com/api#licensing" target="_blank" rel="noopener noreferrer">TVMaze.com</a>`;
  rootElem.appendChild(credit);

  // wire up show search
  showSearchInput.oninput = () => {
    clearTimeout(showSearchTimer);
    showSearchTimer = setTimeout(() => {
      handleShowSearch();
    }, 200);
  };
}

function handleShowSearch() {
  const q = showSearchInput.value.trim().toLowerCase();
  if (!q) {
    renderShowsList(allShows);
    return;
  }
  const filtered = allShows.filter((s) => {
    const name = s.name ? s.name.toLowerCase() : "";
    const summary = s.summary ? s.summary.toLowerCase() : "";
    const genres = (s.genres || []).join(" ").toLowerCase();
    return name.includes(q) || summary.includes(q) || genres.includes(q);
  });
  renderShowsList(filtered);
  updateShowCount(filtered.length, allShows.length);
}

function updateShowCount(displayed, total) {
  showCountDisplay.textContent = `Showing ${displayed} / ${total} shows`;
}

// Show click -> load episodes
function handleShowClick(show) {
  // set current show & view
  currentShow = show;
  // prepare UI for episodes
  toggleBackLink(true);
  toggleEpisodesControls(true);
  showSearchInput.disabled = true;

  // populate show select for convenience; we keep select in sync
  populateShowSelect();

  showLoadingMessageForEpisodes(show.name);

  fetchEpisodesForShow(show.id)
    .then((episodes) => {
      allEpisodes = episodes;
      initializeEpisodesPageForShow();
      // update select to reflect current show (select option value = show.id)
      showSelect.value = show.id;
    })
    .catch((err) => {
      console.error(err);
      showErrorMessage("Failed to load episodes for selected show.");
    });
}

function showLoadingMessageForEpisodes(showName) {
  rootElem.innerHTML = `<p class="loading">Loading episodes for <strong>${sanitizeText(showName)}</strong> …</p>`;
}

// Episodes page: initialize
function initializeEpisodesPageForShow() {
  // Now render episodes listing and wire episode controls
  renderEpisodesList(allEpisodes);
  // show episode controls group
  toggleEpisodesControls(true);

  // enable episode search & selectors
  episodeSearchInput.disabled = false;
  episodeSelect.disabled = false;
  showAllBtn.disabled = false;

  // fill episode selector
  populateEpisodeSelect();

  // wire up episode search debounce
  episodeSearchInput.oninput = () => {
    clearTimeout(episodeSearchTimer);
    episodeSearchTimer = setTimeout(() => {
      handleEpisodeSearch();
    }, 200);
  };

  episodeSelect.onchange = () => handleEpisodeSelect();
  showAllBtn.onclick = () => handleShowAll();
  updateEpisodeCount(allEpisodes.length, allEpisodes.length);

  // ensure the show-select listener exists (so user can switch from dropdown)
  showSelect.addEventListener("change", handleShowSelectChange);
}

function populateShowSelect() {
  // populate with shows; value is show.id (string)
  showSelect.innerHTML = '<option value="">Select a show...</option>';
  allShows.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    showSelect.appendChild(opt);
  });
}

function handleShowSelectChange() {
  const id = showSelect.value;
  if (!id) return;
  // find show object
  const showObj = allShows.find((s) => String(s.id) === String(id));
  if (!showObj) return;
  // simulate click on show
  handleShowClick(showObj);
}

function populateEpisodeSelect() {
  episodeSelect.innerHTML = '<option value="">Select an episode...</option>';
  allEpisodes.forEach((ep, idx) => {
    const code = formatEpisodeCode(ep.season, ep.number);
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `${code} - ${ep.name}`;
    episodeSelect.appendChild(opt);
  });
}

// Episode search / render / handlers
function handleEpisodeSearch() {
  const q = episodeSearchInput.value.trim().toLowerCase();
  const filtered = allEpisodes.filter((ep) => {
    const name = ep.name ? ep.name.toLowerCase() : "";
    const summary = ep.summary ? ep.summary.toLowerCase() : "";
    return name.includes(q) || summary.includes(q);
  });
  renderEpisodesList(filtered);
  updateEpisodeCount(filtered.length, allEpisodes.length);
  // reset selector & button
  episodeSelect.value = "";
  toggleShowAllButton(false);
}

function handleEpisodeSelect() {
  if (episodeSelect.value === "") {
    renderEpisodesList(allEpisodes);
    updateEpisodeCount(allEpisodes.length, allEpisodes.length);
    toggleShowAllButton(false);
    return;
  }
  const idx = parseInt(episodeSelect.value, 10);
  const item = allEpisodes[idx];
  if (!item) return;
  renderEpisodesList([item]);
  updateEpisodeCount(1, allEpisodes.length);
  toggleShowAllButton(true);
  episodeSearchInput.value = "";
}

function handleShowAll() {
  renderEpisodesList(allEpisodes);
  updateEpisodeCount(allEpisodes.length, allEpisodes.length);
  episodeSelect.value = "";
  toggleShowAllButton(false);
  episodeSearchInput.value = "";
}

function updateEpisodeCount(displayed, total) {
  episodeCountDisplay.textContent = `Displaying ${displayed} / ${total} episodes`;
}

function renderEpisodesList(episodeList) {
  // Remove old episode container and credit before rendering
  const oldContainer = document.querySelector(".episode-container");
  if (oldContainer) oldContainer.remove();
  const oldCredit = document.querySelector(".credit");
  if (oldCredit) oldCredit.remove();

  const episodeContainer = document.createElement("div");
  episodeContainer.className = "episode-container";

  episodeList.forEach((ep) => {
    const card = document.createElement("div");
    card.className = "episode-card";

    const code = formatEpisodeCode(ep.season, ep.number);
    const title = document.createElement("h2");
    title.textContent = `${ep.name} - ${code}`;

    const img = document.createElement("img");
    if (ep.image && ep.image.medium) {
      img.src = ep.image.medium;
      img.alt = ep.name || "Episode image";
    } else {
      img.alt = "No image available";
    }

    const summary = document.createElement("div");
    summary.innerHTML = ep.summary || "<em>No summary available.</em>";

    const link = document.createElement("a");
    link.href = ep.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on TVmaze";

    card.appendChild(title);
    card.appendChild(img);
    card.appendChild(summary);
    card.appendChild(link);

    episodeContainer.appendChild(card);
  });

  rootElem.appendChild(episodeContainer);

  const credit = document.createElement("p");
  credit.className = "credit";
  credit.innerHTML = `Data originally from <a href="https://www.tvmaze.com/api#licensing" target="_blank" rel="noopener noreferrer">TVMaze.com</a>`;
  rootElem.appendChild(credit);
}

// Back to shows handler
function attachBackLinkHandler() {
  backLink.addEventListener("click", (ev) => {
    ev.preventDefault();
    showSearchInput.disabled = false;
    showSearchInput.focus();
    // hide episodes controls and show list
    toggleEpisodesControls(false);
    toggleBackLink(false);
    episodeSearchInput.value = "";
    episodeSelect.value = "";
    toggleShowAllButton(false);
    // re-render shows list (use full cache)
    renderShowsList(allShows);
  });
}

// Utilities
function formatEpisodeCode(season, episode) {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

function sanitizeText(str) {
  if (!str) return "";
  // Basic sanitize for insertion into textContent or small snippet
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}
