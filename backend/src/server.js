import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import routes from './routes/routes.js';
import path from 'path';

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

app.use("/uploads", express.static(path.resolve("uploads")));

app.use('/api', routes);

app.use((e, req, res, next) => {
    console.error(e);

    res.status(e.status || 500).json({
        message: e.message || 'Server error'
    });
});

const port = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    connectDB()
        .then(() => {
            app.listen(port, () => {
                console.log(`Lumina API running on ${port}`);
            });
        })
        .catch(console.error);
}

export default app;