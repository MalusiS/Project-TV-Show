//You can edit ALL of the code here
function setup() {
  const allEpisodes = getAllEpisodes();
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  // Create search input and count display
  const searchContainer = document.createElement("div");
  searchContainer.classList.add("search-container");
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search episodes...";
  searchInput.id = "search-input";
  const countDisplay = document.createElement("span");
  countDisplay.id = "count-display";
  countDisplay.style.marginLeft = "10px";
  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(countDisplay);
  rootElem.appendChild(searchContainer);

  // Create episode selector
  const selectorContainer = document.createElement("div");
  selectorContainer.classList.add("selector-container");
  selectorContainer.style.margin = "10px 0";
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
  rootElem.appendChild(selectorContainer);

  // Show All button (hidden by default)
  const showAllBtn = document.createElement("button");
  showAllBtn.textContent = "Show All Episodes";
  showAllBtn.style.display = "none";
  showAllBtn.style.marginLeft = "10px";
  selectorContainer.appendChild(showAllBtn);

  // Initial render
  makePageForEpisodes(allEpisodes);
  countDisplay.textContent = `Displaying ${allEpisodes.length} / ${allEpisodes.length} episodes`;

  // Live search handler
  searchInput.addEventListener("input", function () {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filtered = allEpisodes.filter((ep) => {
      const name = ep.name ? ep.name.toLowerCase() : "";
      const summary = ep.summary ? ep.summary.toLowerCase() : "";
      return name.includes(searchTerm) || summary.includes(searchTerm);
    });
    makePageForEpisodes(filtered);
    countDisplay.textContent = `Displaying ${filtered.length} / ${allEpisodes.length} episodes`;
    // Reset selector and showAllBtn
    episodeSelect.value = "";
    showAllBtn.style.display = "none";
  });

  // Selector handler
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
    // Clear search
    searchInput.value = "";
  });

  // Show All button handler
  showAllBtn.addEventListener("click", function () {
    makePageForEpisodes(allEpisodes);
    countDisplay.textContent = `Displaying ${allEpisodes.length} / ${allEpisodes.length} episodes`;
    episodeSelect.value = "";
    showAllBtn.style.display = "none";
  });
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  // Only clear previous episode container and credit, not search bar
  const oldContainer = document.querySelector(".episode-container");
  if (oldContainer) oldContainer.remove();
  const oldCredit = document.querySelector(".credit");
  if (oldCredit) oldCredit.remove();

  // Create a container for all episodes
  const episodeContainer = document.createElement("div");
  episodeContainer.classList.add("episode-container");

  episodeList.forEach((episode) => {
    // Create episode card
    const episodeCard = document.createElement("div");
    episodeCard.classList.add("episode-card");

    // Format episode code (e.g., S01E05)
    const episodeCode = `S${String(episode.season).padStart(2, "0")}E${String(
      episode.number
    ).padStart(2, "0")}`;

    // Episode title with code
    const title = document.createElement("h2");
    title.textContent = `${episode.name} - ${episodeCode}`;

    // Episode image
    const image = document.createElement("img");
    image.src = episode.image.medium;
    image.alt = episode.name;

    // Episode summary (HTML string from API)
    const summary = document.createElement("div");
    summary.innerHTML = episode.summary;

    // Link to TVmaze episode page
    const link = document.createElement("a");
    link.href = episode.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on TVmaze";

    // Append everything to the card
    episodeCard.appendChild(title);
    episodeCard.appendChild(image);
    episodeCard.appendChild(summary);
    episodeCard.appendChild(link);

    // Add card to container
    episodeContainer.appendChild(episodeCard);
  });

  // Add the container to the root element
  rootElem.appendChild(episodeContainer);

  // Add credit
  const credit = document.createElement("p");
  credit.classList.add("credit");
  credit.innerHTML = `Data originally from <a href="https://www.tvmaze.com/api#licensing" target="_blank" rel="noopener noreferrer">TVMaze.com</a>`;
  rootElem.appendChild(credit);
}

window.onload = setup;
