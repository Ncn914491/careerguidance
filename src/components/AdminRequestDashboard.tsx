'use client';

import { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';

interface AdminRequest {
  id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  reviewed_at: string | null;
  profiles: {
    full_name: string | null;
    email: string;
  };
  reviewer?: {
    full_name: string | null;
    email: string;
  } | null;
}

export default function AdminRequestDashboard() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        throw new Error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setMessage({ type: 'error', text: 'Failed to load admin requests' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'deny') => {
    setProcessingId(requestId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} request`);
      }

      setMessage({ 
        type: 'success', 
        text: `Request ${action === 'approve' ? 'approved' : 'denied'} successfully!` 
      });
      
      // Refresh the requests list
      await fetchRequests();
      
      // Close modal if open
      setSelectedRequest(null);

    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : `Failed to ${action} request` 
      });
    } finally {
      setProcessingId(null);
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
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <UserGroupIcon className="w-6 h-6 text-blue-600" />
        Admin Request Management
      </h2>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Pending Requests */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Pending Requests ({pendingRequests.length})
        </h3>
        
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No pending requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-white/50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(request.status)}
                      <span className="font-medium text-gray-800">
                        {request.profiles.full_name || 'Unknown User'}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({request.profiles.email})
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {request.reason}
                    </p>
                    
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleRequestAction(request.id, 'approve')}
                      disabled={processingId === request.id}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {processingId === request.id ? '...' : 'Approve'}
                    </button>
                    
                    <button
                      onClick={() => handleRequestAction(request.id, 'deny')}
                      disabled={processingId === request.id}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {processingId === request.id ? '...' : 'Deny'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Recent Processed Requests ({processedRequests.length})
        </h3>
        
        {processedRequests.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>No processed requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {processedRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="bg-white/30 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <span className="font-medium text-gray-700 text-sm">
                        {request.profiles.full_name || 'Unknown User'}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {request.reviewed_at && new Date(request.reviewed_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Request Details</h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-600">User:</label>
                <p className="text-gray-800">
                  {selectedRequest.profiles.full_name || 'Unknown User'} 
                  <span className="text-gray-500 text-sm ml-1">
                    ({selectedRequest.profiles.email})
                  </span>
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Reason:</label>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedRequest.reason}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Status:</label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedRequest.status)}
                  <span className={`px-2 py-1 text-sm rounded-full ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted:</label>
                <p className="text-gray-800">{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequestAction(selectedRequest.id, 'approve')}
                    disabled={processingId === selectedRequest.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Approve
                  </button>
                  
                  <button
                    onClick={() => handleRequestAction(selectedRequest.id, 'deny')}
                    disabled={processingId === selectedRequest.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}