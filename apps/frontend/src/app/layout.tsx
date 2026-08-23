// PHASE 5 §17 — app shell: providers + navbar + main landmark.
import "./../styles/globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/components/ui/overlay";
import { Navbar } from "@/components/layout/navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main id="main">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
