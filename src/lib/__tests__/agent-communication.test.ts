import { describe, it, expect, beforeEach } from 'vitest';
import { communicationHub, notifyAgents } from '../agent-communication';

describe('AgentCommunicationHub', () => {
  beforeEach(() => {
    // Clear state
    // @ts-ignore - using internal state for testing
    communicationHub['messages'].length = 0;
    // @ts-ignore
    communicationHub['contexts'].clear();
  });

  it('sanitizes content and data on sendMessage', async () => {
    const malicious = {
      fromAgentId: 'harvey',
      type: 'notification' as any,
      priority: 'medium' as any,
      content: '<script>alert(1)</script>hello',
      data: { x: "<img src=1 onerror=alert(1) />" },
    };

    const msg = await communicationHub.sendMessage(malicious as any);

    expect(msg.content).toBe('hello'); // script tags removed during sanitization
    expect(msg.data?.x).not.toContain('<img');
  });

  it('getMessages returns recent messages respecting limit', async () => {
    // send 10 messages
    for (let i = 0; i < 10; i++) {
      await communicationHub.sendMessage({
        fromAgentId: 'harvey',
        type: 'notification',
        priority: 'low',
        content: `m${i}`,
      });
    }

    const last3 = communicationHub.getMessages('harvey', 3);
    expect(last3).toHaveLength(3);
    expect(last3[0].content).toBe('m7');
    expect(last3[2].content).toBe('m9');
  });

  it('evicts contexts and keeps indices consistent', async () => {
    // create many contexts
    for (let i = 0; i < 520; i++) {
      await communicationHub.setContext({
        type: 'test',
        data: { i },
        createdBy: 'harvey',
        accessibleBy: ['harvey'],
      });
    }

    // ensure contexts count less or equal to MAX_CONTEXTS
    // @ts-ignore
    const size = communicationHub['contexts'].size();
    expect(size).toBeLessThanOrEqual(500);
  });
});
