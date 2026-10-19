// 1. Grab the HTML elements
const searchBtn = document.getElementById('searchBtn');
const gameInput = document.getElementById('gameInput');
const resultsContainer = document.getElementById('resultsContainer');

// --- NEW: Listen for the "Enter" key in the input box ---
gameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchBtn.click(); // This simulates clicking the button!
    }
});

// 2. Listen for a click on the Search button
searchBtn.addEventListener('click', () => {
    const title = gameInput.value.trim(); 
    if (title === "") {
        alert("Please enter a game title!");
        return;
    }
    
    // Show a loading message
    resultsContainer.innerHTML = "<p>Searching CheapShark... (This might take a second to load all 20 games)</p>";
    
    // Call our main function
    searchGameDetails(title);
});

// 3. The core function to talk to CheapShark
async function searchGameDetails(title) {
    const cheapsharkUrl = `https://www.cheapshark.com/api/1.0/games?title=${title}`;
    
    try {
        const response = await fetch(cheapsharkUrl);
        const data = await response.json();
        
        if (data.length === 0) {
            resultsContainer.innerHTML = `<p>❌ No game found matching "${title}".</p>`;
            return;
        }
        
        // --- NEW: Get up to 20 results instead of just 1 ---
        const top20Games = data.slice(0, 20);
        
        // Clear the "Searching..." text before we inject the games
        resultsContainer.innerHTML = "";
        
        // --- NEW: Loop through each of the 20 games ---
        for (const game of top20Games) {
            const name = game.external;
            const currentPrice = game.cheapest; 
            const steamAppId = game.steamAppID;
            const gameID = game.gameID;
            
            // Ask CheapShark for the lowest historical price for THIS specific game
            const dealDetailsResponse = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
            const dealDetailsData = await dealDetailsResponse.json();
            
            const lowestPriceEver = dealDetailsData.cheapestPriceEver.price;
            const lowestDateRaw = new Date(dealDetailsData.cheapestPriceEver.date * 1000);
            const lowestDate = lowestDateRaw.toLocaleDateString();

            // Create an HTML card for the game (with some basic inline styling so they don't mash together)
            let htmlOutput = `
                <div class="game-card" style="border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                    <h2>${name}</h2>
                    <p><strong>Lowest Price Ever:</strong> $${lowestPriceEver} (Hit on ${lowestDate})</p>
                    <p><strong>Current Best Price:</strong> $${currentPrice}</p>
                    <p>Steam ID: ${steamAppId ? steamAppId : 'Not available'}</p>
                </div>
            `;
            
            // Add this card to the screen immediately before moving to the next game in the loop
            resultsContainer.innerHTML += htmlOutput;
        }
        
    } catch (error) {
        console.error("Error fetching data:", error);
        resultsContainer.innerHTML = "<p>❌ An error occurred while contacting the server.</p>";
    }
}

