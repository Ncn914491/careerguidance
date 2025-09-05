'use client';

import { useState, useEffect } from 'react';
import { UserPlusIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface AdminRequest {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  reviewed_at: string | null;
}

export default function AdminRequestForm() {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingRequest, setExistingRequest] = useState<AdminRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExistingRequest();
  }, []);

  const fetchExistingRequest = async () => {
    try {
      const response = await fetch('/api/admin/requests');
      if (response.ok) {
        const data = await response.json();
        // Find the most recent request for this user
        const userRequest = data.requests?.[0];
        if (userRequest) {
          setExistingRequest(userRequest);
        }
      }
    } catch (error) {
      console.error('Error fetching existing request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!reason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for your admin request' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request');
      }

      setMessage({ type: 'success', text: 'Admin request submitted successfully!' });
      setReason('');
      
      // Refresh the existing request data
      await fetchExistingRequest();

    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to submit request' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'denied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <UserPlusIcon className="w-6 h-6 text-blue-600" />
        Request Admin Access
      </h2>

      {/* Show existing request status if any */}
      {existingRequest && (
        <div className={`mb-6 p-4 rounded-lg border ${getStatusColor(existingRequest.status)}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(existingRequest.status)}
            <span className="font-medium capitalize">{existingRequest.status} Request</span>
          </div>
          <p className="text-sm mb-2">
            <strong>Reason:</strong> {existingRequest.reason}
          </p>
          <p className="text-xs text-gray-600">
            Submitted: {new Date(existingRequest.created_at).toLocaleDateString()}
            {existingRequest.reviewed_at && (
              <span className="ml-2">
                • Reviewed: {new Date(existingRequest.reviewed_at).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Show form only if no pending request */}
      {!existingRequest || existingRequest.status !== 'pending' ? (
        <>
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="admin-request-form">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Admin Access *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                placeholder="Please explain why you need admin access..."
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Explain your role in the project and why you need admin privileges.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSubmitting || !reason.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">
            You have a pending admin request. Please wait for an admin to review it.
          </p>
        </div>
      )}
    </div>
  );
}