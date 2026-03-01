import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import Authentication from "@nori/core/sdk/authentication";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";

import { noriSdk } from "@/lib/daemon-service";
import { useState } from "react";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { EmailInput, PasswordInput } from "./fields";

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;
const registrationFormSchema = Authentication.Schemas.userCreate
	.extend({
		confirmPassword: Authentication.Schemas.password
	})
	.refine((values) => values.password === values.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords do not match."
	});

export default function RegistrationForm({
	onRegisterSuccess
}: {
	onRegisterSuccess?: (user: Authentication.Schemas.UserJson) => void;
}) {
	const [isRevealingPassword, setIsRevealingPassword] = useState(false);
	const toggleRevealPassword = () => setIsRevealingPassword((prev) => !prev);

	const { handleSubmit, control } = useForm<RegistrationFormValues>({
		resolver: standardSchemaResolver(registrationFormSchema),
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
			displayName: ""
		},
		mode: "onChange"
	});

	const onSubmit = async (values: RegistrationFormValues) => {
		const user = await noriSdk.auth.register(values);
		console.debug("Registered user:", user);
		onRegisterSuccess?.(user);
	};

	return (
		<form className="flex items-center gap-2" onSubmit={handleSubmit(onSubmit)}>
			<FieldGroup>
				<Controller
					name={"email"}
					control={control}
					render={(props) => <EmailInput {...props} />}
				/>

				<Controller
					name="displayName"
					control={control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor={field.name}>Display Name</FieldLabel>
							<div>
								<Input
									data-invalid={fieldState.invalid}
									type="text"
									id={field.name}
									{...field}
									placeholder="Enter your display name"
									autoComplete="off"
								/>
							</div>
							<FieldDescription>
								Your display name will be visible to other users. You can choose to
								leave this blank if you prefer to use your email as your identifier.
							</FieldDescription>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
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

				<Controller
					name="confirmPassword"
					control={control}
					render={(props) => (
						<PasswordInput
							{...props}
							isRevealingPassword={isRevealingPassword}
							onToggleRevealPassword={toggleRevealPassword}
						/>
					)}
				/>

				<Button type="submit">Register</Button>
			</FieldGroup>
		</form>
	);
}
