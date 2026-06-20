const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://annadauser:Tushar1015@cluster0.yy2mobr.mongodb.net/annada-pure-veg?retryWrites=true&w=majority')
  .then(async () => {
    const User = require('./models/User');
    const users = await User.find().sort({createdAt: -1}).limit(2);
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  });
