export default function WorkforceLoading() {
  return (
    <div className="h-screen w-full bg-[#0A0F1A] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-[200px] h-[200px] rounded-full bg-slate-800/50 animate-pulse" />
        <div className="w-48 h-4 bg-slate-800/50 rounded animate-pulse" />
        <div className="w-64 h-12 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
