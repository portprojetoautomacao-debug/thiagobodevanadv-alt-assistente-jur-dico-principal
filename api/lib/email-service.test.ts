import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendDailySummaryEmail,
  sendEmail,
  sendNotificationEmail,
  sendUrgentDeadlineAlert,
} from "./email-service";

// Mock Resend
vi.mock("resend", () => {
  const mockSend = vi.fn().mockResolvedValue({
    data: { id: "mock-email-id-123" },
    error: null,
  });

  return {
    Resend: class MockResend {
      emails = {
        send: mockSend,
      };
    },
  };
});

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simular variável de ambiente
    process.env.RESEND_API_KEY = "test-api-key";
  });

  describe("sendEmail", () => {
    it("deve enviar email com sucesso", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("mock-email-id-123");
      expect(result.error).toBe(null);
    });

    it("deve retornar erro quando RESEND_API_KEY não está configurada", async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("RESEND_API_KEY não configurada");
      expect(result.messageId).toBe(null);
    });

    it("deve aceitar múltiplos destinatários", async () => {
      const result = await sendEmail({
        to: ["test1@example.com", "test2@example.com"],
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(true);
    });

    it("deve aceitar tags opcionais", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        tags: [{ name: "tipo", value: "teste" }],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("sendNotificationEmail", () => {
    it("deve enviar email de notificação com actionUrl", async () => {
      const result = await sendNotificationEmail(
        "operator@example.com",
        "Nova Intimação",
        "Você recebeu uma nova intimação no processo 123",
        "https://app.example.com/process/123"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
    });

    it("deve enviar email de notificação sem actionUrl", async () => {
      const result = await sendNotificationEmail(
        "operator@example.com",
        "Atualização",
        "Atualização do sistema"
      );

      expect(result.success).toBe(true);
    });
  });

  describe("sendUrgentDeadlineAlert", () => {
    it("deve enviar alerta urgente de prazo", async () => {
      const result = await sendUrgentDeadlineAlert(
        "lawyer@example.com",
        "1234567-89.2025.8.26.0100",
        "2025-12-15 17:00",
        "Contestação"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
    });

    it("deve incluir número do processo no email", async () => {
      const result = await sendUrgentDeadlineAlert(
        "lawyer@example.com",
        "0001234-56.2025.5.02.0999",
        "Amanhã 17:00",
        "Manifestação"
      );

      expect(result.success).toBe(true);
    });
  });

  describe("sendDailySummaryEmail", () => {
    it("deve enviar resumo diário com métricas", async () => {
      const summary = {
        processesMonitored: 150,
        deadlinesFound: 8,
        documentsGenerated: 12,
        errorsCount: 2,
      };

      const result = await sendDailySummaryEmail("manager@example.com", summary);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
    });

    it("deve aceitar métricas zeradas", async () => {
      const summary = {
        processesMonitored: 0,
        deadlinesFound: 0,
        documentsGenerated: 0,
        errorsCount: 0,
      };

      const result = await sendDailySummaryEmail("manager@example.com", summary);

      expect(result.success).toBe(true);
    });
  });
});
