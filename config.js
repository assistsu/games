function getStageConfigs() {
    switch (process.env.NODE_ENV) {
        case "production":
            return {
                MONGO_DB_URL: "mongodb+srv://prod-king:itsprodking@cluster0.gaeyh.mongodb.net",
            };
        default:
            return {
                MONGO_DB_URL: "mongodb+srv://stage-king:itsstageking@cluster0.vf4hl.mongodb.net",
            }
    }
}
module.exports = Object.assign({
    PORT: process.env.PORT || 5000,
    MONGO_DB_NAME: "sangam-games",
    JWT_SECRET_KEY: 'IAMBORNDEVELOPER',
}, getStageConfigs());