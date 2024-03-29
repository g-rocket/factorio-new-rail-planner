var boardLoc = [0,0];
var squareSize;

// dx, dy, startDir, endDir, cpdx, cpdy, length
// Directions are in 16ths of a circle, with "0" meaning +x going clockwise
var baseRailShapes = [
    // Straight
    [ 2,  0,  0,  0,  1,  0, 2.00],
    [ 0,  2,  4,  4, -0,  1, 2.00],

    // Diagonal
    [ 2,  2,  2,  2,  0,  0, 2.83],
    [-2,  2,  6,  6, -0,  0, 2.83],

    // Half diagonal
    [ 4,  2,  1,  1,  2,  1, 4.48],
    [ 2,  4,  3,  3,  1,  2, 4.48],
    [-2,  4,  5,  5, -1,  2, 4.48],
    [-4,  2,  7,  7, -2,  1, 4.48],

    // Curves
    [ 5,  1,  0,  1,  3,  0, 5.14],
    [ 5,  1,  1,  0,  2,  1, 5.14],
    [ 4,  3,  1,  2,  2,  1, 5.08],
    [ 4,  3,  2,  1,  2,  2, 5.08],
    [ 3,  4,  2,  3,  2,  2, 5.08],
    [ 3,  4,  3,  2,  1,  2, 5.08],
    [ 1,  5,  3,  4,  1,  2, 5.14],
    [ 1,  5,  4,  3,  0,  3, 5.14],
    [-1,  5,  4,  5,  0,  3, 5.14],
    [-1,  5,  5,  4, -1,  2, 5.14],
    [-3,  4,  5,  6, -1,  2, 5.08],
    [-3,  4,  6,  5, -2,  2, 5.08],
    [-4,  3,  6,  7, -2,  2, 5.08],
    [-4,  3,  7,  6, -2,  1, 5.08],
    [-5,  1,  7,  8, -2,  1, 5.14],
    [-5,  1,  8,  7, -3,  0, 5.14],

    // Ramp
    // TODO: control points make no sense
    // Ramp lengths don't make much sense either, but don't matter much
    [ 16,   3,  0,  0,  7,   1, 2],
    [ 16,  -3,  0,  0,  9,  -2, 2],
    [  0,  13,  4,  4,  0,   1, 2],
    [  0,  19,  4,  4,  0,   2, 2],
];

rampBoxes = [
    [19, -2, 16, 4,16],
    [13, -2, 13, 4,16],
    [ 3,  0,  2,16, 4],
    [-3,  0, -1,16, 4],
];

function max(a, b) {
    return a > b? a: b;
}

function mod(a, b) {
    return (a + b) % b;
}

function isEven(a) {
    return mod(a, 2) == 0;
}

function isOdd(a) {
    return mod(a, 2) != 0;
}

function normalizeRail(rail) {
    if (!isSupport(rail) && (rail[6] + rail[7] > 15 || max(rail[6], rail[7]) > 8)) {
        return [
            rail[4], rail[5],
            rail[2], rail[3],
            rail[0], rail[1],
            (rail[7] + 8) % 16,
            (rail[6] + 8) % 16,
            rail[8], rail[9],
        ];
    } else {
        return rail;
    }
}

function reverseRailShape(rail) {
    return [
        -rail[0], -rail[1],
        (rail[3] + 8) % 16,
        (rail[2] + 8) % 16,
        rail[4]-rail[0], rail[5]-rail[1],
        rail[6],
    ];
}

function isRamp(rail) {
    return rail[6] == rail[7] && isOdd(rail[5] - rail[1]);
}

function isSupport(rail) {
    return rail[8] == 0;
}

function isElevated(rail) {
    return isOdd(rail[3]) && !isSupport(rail) && !isRamp(rail);
}

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

// [x, y]
var selectedSquare = null;

// Rail, same format as an element from rails below
var hoverRail = null;

// 0-15, increasing CCW from +x
var curDir = null;

// [[oX, oY, cX, cY, eX, eY, oD, eD]]
// o -> origin, c -> control point, e -> end, D = direction
var rails = [];


var drag = false;

