# ✅ shadcn/ui Components — التثبيت والإعداد

## 🎉 تم التثبيت بنجاح!

تم إعداد **shadcn/ui** بنجاح مع جميع المكونات الأساسية.

---

## 📦 المكونات المثبتة

| المكون | الملف | الوصف |
|--------|-------|-------|
| **Button** | `src/components/ui/button.tsx` | أزرار بجميع الأنواع |
| **Card** | `src/components/ui/card.tsx` | بطاقات مع Header/Content/Footer |
| **Input** | `src/components/ui/input.tsx` | حقول إدخال |
| **Label** | `src/components/ui/label.tsx` | تسميات للحقول |
| **Badge** | `src/components/ui/badge.tsx` | شارات/Tags |
| **Dialog** | `src/components/ui/dialog.tsx` | نوافذ منبثقة |
| **Toast** | `src/components/ui/toast.tsx` | إشعارات |
| **Toaster** | `src/components/ui/toaster.tsx` | حاوية الإشعارات |
| **Table** | `src/components/ui/table.tsx` | جداول |
| **Dropdown Menu** | `src/components/ui/dropdown-menu.tsx` | قوائم منسدلة |

---

## 🛠️ Utility Functions

### `cn()` - دمج الكلاسات

```typescript
import { cn } from '@/lib/utils';

// استخدام
<div className={cn('base-class', isActive && 'active-class')} />
```

### `useToast()` - الإشعارات

```typescript
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: 'نجاح!',
      description: 'تمت العملية بنجاح',
      variant: 'success',
    });
  };

  const handleError = () => {
    toast({
      title: 'خطأ',
      description: 'حدث خطأ ما',
      variant: 'destructive',
    });
  };

  return (
    // ...
  );
}
```

---

## 📱 أمثلة الاستخدام

### Button

```typescript
import { Button } from '@/components/ui/button';

function MyComponent() {
  return (
    <div className="space-x-2">
      <Button>افتراضي</Button>
      <Button variant="secondary">ثانوي</Button>
      <Button variant="destructive">تدمير</Button>
      <Button variant="outline">محدد</Button>
      <Button variant="ghost">شبحي</Button>
      <Button variant="link">رابط</Button>
      
      <Button size="sm">صغير</Button>
      <Button size="lg">كبير</Button>
      <Button size="icon">أيقونة</Button>
      
      <Button disabled>معطل</Button>
    </div>
  );
}
```

### Card

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function ProductCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>اسم المنتج</CardTitle>
        <CardDescription>وصف قصير للمنتج</CardDescription>
      </CardHeader>
      <CardContent>
        <p>تفاصيل المنتج...</p>
      </CardContent>
      <CardFooter>
        <Button>شراء الآن</Button>
      </CardFooter>
    </Card>
  );
}
```

### Input + Label

```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" placeholder="name@example.com" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" type="password" />
      </div>
    </div>
  );
}
```

### Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function DeleteDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">حذف</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">إلغاء</Button>
          <Button variant="destructive">حذف</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Toast Notifications

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="space-x-2">
      <Button
        onClick={() =>
          toast({
            title: 'نجاح!',
            description: 'تمت العملية بنجاح',
          })
        }
      >
        نجاح
      </Button>

      <Button
        variant="destructive"
        onClick={() =>
          toast({
            title: 'خطأ',
            description: 'حدث خطأ ما',
            variant: 'destructive',
          })
        }
      >
        خطأ
      </Button>

      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: 'تحذير',
            description: 'يرجى الانتباه',
            variant: 'warning',
          })
        }
      >
        تحذير
      </Button>
    </div>
  );
}
```

### Table

