Project Development Journey & Technical Documentation

1. Project Genesis & Concept Validation (Python)
What we did: We started by validating the core idea—fetching historical low prices and filtering out low-quality games—using Python terminal scripts.
Why we did it: Python is excellent for rapidly testing API endpoints and mapping out data logic before worrying about user interfaces.
AI Contribution: Provided the foundational requests boilerplate and mapped out the correct endpoints for CheapShark (/games) and the Steam Web API (/appreviews).
Problems Faced & User Solutions:

Problem: Python execution paths were broken in Windows, causing "Command Not Found" or launching the Microsoft Store.

User Solved: Navigated Windows execution aliases and successfully routed the VS Code terminal to use the py launcher, successfully installing the requests library.

2. Transition to a Web Application (HTML/CSS/JS)
What we did: We abandoned the Python terminal script and rewrote the logic in JavaScript to create a Single Page Application (SPA).
Why we did it: To allow anyone to use the tool via a web browser and to enable free, zero-backend hosting via GitHub Pages.
AI Contribution: Provided the HTML skeleton, CSS styling, and translated the Python API logic into modern asynchronous JavaScript (fetch, async/await).
Problems Faced:

Problem: CheapShark's search endpoint would crash the script (KeyError: 0 / TypeError) if a search returned zero results or triggered a backend block.

Fix: Implemented array validation checks (data.length === 0) and try/catch blocks to fail gracefully and show UI error messages instead of breaking the app.

3. Expanding Features & UI Polish
What we did: We added dynamic currency conversion (USD to JPY), game thumbnails, a "Top Deals" home page, and sorting options (Price, Discount).
Why we did it: To transform the project from a basic script into a professional, portfolio-ready application with proper User Experience (UX).
Problems Faced:

Problem: Broken image thumbnails. Steam's header image URL structure failed for "Bundles" and "Collections" (returning 404s).

Fix: Switched to CheapShark's native thumb URLs and added an inline HTML onError fallback that dynamically loads a generated placeholder from via.placeholder.com if an image link is dead.

Problem: CSS flexbox alignment issues pushed the navigation buttons off-center.

Fix: Used position: absolute and transform: translateX(-50%) to force the buttons into the true geometric center.

4. The CORS Proxy & Performance Refactoring
What we did: We integrated the Steam review filter back into the web app and optimized how the data loads.
Why we did it: Browsers block direct frontend calls to Steam due to CORS (Cross-Origin Resource Sharing) security.
AI Contribution: Routed the Steam requests through a public proxy (api.allorigins.win) to bypass CORS.
Problems Faced:

Problem: The app took over 15 seconds to load because the loop fetched each game sequentially (waiting for Game 1 to finish before starting Game 2).

Fix: Refactored the architecture using Promise.all() to fire all 20 network requests simultaneously in parallel, dropping load times drastically.

5. Overcoming Rate Limits & Progressive Rendering
What we did: We separated the API calls into "fast" data (CheapShark prices) and "slow" data (Steam reviews).
Why we did it: To prevent the slow CORS proxy from freezing the entire user interface.
Problems Faced & User Solutions:

Problem: The application started throwing TypeError: Failed to fetch and crashing completely during active testing.

User Solved: The user correctly diagnosed that the app was hitting API rate limits (Over-usage of the API). By testing the connection over a mobile hotspot, the user proved the IP was temporarily blocked by the server for making too many rapid requests.

Fix: We implemented two major architectural upgrades:

Fault Tolerance: Wrapped every individual game request in its own independent try/catch block. If one game was rate-limited, the other 19 would still load successfully.

Lazy Loading: Forced the app to render the UI instantly with just the pricing data, placing a "⏳ Loading reviews..." badge on the cards. The script then quietly fetched the reviews in the background (fetchReviewsInBackground) and injected them into the DOM upon completion.

6. Deployment & Version Control
What we did: We initialized Git and pushed the code to a remote GitHub repository to host it on GitHub Pages.
Problems Faced:

Problem: The browser blocked local file:/// API fetches, and later, Git rejected code pushes due to remote changes.

Fix: Used VS Code Live Server to bypass local security restrictions, and used git pull origin main --rebase to safely merge local code with remote GitHub updates before pushing.

---

Function Legend (Code Glossary)
initApp()

The bootstrap function. Runs instantly when the script loads to fetch exchange rates and populate the Home View deals.

fetchExchangeRate()

Calls the free er-api.com endpoint to get the real-time USD to JPY conversion rate and updates the global usdToJpyRate variable.

loadHomeDeals()

Queries CheapShark's /deals endpoint for the top 12 highest-rated games currently on sale and renders them on the Home View.

searchGameDetails(title)

The master search function. Takes the user's input, queries CheapShark's /games endpoint, retrieves up to 60 matches, stores them in rawSearchData, and triggers the page loader for Page 1.

loadSearchPage(page)

The core data processor. Slices 20 games from the master list based on the current page. Uses Promise.all() to concurrently fetch specific historical low prices for all 20 games at once, renders them to the screen, and kicks off the background review fetcher.

renderPaginationControls()

Calculates how many pages are needed (up to 3 pages for 60 games) and dynamically builds the Previous, Next, and Numbered HTML buttons.

changePage(newPage)

Updates the global currentPage state, resets the sorting dropdown, and triggers loadSearchPage() for the new subset of games.

fetchReviewsInBackground(games)

The lazy-loader. Loops through rendered games, checks if they have a steamAppId, routes a request through a CORS proxy to Steam, parses the JSON, and triggers the UI update.

updateReviewBadge(gameId, reviewCount)

A targeted DOM manipulator. Finds the specific HTML <span> for a game using its unique ID and swaps the "Loading..." text for the final star rating and color, without redrawing the whole page.

formatPrice(amountUsd, currency)

Math and string utility. Multiplies the USD price by the exchange rate if JPY is selected, rounds it, and attaches the correct $ or ¥ symbol.

renderGameCards(games, container)

The HTML templating engine. Takes an array of game objects, loops through them, injects variables (names, prices, images, Steam links) into a raw HTML string template, and pushes that block into the visual grid container on the webpage.