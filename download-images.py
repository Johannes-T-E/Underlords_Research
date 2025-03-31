import os
import requests

# List of image filenames
image_filenames = [
    "assassin_psd.png", "brawny_psd.png", "brute_psd.png", "champion_psd.png",
    "demon_psd.png", "dragon_psd.png", "fallen_psd.png", "healer_psd.png",
    "heartless_psd.png", "human_psd.png", "hunter_psd.png", "knight_psd.png",
    "mage_psd.png", "magus_psd.png", "poisoner_psd.png", "rogue_psd.png",
    "savage_psd.png", "naga_psd.png", "wild_psd.png", "spirit_psd.png",
    "summoner_psd.png", "swordsman_psd.png", "troll_psd.png", "vigilant_psd.png",
    "void_psd.png", "warrior_psd.png"
]

# Base URL
base_url = "https://underlords-university.vercel.app/images/synergyicons/small/"

# Create a directory to save the images
output_dir = "synergy_icons"
os.makedirs(output_dir, exist_ok=True)

# Download each image
for filename in image_filenames:
    url = base_url + filename
    response = requests.get(url)
    if response.status_code == 200:
        with open(os.path.join(output_dir, filename), 'wb') as f:
            f.write(response.content)
        print(f"Downloaded: {filename}")
    else:
        print(f"Failed to download: {filename}")
