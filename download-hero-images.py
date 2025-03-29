import os
import requests

# Base URL for the hero portraits
base_url = "https://underlords-university.vercel.app/images/heroes/portraits_wide/"

# List of all hero image filenames
image_filenames = [
    "npc_dota_hero_abaddon_png.png", "npc_dota_hero_alchemist_png.png", "npc_dota_hero_antimage_png.png",
    "npc_dota_hero_axe_png.png", "npc_dota_hero_batrider_png.png", "npc_dota_hero_beastmaster_png.png",
    "npc_dota_hero_bounty_hunter_png.png", "npc_dota_hero_bristleback_png.png", "npc_dota_hero_chaos_knight_png.png",
    "npc_dota_hero_crystal_maiden_png.png", "npc_dota_hero_dazzle_png.png", "npc_dota_hero_death_prophet_png.png",
    "npc_dota_hero_doom_bringer_png.png", "npc_dota_hero_dragon_knight_png.png", "npc_dota_hero_drow_ranger_png.png",
    "npc_dota_hero_earth_spirit_png.png", "npc_dota_hero_ember_spirit_png.png", "npc_dota_hero_enchantress_png.png",
    "npc_dota_hero_faceless_void_png.png", "npc_dota_hero_juggernaut_png.png", "npc_dota_hero_keeper_of_the_light_png.png",
    "npc_dota_hero_kunkka_png.png", "npc_dota_hero_legion_commander_png.png", "npc_dota_hero_lich_png.png",
    "npc_dota_hero_life_stealer_png.png", "npc_dota_hero_lina_png.png", "npc_dota_hero_lone_druid_png.png",
    "npc_dota_hero_luna_png.png", "npc_dota_hero_lycan_png.png", "npc_dota_hero_magnataur_png.png",
    "npc_dota_hero_medusa_png.png", "npc_dota_hero_meepo_png.png", "npc_dota_hero_mirana_png.png",
    "npc_dota_hero_furion_png.png", "npc_dota_hero_omniknight_png.png", "npc_dota_hero_pangolier_png.png",
    "npc_dota_hero_phantom_assassin_png.png", "npc_dota_hero_puck_png.png", "npc_dota_hero_pudge_png.png",
    "npc_dota_hero_queenofpain_png.png", "npc_dota_hero_rubick_png.png", "npc_dota_hero_shadow_demon_png.png",
    "npc_dota_hero_shadow_shaman_png.png", "npc_dota_hero_slardar_png.png", "npc_dota_hero_slark_png.png",
    "npc_dota_hero_snapfire_png.png", "npc_dota_hero_spectre_png.png", "npc_dota_hero_spirit_breaker_png.png",
    "npc_dota_hero_storm_spirit_png.png", "npc_dota_hero_sven_png.png", "npc_dota_hero_templar_assassin_png.png",
    "npc_dota_hero_terrorblade_png.png", "npc_dota_hero_tidehunter_png.png", "npc_dota_hero_treant_png.png",
    "npc_dota_hero_troll_warlord_png.png", "npc_dota_hero_tusk_png.png", "npc_dota_hero_vengefulspirit_png.png",
    "npc_dota_hero_venomancer_png.png", "npc_dota_hero_viper_png.png", "npc_dota_hero_void_spirit_png.png",
    "npc_dota_hero_windrunner_png.png", "npc_dota_hero_skeleton_king_png.png"
]

# Create the folder if it doesn't exist
output_dir = "hero_portraits"
os.makedirs(output_dir, exist_ok=True)

# Download the images
for filename in image_filenames:
    url = base_url + filename
    response = requests.get(url)
    if response.status_code == 200:
        with open(os.path.join(output_dir, filename), "wb") as file:
            file.write(response.content)
        print(f"✅ Downloaded: {filename}")
    else:
        print(f"❌ Failed to download: {filename}")
