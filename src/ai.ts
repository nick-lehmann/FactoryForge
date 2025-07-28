import { google } from '@ai-sdk/google'
import { streamText, tool } from 'ai'
import z from 'zod'

const model = google("gemini-2.5-flash-preview-04-17")

const abortCtrl = new AbortController()

process.on('SIGTERM', () => {
  console.log('Terminating AI stream')
  abortCtrl.abort()
})

const response = await streamText({
  model, 
  prompt: 'What is love?',
  // providerOptions: { }
  abortSignal: abortCtrl.signal,
  tools: {
    weather: tool({
      description: 'Get the weather for a certain location',
      parameters: z.object({
        location: z.string().describe('The location (e.g. the city)')  
      })
    })

  } 
})

// for await (const chunk of response.fullStream) {
//   chunk.type
// }

for await (const chunk of response.textStream) {
  process.stdout.write(chunk)
}
console.log('')

console.log('Provider metadata: ', await response.providerMetadata)
console.log('Model id: ', (await (response.response)).modelId)
console.log('Usage: ', await response.usage)
