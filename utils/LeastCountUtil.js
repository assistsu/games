function pointMapper(number) {
    switch (number) {
        case 'A':
            return 1;
        case 'K':
        case 'Q':
        case 'J':
            return 10;
        default:
            return parseInt(number);
    }
}

function isAnyoneHasMinimumPoints(pointsObj, currentMinimum) {
    for (let playerId in pointsObj) {
        if (pointsObj[playerId] < currentMinimum) {
            return true;
        }
    }
    return false;
}

module.exports = {
    pointMapper,
    isAnyoneHasMinimumPoints,
}