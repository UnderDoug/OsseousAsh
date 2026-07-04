const winston = require('winston');

module.exports.logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(), // Add timestamp
        winston.format.json() // Format logs as JSON
    ),
    transports: [
        new winston.transports.File({ filename: 'winston-combined.log' }),
        new winston.transports.File({ filename: 'winston-errors.log', level: 'error' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(), // Colorize console output
            winston.format.simple() // Simple format: `timestamp [level]: message`
        ),
    }));
}

this.logger.caught = (res, status, output, resBody) => {
    if (status != 500) {
        this.logger.warn(output);
    }
    else {
        this.logger.error(output);
    }
    return res.status(status).json(resBody || output);
};