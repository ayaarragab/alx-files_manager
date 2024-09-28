import express from 'express';
import router from './routes/index.js';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

app.use('/', router);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
