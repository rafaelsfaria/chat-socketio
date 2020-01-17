const express = require('express')
const mongoose = require('mongoose')

mongoose.Promise = global.Promise
const mongo = 'mongodb://localhost/socketio-chat'

const app = express()

const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => res.render('home'))

mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(port, () => console.log('listening on', port))
  })
  .catch(e => {
    console.log(e)
  })