import z from "zod";
import NoriSdk from "./index";

namespace FileUploads {
	export type PreSignedUrlRequestQuery = z.infer<typeof preSignedUrlRequestQuerySchema>;
	export const preSignedUrlRequestQuerySchema = z.object({
		fileName: z.string().trim().min(1, "File name is required."),
		mimeType: z.string().trim().min(1, "Content type is required.") // i.e. "image/png", "application/pdf", etc. This is important for setting the correct content type when uploading to S3, but is not used for anything else in the daemon
	});

	export type FileUploadCompletionRequestBody = z.infer<
		typeof fileUploadCompletionRequestBodySchema
	>;
	export const fileUploadCompletionRequestBodySchema = z.object({
		key: z.string() // The key that identifies the file in object storage (e.g., "userId/fileId-fileName.ext")
	});

	export type PreSignedUrlResponse = z.infer<typeof preSignedUrlResponseSchema>;
	export const preSignedUrlResponseSchema = z.object({
		url: z.string(), // The pre-signed URL to which the file can be uploaded directly
		key: z.string() // The key that identifies the file in object storage (e.g., "userId/fileId-fileName.ext")
	});

	export const create = (sdk: NoriSdk) => {
		return {
			getPreSignedUrl: (data: PreSignedUrlRequestQuery) => {
				const preSignedUrlRequestQuery = preSignedUrlRequestQuerySchema.parse(data);
				return sdk.get<PreSignedUrlResponse>(
					`/file-uploads/pre-signed-url?fileName=${encodeURIComponent(preSignedUrlRequestQuery.fileName)}&mimeType=${encodeURIComponent(preSignedUrlRequestQuery.mimeType)}`
				);
			},
			completeFileUpload: (key: string) =>
				sdk.post<{ message: "File upload completed and linked successfully" }>(
					`/file-uploads/complete`,
					fileUploadCompletionRequestBodySchema.parse({ key })
				)
		};
	};
}

export default FileUploads;
