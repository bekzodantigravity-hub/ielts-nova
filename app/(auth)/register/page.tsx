import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish — IELTS Nova",
  description: "IELTS Nova nomzod hisobini yaratish sahifasi.",
};

export default function RegisterPage() {
  return <AuthScreen mode="register" />;
}
