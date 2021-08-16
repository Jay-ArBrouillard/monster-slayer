function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const app = Vue.createApp({
    mounted: function () {
        // Heal Monster if his heal is low enough
        window.setInterval(() => {
            if (this.goblin.monsterHp > 0 && this.goblin.monsterHp <= Math.floor(this.goblin.maxHp / 4)) {
                if (this.goblin.monsterHp + 1 > this.goblin.maxHp) {
                    this.goblin.monsterHp = this.goblin.maxHp
                } else {
                    this.goblin.monsterHp += 1
                }
            }
        }, 500)
    },
    data() {
        return { 
            toggleRules: false,
            heroAccuracy: 100,
            monsterAccuracy: 100,
            heroAttackStyle: '',
            monsterAttackStyle: '',
            monsterAttackStyleOrder: ['ranged', 'melee', 'melee', 'mage'],
            currentRound: 0,
            usedSpecialAttack: false,
            battleLogs: [],
            monsterStunnedCountDown: 0,
            idCounter: 0,
            hero: {
                name: 'Hero',
                heroHp: 100,
                maxHp: 100,
                strength: 8
            },
            goblin: {
                name: 'Goblin',
                monsterHp: 200,
                maxHp: 200,
                strength: 6
            }
        }
    },
    methods: {
        calculateAccuracy(attackType, otherAttackType) {
            if (attackType === 'melee') {
                if (otherAttackType === 'melee') {
                    return 90;
                } else if (otherAttackType=== 'ranged') {
                    return 100;
                } else {
                    return 75;
                }
            } else if (attackType === 'ranged') {
                if (otherAttackType === 'melee') {
                    return 75;
                } else if (otherAttackType === 'ranged') {
                    return 90;
                } else {
                    return 100;
                }
            } else {
                if (otherAttackType === 'melee') {
                    return 100;
                } else if (otherAttackType === 'ranged') {
                    return 75;
                } else {
                    return 90;
                }
            }
        },
        attackHero() {
            if (this.monsterStunnedCountDown > 0) {
                this.monsterStunnedCountDown--;
                this.addLog('Monster', 'stunned', `stunned for ${this.monsterStunnedCountDown} more turn(s)`)
            } else {
                //Monster will always have 100% accuracy
                let monsterAttack = getRandomInRange(this.goblin.strength, this.goblin.strength * 2) 
                //If you fail a stun, then monster will counter attack for big damage
                if (this.battleLogs[0].message === 'attempted to stun Monster and failed') {
                    monsterAttack *= 2.5
                    this.addLog('Monster', 'attack', `${this.monsterAttackStyle} counter attacked and dealt`, monsterAttack)
                } else {
                    this.addLog('Monster', 'attack', `${this.monsterAttackStyle} attacked and dealt`, monsterAttack)
                }
                this.hero.heroHp -= monsterAttack

                this.monsterAttackStyleOrder.push(this.monsterAttackStyleOrder.shift()) //rotate array
                this.monsterAttackStyle = this.monsterAttackStyleOrder[3]
            }
        },
        attackMonster(type) {
            this.heroAttackStyle = type
            this.monsterAttackStyle = this.monsterAttackStyleOrder[0]
            const accuracy = this.calculateAccuracy(this.heroAttackStyle, this.monsterAttackStyle)
            const hit = accuracy >= getRandomInRange(1, 100)
            if (hit) {
                let heroAttack = getRandomInRange(this.hero.strength, this.hero.strength*2) 
                //Boost attack
                if (accuracy === 100) heroAttack = Math.ceil(heroAttack * 1.5)
                this.goblin.monsterHp -= heroAttack
                this.addLog('Hero', 'attack', `${this.heroAttackStyle} attacked and dealt`, heroAttack)
            } else {
                this.addLog('Hero', 'miss', `attempted ${this.heroAttackStyle} attack and missed`)
            }
            if (this.usedSpecialAttack) this.currentRound++;
            this.attackHero()
        },
        specialAttackMonster() {
            const heroSpecialAttack = getRandomInRange(this.hero.strength*2, this.hero.strength*3) 
            this.goblin.monsterHp -= heroSpecialAttack
            this.usedSpecialAttack = true
            this.currentRound++;
            this.addLog('Hero', 'special', 'special attacked and deals', heroSpecialAttack)
            this.attackHero()
        },
        heal() {
            const healValue = getRandomInRange(3, 20)
            if (healValue + this.hero.heroHp > 100) {
                this.hero.heroHp = 100
                this.addLog('Hero', 'fullHeal', 'fully heals to', healValue)
            } else {
                this.hero.heroHp += healValue
                this.addLog('Hero', 'heal', 'heals himself for', healValue)
            }
            if (this.usedSpecialAttack) this.currentRound++;
            this.attackHero()
        },
        stun() {
            const stun = getRandomInRange(1, 2)
            if (stun === 2) {
                this.monsterStunnedCountDown = 2
                this.addLog('Monster', 'stun', `successfully stunned Monster for ${this.monsterStunnedCountDown} turn(s)`)
            } else {
                this.addLog('Monster', 'stunFail', 'attempted to stun Monster and failed')
                this.attackHero()
            }
            if (this.usedSpecialAttack) this.currentRound++;
        },
        reset() {
            this.hero.heroHp = this.hero.maxHp;
            this.goblin.monsterHp = this.goblin.maxHp;
            this.goblin.stun = false;
            this.currentRound = 0;
            this.usedSpecialAttack = false;
            this.monsterAttackStyle = 'ranged';
            this.monsterAttackStyleOrder = ['ranged', 'melee', 'melee', 'mage'],
            this.battleLogs = [];
        },
        surrender() {
            this.hero.heroHp = 0;
            this.battleLogs = []
        },
        addLog(who, what, message, amount) {
            this.battleLogs.unshift({
                who,
                what,
                message, 
                amount
            });
            this.idCounter++;
        }
    },
    computed: {
        monsterHealthBarValue() {
            if (this.goblin.monsterHp < 0) return 0
            else if (this.goblin.monsterHp === this.goblin.maxHp) return this.goblin.maxHp
            return Math.floor(this.goblin.monsterHp / this.goblin.maxHp * this.goblin.maxHp)
        },
        heroHealthBarValue() {
            if (this.hero.heroHp < 0) return 0
            else if (this.hero.heroHp === this.hero.maxHp) return this.hero.maxHp
            return Math.floor(this.hero.heroHp / this.hero.maxHp * this.hero.maxHp)
        }, 
        monsterHealthBarStyle() {
            if (this.goblin.monsterHp < 0) {
                return {width: '0%'}
            }
            return { 
                width: `${Math.floor(this.goblin.monsterHp / this.goblin.maxHp * 100)}%`
            }
        },
        heroHealthBarStyle() {
            if (this.hero.heroHp < 0) {
                return {width: '0%'}
            }
            return { 
                width: `${this.hero.heroHp}%`
            }
        }, 
        specialAttackOnCooldown() {
            if (this.currentRound % 3 === 0) this.usedSpecialAttack = false
            return this.usedSpecialAttack;
        },
        gameOver() {
            return this.hero.heroHp <= 0 || this.goblin.monsterHp <= 0
        },
        monsterIcon() {
            if (this.monsterAttackStyle === 'ranged') return 'assets/bowman.png'
            else if (this.monsterAttackStyle === 'mage') return 'assets/lunar-wand.png'
            else if (this.monsterAttackStyle === 'melee') return 'assets/swordman.png'
            else return 'assets/uncertainty.png'
        },
        heroIcon() {
            if (this.heroAttackStyle === 'ranged') return 'assets/bowman.png'
            else if (this.heroAttackStyle === 'mage') return 'assets/lunar-wand.png'
            else if (this.heroAttackStyle === 'melee') return 'assets/swordman.png'
            else return 'assets/uncertainty.png'
        }
    }
});

app.mount('#game')