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

const defineBonesInfo = require('./Common/Models/BonesInfo');
const defineBonesSpec = require('./Common/Models/BonesSpec');

const BonesInfo = defineBonesInfo(sequelize);
const BonesSpec = defineBonesSpec(sequelize);
sequelize.sync()
    .then(async () => {
        await BonesRecordController.tidyBones();
    }).catch(error => {
        console.log('Unable to tidy the bones:', error);
    });;

// register routes
const bonesInfoRoutes = require('./BonesInfo/routes');
const bonesSpecRoutes = require('./BonesSpec/routes');
const bonesRoutes = require('./BonesRecord/routes');

main.use('/', bonesInfoRoutes);
main.use('/', bonesSpecRoutes);
main.use('/', bonesRoutes);

main.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong'
    });
});

main.get('/status', (req, res) => {
    res.json({
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

const BonesRecordController = require('./BonesRecord/controller');

const PORT = process.env.PORT || 8000;
main.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
});
