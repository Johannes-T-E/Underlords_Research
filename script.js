// Load hero data
let heroes = null;
let selectedHero = null;

// Fetch hero data from JSON file
fetch('underlords_heroes.json')
    .then(response => response.json())
    .then(data => {
        heroes = data.heroes;
        initializeHeroList();
    })
    .catch(error => console.error('Error loading hero data:', error));

// Initialize the hero list panel
function initializeHeroList() {
    const heroList = document.getElementById('heroList');
    heroList.innerHTML = '';
    
    Object.values(heroes).forEach(hero => {
        const card = createHeroCard(hero);
        heroList.appendChild(card);
    });

    // Initialize filters
    initializeFilters();
}

// Initialize the 6x6 grid
function initializeGrid() {
    const grid = document.getElementById('heroGrid');
    for (let i = 0; i < 36; i++) {  // Changed from 64 to 36 for 6x6 grid
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        
        // Add drag and drop event listeners
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('dragleave', handleDragLeave);
        cell.addEventListener('drop', handleDrop);
        
        // Add click event for selection
        cell.addEventListener('click', () => selectHero(cell));
        
        grid.appendChild(cell);
    }
}

// Place hero in grid cell
function placeHero(cell, hero, level) {
    // Clear any existing content
    cell.innerHTML = '';
    
    // Set cell properties
    cell.classList.add('occupied');
    cell.dataset.heroId = Object.keys(heroes).find(id => heroes[id].id === hero.id);
    cell.dataset.level = level;
    
    // Calculate stats
    const currentHP = hero.health[level-1];
    const maxHP = hero.health[level-1];
    const currentMana = hero.maxmana;
    const maxMana = 100;
    
    // Create hero content
    cell.innerHTML = `
        <div class="hero-piece" draggable="true">
            <div class="hero-name">${hero.displayName.replace('#dac_hero_name_', '')}</div>
            <div class="hero-level">Level ${level}</div>
            <div class="hero-stats">
                <div class="bar-container">
                    <div class="bar hp-bar" style="width: 100%">
                        <span class="bar-value">${currentHP}/${maxHP}</span>
                    </div>
                </div>
                <div class="bar-container">
                    <div class="bar mana-bar" style="width: ${(currentMana / maxMana) * 100}%">
                        <span class="bar-value">${currentMana}/${maxMana}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add drag event listeners to the hero piece
    const heroPiece = cell.querySelector('.hero-piece');
    heroPiece.addEventListener('dragstart', handleGridDragStart);
    heroPiece.addEventListener('dragend', handleGridDragEnd);
}

// Create hero card
function createHeroCard(hero) {
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.draggable = true;
    card.dataset.heroId = Object.keys(heroes).find(id => heroes[id].id === hero.id);
    card.dataset.alliances = hero.keywords;
    card.dataset.tier = hero.goldCost;

    // Create hero info container
    const heroInfo = document.createElement('div');
    heroInfo.className = 'hero-info';
    
    // Hero portrait
    const portrait = document.createElement('div');
    portrait.className = 'hero-portrait';
    const heroName = hero.displayName.replace('#dac_hero_name_', '').toLowerCase().replace(/\s+/g, '_');
    portrait.style.backgroundImage = `url('hero_portraits/npc_dota_hero_${heroName}_png.png')`;
    heroInfo.appendChild(portrait);
    
    // Hero name
    const nameCost = document.createElement('div');
    nameCost.className = 'name-cost';
    nameCost.innerHTML = `
        <div class="hero-name">${hero.displayName.replace('#dac_hero_name_', '')}</div>
    `;
    heroInfo.appendChild(nameCost);

    // Alliance indicators
    const allianceIndicators = document.createElement('div');
    allianceIndicators.className = 'alliance-indicators';
    const keywords = hero.keywords.split(' ');
    keywords.forEach(keyword => {
        const indicator = document.createElement('div');
        indicator.className = `alliance-indicator alliance-${keyword}`;
        allianceIndicators.appendChild(indicator);
    });

    card.appendChild(heroInfo);
    card.appendChild(allianceIndicators);

    // Add drag event listeners
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

// Drag and Drop handlers
function handleDragStart(e) {
    e.target.classList.add('dragging');
    const heroId = e.target.dataset.heroId;
    e.dataTransfer.setData('text/plain', heroId);
    e.dataTransfer.setData('level', '1');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const heroId = e.dataTransfer.getData('text/plain');
    const sourceIndex = e.dataTransfer.getData('source-index');
    const hero = heroes[heroId];
    const level = parseInt(e.dataTransfer.getData('level'));
    
    // If dropping on an occupied cell, swap the heroes
    if (e.currentTarget.classList.contains('occupied')) {
        const targetHeroId = e.currentTarget.dataset.heroId;
        const targetHero = heroes[targetHeroId];
        const targetLevel = parseInt(e.currentTarget.dataset.level);
        
        // Place the target hero in the source cell
        if (sourceIndex) {
            const sourceCell = document.querySelector(`[data-index="${sourceIndex}"]`);
            placeHero(sourceCell, targetHero, targetLevel);
        }
        
        // Place the dragged hero in the target cell
        placeHero(e.currentTarget, hero, level);
    } else {
        // Place hero in empty cell
        placeHero(e.currentTarget, hero, level);
        
        // Clear source cell if it was a grid cell
        if (sourceIndex) {
            const sourceCell = document.querySelector(`[data-index="${sourceIndex}"]`);
            sourceCell.classList.remove('occupied');
            sourceCell.innerHTML = '';
        }
    }

    // Update selected hero if the dropped hero was selected
    if (selectedHero && selectedHero.cell.dataset.index === sourceIndex) {
        selectHero(e.currentTarget);
    }
}

// Grid drag handlers
function handleGridDragStart(e) {
    if (!e.target.classList.contains('hero-piece')) return;
    e.target.classList.add('dragging');
    const cell = e.target.parentElement;
    e.dataTransfer.setData('text/plain', cell.dataset.heroId);
    e.dataTransfer.setData('source-index', cell.dataset.index);
    e.dataTransfer.setData('level', cell.dataset.level);
}

function handleGridDragEnd(e) {
    if (!e.target.classList.contains('hero-piece')) return;
    e.target.classList.remove('dragging');
}

// Update control panel with selected hero info
function updateControls() {
    const heroInfo = document.getElementById('selectedHeroInfo');
    const hpBar = document.getElementById('hpBar');
    const manaBar = document.getElementById('manaBar');
    
    if (!selectedHero) {
        heroInfo.innerHTML = '<p>Select a hero to view and modify its properties</p>';
        return;
    }
    
    const hero = selectedHero.hero;
    const level = selectedHero.level;
    
    const currentHP = hero.health[level-1];
    const maxHP = hero.health[level-1];
    const currentMana = hero.maxmana;
    const maxMana = 100;
    
    heroInfo.innerHTML = `
        <div class="hero-details">
            <h3>${hero.displayName.replace('#dac_hero_name_', '')}</h3>
            <div class="hero-stats-grid">
                <div class="stat-item">
                    <label>Cost:</label>
                    <span>${hero.goldCost}</span>
                </div>
                <div class="stat-item">
                    <label>Damage:</label>
                    <span>${hero.damageMin[level-1]} - ${hero.damageMax[level-1]}</span>
                </div>
                <div class="stat-item">
                    <label>Health:</label>
                    <span>${currentHP}/${maxHP}</span>
                </div>
                <div class="stat-item">
                    <label>Armor:</label>
                    <span>${hero.armor}</span>
                </div>
                <div class="stat-item">
                    <label>Magic Resist:</label>
                    <span>${hero.magicResist}%</span>
                </div>
                <div class="stat-item">
                    <label>Attack Rate:</label>
                    <span>${hero.attackRate}</span>
                </div>
                <div class="stat-item">
                    <label>Move Speed:</label>
                    <span>${hero.movespeed}</span>
                </div>
                <div class="stat-item">
                    <label>Keywords:</label>
                    <span>${hero.keywords}</span>
                </div>
            </div>
        </div>
    `;
    
    hpBar.style.width = '100%';
    hpBar.innerHTML = `<span class="bar-value">${currentHP}/${maxHP}</span>`;
    manaBar.style.width = `${(currentMana / maxMana) * 100}%`;
    manaBar.innerHTML = `<span class="bar-value">${currentMana}/${maxMana}</span>`;
}

// Update the level controls
function updateLevelControls() {
    const decreaseBtn = document.getElementById('decreaseLevel');
    const increaseBtn = document.getElementById('increaseLevel');
    const currentLevelSpan = document.getElementById('currentLevel');
    
    if (!selectedHero) {
        decreaseBtn.disabled = true;
        increaseBtn.disabled = true;
        currentLevelSpan.textContent = '1';
        return;
    }
    
    const currentLevel = selectedHero.level;
    currentLevelSpan.textContent = currentLevel;
    decreaseBtn.disabled = currentLevel <= 1;
    increaseBtn.disabled = currentLevel >= 3;
}

// Select hero and update controls
function selectHero(cell) {
    if (!cell.classList.contains('occupied')) return;
    
    selectedHero = {
        cell: cell,
        hero: heroes[cell.dataset.heroId],
        level: parseInt(cell.dataset.level)
    };
    
    updateControls();
    updateLevelControls();
}

// Add level control event listeners
document.getElementById('increaseLevel').addEventListener('click', function() {
    if (!selectedHero || selectedHero.level >= 3) return;
    
    const newLevel = selectedHero.level + 1;
    selectedHero.level = newLevel;
    selectedHero.cell.dataset.level = newLevel;
    
    // Update the hero piece in the current cell
    placeHero(selectedHero.cell, selectedHero.hero, newLevel);
    updateControls();
    updateLevelControls();
});

document.getElementById('decreaseLevel').addEventListener('click', function() {
    if (!selectedHero || selectedHero.level <= 1) return;
    
    const newLevel = selectedHero.level - 1;
    selectedHero.level = newLevel;
    selectedHero.cell.dataset.level = newLevel;
    
    // Update the hero piece in the current cell
    placeHero(selectedHero.cell, selectedHero.hero, newLevel);
    updateControls();
    updateLevelControls();
});

// Initialize the grid when the page loads
document.addEventListener('DOMContentLoaded', initializeGrid);

// Initialize filters
let activeAlliances = new Set();
let activeTiers = new Set();
let allianceFilterLogic = 'AND';

function initializeFilters() {
    const allianceFilters = document.getElementById('allianceFilters');
    const tierFilters = document.getElementById('tierFilters');
    
    // Get unique alliances and tiers
    const alliances = new Set();
    const tiers = new Set();
    
    Object.values(heroes).forEach(hero => {
        hero.keywords.split(' ').forEach(keyword => alliances.add(keyword));
        tiers.add(hero.goldCost);
    });
    
    // Create alliance filters
    alliances.forEach(alliance => {
        const button = document.createElement('button');
        button.className = 'filter-option';
        button.innerHTML = `
            <div class="alliance-indicator alliance-${alliance}"></div>
            <span>${alliance}</span>
        `;
        button.addEventListener('click', () => toggleAllianceFilter(alliance));
        allianceFilters.appendChild(button);
    });
    
    // Create tier filters
    Array.from(tiers).sort().forEach(tier => {
        const button = document.createElement('button');
        button.className = 'tier-option';
        button.innerHTML = `<span>Tier ${tier}</span>`;
        button.addEventListener('click', () => toggleTierFilter(tier));
        tierFilters.appendChild(button);
    });
    
    // Add alliance logic listeners
    document.querySelectorAll('input[name="allianceLogic"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            allianceFilterLogic = e.target.value;
            filterHeroList();
        });
    });
}

function toggleAllianceFilter(alliance) {
    const button = document.querySelector(`.filter-option .alliance-${alliance}`).parentElement;
    if (activeAlliances.has(alliance)) {
        activeAlliances.delete(alliance);
        button.classList.remove('active');
    } else {
        activeAlliances.add(alliance);
        button.classList.add('active');
    }
    filterHeroList();
}

function toggleTierFilter(tier) {
    const button = document.querySelector(`.tier-option:nth-child(${tier})`);
    button.classList.toggle('active');
    filterHeroList();
}

function filterHeroList() {
    const selectedAlliances = Array.from(document.querySelectorAll('.filter-option.active'))
        .map(button => button.querySelector('.alliance-indicator').classList[1].replace('alliance-', ''));
    
    const selectedTiers = Array.from(document.querySelectorAll('.tier-option.active'))
        .map(button => parseInt(button.textContent.replace('Tier ', '')));
    
    const allianceLogic = document.querySelector('input[name="allianceLogic"]:checked').value;
    
    const heroCards = document.querySelectorAll('.hero-card');
    heroCards.forEach(card => {
        const cardAlliances = card.dataset.alliances.split(' ');
        const cardTier = parseInt(card.dataset.tier);
        
        // Check alliance filter
        const allianceMatch = allianceLogic === 'AND' 
            ? selectedAlliances.every(alliance => cardAlliances.includes(alliance))
            : selectedAlliances.length === 0 || selectedAlliances.some(alliance => cardAlliances.includes(alliance));
        
        // Check tier filter
        const tierMatch = selectedTiers.length === 0 || selectedTiers.includes(cardTier);
        
        card.style.display = allianceMatch && tierMatch ? 'flex' : 'none';
    });
} 