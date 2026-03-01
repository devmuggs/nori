import prisma, { PrismaTransaction } from "../../../core/prisma";
import PasswordEntity from "../entities/password-entity";
import UserEntity from "../entities/user-entity";

const userInclude = {
	revisions: {
		orderBy: { createdAt: "desc" },
		take: 1
	}
} as const satisfies Parameters<PrismaTransaction["user"]["findUnique"]>[0]["include"];

export default class UserRepository {
	private db: PrismaTransaction;

	constructor(private tx?: PrismaTransaction) {
		this.db = tx || prisma;
	}

	async create({
		user,
		password
	}: {
		user: UserEntity;
		password: PasswordEntity;
	}): Promise<UserEntity> {
		const doCreate = async (prisma: PrismaTransaction) => {
			const now = new Date();

			if (!(password instanceof PasswordEntity)) {
				throw new Error("Password must be an instance of PasswordEntity");
			}

			const existingUser = await this.findByEmail(user.email);
			if (existingUser) throw new Error("User with this email already exists");

			const created = await prisma.user.create({
				data: {
					id: user.id,
					email: user.email,
					createdAt: now
				},
				include: userInclude
			});

			if (!created) throw new Error("Failed to create user");

			const revision = await prisma.userRevision.create({
				data: {
					userId: user.id,
					email: user.email,
					displayName: user.displayName,
					password: password.hashed,
					createdAt: now
				}
			});

			if (!revision) throw new Error("Failed to create user revision");

			return (
				created &&
				new UserEntity({
					id: user.id,
					email: revision.email,
					displayName: revision.displayName || undefined,
					createdAt: user.createdAt
				})
			);
		};

		if (this.tx) return await doCreate(this.tx);

		return await prisma.$transaction(async (prisma) => {
			return await doCreate(prisma);
		});
	}

	async delete(userId: string): Promise<void> {
		await this.db.user.delete({
			where: { id: userId }
		});
	}

	async update(
		entity: Partial<UserEntity & { password?: PasswordEntity }> & { id: string }
	): Promise<UserEntity> {
		if (entity.password && !(entity.password instanceof PasswordEntity)) {
			throw new Error("Password must be an instance of PasswordEntity");
		}

		const prev = await this.fetchLatestRevision({ userId: entity.id });
		if (!prev) throw new Error("User not found");
		const { user, ...rest } = prev;

		const curr = await this.db.userRevision.create({
			data: {
				...rest,
				...entity,
				id: undefined,
				password: entity.password ? entity.password.hashed : rest.password,
				userId: entity.id,
				createdAt: new Date()
			},
			include: { user: true }
		});

		return new UserEntity({
			id: curr.user.id,
			email: curr.email,
			displayName: curr.displayName || undefined,
			createdAt: curr.user.createdAt
		});
	}

	async updatePassword(userId: string, password: PasswordEntity) {
		if (!(password instanceof PasswordEntity)) {
			throw new Error("Password must be an instance of PasswordEntity");
		}

		const prev = await this.fetchLatestRevision({ userId });
		if (!prev) throw new Error("User not found");

		const { user, ...rest } = prev;

		const curr = await this.db.userRevision.create({
			data: {
				...rest,
				password: password.hashed,
				userId,
				createdAt: new Date()
			},
			include: { user: true }
		});

		return new UserEntity({
			id: curr.user.id,
			email: curr.email,
			displayName: curr.displayName || undefined,
			createdAt: curr.user.createdAt
		});
	}

	async verifyPassword(userId: string, password: string): Promise<boolean> {
		const userRevision = await this.fetchLatestRevision({ userId });
		if (!userRevision) throw new Error("User not found");

		return await PasswordEntity.verify(password, userRevision.password);
	}

	async findByEmail(email: string): Promise<UserEntity | null> {
		const userRevision = await this.fetchLatestRevision({ email });
		return userRevision
			? new UserEntity({
					id: userRevision.user.id,
					email: userRevision.email,
					displayName: userRevision.displayName || undefined,
					createdAt: userRevision.user.createdAt
				})
			: null;
	}

	async findById(userId: string): Promise<UserEntity | null> {
		const user = await this.fetchLatestRevision({ userId });

		return (
			user &&
			new UserEntity({
				id: user.user.id,
				email: user.email,
				displayName: user.displayName || undefined,
				createdAt: user.user.createdAt
			})
		);
	}

	private fetchLatestRevision = async (identifier: { userId: string } | { email: string }) =>
		this.db.userRevision.findFirst({
			where: identifier,
			orderBy: { createdAt: "desc" },
			include: { user: true }
		});
}
