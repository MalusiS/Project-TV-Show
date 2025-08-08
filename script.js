window.onload = setup;

function setup() {
  const allEpisodes = getAllEpisodes();
  ensurePersistentCredit();
  renderControls(allEpisodes);
  makePageForEpisodes(allEpisodes);
}

function renderControls(allEpisodes) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  // Search bar
  const searchContainer = document.createElement("div");
  searchContainer.classList.add("search-container");

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search episodes...";
  searchInput.id = "search-input";

  const countDisplay = document.createElement("span");
  countDisplay.id = "count-display";

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(countDisplay);
  rootElem.appendChild(searchContainer);

  // Dropdown
  const selectorContainer = document.createElement("div");
  selectorContainer.classList.add("selector-container");

  const episodeSelect = document.createElement("select");
  episodeSelect.id = "episode-select";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select an episode...";
  episodeSelect.appendChild(defaultOption);

  allEpisodes.forEach((ep, idx) => {
    const code = `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")}`;
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `${code} - ${ep.name}`;
    episodeSelect.appendChild(opt);
  });

  selectorContainer.appendChild(episodeSelect);

  // Show All button
  const showAllBtn = document.createElement("button");
  showAllBtn.textContent = "Show All Episodes";
  showAllBtn.style.display = "none";
  showAllBtn.style.marginLeft = "10px";
  selectorContainer.appendChild(showAllBtn);

  rootElem.appendChild(selectorContainer);

  // Initial episode display
  countDisplay.textContent = `Displaying ${allEpisodes.length} / ${allEpisodes.length} episodes`;

  // Search handler
  searchInput.addEventListener("input", function () {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filtered = allEpisodes.filter((ep) => {
      const name = ep.name ? ep.name.toLowerCase() : "";
      const summary = ep.summary ? ep.summary.toLowerCase() : "";
      return name.includes(searchTerm) || summary.includes(searchTerm);
    });
    makePageForEpisodes(filtered);
    countDisplay.textContent = `Displaying ${filtered.length} / ${allEpisodes.length} episodes`;
    episodeSelect.value = "";
    showAllBtn.style.display = "none";
  });

  // Dropdown handler
  episodeSelect.addEventListener("change", function () {
    if (episodeSelect.value === "") {
      makePageForEpisodes(allEpisodes);
      countDisplay.textContent = `Displaying ${allEpisodes.length} / ${allEpisodes.length} episodes`;
      showAllBtn.style.display = "none";
      return;
    }
    const idx = parseInt(episodeSelect.value, 10);
    const selected = allEpisodes[idx];
    makePageForEpisodes([selected]);
    countDisplay.textContent = `Displaying 1 / ${allEpisodes.length} episodes`;
    showAllBtn.style.display = "inline-block";
    searchInput.value = "";
  });

  // Show All handler
  showAllBtn.addEventListener("click", function () {
    makePageForEpisodes(allEpisodes);
    countDisplay.textContent = `Displaying ${allEpisodes.length} / ${allEpisodes.length} episodes`;
    episodeSelect.value = "";
    showAllBtn.style.display = "none";
  });
}

function makePageForEpisodes(episodeList) {
  const existingContainer = document.querySelector(".episode-container");
  if (existingContainer) existingContainer.remove();

  const episodeContainer = document.createElement("div");
  episodeContainer.classList.add("episode-container");

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.classList.add("episode-card");

    const episodeCode = `S${String(episode.season).padStart(2, "0")}E${String(
      episode.number
    ).padStart(2, "0")}`;

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

  const rootElem = document.getElementById("root");
  rootElem.appendChild(episodeContainer);
}

// Only add credit once
function ensurePersistentCredit() {
  if (!document.querySelector(".credit")) {
    const credit = document.createElement("p");
    credit.classList.add("credit");
    credit.innerHTML = `Data originally from <a href="https://www.tvmaze.com/api#licensing" target="_blank" rel="noopener noreferrer">TVMaze.com</a>`;
    document.body.appendChild(credit);
  }
}
