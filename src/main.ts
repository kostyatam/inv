import {range} from 'lodash';
import express from 'express';
import {apiRouter} from './routes';
import {app} from './app';
import moment from 'moment';

const server = express();
const PORT = 4040;

server.use(express.static('dist/public'));
server.set('views', 'dist/views');
server.set('view engine', 'pug');

server.get('/', async (req, res) => {
    try {
        const shares = await app.getShares();
        const index = Math.round(Math.random() * (shares.length - 1));
        const share = shares[index];
        const borders = await app.getBorders(share.ticker);
        const years = moment(moment()).diff(borders.from, 'years');
        res.render('index', {
            sum: 10000,
            years: range(1, years),
            ticker: share.ticker
        });
    } catch (err) {
        console.log(err)
    }
});

server.use('/api', apiRouter)

app.init().then(() => {
    server.listen(PORT, () => {
        console.log('server started at http://localhost:' + PORT);
    });
}).catch(err => console.log(err))