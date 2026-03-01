import { NoriSDK } from "@nori/core/sdk";
import express, { Router } from "express";

import crypto from "crypto";
import { createCuid2 } from "../../core/helpers";
import objectStorage from "../../core/object-storage";
import prisma from "../../core/prisma";
import { logger } from "../../daemon";
import { sessions } from "../authentication/authentcation-router";
const fileUploadRouter = Router();

const generateDeterministicHash = (userId: string, fileName: string) => {
	// Generate a unique hash for the file using the user ID and file name
	const hash = crypto
		.createHash("sha256")
		.update(`${userId}-${fileName}`)
		.digest("hex")
		.slice(0, 8);
	return hash;
};

const fileHashToFileDetails = new Map<
	string,
	{ userId: string; fileName: string; mimeType: string }
>();

fileUploadRouter.get("/pre-signed-url", async (req, res) => {
	const token = req.cookies["auth_token"];
	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const user = sessions.get(token);
	if (!user) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const { fileName, mimeType } =
			NoriSDK.Modules.FileUploads.preSignedUrlRequestQuerySchema.parse({
				fileName: decodeURIComponent(req.query.fileName as string),
				mimeType: decodeURIComponent(req.query.mimeType as string) // i.e. "image/png", "application/pdf", etc. This is important for setting the correct content type when uploading to S3, but is not used for anything else in the daemon
			});

		const fileId = createCuid2();
		const hash = generateDeterministicHash(user.id, fileName);
		logger.debug(`Generated file hash: ${hash} for user: ${user.id} and file: ${fileName}`);
		fileHashToFileDetails.set(hash, {
			userId: user.id,
			fileName,
			mimeType
		});

		const key = `${user.id}/${fileId}-${fileName}`; // e.g., userId/fileId-fileName.ext
		const url = await objectStorage.generatePresignedUrl(key);

		res.json({ url, key });
	} catch (error) {
		logger.error("Error generating pre-signed URL:", error);
		res.status(500).json({ message: "Failed to generate pre-signed URL" });
	}
});

// the key has the format userId/fileId-fileName.ext, so we can use that to determine which file to retrieve from object storage when the client requests to download a file
// because of this we can't use :key as a route parameter, because the fileName can contain dashes, so we have to use a wildcard route parameter and parse the key from the request URL
fileUploadRouter.get("/download", async (req, res) => {
	try {
		const key = req.query.key;
		logger.debug(`Received request to download file with key: ${key}`);

		if (!key || typeof key !== "string") {
			logger.warn("Invalid file key provided for download");
			return res.status(400).json({ message: "Invalid file key" });
		}

		const fileStream = await objectStorage.getObject(key);
		if (!fileStream) {
			logger.warn(`File not found in object storage for key: ${key}`);
			return res.status(404).json({ message: "File not found" });
		}

		logger.debug(
			`Successfully retrieved file stream for key: ${key}, streaming file to response`
		);
		fileStream.pipe(res);
	} catch (error) {
		logger.error("Error downloading file:", error);
		res.status(500).json({ message: "Failed to download file" });
	}
});

fileUploadRouter.post("/complete", async (req, res) => {
	// this endpoint is used to link the uploaded file (identified by the key) to a specific entity in the database, such as a user profile or a document
	// the client should call this endpoint after successfully uploading the file to the pre-signed URL, passing the key and any relevant metadata (e.g., which user or document this file is associated with)
	// the daemon can then store this information in the database for later retrieval

	const token = req.cookies["auth_token"];
	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const user = sessions.get(token);
	if (!user) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		// for now the only thing we link is user with profile pictures.
		const { key } = NoriSDK.Modules.FileUploads.fileUploadCompletionRequestBodySchema.parse(
			req.body
		);

		const fileDetails = await objectStorage.getObjectDetails(key); // This would be a method to retrieve details about the uploaded file, such as its URL and metadata
		if (!fileDetails) {
			return res.status(404).json({ message: "File not found" });
		}

		const nameParts = fileDetails.name?.split("-");
		if (!nameParts || nameParts.length < 2) {
			return res.status(400).json({ message: "Invalid file key format" });
		}

		const [cuid, ...fileNameParts] = nameParts;
		const fileName = fileNameParts.join("-");
		if (!cuid || !fileName) {
			return res.status(400).json({ message: "Invalid file key format" });
		}

		const fileHash = generateDeterministicHash(user.id, fileName);
		logger.debug(`Generated file hash: ${fileHash} for user: ${user.id} and file: ${fileName}`);

		const storedFileDetails = fileHashToFileDetails.get(fileHash);
		if (!storedFileDetails) {
			logger.error(`File details not found for the provided key: ${key}`);
			return res.status(404).json({ message: "File details not found for the provided key" });
		}

		await prisma.$transaction(async (prisma) => {
			const file = await prisma.object.create({
				data: {
					id: cuid,
					url: key,
					mimeType: storedFileDetails.mimeType,
					size: fileDetails.size || 0,
					user: {
						connect: { id: user.id }
					}
				}
			});

			const latestRevision = await prisma.userRevision.findFirst({
				where: {
					userId: user.id
				},
				orderBy: {
					createdAt: "desc"
				}
			});

			if (!latestRevision) {
				throw new Error("No user revision found for user");
			}

			await prisma.userRevision.create({
				data: {
					...latestRevision,
					id: undefined,
					userId: user.id,
					avatarObjectId: file.id
				}
			});
		});

		return res.status(200).json({ message: "File upload completed and linked successfully" });
	} catch (error) {
		console.error("Error completing file upload:", error);
		res.status(500).json({ message: "Failed to complete file upload" });
	}
});

export const useFileUploadRouter = (app: ReturnType<typeof express>) => {
	app.use("/file-uploads", fileUploadRouter);
};
