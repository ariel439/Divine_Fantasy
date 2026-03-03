import React from 'react';
import { useToastStore, ToastType } from '../stores/useToastStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Sparkles } from 'lucide-react';

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={24} className="text-emerald-400" />;
    case 'error':
      return <AlertCircle size={24} className="text-red-400" />;
    case 'warning':
      return <AlertTriangle size={24} className="text-amber-400" />;
    default:
      return <Info size={24} className="text-sky-400" />;
  }
};

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      // Dark green, almost black theme
      return 'border-emerald-900/40 bg-zinc-950/95 shadow-2xl ring-1 ring-emerald-500/20';
    case 'error':
      return 'border-red-500/50 bg-red-950/90 shadow-red-900/20';
    case 'warning':
      return 'border-amber-500/50 bg-amber-950/90 shadow-amber-900/20';
    default:
      return 'border-sky-500/50 bg-slate-900/90 shadow-sky-900/20';
  }
};

const ToastItem = ({ 
  id, 
  message, 
  type, 
  title, 
  itemImage,
  onClose 
}: { 
  id: string; 
  message: string; 
  type: ToastType; 
  title?: string;
  itemImage?: string;
  onClose: () => void 
}) => {
  const styles = getToastStyles(type);

  return (
    <div className={`
      relative overflow-hidden
      flex items-start gap-5 p-4 rounded-xl border shadow-2xl backdrop-blur-xl 
      min-w-[400px] max-w-[550px]
      animate-in slide-in-from-top-8 fade-in duration-500 ease-out
      ${styles}
    `}>
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Main Content */}
      <div className="flex items-center gap-4 w-full z-10">
        <div className="shrink-0 flex items-center justify-center">
          {itemImage ? (
            <div className="relative group">
               <div className="absolute -inset-2 bg-emerald-500/20 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
               <div className="relative w-14 h-14 bg-zinc-900 rounded-lg border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-inner overflow-hidden">
                <img 
                  src={itemImage} 
                  alt={title || 'item'} 
                  className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                />
               </div>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
              <ToastIcon type={type} />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-0.5">
          {title && (
            <h4 className="font-bold text-xs tracking-[0.2em] text-emerald-400/80 uppercase">
              {title}
            </h4>
          )}
          <p className={`font-medium text-zinc-100 leading-tight ${!title ? 'text-lg' : 'text-base'}`}>
            {message}
          </p>
        </div>

        <button 
          onClick={onClose} 
          className="text-zinc-500 hover:text-white transition-all p-1.5 hover:bg-white/5 rounded-full shrink-0 self-start"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar effect at bottom */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-emerald-500/30 animate-[progress_3s_linear_forwards]" style={{ width: '100%' }} />
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-4 pointer-events-none items-center w-full max-w-xl px-4">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto transition-all duration-500 ease-out">
          <ToastItem
            id={toast.id}
            message={toast.message}
            type={toast.type}
            title={toast.title}
            itemImage={toast.itemImage}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
      <style>{`
        @keyframes progress {
          from { transform: scaleX(1); transform-origin: left; }
          to { transform: scaleX(0); transform-origin: left; }
        }
      `}</style>
    </div>
  );
};
