import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 bg-grid">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-6xl font-black tracking-tighter glow-text bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">
          AD-STRANGLE
        </h1>
        <p className="text-gray-400 text-lg">
          The ultimate defensive perimeter for your brand. Detect, track, and eliminate ad violations with surgical precision.
        </p>
        <Link 
          href="/dashboard"
          className="inline-block px-8 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 hover:scale-105 transition-all duration-200"
        >
          Enter Telemetry Center
        </Link>
      </div>
    </div>
  );
}
