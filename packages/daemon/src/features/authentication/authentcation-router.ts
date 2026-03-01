import express, { Request, Response, Router } from "express";
import prisma from "../../core/prisma/index.js";

import { Authentication } from "@nori/core";

import { logger } from "../../daemon.js";
import { PasswordEntity, UserEntity } from "./entities/index.js";
import UserRepository from "./repositories/user-repository.js";

const authRouter = Router();

const appendAuthCookie = (res: Response, token: string) => {
	res.cookie("auth_token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
	});
};

export const sessions = new Map<string, UserEntity>(); // In-memory session store (token -> userId)

authRouter.post("/register", async (req: Request, res: Response) => {
	const { email, password, displayName } = Authentication.Schemas.userCreate.parse(req.body);

	const userEntity = UserEntity.create({ email, displayName });
	const passwordEntity = await PasswordEntity.create(password);

	const user = await prisma.$transaction(async (prisma) => {
		const repo = new UserRepository(prisma);
		const user = await repo.create({ user: userEntity, password: passwordEntity });
		return user;
	});

	appendAuthCookie(res, userEntity.id);
	sessions.set(userEntity.id, userEntity);

	const json: Authentication.Schemas.UserJson = {
		id: user.id,
		email: user.email,
		displayName: user.displayName || undefined,
		createdAt: user.createdAt.toISOString()
	};
	res.status(201).json(json);
});

authRouter.post("/update", async (req: Request, res: Response) => {
	const token = req.cookies["auth_token"];
	const user = sessions.get(token);

	if (!user) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const { email, displayName } = Authentication.Schemas.userUpdate.parse(req.body);
	if (!email && !displayName) {
		return res
			.status(400)
			.json({ message: "At least one of email or displayName must be provided" });
	}

	const updatedUser = await prisma.$transaction(async (prisma) => {
		const repo = new UserRepository(prisma);
		logger.debug(`Updating user ${user.id} with email: ${email}, displayName: ${displayName}`);
		return await repo.update({ id: user.id, email, displayName });
	});

	const json: Authentication.Schemas.UserJson = {
		id: updatedUser.id,
		email: updatedUser.email,
		displayName: updatedUser.displayName || undefined,
		createdAt: updatedUser.createdAt.toISOString()
	};

	res.status(200).json(json);
});

export class HttError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

export const handleError = (err: unknown, req: Request, res: Response) => {
	if (err instanceof HttError) {
		return res.status(err.status).json({ message: err.message });
	}
	logger.error("Unexpected error:", err);
	res.status(500).json({ message: "Internal server error" });
};

authRouter.post("/login", async (req: Request, res: Response) => {
	try {
		const { email, password } = Authentication.Schemas.userLogin.parse(req.body);

		const { user, avatar } = await prisma.$transaction(async (prisma) => {
			const repo = new UserRepository(prisma);
			const user = await repo.findByEmail(email);
			const avatar = user ? await repo.fetchAvatarObject(user.id) : null;

			const isValidPassword = !!user && (await repo.verifyPassword(user.id, password));
			if (!isValidPassword) throw new HttError(401, "Invalid email or password");

			return { user, avatar };
		});

		appendAuthCookie(res, user.id);
		logger.debug("Logging in user with token:", user.id);
		sessions.set(user.id, user);

		const json: Authentication.Schemas.UserJson = {
			id: user.id,
			email: user.email,
			displayName: user.displayName || undefined,
			createdAt: user.createdAt.toISOString(),
			avatar: avatar ? { id: avatar.id, url: avatar.url } : undefined
		};

		res.status(200).json(json);
	} catch (error) {
		handleError(error, req, res);
	}
});

authRouter.post("/logout", (req: Request, res: Response) => {
	const token = req.cookies["auth_token"];

	logger.debug("Logging out user with token:", token);

	if (token) {
		sessions.delete(token);
		res.clearCookie("auth_token");
	}

	res.status(200).json({ message: "Logged out successfully" });
});

authRouter.delete("/delete", async (req: Request, res: Response) => {
	const token = req.cookies["auth_token"];
	const user = sessions.get(token);

	if (!user) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	await prisma.$transaction(async (prisma) => {
		const repo = new UserRepository(prisma);
		await repo.delete(user.id);
	});

	sessions.delete(token);
	res.clearCookie("auth_token");
	res.status(200).json({ message: "User deleted successfully" });
});

export const useAuthRouter = (app: ReturnType<typeof express>) => {
	app.use("/auth", authRouter);
};
