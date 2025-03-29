#  1-((0.052*ARMOR) / (0.9 +0.048 * |ARMOR|))

def armor_dmg_reduction(armor):
    return 100*(1-((0.052*armor) / (0.9 +0.048 * abs(armor))))

def main():

    armor_values = [-9, -5, 0, 5, 7, 10, 15, 20, 25]

    print("Armor | Damage Taken")
    for armor in armor_values:
        print(" {:2d}   | {:.0f} %".format(armor, armor_dmg_reduction(armor)))

if __name__ == "__main__":
    main()

