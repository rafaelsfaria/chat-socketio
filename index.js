const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const sharedSession = require('express-socket.io-session')

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const Room = require('./models/room')
const Message = require('./models/message')

mongoose.Promise = global.Promise
const mongo = 'mongodb://localhost/socketio-chat'
const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
const expressSession = session({
  secret: 'socketio',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 60 * 10 * 1000
  }
})
app.use(expressSession)
io.use(sharedSession(expressSession, { autoSave: true }))
io.use((socket, next) => {
  const session = socket.handshake.session
  if (!session.user) {
    next(new Error('Auth failed'))
  } else {
    next()
  }
})

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

io.on('connection', socket => {
  Room.find({}, (err, rooms) => {
    socket.emit('roomList', rooms)
  })
  socket.on('addRoom', roomName => {
    const room = new Room({
      name: roomName
    })
    room
      .save()
      .then(() => io.emit('newRoom', room))
  })
  socket.on('join', roomId => {
    socket.join(roomId)
    Message
      .find({ room: roomId })
      .then((msgs) => {
        socket.emit('msgsList', msgs)
      })
  })
  socket.on('sendMsg', async msg => {
    const message = new Message({
      author: socket.handshake.session.user.name,
      when: Date.now(),
      msgType: 'text',
      message: msg.msg,
      room: msg.room
    })
    message
      .save()
      .then(() => {
        io.to(msg.room).emit('newMsg', message)
      })
  })
  socket.on('sendAudio', async msg => {
    const message = new Message({
      author: socket.handshake.session.user.name,
      when: Date.now(),
      msgType: 'audio',
      message: msg.data,
      room: msg.room
    })
    message
      .save()
      .then(() => {
        io.to(msg.room).emit('newAudio', message)
      })
  })
})

mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    http.listen(port, () => console.log('listening on', port))
  })
  .catch(e => {
    console.log(e)
  })