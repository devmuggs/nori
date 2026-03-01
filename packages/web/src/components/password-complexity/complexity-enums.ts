import { Enum, EnumValue } from "@nori/core";

export type Complexity = EnumValue<typeof Complexity>;
export const [Complexity, ComplexityMeta] = Enum({
	VeryWeak: "very-weak",
	Weak: "weak",
	Fair: "fair",
	Strong: "strong",
	VeryStrong: "very-strong"
});

export const ComplexityScores = ComplexityMeta.derive({
	[Complexity.VeryWeak]: 0,
	[Complexity.Weak]: 20,
	[Complexity.Fair]: 40,
	[Complexity.Strong]: 60,
	[Complexity.VeryStrong]: 100
});

export const ComplexityLabels = ComplexityMeta.derive({
	[Complexity.VeryWeak]: "Very Weak",
	[Complexity.Weak]: "Weak",
	[Complexity.Fair]: "Fair",
	[Complexity.Strong]: "Strong",
	[Complexity.VeryStrong]: "Very Strong"
});
