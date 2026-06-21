const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://annadauser:Tushar1015@cluster0.yy2mobr.mongodb.net/annada-pure-veg?retryWrites=true&w=majority')
  .then(async () => {
    const MenuItem = require('./models/MenuItem');
    const items = await MenuItem.find();
    console.log("Count:", items.length);
    console.log("Sample:", JSON.stringify(items.slice(0, 2), null, 2));
    process.exit(0);
  });
