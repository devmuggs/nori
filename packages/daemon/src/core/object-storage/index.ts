import * as Minio from "minio";
import { logger } from "../../daemon";

const minioClient = new Minio.Client({
	endPoint: "minio",
	port: 9000,
	useSSL: false,
	accessKey: process.env.MINIO_ROOT_USER || "minioadmin",
	secretKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin"
});

const daemonPublicUrl = process.env.DAEMON_PUBLIC_URL || "https://nori-api.muggridge.dev";
const clientAccessibleMinioIoUrl = `${daemonPublicUrl}/object-storage`; // Route uploads through the daemon proxy to avoid CORS issues with direct MinIO access
const internalMinioUrl = "http://minio:9000"; // This is the URL that the daemon itself will use to access the Minio server

export class ObjectStorage {
	private client: Minio.Client;

	readonly bucketName = "nori";
	readonly preSignedUrlExpirySeconds = 60 * 10; // 10 minutes

	constructor(client: Minio.Client) {
		this.client = client;
		this.upsertBucket().catch((error) => {
			logger.error("Error ensuring bucket exists:", error);
		});
	}

	async upsertBucket(): Promise<void> {
		const exists = await this.client.bucketExists(this.bucketName);
		if (!exists) {
			await this.client.makeBucket(this.bucketName);
			logger.info(`Created bucket: ${this.bucketName}`);
		} else {
			logger.info(`Bucket already exists: ${this.bucketName}`);
		}
	}

	async uploadObject(objectName: string, filePath: string): Promise<void> {
		await this.client.fPutObject(this.bucketName, objectName, filePath);
	}

	async getObject(objectName: string): Promise<NodeJS.ReadableStream> {
		return await this.client.getObject(this.bucketName, objectName);
	}

	async getObjectDetails(objectName: string): Promise<Minio.BucketItem> {
		const stream = this.client.listObjectsV2(this.bucketName, objectName, true);
		return new Promise((resolve, reject) => {
			stream.on("data", (item) => {
				if (item.name === objectName) {
					resolve(item);
				}
			});
			stream.on("error", (err) => {
				reject(err);
			});
			stream.on("end", () => {
				reject(new Error("Object not found"));
			});
		});
	}

	async deleteObject(objectName: string): Promise<void> {
		await this.client.removeObject(this.bucketName, objectName);
	}

	async generatePresignedUrl(objectName: string): Promise<string> {
		try {
			// returns the docker internal hostname for the daemon, which is what the SDK client will connect to when running in the same docker network
			// this isn't usable for clients outside the docker network, but those clients should be connecting to the daemon via the noriApiUrl, which will proxy the request to the internal hostname
			const presignedUrl = await this.client.presignedPutObject(
				this.bucketName,
				objectName,
				this.preSignedUrlExpirySeconds
			);

			const clientAccessibleUrl = presignedUrl.replace(
				internalMinioUrl,
				clientAccessibleMinioIoUrl
			);

			logger.debug(
				`Generated presigned URL for object ${objectName}: ${clientAccessibleUrl}`
			);
			return clientAccessibleUrl;
		} catch (error) {
			logger.error(`Error generating presigned URL for object ${objectName}:`, error);
			throw error;
		}
	}
}

const objectStorage = new ObjectStorage(minioClient);

export default objectStorage;
