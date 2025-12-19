// frontend/components/PolicyLayout.tsx
type Props = {
  title: string;
  children: React.ReactNode;
};

export default function PolicyLayout({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-[#050816] text-gray-100">
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold">UltraGPT</div>
          <nav className="flex gap-4 text-sm text-gray-400">
            <a href="/plans" className="hover:text-white">Plans</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/refund-policy" className="hover:text-white">Refunds</a>
            <a href="/delivery-policy" className="hover:text-white">Delivery</a>
            <a href="/contact" className="hover:text-white">Contact</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        <div className="bg-[#0b1120] rounded-2xl border border-gray-800 p-6 leading-relaxed text-sm space-y-4">
          {children}
        </div>
      </main>

      <footer className="border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6 text-xs text-gray-500 flex flex-wrap gap-4 justify-between">
          <span>© {new Date().getFullYear()} UltraGPT. All rights reserved.</span>
          <div className="flex gap-3">
            <a href="/terms" className="hover:text-gray-300">Terms</a>
            <a href="/privacy" className="hover:text-gray-300">Privacy</a>
            <a href="/refund-policy" className="hover:text-gray-300">Refunds</a>
            <a href="/delivery-policy" className="hover:text-gray-300">Delivery</a>
            <a href="/contact" className="hover:text-gray-300">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
