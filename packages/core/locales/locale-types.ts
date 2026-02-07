import z from "zod";
import type { LanguageCode } from "./locale-enums.js";

export type NoriI18nCollectionMeta = z.infer<typeof NoriI18nCollectionMetaSchema>;
export const NoriI18nCollectionMetaSchema = z.object({
	kind: z.literal("noriI18nCollection")
});

export interface NoriI18nCollection extends Readonly<Record<LanguageCode, string>> {
	_meta: NoriI18nCollectionMeta;
}
