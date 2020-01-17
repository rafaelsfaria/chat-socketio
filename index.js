const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')

mongoose.Promise = global.Promise
const mongo = 'mongodb://localhost/socketio-chat'

const app = express()

const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.use(session({
  secret: 'socketio',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 60 * 10 * 1000
  }
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.get('/', (req, res) => res.render('home'))
app.post('/', (req, res) => {
  req.session.user = {
    name: req.body.name
  }
  res.redirect('/room')
})

app.get('/room', (req, res) => {
  if (!req.session.user) {
    res.redirect('/')
  } else {
    res.render('room', { name: req.session.user.name })
  }
})

mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(port, () => console.log('listening on', port))
  })
  .catch(e => {
    console.log(e)
  })