// 'rails' / 'supports'
var mode = 'rails';

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
    });
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
    });
    document.addEventListener('keyup', function(e) {
        switch(e.key) {
            case "Escape":
                selectedSquare = null;
                hoverRail = null;
                curDir = null;
                mode = 'rails';
                break;
            case "ArrowUp":
            case "w":
                // TODO: hover a straight rail
                break;
            case "ArrowLeft":
            case "a":
                // TODO: hover a left-turn rail
                break;
            case "ArrowRight":
            case "d":
                // TODO: hover a right-turn rail
                break;
            case "Tab":
            case "q":
                // TODO: hover a ramp
                break;
            case "ArrowDown":
                // What do I want to do here?
                break;
            case " ":
                // TODO: accept the current hovered rail
                break;
            case "s":
                selectedSquare = null;
                hoverRail = null;
                curDir = null;
                mode = 'supports';
                break;
            default:
                return;
        }
        renderGame();
    });
    codearea = document.getElementById('codearea');
    codearea.addEventListener('keyup', loadCodeString);
    loadCodeString();
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
    if (hoverRail != null) {
        hoverRailN = normalizeRail(hoverRail)
        i = rails.findIndex((r) => r.slice(0,7).every((e,i) => e == hoverRailN[i]));
        if (i == -1) {
            rails.push(hoverRailN);
        } else {
            rails.splice(i,1);
        }
        if (isElevated(hoverRailN) || isSupport(hoverRailN) || isRamp(hoverRailN)) {
            recalcSupport();
        }
        if (mode == 'rails') {
            curDir = hoverRail[7]
            selectedSquare = [hoverRail[4], hoverRail[5]];
        } else if (mode == 'supports') {
            curDir = null;
            selectedSquare = null;
            mode = 'rails';
        }
        hoverRail = null;
        document.getElementById("codearea").value = JSON.stringify(rails);
    } else if (selectedSquare != null) {
        selectedSquare = null;
        hoverRail = null;
        curDir = null;
    } else {
        selectedSquare = [bX, bY];
    }
    console.log(JSON.stringify(rails))
}

function handleHover(bX, bY) {
    if (mode == 'supports') {
        i = rails.findIndex((r) => {
            if (isElevated(r)) {
                if (r[0] == bX && r[1] == bY) return true;
                if (r[4] == bX && r[5] == bY) return true;
                return false;
            }
        });
        if (i != -1) {
            let dir;
            if (bX == rails[i][0] && bY == rails[i][1]) {
                dir = rails[i][6];
            } else {
                dir = rails[i][7];
            }
            hoverRail = [bX, bY, bX, bY - mod(bY,2), bX, bY-3, dir%8, dir%8 + 8, 0, 0];
        }
    } else if (selectedSquare != null) {
        [oX, oY] = selectedSquare;
        baseRailShapes.forEach(baseRail => {
            [baseRail, reverseRailShape(baseRail)].forEach(([dX, dY, sD, eD, cX, cY, l]) => {
                if (bX - oX == dX && bY - oY == dY && isEven(oX+cX) && (curDir == null || sD == curDir)) {
                    maybeHoverRail = [oX, oY, oX+cX, oY+cY, bX, bY, sD, eD, l, 0];
                    if (!isRamp(maybeHoverRail) || isOdd(maybeHoverRail[3])) {
                        hoverRail = maybeHoverRail;
                    }
                }
            });
        });
    }
}

// Elevated rails have 3 extra params that are used for calculating support
function recalcSupport() {
    rails.forEach((r) => {
        if (isElevated(r)) {
            r[9] = 0;
        }
    });

    rails.forEach((r) => {
        if (isSupport(r)) {
            // Supports support for 11 units in both directions
            addSupport(r[0], r[1], r[6], 11);
            addSupport(r[0], r[1], r[7], 11);
        } else if (isRamp(r)) {
            // Technically we should only do this at the top,
            // but the bottom of a ramp can't connect to an elevated rail
            // so it shouldn't matter :)
            addSupport(r[0], r[1], (r[6]+8)%16, 9);
            addSupport(r[4], r[5], r[7], 9);
        }
    })
}

function addSupport(x, y, dir, lengthRemaining) {
    findElevatedNeighbors(x, y, dir, (r, isStart) => {
        if (lengthRemaining > r[8]) {
            r[9] = 1;
            if (isStart) {
                addSupport(r[4], r[5], r[7], lengthRemaining - r[8]);
            } else {
                addSupport(r[0], r[1], (r[6]+8)%16, lengthRemaining - r[8]);
            }
        }
    });
}

