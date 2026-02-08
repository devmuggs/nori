import { useState } from "react";

export type UseCarouselReturn = {
	currentIndex: number;
	goToIndex: (index: number) => void;
	goToNext: () => void;
	goToPrevious: () => void;
};
export const useCarousel = (options: { initialSlide?: number }): UseCarouselReturn => {
	const [currentIndex, setCurrentIndex] = useState(options.initialSlide || 0);
	const goToIndex = (index: number) => {
		setCurrentIndex(index);
	};
	const goToNext = () => {
		setCurrentIndex((prev) => prev + 1);
	};
	const goToPrevious = () => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
	};
	return {
		currentIndex,
		goToIndex,
		goToNext,
		goToPrevious
	};
};
