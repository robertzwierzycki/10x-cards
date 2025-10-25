import { z } from "zod";

/**
 * Schema walidacji dla formularza logowania
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail jest wymagany")
    .email("Nieprawidłowy format e-mail")
    .max(255, "E-mail jest za długi"),
  password: z.string().min(1, "Hasło jest wymagane").max(255, "Hasło jest za długie"),
});

/**
 * Schema walidacji dla formularza rejestracji
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email jest wymagany")
      .email("Podaj poprawny adres email")
      .max(255, "E-mail jest za długi"),
    password: z.string().min(6, "Hasło musi mieć minimum 6 znaków").max(255, "Hasło jest za długie"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema walidacji dla formularza resetowania hasła (żądanie)
 */
export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail jest wymagany")
    .email("Nieprawidłowy format e-mail")
    .max(255, "E-mail jest za długi"),
});

/**
 * Schema walidacji dla formularza resetowania hasła (ustawienie nowego)
 */
export const resetPasswordConfirmSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków").max(255, "Hasło jest za długie"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

/**
 * Typy wynikowe z schematów
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordRequestData = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordConfirmData = z.infer<typeof resetPasswordConfirmSchema>;
