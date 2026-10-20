// Navigation & Views
const navBrand = document.getElementById('navBrand');
const btnHome = document.getElementById('btnHome');
const btnSearch = document.getElementById('btnSearch');
const homeView = document.getElementById('homeView');
const searchView = document.getElementById('searchView');

// Controls & Containers
const searchBtn = document.getElementById('searchBtn');
const gameInput = document.getElementById('gameInput');
const sortFilter = document.getElementById('sortFilter');
const currencySelect = document.getElementById('currencySelect');
const homeResults = document.getElementById('homeResults');
const searchResultsContainer = document.getElementById('searchResults');
const paginationControls = document.getElementById('paginationControls');

let usdToJpyRate = 150; 
let homeDealsData = [];

// Pagination State Variables
let rawSearchData = []; 
let lastSearchResults = []; 
let currentPage = 1;
const itemsPerPage = 20;

// Initialization
async function initApp() {
    await fetchExchangeRate();
    loadHomeDeals();
}

async function fetchExchangeRate() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data?.rates?.JPY) usdToJpyRate = data.rates.JPY;
    } catch (err) {
        console.error("Exchange rate failed.", err);
    }
}

// Navigation Logic
btnHome.addEventListener('click', () => {
    btnHome.classList.add('active');
    btnSearch.classList.remove('active');
    homeView.classList.remove('hidden');
    searchView.classList.add('hidden');
});

btnSearch.addEventListener('click', () => {
    btnSearch.classList.add('active');
    btnHome.classList.remove('active');
    searchView.classList.remove('hidden');
    homeView.classList.add('hidden');
});

if (navBrand) {
    navBrand.addEventListener('click', () => {
        btnHome.click();
    });
}

// Load Home Deals
async function loadHomeDeals() {
    homeResults.innerHTML = "<p class='status-msg'>Loading top deals...</p>";
    try {
        const response = await fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1&onSale=1&sortBy=DealRating&pageSize=12');
        const deals = await response.json();
        
        homeDealsData = deals.map(deal => ({
            id: deal.dealID, 
            name: deal.title,
            currentPriceUsd: parseFloat(deal.salePrice),
            normalPriceUsd: parseFloat(deal.normalPrice),
            savings: parseFloat(deal.savings).toFixed(0),
            steamAppId: deal.steamAppID,
            thumbnailUrl: deal.thumb,
            reviews: 'hidden', 
            isDeal: true 
        }));
        
        renderGameCards(homeDealsData, homeResults);
    } catch (error) {
        homeResults.innerHTML = "<p class='status-msg'>❌ Failed to load top deals.</p>";
    }
}

// Search Logic
gameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchBtn.click(); });

searchBtn.addEventListener('click', () => {
    const title = gameInput.value.trim(); 
    if (!title) return alert("Please enter a game title!");
    
    searchResultsContainer.innerHTML = "<p class='status-msg'>Searching CheapShark database...</p>";
    paginationControls.innerHTML = ""; 
    sortFilter.value = "relevance"; 
    searchGameDetails(title);
});

async function searchGameDetails(title) {
    try {
        const response = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}`);
        if (!response.ok) throw new Error("CheapShark API Error");
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            searchResultsContainer.innerHTML = `<p class='status-msg'>❌ No games found matching "${title}".</p>`;
            return;
        } 
        
        rawSearchData = data;
        currentPage = 1;
        loadSearchPage(currentPage);

    } catch (error) {
        console.error("Master Search error:", error);
        searchResultsContainer.innerHTML = "<p class='status-msg'>❌ Connection error. Please try searching again.</p>";
    }
}

async function loadSearchPage(page) {
    searchResultsContainer.innerHTML = `<p class='status-msg'>Loading page ${page}...</p>`;
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageGames = rawSearchData.slice(startIndex, endIndex);

    const gamePromises = pageGames.map(async (game) => {
        let lowestPrice = game.cheapest;
        let lowestDateStr = "N/A";

        try {
            const dealRes = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${game.gameID}`);
            if (dealRes.ok) {
                const dealData = await dealRes.json();
                if (dealData?.cheapestPriceEver?.price) {
                    lowestPrice = dealData.cheapestPriceEver.price;
                    lowestDateStr = new Date(dealData.cheapestPriceEver.date * 1000).toLocaleDateString();
                }
            }
        } catch (e) {
            console.warn(`Could not fetch historical price for ${game.external}`);
        }

        return {
            id: game.gameID, 
            name: game.external,
            currentPriceUsd: parseFloat(game.cheapest),
            lowestPriceEverUsd: parseFloat(lowestPrice),
            lowestDate: lowestDateStr,
            steamAppId: game.steamAppID,
            thumbnailUrl: game.thumb,
            reviews: 'loading', 
            isDeal: false
        };
    });

    lastSearchResults = await Promise.all(gamePromises);
    renderGameCards(lastSearchResults, searchResultsContainer);
    renderPaginationControls();

    fetchReviewsInBackground(lastSearchResults);
}

function renderPaginationControls() {
    paginationControls.innerHTML = "";
    const totalPages = Math.ceil(rawSearchData.length / itemsPerPage);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    paginationControls.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active-page' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => changePage(i));
        paginationControls.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    paginationControls.appendChild(nextBtn);
}

function changePage(newPage) {
    currentPage = newPage;
    sortFilter.value = "relevance";
    loadSearchPage(currentPage);
}

