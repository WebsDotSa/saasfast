'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useCallback } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  { value: 'active', label: 'نشط' },
  { value: 'trial', label: 'تجريبي' },
  { value: 'suspended', label: 'معلق' },
  { value: 'cancelled', label: 'ملغي' },
];

export function TenantsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || '';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = () => {
    router.push(pathname);
  };

  const hasFilters = currentSearch || currentStatus;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          defaultValue={currentSearch}
          onChange={(e) => {
            const val = e.target.value;
            const timer = setTimeout(() => updateParam('search', val), 400);
            return () => clearTimeout(timer);
          }}
          placeholder="بحث بالاسم أو البريد أو الـ slug..."
          className="pr-9"
        />
      </div>

      <div className="flex gap-1 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={currentStatus === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateParam('status', opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground">
          <X className="h-3 w-3" />
          مسح
        </Button>
      )}
    </div>
  );
}
