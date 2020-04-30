module.exports = {
    apps: [{
        name: "games-server",
        script: "./server.js",
        env: {
            NODE_ENV: "prod",
        },
        time: true
    }]
}