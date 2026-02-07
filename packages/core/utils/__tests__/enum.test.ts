import { Enum, type EnumValue } from "../enum.js";

describe("Enum Utilities", () => {
	it("should create an enum and allow value retrieval", () => {
		const [ColorEnum] = Enum({
			Red: "red",
			Green: "green",
			Blue: "blue"
		});

		expect(ColorEnum.Red).toBe("red");
		expect(ColorEnum.Green).toBe("green");
		expect(ColorEnum.Blue).toBe("blue");
	});

	it("should have correct types for enum values", () => {
		const [SizeEnum] = Enum({
			Small: "small",
			Medium: "medium",
			Large: "large"
		});

		type Size = EnumValue<typeof SizeEnum>;

		const smallSize: Size = SizeEnum.Small;
		const mediumSize: Size = SizeEnum.Medium;
		const largeSize: Size = SizeEnum.Large;

		expect(smallSize).toBe("small");
		expect(mediumSize).toBe("medium");
		expect(largeSize).toBe("large");
	});

	it("should pick specified enum values", () => {
		const [FruitEnum, FruitEnumMeta] = Enum({
			Apple: "apple",
			Banana: "banana",
			Cherry: "cherry",
			Date: "date"
		});

		const picked = FruitEnumMeta.pick([FruitEnum.Banana, FruitEnum.Date]);
		expect(picked).toEqual({
			Banana: "banana",
			Date: "date",
			derive: expect.any(Function)
		});
	});

	it("should omit specified enum values", () => {
		const [VehicleEnum, VehicleEnumMeta] = Enum({
			Car: "car",
			Bike: "bike",
			Truck: "truck",
			Bus: "bus"
		});

		const omitted = VehicleEnumMeta.omit([VehicleEnum.Bike, VehicleEnum.Bus]);
		expect(omitted).toEqual({
			Car: "car",
			Truck: "truck",
			derive: expect.any(Function)
		});
	});

	it("should derive metadata for enum values", () => {
		const [AnimalEnum, AnimalEnumMeta] = Enum({
			Dog: "dog",
			Cat: "cat",
			Bird: "bird"
		});

		const derived = AnimalEnumMeta.derive({
			dog: { legs: 4, sound: "bark" },
			cat: { legs: 4, sound: "meow" },
			bird: { legs: 2, sound: "chirp" }
		});

		expect(derived).toEqual({
			[AnimalEnum.Dog]: { legs: 4, sound: "bark" },
			[AnimalEnum.Cat]: { legs: 4, sound: "meow" },
			[AnimalEnum.Bird]: { legs: 2, sound: "chirp" }
		});
	});

	it("should evaluate if a value exists in the enum", () => {
		const [StatusEnum, StatusEnumMeta] = Enum({
			Active: "active",
			Inactive: "inactive",
			Pending: "pending"
		});

		expect(StatusEnumMeta.evaluateIsValue("active")).toBe(true);
		expect(StatusEnumMeta.evaluateIsValue("deleted")).toBe(false);
	});

	it("should evaluate if a key exists in the enum", () => {
		const [DirectionEnum, DirectionEnumMeta] = Enum({
			North: "north",
			South: "south",
			East: "east",
			West: "west"
		});

		expect(DirectionEnumMeta.evaluateIsKey("North")).toBe(true);
		expect(DirectionEnumMeta.evaluateIsKey("Up")).toBe(false);
	});

	it("should perform reverse lookup from value to key", () => {
		const [PlanetEnum, PlanetEnumMeta] = Enum({
			Mercury: "mercury",
			Venus: "venus",
			Earth: "earth",
			Mars: "mars"
		});

		expect(PlanetEnumMeta.reverseLookup("earth")).toBe("Earth");
		expect(PlanetEnumMeta.reverseLookup("jupiter")).toBeUndefined();
	});

	it("should list all keys and values of the enum", () => {
		const [ContinentEnum, ContinentEnumMeta] = Enum({
			Africa: "africa",
			Asia: "asia",
			Europe: "europe",
			America: "america"
		});

		expect(ContinentEnumMeta.keys).toEqual(["Africa", "Asia", "Europe", "America"]);
		expect(ContinentEnumMeta.values).toEqual(["africa", "asia", "europe", "america"]);
	});
});
