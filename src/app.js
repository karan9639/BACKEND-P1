import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json({ limit: '16kb' }));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Middleware to parse cookies
app.use(cookieParser());

// // CORS configuration and it is a middleware
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true,
// }));


// routes import
import userRoutes from './routes/user.routes.js';

// routes
app.use('/api/v1/users', userRoutes);

export { app }; 
