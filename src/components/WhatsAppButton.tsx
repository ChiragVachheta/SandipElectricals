import { BUSINESS } from '@/lib/types';
import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const href = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(
    'Hello Sandip Electricals, I have a query about your products.'
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-transform hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7" fill="currentColor" />
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
    </a>
  );
}
