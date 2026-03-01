import { Prisma } from "../../../../generated/prisma/client";
import { createCuid2 } from "../../../core/helpers";

export default class UserEntity {
	id: string;
	email: string;
	displayName?: string;
	createdAt: Date;

	constructor(user: { id: string; email: string; displayName?: string; createdAt?: Date }) {
		this.id = user.id;
		this.email = user.email;
		this.displayName = user.displayName;
		this.createdAt = user.createdAt || new Date();
	}

	static create(params: { email: string; displayName?: string }) {
		const id = createCuid2();

		return new UserEntity({
			id,
			email: params.email,
			displayName: params.displayName,
			createdAt: new Date()
		});
	}

	fromDb(user: Prisma.UserRevisionGetPayload<{ include: { user: true } }>) {
		return new UserEntity({
			id: user.user.id,
			email: user.email,
			displayName: user.displayName || undefined,
			createdAt: user.user.createdAt
		});
	}

	toJSON() {
		return {
			id: this.id,
			email: this.email,
			displayName: this.displayName,
			createdAt: this.createdAt
		};
	}

	toJsonListItem() {
		return {
			id: this.id,
			email: this.email,
			displayName: this.displayName,
			createdAt: this.createdAt
		};
	}
}
