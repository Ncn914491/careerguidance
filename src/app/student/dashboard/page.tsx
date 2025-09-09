import { StudentDashboard } from '@/components/features/StudentDashboard/StudentDashboard';
import { AuthGuard } from '@/components/ui/AuthGuard';

export default function StudentDashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <StudentDashboard />
    </AuthGuard>
  );
}