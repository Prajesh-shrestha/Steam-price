Markdown
# Steam Game Price and Review Tracker

A web application that allows users to search for Steam games, compare current market prices, view historical lowest prices across digital stores, and cross-reference player review counts to filter titles by community engagement.

---

## Features

- **Multi-Game Search**: Queries the CheapShark API to return up to 20 matching game titles per search term.
- **Historical Price Tracking**: Fetches the lowest recorded price for any game along with the date that price was recorded.
- **Quality Filtering**: Cross-references Steam's Web API to check total user review counts for each title.
- **Keyboard Navigation**: Supports search execution via both UI button interactions and the Enter key.
- **Client-Side Architecture**: Built with standard HTML5, CSS3, and modern asynchronous JavaScript (`async/await` and Fetch API) requiring no backend server.

---

## Data Flow Architecture

1. User enters a search query in the frontend input field.
2. Application queries the CheapShark `/games` endpoint to fetch matching titles, current best prices, and internal game IDs.
3. Application queries the CheapShark `/games?id=` endpoint using the internal game ID to retrieve the historical lowest price and record date.
4. Application extracts the `steamAppID` and queries the Steam Web API `/appreviews` endpoint to retrieve total community review counts.
5. Search results are dynamically rendered into the browser DOM.

---

## Technical Stack & External APIs

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Hosting Platform**: GitHub Pages
- **APIs**:
  - **CheapShark API**: Used for price aggregation across digital storefronts and historical pricing data.
  - **Steam Web API**: Used for community review counts and game metadata.

---

## Technical Challenges & Solutions

### API Response Format Validation
- **Problem**: Querying endpoints with ambiguous search terms can return empty arrays or error objects instead of expected arrays, causing index lookup errors.
- **Solution**: Implemented validation checks before reading nested response attributes to ensure data exists prior to rendering.

### Multi-Source API Data Chaining
- **Problem**: CheapShark provides historical pricing across multiple vendors but lacks complete community review data. Steam provides review data but does not expose historical pricing.
- **Solution**: Developed a chained asynchronous request structure that retrieves store data from CheapShark, extracts the unique `steamAppID`, and forwards that identifier to Steam's API endpoints to retrieve community engagement metrics.

---

## Local Setup Instructions

1. Clone the repository:
   ```bash
   git clone [https://github.com/YOUR-USERNAME/Steam-price.git](https://github.com/YOUR-USERNAME/Steam-price.git)
Navigate into the project directory:

Bash
cd Steam-price
Open index.html in a browser or launch it using an extension like VS Code Live Server.

Future Improvements
Create a curated "All-Time Lowest Deals" tab filtering games with over 2,000 positive reviews.

Implement responsive CSS grid layouts for mobile viewports.

Add client-side sorting by discount percentage and total review volume.


---
