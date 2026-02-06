


type LanguageCode = (typeof LanguageCode)[keyof typeof LanguageCode];
const LanguageCode = Object.freeze({
	EnglishBritish: "en-GB",
	Japanese: "ja-JP",
});


export interface NoriI18nCollection extends Readonly<Record<LanguageCode, string>> {
	_meta: {
		kind: "noriI18nCollection";
	};
}

const createNoriI18nCollection = (
	collection: Readonly<Record<LanguageCode, string>> & {
		_meta: { kind: "noriI18nCollection" };
	}
): NoriI18nCollection => {
	return collection as NoriI18nCollection;
};

const createNoriI18nCollectionGenerator = <TParams extends Record<string, any>>(
	generator: (params: TParams) => NoriI18nCollection
): ((params: TParams) => NoriI18nCollection) => {
	return generator;
};


const nori = Object.freeze({


/** Collection: root */

letsGetStarted: createNoriI18nCollectionGenerator(({
topic,
}: {
/**
 * - en-GB: The topic to get started with.
 * - ja-JP: 始めるトピック。
 */
topic: string;
}) => createNoriI18nCollection({
	_meta: {
		kind: "noriI18nCollection"
	},
[LanguageCode.EnglishBritish]: `Let's get started with ${ topic }.`,
[LanguageCode.Japanese]: `さあ、${ topic }を始めましょう！`
})),

/** Collection: client */

greeting: createNoriI18nCollection({
	_meta: {
		kind: "noriI18nCollection"
	},
[LanguageCode.EnglishBritish]: `Hello!`,
[LanguageCode.Japanese]: `こんにちは！`
}),
farewell: createNoriI18nCollection({
	_meta: {
		kind: "noriI18nCollection"
	},
[LanguageCode.EnglishBritish]: `Goodbye!`,
[LanguageCode.Japanese]: `さようなら！`
})
});

export default nori;
