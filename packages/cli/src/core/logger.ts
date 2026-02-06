import { createConsola, LogLevels, type LogLevel } from "consola";

const logLevelString = process.env.NORI_LOG_LEVEL;
if (logLevelString && !(logLevelString in LogLevels)) {
	throw new Error(
		`Invalid NORI_LOG_LEVEL value: ${logLevelString}. Valid values are: ${Object.keys(
			LogLevels
		).join(", ")}`
	);
}
const logLevel: LogLevel = logLevelString
	? LogLevels[logLevelString as keyof typeof LogLevels]
	: LogLevels.debug;

export const logger = createConsola({
	level: logLevel
});

const logLevelLabels = {
	[LogLevels.trace]: "trace",
	[LogLevels.debug]: "debug",
	[LogLevels.info]: "info",
	[LogLevels.success]: "success",
	[LogLevels.warn]: "warn",
	[LogLevels.error]: "error",
	[LogLevels.fatal]: "fatal"
};

logger.info(`Logger set to '${logLevelLabels[logLevel]}' mode.`);

export const setLogLevel = (level: (typeof LogLevels)[keyof typeof LogLevels]) => {
	logger.level = level;
};

export { LogLevels } from "consola";
export default logger;
