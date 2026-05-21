import { FiTrash2 } from 'react-icons/fi';

export default function RelativeDeleteModal({ relative, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiTrash2 size={22} className="text-red-500" />
          </div>
          <h3 className="font-semibold text-gray-900">Xóa người thân</h3>
          <p className="text-sm text-gray-500 mt-2">
            Xóa <span className="font-semibold text-gray-800">{relative.name}</span> khỏi danh sách?
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-danger flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}
