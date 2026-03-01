import argon2 from "argon2";
import { encrypt } from "../../../core/helpers";

export default class PasswordEntity {
	private _password: string;

	private constructor(password: string) {
		this._password = password;
	}

	static async create(password: string) {
		const hashedPassword = await encrypt(password);
		return new PasswordEntity(hashedPassword);
	}

	static async verify(password: string, hashedPassword: string): Promise<boolean> {
		return await argon2.verify(hashedPassword, password);
	}

	get hashed() {
		return this._password;
	}
}
