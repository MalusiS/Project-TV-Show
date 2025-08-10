// Constants for element IDs
const ROOT_ID = "root";
const SHOW_SELECT_ID = "show-select";
const EPISODE_SELECT_ID = "episode-select";
const SEARCH_INPUT_ID = "search-input";
const SHOW_ALL_BTN_ID = "show-all-btn";

// Cache DOM elements
const rootElem = document.getElementById(ROOT_ID);
const showSelect = document.getElementById(SHOW_SELECT_ID);
const episodeSelect = document.getElementById(EPISODE_SELECT_ID);
const searchInput = document.getElementById(SEARCH_INPUT_ID);
const showAllBtn = document.getElementById(SHOW_ALL_BTN_ID);

// Data caches
let allEpisodes = [];
let allShows = [];
const episodesCache = {}; // { showId: [episodes] }

// Debounce timer for search
let searchTimeout = null;

// Run the app after DOM is parsed
document.addEventListener("DOMContentLoaded", () => {
  showLoadingMessage();
  fetchShows();
});

// Show loading state
function showLoadingMessage() {
  rootElem.setAttribute("aria-live", "polite");
  rootElem.innerHTML = `<p class="loading">Loading episodes, please wait...</p>`;
}

// Show error state
function showErrorMessage(message) {
  rootElem.setAttribute("aria-live", "polite");
  rootElem.innerHTML = `<p class="error">${message}</p>`;
}

// Fetch all shows (only once per visit)
function fetchShows() {
  if (allShows.length > 0) {
    populateShowSelect();
    return;
  }
  fetch("https://api.tvmaze.com/shows")
    .then((response) => {
      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      return response.json();
    })
    .then((shows) => {
      allShows = shows.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      populateShowSelect();
    })
    .catch((error) => {
      console.error(error);
      showErrorMessage(
        "Failed to load shows. Please refresh the page or try again later."
      );
    });
}

// Populate the show dropdown and set up event listener
function populateShowSelect() {
  showSelect.innerHTML = '<option value="">Select a show...</option>';
  allShows.forEach((show) => {
    const opt = document.createElement("option");
    opt.value = show.id;
    opt.textContent = show.name;
    showSelect.appendChild(opt);
  });

  // Reset episode select and showAllBtn states
  episodeSelect.disabled = true;
  showAllBtn.disabled = true;
  toggleShowAllButton(false);

  showSelect.addEventListener("change", handleShowChange);
}

// Handle show selection change
function handleShowChange() {
  const showId = showSelect.value;
  if (!showId) {
    allEpisodes = [];
    episodeSelect.disabled = true;
    showAllBtn.disabled = true;
    toggleShowAllButton(false);
    initializeEpisodesPage();
    return;
  }
  episodeSelect.disabled = true;
  showAllBtn.disabled = true;
  toggleShowAllButton(false);

  if (episodesCache[showId]) {
    allEpisodes = episodesCache[showId];
    episodeSelect.disabled = false;
    showAllBtn.disabled = false;
    initializeEpisodesPage();
    return;
  }

  showLoadingMessage();

  fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
    .then((response) => {
      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      return response.json();
    })
    .then((episodes) => {
      episodesCache[showId] = episodes;
      allEpisodes = episodes;
      episodeSelect.disabled = false;
      showAllBtn.disabled = false;
      initializeEpisodesPage();
    })
    .catch((error) => {
      console.error(error);
      showErrorMessage(
        "Failed to load episodes. Please refresh the page or try again later."
      );
    });
}

// Initialize UI after data is ready
function initializeEpisodesPage() {
  rootElem.innerHTML = "";
  createSearchAndSelectorUI();
  if (allEpisodes.length > 0) {
    makePageForEpisodes(allEpisodes);
    updateCountDisplay(allEpisodes.length, allEpisodes.length);
  } else {
    updateCountDisplay(0, 0);
  }
}

