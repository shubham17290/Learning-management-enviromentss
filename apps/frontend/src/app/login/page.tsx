import { Suspense } from "react";
import { LoginPage } from "@/features/auth/auth-pages";

export default function Page() { return <Suspense><LoginPage /></Suspense>; }