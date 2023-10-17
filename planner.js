var boardLoc = [0,0];
var squareSize;

var baseRailShapes = [
    // Straight
    [0, 2],
    [2, 0],

    // Diagonal
    [2,  2],
    [2, -2],
    [2,  4],
    [2, -4],
    [4,  2],
    [4, -2],

    // Curves
    [2,  10],
    [2, -10],
    [10,  2],
    [10, -2],
    [6,  8],
    [6, -8],
    [8,  6],
    [8, -6],

    // Ramp
    [16,  3],
    [16, -3],
    [0,  13],
    [0,  19],
];

// TODO: SVG for rails
var railPaths = {
    'pawn': 'M20 80 A35 35 0 1 1 80 80 Z M20 90 H80',
    'rook': 'M20 80 V20 H80 V80 Z M20 90 H80',
    'chancelor': 'M20 80 V55 H45 V80 Z M55 80 V55 H80 V80 Z M20 45 V20 H45 V45 Z M55 45 V20 H80 V45 Z M20 90 H80',
    'bishop': 'M20 80 L50 20 L80 80 Z M20 90 H80',
    'knight': 'M55 80 V55 H80 V80 Z M20 45 V20 H45 V45 Z M55 45 V20 H80 V45 Z M55 90 H80',
    'hawk': 'M40 80 L50 20 L60 80 Z M40 90 H60',
    'guard': 'M20 80 A35 35 0 1 1 80 80 Z M30 70 L50 35 L70 70 Z M20 90 H80',
    'king': 'M20 80 A35 35 0 0 1 10 55 H45 V80 Z M10 45 A35 35 0 0 1 45 10 V45 Z M90 45 A35 35 0 0 0 55 10 V45 Z M80 80 A35 35 0 0 0 90 55 H55 V80 Z M20 90 H80',
    'huygens': 'M20 80 L30 55 H45 V80 Z M55 80 V55 H70 L80 80 Z M35 45 L45 20 V45 Z M55 45 V20 L65 45 Z M20 90 H80',
    'queen': 'M20 80 V20 H80 V80 Z L50 30 L80 80 M20 90 H80',
}

var selectedSquare = null;
var hoverRail = null;
var rails = [];
var drag = false;

var canvas, ctx;
function setup() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();
    squareSize = canvas.width / 24; // TODO: is this a good deafult scale?
    canvas.addEventListener('click', function(e) {
        if (drag) return;
        var r = getRenderParams();
        var bX = r.bX(e.offsetX);
        var bY = r.bY(e.offsetY);
        handleClick(bX, bY);
        renderGame();
    });
    canvas.addEventListener('mousemove', function(e) {
        drag = true;
        var r = getRenderParams();
        if(e.buttons & 1) {
            boardLoc[0] -= e.movementX / r.squareSize;
            boardLoc[1] += e.movementY / r.squareSize;
        } else {
            var bX = r.bX(e.offsetX);
            var bY = r.bY(e.offsetY);
            handleHover(bX, bY);
        }
        renderGame();
    });
    canvas.addEventListener('mousedown', function(e) {
        drag = false;
    })
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        var oldSize = squareSize;
        squareSize *= Math.pow(.999, e.deltaY);
        if(squareSize < 4) {
            squareSize = 4;
        }
        boardLoc[0] -= (e.offsetX / squareSize) - (e.offsetX / oldSize);
        var oy = canvas.height - e.offsetY;
        boardLoc[1] -= (oy / squareSize) - (oy / oldSize);
        renderGame();
    })
}

function getRenderParams() {
    var width = canvas.width;
    var height = canvas.height;
    var squaresWide = width / squareSize;
    var squaresHigh = height / squareSize;
    return {
        width: width,
        height: height,
        squareSize: squareSize,
        squaresWide: squaresWide,
        squaresHigh: squaresHigh,
        minX: Math.floor(boardLoc[0]),
        minY: Math.floor(boardLoc[1]),
        maxX: Math.ceil(boardLoc[0] + squaresWide),
        maxY: Math.ceil(boardLoc[1] + squaresHigh),
        sX: function(bX) {
            return (bX - boardLoc[0]) * squareSize;
        },
        sY: function(bY) {
            var y = (bY - boardLoc[1]) * squareSize;
            return height - y - squareSize;
        },
        bX: function(sX) {
            return 2*Math.round(sX / (2*r.squareSize) + boardLoc[0]);
        },
        bY: function(sY) {
            sY = height - sY - r.squareSize;
            return Math.round(sY / r.squareSize + boardLoc[1] + 1);
        }
    }
}

function handleClick(bX, bY) {
    if (selectedSquare != null) {
        if (hoverRail != null) {
            rails.push(hoverRail);
        }
        selectedSquare = null;
        hoverRail = null;
    } else {
        selectedSquare = [bX, bY];
    }
}

function handleHover(bX, bY) {
    if (selectedSquare != null) {
        [oX, oY] = selectedSquare;
        // TODO: broken
        if (baseRailShapes.includes([bX - oX, bY - oY])) {
            hoverRail = [oX, oY, bX, bY];
        }
    }
}

function renderGame() {
    r = getRenderParams();
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, r.width, r.height);
    for(var x = r.minX; x < r.maxX; x+=2) {
        ctx.strokeStyle = 'rgb(200, 200, 200)';
        ctx.beginPath();
        ctx.moveTo(r.sX(x), 0);
        ctx.lineTo(r.sX(x), r.height);
        ctx.stroke();
    }
    for(var y = r.minY; y < r.maxY; y++) {
        if(y % 2) {
            ctx.strokeStyle = 'rgb(200, 200, 200)';
        } else {
            ctx.strokeStyle = 'rgb(200, 150, 150)';
        }
        ctx.beginPath();
        ctx.moveTo(0, r.sY(y));
        ctx.lineTo(r.width, r.sY(y));
        ctx.stroke();
    }

    // TODO: probably delete this; just for testing
    if (selectedSquare != null) {
        var [x, y] = selectedSquare;
        ctx.fillStyle = 'rgb(100, 200, 100)'
        ctx.fillRect(r.sX(x-0.5), r.sY(y-0.5), r.squareSize, r.squareSize);
    }

    if (hoverRail != null) {
        if (hoverRail[0] % 2) {
            ctx.strokeStyle = 'rgb(0, 0, 0)';
        } else {
            ctx.strokeStyle = 'rgb(100, 0, 0)';
        }
        ctx.beginPath();
        ctx.moveTo(r.sX(hoverRail[0]), r.sY(hoverRail[1]));
        ctx.lineTo(r.sX(hoverRail[2]), r.sY(hoverRail[3]));
        ctx.stroke();
    }

    // TODO: draw rails
    // for(var player in pieces) {
    //     for(var pieceName in pieces[player]) {
    //         for(var piece of pieces[player][pieceName]) {
    //             if(player == 'white') {
    //                 ctx.fillStyle = 'rgb(255, 255, 255)'
    //             } else {
    //                 ctx.fillStyle = 'rgb(255, 0, 0)'
    //             }
    //             ctx.strokeStyle = 'rgb(0, 0, 0)'
    //             var piecePath = new Path2D(piecePaths[pieceName])
    //             ctx.save();
    //             ctx.transform(r.squareSize/100, 0, 0, r.squareSize/100, r.sX(piece[0]), r.sY(piece[1]));
    //             ctx.fill(piecePath);
    //             ctx.stroke(piecePath);
    //             ctx.restore();
    //         }
    //     }
    // }
}
