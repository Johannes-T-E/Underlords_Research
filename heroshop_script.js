class UnderlordsShop {
    constructor() {
        this.shopOdds = {
            "1":  { "tier1": 0.80, "tier2": 0.20, "tier3": 0.00, "tier4": 0.00, "tier5": 0.00 },
            "2":  { "tier1": 0.70, "tier2": 0.30, "tier3": 0.00, "tier4": 0.00, "tier5": 0.00 },
            "3":  { "tier1": 0.55, "tier2": 0.35, "tier3": 0.10, "tier4": 0.00, "tier5": 0.00 },
            "4":  { "tier1": 0.45, "tier2": 0.40, "tier3": 0.15, "tier4": 0.00, "tier5": 0.00 },
            "5":  { "tier1": 0.35, "tier2": 0.40, "tier3": 0.25, "tier4": 0.00, "tier5": 0.00 },
            "6":  { "tier1": 0.25, "tier2": 0.35, "tier3": 0.35, "tier4": 0.05, "tier5": 0.00 },
            "7":  { "tier1": 0.20, "tier2": 0.30, "tier3": 0.40, "tier4": 0.10, "tier5": 0.00 },
            "8":  { "tier1": 0.18, "tier2": 0.24, "tier3": 0.35, "tier4": 0.20, "tier5": 0.03 },
            "9":  { "tier1": 0.15, "tier2": 0.21, "tier3": 0.30, "tier4": 0.28, "tier5": 0.06 },
            "10": { "tier1": 0.12, "tier2": 0.18, "tier3": 0.28, "tier4": 0.32, "tier5": 0.10 }
        };
        
        this.cardsPerTier = {
            "1": 30,
            "2": 20,
            "3": 18,
            "4": 12,
            "5": 10
        };

        this.deck = new Map(); // Will store hero_id -> cards_remaining
        this.heroes = new Map(); // Will store hero_id -> hero_data
        this.playerBench = []; // Will now store objects with {hero, stars}
        this.heroesPerTier = { 1: [], 2: [], 3: [], 4: [], 5: [] };
        
        this.currentShop = [null, null, null, null, null]; // Track current shop slots
        this.heroProgress = new Map(); // Track progress of each hero {id: {star1: count, star2: count, star3: count}}
        
        // Add a property to track locked cards
        this.lockedCards = new Set(); // Will store hero IDs that are temporarily locked
        
        this.currentLevel = 1;  // Add this line
        
        this.loadHeroes();
    }

    async loadHeroes() {
        try {
            console.log('Starting to load heroes...');
            
            const response = await fetch('./underlords_heroes.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Heroes data loaded:', data);
            
            // Process heroes and create initial deck
            for (const [key, hero] of Object.entries(data.heroes)) {
                if (hero.goldCost >= 1 && hero.goldCost <= 5) {
                    const cleanName = hero.displayName.replace('#dac_hero_name_', '')
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                    const heroData = {
                        id: hero.id,
                        name: cleanName,
                        cost: hero.goldCost,
                        keywords: hero.keywords || '',
                        portrait: `./hero_portraits/${hero.texturename}.png`
                    };

                    this.heroes.set(hero.id, heroData);
                    this.heroesPerTier[hero.goldCost].push(hero.id);
                    this.deck.set(hero.id, this.cardsPerTier[hero.goldCost]);
                }
            }

            // Log deck initialization stats
            console.log('Deck initialization complete:');
            for (let tier = 1; tier <= 5; tier++) {
                const heroCount = this.heroesPerTier[tier].length;
                const copiesPerHero = this.cardsPerTier[tier];
                const totalCards = heroCount * copiesPerHero;
                console.log(`Tier ${tier}: ${heroCount} heroes, ${copiesPerHero} copies each = ${totalCards} total cards`);
            }

            this.updateDeckStatus();
        } catch (error) {
            console.error('Error loading heroes:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
        }
    }

    getTotalCardsInDeck() {
        return Array.from(this.deck.values()).reduce((a, b) => a + b, 0);
    }

    getHeroesInTier(tier) {
        return this.heroesPerTier[tier].length;
    }

    getDeckStatus() {
        const status = {
            totalCards: this.getTotalCardsInDeck(),
            byTier: {}
        };

        for (let tier = 1; tier <= 5; tier++) {
            status.byTier[tier] = {
                heroes: this.getHeroesInTier(tier),
                cardsPerHero: this.cardsPerTier[tier],
                totalCards: this.heroesPerTier[tier].reduce((sum, heroId) => 
                    sum + this.deck.get(heroId), 0
                )
            };
        }

        return status;
    }

    updateDeckStatus() {
        const status = this.getDeckStatus();
        const available = this.getAvailableCards();
        const playerLevel = this.currentLevel;
        const deckStatus = document.getElementById('deckStatus');
        
        deckStatus.innerHTML = `
            <div class="deck-status-header">
                <div class="total-cards">
                    <span>Total Pool: ${status.totalCards}</span>
                    <span class="drawable-pool">Drawable Pool: ${available.drawablePool}</span>
                </div>
            </div>
            <div class="tier-status-container">
                ${Object.entries(status.byTier).map(([tier, data]) => {
                    const odds = (this.shopOdds[playerLevel][`tier${tier}`] * 100).toFixed(1);
                    const canDraw = this.shopOdds[playerLevel][`tier${tier}`] > 0;
                    return `
                        <div class="tier-status tier-${tier} ${!canDraw ? 'tier-locked' : ''}">
                            <div class="tier-header">Tier ${tier}</div>
                            <div class="tier-details">
                                <div class="tier-stat">Pool: ${available.byTier[tier]}</div>
                                <div class="tier-stat">Heroes: ${available.uniqueByTier[tier]}</div>
                                <div class="tier-stat">Chance: ${odds}%</div>
                                <div class="tier-stat">Drawable: ${canDraw ? available.byTier[tier] - this.getLockedCardsInTier(tier) : 0}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    rollShop() {
        const odds = this.shopOdds[this.currentLevel];
        const newShop = [];

        for (let i = 0; i < 5; i++) {
            // Skip slots that aren't empty (unless it's a full reroll)
            if (this.currentShop[i] !== null) {
                newShop[i] = this.currentShop[i];
                continue;
            }

            const roll = Math.random();
            let cumulative = 0;
            let selectedTier = 1;

            // Determine tier
            for (let tier = 1; tier <= 5; tier++) {
                cumulative += odds[`tier${tier}`];
                if (roll <= cumulative) {
                    selectedTier = tier;
                    break;
                }
            }

            // Get available heroes of selected tier
            const availableHeroes = Array.from(this.heroes.values())
                .filter(hero => {
                    const progress = this.getHeroProgress(hero.id);
                    return hero.cost === selectedTier && 
                           this.deck.get(hero.id) > 0 && 
                           progress.star3 === 0 &&
                           !this.lockedCards.has(hero.id);
                });

            if (availableHeroes.length > 0) {
                newShop[i] = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
            } else {
                newShop[i] = null; // No available heroes for this tier
            }
        }

        this.currentShop = newShop;
        return newShop;
    }

    buyHero(shopIndex) {
        const hero = this.currentShop[shopIndex];
        if (hero && this.deck.get(hero.id) > 0) {
            // Check if hero is already 3-star
            const progress = this.getHeroProgress(hero.id);
            if (progress.star3 > 0) {
                return false; // Can't buy more copies of 3-star heroes
            }

            this.deck.set(hero.id, this.deck.get(hero.id) - 1);
            
            // Add to bench and update progress
            this.playerBench.push({
                hero: hero,
                stars: 1
            });
            progress.star1 += 1;
            
            // Remove from locked cards when purchased
            this.lockedCards.delete(hero.id);
            
            this.currentShop[shopIndex] = null;
            this.updateDeckStatus();
            
            // Check for possible upgrades
            this.checkAndUpgradeHeroes();
            return true;
        }
        return false;
    }

    sellHero(benchIndex) {
        const unit = this.playerBench[benchIndex];
        if (unit) {
            // Update hero progress
            const progress = this.getHeroProgress(unit.hero.id);
            progress[`star${unit.stars}`] -= 1;
            
            // Return cards to deck
            const cardsToReturn = unit.stars === 1 ? 1 : (unit.stars === 2 ? 3 : 9);
            this.deck.set(unit.hero.id, this.deck.get(unit.hero.id) + cardsToReturn);
            
            this.playerBench.splice(benchIndex, 1);
            this.updateDeckStatus();
            return true;
        }
        return false;
    }

    fullReroll() {
        // Clear previous locked cards
        this.lockedCards.clear();
        
        // Add current shop heroes to locked set
        this.currentShop.forEach(hero => {
            if (hero !== null) {
                this.lockedCards.add(hero.id);
            }
        });

        // Clear shop slots
        this.currentShop = [null, null, null, null, null];
        
        // Roll new shop
        const newShop = this.rollShop();
        
        return newShop;
    }

    // Add this new method to track hero copies
    getHeroProgress(heroId) {
        if (!this.heroProgress.has(heroId)) {
            this.heroProgress.set(heroId, { star1: 0, star2: 0, star3: 0 });
        }
        return this.heroProgress.get(heroId);
    }

    // Add method to check for possible upgrades
    checkAndUpgradeHeroes() {
        let upgraded = false;
        
        // Check for 3-star upgrades first (need three 2-star units)
        for (const [heroId, progress] of this.heroProgress.entries()) {
            while (progress.star2 >= 3 && progress.star3 === 0) {  // Changed from if to while to handle multiple upgrades
                // Create 3-star hero
                progress.star2 -= 3;
                progress.star3 += 1;
                
                // Remove 2-star copies from bench
                let removedCount = 0;
                this.playerBench = this.playerBench.filter(unit => {
                    if (unit.hero.id === heroId && unit.stars === 2 && removedCount < 3) {
                        removedCount++;
                        return false;
                    }
                    return true;
                });
                
                // Add 3-star copy
                this.playerBench.push({
                    hero: this.heroes.get(heroId),
                    stars: 3
                });
                upgraded = true;
            }
        }

        // Then check for 2-star upgrades (need three 1-star units)
        for (const [heroId, progress] of this.heroProgress.entries()) {
            while (progress.star1 >= 3) {
                // Create 2-star hero
                progress.star1 -= 3;
                progress.star2 += 1;
                
                // Remove 1-star copies from bench
                let removedCount = 0;
                this.playerBench = this.playerBench.filter(unit => {
                    if (unit.hero.id === heroId && unit.stars === 1 && removedCount < 3) {
                        removedCount++;
                        return false;
                    }
                    return true;
                });
                
                // Add 2-star copy
                this.playerBench.push({
                    hero: this.heroes.get(heroId),
                    stars: 2
                });
                upgraded = true;

                // Immediately check if this new 2-star can be part of a 3-star upgrade
                if (progress.star2 >= 3) {
                    // Create 3-star hero
                    progress.star2 -= 3;
                    progress.star3 += 1;
                    
                    // Remove 2-star copies from bench
                    let removedCount2 = 0;
                    this.playerBench = this.playerBench.filter(unit => {
                        if (unit.hero.id === heroId && unit.stars === 2 && removedCount2 < 3) {
                            removedCount2++;
                            return false;
                        }
                        return true;
                    });
                    
                    // Add 3-star copy
                    this.playerBench.push({
                        hero: this.heroes.get(heroId),
                        stars: 3
                    });
                }
            }
        }

        return upgraded;
    }

    // Add method to calculate available cards
    getAvailableCards() {
        const available = {
            total: 0,
            byTier: {},
            uniqueByTier: {},
            drawablePool: 0
        };

        // Get current player level
        const playerLevel = this.currentLevel;
        const odds = this.shopOdds[playerLevel];

        // Only consider current shop heroes for next reroll
        const futureLockedHeroes = new Set();
        this.currentShop.forEach(hero => {
            if (hero !== null) {
                futureLockedHeroes.add(hero.id);
            }
        });

        for (let tier = 1; tier <= 5; tier++) {
            const tierHeroes = this.heroesPerTier[tier];
            let tierTotal = 0;
            let uniqueInTier = 0;
            let drawableTierTotal = 0;

            // Only count cards from tiers we can actually draw
            const canDrawFromTier = odds[`tier${tier}`] > 0;

            tierHeroes.forEach(heroId => {
                const progress = this.getHeroProgress(heroId);
                const cardsInDeck = this.deck.get(heroId);
                
                // Count total available cards
                if (progress.star3 === 0) {
                    tierTotal += cardsInDeck;
                    if (cardsInDeck > 0) {
                        uniqueInTier++;
                    }

                    // Count drawable cards (not in future locked set and in available tier)
                    if (!futureLockedHeroes.has(heroId) && canDrawFromTier) {
                        drawableTierTotal += cardsInDeck;
                    }
                }
            });
            
            available.byTier[tier] = tierTotal;
            available.uniqueByTier[tier] = uniqueInTier;
            available.total += tierTotal;
            available.drawablePool += drawableTierTotal;
        }

        // Debug information showing only the currently visible shop heroes that will be locked
        console.log('Heroes locked for next roll:', {
            uniqueLockedHeroes: Array.from(futureLockedHeroes).map(id => {
                const hero = this.heroes.get(id);
                return {
                    name: hero.name,
                    tier: hero.cost,
                    cardsInDeck: this.deck.get(id)
                };
            }),
            totalDrawablePool: available.drawablePool
        });

        return available;
    }

    // Update helper method to only consider current shop heroes
    getLockedCardsInTier(tier) {
        const lockedHeroesInTier = new Set();
        
        // Only consider heroes from current shop
        this.currentShop.forEach(hero => {
            if (hero && hero.cost === tier) {
                lockedHeroesInTier.add(hero.id);
            }
        });

        // Calculate total cards locked
        let totalLockedCards = 0;
        lockedHeroesInTier.forEach(heroId => {
            totalLockedCards += this.deck.get(heroId);
        });

        return totalLockedCards;
    }

    // Add this method
    setLevel(newLevel) {
        // Ensure level is within bounds
        newLevel = Math.max(1, Math.min(10, newLevel));
        if (this.currentLevel === newLevel) return;
        
        this.currentLevel = newLevel;
        this.updateDeckStatus();
        return this.fullReroll();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const shop = new UnderlordsShop();
    const levelDisplay = document.getElementById('playerLevel');
    const decreaseBtn = document.getElementById('decreaseLevel');
    const increaseBtn = document.getElementById('increaseLevel');
    const rerollBtn = document.getElementById('rerollBtn');
    const shopDisplay = document.getElementById('shop');
    const oddsDisplay = document.getElementById('odds');
    const benchDisplay = document.getElementById('bench');

    function updateLevelControls() {
        levelDisplay.textContent = `Level ${shop.currentLevel}`;
        decreaseBtn.disabled = shop.currentLevel <= 1;
        increaseBtn.disabled = shop.currentLevel >= 10;
    }

    function updateShopDisplay(heroes) {
        shopDisplay.innerHTML = heroes.map((hero, index) => {
            if (hero === null) {
                return `<div class="hero-card empty-slot">
                    <div class="empty-slot-text">Empty Slot</div>
                    <div class="key-hint">${index + 1}</div>
                </div>`;
            }

            const progress = shop.getHeroProgress(hero.id);
            const progressDisplay = `
                ${progress.star1 > 0 ? `<div class="progress-star">${'<span class="star star-1"></span>'.repeat(1)} × ${progress.star1}</div>` : ''}
                ${progress.star2 > 0 ? `<div class="progress-star">${'<span class="star star-2"></span>'.repeat(2)} × ${progress.star2}</div>` : ''}
                ${progress.star3 > 0 ? `<div class="progress-star">${'<span class="star star-3"></span>'.repeat(3)} × ${progress.star3}</div>` : ''}
            `;

            const wouldUpgrade = checkPotentialUpgrade(hero.id, progress);
            const upgradeClass = wouldUpgrade ? 'potential-upgrade' : '';
            const disabledClass = progress.star3 > 0 ? 'disabled' : '';

            return `
                <div class="hero-card cost-${hero.cost} new-card ${upgradeClass} ${disabledClass}" 
                     onclick="buyHeroFromShop(${index})"
                     data-shop-index="${index}">
                    <div class="key-hint">${index + 1}</div>
                    <div class="hero-portrait">
                        <img src="./hero_portraits/npc_dota_hero_${hero.name.toLowerCase().replace(/ /g, '_')}_png.png" alt="${hero.name}">
                    </div>
                    <div class="hero-info">
                        <div class="hero-name">${hero.name}</div>
                        <div class="hero-cost">${hero.cost} 🪙</div>
                        <div class="hero-progress">${progressDisplay}</div>
                        <div class="alliance-indicators">${formatKeywords(hero.keywords)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function updateBenchDisplay() {
        benchDisplay.innerHTML = shop.playerBench.map((unit, index) => `
            <div class="hero-card cost-${unit.hero.cost} bench-card" 
                 data-bench-index="${index}"
                 onclick="selectBenchHero(${index})">
                <div class="hero-portrait">
                    <img src="./hero_portraits/npc_dota_hero_${unit.hero.name.toLowerCase().replace(/ /g, '_')}_png.png" alt="${unit.hero.name}">
                    <div class="star-level">
                        ${`<span class="star star-${unit.stars}"></span>`.repeat(unit.stars)}
                    </div>
                </div>
                <div class="hero-info">
                    <div class="hero-name">${unit.hero.name}</div>
                    <div class="hero-cost">${unit.hero.cost} 🪙</div>
                    <div class="alliance-indicators">${formatKeywords(unit.hero.keywords)}</div>
                </div>
            </div>
        `).join('');
    }

    function formatKeywords(keywords) {
        // Replace the text keywords with alliance icons
        return keywords.split(' ').map(keyword => 
            `<div class="alliance-indicator alliance-${keyword.toLowerCase()}"></div>`
        ).join('');
    }

    // Global functions for the onclick handlers
    window.buyHeroFromShop = (shopIndex) => {
        if (shop.buyHero(shopIndex)) {
            updateShopDisplay(shop.currentShop);
            updateBenchDisplay();
            shop.updateDeckStatus();
        }
    };

    window.sellHero = (benchIndex) => {
        if (shop.sellHero(benchIndex)) {
            updateBenchDisplay();
            shop.updateDeckStatus();
        }
    };

    decreaseBtn.addEventListener('click', () => {
        const heroes = shop.setLevel(shop.currentLevel - 1);
        if (heroes) {
            updateShopDisplay(heroes);
            updateLevelControls();
        }
    });

    increaseBtn.addEventListener('click', () => {
        const heroes = shop.setLevel(shop.currentLevel + 1);
        if (heroes) {
            updateShopDisplay(heroes);
            updateLevelControls();
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

        if (event.key === 'r') {
            const heroes = shop.fullReroll();
            updateShopDisplay(heroes);
            shop.updateDeckStatus();
        } else if (event.key === '+' || event.key === '=') {
            increaseBtn.click();
        } else if (event.key === '-' || event.key === '_') {
            decreaseBtn.click();
        } else if (event.key.toLowerCase() === 'e' && selectedBenchIndex !== null) {
            // Sell selected hero
            if (shop.sellHero(selectedBenchIndex)) {
                selectedBenchIndex = null;
                updateBenchDisplay();
            }
        } else {
            // Existing number key handling for shop slots
            const shopPosition = parseInt(event.key) - 1;
            if (shopPosition >= 0 && shopPosition <= 4) {
                if (shop.currentShop[shopPosition] !== null) {
                    buyHeroFromShop(shopPosition);
                }
            }
        }
    });

    // Initial setup
    updateLevelControls();
    shop.updateDeckStatus();
    setTimeout(() => rerollBtn.click(), 1000);
});

// Add this new function to check if buying a hero would cause an upgrade
function checkPotentialUpgrade(heroId, progress) {
    // For 3-star upgrade: need exactly 2 2-star units AND 2 1-star units
    if (progress.star2 === 2 && progress.star1 === 2) {
        return true;
    }
    
    // For 2-star upgrade: need exactly 2 1-star units (and no 2-star units)
    if (progress.star1 === 2 && progress.star2 === 0) {
        return true;
    }

    // For potential path to 3-star: need 1 2-star and 2 1-star units
    if (progress.star2 === 1 && progress.star1 === 2) {
        return true;
    }

    return false;
}

// Add these new functions
let selectedBenchIndex = null;

window.selectBenchHero = (index) => {
    // Deselect if clicking the same hero
    if (selectedBenchIndex === index) {
        selectedBenchIndex = null;
        document.querySelectorAll('.bench-card').forEach(card => card.classList.remove('selected'));
        return;
    }

    selectedBenchIndex = index;
    document.querySelectorAll('.bench-card').forEach(card => card.classList.remove('selected'));
    document.querySelector(`.bench-card[data-bench-index="${index}"]`).classList.add('selected');
}; 