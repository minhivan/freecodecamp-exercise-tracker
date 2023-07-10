const express = require('express')
const app = express()
const cors = require('cors')
var bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()


console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI);

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true
  }
}, { versionKey: false });

const exerciseSchema = mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  userId: String
})

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Excercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  const users = await User.find();

  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const username = req.body.username;

  const findUser = await User.findOne({ username });
  if (findUser) {
    res.json(findUser);
  }

  const user = await User.create({
    username
  });

  res.json(user);
});


app.get('/api/users/:_id/logs', async (req, res) => {
  let {
    from,
    to,
    limit
  } = req.query;
  const userId = req.params['_id'];
  const findUser = await User.findById(userId);
  if (!findUser) {
    res.json({
      message: 'No user exists'
    });
  }

  let filter = { userId };
  let dateFilter = {};

  if (from) {
    dateFilter['$gte'] = new Date(from)
  }
  if (to) {
    dateFilter['$lte'] = new Date(to)
  }
  if (!limit) {
    limit = 100
  }

  if (from || to) {
    filter['date'] = dateFilter
  }

  let exercies = await Exercise.find(filter).limit(limit)
  exercies = exercies.map((item) => {
    return {
      description: item.description,
      duration: item.duration,
      date: item.date.toDateString()
    }
  });

  res.json({
    username: findUser.username,
    count: exercies.length,
    _id: userId,
    log: exercies
  })
});


app.post('/api/users/:_id/exercises', async (req, res) => {
  let {
    description,
    duration,
    date
  } = req.body;

  const userId = req.params['_id'];
  const findUser = await User.findById(userId);
  if (!findUser) {
    res.json({
      message: 'No user exists'
    });
  }

  if (!date) {
    date = new Date().toISOString().substring(0, 10);
  }

  await Exercise.create({
    username: findUser.username,
    description,
    duration,
    date,
    userId: userId
  });

  res.send({
    username: findUser.username,
    description,
    duration: Number(duration),
    date: new Date(date).toDateString(),
    _id: userId,
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
