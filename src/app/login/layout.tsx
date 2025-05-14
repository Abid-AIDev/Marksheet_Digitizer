// src/app/login/layout.tsx
import type { Metadata } from 'next';
// RootLayout already imports globals.css and sets up the Inter font for the body.
// This layout only needs to provide its specific metadata and render children.

export const metadata: Metadata = {
  title: 'Login - MarkSheet Digitizer',
  description: 'Login to access MarkSheet Digitizer.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout renders its children directly.
  // The RootLayout handles the <html> and <body> tags.
  return <>{children}</>;
}
