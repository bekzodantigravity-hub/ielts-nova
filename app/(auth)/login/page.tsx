import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Kirish — IELTS Nova",
  description: "IELTS Nova nomzod kabinetiga kirish sahifasi.",
};

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
