var boardLoc = [0,0];
var squareSize;

// dx, dy, startDir, endDir
// Directions are in 16ths of a circle, with "0" meaning +x going clockwise
var baseRailShapes = [
    // Straight
    [ 2,  0,  0,  0],
    [ 0,  2,  4,  4],
    [-2,  0,  8,  8],
    [ 0, -2, 12, 12],

    // Diagonal
    [ 2,  2,  2,  2],
    [-2,  2,  6,  6],
    [-2, -2, 10, 10],
    [ 2, -2, 14, 14],

    // Half diagonal
    [ 4,  2,  1,  1],
    [ 2,  4,  3,  3],
    [-2, -4,  5,  5],
    [-4, -2,  7,  7],
    [-4,  2,  9,  9],
    [-2,  4, 11, 11],
    [ 2, -4, 13, 13],
    [ 4, -2, 15, 15],

    // Curves
    [ 10,   2,  0,  1],
    [ 10,   2,  1,  0],
    [  8,   6,  1,  2],
    [  8,   6,  2,  1],
    [  6,   8,  2,  3],
    [  6,   8,  3,  2],
    [  2,  10,  3,  4],
    [  2,  10,  4,  3],
    [ -2,  10,  4,  5],
    [ -2,  10,  5,  4],
    [ -6,   8,  5,  6],
    [ -6,   8,  6,  5],
    [ -8,   6,  6,  7],
    [ -8,   6,  7,  6],
    [-10,   2,  7,  8],
    [-10,   2,  8,  7],
    [-10,  -2,  8,  9],
    [-10,  -2,  9,  8],
    [ -8,  -6,  9, 10],
    [ -8,  -6, 10,  9],
    [ -6,  -8, 10, 11],
    [ -6,  -8, 11, 10],
    [ -2, -10, 11, 12],
    [ -2, -10, 12, 11],
    [  2, -10, 12, 13],
    [  2, -10, 13, 12],
    [  6,  -8, 13, 14],
    [  6,  -8, 14, 13],
    [  8,  -6, 14, 15],
    [  8,  -6, 15, 14],
    [ 10,  -2, 15,  0],
    [ 10,  -2,  0, 15],

    // Ramp
    [ 16,   3,  0,  0],
    [ 16,  -3,  0,  0],
    [-16,   3,  8,  8],
    [-16,  -3,  8,  8],
    [  0,  13,  4,  4],
    [  0,  19,  4,  4],
    [  0,  13, 12, 12],
    [  0,  19, 12, 12],
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
var curDir = null;
var rails = [];
var drag = false;

var canvas, ctx;
function setup() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();
    squareSize = canvas.width / 48; // TODO: is this a good default scale?
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
        if(squareSize < 2) {
            squareSize = 2;
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
            return 2*Math.round((sX / r.squareSize + boardLoc[0])/2);
        },
        bY: function(sY) {
            sY = height - sY - r.squareSize;
            return Math.round(sY / r.squareSize + boardLoc[1]);
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
        baseRailShapes.forEach(([dX, dY, sD, eD]) => {
            if (bX - oX == dX && bY - oY == dY) {
                hoverRail = [oX, oY, bX, bY];
            }
        });
    }
}

function renderGame() {
    r = getRenderParams();
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, r.width, r.height);
    for(var x = r.minX; x < r.maxX; x++) {
        if (x % 2 == 0) {
            ctx.strokeStyle = 'rgb(230, 230, 230)';
            ctx.beginPath();
            ctx.moveTo(r.sX(x), 0);
            ctx.lineTo(r.sX(x), r.height);
            ctx.stroke();
        }
    }
    for(var y = r.minY; y < r.maxY; y++) {
        if(y % 2 == 0) {
            ctx.strokeStyle = 'rgb(230, 230, 230)';
        } else {
            ctx.strokeStyle = 'rgb(240, 220, 220)';
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
        ctx.fillRect(r.sX(x) - r.squareSize/2, r.sY(y) - r.squareSize/2, r.squareSize, r.squareSize);
    }

    if (hoverRail != null) {
        if ((hoverRail[1] + hoverRail[3]) % 2 != 0) {
            ctx.strokeStyle = 'rgb(100, 0, 0)';
        } else if (hoverRail[1] % 2 != 0) {
            ctx.strokeStyle = 'rgb(200, 0, 0)';
        } else {
            ctx.strokeStyle = 'rgb(0, 0, 0)';
        }
        ctx.beginPath();
        ctx.moveTo(r.sX(hoverRail[0]), r.sY(hoverRail[1]));
        ctx.lineTo(r.sX(hoverRail[2]), r.sY(hoverRail[3]));
        ctx.stroke();
    }

    rails.forEach((rail) => {
        if ((rail[1] + rail[3]) % 2 != 0) {
            ctx.strokeStyle = 'rgb(100, 0, 0)';
        } else if (rail[1] % 2 != 0) {
            ctx.strokeStyle = 'rgb(200, 0, 0)';
        } else {
            ctx.strokeStyle = 'rgb(0, 0, 0)';
        }
        ctx.beginPath();
        ctx.moveTo(r.sX(rail[0]), r.sY(rail[1]));
        ctx.lineTo(r.sX(rail[2]), r.sY(rail[3]));
        ctx.stroke();
    });

    // TODO: draw rails properly
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
