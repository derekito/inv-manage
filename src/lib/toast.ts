interface ToastOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
  // Create a toast element
  const toastElement = document.createElement('div');
  toastElement.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-opacity duration-300 ${
    variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
  }`;

  // Create title element
  const titleElement = document.createElement('div');
  titleElement.className = 'font-semibold';
  titleElement.textContent = title;
  toastElement.appendChild(titleElement);

  // Create description element
  const descElement = document.createElement('div');
  descElement.className = 'text-sm';
  descElement.textContent = description;
  toastElement.appendChild(descElement);

  // Add to document
  document.body.appendChild(toastElement);

  // Remove after 3 seconds
  setTimeout(() => {
    toastElement.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toastElement);
    }, 300);
  }, 3000);
};