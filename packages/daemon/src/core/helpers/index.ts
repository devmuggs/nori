import { Enum, type EnumValue } from "@nori/core";
import argon2 from "argon2";

export type HttpMethod = EnumValue<typeof HttpMethod>;
export const [HttpMethod] = Enum({
	Get: "GET",
	Post: "POST",
	Put: "PUT",
	Patch: "PATCH",
	Delete: "DELETE",
	Options: "OPTIONS"
});

export type HttpStatusCode = EnumValue<typeof HttpStatusCode>;
export const [HttpStatusCode, HttpStatusCodeMeta] = Enum({
	Ok: 200,
	Created: 201,
	NoContent: 204,
	BadRequest: 400,
	Unauthorized: 401,
	Forbidden: 403,
	NotFound: 404,
	InternalServerError: 500
});

export type ContentType = EnumValue<typeof ContentType>;
export const [ContentType, ContentTypeMeta] = Enum({
	Json: "application/json",
	Text: "text/plain"
});

// let requestCount = 0;
// const exampleAuthRouter: any = {
// 	tags: ["Authentication"],
// 	summary: "Collection of routes related to user authentication and management.",

// 	routes: {
// 		"/register": {
// 			[HttpMethod.Post]: {
// 				summary: "Register a new user",
// 				description:
// 					"Endpoint for creating a new user account. Expects user details in the request body.",
// 				operationId: "registerUser",

// 				responses: {
// 					[HttpStatusCode.Created]: {
// 						description: "User registered successfully",
// 						content: {
// 							"application/json": z.object({
// 								id: z.string(),
// 								username: z.string(),
// 								email: z.email()
// 							})
// 						}
// 					},
// 					[HttpStatusCode.BadRequest]: {
// 						description: "Invalid input data",
// 						content: {
// 							"application/json": z.object({
// 								error: z.string()
// 							})
// 						}
// 					},
// 					[HttpStatusCode.InternalServerError]: {
// 						description: "Server error",
// 						content: {
// 							"application/json": z.object({
// 								error: z.string()
// 							})
// 						}
// 					}
// 				},

// 				middleware: [
// 					({ ctx, next }) => {
// 						ctx.id = ++requestCount;
// 						return next();
// 					}
// 				],

// 				handler: async ({ req, res, ctx }) => {
// 					const { username, email, password } = req.parsed.body; // already parsed by express.json() and zod validation middleware
// 					console.log(`Handling request #${ctx.id} to register user:`, {
// 						// ctx.id type is inferred from the middleware that adds it, and req.parsed.body is typed from the validation middleware
// 						username,
// 						email
// 					});

// 					// Simulate user registration logic (e.g., save to database)
// 					const newUser = {
// 						id: `user_${Date.now()}`,
// 						username,
// 						email
// 					};

// 					console.log(`User registered successfully for request #${ctx.id}:`, newUser);
// 					return [newUser, HttpStatusCode.Created]; // no ide error because our newUsers object matches the expected response schema for 201 Created
// 				}
// 			}
// 		}
// 	}
// };

export const encrypt = async (password: string) => {
	return argon2.hash(password);
};

import { createId } from "@paralleldrive/cuid2";
export const createCuid2 = () => {
	return createId();
};
