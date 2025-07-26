import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold text-foreground mb-2">B.U.C.K. AI</h2>
        <p className="text-muted-foreground">Your AI Chief Financial Officer</p>
      </div>
    </div>
  )
}