import { describe, it, expect } from "vitest";
import { agentSchema, type Agent } from "../agent.schema";

describe("agentSchema", () => {
  it("should validate a correct agent object", () => {
    const validAgent: Agent = {
      id: "harvey",
      name: "Harvey Specter",
      active: true,
      capabilities: ["strategic-analysis", "performance-monitoring"],
    };

    expect(() => agentSchema.parse(validAgent)).not.toThrow();
  });

  it("should throw on missing required fields", () => {
    const invalidAgent = {
      id: "harvey",
      // name missing
      active: true,
    };

    expect(() => agentSchema.parse(invalidAgent)).toThrow();
  });

  it("should throw on invalid capability", () => {
    const invalidAgent = {
      id: "harvey",
      name: "Harvey Specter",
      active: true,
      capabilities: ["invalid-capability"],
    };

    expect(() => agentSchema.parse(invalidAgent)).toThrow();
  });

  it("should accept agent without capabilities", () => {
    const validAgent = {
      id: "test",
      name: "Test Agent",
      active: false,
      capabilities: [],
    };

    expect(() => agentSchema.parse(validAgent)).not.toThrow();
  });

  it("should validate all capability types", () => {
    const allCapabilities = [
      "strategic-analysis",
      "performance-monitoring",
      "risk-identification",
      "data-analysis",
      "intimation-analysis",
      "deadline-identification",
      "task-generation",
      "priority-assessment",
      "document-analysis",
      "text-extraction",
      "entity-recognition",
      "classification",
    ];

    const validAgent = {
      id: "all-caps",
      name: "All Capabilities Agent",
      active: true,
      capabilities: allCapabilities,
    };

    expect(() => agentSchema.parse(validAgent)).not.toThrow();
  });
});