// Create search input, episode selector, and Show All button UI setup
function createSearchAndSelectorUI() {
  // Clear episode select options
  episodeSelect.innerHTML = '<option value="">Select an episode...</option>';

  allEpisodes.forEach((ep, idx) => {
    const code = formatEpisodeCode(ep.season, ep.number);
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `${code} - ${ep.name}`;
    episodeSelect.appendChild(opt);
  });

  // Reset controls visibility
  toggleShowAllButton(false);

  // Debounce search input handler
  searchInput.oninput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      handleSearch();
    }, 200);
  };

  episodeSelect.onchange = () => handleEpisodeSelect();
  showAllBtn.onclick = () => handleShowAll();
}

// Show or hide the Show All button
function toggleShowAllButton(show) {
  if (show) {
    showAllBtn.classList.remove("hidden");
    showAllBtn.classList.add("visible");
  } else {
    showAllBtn.classList.add("hidden");
    showAllBtn.classList.remove("visible");
  }
}

// Search episodes by name or summary
function handleSearch() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filtered = allEpisodes.filter((ep) => {
    const name = ep.name ? ep.name.toLowerCase() : "";
    const summary = ep.summary ? ep.summary.toLowerCase() : "";
    return name.includes(searchTerm) || summary.includes(searchTerm);
  });

  makePageForEpisodes(filtered);
  updateCountDisplay(filtered.length, allEpisodes.length);

  episodeSelect.value = "";
  toggleShowAllButton(false);
}

// Handle episode dropdown selection
function handleEpisodeSelect() {
  if (episodeSelect.value === "") {
    makePageForEpisodes(allEpisodes);
    updateCountDisplay(allEpisodes.length, allEpisodes.length);
    toggleShowAllButton(false);
    return;
  }

  const idx = parseInt(episodeSelect.value, 10);
  const selected = allEpisodes[idx];
  makePageForEpisodes([selected]);
  updateCountDisplay(1, allEpisodes.length);
  toggleShowAllButton(true);
  searchInput.value = "";
}

// Show all episodes on button click
function handleShowAll() {
  makePageForEpisodes(allEpisodes);
  updateCountDisplay(allEpisodes.length, allEpisodes.length);
  episodeSelect.value = "";
  toggleShowAllButton(false);
  searchInput.value = "";
}

// Render episodes list
function makePageForEpisodes(episodeList) {
  const oldContainer = document.querySelector(".episode-container");
  if (oldContainer) oldContainer.remove();
  const oldCredit = document.querySelector(".credit");
  if (oldCredit) oldCredit.remove();

  const episodeContainer = document.createElement("div");
  episodeContainer.classList.add("episode-container");

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.classList.add("episode-card");

    const episodeCode = formatEpisodeCode(episode.season, episode.number);

    const title = document.createElement("h2");
    title.textContent = `${episode.name} - ${episodeCode}`;

    const image = document.createElement("img");
    if (episode.image && episode.image.medium) {
      image.src = episode.image.medium;
      image.alt = episode.name;
    } else {
      image.alt = "No image available";
    }

    const summary = document.createElement("div");
    summary.innerHTML = episode.summary || "<em>No summary available.</em>";

    const link = document.createElement("a");
    link.href = episode.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on TVmaze";

    episodeCard.appendChild(title);
    episodeCard.appendChild(image);
    episodeCard.appendChild(summary);
    episodeCard.appendChild(link);

    episodeContainer.appendChild(episodeCard);
  });

  rootElem.appendChild(episodeContainer);

  const credit = document.createElement("p");
  credit.classList.add("credit");
  credit.innerHTML = `Data originally from <a href="https://www.tvmaze.com/api#licensing" target="_blank" rel="noopener noreferrer">TVMaze.com</a>`;
  rootElem.appendChild(credit);
}

// Format season and episode code e.g. S02E05
function formatEpisodeCode(season, episode) {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

// Update episode count display
function updateCountDisplay(displayed, total) {
  const countDisplay = document.getElementById("count-display");
  if (countDisplay) {
    countDisplay.textContent = `Displaying ${displayed} / ${total} episodes`;
  }
}
