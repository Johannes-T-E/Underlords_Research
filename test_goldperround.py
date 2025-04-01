import json

class GameSimulator:
    def __init__(self):
        # Load game data
        with open('data.json', 'r') as f:
            self.game_data = json.load(f)
        
        # Initialize player state
        self.gold = 5  # Start with 5 gold
        self.round = 1
        self.win_streak = 0
        self.loss_streak = 0
        
        # Add new state variables
        self.level = 1
        self.xp = 0
        self.xp_cost = 5  # Cost to buy 4 XP
        
        # Print initial state
        print(f"\nRound {self.round} Summary:")
        print(f"Starting round")
        print(f"Base gold: 0")
        print(f"Interest gold (from {self.gold} gold): 0")
        print(f"Streak gold (0 wins/0 losses): 0")
        print(f"Total gold gained: 0")
        print(f"Current gold: {self.gold}")
        print(f"Current win streak: {self.win_streak}")
        print(f"Current loss streak: {self.loss_streak}")

    def calculate_base_gold(self):
        # Check specific round first
        if str(self.round) in self.game_data['baseGoldPerRound']:
            return self.game_data['baseGoldPerRound'][str(self.round)]
        # Check range (e.g., "5-40")
        for key in self.game_data['baseGoldPerRound']:
            if '-' in key:
                start, end = map(int, key.split('-'))
                if start <= self.round <= end:
                    return self.game_data['baseGoldPerRound'][key]
        return 0

    def calculate_streak_gold(self):
        streak_rules = self.game_data['streakRules']
        
        # Check win streak
        if self.win_streak > 0:
            # Get reward for current streak
            for tier in reversed(streak_rules['winStreak']['tiers']):
                if self.win_streak >= tier['rounds']:
                    reward = tier['gold']
                    # If streak is completed (8 rounds), reset it after giving reward
                    if self.win_streak >= streak_rules['winStreak']['maxRounds']:
                        self.win_streak = 0
                    return reward
                    
        # Check loss streak
        if self.loss_streak > 0:
            for tier in reversed(streak_rules['lossStreak']['tiers']):
                if self.loss_streak >= tier['rounds']:
                    return tier['gold']
        
        return 0

    def calculate_interest(self):
        interest_rules = self.game_data['streakRules']['interest']
        interest = (self.gold // interest_rules['goldPerInterval']) * interest_rules['goldReward']
        return min(interest, interest_rules['maxReward'])

    def buy_xp(self):
        if self.gold >= self.xp_cost:
            self.gold -= self.xp_cost
            self.add_xp(4)
            return True
        return False
    
    def add_xp(self, amount):
        self.xp += amount
        # Check for level ups
        while self.level < 10:  # Max level is 10
            xp_needed = self.game_data['xpNeededForEachLevel'][str(self.level + 1)]
            if self.xp >= xp_needed:
                self.level += 1
                self.xp = 0
            else:
                break

    def play_round(self, won: bool, buy_xp=False):
        # Increment round first
        self.round += 1
        
        # Add 1 XP automatically each round
        self.add_xp(1)
        
        # Store previous gold for interest calculation
        previous_gold = self.gold
        
        # Calculate all gold sources
        base_gold = self.calculate_base_gold()
        interest_gold = self.calculate_interest()
        
        # Update streaks
        if won:
            self.win_streak += 1
            self.loss_streak = 0
        else:
            self.loss_streak += 1
            self.win_streak = 0
            
        streak_gold = self.calculate_streak_gold()
        
        # Add all gold
        total_gold_gained = base_gold + interest_gold + streak_gold
        self.gold += total_gold_gained
        
        # Buy XP if requested and possible
        xp_bought = 0
        if buy_xp:
            if self.buy_xp():
                xp_bought = 4
        
        # Print round summary
        print(f"\nRound {self.round} Summary:")
        print(f"{'Won' if won else 'Lost'} the round")
        print(f"Base gold: {base_gold}")
        print(f"Interest gold (from {previous_gold} gold): {interest_gold}")
        print(f"Streak gold ({self.win_streak} wins/{self.loss_streak} losses): {streak_gold}")
        print(f"Total gold gained: {total_gold_gained}")
        print(f"Current gold: {self.gold}")
        print(f"Level: {self.level} (XP: {self.xp})")
        if xp_bought:
            print(f"Bought {xp_bought} XP for {self.xp_cost} gold")

def simulate_strategy(win_pattern, xp_buying_rounds):
    """
    win_pattern: List of bools indicating win/loss pattern
    xp_buying_rounds: List of round numbers where we buy XP
    """
    simulator = GameSimulator()
    total_gold_spent = 0
    gold_available_for_units = 0
    
    for round_num in range(1, len(win_pattern) + 1):
        should_buy_xp = round_num in xp_buying_rounds
        simulator.play_round(win_pattern[round_num - 1], buy_xp=should_buy_xp)
        
        if should_buy_xp:
            total_gold_spent += simulator.xp_cost
        
        gold_available_for_units = simulator.gold - total_gold_spent
    
    return {
        'final_level': simulator.level,
        'gold_spent_on_xp': total_gold_spent,
        'gold_available_for_units': gold_available_for_units,
        'total_gold': simulator.gold
    }

def test_strategies():
    # We'll test strategies over 15 rounds, assuming different win patterns
    num_rounds = 15
    
    # Different win patterns to test
    perfect_wins = [True] * num_rounds
    early_losses = [False, False, True, True, True] + [True] * 10  # Lose first 2 rounds
    alternating = [i % 2 == 0 for i in range(num_rounds)]  # Win every other round
    
    # Different leveling strategies
    strategies = {
        "Rush Level 8": {
            "description": "Buy XP every round after round 4 until level 8",
            "xp_rounds": list(range(4, 15))
        },
        "Economy First": {
            "description": "Save gold for interest, buy XP only after round 8",
            "xp_rounds": list(range(8, 15))
        },
        "Balanced": {
            "description": "Buy XP every other round after round 4",
            "xp_rounds": list(range(4, 15, 2))
        },
        "Level 7 Hold": {
            "description": "Rush to level 7, then save gold",
            "xp_rounds": [4, 5, 6, 7, 8, 9, 10]  # Buy XP until around level 7
        },
        "Slow Roll": {
            "description": "Stay at lower levels, maximize economy",
            "xp_rounds": [5, 8, 11, 14]  # Buy XP very rarely
        }
    }
    
    # Test each strategy with each win pattern
    results = {}
    for pattern_name, win_pattern in [
        ("Perfect Wins", perfect_wins),
        ("Early Losses", early_losses),
        ("Alternating", alternating)
    ]:
        print(f"\n=== Testing with {pattern_name} ===")
        
        for strat_name, strategy in strategies.items():
            print(f"\n--- {strat_name} ---")
            print(strategy["description"])
            
            result = simulate_strategy(win_pattern, strategy["xp_rounds"])
            
            print(f"Final Level: {result['final_level']}")
            print(f"Gold spent on XP: {result['gold_spent_on_xp']}")
            print(f"Gold available for units: {result['gold_available_for_units']}")
            print(f"Total gold earned: {result['total_gold']}")
            
            # Store results for comparison
            key = (pattern_name, strat_name)
            results[key] = result
    
    # Print summary of best strategies for different goals
    print("\n=== Strategy Summary ===")
    
    for pattern_name in ["Perfect Wins", "Early Losses", "Alternating"]:
        print(f"\nBest strategies for {pattern_name}:")
        
        # Best for gold efficiency
        best_gold = max(
            ((name, result) for (pat, name), result in results.items() if pat == pattern_name),
            key=lambda x: x[1]['gold_available_for_units']
        )
        print(f"Best for economy: {best_gold[0]} with {best_gold[1]['gold_available_for_units']} gold for units")
        
        # Best for fast leveling
        best_level = max(
            ((name, result) for (pat, name), result in results.items() if pat == pattern_name),
            key=lambda x: x[1]['final_level']
        )
        print(f"Best for leveling: {best_level[0]} reaching level {best_level[1]['final_level']}")

def main():
    simulator = GameSimulator()
    
    while True:
        command = input("\nEnter command (w = win, l = loss, q = quit): ").lower()
        
        if command == 'q':
            break
        elif command == 'w':
            simulator.play_round(True)
        elif command == 'l':
            simulator.play_round(False)
        else:
            print("Invalid command. Use 'w' for win, 'l' for loss, or 'q' to quit.")

if __name__ == "__main__":
    test_strategies()