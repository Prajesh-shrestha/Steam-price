import requests

def get_steam_reviews(app_id):
    # 1. The official Steam API web address for reviews
    url = f"https://store.steampowered.com/appreviews/{app_id}?json=1"
    
    print(f"Asking Steam for data on App ID: {app_id}...")
    
    # 2. Go to that web address and get the data
    response = requests.get(url)
    
    # 3. Convert the data into a readable Python format (JSON)
    data = response.json()
    
    # 4. Dig into the data to find the "query_summary" section
    summary = data.get('query_summary', {})
    
    # 5. Pull out the exact number of total reviews
    total_reviews = summary.get('total_reviews', 0)
    
    # 6. Print the results to our screen
    print("-" * 30)
    print(f"Total Reviews: {total_reviews}")
    
    # 7. This is your filter logic for the final website!
    if total_reviews >= 2000:
        print("Result: ✅ This game has enough reviews to be on your site!")
    else:
        print("Result: ❌ Not enough reviews. Hide this game.")
    print("-" * 30)

# Run the function! 
# We are using 35140, which is the App ID for Batman: Arkham Asylum
get_steam_reviews(35140)
