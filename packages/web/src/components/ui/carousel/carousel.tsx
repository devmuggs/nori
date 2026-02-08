import React, { useMemo } from "react";
import type { UseCarouselReturn } from "./use-carousel";

export const CarouselItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return <div className="w-full flex-shrink-0 px-4">{children}</div>;
};

type CarouselContentProps = {
	children: React.ReactNode;
	debug?: boolean;
	carouselHook: UseCarouselReturn;
};

export const CarouselContent: React.FC<CarouselContentProps> = ({
	children,
	debug = false,
	carouselHook
}) => {
	const currentIndex = carouselHook.currentIndex;

	const { items, controls } = useMemo(() => {
		const allChildren = React.Children.toArray(children);
		return {
			items: allChildren.filter(
				(child) => React.isValidElement(child) && child.type === CarouselItem
			),
			controls: allChildren.filter(
				(child) =>
					React.isValidElement(child) &&
					(child.type === CarouselPrevious || child.type === CarouselNext)
			)
		};
	}, [children]);

	const totalItems = items.length;
	const translateXPercentage = -currentIndex * 100;

	const handlePrevious = () => {
		carouselHook.goToPrevious();
	};

	const handleNext = () => {
		carouselHook.goToNext();
	};

	const controlsWithHandlers = React.Children.map(controls, (child) => {
		if (!React.isValidElement(child)) return child;

		if (child.type === CarouselPrevious) {
			return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
				onClick: handlePrevious
			});
		}
		if (child.type === CarouselNext) {
			return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
				onClick: handleNext
			});
		}
		return child;
	});

	return (
		<>
			<div className="relative overflow-hidden">
				{debug && (
					<div className="absolute top-0 left-0 bg-black text-white p-1 text-xs z-10">
						{currentIndex + 1} / {totalItems}
					</div>
				)}
				<div
					className="flex transition-transform duration-300 ease-in-out"
					style={{ transform: `translateX(${translateXPercentage}%)` }}
				>
					{items}
				</div>
			</div>
			<div className="flex justify-between mt-4 gap-2">{controlsWithHandlers}</div>
		</>
	);
};

type CarouselButtonProps = {
	children?: React.ReactNode;
	onClick?: () => void;
};

export const CarouselPrevious: React.FC<CarouselButtonProps> = ({ children, onClick }) => {
	return (
		<button type="button" onClick={onClick} className="carousel-button">
			{children || "Previous"}
		</button>
	);
};

export const CarouselNext: React.FC<CarouselButtonProps> = ({ children, onClick }) => {
	return (
		<button type="button" onClick={onClick} className="carousel-button">
			{children || "Next"}
		</button>
	);
};

export const Carousel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return <div className="relative w-full">{children}</div>;
};
