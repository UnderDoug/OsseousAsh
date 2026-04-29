if (!process.env.NODE_ENV) {
    require('dotenv').config();
}

const express = require('express');
const main = express();

main.use(express.json());
main.use(express.raw());
main.use(express.urlencoded({ extended: true }));

// setup sequelize
const sequelize = require('./Common/database');
sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    }).catch(error => {
        console.log('Unable to connect to the database:', error);
    });

// sequelize models
const defineBones = require('./Common/Models/Bones');

const Bones = defineBones(sequelize);

// sync and "on connection" start-up.
const BonesController = require('./Bones/controller');
sequelize.sync()
    .then(async () => {
        await BonesController.tidyBones();
    }).catch(error => {
        console.log('Unable to tidy the bones:', error);
    });;

// register routes
const bonesRoutes = require('./Bones/routes');
const bonesInfoRoutes = require('./BonesInfo/routes');
const bonesSpecRoutes = require('./BonesSpec/routes');

main.use('/', bonesRoutes);
main.use('/', bonesInfoRoutes);
main.use('/', bonesSpecRoutes);

const getRecordCount = async (model) => {
    return (await model.findAll()).length;
}

main.get('/status', async (req, res) => {
    res.json({
        status: 'Running',
        timestamp: new Date().toISOString(),
        records: {
            BonesInfo: await getRecordCount(Bones),
        }
    });
});

const checkWL = require('./Common/Middlewares/IsWhiteListed').check;

main.get('/canUp', checkWL, async (req, res) => {
    res.status(200).json(true);
});

// all routes should be above this one.

main.use((err, req, res, next) => {
    var consoleMsg = err.stack;
    if (err.status != 500
        && err.status != null) {
        consoleMsg = err.message;
    }
    console.error('Error handler:', consoleMsg);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Something went wrong'
    });
    res.send();
});

const PORT = process.env.PORT || 8000;
main.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});