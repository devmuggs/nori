import { createConsola, LogLevels } from "consola";
export const logger = createConsola({
	level: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL, 10) : LogLevels.debug
});

export const setLogLevel = (level: typeof LogLevels[keyof typeof LogLevels]) => {
	logger.level = level;
};
export { LogLevels } from "consola";
export default logger;
