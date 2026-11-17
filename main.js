if (!process.env.NODE_ENV) {
    require('dotenv').config();
}
const { logger } = require('./Common/logger');

const cookieParser = require("cookie-parser");
const session = require("express-session");
const qs = require('qs');
const express = require('express');
const app = express();

app.set('query parser', (str) =>
    qs.parse(str, {
        /* custom options */
    })
);
app.use(express.json({ limit: '64kb' }));
app.use(express.raw({ extended: true, limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

app.use(
    session({
        secret: process.env.JWT_SECRET_KEY || 'none',
        resave: false,
        saveUninitialized: false,
    })
);
app.use(cookieParser());

// setup sequelize
const sequelize = require('./Common/database');
sequelize.authenticate()
    .then(() => {
        logger.info('Connection has been established successfully.');
    }).catch(error => {
        logger.error(`Unable to connect to the database: ${JSON.stringify(error, null, 4)}`);
        throw error;
    });

// sequelize models
const models = require('./Common/models');

require('./Common/relationships');
const queryInterface = sequelize.getQueryInterface();

// sync and "on connection" start-up.
const { NODE_ENV } = process.env;
const BonesController = require('./Bones/controller');
sequelize.sync({ alter: NODE_ENV == 'development'/*, force: true*/ })
    .then(async () => {
        await queryInterface.describeTable('BonesSpec')
            .then(async tableDefinition => {
                console.log(JSON.stringify({ BonesSpec: tableDefinition }, null, 4));
                if (!tableDefinition.BonesSpec_Bones_fkey) {
                    await queryInterface.addConstraint('BonesSpec', {
                        fields: ['ID'],
                        type: 'foreign key',
                        name: 'BonesSpec_Bones_fkey',
                        references: { //Required field
                            table: 'Bones',
                            field: 'ID'
                        },
                        onDelete: 'cascade',
                        onUpdate: 'cascade'
                    });
                }
            }).catch(error => {
                logger.warn(`Unable to add BonesSpec pkey/fkey constraints (inner): ${JSON.stringify(error, null, 4)}`);
            });
    }).catch(error => {
        logger.warn(`Unable to add BonesSpec pkey/fkey constraints: ${JSON.stringify(error, null, 4)}`);
    }).then(async () => {
        await queryInterface.describeTable('BonesStats')
            .then(async tableDefinition => {
                console.log(JSON.stringify({ BonesStats: tableDefinition }, null, 4));
                if (!tableDefinition.BonesStats_Bones_fkey) {
                    await queryInterface.addConstraint('BonesStats', {
                        fields: ['ID'],
                        type: 'foreign key',
                        name: 'BonesStats_Bones_fkey',
                        references: { //Required field
                            table: 'Bones',
                            field: 'ID'
                        },
                        onDelete: 'cascade',
                        onUpdate: 'cascade'
                    });
                }
            }).catch(error => {
                logger.warn(`Unable to add BonesStats pkey/fkey constraints (inner): ${JSON.stringify(error, null, 4)}`);
            });
    }).catch(error => {
        logger.warn(`Unable to add BonesStats pkey/fkey constraints: ${JSON.stringify(error, null, 4)}`);
    }).then(async () => {
        await queryInterface.describeTable('ModConfig')
            .then(async tableDefinition => {
                console.log(JSON.stringify({ ModConfig: tableDefinition }, null, 4));
                if (!tableDefinition.ModConfig_Bones_fkey) {
                    await queryInterface.addConstraint('ModConfig', {
                        fields: ['ID'],
                        type: 'foreign key',
                        name: 'ModConfig_Bones_fkey',
                        references: { //Required field
                            table: 'Bones',
                            field: 'ID'
                        },
                        onDelete: 'cascade',
                        onUpdate: 'cascade'
                    });
                }
            }).catch(error => {
                logger.warn(`Unable to add ModConfig pkey/fkey constraints (inner): ${JSON.stringify(error, null, 4)}`);
            });
    }).catch(error => {
        logger.warn(`Unable to add ModConfig pkey/fkey constraints: ${JSON.stringify(error, null, 4)}`);
    }).then(async () => {
        logger.info('Database & tables syncronized!');
        await BonesController.tidyBones();
    }).catch(error => {
        logger.warn(`Unable to tidy the bones: ${JSON.stringify(error, null, 4)}`);
    }).then(async () => {
        if (NODE_ENV != 'development')
            return;

        logger.info(`await models.User.findOrCreate`);
        const [user, created] = await models.User.unscoped().findOrCreate({
            where: {
                ID: '1c69237f-3387-45ff-a98c-540d255f1ea2',
                Handle: '{{K-g-G-Y-G-g-K alternation|UnderDoug}}',
                Status: 'Active',
                Access: 'Up',
            },
        });
        logger.info(JSON.stringify({ user: user, created: created }, null, 4));

        const [user2, created2] = await models.User.unscoped().findOrCreate({
            where: {
                ID: '4c34d30a-e8b1-495f-8399-c57715ce5a5d',
                Handle: '{{metamorphic|ZokSodVur}}',
                Status: 'Active',
                Access: 'Up',
            },
        });
        logger.info(JSON.stringify({ user2: user2, created2: created2 }, null, 4));
    }).catch(error => {
        logger.warn(`Unable to add test users: ${JSON.stringify(error, null, 4)}`);
    })
    /*.then(async () => {
        logger.info(`await models.User.findOrCreate`);
        const [user,] = await models.User.unscoped().findOrCreate({
            where: {
                ID: '1c69237f-3387-45ff-a98c-540d255f1ea2',
                Handle: '{{K-g-G-Y-G-g-K alternation|UnderDoug}}',
                Status: 'Active',
                Access: 'Up',
            },
        });
        logger.info(JSON.stringify(user, null, 4));

        const [user2,] = await models.User.unscoped().findOrCreate({
            where: {
                ID: '4c34d30a-e8b1-495f-8399-c57715ce5a5d',
                Handle: '{{metamorphic|ZokSodVur}}',
                Status: 'Active',
                Access: 'Up',
            },
        });
        logger.info(JSON.stringify(user2, null, 4));

        logger.info(`models.BonesStats.findOrCreate`);
        var [bonesStats,] = await models.BonesStats.findOrCreate({
            where: {
                ID: '9389b19a-8019-4047-940c-7a71160d892f',
                LastEncountered: 0,
            },
        });
        logger.info(JSON.stringify(bonesStats, null, 4));

        logger.info(`encounteredCategory`);
        const [encounteredCategory,] = await models.StatCategory.findOrCreate({
            where: {
                Name: 'Encountered',
            },
        });
        logger.info(JSON.stringify(encounteredCategory, null, 4));
        logger.info(`defeatedCategory`);
        const [defeatedCategory,] = await models.StatCategory.findOrCreate({
            where: {
                Name: 'Defeated',
            },
        });
        logger.info(JSON.stringify(defeatedCategory, null, 4));
        
        logger.info(`encounteredStats`);
        const [encounteredStats,] = await models.BonesStatsCategory.unscoped().findOrCreate({
            where: {
                BonesStatsID: bonesStats.ID,
                StatCategoryName: encounteredCategory.Name,
            },
        });
        logger.info(JSON.stringify(encounteredStats, null, 4));

        logger.info(`defeatedStats`);
        const [defeatedStats,] = await models.BonesStatsCategory.unscoped().findOrCreate({
            where: {
                BonesStatsID: bonesStats.ID,
                StatCategoryName: defeatedCategory.Name,
            },
        });
        logger.info(JSON.stringify(defeatedStats, null, 4));

        const bonesStatsCategoryEntryAttributes = ['UserID', 'Value'];
        const bonesStatsCategoryEntryInclude = [
            {
                association: models.BonesStatsCategoryEntry.Stat,
                as: 'Stat',
                attributes: ['StatCategoryName'],
                include: [
                    {
                        association: models.BonesStatsCategory.Category,
                        as: 'Category',
                        attributes: ['Name'],
                    },
                ],
            }
        ];

        logger.info(`encounteredEntry`);
        const [encounteredEntry,] = await models.BonesStatsCategoryEntry.findOrCreate({
            where: {
                BonesStatsCategoryID: encounteredStats.ID,
                UserID: user.ID,
                Value: 2,
            },
            attributes: bonesStatsCategoryEntryAttributes,
            include: bonesStatsCategoryEntryInclude,
        });
        logger.info(JSON.stringify(encounteredEntry, null, 4));

        const [encounteredEntry2,] = await models.BonesStatsCategoryEntry.findOrCreate({
            where: {
                BonesStatsCategoryID: encounteredStats.ID,
                UserID: user2.ID,
                Value: 3,
            },
            attributes: bonesStatsCategoryEntryAttributes,
            include: bonesStatsCategoryEntryInclude,
        });
        logger.info(JSON.stringify(encounteredEntry2, null, 4));

        logger.info(`defeatedEntry`);
        const [defeatedEntry,] = await models.BonesStatsCategoryEntry.findOrCreate({
            where: {
                BonesStatsCategoryID: defeatedStats.ID,
                UserID: user.ID,
                Value: 1,
            },
            attributes: bonesStatsCategoryEntryAttributes,
            include: bonesStatsCategoryEntryInclude,
        });
        logger.info(JSON.stringify(defeatedEntry, null, 4));

        const [defeatedEntry2,] = await models.BonesStatsCategoryEntry.findOrCreate({
            where: {
                BonesStatsCategoryID: defeatedStats.ID,
                UserID: user2.ID,
                Value: 2,
            },
            attributes: bonesStatsCategoryEntryAttributes,
            include: bonesStatsCategoryEntryInclude,
        });
        logger.info(JSON.stringify(defeatedEntry2, null, 4));

        const bonesStatsCategoryInclude = [
            {
                association: models.BonesStatsCategory.Entries,
                attributes: bonesStatsCategoryEntryAttributes,
            },
        ];
        const bonesStatsCategoryAttributes = {
            include: ['ID', 'StatCategoryName'],
        }

        logger.info(`encounteredStats.reload`);
        await encounteredStats.reload({
            attributes: bonesStatsCategoryAttributes,
            include: bonesStatsCategoryInclude,
        });
        logger.info(JSON.stringify(encounteredStats, null, 4));

        logger.info(`defeatedStats.reload`);
        await defeatedStats.reload({
            attributes: bonesStatsCategoryAttributes,
            include: bonesStatsCategoryInclude,
        });
        logger.info(JSON.stringify(defeatedStats, null, 4));

        const Stats = {};
        Stats[encounteredStats.StatCategoryName] = encounteredStats.Entries;
        Stats[defeatedStats.StatCategoryName] = defeatedStats.Entries;
        logger.info(JSON.stringify(Stats, null, 4));

        logger.info(`bonesStats.reload`);
        await bonesStats.reload({
            include: [
                {
                    association: 'Stats',
                    attributes: ['StatCategoryName'],
                    include: {
                        association: 'Entries',
                        attributes: ['UserID', 'Value'],
                    },
                },
            ],
        });
        logger.info(JSON.stringify(bonesStats, null, 4));

        logger.info(JSON.stringify({ BonesStats: bonesStats.withStatsDictionary('1c69237f-3387-45ff-a98c-540d255f1ea2') }, null, 4));

    }).catch(err => {
        logger.warn(`Unable to run test stats: ${JSON.stringify(err, null, 4)}`);
    })*/;

// register routes
const userRoutes = require('./User/routes');
const bonesRoutes = require('./Bones/routes');
const reportRoutes = require('./Report/routes');

app.use('/api/v1', userRoutes);
app.use('/api/v1', bonesRoutes);
app.use('/api/v1', reportRoutes);

/*
    Move this elsewhere later.
*/

// Middleware to check if the user is authenticated
const isSessionAuthed = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

// Routes
app.get("/", (req, res) => {
    res.send("Welcome to the Express.js Session and Cookies Example!");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/login.html");
});

app.post("/login", express.urlencoded({ extended: true }), async (req, res) => {
    const { User } = require('./Common/models/User');
    const { UserID, password } = req.body;

    const user = await User.scope(User.forPublicWithPasswordScope).findByPk(UserID);

    if (!user) {
        return logger.caught(res, 204, {
            error: `User not found: ${UserID}`,
        });
    }

    const userPassword = user.passwordValue();
    const matchingNoPassword = !password && !userPassword;

    if (!password && !matchingNoPassword) {
        return logger.caught(res, 400, {
            error: 'Missing Password',
        });
    }

    var isValidPassword = matchingNoPassword;
    if (!isValidPassword) {
        isValidPassword = await bcrypt.compare(password, userPassword);
    }

    if (!isValidPassword) {
        return logger.caught(res, 401, {
            error: 'Invalid credentials',
        });
    }

    var newSession = crypto.randomUUID();

    user.update({
        SessionID: newSession
    });

    await user.save({
        fields: ['SessionID'],
    });

    await user.reload();

    // Check if the provided credentials are valid
    if (user) {
        // Store user data in the session
        req.session.user = user.ID;
        res.cookie("sessionId", req.sessionID);

        res.redirect("/profile");
    } else {
        res.send("Invalid credentials. Please try again.");
    }
});

app.get("/profile", isSessionAuthed, (req, res) => {
    // Retrieve user data from the session
    const username = req.session.user;
    res.send(`Welcome, ${username}!
<a href="/logout">Logout</a>`);
});

app.get("/logout", (req, res) => {
    // Destroy the session and redirect to the login page
    req.session.destroy(() => {
        res.clearCookie("sessionId");
        res.redirect("/login");
    });
});

/*
    End: Move this
*/

const getRecordCount = async (model) => {
    return (await model.findAll()).length;
}

app.get('/api/status', async (req, res) => {
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
app.use((err, req, res, next) => {
    var output = { error: err.message || 'Something went wrong' };
    if (err.status >= 500) {
        output.stack = err.stack;
    }
    logger.caught(res, err.status || 500, output, output.error)
    .send();
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});