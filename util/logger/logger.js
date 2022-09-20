 /**
 * Configurations of logger.
 */
const winston = require('winston')
const { combine, timestamp, json } = winston.format

// config function for prettyPrint format
const logStackAndOmitIt = winston.format((info, opts) => {
    if (info.stack){
        console.error(info.stack);
        return _.omit(info, 'stack');
    }
    return info;
});


const translationErrorLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'error',
    format: combine(timestamp(), winston.format.combine(
        logStackAndOmitIt(),
        winston.format.prettyPrint(),
    )),
    transports: [
      new winston.transports.File({
        filename: './util/logger/logs/translation/error-logfile.log',
      }),
    ],
  })

const translationInfoLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), winston.format.combine(
        logStackAndOmitIt(),
        winston.format.prettyPrint(),
    )),
    transports: [
        new winston.transports.File({
        filename: './util/logger/logs/translation/info-logfile.log',
        }),
    ],
})

const conversionErrorLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'error',
    format: combine(timestamp(), winston.format.combine(
        logStackAndOmitIt(),
        winston.format.prettyPrint(),
    )),
    transports: [
        new winston.transports.File({
        filename: './util/logger/logs/conversion/error-process-logfile.log',
        }),
    ],
})

module.exports = {
    'translationInfoLogger': translationInfoLogger,
    'translationErrorLogger': translationErrorLogger,
    'conversionErrorLogger': conversionErrorLogger
}