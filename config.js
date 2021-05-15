function getStageConfigs() {
    switch (process.env.NODE_ENV) {
        case "production":
            return {
                MONGO_DB_URL: "mongodb+srv://prod-king:itsprodking@cluster0.gaeyh.mongodb.net",
                UI_ALLOW_ORIGIN: "https://assistsu-games.herokuapp.com",
            };
        default:
            return {
                MONGO_DB_URL: "mongodb://localhost:27017",
                UI_ALLOW_ORIGIN: "http://localhost:8000"
            }
    }
}
module.exports = Object.assign({
    PORT: process.env.PORT || 5000,
    MONGO_DB_NAME: "sangam-games",
    JWT_SECRET_KEY: 'IAMBORNDEVELOPER',
}, getStageConfigs());