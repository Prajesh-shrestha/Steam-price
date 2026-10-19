import requests

def get_current_sales():
    print("\n--- Pulling Current Game Deals ---")
    
    deals_url = "https://www.cheapshark.com/api/1.0/deals?onSale=1&metacritic=80&sortBy=Savings"
    
    # Adding a header to make our request look like a normal web browser
    # Sometimes APIs block scripts if they don't declare what they are!
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SteamTracker/1.0'
    }
    
    deals_response = requests.get(deals_url, headers=headers)
    deals_data = deals_response.json()
    
    # 1. THE SAFETY CHECK: Is this a dictionary (an error) instead of a list?
    if isinstance(deals_data, dict):
        print("❌ CheapShark blocked the request or sent an error message:")
        print(deals_data)
        return
    
    # 2. Check if the list is just empty
    if not deals_data:
        print("❌ No deals found right now matching those criteria.")
        return
        
    print(f"Found {len(deals_data)} high-rated games on sale! Checking the top 10...")
    
    # 3. Loop through the results safely
    for i in range(min(10, len(deals_data))):
        game = deals_data[i]
        name = game.get('title', 'Unknown Title')
        sale_price = game.get('salePrice', 'N/A')
        normal_price = game.get('normalPrice', 'N/A')
        steam_app_id = game.get('steamAppID')
        
        print("-" * 30)
        print(f"Game: {name}")
        print(f"Sale Price: ${sale_price} (Usually ${normal_price})")
        
        if not steam_app_id:
            print("❌ No Steam ID attached to this game. Cannot check reviews.")
            continue
            
        # 4. Pass the Steam ID to the Steam API
        steam_url = f"https://store.steampowered.com/appreviews/{steam_app_id}?json=1"
        steam_response = requests.get(steam_url)
        steam_data = steam_response.json()
        
        summary = steam_data.get('query_summary', {})
        total_reviews = summary.get('total_reviews', 0)
        
        print(f"Total Steam Reviews: {total_reviews}")
        
        if total_reviews >= 2000:
            print("✅ VERDICT: PASSED! High quality game.")
        else:
            print("❌ VERDICT: FAILED. Not enough reviews.")

get_current_sales()

