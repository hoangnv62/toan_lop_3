import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { env } from './src/config/env.js';
import { errorHandler } from './src/middleware/error-handler.middleware.js';
import { camelCaseResponse } from './src/middleware/camelcase-response.middleware.js';

import authRouter from './src/routes/auth.route.js';
import announcementRouter from './src/routes/announcement.route.js';
import classRouter from './src/routes/class.route.js';
import dashboardRouter from './src/routes/dashboard.route.js';
import examRouter from './src/routes/exam.route.js';
import lessonRouter from './src/routes/lesson.route.js';
import questionRouter from './src/routes/question.route.js';
import questionBankRouter from './src/routes/question-bank.route.js';
import relativeRouter from './src/routes/relative.route.js';
import studentRouter from './src/routes/student.route.js';
import chatRouter from './src/routes/chat.route.js';

const app = express();

const staticOrigins = [
  'http://localhost:5500', 'http://127.0.0.1:5500',
  'http://localhost:8080', 'http://127.0.0.1:8080',
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'https://toan-lop-3-8e8h.vercel.app',
  ...env.ALLOWED_ORIGINS,
];

// Vercel sinh một URL riêng cho mỗi lần deploy: <project>-<hash>-<scope>.vercel.app,
// nên cho phép mọi subdomain của project frontend thay vì liệt kê từng URL.
const vercelPreviewPattern = /^https:\/\/toan-lop-3-8e8h[\w-]*\.vercel\.app$/;

app.use(cors({
  origin(origin, callback) {
    // Không có Origin: request từ curl, mobile app hoặc server-to-server
    if (!origin) return callback(null, true);
    if (staticOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(camelCaseResponse);

app.use('/api/auth', authRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/classes', classRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/exams', examRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/questions', questionRouter);
app.use('/api/question-bank', questionBankRouter);
app.use('/api', relativeRouter);
app.use('/api/students', studentRouter);
app.use('/api/chat', chatRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server is running at http://localhost:${env.PORT}`);
});
