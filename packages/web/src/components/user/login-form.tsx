import { noriSdk } from "@/lib/daemon-service";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Authentication } from "@nori/core";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { FieldGroup } from "../ui/field";
import { EmailInput, PasswordInput } from "./fields";

export default function LoginForm({
	onLoginSuccess
}: {
	onLoginSuccess?: (user: Authentication.Schemas.UserJson) => void;
}) {
	const [isRevealingPassword, setIsRevealingPassword] = useState(false);
	const toggleRevealPassword = () => setIsRevealingPassword((prev) => !prev);

	const { handleSubmit, control } = useForm<Authentication.Schemas.UserLoginData>({
		resolver: standardSchemaResolver(Authentication.Schemas.userLogin),
		defaultValues: {
			email: "",
			password: ""
		},
		mode: "onChange"
	});

	const onSubmit = async (values: Authentication.Schemas.UserLoginData) => {
		try {
			const user = await noriSdk.auth.login(values);
			if ("message" in user) {
				// Handle error
				toast.error(user.message);
				return;
			}
			onLoginSuccess?.(user);
		} catch (error) {
			toast.error("An unexpected error occurred during login. Please try again.");
			console.error("Login error:", error);
		}
	};

	return (
		<form className="flex items-center gap-2" onSubmit={handleSubmit(onSubmit)}>
			<FieldGroup>
				<Controller
					name="email"
					control={control}
					render={(props) => <EmailInput {...props} />}
				/>
				<Controller
					name="password"
					control={control}
					render={(props) => (
						<PasswordInput
							{...props}
							isRevealingPassword={isRevealingPassword}
							onToggleRevealPassword={toggleRevealPassword}
						/>
					)}
				/>
				<Button type="submit">Log In</Button>
			</FieldGroup>
		</form>
	);
}
