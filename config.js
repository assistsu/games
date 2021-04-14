module.exports = {
    PORT: process.env.PORT || 5000,
    mongodb: {
        url: 'mongodb+srv://prod-king:itsprodking@cluster0.gaeyh.mongodb.net',
        dbName: 'sangam-games',
    },
    JWT_SECRET_KEY: 'IAMBORNDEVELOPER',
}