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

    const user = await User.scope('includePassword').findByPk(UserID);

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