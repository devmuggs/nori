import axios from "axios";
import { Enum, EnumValue } from "..";
import { DeploymentMode } from "../deployment-mode";

import _Authentication from "./authentication";
import _Health from "./health";

export namespace NoriSDK {
	export type LogLevel = EnumValue<typeof LogLevel>;
	export type HttpMethod = EnumValue<typeof HttpMethod>;

	export type Logger = {
		level: LogLevel;
	} & Record<LogLevel, (message: string, ...args: any[]) => void>;

	export const [HttpMethod, HttpMethodMeta] = Enum({
		Get: "GET",
		Post: "POST",
		Put: "PUT",
		Patch: "PATCH",
		Delete: "DELETE",
		Options: "OPTIONS"
	});

	export const [LogLevel, LogLevelMeta] = Enum({
		Trace: "trace",
		Debug: "debug",
		Info: "info",
		Warn: "warn",
		Error: "error"
	});

	export type Dependencies = {
		noriApiUrl: string;
		deploymentMode: DeploymentMode;
		logger: Logger;
		axios?: typeof axios;
	};

	export namespace Modules {
		export import Authentication = _Authentication;
		export import Health = _Health;
	}

	export class Client {
		readonly _axiosInstance: ReturnType<typeof axios.create>;

		constructor(public dependencies: Dependencies) {
			this._axiosInstance = dependencies.axios ?? axios.create();

			this._axiosInstance.defaults.baseURL = dependencies.noriApiUrl;
			this._axiosInstance.defaults.withCredentials = true;

			this._axiosInstance.interceptors.request.use((config) => {
				dependencies.logger[dependencies.logger.level](
					`Making ${config.method?.toUpperCase()} request to ${config.url}`
				);
				return config;
			});

			this._axiosInstance.interceptors.response.use(
				(response) => {
					dependencies.logger[dependencies.logger.level](
						`Received response with status ${response.status} from ${response.config.url}`
					);
					return response;
				},
				(error) => {
					if (error.response) {
						dependencies.logger.error(
							`Request to ${error.config.url} failed with status ${error.response.status}: ${error.message}`
						);
					} else {
						dependencies.logger.error(`Request failed: ${error.message}`);
					}
					return Promise.reject(error);
				}
			);
		}

		private request = async <TResult>(config: {
			url: string;
			method: HttpMethod;
			body?: any;
		}) => {
			try {
				const response = await this._axiosInstance.request<TResult>({
					url: config.url,
					method: config.method,
					data: config.body
				});

				return response.data;
			} catch (error) {
				if (axios.isAxiosError(error)) {
					const message =
						error.response?.data?.message ||
						error.message ||
						"An unknown error occurred";
					throw new Error(message);
				}
				throw error;
			}
		};

		get = async <TResult>(url: string) => {
			return this.request<TResult>({ url, method: HttpMethod.Get });
		};

		post = async <TResult>(url: string, data?: any) => {
			return this.request<TResult>({ url, method: HttpMethod.Post, body: data });
		};

		put = async <TResult>(url: string, data?: any) => {
			return this.request<TResult>({ url, method: HttpMethod.Put, body: data });
		};

		patch = async <TResult>(url: string, data?: any) => {
			return this.request<TResult>({ url, method: HttpMethod.Patch, body: data });
		};

		delete = async <TResult>(url: string) => {
			return this.request<TResult>({ url, method: HttpMethod.Delete });
		};

		options = async <TResult>(url: string) => {
			return this.request<TResult>({ url, method: HttpMethod.Options });
		};

		readonly auth = _Authentication.create(this);
		readonly health = _Health.create(this);
	}
}

export default NoriSDK.Client;
