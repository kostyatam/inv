import * as express from 'express';
import * as path from 'path';

const app = express();
const PORT = 4040;

app.use(express.static('dist/public'));
app.set('views', 'dist/views');
app.set('view engine', 'pug');

app.get('/', (req, res) => {
    res.render('index', { title: 'Hello there!', message: 'BACKEND BUILDING WORKS!'});
});

app.listen(PORT, () => {
    console.log('server started at http://localhost:' + PORT);
});