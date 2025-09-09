import { AdminDashboard } from '@/components/features/AdminDashboard/AdminDashboard';
import { AuthGuard } from '@/components/ui/AuthGuard';

export default function AdminDashboardPage() {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <AdminDashboard />
    </AuthGuard>
  );
}