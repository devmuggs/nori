import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { ControllerFieldState, ControllerRenderProps, FieldValues } from "react-hook-form";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

export type InputFieldPropsField<T extends Record<string, unknown>> = FieldValues & T;

export const EmailInput = <
	T extends InputFieldPropsField<{ email: string } | { email?: string }>
>(props: {
	field: ControllerRenderProps<T>;
	fieldState: ControllerFieldState;
	mode?: "login" | "registration" | "edit";
}) => {
	const { field, fieldState, mode = "login" } = props;
	return (
		<Field data-invalid={field.value && fieldState.invalid}>
			<FieldLabel htmlFor={field.name}>Email</FieldLabel>
			<Input
				required={mode !== "edit"}
				type="email"
				id={field.name}
				{...field}
				data-invalid={field.value && fieldState.invalid}
				placeholder="Enter your email"
				autoComplete="email"
				autoCorrect="off"
			/>
			<FieldDescription>
				Your email address will be used for account verification and password recovery.
			</FieldDescription>
			{field.value && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
		</Field>
	);
};

export const PasswordInput = <
	T extends InputFieldPropsField<{ password: string } | { confirmPassword: string }>
>(props: {
	field: ControllerRenderProps<T>;
	fieldState: ControllerFieldState;
	isRevealingPassword: boolean;
	onToggleRevealPassword: () => void;
}) => {
	const { field, fieldState, isRevealingPassword, onToggleRevealPassword } = props;
	const isConfirmPassword = field.name === "confirmPassword";
	return (
		<Field data-invalid={field.value && fieldState.invalid}>
			<FieldLabel htmlFor={field.name}>
				{isConfirmPassword ? "Confirm Password" : "Password"}
			</FieldLabel>
			<div className="flex gap-2">
				<Input
					{...field}
					required
					type={isRevealingPassword ? "text" : "password"}
					id={field.name}
					data-invalid={field.value && fieldState.invalid}
					placeholder={
						isConfirmPassword ? "Re-enter your password" : "Enter your password"
					}
					autoComplete={isConfirmPassword ? "new-password" : "current-password"}
				/>
				<RevealPasswordButton
					isRevealingPassword={isRevealingPassword}
					onClick={onToggleRevealPassword}
				/>
			</div>
			<FieldDescription>
				{isConfirmPassword
					? "Please confirm your password by entering it again."
					: "Your password must be at least 8 characters long."}
			</FieldDescription>
			{field.value && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
		</Field>
	);
};

export const RevealPasswordButton = ({
	isRevealingPassword,
	onClick
}: {
	isRevealingPassword: boolean;
	onClick: () => void;
}) => {
	return (
		<Button variant="ghost" size="icon" onClick={onClick}>
			{isRevealingPassword ? <EyeIcon /> : <EyeClosedIcon />}
		</Button>
	);
};
