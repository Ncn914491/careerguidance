import { HomePage } from '@/components/features/HomePage';
import { AuthRedirect } from '@/components/AuthRedirect';

export default function Home() {
  return (
    <>
      <AuthRedirect />
      <HomePage />
    </>
  );
}
