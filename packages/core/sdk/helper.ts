export class NoriSDKError extends Error {
	constructor(
		message: string,
		public details?: any
	) {
		super(message);
		this.name = "NoriSDKError";
	}
}

export const handleSdkError = (error: unknown): NoriSDKError => {
	if (error instanceof NoriSDKError) {
		return error;
	} else if (error instanceof Error) {
		return new NoriSDKError(error.message, { stack: error.stack });
	} else {
		return new NoriSDKError("An unknown error occurred", { originalError: error });
	}
};
