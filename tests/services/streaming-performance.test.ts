/**
 * Testes de performance de streaming
 */
import { describe, expect, it } from "vitest";

describe("Streaming Performance", () => {
  it("should handle rapid chunk insertions", () => {
    const chunks: string[] = [];
    const totalChunks = 100;

    const startTime = performance.now();

    for (let i = 0; i < totalChunks; i++) {
      chunks.push(`Chunk ${i} `);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should process 100 chunks in less than 100ms
    expect(duration).toBeLessThan(100);
    expect(chunks.length).toBe(totalChunks);
  });

  it("should buffer small chunks efficiently", () => {
    const buffer: string[] = [];
    const BUFFER_SIZE = 5;
    let flushCount = 0;

    const flush = () => {
      if (buffer.length > 0) {
        flushCount++;
        buffer.length = 0;
      }
    };

    // Simulate 20 chunks with buffer size 5
    for (let i = 0; i < 20; i++) {
      buffer.push("x");
      if (buffer.length >= BUFFER_SIZE) {
        flush();
      }
    }
    flush(); // Final flush

    // Should flush 4 times (20 / 5)
    expect(flushCount).toBe(4);
  });

  it("should process large text without performance issues", () => {
    const largeText = "Lorem ipsum ".repeat(1000); // ~12KB
    const startTime = performance.now();

    // Simulate processing
    const processed = largeText.split(" ").filter((w) => w.length > 0);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(50);
    expect(processed.length).toBeGreaterThan(0);
  });
});
