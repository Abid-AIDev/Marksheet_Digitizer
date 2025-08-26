// src/app/login/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - MarkSheet Digitizer',
  description: 'Login to access MarkSheet Digitizer.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
