'use client';

import { AuthGuard } from '@/components/ui/AuthGuard';
import { ManageCareerResources } from '@/components/features/AdminDashboard/ManageCareerResources';

function CareerResourcesPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-6 py-8">
        <ManageCareerResources />
      </div>
    </div>
  );
}

export default function CareerResourcesPage() {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <CareerResourcesPageContent />
    </AuthGuard>
  );
}
