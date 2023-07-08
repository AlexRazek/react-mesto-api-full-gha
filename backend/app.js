require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { errors } = require('celebrate');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createUser, login } = require('./controllers/users');
const { SigninValidationJoi, SignupValidationJoi } = require('./middlewares/auth-validation');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const auth = require('./middlewares/auth');
const NotFoundError = require('./utils/errors/not-found-error');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const { PORT = 4000, MONGO_URI = 'mongodb://localhost:27017' } = process.env;

app.use(cookieParser());

const routerUser = require('./routes/users');
const routerCard = require('./routes/cards');
const errorHandler = require('./middlewares/error-handler');

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(apiLimiter);

// mongoose.connect('mongodb://localhost:27017/mestodb', {
//   useNewUrlParser: true,
// });

// MongoDB URL в .env
mongoose.connect(`${MONGO_URI}/mestodb`, {
  useNewUrlParser: true,
});

app.use(requestLogger); // подключаем логгер запросов

app.post('/signup', SignupValidationJoi, createUser);
app.post('/signin', SigninValidationJoi, login);

app.use('/users', auth, routerUser);
app.use('/cards', auth, routerCard);
app.all('*', (req, res, next) => {
  next(new NotFoundError('Путь не существует'));
});

app.use(errorLogger); // подключаем логгер ошибок

app.use(errors());
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log('server is running on port 4000');
});
