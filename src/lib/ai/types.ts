export interface AIProvider {
  id: string
  generateMessage(prompt: string, variables: Record<string,string>): Promise<string>
  personalizeMessage(template: string, lead: Record<string,string>): Promise<string>
  analyzeLead(lead: Record<string,string>): Promise<string>
  generateFollowup(thread: string, instruction: string): Promise<string>
  suggestReply(inbound: string, context: string): Promise<string>
}
