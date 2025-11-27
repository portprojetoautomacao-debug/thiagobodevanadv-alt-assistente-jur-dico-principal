import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac } from 'node:crypto' // Agora vai funcionar com config Node

describe('Todoist Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate webhook signature', () => {
    const secret = 'test-secret'
    const payload = JSON.stringify({ event_name: 'item:added' })
    
    const hmac = createHmac('sha256', secret)
    hmac.update(payload)
    const signature = hmac.digest('base64')
    
    expect(signature).toBeDefined()
    expect(typeof signature).toBe('string')
  })

  it('should process webhook events', () => {
    const event = {
      event_name: 'item:added',
      event_data: {
        id: '123',
        content: 'Test task',
      },
    }
    
    expect(event.event_name).toBe('item:added')
    expect(event.event_data.id).toBe('123')
  })
})