function findElevatedNeighbors(x, y, dir, callback) {
    rails.forEach((r) => {
        if (isElevated(r)) {
            if (r[0] == x && r[1] == y && r[6] == dir) {
                callback(r, true);
            } else if (r[4] == x && r[5] == y && r[7] == (dir+8)%16) {
                callback(r, false);
            }
        }
    });
}

function renderGame() {
    r = getRenderParams();
    drawBackground(r);
    drawSelectedSquare(r);
    rails.forEach((rail) => drawRail(r, rail, false));
    if (hoverRail != null) {
        drawRail(r, normalizeRail(hoverRail), true);
    }
}

function drawBackground(r) {
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, r.width, r.height);
    for(var x = r.minX; x < r.maxX; x++) {
        if (isEven(x)) {
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
        if(isEven(y)) {
            ctx.strokeStyle = 'rgb(230, 230, 230)';
        } else {
            ctx.strokeStyle = 'rgb(240, 220, 220)';
        }
        ctx.beginPath();
        ctx.moveTo(0, r.sY(y));
        ctx.lineTo(r.width, r.sY(y));
        ctx.stroke();
    }
}

function drawSelectedSquare(r) {
    // TODO: probably delete this; just for testing
    if (selectedSquare != null) {
        var [x, y] = selectedSquare;
        ctx.fillStyle = 'rgb(100, 200, 100)'
        ctx.fillRect(r.sX(x) - r.squareSize/2, r.sY(y) - r.squareSize/2, r.squareSize, r.squareSize);
    }
}


function drawRail(r, rail, isHoverRail) {
    if (!isHoverRail && isElevated(rail) && rail[9] == 0) {
        ctx.strokeStyle = 'rgb(0, 0, 200)';
        ctx.setLineDash([5,5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r.sX(rail[0]), r.sY(rail[1]));
        ctx.quadraticCurveTo(r.sX(rail[2]), r.sY(rail[3]), r.sX(rail[4]), r.sY(rail[5]))
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
    }

    if (isHoverRail) {
        if (isOdd(rail[3])) {
            ctx.strokeStyle = 'rgb(200, 0, 200)';
        } else {
            ctx.strokeStyle = 'rgb(0, 200, 200)';
        }
    } else {
        if (isRamp(rail)) {
            ctx.strokeStyle = 'rgb(100, 0, 0)';
        } else if (isOdd(rail[3])) {
            ctx.strokeStyle = 'rgb(200, 0, 0)';
        } else {
            ctx.strokeStyle = 'rgb(0, 0, 0)';
        }
    }
    ctx.beginPath();
    ctx.moveTo(r.sX(rail[0]), r.sY(rail[1]));
    ctx.quadraticCurveTo(r.sX(rail[2]), r.sY(rail[3]), r.sX(rail[4]), r.sY(rail[5]))
    ctx.stroke();

    if (isRamp(rail)) {
        // Ramp
        rampBoxes.forEach((shape) => {
            if (rail[5] - rail[1] == shape[0]) {
                if (isHoverRail) {
                    ctx.fillStyle = 'rgba(100,100,0,0.3)'
                } else {
                    ctx.fillStyle = 'rgba(0,0,0,0.3)'
                }
                ctx.fillRect(r.sX(rail[0] + shape[1]), r.sY(rail[1] + shape[2]), shape[3]*r.squareSize, shape[4]*r.squareSize);
            }
        });
    } else if (isSupport(rail)) {
        if (isHoverRail) {
            ctx.fillStyle = 'rgba(100,100,0,0.3)'
        } else {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'
        }
        if (rail[6] % 4 == 0) {
            ctx.fillRect(r.sX(rail[0] - 2), r.sY(rail[1] - 1), 4*r.squareSize, 4*r.squareSize);
        } else {
            ctx.fillRect(r.sX(rail[0] - 1), r.sY(rail[1] - 1), 2*r.squareSize, 1*r.squareSize);
            ctx.fillRect(r.sX(rail[0] - 2), r.sY(rail[1] - 2), 4*r.squareSize, 2*r.squareSize);
            ctx.fillRect(r.sX(rail[0] - 1), r.sY(rail[1] - 4), 2*r.squareSize, 1*r.squareSize);
        }
    }
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


function loadCodeString() {
    let railsObj;
    try {
        railsObj = JSON.parse(document.getElementById('codearea').value);
    } catch(e) {
        console.error('Error loading codestring: ' + e);
        return;
    }
    rails = railsObj;
    renderGame();
}