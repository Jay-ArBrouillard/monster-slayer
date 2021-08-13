function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const app = Vue.createApp({
    data() {
        return { 
            heroHp: 100,
            monsterHp: 100,
            heroAccuracy: 100,
            monsterAccuracy: 100,
            heroAttackStyle: '',
            monsterAttackStyle: '',
            monsterAttackStyleOrder: ['ranged', 'melee', 'melee', 'mage'],
            currentRound: 0,
            usedSpecialAttack: false,
            battleLogs: []
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
            const accuracy = this.calculateAccuracy(this.monsterAttackStyle, this.heroAttackStyle)
            const hit = accuracy >= getRandomInRange(1, 100)
            if (hit) {
                const monsterAttack = getRandomInRange(8, 15) 
                this.heroHp -= monsterAttack
                this.addLog('Monster', `${this.monsterAttackStyle} attacks`, monsterAttack)
            } else {
                this.addLog('Monster', `missed ${this.monsterAttackStyle} attack`, null)
            }

            this.monsterAttackStyleOrder.push(this.monsterAttackStyleOrder.shift()) //rotate array
            this.monsterAttackStyle = this.monsterAttackStyleOrder[3]
        },
        attackMonster(type) {
            this.heroAttackStyle = type
            this.monsterAttackStyle = this.monsterAttackStyleOrder[0]
            const accuracy = this.calculateAccuracy(this.heroAttackStyle, this.monsterAttackStyle)
            const hit = accuracy >= getRandomInRange(1, 100)
            if (hit) {
                const heroAttack = getRandomInRange(8, 15) 
                this.monsterHp -= heroAttack
                if (this.usedSpecialAttack) this.currentRound++;
                this.addLog('Hero', `${this.heroAttackStyle} attacks`, heroAttack)
            } else {
                this.addLog('Hero', `missed ${this.heroAttackStyle} attack`, null)
            }
            this.attackHero()
        },
        specialAttackMonster() {
            const heroSpecialAttack = getRandomInRange(12, 25) 
            this.monsterHp -= heroSpecialAttack
            this.usedSpecialAttack = true
            this.currentRound++;
            this.addLog('Hero', 'special attacked', heroSpecialAttack)
            this.attackHero()
        },
        heal() {
            const healValue = getRandomInRange(3, 20)
            if (healValue + this.heroHp > 100) {
                this.heroHp = 100
                this.addLog('Hero', 'fullHeal', healValue)
            } else {
                this.heroHp += healValue
                this.addLog('Hero', 'heal', healValue)
            }
            if (this.usedSpecialAttack) this.currentRound++;
            this.attackHero()
        },
        reset() {
            this.heroHp = 100;
            this.monsterHp = 100;
            this.currentRound = 0;
            this.usedSpecialAttack = false;
            this.monsterAttackStyle = 'ranged';
            this.battleLogs = [];
        },
        surrender() {
            this.heroHp = 0;
            this.battleLogs = []
        },
        addLog(who, what, amount) {
            this.battleLogs.unshift({
                who,
                what,
                amount
            });
        }
    },
    computed: {
        monsterHealthBarValue() {
            if (this.monsterHp < 0) {
                return {width: '0%'}
            }
            return { 
                width: `${this.monsterHp}%`
            }
        },
        heroHealthBarValue() {
            if (this.heroHp < 0) {
                return {width: '0%'}
            }
            return { 
                width: `${this.heroHp}%`
            }
        }, 
        specialAttackOnCooldown() {
            return this.currentRound % 3 !== 0;
        },
        gameOver() {
            return this.heroHp <= 0 || this.monsterHp <= 0
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