import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Create SweetAlert2 instance with React content support
const MySwal = withReactContent(Swal);

// Configure default settings
MySwal.mixin({
  customClass: {
    popup: 'rounded-xl shadow-xl border-0',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors',
    cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors',
    title: 'text-gray-900 font-semibold',
    content: 'text-gray-700',
    htmlContainer: 'text-gray-700'
  },
  buttonsStyling: false,
  confirmButtonColor: '#dc2626', // red-600
  cancelButtonColor: '#6b7280', // gray-500
  showClass: {
    popup: 'animate-fade-in',
    backdrop: 'animate-fade-in'
  },
  hideClass: {
    popup: 'animate-fade-out',
    backdrop: 'animate-fade-out'
  }
});

// Helper functions for common alert types
export const showSuccess = (title: string, text?: string) => {
  return MySwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#16a34a', // green-600
    customClass: {
      popup: 'rounded-xl shadow-xl border-0',
      confirmButton: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors',
      title: 'text-gray-900 font-semibold',
      content: 'text-gray-700',
      htmlContainer: 'text-gray-700'
    }
  });
};

export const showError = (title: string, text?: string) => {
  return MySwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#dc2626', // red-600
    customClass: {
      popup: 'rounded-xl shadow-xl border-0',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors',
      title: 'text-gray-900 font-semibold',
      content: 'text-gray-700',
      htmlContainer: 'text-gray-700'
    }
  });
};

export const showWarning = (title: string, text?: string) => {
  return MySwal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#d97706', // amber-600
    customClass: {
      popup: 'rounded-xl shadow-xl border-0',
      confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors',
      title: 'text-gray-900 font-semibold',
      content: 'text-gray-700',
      htmlContainer: 'text-gray-700'
    }
  });
};

export const showInfo = (title: string, text?: string) => {
  return MySwal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonColor: '#2563eb', // blue-600
    customClass: {
      popup: 'rounded-xl shadow-xl border-0',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors',
      title: 'text-gray-900 font-semibold',
      content: 'text-gray-700',
      htmlContainer: 'text-gray-700'
    }
  });
};

export const showConfirm = (title: string, text: string, confirmText = 'Ya', cancelText = 'Batal') => {
  return MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#dc2626', // red-600
    cancelButtonColor: '#6b7280', // gray-500
    customClass: {
      popup: 'rounded-xl shadow-xl border-0',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors',
      cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors',
      title: 'text-gray-900 font-semibold',
      content: 'text-gray-700',
      htmlContainer: 'text-gray-700'
    }
  });
};

export default MySwal;


