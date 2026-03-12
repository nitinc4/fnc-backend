import express, * as bodyParser from 'express';
import path from 'path';
import {authenticateRequest} from './api/middlewares/auth.middleware.js';
import authRouter from './api/routes/auth.route.js';
import userRouter from './api/routes/user.route.js';
import overviewRouter from './api/routes/overview.route.js';
import healthRouter from './api/routes/health_issue.route.js';
import profileRouter from './api/routes/profile.route.js';
import nutrientRouter from './api/routes/nutrient.route.js';
import mealRouter from './api/routes/meal.route.js';
import foodRoute from "./api/routes/food.route.js";
import dietPlanRoute from "./api/routes/diet_plan.route.js";
import dailyDietRoute from "./api/routes/daily_diet.route.js";
import dailyWeightRoute from "./api/routes/daily_weight.route.js";
import planRoute from "./api/routes/plan.route.js";
import settingRoute from "./api/routes/setting.route.js";
import fileRoute from "./api/routes/file.route.js";

import webRouter from './web/web.js';
import multer from "multer";
import storage from "./utils/file_upload.js";
import cookieParser from "cookie-parser";
import cors from 'cors'

const app = express();

app.use(cors());

//set static folder
app.use('/public', express.static(path.join(path.resolve(), 'public')));


// set the view engine to ejs
app.set('view engine', 'ejs');


// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Use cookie parser middleware
app.use(cookieParser());

const api = "/api/v1"


// Initialize multer with the defined storage configuration
const upload = multer({storage: storage});

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({extended: true}));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());


// web Routes
app.use('/', webRouter)


// APIs Routes

app.use(`${api}/auth`, authRouter);

app.use(`${api}/user`, authenticateRequest, userRouter);

app.use(`${api}/overview`, authenticateRequest, overviewRouter);

app.use(`${api}/health`, authenticateRequest, healthRouter);

app.use(`${api}/profile`, authenticateRequest, profileRouter);

app.use(`${api}/nutrient`, authenticateRequest, nutrientRouter);

app.use(`${api}/meal`, authenticateRequest, mealRouter);

app.use(`${api}/food`, authenticateRequest, foodRoute);

app.use(`${api}/diet_plan`, authenticateRequest, dietPlanRoute);

app.use(`${api}/daily_diet`, authenticateRequest, dailyDietRoute);

app.use(`${api}/daily_weight`, authenticateRequest, dailyWeightRoute);

app.use(`${api}/plan`, authenticateRequest, planRoute);

app.use(`${api}/setting`, authenticateRequest, settingRoute);

app.use(`${api}/file`, authenticateRequest, fileRoute);


export default app;