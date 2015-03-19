window.onload = function() {
    // You might want to start with a template that uses GameStates:
    //     https://github.com/photonstorm/phaser/tree/master/resources/Project%20Templates/Basic
    
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    "use strict";
    
    var game = new Phaser.Game( 800, 800, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render } );
    
    function preload() {
        // Loads images
        game.load.image( 'world', 'assets/CityBackground.png' );
        game.load.image( 'you', 'assets/Guy.png');
        game.load.image( 'car', 'assets/Car.png');
        game.load.image( 'hatguy', 'assets/Owner.png');
        game.load.image( 'citizen1', 'assets/Mystery1.png');
        game.load.image( 'citizen2', 'assets/Mystery2.png');
        
        // loads sound
        game.load.audio( 'backgroundMusic', 'assets/AnimalCrossing-TownHall.ogg');
    }
    
    //background image
    var world;
    
    //player sprite
    var player;
    
    //owner
    var owner;
    
    //enemies (moving cars are not fun)
    var enemies;
    var enemyTimer = 500;
    var nextEnemy = 0;
    
    //other people in the city
    var people;
    
    //game over message (and player death)
    var lost;
    var style;
    var isAlive;
    
    //player input
    var cursors;
    
    //sounds
    var music;
    
    //timer of the game
    var timer;
    var timerText;
    var timerStyle;
    var minutes;
    var seconds;
    var timerActive = true;
    
    //for other people
    var renderText = "";
    var renderTime = 500;
    var renderDisappear;
    var renderX = 0;
    var renderY = 0;
    var renderStyle;
    
    function create() {
        game.world.setBounds(0, 0, 1600, 1600);
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // creates background, player, and other sprites
        world = game.add.tileSprite(0, 0, 1600, 1600, 'world');
        player = game.add.sprite( 250, 250, 'you' );
        player.anchor.setTo( 0.5, 0.5 );
        game.physics.enable( player, Phaser.Physics.ARCADE );
        player.body.collideWorldBounds = true;
        
        
        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        enemies.createMultiple(20, 'car', 0, false);
        enemies.setAll('anchor.x', 0.5);
        enemies.setAll('anchor.y', 0.5);
        enemies.setAll('outOfBoundsKill', true);
        enemies.setAll('checkWorldBounds', true);
        
        owner = game.add.sprite(400 + game.rnd.integer() % 1200, 400 + game.rnd.integer() % 1200, 'hatguy');
        owner.anchor.setTo( 0.5, 0.5 );
        game.physics.enable( owner, Phaser.Physics.ARCADE );
        owner.body.collideWorldBounds = true;
        
        people = game.add.group();
        people.enableBody = true;
        people.physicsBodyType = Phaser.Physics.ARCADE;
        createPeople();
        
        // Player controls
        cursors = game.input.keyboard.createCursorKeys();
        
        // Adds sound
        music = game.add.audio('backgroundMusic', 1, true);
        music.play('', 0, 1, true);
        
        //initializes score and player's 1 life
        isAlive = true;
        
        //creates game over
        style = { font: "65px Arial", fill: "#ff0044", align: "center" };
        
        //centers camera on player
        game.camera.follow(player);
        game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
        game.camera.focusOnXY(0, 0);
        
        //initializes timer
        timer = game.time.now+90000;
        timerStyle = { font: "40px Arial", fill: "#0000ff", align: "center" }
        timerText = game.add.text(400, 30, "1:30", timerStyle);
        timerText.fixedToCamera = true;
        timerText.anchor.setTo(0.5, 0.5);
        
        //initializes citizen reaction text
        renderStyle = { font: "12px Arial", fill: "#000000", align: "center" }
        renderText = game.add.text(0, 0, "", renderStyle);
        renderText.anchor.setTo(0.5, 0.5);
    }
    
    function createPeople()
    {
        //modified from Invaders
        for(var y = 0; y < 10; y++)
        {
            var person = people.create(10, 10, 'citizen1');
            person.anchor.setTo(0.5, 0.5);
            var tempX = game.rnd.integer() % 1600;
            var tempY = game.rnd.integer() % 1600;
            person.reset(tempX, tempY);
            person.body.collideWorldBounds = true;
        }
        
        for(var y = 0; y < 10; y++)
        {
            var person = people.create(10, 10, 'citizen2');
            person.anchor.setTo(0.5, 0.5);
            var tempX = game.rnd.integer() % 1600;
            var tempY = game.rnd.integer() % 1600;
            person.reset(tempX, tempY);
            person.body.collideWorldBounds = true;
        }
    }
    
    function update() {
        // Controls movement of the player
        player.body.velocity.setTo(0, 0);
        if (cursors.left.isDown)
        {
            player.body.velocity.x = -150;
        }
        else if (cursors.right.isDown)
        {
            player.body.velocity.x = 150;
        }
        if (cursors.up.isDown)
        {
            player.body.velocity.y = -150;
        }
        else if (cursors.down.isDown)
        {
            player.body.velocity.y = 150;
        }      
        
        //now to check enemies
        game.physics.arcade.overlap(enemies, player, monsterHandler, null, this);
        game.physics.arcade.overlap(people, player, otherPeopleHandler, null, this);
        game.physics.arcade.overlap(owner, player, ownerHandler, null, this);
        
        createEnemy();
        
        //updates timer
        if(timerActive)
        {
            var timeLeft = timer - game.time.now;
            minutes = parseInt(timeLeft)/60000;
            seconds = (parseInt(timeLeft)/1000) % 60;
            if(seconds >= 10)
                timerText.setText(parseInt(minutes) + ":" + parseInt(seconds));
            else
                timerText.setText(parseInt(minutes) + ":0" + parseInt(seconds));

            if((timeLeft <= 0) && isAlive)
            {
                timeUp();
            }
        }
        
        //lets you know if you didn't find the right person
        if(game.time.now > renderDisappear)
        {
            renderText.setText("");
        }
    }
    
    function createEnemy()
    {
        if (game.time.now > nextEnemy && enemies.countDead() > 0)
        {
            var XY = (game.rnd.integer() % 2);
            var direction = (game.rnd.integer() % 2);
            var position = (game.rnd.integer() % 2);
            
            nextEnemy = game.time.now + enemyTimer;
            var enemy = enemies.getFirstExists(false);
            
            if(XY === 1)
            {
                enemy.reset(direction * 1800 - 100, 450 + 800*position - 100*direction);
                enemy.angle = 0;
                enemy.body.velocity.x = 500 - 1000*direction;
            }
            
            else
            {
                enemy.reset(450 + 800*position - 100*direction, direction * 1800 - 100);
                enemy.angle = 90;
                enemy.body.velocity.y = -500 + 1000*direction;
            }
        }
    }
    
    //handles player collision with cars
    function monsterHandler(player, enemy)
    {
        player.kill();
        isAlive = false;
        timerActive = false;
        lost = game.add.text(400, 300, "GAME OVER!", style);
        lost.anchor.setTo( 0.5, 0.5);
        lost.fixedToCamera = true;
    }
    
    function ownerHandler(celluser, player)
    {
        player.kill();
        isAlive = false;
        timerActive = false;
        lost = game.add.text(400, 300, "Found the owner!", style);
        lost.anchor.setTo( 0.5, 0.5);
        lost.fixedToCamera = true;
    }
    
    function otherPeopleHandler(player, citizen)
    {
        renderText.setText("That's not my phone.");
        renderDisappear = game.time.now + renderTime;
        renderX = citizen.body.x + 25;
        renderY = citizen.body.y - 5;
        renderText.x = renderX;
        renderText.y = renderY;
    }
    
    //game ends
    function timeUp()
    {
        player.kill();
        isAlive = false;
        timerActive = false;
        lost = game.add.text(400, 300, "GAME OVER!", style);
        lost.anchor.setTo( 0.5, 0.5);
        lost.fixedToCamera = true;
    }
    
    function render() 
    {
    }
};
