const mongoose = require('mongoose');

const items = [
  // MORNING BOOSTER
  { name: 'Poha', category: 'Morning Booster', price: 20, isVeg: true, isAvailable: true, isTodaySpecial: true },
  { name: 'Tarri Poha', category: 'Morning Booster', price: 25, isVeg: true, isAvailable: true },
  { name: 'Upma', category: 'Morning Booster', price: 25, isVeg: true, isAvailable: true },
  { name: 'Idli Chutney', category: 'Morning Booster', price: 30, isVeg: true, isAvailable: true },
  { name: 'Idli Sambar', category: 'Morning Booster', price: 30, isVeg: true, isAvailable: true, isTodaySpecial: true },
  { name: 'Medu Vada Chutney', category: 'Morning Booster', price: 30, isVeg: true, isAvailable: true },
  { name: 'Medu Vada Sambar', category: 'Morning Booster', price: 30, isVeg: true, isAvailable: true },
  { name: 'Set Dosa', category: 'Morning Booster', price: 40, isVeg: true, isAvailable: true },
  { name: 'Masala Dosa', category: 'Morning Booster', price: 45, isVeg: true, isAvailable: true },
  { name: 'Cut Dosa', category: 'Morning Booster', price: 50, isVeg: true, isAvailable: true, isTodaySpecial: true },
  { name: 'Mysore Dosa', category: 'Morning Booster', price: 50, isVeg: true, isAvailable: true },
  { name: 'Cheese Dosa', category: 'Morning Booster', price: 70, isVeg: true, isAvailable: true },

  // HEALTHY TUMMY
  { name: 'Balanced Diet Meal', category: 'Healthy Tummy', price: 80, isVeg: true, isAvailable: true },
  { name: 'Mini Diet Meal', category: 'Healthy Tummy', price: 70, isVeg: true, isAvailable: true },
  { name: 'Roti Bhaji', category: 'Healthy Tummy', price: 50, isVeg: true, isAvailable: true },
  { name: 'Dal Rice', category: 'Healthy Tummy', price: 70, isVeg: true, isAvailable: true },
  { name: 'Only Roti', category: 'Healthy Tummy', price: 12, isVeg: true, isAvailable: true },
  { name: 'Unlimited Thali', category: 'Healthy Tummy', price: 120, isVeg: true, isAvailable: true },
  { name: 'Customised Meal', category: 'Healthy Tummy', price: 130, isVeg: true, isAvailable: true },
  { name: 'Thali Pith', category: 'Healthy Tummy', price: 70, isVeg: true, isAvailable: true },
  { name: 'Kothimbir Wadi', category: 'Healthy Tummy', price: 50, isVeg: true, isAvailable: true },
  { name: 'Pav Bhaji', category: 'Healthy Tummy', price: 70, isVeg: true, isAvailable: true },
  { name: 'Extra Pav', category: 'Healthy Tummy', price: 15, isVeg: true, isAvailable: true },
  { name: 'Cheese Pav Bhaji', category: 'Healthy Tummy', price: 90, isVeg: true, isAvailable: true },
  { name: 'Misal Pav', category: 'Healthy Tummy', price: 70, isVeg: true, isAvailable: true },

  // YUMMY BITES
  { name: 'Veg Grilled Cheese Sandwich', category: 'Yummy Bites', price: 60, isVeg: true, isAvailable: true },
  { name: 'Paneer Cheese Sandwich', category: 'Yummy Bites', price: 80, isVeg: true, isAvailable: true },
  { name: 'Chocolate Sandwich', category: 'Yummy Bites', price: 80, isVeg: true, isAvailable: true },
  { name: 'Bombay Grilled Sandwich', category: 'Yummy Bites', price: 80, isVeg: true, isAvailable: true },

  // WRAP
  { name: 'Mexican Wrap', category: 'Wrap', price: 100, isVeg: true, isAvailable: true },
  { name: 'Paneer Wrap', category: 'Wrap', price: 80, isVeg: true, isAvailable: true },
  { name: 'Corn Cheese Wrap', category: 'Wrap', price: 80, isVeg: true, isAvailable: true },
  { name: 'Tikki Wrap', category: 'Wrap', price: 90, isVeg: true, isAvailable: true },

  // PIZZA
  { name: 'Plain Pizza', category: 'Pizza', price: 60, isVeg: true, isAvailable: true },
  { name: 'Mix Veg Pizza', category: 'Pizza', price: 90, isVeg: true, isAvailable: true },
  { name: 'Paneer Tandoori Pizza', category: 'Pizza', price: 110, isVeg: true, isAvailable: true, isTodaySpecial: true },
  { name: 'Mushroom Pizza', category: 'Pizza', price: 120, isVeg: true, isAvailable: true },
  { name: 'Spl. Overload Pizza', category: 'Pizza', price: 130, isVeg: true, isAvailable: true },

  // MAGGI
  { name: 'Masala Maggi', category: 'Maggi', price: 40, isVeg: true, isAvailable: true },
  { name: 'Gardan Masala Maggi', category: 'Maggi', price: 50, isVeg: true, isAvailable: true },
  { name: 'Corn Cheese Maggi', category: 'Maggi', price: 70, isVeg: true, isAvailable: true },

  // HOMEPAGE HERO HIGHLIGHTS
  { name: 'Medu Vada', category: 'Morning Booster', price: 30, isVeg: true, isAvailable: true },
  { name: 'Aloo Paratha', category: 'Morning Booster', price: 70, isVeg: true, isAvailable: true },
  { name: 'Masala Chai', category: 'Others', price: 20, isVeg: true, isAvailable: true },
  { name: 'Tiffin Thali', category: 'Healthy Tummy', price: 120, isVeg: true, isAvailable: true },
];

mongoose.connect('mongodb+srv://annadauser:Tushar1015@cluster0.yy2mobr.mongodb.net/annada-pure-veg?retryWrites=true&w=majority')
  .then(async () => {
    console.log('Connected to MongoDB');
    const MenuItem = require('./models/MenuItem');
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items.');
    await MenuItem.insertMany(items);
    console.log('Successfully inserted new menu items!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
    process.exit(1);
  });