async function fetchReviewsInBackground(games) {
    games.forEach(async (game) => {
        if (!game.steamAppId) {
            updateReviewBadge(game.id, 0);
            game.reviews = 0;
            return;
        }

        try {
            const steamUrl = `https://store.steampowered.com/appreviews/${game.steamAppId}?json=1`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(steamUrl)}`;
            
            const steamRes = await fetch(proxyUrl);
            const proxyData = await steamRes.json();
            
            let reviewCount = 0;
            if (proxyData.contents) {
                const steamData = JSON.parse(proxyData.contents);
                reviewCount = steamData.query_summary?.total_reviews || 0;
            }
            
            game.reviews = reviewCount;
            updateReviewBadge(game.id, reviewCount); 

        } catch (e) {
            game.reviews = 0;
            updateReviewBadge(game.id, 0);
        }
    });
}

function updateReviewBadge(gameId, reviewCount) {
    const badgeElement = document.getElementById(`review-${gameId}`);
    if (badgeElement) {
        if (reviewCount > 0) {
            badgeElement.innerHTML = `⭐ ${reviewCount.toLocaleString()} Steam Reviews`;
            badgeElement.style.color = '#66c0f4';
        } else {
            badgeElement.innerHTML = `No review data`;
            badgeElement.style.color = '#626366';
        }
    }
}

sortFilter.addEventListener('change', () => {
    if (lastSearchResults.length === 0) return;
    
    const sortBy = sortFilter.value;
    let sortedArray = [...lastSearchResults];
    
    if (sortBy === 'priceLow') sortedArray.sort((a, b) => a.currentPriceUsd - b.currentPriceUsd);
    if (sortBy === 'priceHigh') sortedArray.sort((a, b) => b.currentPriceUsd - a.currentPriceUsd);
    if (sortBy === 'discount') sortedArray.sort((a, b) => (a.currentPriceUsd - a.lowestPriceEverUsd) - (b.currentPriceUsd - b.lowestPriceEverUsd));
    if (sortBy === 'popularity') {
        sortedArray.sort((a, b) => {
            const revA = a.reviews === 'loading' ? 0 : a.reviews;
            const revB = b.reviews === 'loading' ? 0 : b.reviews;
            return revB - revA;
        });
    }
    
    renderGameCards(sortedArray, searchResultsContainer);
});

currencySelect.addEventListener('change', () => {
    if (!homeView.classList.contains('hidden')) renderGameCards(homeDealsData, homeResults);
    if (!searchView.classList.contains('hidden') && lastSearchResults.length > 0) renderGameCards(lastSearchResults, searchResultsContainer);
});

function formatPrice(amountUsd, currency) {
    if (currency === 'JPY') {
        return `¥${Math.round(amountUsd * usdToJpyRate).toLocaleString()}`;
    }
    return `$${amountUsd.toFixed(2)}`;
}

function renderGameCards(games, container) {
    const selectedCurrency = currencySelect.value;
    container.innerHTML = "";

    games.forEach(game => {
        const currentFmt = formatPrice(game.currentPriceUsd, selectedCurrency);
        
        const secondaryInfo = game.isDeal 
            ? `<p class="price-line highlight">Save ${game.savings}% <small>(Normally ${formatPrice(game.normalPriceUsd, selectedCurrency)})</small></p>`
            : `<p class="price-line"><strong>Lowest Ever:</strong> <span class="highlight">${formatPrice(game.lowestPriceEverUsd, selectedCurrency)}</span> <small>(${game.lowestDate})</small></p>`;

        let reviewBadgeHTML = '';
        if (game.reviews === 'loading') {
            reviewBadgeHTML = `<span id="review-${game.id}" style="color: #c6d4df; font-size: 0.85rem;">⏳ Loading reviews...</span>`;
        } else if (game.reviews === 'hidden') {
            reviewBadgeHTML = ''; 
        } else if (game.reviews > 0) {
            reviewBadgeHTML = `<span id="review-${game.id}" style="color: #66c0f4; font-size: 0.85rem;">⭐ ${game.reviews.toLocaleString()} Steam Reviews</span>`;
        } else {
            reviewBadgeHTML = `<span id="review-${game.id}" style="color: #626366; font-size: 0.85rem;">No review data</span>`;
        }

        const storeUrl = game.steamAppId 
            ? `https://store.steampowered.com/app/${game.steamAppId}` 
            : `https://store.steampowered.com/search/?term=${encodeURIComponent(game.name)}`;

        const cardWrapperStart = `<a href="${storeUrl}" target="_blank" rel="noopener noreferrer" class="game-card" style="text-decoration: none; color: inherit;">`;
        const cardWrapperEnd = `</a>`;

        const cardHtml = `
            ${cardWrapperStart}
                <img src="${game.thumbnailUrl}" class="game-thumb" onError="this.onerror=null; this.src='https://via.placeholder.com/300x140/171d25/66c0f4?text=No+Image';">
                <div class="game-info">
                    <h3>${game.name}</h3>
                    ${secondaryInfo}
                    <p class="price-title-line">Current Best Price: <span class="price-val">${currentFmt}</span></p>
                    <div style="margin-top: auto; padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
                        ${reviewBadgeHTML}
                    </div>
                </div>
            ${cardWrapperEnd}
        `;
        container.innerHTML += cardHtml;
    });
}

initApp();

