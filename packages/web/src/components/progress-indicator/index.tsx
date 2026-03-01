import { FC } from "react";

const ProgressBar: FC<{ progress: number; stepConfig: Record<number, { className: string }> }> = ({
	progress,
	stepConfig
}) => {
	let currentStep = 0;
	for (const step in stepConfig) {
		if (progress >= parseInt(step)) {
			currentStep = parseInt(step);
		} else {
			break;
		}
	}

	const currentClassName = stepConfig[currentStep]?.className || "bg-blue-600";

	return (
		<div className="w-full bg-gray-200 rounded-full h-2.5">
			<div
				className={`h-2.5 rounded-full transition-all duration-300 ${currentClassName ?? "bg-blue-500"}`}
				style={{ width: `${progress}%` }}
			></div>
		</div>
	);
};

export default ProgressBar;
