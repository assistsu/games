exports.randomNumber = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

exports.serverError = function (req, res, err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', errCode: 'SERVER_ERROR' });
}