import z from "zod";
import NoriSdk from "./index";

namespace Authentication {
	export namespace Schemas {
		export const password = z.string().min(8, "Password must be at least 8 characters long.");

		export type UserJson = z.infer<typeof userJson>;
		export const userJson = z.object({
			id: z.string(), //cuid2
			email: z.email(),
			displayName: z.string().optional(),
			createdAt: z.iso.datetime(),
			avatar: z.any().optional()
		});

		export type UserJsonListItem = z.infer<typeof userJsonListItemSchema>;
		export const userJsonListItemSchema = z.object({
			id: z.string(),
			email: z.email(),
			displayName: z.string().optional(),
			createdAt: z.iso.datetime()
		});

		export type UserLoginData = z.infer<typeof userLogin>;
		export const userLogin = userJson
			.pick({
				email: true
			})
			.extend({
				password: password
			});

		export type UserCreate = z.infer<typeof userCreate>;
		export const userCreate = userLogin.extend({
			displayName: userJson.shape.displayName
		});

		export type UserUpdateData = z.infer<typeof userUpdate>;
		export const userUpdate = userCreate.partial().pick({
			email: true,
			displayName: true
		});

		export type JsonErrorResponse = z.infer<typeof jsonErrorResponse>;
		export const jsonErrorResponse = z.object({
			message: z.string()
		});
	}

	export const create = (sdk: NoriSdk) => {
		return {
			register: (data: Schemas.UserCreate) =>
				sdk.post<Schemas.UserJson | Schemas.JsonErrorResponse>(
					"/auth/register",
					Schemas.userCreate.parse(data)
				),
			update: (data: Schemas.UserUpdateData) =>
				sdk.post<Schemas.UserJson | Schemas.JsonErrorResponse>(
					"/auth/update",
					Schemas.userUpdate.parse(data)
				),
			login: (data: Schemas.UserLoginData) =>
				sdk.post<Schemas.UserJson | Schemas.JsonErrorResponse>(
					"/auth/login",
					Schemas.userLogin.parse(data)
				),
			logout: () => sdk.post<void | Schemas.JsonErrorResponse>("/auth/logout"),
			deleteCurrentUser: () => sdk.delete<void | Schemas.JsonErrorResponse>("/auth/delete"),
			fetchCurrentUser: () =>
				sdk.get<Schemas.UserJson | Schemas.JsonErrorResponse>("/auth/me")
		};
	};
}

export default Authentication;
