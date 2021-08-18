function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function getRandomNumberBetween(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

// 2 decimal rounded
function round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

const app = Vue.createApp({
    data() {
        return { 
            currentRound: 1,
            toggleRules: false,
            heroAttackStyle: '',
            specialAttackCounter: 0,
            specialAttackMinHit: 16,
            specialAttackMaxHit: 24,
            usedSpecialAttack: false,
            battleLogs: [],
            monsterStunnedCountDown: 0,
            healCount: 10,
            hero: {
                name: 'Hero',
                heroHp: 100,
                maxHp: 100,
                strength: 8,
                baseStrength: 5,
                accuracy: 96
            },
            goblin: {
                name: 'Goblin',
                monsterHp: 100,
                maxHp: 100,
                strength: 5,
                baseStrength: 5,
                monsterAttackStyle: '',
                monsterAttackStyleOrder: ['melee'],
                accuracy: 90
            },
            barbarian: {
                name: 'Barbarian',
                monsterHp: 100,
                maxHp: 100,
                strength: 6.5,
                baseStrength: 6.5,
                monsterAttackStyle: '',
                monsterAttackStyleOrder: ['melee', 'ranged'],
                accuracy: 85
            },
            dracula: {
                name: 'Dracula',
                monsterHp: 150,
                maxHp: 150,
                strength: 8,
                baseStrength: 8,
                monsterAttackStyle: '',
                monsterAttackStyleOrder: ['mage', 'melee'],
                accuracy: 92.5
            },
            rex: {
                name: 'T-Rex',
                monsterHp: 200,
                maxHp: 200,
                strength: 40,
                baseStrength: 40,
                monsterAttackStyle: '',
                monsterAttackStyleOrder: ['melee'],
                accuracy: 20
            },
            currentMonster: '',
            //Used for scoring
            randomEventCount: 0,
            killedGoblinIdx: 0,
            killedBarbarianIdx: 0,
            killedDraculaIdx: 0,
        }
    },
    methods: {
        calculateAttack(attackType, otherAttackType) {
            if (attackType === 'melee') {
                if (otherAttackType === 'melee') {
                    return {accuracyModifier: 1, damageModifier: 1};
                } else if (otherAttackType=== 'ranged') {
                    return {accuracyModifier: 1.1, damageModifier: 1.5};
                } else {
                    return {accuracyModifier: 0.75, damageModifier: 0.9};
                }
            } else if (attackType === 'ranged') {
                if (otherAttackType === 'melee') {
                    return {accuracyModifier: 0.75, damageModifier: 0.9};
                } else if (otherAttackType === 'ranged') {
                    return {accuracyModifier: 1, damageModifier: 1};
                } else {
                    return {accuracyModifier: 1.1, damageModifier: 1.5};
                }
            } else {
                if (otherAttackType === 'melee') {
                    return {accuracyModifier: 1.1, damageModifier: 1.5};
                } else if (otherAttackType === 'ranged') {
                    return {accuracyModifier: 0.75, damageModifier: 0.9};
                } else {
                    return {accuracyModifier: 1, damageModifier: 1};
                }
            }
        },
        attackHero() {
            if (this.monsterStunnedCountDown > 0) {
                this.monsterStunnedCountDown--;
                this.addLog(this.currentMonster.name, 'stunned', `stunned for ${this.monsterStunnedCountDown} more turn(s)`)
            } else {
                if (this.currentMonster.name === this.barbarian.name) this.calculateBarbarianStrength()
                const attackObject = this.calculateAttack(this.currentMonster.monsterAttackStyle, this.heroAttackStyle)
                const hit = (this.currentMonster.accuracy * attackObject.accuracyModifier) >= getRandomNumberBetween(1, 100)
                if (hit) {
                    let monsterAttack = round(getRandomNumberBetween(this.currentMonster.strength, this.currentMonster.strength * 2) * attackObject.damageModifier)
                    const attackMessagePrefix = attackObject.damageModifier < 1.0 ? 'weak' : attackObject.damageModifier > 1.0 ? 'strong' : ''; 
                    //If you fail a stun, then monster will counter attack for big damage
                    if (this.battleLogs[0].message === 'attempted to stun Monster and failed') {
                        monsterAttack = round(monsterAttack * 2.5)
                        this.addLog(this.currentMonster.name, 'attack', `${this.currentMonster.monsterAttackStyle} counter ${attackMessagePrefix} attacks and deals`, monsterAttack)
                    } else {
                        this.addLog(this.currentMonster.name, 'attack', `${this.currentMonster.monsterAttackStyle} ${attackMessagePrefix} attacks and deals`, monsterAttack)
                    }
                    this.hero.heroHp -= monsterAttack
                    if (this.currentMonster.name === this.dracula.name) {
                        //Lifesteal
                        if (getRandomNumberBetween(1,100) <= 10) {
                            const lifestealAmount = Math.max(1, round(monsterAttack * 0.1)) //10% of attack with minimum of 1
                            if (lifestealAmount + this.currentMonster.monsterHp < this.currentMonster.maxHp) {
                                this.currentMonster.monsterHp += lifestealAmount
                                this.addLog(this.currentMonster.name, 'other', `${this.currentMonster.name} healed ${lifestealAmount} via lifesteal`)
                            } else {
                                this.currentMonster.monsterHp = this.currentMonster.maxHp
                                this.addLog(this.currentMonster.name, 'other', `${this.currentMonster.name} healed to full via lifesteal`)
                            }
                        }
                    }
                } else {
                    this.addLog(this.currentMonster.name, 'miss', `attempted ${this.currentMonster.monsterAttackStyle} attacks and missed`)
                }
                this.currentMonster.monsterAttackStyleOrder.push(this.currentMonster.monsterAttackStyleOrder.shift()) //rotate array
                this.currentMonster.monsterAttackStyle = this.currentMonster.monsterAttackStyleOrder[this.currentMonster.monsterAttackStyleOrder.length - 1]
            }
        },
        attackMonster(type) {
            this.heroAttackStyle = type
            this.currentMonster.monsterAttackStyle = this.currentMonster.monsterAttackStyleOrder[0]
            const attackObject = this.calculateAttack(this.heroAttackStyle, this.currentMonster.monsterAttackStyle)
            const hit = (this.hero.accuracy * attackObject.accuracyModifier) >= getRandomNumberBetween(1, 100)
            if (hit) {
                let heroAttack = round(getRandomNumberBetween(this.hero.strength, this.hero.strength*2) * attackObject.damageModifier)
                const attackMessagePrefix = attackObject.damageModifier < 1.0 ? 'weak' : attackObject.damageModifier > 1.0 ? 'strong' : ''; 
                this.currentMonster.monsterHp -= heroAttack
                this.addLog('Hero', 'attack', `${this.heroAttackStyle} ${attackMessagePrefix} attacks and deals`, heroAttack)
            } else {
                this.addLog('Hero', 'miss', `attempted ${this.heroAttackStyle} attack and misses`)
            }
            if (this.usedSpecialAttack) this.specialAttackCounter++;
            if (this.currentMonster.monsterHp <= 0) {
                this.addLog('Hero', 'kill', `slain ${this.currentMonster.name}. Round ${this.currentRound} completed`)
                this.currentRound++
                if (this.currentRound === 2) {
                    this.currentMonster = this.barbarian
                    this.killedGoblinIdx = this.battleLogs.length - this.randomEventCount
                }
                else if (this.currentRound === 3) {
                    this.currentMonster = this.dracula
                    this.killedBarbarianIdx = this.battleLogs.length - this.randomEventCount
                }
                else {
                    this.currentMonster = this.rex
                    this.killedDraculaIdx = this.battleLogs.length - this.randomEventCount
                } 
            } else {
                this.attackHero()
            }
        },
        specialAttackMonster() {
            const heroSpecialAttack = round(getRandomNumberBetween(this.specialAttackMinHit, this.specialAttackMaxHit) )
            //Special attack always hits
            this.currentMonster.monsterHp -= heroSpecialAttack
            this.usedSpecialAttack = true
            this.specialAttackCounter++;
            this.addLog('Hero', 'special', 'special attacks and deals', heroSpecialAttack)
            if (this.currentMonster.monsterHp <= 0) {
                this.addLog('Hero', 'kill', `slain ${this.currentMonster.name}. Round ${this.currentRound} completed`)
                this.currentRound++
                if (this.currentRound === 2) {
                    this.currentMonster = this.barbarian
                    this.killedGoblinIdx = this.battleLogs.length - this.randomEventCount
                }
                else if (this.currentRound === 3) {
                    this.currentMonster = this.dracula
                    this.killedBarbarianIdx = this.battleLogs.length - this.randomEventCount
                }
                else {
                    this.currentMonster = this.rex
                    this.killedDraculaIdx = this.battleLogs.length - this.randomEventCount
                } 
            } else {
                this.attackHero()
            }
            this.specialAttackMinHit = 16
            this.specialAttackMaxHit = 24
        },
        chargeSpecialAttack() {
            //Special attack always hits
            this.specialAttackMaxHit = Math.floor(this.specialAttackMaxHit * (Math.max(1.1, Math.random() * 0.5 + 1)))
            this.specialAttackMinHit = Math.min(this.specialAttackMaxHit, Math.floor(this.specialAttackMinHit * (Math.max(1.1, Math.random() * 0.5 + 1)))) 
            this.addLog('Hero', 'charge', `charged special attack to new max hit of ${this.specialAttackMaxHit}`)
            this.attackHero()
        },
        heal() {
            const fiftyPercentMissingHP = (this.hero.maxHp - this.hero.heroHp) * 0.5
            const healValue = round(getRandomNumberBetween(1, fiftyPercentMissingHP))
            if (healValue + this.hero.heroHp > 100) {
                this.hero.heroHp = this.hero.maxHp
                this.addLog('Hero', 'fullHeal', 'heals to full', healValue)
            } else {
                this.hero.heroHp += healValue
                this.addLog('Hero', 'heal', 'heals himself for', healValue)
            }
            if (this.usedSpecialAttack) this.specialAttackCounter++;
            this.attackHero()
            this.healCount--;
        },
        stun() {
            const stun = getRandomIntInclusive(1, 2)
            if (stun === 2) {
                this.monsterStunnedCountDown = 2
                this.addLog(this.currentMonster.name, 'stun', `successfully stunned Monster for ${this.monsterStunnedCountDown} turn(s)`)
            } else {
                this.addLog(this.currentMonster.name, 'stunFail', 'attempted to stun Monster and failed')
                this.attackHero()
            }
            if (this.usedSpecialAttack) this.specialAttackCounter++;
        },
        reset() {
            this.hero.heroHp = this.hero.maxHp;
            this.currentMonster = this.goblin;
            this.goblin.monsterHp = this.goblin.maxHp;
            this.barbarian.monsterHp = this.barbarian.maxHp;
            this.dracula.monsterHp = this.dracula.maxHp;
            this.rex.monsterHp = this.rex.maxHp;
            this.hero.strength = this.hero.baseStrength;
            this.goblin.strength = this.goblin.baseStrength;
            this.dracula.strength = this.dracula.baseStrength;
            this.barbarian.strength = this.barbarian.baseStrength;
            this.rex.strength = this.rex.baseStrength;
            this.hero.accuracy = 96;
            this.goblin.accuracy = 90;
            this.barbarian.accuracy = 85;
            this.dracula.accuracy = 92.5;
            this.rex.accuracy = 20;
            this.specialAttackCounter = 0;
            this.usedSpecialAttack = false;
            this.currentMonster.monsterAttackStyle = '';
            this.currentMonster.monsterAttackStyleOrder = this.goblin.monsterAttackStyleOrder
            this.battleLogs = [];
            this.currentRound = 1
            this.specialAttackMinHit = 16
            this.specialAttackMaxHit = 24
            this.healCount = 10
            this.randomEventCount = 0
            this.killedGoblinIdx = 0
            this.killedBarbarianIdx = 0
            this.killedDraculaIdx = 0
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
        },
        calculateBarbarianStrength() {
            const healthPointsMissing = this.barbarian.maxHp - this.barbarian.monsterHp
            const newStrength = Math.ceil((healthPointsMissing / 100 + 1) * this.barbarian.baseStrength)
            this.barbarian.strength = newStrength
        }
    },
    computed: {
        monsterHealthBarValue() {
            if (this.currentMonster.monsterHp < 0) return 0
            else if (this.currentMonster.monsterHp === this.currentMonster.maxHp) return this.currentMonster.maxHp
            return round(this.currentMonster.monsterHp / this.currentMonster.maxHp * this.currentMonster.maxHp)
        },
        heroHealthBarValue() {
            if (this.hero.heroHp < 0) return 0
            else if (this.hero.heroHp === this.hero.maxHp) return this.hero.maxHp
            return round(this.hero.heroHp / this.hero.maxHp * this.hero.maxHp)
        }, 
        monsterHealthBarStyle() {
            if (this.currentMonster.monsterHp < 0) {
                return {width: '0%'}
            }
            return { 
                width: `${Math.round(this.currentMonster.monsterHp / this.currentMonster.maxHp * 100)}%`
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
            if (this.specialAttackCounter % 3 === 0) this.usedSpecialAttack = false
            return this.usedSpecialAttack;
        },
        gameOver() {
            let gameOver = false
            if (this.hero.heroHp <= 0) {
                gameOver = true
            }
            if (this.currentRound === 5 && this.currentMonster.monsterHp <= 0) {
                gameOver = true
            }
            return gameOver
        },
        monsterIcon() {
            if (this.currentMonster.monsterAttackStyle === 'ranged') return 'assets/bowman.png'
            else if (this.currentMonster.monsterAttackStyle === 'mage') return 'assets/lunar-wand.png'
            else if (this.currentMonster.monsterAttackStyle === 'melee') return 'assets/swordman.png'
            else return 'assets/uncertainty.png'
        },
        heroIcon() {
            if (this.heroAttackStyle === 'ranged') return 'assets/bowman.png'
            else if (this.heroAttackStyle === 'mage') return 'assets/lunar-wand.png'
            else if (this.heroAttackStyle === 'melee') return 'assets/swordman.png'
            else return 'assets/uncertainty.png'
        },
        monsterMaxHit() {
            return round(this.currentMonster.strength * 2.5)
        },
        monsterMaxCounterHit() {
            return round(round(Math.ceil(this.currentMonster.strength * 2) * 1.5) * 2.5)
        },
        heroMaxHeal() {
            return round((this.hero.maxHp - this.hero.heroHp) * 0.5)
        },
        heroMaxHit() {
            return this.specialAttackOnCooldown ? round(this.hero.strength * 2.5) : round(Math.max(this.specialAttackMaxHit, this.hero.strength * 2.5)) 
        },
        gameScore() {
            let score = 0
            if (this.currentRound === 1) {
                score += 200
            } else if (this.currentRound === 2) {
                score += 400
            } else if (this.currentRound === 3) {
                score += 800
            } else if (this.currentRound === 4) {
                score += 1600
            } else if (this.currentRound === 5) {
                score += 3200
            }
            // Add points for amount of healcount left
            score += this.healCount * 5
            // Add points for amount of hp left
            score += Math.max(0, this.hero.heroHp)
            // Add points for damage dealt to the current Monster
            score += this.currentMonster.maxHp - this.currentMonster.monsterHp
            // Add/Subtract points for each strong and weak attack Hero performed
            this.battleLogs.forEach(function (log) {
                if (log.who === 'Hero') {
                    if (log.message.includes('weak')) {
                        score -= 20
                    }
                    else if (log.message.includes('strong')) {
                        score += 10
                    }
                }
            });
            console.log(score)
            // Subtract points for every action it takes to kill the monster
            if (this.killedGoblinIdx !== 0) {
                score -= (this.killedGoblinIdx - this.randomEventCount) * 8
            }
            if (this.killedBarbarianIdx !== 0) {
                score -= (this.killedBarbarianIdx - this.killedGoblinIdx - this.randomEventCount) * 6
            }
            if (this.killedDraculaIdx !== 0) {
                score -= (this.killedDraculaIdx - this.killedGoblinIdx - this.randomEventCount) * 4
            }
            if (this.killedDraculaIdx !== 0 && this.currentRound === 5) { //killed T-Rex
                score -= (this.killedDraculaIdx - this.killedGoblinIdx - this.randomEventCount) * 2
            }
            console.log(score)
            // subtract for length of logs not including random events
            score -= this.battleLogs.length - this.randomEventCount
            return round(score)
        }
    },
    mounted: function () {
        this.currentMonster = this.goblin
        this.currentMonster.monsterAttackStyleOrder = this.currentMonster.monsterAttackStyleOrder
        window.setInterval(() => {
            if (this.currentMonster.name === 'Dracula') {
                // Heal Monster if his heal is low enough
                if (this.currentMonster.monsterHp > 0 && this.currentMonster.monsterHp <= this.currentMonster.maxHp * 0.2) {
                    if (this.currentMonster.monsterHp + 1 > this.currentMonster.maxHp) {
                        this.currentMonster.monsterHp = this.currentMonster.maxHp
                    } else {
                        this.currentMonster.monsterHp += 1
                    }
                }
            }

            // Random event 
            if (this.gameOver === false && Math.random() <= 0.025) {
                const event = getRandomIntInclusive(1, 8)
                const amount = getRandomIntInclusive(3, 7)
                switch (event) {
                    case 1:
                        this.addLog('Random Event', 'other', `Everyone gets +${amount} hp`)
                        this.randomEventCount++;
                        if (this.currentMonster.monsterHp + amount <= this.currentMonster.maxHp) this.currentMonster.monsterHp += amount
                        if (this.hero.heroHp + amount <= this.hero.maxHp) this.hero.heroHp += amount
                        break;
                    case 2:
                        this.addLog('Random Event', 'other', `Everyone loses -${amount} hp`)
                        this.randomEventCount++;
                        this.currentMonster.monsterHp -= amount
                        this.hero.heroHp -= amount
                        if (this.currentMonster.monsterHp <= 0) {
                            this.currentRound++
                            if (this.currentRound === 2) {
                                this.currentMonster = this.barbarian
                                this.killedGoblinIdx = this.battleLogs.length - this.randomEventCount
                            }
                            else if (this.currentRound === 3) {
                                this.currentMonster = this.dracula
                                this.killedBarbarianIdx = this.battleLogs.length - this.randomEventCount
                            }
                            else {
                                this.currentMonster = this.rex
                                this.killedDraculaIdx = this.battleLogs.length - this.randomEventCount
                            } 
                        } 
                        break;
                    case 3:
                        if (this.currentMonster.accuracy - amount >= 10) {
                            this.addLog('Random Event', 'other', `${this.currentMonster.name} -${amount} accuracy`)
                            this.randomEventCount++;
                            this.currentMonster.accuracy -= amount
                        }
                        break;
                    case 4:
                        if (this.currentMonster.accuracy + amount <= 100) {
                            this.addLog('Random Event', 'other', `${this.currentMonster.name} +${amount} accuracy`)
                            this.randomEventCount++;
                            this.currentMonster.accuracy += amount
                        }
                        break;
                    case 5:
                        if (this.currentMonster.accuracy - amount >= 10) {
                            this.addLog('Random Event', 'other', `${this.currentMonster.name} -${amount} accuracy, ${this.hero.name} +${amount} accuracy`)
                            this.randomEventCount++;
                            this.currentMonster.accuracy -= amount
                            this.hero.accuracy += amount
                        }
                        break;
                    case 6:
                        if (this.hero.accuracy - amount >= 10) {
                            this.addLog('Random Event', 'other', `${this.currentMonster.name} +${amount} accuracy, ${this.hero.name} -${amount} accuracy`)
                            this.randomEventCount++;
                            this.currentMonster.accuracy += amount
                            this.hero.accuracy -= amount
                        }
                        break;
                    case 7:
                        if (this.currentMonster.strength - amount >= 10) {
                            this.addLog('Random Event', 'other', `${this.currentMonster.name} -${amount} strength, ${this.hero.name} +${amount} strength`)
                            this.randomEventCount++;
                            this.currentMonster.strength -= amount
                            this.hero.strength += amount
                        }
                        break;
                    case 8:
                        if (this.hero.strength - amount >= 10) {
                            this.addLog('Random Event', 'other', `${this.currentMonster.name} +${amount} strength, ${this.hero.name} -${amount} strength`)
                            this.randomEventCount++;
                            this.currentMonster.strength += amount
                            this.hero.strength -= amount
                        }
                        break;
                }
            }
        }, 500)
    }
});

app.mount('#game')
