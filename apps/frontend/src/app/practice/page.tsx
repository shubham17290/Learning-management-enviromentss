import { Suspense } from "react";
import { PracticeSetupPage } from "@/features/practice/practice-setup";
import { RequireAuth } from "@/components/layout/guards";

export default function Page() { return <RequireAuth><Suspense><PracticeSetupPage /></Suspense></RequireAuth>; }
