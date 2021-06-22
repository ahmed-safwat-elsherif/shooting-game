var maxSize = 20;
let focusTimes = 1;
var levelTiming = 2 * 60000 // per minutes
var enemiesCreationTiming = 2000
var initEnemiesLevels;
var initEnemey;
var isPause = 0;
var pauseBtn = document.querySelector('.btn-stop')
var resumeBtn = document.getElementById('resume')
const musicBtn = document.querySelector('#music');
const soundBtn = document.querySelector('#sound');
var shootingSound = new sound('./heat-vision.mp3', true)
var bgST = new sound('./bgMusic.mp3', false);
var explosionSound = new sound('./Explosion+7.mp3', true)
const canvas = document.querySelector('canvas');

const c = canvas.getContext('2d')

canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector('#scoreEl');
const startGameBtn = document.querySelector('#startGameBtn');
const modelEl = document.querySelector('#modelEl');
const bigScoreEl = document.querySelector('#bigScoreEl');
const avatar = document.querySelector('#avatar');

let animationId;
let score = 0;


const oldPlayer = document.querySelector('#oldPlayer');
const playersList = document.querySelector("#playersList");
const newPlayer = document.querySelector('#newPlayer');
const scoreDisplay = document.querySelector('.scoreDisplay');
let playerName;
let previousPlayers = JSON.parse(localStorage.getItem("gameStorage")) || [];
let playerId;


class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius
            , 0, Math.PI * 2, false)
        c.fillStyle = this.color;
        c.fill();
    }
}
class Projecttile {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius
            , 0, Math.PI * 2, false)
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius
            , 0, Math.PI * 2, false)
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.99
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }
    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath();
        c.arc(this.x, this.y, this.radius
            , 0, Math.PI * 2, false)
        c.fillStyle = this.color;
        c.fill();
        c.restore()
    }
    update() {
        this.draw();
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01
    }
}

const x = canvas.width / 2
const y = canvas.height / 2

let player = new Player(x, y, 10, 'white');
let projecttiles = []
let enemies = []
let particles = []

function init() {
    player = new Player(x, y, 10, 'white');
    projecttiles = []
    enemies = []
    particles = []
    score = score || 0
    scoreEl.innerHTML = score
    bigScoreEl.innerHTML = score
    startGameBtn.innerHTML = "Restart"
}

function spawnEnemies() {
    initEnemey = setInterval(() => {
        const radius = Math.random() * (maxSize - 4) + 4
        let x;
        let y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
            y = Math.random() * canvas.height

        } else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
        }
        const color = `hsl(${Math.random() * 360} , 50% ,50%)`

        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        
        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, enemiesCreationTiming)
}


function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0,0,0,0.1)'
    c.fillRect(0, 0, canvas.width, canvas.height)

    player.draw()

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update();
        }

    })
    projecttiles.forEach((projecttitle, index) => {
        projecttitle.update();

        //remove from edges of screen 
        if (projecttitle.x + projecttitle.radius < 0 ||
            projecttitle.x - projecttitle.radius > canvas.width ||
            projecttitle.y + projecttitle.radius < 0 ||
            projecttitle.y - projecttitle.radius > canvas.height
        ) {
            setTimeout(() => {
                projecttiles.splice(index, 1)
            }, 0)
        }
    })

    enemies.forEach((enemy, index) => {
        enemy.update()

        const dist = Math.hypot(player.x - enemy.x,
            player.y - enemy.y)

        //end game
        // LOST 
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId)
            modelEl.style.display = 'flex'
            clearInterval(initEnemiesLevels)
            clearInterval(initEnemey)
            bigScoreEl.innerHTML = score;
            explosionSound.load()
            updatePlayer(playerId)

        }


        projecttiles.forEach((projecttitle, projecttileIndex) => {
            const dist = Math.hypot(projecttitle.x - enemy.x,
                projecttitle.y - enemy.y)
            //when pojectiles touch enemy
            if (dist - enemy.radius - projecttitle.radius < 1) {


                // create explosions
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projecttitle.x, projecttitle.y, Math.random() * 2, enemy.color,
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 6),
                            y: (Math.random() - 0.5) * (Math.random() * 6)
                        }))
                }
                explosionSound.load()
                if (enemy.radius - 10 > 5) {
                    //increase score
                    score += 100;
                    scoreEl.innerHTML = score;

                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })

                    setTimeout(() => {
                        projecttiles.splice(projecttileIndex, 1)
                    }, 0)

                } else {
                    //remove from scene altogether
                    score += 250;
                    scoreEl.innerHTML = score;
                    setTimeout(() => {
                        enemies.splice(index, 1)
                        projecttiles.splice(projecttileIndex, 1)
                    }, 0)

                }

            }
        })
    });
}

addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - canvas.height / 2,
        event.clientX - canvas.width / 2)
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }

    if (isPause != 1) {
        shootingSound.load();
        projecttiles.push(new Projecttile(
            canvas.width / 2, canvas.height / 2, 10, 'white', velocity
        ))
    }

})

//--------------------------------------------------


newPlayer.addEventListener('click', () => {

    do {
        playerName = prompt("Please enter your name");
    } while (playerName == null || playerName == "")

    hidePlayersBtn();
    startGame();

})

const playerbtn = (ele) => {
    return `<button id="${ele.id}" class="playerBtn bg-blue-500 text-white  py-3 rounded-full text-sm w-50 " onclick="playerIdentifier(${ele.id})">${ele.name}</button>`
}



const playerIdentifier = (id) => {
    playerId = id;
    let element = previousPlayers[id]
    playersList.style.display = "none"
    startGame(element);
    playerName = element.name;
    maxSize = element.maxSize;
    score = element.score;
    scoreEl.innerHTML = score;
    playerName = element.name;

}




oldPlayer.addEventListener('click', () => {

    playersList.style.display = "block";
    hidePlayersBtn();
    previousPlayers.forEach((ele) => {
        
        playersList.innerHTML += playerbtn(ele);

    })


})

let hidePlayersBtn = () => {

    newPlayer.style.display = "none";
    oldPlayer.style.display = "none";
}

let startGame = () => {
    startGameBtn.classList.remove("startDisplay");

}

startGameBtn.addEventListener('click', (e) => {

    if (e.target == startGameBtn) {
        bgST.play()
    }
    maxSize = maxSize || 10;
    levelUp()

    
    scoreDisplay.classList.remove("scoreDisplay");
    avatar.innerHTML = playerName;
    init()
    animate()
    spawnEnemies()
    modelEl.style.display = 'none'


    window.addEventListener('beforeunload', function (e) {
        
        if (playerId !== undefined) {            
            previousPlayers[playerId].score=score;
            previousPlayers[playerId].maxSize=maxSize;
        }
        else {

            playerId=previousPlayers.length;

            let newData =
            {
                "id":playerId,
                "name": playerName,
                "maxSize": maxSize,
                "score": score,


            }
            previousPlayers.push(newData)
        }
        
        localStorage.setItem("gameStorage", JSON.stringify(previousPlayers));


    });

})


let updatePlayer = (id) => {
    previousPlayers[id].maxSize = maxSize;
    previousPlayers[id].score = score;
    localStorage.setItem("gameStorage", JSON.stringify(previousPlayers));

}



//------------------------------------------------------------
window.addEventListener('focus', () => {
    if (isPause != 1) {
        resume()
    }
})
window.addEventListener('blur', () => {
    stopGame()
})

function levelUp() {
    initEnemiesLevels = setInterval(() => {
        maxSize = (maxSize < 100) ? maxSize + 10 : maxSize        
    }, levelTiming)
}

function stopGame() {
    clearInterval(initEnemiesLevels)
    clearInterval(initEnemey)
    focusTimes = 0;    
    cancelAnimationFrame(animationId)
}
function resume() {
    if (focusTimes == 0) {
        spawnEnemies()
        levelUp()
    }
    animate()
    focusTimes = 1;
}
pauseBtn.addEventListener('click', () => {
    stopGame()
    document.getElementById('init').classList.add('hide')
    document.getElementById('continue').classList.remove('hide')
    modelEl.style.removeProperty('display');
    isPause = 1;
})
resumeBtn.addEventListener('click', () => {
    modelEl.style.display = 'none';
    resume()
    document.getElementById('continue').classList.add('hide')
    document.getElementById('init').classList.remove('hide')
    isPause = 0;
})
function sound(src, isauto) {
    this.off = 0;
    this.sound = document.createElement("audio");
    if (isauto) {
        this.sound.setAttribute('autoplay', '')
    };
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function () {        
        this.sound.play();
        this.off = 0;
    }
    this.stop = function () {
        this.sound.pause();
        this.off = 1;
    }
    this.load = function () {
        this.sound.load()
        this.off = 0;
    }
    this.mute = () => {
        this.sound.muted = (this.sound.muted) ? false : true;

    }
}

//---------------------------------------------------------
soundBtn.addEventListener("click", () => {
    shootingSound.mute();
    explosionSound.mute();
    soundBtn.style.opacity = (soundBtn.style.opacity == .5) ? 1 : .5;
})

musicBtn.addEventListener("click", () => {

    bgST.mute();
    musicBtn.style.opacity = (musicBtn.style.opacity == .5) ? 1 : .5;
})


