var boardLoc = [0,0];
var squareSize;

// dx, dy, startDir, endDir, cpdx, cpdy
// Directions are in 16ths of a circle, with "0" meaning +x going clockwise
var baseRailShapes = [
    // Straight
    [ 2,  0,  0,  0,  1,  0],
    [ 0,  2,  4,  4,  0,  1],
    [-2,  0,  8,  8, -1,  0],
    [ 0, -2, 12, 12,  0, -1],

    // Diagonal
    [ 2,  2,  2,  2,  0,  0],
    [-2,  2,  6,  6, -0,  0],
    [-2, -2, 10, 10, -0, -0],
    [ 2, -2, 14, 14,  0, -0],

    // Half diagonal
    [ 4,  2,  1,  1,  2,  1],
    [ 2,  4,  3,  3,  1,  2],
    [-2,  4,  5,  5, -1,  2],
    [-4,  2,  7,  7, -2,  1],
    [-4, -2,  9,  9, -2, -1],
    [-2, -4, 11, 11, -1, -2],
    [ 2, -4, 13, 13,  1, -2],
    [ 4, -2, 15, 15,  2, -1],

    // Curves
    [ 5,  1,  0,  1,  3,  0],
    [ 5,  1,  1,  0,  2,  1],
    [ 4,  3,  1,  2,  2,  1],
    [ 4,  3,  2,  1,  2,  2],
    [ 3,  4,  2,  3,  2,  2],
    [ 3,  4,  3,  2,  1,  2],
    [ 1,  5,  3,  4,  1,  2],
    [ 1,  5,  4,  3,  0,  3],
    [-1,  5,  4,  5,  0,  3],
    [-1,  5,  5,  4, -1,  2],
    [-3,  4,  5,  6, -1,  2],
    [-3,  4,  6,  5, -2,  2],
    [-4,  3,  6,  7, -2,  2],
    [-4,  3,  7,  6, -2,  1],
    [-5,  1,  7,  8, -2,  1],
    [-5,  1,  8,  7, -3,  0],
    [-5, -1,  8,  9, -3,  0],
    [-5, -1,  9,  8, -2, -1],
    [-4, -3,  9, 10, -2, -1],
    [-4, -3, 10,  9, -2, -2],
    [-3, -4, 10, 11, -2, -2],
    [-3, -4, 11, 10, -1, -2],
    [-1, -5, 11, 12, -1, -2],
    [-1, -5, 12, 11,  0, -3],
    [ 1, -5, 12, 13,  0, -3],
    [ 1, -5, 13, 12,  1, -2],
    [ 3, -4, 13, 14,  1, -2],
    [ 3, -4, 14, 13,  2, -2],
    [ 4, -3, 14, 15,  2, -2],
    [ 4, -3, 15, 14,  2, -1],
    [ 5, -1, 15,  0,  2, -1],
    [ 5, -1,  0, 15,  3,  0],

    // Ramp
    // TODO: control points make no sense
    [ 16,   3,  0,  0,  7,  1],
    [ 16,  -3,  0,  0,  7, -1],
    [-16,   3,  8,  8, -7,  1],
    [-16,  -3,  8,  8, -7, -1],
    [  0,  13,  4,  4,  0,  1],
    [  0,  19,  4,  4,  0,  1],
    [  0, -13, 12, 12,  0, -1],
    [  0, -19, 12, 12,  0, -1],
];

// TODO: generate data table with for loops
// for (int el = 0; el <= 1; el++) {
//     for (int )
// }

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
            return Math.round(sX / r.squareSize + boardLoc[0]);
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
            i = rails.findIndex((r) => r.every((e,i) => e == hoverRail[i]));
            if (i == -1) {
                rails.push(hoverRail);
            } else {
                rails.splice(i,1);
            }
            curDir = hoverRail[7]
            selectedSquare = [hoverRail[4], hoverRail[5]];
            hoverRail = null;
        } else {
            selectedSquare = null;
            hoverRail = null;
            curDir = null;
        }
    } else {
        selectedSquare = [bX, bY];
    }
}

function handleHover(bX, bY) {
    if (selectedSquare != null) {
        [oX, oY] = selectedSquare;
        baseRailShapes.forEach(([dX, dY, sD, eD, cX, cY]) => {
            if (bX - oX == dX && bY - oY == dY && (oX+cX)%2 == 0 && (curDir == null || sD == curDir)) {
                hoverRail = [oX, oY, oX+cX, oY+cY, bX, bY, sD, eD];
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
        } else {
            ctx.strokeStyle = 'rgb(245, 245, 245)';
        }
        ctx.beginPath();
        ctx.moveTo(r.sX(x), 0);
        ctx.lineTo(r.sX(x), r.height);
        ctx.stroke();
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

    rails.forEach((rail) => {
        if (rail[3] % 2 != 0) {
            ctx.strokeStyle = 'rgb(200, 0, 0)';
        } else {
            ctx.strokeStyle = 'rgb(0, 0, 0)';
        }
        ctx.beginPath();
        ctx.moveTo(r.sX(rail[0]), r.sY(rail[1]));
        ctx.quadraticCurveTo(r.sX(rail[2]), r.sY(rail[3]), r.sX(rail[4]), r.sY(rail[5]))
        ctx.stroke();
    });

    if (hoverRail != null) {
        if (hoverRail[3] % 2 != 0) {
            ctx.strokeStyle = 'rgb(200, 0, 200)';
        } else {
            ctx.strokeStyle = 'rgb(0, 200, 200)';
        }
        ctx.beginPath();
        ctx.moveTo(r.sX(hoverRail[0]), r.sY(hoverRail[1]));
        ctx.quadraticCurveTo(r.sX(hoverRail[2]), r.sY(hoverRail[3]), r.sX(hoverRail[4]), r.sY(hoverRail[5]))
        ctx.stroke();
    }

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
