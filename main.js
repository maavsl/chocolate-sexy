class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    preload() {
        this.load.audio('music', 'assets/music.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        this.add.text(800, 80, 'SUPER PEPITO AIRBNB WORLD', {
            fontSize: '48px',
            color: '#FFD700'
        }).setOrigin(0.5);

        const story = `
En una ciudad dominada por las reviews...

Pepito, gestor legendario de Airbnbs,
se enfrenta a huéspedes imposibles.

Albacete exige papel higiénico.
La madre quiere vino.
Las parejas gay... dinero.

Las 5* no se regalan... SE PELEAN!
`;

        const text = this.add.text(800, 620, story, {
            fontSize: '26px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: 220,
            duration: 12000,
            ease: 'Linear'
        });

        this.add.text(800, 420, '← → MOVER    |    1 VINO    |    2 PAPEL    |    3 DINERO', {
            fontSize: '22px',
            color: '#00ffcc'
        }).setOrigin(0.5);

        this.add.text(800, 460, 'Haz click o pulsa una tecla para activar música', {
            fontSize: '20px',
            color: '#bbbbbb'
        }).setOrigin(0.5);

        this.add.text(800, 495, 'Pulsa ESPACIO o TOCA para empezar', {
            fontSize: '26px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.musicStarted = false;

        const startIntroMusic = () => {
            if (this.musicStarted) return;
            this.music = this.sound.add('music', { loop: true, volume: 0.3 });
            this.music.play();
            this.musicStarted = true;
            this.registry.set('bgMusicStarted', true);
        };

        this.input.once('pointerdown', startIntroMusic);
        this.input.keyboard.once('keydown', startIntroMusic);

        this.input.keyboard.once('keydown-SPACE', () => {
            if (!this.musicStarted) startIntroMusic();
            this.scene.start('GameScene');
        });

        this.input.once('pointerup', () => {
            if (!this.musicStarted) startIntroMusic();
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('background', 'assets/fondo1.png');

        this.load.image('player', 'assets/pepito.png');
        this.load.image('playerShoot', 'assets/pepito2.png');

        this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');

        this.load.image('item1', 'assets/papel.png');
        this.load.image('item2', 'assets/vino.png');
        this.load.image('item3', 'assets/dollar.png');

        this.load.image('enemy1', 'assets/albacete.png');
        this.load.image('enemy2', 'assets/mami.png');
        this.load.image('enemy3', 'assets/pareja.png');

        this.load.audio('shoot', 'assets/shot.wav');
        this.load.audio('music', 'assets/music.mp3');
    }

    isMobile() {
        return this.sys.game.device.input.touch;
    }

    isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    create() {
        this.score = 0;
        this.gameOver = false;

        const musicStarted = this.registry.get('bgMusicStarted');
        if (!musicStarted) {
            this.music = this.sound.add('music', { loop: true, volume: 0.3 });
            this.music.play();
            this.registry.set('bgMusicStarted', true);
        }

        this.add.image(800, 250, 'background');

        this.ground = this.physics.add.staticGroup();
        this.ground.create(800, 470, 'ground')
            .setDisplaySize(1600, 60)
            .refreshBody();

        this.enemies = this.physics.add.group();
        this.items = this.physics.add.group();

        this.player = this.physics.add.sprite(140, 390, 'player');
        this.player.setScale(0.18);
        this.player.setCollideWorldBounds(true);
        this.player.body.setAllowGravity(false);

        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.enemies, this.ground);

        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.items, this.enemies, this.hitEnemyWithItem, null, this);

        const scoreBox = this.add.rectangle(95, 40, 170, 60, 0x000000, 0.55);
        scoreBox.setStrokeStyle(2, 0xffffff);

        this.scoreText = this.add.text(20, 20, '⭐ 0', {
            fontSize: '28px',
            color: '#FFD700'
        });

        this.gameOverBox = this.add.rectangle(800, 120, 600, 120, 0x000000, 0.7);
        this.gameOverBox.setStrokeStyle(4, 0xffffff);
        this.gameOverBox.setVisible(false);

        this.gameOverText = this.add.text(800, 120, '', {
            fontSize: '64px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.restartText = this.add.text(800, 175, '', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        this.shootSound = this.sound.add('shoot');

        this.time.addEvent({
            delay: 1800,
            callback: () => this.spawnEnemy(),
            loop: true
        });

        // Estado táctil
        this.touchControls = {
            left: false,
            right: false
        };

        // Botones móviles
        this.btnLeft = this.add.rectangle(90, 430, 110, 110, 0x000000, 0.35)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        this.btnLeftText = this.add.text(90, 430, '←', {
            fontSize: '44px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.btnRight = this.add.rectangle(230, 430, 110, 110, 0x000000, 0.35)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        this.btnRightText = this.add.text(230, 430, '→', {
            fontSize: '44px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.btnWine = this.add.rectangle(1180, 430, 110, 110, 0x000000, 0.35)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        this.btnWineText = this.add.text(1180, 430, '🍷', {
            fontSize: '40px'
        }).setOrigin(0.5);

        this.btnPaper = this.add.rectangle(1320, 430, 110, 110, 0x000000, 0.35)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        this.btnPaperText = this.add.text(1320, 430, '🧻', {
            fontSize: '40px'
        }).setOrigin(0.5);

        this.btnMoney = this.add.rectangle(1460, 430, 110, 110, 0x000000, 0.35)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        this.btnMoneyText = this.add.text(1460, 430, '💵', {
            fontSize: '40px'
        }).setOrigin(0.5);

        // Eventos táctiles mover
        this.btnLeft.on('pointerdown', () => {
            this.touchControls.left = true;
        });
        this.btnLeft.on('pointerup', () => {
            this.touchControls.left = false;
        });
        this.btnLeft.on('pointerout', () => {
            this.touchControls.left = false;
        });

        this.btnRight.on('pointerdown', () => {
            this.touchControls.right = true;
        });
        this.btnRight.on('pointerup', () => {
            this.touchControls.right = false;
        });
        this.btnRight.on('pointerout', () => {
            this.touchControls.right = false;
        });

        // Eventos táctiles disparo
        this.btnWine.on('pointerdown', () => {
            if (!this.gameOver) this.shootItem('item2');
        });

        this.btnPaper.on('pointerdown', () => {
            if (!this.gameOver) this.shootItem('item1');
        });

        this.btnMoney.on('pointerdown', () => {
            if (!this.gameOver) this.shootItem('item3');
        });

        // Overlay vertical
        this.rotateOverlay = this.add.rectangle(800, 250, 1600, 500, 0x000000, 0.88);
        this.rotateOverlay.setVisible(false);

        this.rotateText = this.add.text(800, 250, '🔄 Gira el móvil para jugar', {
            fontSize: '42px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Por defecto, en escritorio no se ven
        this.setMobileButtonsVisible(false);

        if (this.isMobile()) {
            this.setMobileButtonsVisible(true);
        }
    }

    setMobileButtonsVisible(visible) {
        this.btnLeft.setVisible(visible);
        this.btnLeftText.setVisible(visible);

        this.btnRight.setVisible(visible);
        this.btnRightText.setVisible(visible);

        this.btnWine.setVisible(visible);
        this.btnWineText.setVisible(visible);

        this.btnPaper.setVisible(visible);
        this.btnPaperText.setVisible(visible);

        this.btnMoney.setVisible(visible);
        this.btnMoneyText.setVisible(visible);
    }

    update() {
        // Móvil vertical: bloquear
        if (this.isMobile() && this.isPortrait()) {
            this.rotateOverlay.setVisible(true);
            this.rotateText.setVisible(true);
            this.physics.pause();
            this.player.setVelocityX(0);
            this.setMobileButtonsVisible(false);
            return;
        } else {
            this.rotateOverlay.setVisible(false);
            this.rotateText.setVisible(false);
            this.physics.resume();

            if (this.isMobile()) {
                this.setMobileButtonsVisible(true);
            }
        }

        if (this.gameOver) {
            this.player.setVelocityX(0);

            if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
                this.scene.restart();
            }
            return;
        }

        const movingLeft = this.cursors.left.isDown || this.touchControls.left;
        const movingRight = this.cursors.right.isDown || this.touchControls.right;

        if (movingLeft && !movingRight) {
            this.player.setVelocityX(-300);
        } else if (movingRight && !movingLeft) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }

        this.player.y = 390;

        if (Phaser.Input.Keyboard.JustDown(this.key1)) {
            this.shootItem('item2');
        }

        if (Phaser.Input.Keyboard.JustDown(this.key2)) {
            this.shootItem('item1');
        }

        if (Phaser.Input.Keyboard.JustDown(this.key3)) {
            this.shootItem('item3');
        }

        this.enemies.children.each((enemy) => {
            if (enemy.active && enemy.x < -200) {
                enemy.destroy();
            }
        });

        this.items.children.each((item) => {
            if (item.active && item.x > 1800) {
                item.destroy();
            }
        });
    }

    shootItem(type) {
        const item = this.items.create(this.player.x + 45, this.player.y - 10, type);

        if (type === 'item1') {
            item.setScale(0.18);
        } else if (type === 'item2') {
            item.setScale(0.14);
        } else if (type === 'item3') {
            item.setScale(0.16);
        }

        item.setVelocityX(420);
        item.body.setAllowGravity(false);
        item.setAngularVelocity(200);
        item.itemType = type;

        this.shootSound.play();

        this.player.setTexture('playerShoot');
        this.time.delayedCall(120, () => {
            if (this.player.active) {
                this.player.setTexture('player');
            }
        });

        this.time.delayedCall(2000, () => {
            if (item && item.active) {
                item.destroy();
            }
        });
    }

    spawnEnemy() {
        if (this.gameOver) return;

        const types = [
            { key: 'enemy1', correct: 'item1' },
            { key: 'enemy2', correct: 'item2' },
            { key: 'enemy3', correct: 'item3' }
        ];

        const random = Phaser.Utils.Array.GetRandom(types);
        const speed = Phaser.Math.Between(120, 260);

        const enemy = this.enemies.create(1600, 390, random.key);
        enemy.setScale(0.18);
        enemy.setVelocityX(-speed);
        enemy.body.setAllowGravity(false);
        enemy.correctItem = random.correct;
    }

    hitEnemy(player, enemy) {
        this.gameOver = true;
        enemy.setVelocityX(0);
        this.gameOverBox.setVisible(true);
        this.gameOverText.setText('GAME OVER');
        this.restartText.setText('Pulsa R para reintentar');
    }

    hitEnemyWithItem(item, enemy) {
        item.destroy();

        let points = 1;
        let text = '+1 ⭐';

        if (item.itemType === enemy.correctItem) {
            enemy.destroy();
            points = 5;
            text = '+5 ⭐';
        }

        this.score += points;
        this.scoreText.setText('⭐ ' + this.score);

        const popup = this.add.text(enemy.x, enemy.y - 20, text, {
            fontSize: '26px',
            color: '#FFD700'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: popup,
            y: enemy.y - 100,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            onComplete: () => {
                popup.destroy();
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 500,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [IntroScene, GameScene]
};

const game = new Phaser.Game(config);