```typescript
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const invoices = [
  {
    invoice: 'INV001',
    paymentStatus: 'Paid',
    totalAmount: '$250.00',
    paymentMethod: 'Credit Card',
  },
  // ...
];

export function InvoiceTable() {
  return (
    <Table>
      <TableCaption>قائمة الفواتير الأخيرة</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>رقم الفاتورة</TableHead>
          <TableHead>حالة الدفع</TableHead>
          <TableHead>المبلغ</TableHead>
          <TableHead>طريقة الدفع</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell>{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.totalAmount}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Dropdown Menu

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">حسابي</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>القائمة</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
        <DropdownMenuItem>الإعدادات</DropdownMenuItem>
        <DropdownMenuItem>الفواتير</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">تسجيل الخروج</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Badge

```typescript
import { Badge } from '@/components/ui/badge';

function StatusBadges() {
  return (
    <div className="space-x-2">
      <Badge>افتراضي</Badge>
      <Badge variant="secondary">ثانوي</Badge>
      <Badge variant="destructive">تدمير</Badge>
      <Badge variant="success">نجاح</Badge>
      <Badge variant="warning">تحذير</Badge>
      <Badge variant="outline">محدد</Badge>
    </div>
  );
}
```

---

## 🎨 التخصيص

### Tailwind Config

المكونات تستخدم CSS Variables من `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 252 100% 69%;
  --primary-foreground: 0 0% 100%;
  /* ... */
}
```

### تغيير الألوان

في `globals.css`:

```css
:root {
  /* تغيير اللون الأساسي */
  --primary: 252 100% 69%; /* بنفسجي */
  
  /* أو لأي لون آخر */
  --primary: 174 100% 42%; /* تركواز */
}
```

---

## 📁 هيكل الملفات

```
src/
├── components/
│   └── ui/
│       ├── button.tsx         ✅
│       ├── card.tsx           ✅
│       ├── input.tsx          ✅
│       ├── label.tsx          ✅
│       ├── badge.tsx          ✅
│       ├── dialog.tsx         ✅
│       ├── toast.tsx          ✅
│       ├── toaster.tsx        ✅
│       ├── table.tsx          ✅
│       └── dropdown-menu.tsx  ✅
│
├── hooks/
│   └── use-toast.ts           ✅
│
└── lib/
    └── utils.ts               ✅
```

---

## 🚀 إضافة مكونات إضافية

لتثبيت مكونات إضافية من shadcn/ui:

```bash
# Avatar
npx shadcn@latest add avatar

# Scroll Area
npx shadcn@latest add scroll-area

# Select
npx shadcn@latest add select

# Checkbox
npx shadcn@latest add checkbox

# Radio Group
npx shadcn@latest add radio-group

# Switch
npx shadcn@latest add switch

# Tabs
npx shadcn@latest add tabs

# Tooltip
npx shadcn@latest add tooltip

# Popover
npx shadcn@latest add popover

# Command
npx shadcn@latest add command

# Skeleton
npx shadcn@latest add skeleton

# Separator
npx shadcn@latest add separator

# Progress
npx shadcn@latest add progress

# Alert
npx shadcn@latest add alert

# Calendar
npx shadcn@latest add calendar

# Date Picker
# (راجع التوثيق: https://ui.shadcn.com/docs/components/date-picker)
```

---

## 🔗 روابط مهمة

| المصدر | الرابط |
|--------|--------|
| shadcn/ui Docs | https://ui.shadcn.com/docs |
| Components | https://ui.shadcn.com/docs/components |
| GitHub | https://github.com/shadcn/ui |
| Installation | https://ui.shadcn.com/docs/installation |

---

## ✅ Checklist

- [x] تثبيت shadcn/ui
- [x] إضافة Button
- [x] إضافة Card
- [x] إضافة Input
- [x] إضافة Label
- [x] إضافة Badge
- [x] إضافة Dialog
- [x] إضافة Toast
- [x] إضافة Table
- [x] إضافة Dropdown Menu
- [x] إعداد Toaster في layout
- [x] إنشاء useToast hook
- [x] إنشاء cn() utility

---

**الحالة:** ✅ **مكتمل**  
**المكونات المتاحة:** 10  
**الوقت التالي:** البدء في بناء Dashboard

---

*تم التحديث: 2025-03-20*
