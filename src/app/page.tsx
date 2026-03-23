import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// Home Page — Landing
// ═══════════════════════════════════════════════════════════════════════════════

export default async function HomePage() {
  const supabase = createAdminClient();
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-teal bg-clip-text text-transparent">
              SaaS Core
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              الميزات
            </Link>
            <Link href="#modules" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              الوحدات
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              الأسعار
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/auth/signup"
              className="btn btn-primary"
            >
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-6">
            🚀 منصة SaaS متكاملة باللغة العربية
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            ابنِ أي مشروع SaaS{' '}
            <span className="bg-gradient-to-r from-brand-purple to-brand-teal bg-clip-text text-transparent">
              في أيام بدلاً من أشهر
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            منصة SaaS Core تمنحك الأساس الكامل: تعددية المستأجرين، الاشتراكات، 
            بوابات الدفع، النطاقات المخصصة، ونظام وحدات قابل للتوسع
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn btn-primary btn-lg">
              ابدأ الفترة التجريبية
              <span className="mr-2">←</span>
            </Link>
            <Link
              href="https://github.com/your-org/saas-core"
              target="_blank"
              className="btn btn-outline btn-lg"
            >
              شاهد على GitHub
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            14 يوم تجربة مجانية • لا حاجة لبطاقة ائتمان
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-16 bg-muted/30 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">كل ما تحتاجه للنجاح</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            منصة متكاملة مع كل الميزات الأساسية التي تحتاجها لإطلاق وتنمية مشروع SaaS الخاص بك
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="🏢"
            title="تعددية المستأجرين"
            description="عزل بيانات كامل مع RLS من Supabase. كل عميل يرى بياناته فقط."
          />
          
          <FeatureCard
            icon="💳"
            title="نظام اشتراكات"
            description="خطط متعددة، فواتير تلقائية، وتجديد مستمر مع MyFatoorah"
          />
          
          <FeatureCard
            icon="🌐"
            title="نطاقات مخصصة"
            description="كل عميل يربط نطاقه الخاص مع SSL تلقائي عبر Cloudflare"
          />
          
          <FeatureCard
            icon="🧩"
            title="نظام وحدات"
            description="فعّل/أعطّل وحدات حسب نوع المشروع: متجر، مواقع، محاسبة..."
          />
          
          <FeatureCard
            icon="🔐"
            title="أمان متقدم"
            description="مصادقة متعددة العوامل، صلاحيات دقيقة، وسجل تدقيق كامل"
          />
          
          <FeatureCard
            icon="📊"
            title="تحليلات وتقارير"
            description="لوحة تحكم شاملة مع إحصائيات وتقارير قابلة للتخصيص"
          />
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">وحدات قابلة للتفعيل</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اختر الوحدات التي تحتاجها وفعّلها بنقرة واحدة
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModuleCard
            icon="🛒"
            name="متجر إلكتروني"
            description="منتجات، طلبات، سلة تسوق، كوبونات، شحن"
            color="bg-brand-purple"
          />
          
          <ModuleCard
            icon="🌐"
            name="بناء صفحات"
            description="drag & drop، قوالب، SEO، نشر فوري"
            color="bg-brand-teal"
          />
          
          <ModuleCard
            icon="📊"
            name="محاسبة"
            description="فواتير ZATCA، حسابات، تقارير مالية"
            color="bg-brand-yellow"
          />
          
          <ModuleCard
            icon="👥"
            name="موارد بشرية"
            description="موظفين، رواتب، حضور، إجازات، GOSI"
            color="bg-brand-red"
          />
          
          <ModuleCard
            icon="🤝"
            name="إدارة عملاء"
            description="جهات اتصال، صفقات، pipeline مبيعات"
            color="bg-brand-blue"
          />
          
          <ModuleCard
            icon="🤖"
            name="وكيل AI"
            description="ردود تلقائية للواتساب/سناب"
            color="bg-green-500"
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-16 bg-muted/30 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">خطط بسيطة وواضحة</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ابدأ مجاناً وادفع فقط عندما تنمو
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans && plans.length > 0 ? plans.map((plan) => {
            const features: string[] = Array.isArray(plan.features)
              ? plan.features
              : typeof plan.features === 'object' && plan.features !== null
                ? Object.values(plan.features as Record<string, string>)
                : [];
            return (
              <PricingCard
                key={plan.id}
                name={plan.name_ar}
                price={String(Number(plan.price) === 0 ? '0' : Number(plan.price).toLocaleString('ar-SA'))}
                period={plan.billing_interval === 'monthly' ? 'شهرياً' : plan.billing_interval === 'yearly' ? 'سنوياً' : plan.billing_interval}
                description={plan.description_ar || ''}
                features={features}
                cta={Number(plan.price) === 0 ? 'ابدأ مجاناً' : 'ابدأ الفترة التجريبية'}
                popular={plan.is_featured || false}
              />
            );
          }) : (
            <div className="md:col-span-3 text-center text-muted-foreground py-8">
              لا توجد خطط متاحة حالياً
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-brand-purple to-brand-teal rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">جاهز للبدء؟</h2>
          <p className="text-lg mb-8 opacity-90">
            ابدأ الفترة التجريبية المجانية اليوم — لا حاجة لبطاقة ائتمان
          </p>
          <Link href="/auth/signup" className="btn bg-white text-brand-purple hover:bg-white/90 btn-lg">
            أنشئ حسابك المجاني
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">SaaS Core</h3>
              <p className="text-sm text-muted-foreground">
                منصة SaaS متكاملة باللغة العربية
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">المنتج</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">الميزات</Link></li>
                <li><Link href="#modules" className="hover:text-foreground">الوحدات</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">الأسعار</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">المصادر</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground">التوثيق</Link></li>
                <li><Link href="/api" className="hover:text-foreground">API</Link></li>
                <li><Link href="https://github.com/your-org/saas-core" className="hover:text-foreground">GitHub</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">الشركة</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">من نحن</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">اتصل بنا</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">الخصوصية</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SaaS Core Platform. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function ModuleCard({
  icon,
  name,
  description,
  color,
}: {
  icon: string;
  name: string;
  description: string;
  color: string;
}) {
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{name}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  popular,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}) {
  return (
    <div className={`card p-8 ${popular ? 'border-brand-purple ring-2 ring-brand-purple/20' : ''}`}>
      {popular && (
        <div className="inline-block bg-brand-purple text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          الأكثر شعبية
        </div>
      )}
      
      <h3 className="font-bold text-xl mb-2">{name}</h3>
      <p className="text-muted-foreground text-sm mb-6">{description}</p>
      
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground"> ر.س</span>
        <span className="text-muted-foreground text-sm">/{period}</span>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span className="text-brand-teal mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link
        href="/auth/signup"
        className={`btn w-full ${popular ? 'btn-primary' : 'btn-outline'}`}
      >
        {cta}
      </Link>
    </div>
  );
}
