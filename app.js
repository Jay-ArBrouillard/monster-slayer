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
            currentRound: 0,
            usedSpecialAttack: false,
            battleLogs: []
        }
    },
    methods: {
        attackHero() {
            const monsterAttack = getRandomInRange(8, 15) 
            this.heroHp -= monsterAttack
            this.addLog('Monster', 'attacked', monsterAttack)
        },
        attackMonster() {
            const heroAttack = getRandomInRange(8, 15) 
            this.monsterHp -= heroAttack
            if (this.usedSpecialAttack) this.currentRound++;
            this.addLog('Hero', 'attacked', heroAttack)
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
            this.battleLogs = []
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
        }
    }
});

app.mount('#game')