import { animate, AnimatePresence, motion, useMotionValue } from "motion/react";
import React, { useEffect, useMemo, useRef } from "react";
import type { UseCarouselReturn } from "./use-carousel";

export const CarouselItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return <div className="w-full px-4">{children}</div>;
};

type CarouselContentProps = {
	children: React.ReactNode;
	debug?: boolean;
	carouselHook: UseCarouselReturn;
};

const SLIDE_OFFSET = 60;

const slideVariants = {
	enter: (direction: number) => ({ opacity: 0, x: direction * SLIDE_OFFSET }),
	center: { opacity: 1, x: 0 },
	exit: (direction: number) => ({ opacity: 0, x: direction * -SLIDE_OFFSET })
};

export const CarouselContent: React.FC<CarouselContentProps> = ({
	children,
	debug = false,
	carouselHook
}) => {
	const { currentIndex, direction } = carouselHook;
	const prevIndexRef = useRef(currentIndex);
	const resolvedDirection = direction ?? (currentIndex > prevIndexRef.current ? 1 : -1);

	const targetHeight = useMotionValue(0);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const updateHeight = () => {
			if (contentRef.current) {
				const newHeight = contentRef.current.offsetHeight;
				animate(targetHeight, newHeight, { duration: 0.3, ease: "easeInOut" });
			}
		};

		updateHeight();
	}, [currentIndex, children, targetHeight]);

	useEffect(() => {
		prevIndexRef.current = currentIndex;
	}, [currentIndex]);

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
	const currentItem = items[currentIndex];

	const controlsWithHandlers = React.Children.map(controls, (child) => {
		if (!React.isValidElement(child)) return child;
		if (child.type === CarouselPrevious) {
			return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
				onClick: carouselHook.goToPrevious
			});
		}
		if (child.type === CarouselNext) {
			return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
				onClick: carouselHook.goToNext
			});
		}
		return child;
	});

	return (
		<>
			<div className="relative overflow-hidden">
				{debug && (
					<div className="absolute top-0 left-0 z-10 bg-black p-1 text-xs text-white">
						{currentIndex + 1} / {totalItems}
					</div>
				)}
				<motion.div
					style={{ height: targetHeight }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
					className="relative w-full"
				>
					<AnimatePresence mode="wait" initial={false} custom={resolvedDirection}>
						<motion.div
							key={currentIndex}
							custom={resolvedDirection}
							variants={slideVariants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.3, ease: "easeInOut" }}
						>
							<div ref={contentRef}>{currentItem}</div>
						</motion.div>
					</AnimatePresence>
				</motion.div>
			</div>
			<div className="mt-4 flex justify-between gap-2">{controlsWithHandlers}</div>
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
