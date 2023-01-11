require('dotenv').config()

const { MongoClient, ServerApiVersion, Collection, ObjectId } = require('mongodb');
const uri = `mongodb+srv://root:${process.env.DB_KEY}@node-class.z1egu8r.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(async (err) => {
  if (err) {
    console.log(err)
    return
  }
  console.log('db is OK')
  // client.close();
})

const express = require('express')
const app = express()
const cros = require('cors')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const { promistfy } = require('util')
const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.KEY,
  secret: process.env.SECRET,
  cluster: process.env.CLUSTER,
  useTLS: process.env.USE_TLS
});

// let mockMsg = { message: "hello world" }

let mockMsg = 'hey'
// 發送訊息給訂閱者
pusher.trigger("my-channel", "my-event", mockMsg);

app.set('view engine', 'ejs')
app.set('view options', './views')
app.use(cros())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Hey CrypTalk API running 🥳')
})

app.get('/MsgHistory', async (req, res) => {
  let collection = client.db("cryptalk").collection("messages")
  await collection.find().toArray()
    .then(result => {
      res.json(result)
    }).catch(err => {
      console.log(err)
    })
})

app.post('/snedMsg', async (req, res) => {
  // 存資料庫.....
  const { textMsg, user } = req.body
  let collection = client.db("cryptalk").collection("messages")
  const result = await collection.insertOne({
    username: user,
    msg: textMsg,
    time: new Date().valueOf(),
    mail: "aki@mail.com",
    iconPath: "https://uxwing.com/wp-content/themes/uxwing/download/hand-gestures/good-icon.png",
    roomId: "finance001",
  })

  // 假設存好了....
  if (result) {
    // 透過 Pusher 及時渲染於客端
    const mockObj = req.body
    pusher.trigger("my-channel", "msgUpdate", mockObj)

    // https 回應
    res.header("Content-Type", "application/json; charset=utf-8") // utf-8
    res.end(JSON.stringify({ msg: `${user}的訊息: ${textMsg}送出!` }))
  }
})

app.listen(process.env.PORT || 1688, (err) => {
  if (err) {
    console.log("Error in server setup")
  }
  console.log(`Listening on ${process.env.PORT || 1688}`)
})

module.exports = app