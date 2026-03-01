import { useState } from "react";

export type UseCarouselReturn = {
	currentIndex: number;
	direction: 1 | -1;
	goToIndex: (index: number) => void;
	goToNext: () => void;
	goToPrevious: () => void;
};
export const useCarousel = (options: { initialSlide?: number } = {}): UseCarouselReturn => {
	const [currentIndex, setCurrentIndex] = useState(options.initialSlide || 0);
	const [direction, setDirection] = useState<1 | -1>(1);

	const goToIndex = (index: number) => {
		setDirection(index > currentIndex ? 1 : -1);
		setCurrentIndex(index);
	};
	const goToNext = () => {
		setDirection(1);
		setCurrentIndex((prev) => prev + 1);
	};
	const goToPrevious = () => {
		setDirection(-1);
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
	};
	return {
		currentIndex,
		direction,
		goToIndex,
		goToNext,
		goToPrevious
	};
};
