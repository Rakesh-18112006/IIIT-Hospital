import { AlertCircle, Clock, CheckCircle, X } from 'lucide-react';
import api from '../config/api';

const AnnouncementCard = ({ announcement, userRole, onReact, socket }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
            Active
          </span>
        );
      case 'responded':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Responded / Closed
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const priorityColors = getPriorityColor(announcement.priority);

  return (
    <div className={`border-2 rounded-lg p-4 ${priorityColors}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-bold text-lg">{announcement.title}</h3>
            <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs font-medium uppercase">
              {announcement.priority}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm mb-2">
            <span>Dr. {announcement.doctor?.name}</span>
            <span className="text-gray-500">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(announcement.createdAt).toLocaleString()}
            </span>
          </div>
          {getStatusBadge(announcement.status)}
        </div>
      </div>

      <p className="text-sm mb-4 whitespace-pre-wrap">{announcement.message}</p>

      {announcement.selectedStudent && (
        <div className="mb-3 p-2 bg-white bg-opacity-50 rounded text-sm">
          <span className="font-medium">Selected Student: </span>
          {announcement.selectedStudent.name} ({announcement.selectedStudent.studentId})
        </div>
      )}

      {userRole === 'student' && announcement.status === 'active' && (
        <button
          onClick={() => onReact(announcement._id)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          React / Respond
        </button>
      )}

      {userRole === 'doctor' && announcement.status === 'active' && (
        <div className="text-xs text-gray-600 mt-2">
          Waiting for student responses...
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;
