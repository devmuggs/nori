import NoriSdk from "./index";

namespace Health {
	export type Instance = ReturnType<typeof create>;
	export const create = (sdk: NoriSdk) => ({
		check: () => sdk._axiosInstance.get<void>("/health")
	});
}

export default Health;
