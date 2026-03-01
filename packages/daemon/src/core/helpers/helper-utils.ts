import express, { type NextFunction, type Request, type Response } from "express";
import z from "zod";

// ----------------- Context Utilities -----------------
type Extend<TOriginal, TNew> = TOriginal & TNew;
type Join<T extends any[]> = T extends [infer First, ...infer Rest] ? First & Join<Rest> : unknown;

type ExtenderFunction<TIn, TOut> = (ctx: TIn & { req: Request; res: Response }) => TOut;

function extend<const TOriginal, const TNew>(
	original: TOriginal,
	newProps: TNew
): Extend<TOriginal, TNew> {
	return { ...original, ...newProps };
}

function compose<T, const TExtenders extends Array<ExtenderFunction<any, any>>>(
	...extenders: TExtenders
) {
	return (initialContext: T = {} as T) => {
		return extenders.reduce(
			(ctx, extender) => extender(ctx as any),
			initialContext as any
		) as Join<{
			[K in keyof TExtenders]: TExtenders[K] extends ExtenderFunction<any, infer R>
				? R
				: never;
		}>;
	};
}

// ----------------- Middleware -----------------
const withRequestId = <T>(ctx: T & { req: Request; res: Response }) =>
	extend(ctx, { requestId: Math.random().toString(36).substring(2, 15) });

const withLogger = <T>(ctx: T & { req: Request; res: Response; requestId: string }) =>
	extend(ctx, { log: (msg: string) => console.log(`[${ctx.requestId}] ${msg}`) });

const withParsedBody =
	<T, Schema extends z.ZodTypeAny>(schema: Schema) =>
	(ctx: T & { req: Request; res: Response }) => {
		const parsed = schema.safeParse(ctx.req.body);
		if (!parsed.success) {
			ctx.res
				.status(400)
				.json({ error: parsed.error.issues.map((e) => e.message).join(", ") });
			throw new Error("Validation failed");
		}
		return extend(ctx, { parsedBody: parsed.data });
	};

// ----------------- Router Types -----------------
type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

interface RouteDefinition<Ctx = {}> {
	summary?: string;
	description?: string;
	operationId?: string;
	middleware?: Array<ExtenderFunction<Ctx, unknown>>;
	handler: (ctx: Ctx & { req: Request; res: Response }) => Promise<[any, number]>;
	responses: Record<number, { description: string; content: Record<string, z.ZodTypeAny> }>;
}

interface RouterDefinition<Ctx = {}> {
	tags: string[];
	summary?: string;
	middleware?: Array<ExtenderFunction<Ctx, unknown>>;
	routes?: Record<string, Partial<Record<HttpMethod, RouteDefinition<Ctx>>>>;
	nestedRouters?: Record<string, RouterDefinition<any>>;
}

// ----------------- Router Registration -----------------
export function registerRouter<Ctx = {}>(
	routerDef: RouterDefinition<Ctx>,
	expressRouter: express.Router
) {
	const routerMiddleware = routerDef.middleware
		? compose(...routerDef.middleware)
		: (ctx: any) => ctx;

	if (routerDef.routes) {
		for (const path in routerDef.routes) {
			const methods = routerDef.routes[path];
			for (const methodKey in methods) {
				const routeDef = methods[methodKey as HttpMethod];
				if (!routeDef) continue;

				const routeMiddleware = routeDef.middleware
					? compose(...routeDef.middleware)
					: (ctx: any) => ctx;

				const handlerWrapper = async (req: Request, res: Response, next: NextFunction) => {
					try {
						const ctx = routeMiddleware(routerMiddleware({ req, res }));
						const [data, status] = await routeDef.handler({ ...ctx, req, res });
						res.status(status).json(data);
					} catch (err) {
						if (!res.headersSent)
							res.status(500).json({ error: (err as Error).message });
					}
				};

				// @ts-ignore dynamic method call
				expressRouter[methodKey.toLowerCase()](path, handlerWrapper);
			}
		}
	}

	if (routerDef.nestedRouters) {
		for (const nestedPath in routerDef.nestedRouters) {
			const nestedRouterDef = routerDef.nestedRouters[nestedPath];
			if (!nestedRouterDef) continue;

			const nestedExpressRouter = express.Router();
			registerRouter(nestedRouterDef, nestedExpressRouter);
			expressRouter.use(nestedPath, nestedExpressRouter);
		}
	}
}

