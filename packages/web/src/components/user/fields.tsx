import { noriSdk } from "@/lib/daemon-service";
import { Check, EyeClosedIcon, EyeIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ControllerFieldState, ControllerRenderProps, FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";

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

const MaxFileSizeInBytes = 5 * 1024 * 1024; // 5MB

export const FileInput = (props: {
	currentFileUrl?: string | null; // URL of the currently uploaded file to show as preview, if any
}) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const [file, setFile] = useState<File | null>(null);
	const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(
		props.currentFileUrl || null
	);
	const [isUploading, setIsUploading] = useState(true);
	const foregroundVideoRef = useRef<HTMLVideoElement>(null);
	const backgroundVideoRef = useRef<HTMLVideoElement>(null);
	const fileKeyRef = useRef<string | null>(null); // Store the file key returned from the server after upload to link it with the user profile in the database

	const [mimeType, setMimeType] = useState<"image" | "video" | null>(null);
	useEffect(() => {
		if (props.currentFileUrl) {
			const extension = props.currentFileUrl.split(".").pop()?.toLowerCase();
			if (extension) {
				if (["mp4", "webm", "ogg"].includes(extension)) {
					setMimeType("video");
				} else if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
					setMimeType("image");
				}
			}
		}
	}, [props.currentFileUrl]);

	const handleButtonClick = () => {
		inputRef.current?.click();
	};

	const generatePreviewUrl = (file: File) => URL.createObjectURL(file);

	const requestPreSignedUrl = async (file: File) => {
		try {
			const url = await noriSdk.files.getPreSignedUrl({
				fileName: file.name,
				mimeType: file.type
			});
			fileKeyRef.current = url.key; // Store the file key for later use when notifying the server of upload completion
			return url.url;
		} catch (error) {
			toast.error("Failed to get pre-signed URL. Please try again.");
			console.error("Pre-signed URL error:", error);
		}
	};

	const uploadFile = async (file: File, preSignedUrl: string) => {
		if (!fileKeyRef.current) {
			toast.error("Missing file key. Cannot upload file.");
			console.error("File upload error: Missing file key after obtaining pre-signed URL");
			return;
		}

		try {
			setIsUploading(true);
			const response = await fetch(preSignedUrl, {
				method: "PUT",
				headers: {
					"Content-Type": file.type
				},
				body: file
			});
			if (response.ok) {
				toast.success("File uploaded successfully!");

				// notify the server that the file upload completed so it can link the uploaded file with the user and store the file details in the database
				try {
					await noriSdk.files.completeFileUpload(fileKeyRef.current);
				} catch (error) {
					toast.error("Failed to complete file upload. Please try again.");
					console.error("File upload completion error:", error);
				}
			} else {
				toast.error("Failed to upload file. Please try again.");
				console.error("File upload error:", response.statusText);
			}
		} catch (error) {
			toast.error("Failed to upload file. Please try again.");
			console.error("File upload error:", error);
		} finally {
			setIsUploading(false);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > MaxFileSizeInBytes) {
			toast.error("File size exceeds the 5MB limit. Please choose a smaller file.");
			return;
		}

		setFile(file);

		const mimeType = file.type;
		setMimeType(mimeType);

		const isImage = mimeType.startsWith("image/");
		const isVideo = mimeType.startsWith("video/");

		if (!isImage && !isVideo) {
			toast.error("Please select an image or video file.");
			return;
		}

		const previewUrl = generatePreviewUrl(file);
		setFilePreviewUrl(previewUrl);

		const preSignedUrl = await requestPreSignedUrl(file);
		if (preSignedUrl) {
			await uploadFile(file, preSignedUrl);
		}
	};

	const clearFile = () => {
		setFile(null);
		if (filePreviewUrl) {
			URL.revokeObjectURL(filePreviewUrl);
			setFilePreviewUrl(null);
		}
	};

	// avoid memory leaks by revoking object URL when component unmounts or when a new file is selected
	useEffect(() => {
		return () => {
			if (filePreviewUrl) {
				URL.revokeObjectURL(filePreviewUrl);
			}
		};
	}, [filePreviewUrl]);

	return (
		<div className="w-full">
			<input
				ref={inputRef}
				type="file"
				accept="image/* video/*"
				className="hidden"
				onChange={handleFileChange}
			/>
			{filePreviewUrl && (
				<div className="relative mb-4">
					<div className="absolute top-1.5 right-1.5 z-20 bg-black/50 p-1 rounded-full flex items-center text-xs gap-2">
						{isUploading ? (
							<Spinner className="size-3" />
						) : (
							<Check className="size-3" />
						)}
					</div>
					{filePreviewUrl && (
						<div className="mt-4 max-w-full relative h-48 flex items-center justify-center rounded-md overflow-hidden">
							{/* foreground */}
							<div className="absolute inset-0 z-10 aspect-square w-48 rounded-md overflow-hidden mx-auto p-1">
								{mimeType === "image" && (
									<img
										src={filePreviewUrl}
										alt="File Preview"
										className="w-full h-full object-cover pointer-events-none rounded-md"
									/>
								)}
								{mimeType === "video" && (
									<video
										src={filePreviewUrl}
										onTimeUpdate={() => {
											if (
												foregroundVideoRef.current &&
												backgroundVideoRef.current
											) {
												backgroundVideoRef.current.currentTime =
													foregroundVideoRef.current.currentTime;
											}
										}}
										controls={false}
										loop
										autoPlay
										className="w-full h-full object-cover pointer-events-none rounded-md"
									/>
								)}
							</div>

							{/* background */}
							<div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
								{filePreviewUrl &&
									(mimeType === "image" ? (
										<img
											src={filePreviewUrl}
											alt="File Preview"
											className="w-full h-full object-cover rounded scale-150 blur-md opacity-50"
										/>
									) : mimeType === "video" ? (
										<video
											ref={backgroundVideoRef}
											src={filePreviewUrl}
											controls={false}
											loop
											autoPlay
											className="w-full h-full object-cover rounded scale-150 blur-md opacity-50"
										/>
									) : null)}
							</div>
						</div>
					)}

					{file && (
						<div className="flex items-center mt-2 gap-2">
							<Button variant={"outline"} size={"xs"} onClick={clearFile}>
								<X />
							</Button>
							<p className=" text-sm text-muted-foreground">{file.name}</p>
							<p className="text-sm text-muted-foreground flex items-center gap-1 ml-auto">
								{(file.size / (1024 * 1024)).toFixed(2)} MB
							</p>
						</div>
					)}
				</div>
			)}

			{!file && (
				<Button variant={"outline"} onClick={handleButtonClick}>
					Upload Profile Picture
				</Button>
			)}
		</div>
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
