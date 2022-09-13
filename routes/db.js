const dotenv = require("dotenv").config();

const MongoClient = require("mongodb").MongoClient;

let db = null;
MongoClient.connect(process.env.MONGO_URL, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.log(err);
  }
  db = client.db("crudapp");
});

module.exports = db;
// 복잡한것을 이곳으로 따로빼놓고 index.js가서require해서연결하면 사용가능
// const db = require("./routes/db"); 경로까지.
