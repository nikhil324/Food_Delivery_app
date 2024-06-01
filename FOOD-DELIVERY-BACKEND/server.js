const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const corsOptions = require('./config/corsOptions');
const errorHandler = require('./middleware/errorHandler');
const { connectDb, sessionCollection } = require('./config/db');
const auth = require('./middleware/authentication');
const PORT = process.env.PORT;
const app = express();
app.set("trust proxy", 1);
connectDb();

app.use(cors(corsOptions));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '/images')));


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: sessionCollection(),
    // expires: 20 * 1000,
    // maxAge: 20000,
    cookie: {
      //expires: 20 * 1000,
      maxAge: 20000,
      // sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // must be 'none' to enable cross-site delivery
      // secure: process.env.NODE_ENV === "production", // must be true if sameSite='none'
    }
  })
);


// ======================= Routes
app.use('/products', require('./routes/products'));
app.use('/orders', auth, require('./routes/orders'));
app.use('/carts', require('./routes/carts'));
app.use('/categories', require('./routes/categories'));
app.use('/password', require('./routes/users'));
app.use('/session', require('./routes/users'));

app.use(errorHandler);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));