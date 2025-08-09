// Global variable to store fetched episodes
let allEpisodes = [];

// Run the app after DOM is loaded
window.onload = () => {
  showLoadingMessage();
  fetchEpisodes();
};

// Show loading state
function showLoadingMessage() {
  const rootElem = document.getElementById("root");
  rootElem.setAttribute("aria-live", "polite");
  rootElem.innerHTML = `<p class="loading">Loading episodes, please wait...</p>`;
}

// Show error state
function showErrorMessage(message) {
  const rootElem = document.getElementById("root");
  rootElem.setAttribute("aria-live", "polite");
  rootElem.innerHTML = `<p class="error">${message}</p>`;
}

// Fetch episodes from the TVMaze API
function fetchEpisodes() {
  fetch("https://api.tvmaze.com/shows/82/episodes")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      return response.json();
    })
    .then((episodes) => {
      allEpisodes = episodes;
      initializeEpisodesPage();
    })
    .catch((error) => {
      console.error(error);
      showErrorMessage(
        "Failed to load episodes. Please refresh the page or try again later."
      );
    });
}

// Initialize the UI after data is fetched
function initializeEpisodesPage() {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  createSearchAndSelectorUI();
  makePageForEpisodes(allEpisodes);
  updateCountDisplay(allEpisodes.length, allEpisodes.length);
}

// Populate search input, episode selector, and show-all button
function createSearchAndSelectorUI() {
  const searchInput = document.getElementById("search-input");
  const episodeSelect = document.getElementById("episode-select");
  const showAllBtn = document.getElementById("show-all-btn");

  // Populate dropdown
  episodeSelect.innerHTML = '<option value="">Select an episode...</option>';
  allEpisodes.forEach((ep, idx) => {
    const code = formatEpisodeCode(ep.season, ep.number);
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `${code} - ${ep.name}`;
    episodeSelect.appendChild(opt);
  });

  // Attach event listeners
  searchInput.addEventListener("input", () => handleSearch(searchInput, episodeSelect, showAllBtn));
  episodeSelect.addEventListener("change", () => handleEpisodeSelect(episodeSelect, searchInput, showAllBtn));
  showAllBtn.addEventListener("click", () => handleShowAll(searchInput, episodeSelect, showAllBtn));
}

// Search handler
function handleSearch(searchInput, episodeSelect, showAllBtn) {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filtered = allEpisodes.filter((ep) => {
    const name = ep.name ? ep.name.toLowerCase() : "";
    const summary = ep.summary ? ep.summary.toLowerCase() : "";
    return name.includes(searchTerm) || summary.includes(searchTerm);
  });
  makePageForEpisodes(filtered);
  updateCountDisplay(filtered.length, allEpisodes.length);
  episodeSelect.value = "";
  showAllBtn.style.display = "none";
}

// Episode selector handler
function handleEpisodeSelect(episodeSelect, searchInput, showAllBtn) {
  if (episodeSelect.value === "") {
    makePageForEpisodes(allEpisodes);
    updateCountDisplay(allEpisodes.length, allEpisodes.length);
    showAllBtn.style.display = "none";
    return;
  }
  const idx = parseInt(episodeSelect.value, 10);
  const selected = allEpisodes[idx];
  makePageForEpisodes([selected]);
  updateCountDisplay(1, allEpisodes.length);
  showAllBtn.style.display = "inline-block";
  searchInput.value = "";
}

// Show All button handler
function handleShowAll(searchInput, episodeSelect, showAllBtn) {
  makePageForEpisodes(allEpisodes);
  updateCountDisplay(allEpisodes.length, allEpisodes.length);
  episodeSelect.value = "";
  showAllBtn.style.display = "none";
  searchInput.value = "";
}

// Render episodes
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
    image.src = episode.image.medium;
    image.alt = episode.name;

    const summary = document.createElement("div");
    summary.innerHTML = episode.summary;

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

  document.getElementById("root").appendChild(episodeContainer);

  // Credit footer
  const credit = document.createElement("p");
  credit.classList.add("credit");
  credit.innerHTML = `Data originally from <a href="https://www.tvmaze.com/api#licensing" target="_blank" rel="noopener noreferrer">TVMaze.com</a>`;
  document.getElementById("root").appendChild(credit);
}

// Format episode code
function formatEpisodeCode(season, episode) {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

// Update count display
function updateCountDisplay(displayed, total) {
  const countDisplay = document.getElementById("count-display");
  if (countDisplay) {
    countDisplay.textContent = `Displaying ${displayed} / ${total} episodes`;
  }
}
