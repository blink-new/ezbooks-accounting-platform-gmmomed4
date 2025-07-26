import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
})

export default blink