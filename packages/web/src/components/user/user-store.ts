import { NoriSDK } from "@nori/core/sdk";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UserActions {
	setUser: (user: NoriSDK.Modules.Authentication.Schemas.UserJson) => void;
	clearUser: () => void;
}

type UserState = {
	user: NoriSDK.Modules.Authentication.Schemas.UserJson | undefined;
	actions: UserActions;
};

const initialState: { user: NoriSDK.Modules.Authentication.Schemas.UserJson | undefined } = {
	user: undefined
};

export const useUserStore = create<UserState>()(
	devtools(
		persist(
			immer((set) => ({
				...initialState,
				actions: {
					setUser: (user) =>
						set(() => ({
							user
						})),
					clearUser: () =>
						set(() => ({
							...initialState
						}))
				}
			})),
			{
				name: "user-storage",
				storage: createJSONStorage(() => localStorage),
				partialize: (state) => ({
					user: state.user
				})
			}
		),
		{ name: "UserStore" }
	)
);

export const useUser = () => useUserStore((s) => s.user);
export const setUser = (user: NoriSDK.Modules.Authentication.Schemas.UserJson) =>
	useUserStore.getState().actions.setUser(user);
export const clearUser = () => useUserStore.getState().actions.clearUser();
