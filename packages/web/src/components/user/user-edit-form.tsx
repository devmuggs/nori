import { noriSdk } from "@/lib/daemon-service";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Authentication } from "@nori/core";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { EmailInput } from "./fields";

export default function UserEditForm({
	user,
	onUpdateSuccess
}: {
	user: Authentication.Schemas.UserJson;
	onUpdateSuccess?: (user: Authentication.Schemas.UserJson) => void;
}) {
	const { handleSubmit, control } = useForm<Authentication.Schemas.UserUpdateData>({
		resolver: standardSchemaResolver(Authentication.Schemas.userUpdate),
		defaultValues: user,
		mode: "onChange"
	});

	const onSubmit = async (values: Authentication.Schemas.UserUpdateData) => {
		const user = await noriSdk.auth.update(values);
		if ("message" in user) {
			// Handle error
			toast.error(user.message);
			return;
		}
		onUpdateSuccess?.(user);
	};

	return (
		<form className="flex items-center gap-2" onSubmit={handleSubmit(onSubmit)}>
			<FieldGroup>
				<Controller
					name={"email"}
					control={control}
					render={(props) => <EmailInput {...props} mode="edit" />}
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
								This is the name that will be displayed on your profile and
								associated with your activity.
							</FieldDescription>
							{field.value && fieldState.invalid && (
								<FieldError errors={[fieldState.error]} />
							)}
						</Field>
					)}
				/>
				<Button type="submit">Save Changes</Button>
			</FieldGroup>
		</form>
	);
}
