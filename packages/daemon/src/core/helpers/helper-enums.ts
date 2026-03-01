import { type EnumValue, Enum } from "@nori/core";

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
