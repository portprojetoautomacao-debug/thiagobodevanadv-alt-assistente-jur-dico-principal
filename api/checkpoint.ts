/**
 * API Endpoint - Checkpoint Management
 *
 * Endpoints para gerenciar checkpoints de execução de agentes:
 * - GET /api/checkpoint/:executionId - Obter último checkpoint
 * - GET /api/checkpoint/:executionId/list - Listar todos checkpoints
 * - GET /api/checkpoint/:executionId/summary - Resumo de checkpoints
 * - DELETE /api/checkpoint/:executionId - Limpar checkpoints
 * - POST /api/checkpoint/cleanup - Limpar checkpoints antigos (cron)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    clearCheckpoints,
    getCheckpointSummary,
    getLastCheckpoint,
    hasCheckpoints,
    listCheckpoints
} from '../src/lib/checkpoint-service.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { executionId } = req.query;
    const action = req.query.action as string | undefined;

    // POST /api/checkpoint/cleanup - Limpar checkpoints antigos (cron)
    if (req.method === 'POST' && !executionId && action === 'cleanup') {
      return handleCleanupOldCheckpoints(req, res);
    }

    // Validar executionId para outras operações
    if (!executionId || typeof executionId !== 'string') {
      return res.status(400).json({
        error: 'executionId é obrigatório',
        usage: {
          getLastCheckpoint: 'GET /api/checkpoint/:executionId',
          listCheckpoints: 'GET /api/checkpoint/:executionId?action=list',
          getSummary: 'GET /api/checkpoint/:executionId?action=summary',
          clearCheckpoints: 'DELETE /api/checkpoint/:executionId'
        }
      });
    }

    // GET - Operações de leitura
    if (req.method === 'GET') {
      // Listar todos os checkpoints
      if (action === 'list') {
        const checkpoints = await listCheckpoints(executionId);
        return res.status(200).json({
          executionId,
          count: checkpoints.length,
          checkpoints
        });
      }

      // Obter resumo
      if (action === 'summary') {
        const summary = await getCheckpointSummary(executionId);

        if (!summary) {
          return res.status(404).json({
            error: 'Nenhum checkpoint encontrado',
            executionId
          });
        }

        return res.status(200).json({
          executionId,
          ...summary
        });
      }

      // Obter último checkpoint (padrão)
      const checkpoint = await getLastCheckpoint(executionId);

      if (!checkpoint) {
        return res.status(404).json({
          error: 'Nenhum checkpoint encontrado',
          executionId
        });
      }

      return res.status(200).json({
        executionId,
        checkpoint,
        canRecover: true
      });
    }

    // DELETE - Limpar checkpoints
    if (req.method === 'DELETE') {
      const exists = await hasCheckpoints(executionId);

      if (!exists) {
        return res.status(404).json({
          error: 'Nenhum checkpoint encontrado para limpar',
          executionId
        });
      }

      await clearCheckpoints(executionId);

      return res.status(200).json({
        success: true,
        message: 'Checkpoints removidos com sucesso',
        executionId
      });
    }

    // Método não permitido
    return res.status(405).json({
      error: 'Método não permitido',
      allowedMethods: ['GET', 'DELETE', 'POST']
    });
  } catch (error) {
    console.error('[Checkpoint API Error]', error);
    const err = error as Error;
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Erro desconhecido'
    });
  }
}

/**
 * Handler para limpeza automática de checkpoints antigos
 * Chamado por cron job (ex: diariamente)
 */
async function handleCleanupOldCheckpoints(req: VercelRequest, res: VercelResponse) {
  try {
    // TODO: Implementar lógica de varredura do Redis
    // Por enquanto, confiar no TTL automático (24h)

    return res.status(200).json({
      success: true,
      message: 'Limpeza automática via TTL do Redis (24h)',
      note: 'Checkpoints expiram automaticamente após 24 horas'
    });
  } catch (error) {
    console.error('[Checkpoint Cleanup Error]', error);
    const err = error as Error;
    return res.status(500).json({
      error: 'Erro ao executar limpeza',
      message: err.message || 'Erro desconhecido'
    });
  }
}
