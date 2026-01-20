function MeshGradient() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-950">
      {/* Animated gradient orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-30 blur-[100px] animate-blob"
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)' }}
      />
      <div
        className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-25 blur-[100px] animate-blob animation-delay-2000"
        style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)' }}
      />
      <div
        className="absolute bottom-[-10%] left-[30%] w-[550px] h-[550px] rounded-full opacity-20 blur-[100px] animate-blob animation-delay-4000"
        style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #d946ef 100%)' }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}

export default MeshGradient;
