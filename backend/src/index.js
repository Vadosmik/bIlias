import express, {} from 'express';
import 'dotenv/config';
const app = express();
const port = Number(process.env.PORT);
app.use(express.json());
app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'OK' });
});
app.get('/', (_req, res) => {
    res.status(200).json({ success: true, message: 'Aplikacja dziala' });
});
app.use((err, _req, res, _next) => {
    res.status(500).json({
        success: false,
        error: 'Błąd serwera',
    });
});
app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
});
export { app };
//# sourceMappingURL=index.js.map