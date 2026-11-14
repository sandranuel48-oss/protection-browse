// src/core/logger.js

const fs = require('fs');
const path = require('path');

let logFilePath = 'protection-browse.log';

module.exports = {
    init(filename = 'protection-browse.log') {
        const logsDir = path.join(__dirname, '../dist');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        logFilePath = path.join(logsDir, filename);
        this.info('Logger initialized.');
    },

    info(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[INFO] [${timestamp}] ${message}`;
        console.log(logMessage);
        this._write(logMessage);
    },

    error(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[ERROR] [${timestamp}] ${message}`;
        console.error(logMessage);
        this._write(logMessage);
    },

    _write(message) {
        try {
            fs.appendFileSync(logFilePath, message + '\n');
        } catch (err) {
            console.error('Failed to write to log file:', err);
        }
    }
};
