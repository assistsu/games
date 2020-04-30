module.exports = {
    apps: [{
        name: "games-server",
        script: "./server.js",
        env_production: {
            NODE_ENV: "prod",
        },
        error_file: './logs/error.log',
        time: true
    }]
}