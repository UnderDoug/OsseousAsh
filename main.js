const express = require('express');
const main = express();
main.use(express.json());
main.use(express.urlencoded({ extended: true }));

// setup sequelize
const sequelize = require('./Common/database');

const defineBonesInfo = require('./Common/Models/BonesInfo');
//const defineBonesSpec = require('./Common/Models/BonesSpec');

const BonesInfo = defineBonesInfo(sequelize);
//const BonesSpec = defineBonesSpec(sequelize);
sequelize.sync();

// register routes
const bonesInfoRoutes = require('./BonesInfo/routes');

main.use('/', bonesInfoRoutes);

main.get('/status', (req, res) => {
    res.json({
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 8000;
main.listen(PORT, () => console.log(`Server running on port ${PORT}`));
