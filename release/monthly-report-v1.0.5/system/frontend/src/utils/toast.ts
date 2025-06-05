// シンプルなトースト通知の実装
type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

class ToastManager {
  private container: HTMLDivElement | null = null;

  private getContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show({ message, type = 'info', duration = 3000 }: ToastOptions) {
    const container = this.getContainer();
    const toast = document.createElement('div');
    
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }[type];

    toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }, duration);
  }
}

const toastManager = new ToastManager();

export const toast = {
  success: (message: string) => toastManager.show({ message, type: 'success' }),
  error: (message: string) => toastManager.show({ message, type: 'error' }),
  info: (message: string) => toastManager.show({ message, type: 'info' })
};