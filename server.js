const mongodb = require('./model/mongodb');
const Config = require('./config');
const app=require('./app');

mongodb.connect().then(() => {
  app.listen(Config.PORT, function (err) {
    if (err) throw err;
    console.log(`App runs on http://localhost:${Config.PORT}`);
  })
});