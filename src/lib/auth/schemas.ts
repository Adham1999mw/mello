import * as yup from "yup";
import type { MessageKey } from "@/i18n/useTranslation";
import { isValidEmail } from "./index";
import { isPasswordOk, isValidPhoneDigits } from "./form";

// One yup schema per sign-in form, used with react-hook-form's yupResolver:
//
//   const { t } = useTranslation();
//   const schema = useMemo(() => signInSchema(t), [t]);
//   useForm<SignInValues>({ resolver: yupResolver(schema), mode: "onTouched" });
//
// Each schema takes `t` so the error messages are in the page's language.
// The phone is kept as its 10 national digits ("1012345678"); save it with toLocalPhone().

type T = (key: MessageKey) => string;

const email = (t: T) =>
  yup
    .string()
    .trim()
    .required(t("auth.errors.required"))
    .test("email", t("auth.errors.invalidEmail"), (v) => !v || isValidEmail(v));

const newPassword = (t: T) =>
  yup.string().required(t("auth.errors.weakPassword")).test("rules", t("auth.errors.weakPassword"), (v) => !v || isPasswordOk(v));

const phone = (t: T) =>
  yup
    .string()
    .required(t("auth.errors.required"))
    .test("phone", t("auth.errors.phone"), (v) => !v || isValidPhoneDigits(v));

const fullName = (t: T) => yup.string().trim().required(t("auth.errors.name")).min(2, t("auth.errors.name")).max(80, t("auth.errors.name"));

/** Sign in: email + password. */
export const signInSchema = (t: T) =>
  yup.object({
    email: email(t),
    password: yup.string().required(t("auth.errors.required")),
  });
export type SignInValues = yup.InferType<ReturnType<typeof signInSchema>>;

/** Sign up: one form with name, mobile, email and password. */
export const signUpSchema = (t: T) =>
  yup.object({
    fullName: fullName(t),
    phone: phone(t),
    email: email(t),
    password: newPassword(t),
  });
export type SignUpValues = yup.InferType<ReturnType<typeof signUpSchema>>;

/** Forgot password: the email to send the reset link to. */
export const forgotPasswordSchema = (t: T) => yup.object({ email: email(t) });
export type ForgotPasswordValues = yup.InferType<ReturnType<typeof forgotPasswordSchema>>;

/** Reset password: a new password, typed twice. */
export const resetPasswordSchema = (t: T) =>
  yup.object({
    password: newPassword(t),
    confirm: yup
      .string()
      .required(t("auth.errors.required"))
      .oneOf([yup.ref("password")], t("auth.errors.noMatch")),
  });
export type ResetPasswordValues = yup.InferType<ReturnType<typeof resetPasswordSchema>>;