// ----------------- Example Auth Router -----------------
const registerSchema = z.object({
	username: z.string(),
	email: z.email(),
	password: z.string()
});

const loginSchema = z.object({
	username: z.string(),
	password: z.string()
});

export const exampleAuthRouter: RouterDefinition = {
	tags: ["Authentication"],
	summary: "Collection of routes related to user authentication",
	routes: {
		"/register": {
			post: {
				summary: "Register a new user",
				description: "Create a new account",
				operationId: "registerUser",
				middleware: [withRequestId, withLogger, withParsedBody(registerSchema)],
				responses: {
					201: {
						description: "User registered",
						content: { "application/json": registerSchema }
					},
					400: {
						description: "Bad input",
						content: { "application/json": z.object({ error: z.string() }) }
					}
				},
				handler: async ({ req, res, ctx }) => {
					const { username, email } = ctx.parsedBody;
					ctx.log(`Registering user ${username}`);
					const newUser = { id: `user_${Date.now()}`, username, email };
					return [newUser, 201];
				}
			}
		},
		"/login": {
			post: {
				summary: "Login user",
				operationId: "loginUser",
				middleware: [withRequestId, withLogger, withParsedBody(loginSchema)],
				responses: {
					200: {
						description: "Authenticated",
						content: {
							"application/json": z.object({
								token: z.string(),
								user: registerSchema.pick({
									username: true,
									email: true
								})
							})
						}
					},
					401: {
						description: "Unauthorized",
						content: { "application/json": z.object({ error: z.string() }) }
					}
				},
				handler: async ({ req, res, ctx }) => {
					const { username, password } = ctx.parsedBody;
					ctx.log(`Authenticating user ${username}`);
					if (username === "testuser" && password === "password123") {
						return [
							{
								token: `token_${Date.now()}`,
								user: { id: "user_1", username, email: "@gmail.com" }
							},
							200
						];
					} else {
						return [{ error: "Invalid credentials" }, 401];
					}
				}
			}
		}
	},
	nestedRouters: {
		"/": {
			tags: ["Authentication"],
			summary: "Protected routes",
			middleware: [
				({ req, res }) => {
					const authHeader = req.headers.authorization;
					if (!authHeader || !authHeader.startsWith("Bearer ")) {
						res.status(401).json({ error: "Missing Authorization" });
						throw new Error("Unauthorized");
					}
					const token = authHeader.split(" ")[1];
					if (token !== "valid_token") {
						res.status(401).json({ error: "Invalid token" });
						throw new Error("Unauthorized");
					}
					return {};
				}
			],
			routes: {
				"/@me": {
					get: {
						summary: "Get current user",
						operationId: "getCurrentUserProfile",
						middleware: [withRequestId, withLogger],
						responses: {
							200: {
								description: "User profile",
								content: registerSchema.pick({ username: true, email: true })
							},
							401: {
								description: "Unauthorized",
								content: z.object({ error: z.string() })
							}
						},
						handler: async ({ req, res, ctx }) => {
							ctx.log("Returning current user profile");
							return [
								{ id: "user_1", username: "testuser", email: "@gmail.com" },
								200
							];
						}
					}
				}
			}
		}
	}
};

// ----------------- Mount Example -----------------
const app = express();
app.use(express.json());
const router = express.Router();
registerRouter(exampleAuthRouter, router);
app.use("/auth", router);

app.listen(3000, () => console.log("Server running on :3000"));
