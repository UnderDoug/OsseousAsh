if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const { logger } = require('./Common/logger');

const express = require('express');
const main = express();

main.use(express.json({ limit: '8kb' }));
main.use(express.raw({ extended: true, limit: '4mb' }));
main.use(express.urlencoded({ extended: true, limit: '4mb' }));

// setup sequelize
const sequelize = require('./Common/database');
sequelize.authenticate()
    .then(() => {
        logger.info('Connection has been established successfully.');
    }).catch(error => {
        logger.error('Unable to connect to the database:', error);
        throw error;
    });

// sequelize models
const models = require('./Common/models');

require('./Common/relationships');

// sync and "on connection" start-up.
const { NODE_ENV } = process.env;
const BonesController = require('./Bones/controller');
sequelize.sync({ alter: NODE_ENV == 'development' })
    .then(async () => {
        logger.info('Database & tables syncronized!');
        await BonesController.tidyBones();
    }).catch(error => {
        logger.warn('Unable to tidy the bones:', error);
    });;

// register routes
const userRoutes = require('./User/routes');
const bonesRoutes = require('./Bones/routes');
const bonesInfoRoutes = require('./BonesInfo/routes');
const bonesSpecRoutes = require('./BonesSpec/routes');
const reportRoutes = require('./Report/routes');
/*const Routes = {
    User: require('./User/routes'),
    Bones: require('./Bones/routes'),
    BonesInfo: require('./BonesInfo/routes'),
    BonesSpec: require('./BonesSpec/routes'),
    Report: require('./Report/routes'),
}*/

main.use('/api/', userRoutes);
main.use('/api/', bonesRoutes);
main.use('/api/', bonesInfoRoutes);
main.use('/api/', bonesSpecRoutes);
main.use('/api/', reportRoutes);
/*main.use('/', Routes.User);
main.use('/', Routes.Bones);
main.use('/', Routes.BonesInfo);
main.use('/', Routes.BonesSpec);
main.use('/', Routes.Report);*/

const getRecordCount = async (model) => {
    return (await model.findAll()).length;
}

main.get('/api/status', async (req, res) => {
    res.status(200).json({
        status: 'Running',
        timestamp: new Date().toISOString(),
        version: 1,
        records: {
            Users: await getRecordCount(models.User),
            Bones: await getRecordCount(models.Bones),
            Reports: await getRecordCount(models.Report),
        }
    });
});

// all routes should be above this one.
main.use((err, req, res, next) => {
    var output = { error: err.message || 'Something went wrong' };
    if (err.status >= 500) {
        output.stack = err.stack;
    }
    logger.caught(res, err.status || 500, output, output.error)
    .send();
});

const PORT = process.env.PORT || 8000;
main.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});