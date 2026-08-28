import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { PromptManager } from '@/components/ai/PromptManager'
export default function AI(){
  return <AppShell><h1 className="text-2xl font-bold">AI Assistant</h1><p className="text-sm text-zinc-500">Provider abstraction — switch providers without rebuilding. Safety: never invent business facts, names, stats.</p>
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card><h3 className="font-semibold">Prompt Template (editable)</h3><div className="mt-3"><PromptManager /></div></Card>
      <Card><h3 className="font-semibold">Capabilities</h3>
        <ul className="text-sm mt-3 space-y-2 list-disc ml-5">
          <li><b>Generate outreach</b> — from user instruction + variables</li>
          <li><b>Personalize</b> — template + lead → tailored (no hallucination)</li>
          <li><b>Analyze lead</b> — website/marketing/SEO opportunities via /api/ai/analyze</li>
          <li><b>Follow-up</b> — uses thread context via /api/ai/generate</li>
          <li><b>Reply assistant</b> — suggests response, user approves before send</li>
        </ul>
        <p className="text-xs text-zinc-500 mt-4">Free tier: FreeAIProvider variable substitution. Paid: set AI_API_KEY → OpenAIProvider.</p>
      </Card>
    </div>
  </AppShell>
}
