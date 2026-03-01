import { PrismaPg } from "@prisma/adapter-pg";
import { DefaultArgs } from "@prisma/client/runtime/client";
import "dotenv/config";
import { PrismaClient } from "../../../generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
export type PrismaTransaction = Omit<
	PrismaClient<never, undefined, DefaultArgs>,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export default prisma;
