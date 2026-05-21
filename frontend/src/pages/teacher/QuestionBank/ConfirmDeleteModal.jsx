import { FiX } from 'react-icons/fi';

export default function ConfirmDeleteModal({ question, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Xác nhận xóa</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-1.5">Bạn có chắc muốn xóa câu hỏi sau không?</p>
        <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2 mb-5">
          {question.content}
        </p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-danger flex-1" onClick={onConfirm}>Xóa</button>
        </div>
      </div>
    </div>
  );
}
