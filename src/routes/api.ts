import {Router} from 'express';
import {app} from '../app';
import moment from 'moment';
//import {IStatResponse} from '../types/api';

export const apiRouter = Router();

apiRouter.get('/stat', async (req, res) => {
    const {duration, ticker, sum} = req.query;
    const from = moment().subtract(duration, 'years').format('YYYY-MM-DD');
    const till = moment().format('YYYY-MM-DD');
    app.getHistory(ticker, {from, till}).then(allHistory => {
        const history = app.pick(allHistory, from);
        const response = {
            allHistory,
            history,
            bought: app.buy(history, parseFloat(sum))
        };
        res.json(response);
    }).catch((err) => {
        res.status(500).send(err);
    })
});