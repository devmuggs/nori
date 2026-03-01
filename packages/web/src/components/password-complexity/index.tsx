import clsx from "clsx";
import { Check, CheckCircle, X } from "lucide-react";
import { FC } from "react";
import ProgressBar from "../progress-indicator";
import { Carousel, CarouselContent, CarouselItem, useCarousel } from "../ui/carousel";
import { Complexity, ComplexityLabels, ComplexityMeta, ComplexityScores } from "./complexity-enums";

const PasswordComplexityIndicator: FC<{ password: string }> = ({ password }) => {
	const carousel = useCarousel({ initialSlide: 0 });

	const tests: { test: (pwd: string) => boolean; label: string }[] = [
		{ test: (pwd: string) => /[a-z]/.test(pwd), label: "At least one lowercase letter" },
		{ test: (pwd: string) => /[A-Z]/.test(pwd), label: "At least one uppercase letter" },
		{ test: (pwd: string) => /[0-9]/.test(pwd), label: "At least one number" },
		{
			test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
			label: "At least one special character"
		},
		{ test: (pwd: string) => pwd.length >= 8, label: "Minimum 8 Characters" }
	];

	const results: { label: string; isPassed: boolean }[] = tests.map(({ test, label }) => ({
		label,
		isPassed: test(password)
	}));

	const passedChecksPercent = (results.filter((t) => t.isPassed).length / results.length) * 100;

	let complexity: Complexity = Complexity.VeryWeak;
	for (const key of ComplexityMeta.values) {
		if (passedChecksPercent >= ComplexityScores[key]) complexity = key;
	}

	if (complexity === Complexity.VeryStrong && carousel.currentIndex === 0) {
		carousel.goToNext();
	} else if (complexity !== Complexity.VeryStrong && carousel.currentIndex === 1) {
		carousel.goToPrevious();
	}

	return (
		<div className="duration-300">
			<Carousel>
				<CarouselContent carouselHook={carousel}>
					<CarouselItem>
						<>
							<div className={clsx("flex gap-2 items-center")}>
								<p className="text-sm text-muted-foreground grow min-w-fit">
									{ComplexityLabels[complexity]}
								</p>
								<ProgressBar
									progress={passedChecksPercent}
									stepConfig={{
										[ComplexityScores[Complexity.VeryWeak]]: {
											className: "bg-neutral-200"
										},
										[ComplexityScores[Complexity.Weak]]: {
											className: "bg-neutral-400"
										},
										[ComplexityScores[Complexity.Fair]]: {
											className: "bg-neutral-600"
										},
										[ComplexityScores[Complexity.Strong]]: {
											className: "bg-neutral-800"
										},
										[ComplexityScores[Complexity.VeryStrong]]: {
											className: "bg-neutral-950"
										}
									}}
								/>
							</div>
							<ul className="mt-2 text-xs">
								{results.map((result, index) => (
									<li
										key={index}
										className={clsx(
											`flex gap-1 items-center`,
											result.isPassed
												? "text-muted-foreground"
												: "text-foreground"
										)}
									>
										{result.isPassed ? (
											<Check className="text-green-600" />
										) : (
											<X className="text-red-600" />
										)}{" "}
										{result.label}
									</li>
								))}
							</ul>
						</>
					</CarouselItem>
					<CarouselItem>
						<div className={clsx("flex gap-2 items-center")}>
							<CheckCircle className="size-4" />
							<span>Password is very strong!</span>
						</div>
					</CarouselItem>
				</CarouselContent>
			</Carousel>
		</div>
	);
};

export default PasswordComplexityIndicator;
