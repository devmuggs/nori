type Extend<TOriginal, TNew> = TOriginal & TNew;
type Join<T extends any[]> = T extends [infer First, ...infer Rest] ? First & Join<Rest> : unknown;

type ExtenderFunction<TIn, TOut> = (ctx: TIn) => TOut;
function extend<const TOriginal, const TNew>(
	original: TOriginal,
	newProps: TNew
): Extend<TOriginal, TNew> {
	return { ...original, ...newProps };
}

// Compose multiple middleware functions
function compose<T, const TExtenders extends Array<ExtenderFunction<any, any>>>(
	...extenders: TExtenders
) {
	return (initialContext: T = {} as T) => {
		return extenders.reduce((ctx, extender) => extender(ctx), initialContext) as Join<{
			[K in keyof TExtenders]: TExtenders[K] extends ExtenderFunction<any, infer R>
				? R
				: never;
		}>;
	};
}

// Middleware builders
const withRequestId = <T>(ctx: T) =>
	extend(ctx, { requestId: Math.random().toString(36).substring(2, 15) });

const withLogger = <T>(ctx: T) =>
	extend(ctx, {
		log: (message: string) => console.log(`[LOG]: ${message}`)
	});

const withTimestamp = <T>(ctx: T) => extend(ctx, { timestamp: Date.now() });

// Usage examples:

// 1. Compose with multiple middleware in single function call
const context = compose(withRequestId, withLogger, withTimestamp)();
console.log(context.requestId, context.timestamp);
console.log(context.requestId); // <- no errors, full intellisense, outputs requestId
context.log("This is a log message."); // <- no errors, full intellisense

// 2. Compose in multiple steps
const start = {};
const startWithRequestId = withRequestId(start);
const startWithLogger = withLogger(startWithRequestId);
const finalContext = withTimestamp(startWithLogger);

console.log(finalContext.requestId, finalContext.timestamp);
finalContext.log("This is another log message."); // <- no errors, full intellisense
