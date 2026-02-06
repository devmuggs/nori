


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
	collection: Readonly<Record<LanguageCode, string>>
): NoriI18nCollection => {
	return Object.freeze({
		...collection,
		_meta: {
			kind: "noriI18nCollection" as const
		}
	});
};

const createNoriI18nCollectionGenerator = <TParams extends Record<string, any>>(
	generator: (params: TParams) => NoriI18nCollection
): ((params: TParams) => NoriI18nCollection) => {
	return generator;
};


const nori = Object.freeze({


/** Collection: root */
root: {
/**
 * - en-GB: Displayed on first step of onboarding wizard.
 * - ja-JP: オンボーディングウィザードの最初のステップに表示されます。
 */letsGetStarted: createNoriI18nCollectionGenerator(({
topic,
}: {
/**
 * - en-GB: The topic to get started with.
 * - ja-JP: 始めるトピック。
 */
topic: string;
}) => createNoriI18nCollection({
[LanguageCode.EnglishBritish]: `Let's get started with ${ topic }.`,
[LanguageCode.Japanese]: `さあ、${ topic }を始めましょう！`
})),
},


/** Collection: client */
client: {
/**
 * - en-GB: A friendly greeting message.
 * - ja-JP: 親しみやすい挨拶メッセージ。
 */greeting: createNoriI18nCollection({
[LanguageCode.EnglishBritish]: `Hello!`,
[LanguageCode.Japanese]: `こんにちは！`
}),
/**
 * - en-GB: A friendly farewell message.
 * - ja-JP: 親しみやすい別れのメッセージ。
 */farewell: createNoriI18nCollection({
[LanguageCode.EnglishBritish]: `Goodbye!`,
[LanguageCode.Japanese]: `さようなら！`
})
},

});

export default nori;
