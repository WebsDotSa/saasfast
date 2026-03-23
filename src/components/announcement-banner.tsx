'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Info, AlertTriangle, Wrench, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'update' | 'alert' | 'maintenance';
  priority: number;
  metadata: {
    link?: string;
    button_text?: string;
  };
  created_at: string;
}

const typeConfig = {
  info: {
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-600',
  },
  update: {
    icon: Megaphone,
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-600',
  },
  alert: {
    icon: AlertTriangle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-600',
  },
  maintenance: {
    icon: Wrench,
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    text: 'text-yellow-600',
  },
};

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      const result = await response.json();

      if (result.success) {
        setAnnouncements(result.data);
        if (result.data.length > 0) {
          setCurrent(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleDismiss = async () => {
    if (!current) return;

    try {
      await fetch('/api/announcements/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: current.id }),
      });

      setVisible(false);
      
      // إظهار الإعلان التالي
      const remaining = announcements.filter(a => a.id !== current.id);
      setCurrent(remaining.length > 0 ? remaining[0] : null);
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  };

  if (!current || !visible) return null;

  const Icon = typeConfig[current.type]?.icon || Info;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 border-b animate-in slide-in-from-top',
        typeConfig[current.type]?.bg,
        typeConfig[current.type]?.border,
        'border-b'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', typeConfig[current.type]?.text)} />
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className={cn('font-bold text-sm', typeConfig[current.type]?.text)}>
            {current.title}
          </h4>
          {current.metadata?.link && (
            <a
              href={current.metadata.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'text-xs flex items-center gap-1 hover:underline',
                typeConfig[current.type]?.text
              )}
            >
              المزيد
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{current.content}</p>
      </div>

      <button
        onClick={handleDismiss}
        className="p-1 hover:bg-black/5 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
