import json
import random
from collections import Counter

# Shop tier odds by player level (1–10), for 5 shop slots
SHOP_TIER_ODDS = {
    1: [0.80, 0.20, 0.00, 0.00, 0.00],
    2: [0.70, 0.30, 0.00, 0.00, 0.00],
    3: [0.55, 0.35, 0.10, 0.00, 0.00],
    4: [0.45, 0.40, 0.15, 0.00, 0.00],
    5: [0.35, 0.40, 0.25, 0.00, 0.00],
    6: [0.25, 0.35, 0.35, 0.05, 0.00],
    7: [0.20, 0.30, 0.40, 0.10, 0.00],
    8: [0.18, 0.24, 0.35, 0.20, 0.03],
    9: [0.15, 0.21, 0.30, 0.28, 0.06],
    10: [0.12, 0.18, 0.28, 0.32, 0.10],
}

# Copies per tier
TIER_COPIES = {1: 30, 2: 20, 3: 18, 4: 12, 5: 10}

# Load hero data (already includes tier info)
with open("underlords_heroes.json", "r") as f:
    hero_data = json.load(f)["heroes"]

# Example: heroes you currently own
user_owned = {
    "batrider": {"level": 2, "count": 3},  # 9 copies used
    "abaddon": {"level": 1, "count": 2},   # 2 copies used
    "alchemist": {"level": 3, "count": 1}  # 9 copies used
}

# Helper to count used copies
def copies_used(level):
    return {1: 1, 2: 3, 3: 9}.get(level, 0)

# Build the hero pool with remaining copies
def build_hero_pool(hero_data, user_owned):
    pool = {tier: {} for tier in range(1, 6)}
    for hero, data in hero_data.items():
        tier = data.get("draftTier", data.get("goldCost", 1))
        total = TIER_COPIES[tier]
        used = 0
        if hero in user_owned:
            entry = user_owned[hero]
            used = entry["count"] * copies_used(entry["level"])
        remaining = max(total - used, 0)
        if remaining > 0:
            pool[tier][hero] = remaining
    return pool

# Pick one hero from a given tier, weighted by copies
def pick_hero_from_tier(pool, tier):
    heroes = list(pool[tier].keys())
    weights = list(pool[tier].values())
    if not heroes:
        return None
    return random.choices(heroes, weights=weights, k=1)[0]

# Simulate a shop roll
def simulate_shop(player_level, hero_pool):
    odds = SHOP_TIER_ODDS[player_level]
    tiers = [1, 2, 3, 4, 5]
    shop = []

    for _ in range(5):
        tier = random.choices(tiers, weights=odds, k=1)[0]
        hero = pick_hero_from_tier(hero_pool, tier)
        shop.append(hero or "None")
    
    return shop

# Run a simulation
player_level = 4
hero_pool = build_hero_pool(hero_data, user_owned)

print(f"Simulating shop roll at player level {player_level}:")
shop_result = simulate_shop(player_level, hero_pool)
print("Shop slots:", shop_result)
