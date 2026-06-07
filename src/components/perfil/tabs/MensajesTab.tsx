import { Button } from '../../ui/button';
import { MessageCircle, Mail, Award, Phone } from 'lucide-react';
import { cn } from '../../ui/utils';
import { formatDate, getApiUrl } from '../utils';

interface MensajesTabProps {
  user: any;
  isMobile: boolean;
  onRefresh: () => Promise<void>;
}

export function MensajesTab({ user, isMobile, onRefresh }: MensajesTabProps) {
  const unreadCount = user.mensajes?.filter((m: any) => !m.leido).length || 0;

  const handleMarkRead = async (msgId: number) => {
    try {
      const token = localStorage.getItem('amasToken');
      if (!token) return;
      await fetch(getApiUrl(`/auth/mensajes/${msgId}/leido`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await onRefresh();
    } catch { /* silently fail */ }
  };

  if (isMobile) {
    return (
      <div key="messages" className="space-y-4 animate-fade-in-up">
        {unreadCount > 0 && (
          <div className="bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-[#FA7B21]" />
            <span className="text-[#FA7B21] text-sm font-medium">{unreadCount} mensaje{unreadCount > 1 ? 's' : ''} sin leer</span>
          </div>
        )}

        {user.mensajes && user.mensajes.length > 0 ? (
          <div className="space-y-3">
            {user.mensajes.map((msg: any) => (
              <button
                key={msg.id}
                onClick={() => !msg.leido && handleMarkRead(msg.id)}
                className={cn(
                  "w-full text-left bg-zinc-900/80 rounded-2xl overflow-hidden border transition-all",
                  !msg.leido ? "border-l-4 border-l-[#FA7B21] border-zinc-800" : "border-zinc-800/50"
                )}
              >
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {msg.tipo === 'difusion' && <MessageCircle className="w-4 h-4 text-[#FA7B21]" />}
                      {msg.tipo === 'programa' && <Award className="w-4 h-4 text-sky-400" />}
                      {msg.tipo === 'individual' && <Mail className="w-4 h-4 text-emerald-400" />}
                      <span className={cn("text-sm font-semibold", !msg.leido ? "text-white" : "text-zinc-400")}>
                        {msg.asunto}
                      </span>
                    </div>
                    {!msg.leido && <div className="w-2 h-2 rounded-full bg-[#FA7B21]" />}
                  </div>
                  <p className={cn("text-sm leading-relaxed", !msg.leido ? "text-zinc-300" : "text-zinc-500")}>
                    {msg.contenido.length > 120 ? msg.contenido.slice(0, 120) + '...' : msg.contenido}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-2">{formatDate(msg.fecha)}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-zinc-900/50 flex items-center justify-center">
              <MessageCircle className="w-9 h-9 text-zinc-700" />
            </div>
            <h3 className="text-zinc-400 font-medium text-lg mb-2">Sin mensajes</h3>
            <p className="text-sm text-zinc-600">Las comunicaciones apareceran aqui</p>
          </div>
        )}

        <div>
          <Button
            variant="outline"
            className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 h-14 rounded-2xl text-base transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
            onClick={() => window.open('https://wa.me/51989717412', '_blank')}
          >
            <Phone className="w-5 h-5 mr-2" /> Contactar Soporte
          </Button>
        </div>
      </div>
    );
  }

  // ── Desktop Messages ──
  return (
    <div key="messages" className="max-w-3xl animate-fade-in-up">
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-[#FCA929]" />
          Mensajes
        </h3>

        {user?.mensajes && user.mensajes.length > 0 ? (
          <div className="space-y-3">
            {(() => {
              const unread = user.mensajes.filter((m: any) => !m.leido).length;
              return unread > 0 ? (
                <div className="bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-2xl px-4 py-3 flex items-center gap-3 mb-4">
                  <MessageCircle className="w-5 h-5 text-[#FA7B21]" />
                  <span className="text-[#FA7B21] font-medium">{unread} mensaje{unread > 1 ? 's' : ''} sin leer</span>
                </div>
              ) : null;
            })()}
            {user.mensajes.map((msg: any) => (
              <div
                key={msg.id}
                onClick={() => !msg.leido && handleMarkRead(msg.id)}
                className={`cursor-pointer bg-zinc-900 border rounded-2xl p-6 transition-all ${!msg.leido ? 'border-l-4 border-l-[#FA7B21] border-zinc-800' : 'border-zinc-800/50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FA7B21]/20 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[#FCA929]" />
                    </div>
                    <div>
                      <p className={`font-medium ${!msg.leido ? 'text-white' : 'text-white/60'}`}>{msg.asunto}</p>
                      <p className="text-white/40 text-sm">{formatDate(msg.fecha)}</p>
                    </div>
                  </div>
                  {!msg.leido && <div className="w-2.5 h-2.5 rounded-full bg-[#FA7B21]" />}
                </div>
                <p className={`leading-relaxed mt-3 ${!msg.leido ? 'text-white/80' : 'text-white/50'}`}>{msg.contenido}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-white/20" />
            </div>
            <p className="text-white/40 text-lg">No tienes mensajes nuevos</p>
          </div>
        )}
      </div>
    </div>
  );
}
