#!/usr/bin/env node
/**
 * Script de Teste: Resend Email Service
 *
 * Testa o envio de email usando a API do Resend
 * Verifica se a configuração está correta
 *
 * Uso: node --loader ts-node/esm scripts/test-resend-email.ts
 */

import { config } from 'dotenv';
import { Resend } from 'resend';

// Carregar variáveis de ambiente
config();

async function testResendEmail ()
{
    console.log( '🚀 Testando Resend Email Service...\n' );

    // Verificar se a API Key está configurada
    const apiKey = process.env.RESEND_API_KEY;
    if ( !apiKey )
    {
        console.error( '❌ ERRO: RESEND_API_KEY não está configurada no arquivo .env' );
        process.exit( 1 );
    }

    console.log( '✅ API Key encontrada:', apiKey.substring( 0, 10 ) + '...' );

    // Inicializar o cliente Resend
    const resend = new Resend( apiKey );

    try
    {
        console.log( '\n📧 Enviando email de teste...' );

        const { data, error } = await resend.emails.send( {
            from: process.env.EMAIL_FROM || 'Assistente Jurídico <onboarding@resend.dev>',
            to: 'thiagobodevanadvocacia@gmail.com',
            subject: '✅ Teste - Resend Email Service Configurado',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">🎉 Resend Email Service Ativo!</h1>
          <p>Parabéns! O serviço de email do <strong>Assistente Jurídico PJe</strong> está configurado e funcionando corretamente.</p>

          <h2>📋 Detalhes da Configuração:</h2>
          <ul>
            <li><strong>API Key:</strong> ${ apiKey.substring( 0, 15 ) }...</li>
            <li><strong>Remetente:</strong> ${ process.env.EMAIL_FROM || 'onboarding@resend.dev' }</li>
            <li><strong>Data/Hora:</strong> ${ new Date().toLocaleString( 'pt-BR' ) }</li>
          </ul>

          <h2>✨ Próximos Passos:</h2>
          <ol>
            <li>Configure notificações de prazos críticos</li>
            <li>Ative alertas de novas intimações</li>
            <li>Configure resumos diários automáticos</li>
          </ol>

          <div style="background-color: #f3f4f6; padding: 15px; margin-top: 20px; border-radius: 8px;">
            <p style="margin: 0;"><strong>💡 Dica:</strong> Você pode personalizar os templates de email em <code>api/lib/email-service.ts</code></p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 14px;">
            Este é um email de teste automático enviado pelo sistema.<br>
            <strong>Assistente Jurídico PJe</strong> - Gestão Inteligente de Processos
          </p>
        </div>
      `,
        } );

        if ( error )
        {
            console.error( '\n❌ ERRO ao enviar email:', error );
            process.exit( 1 );
        }

        console.log( '\n✅ Email enviado com sucesso!' );
        console.log( '📬 ID da mensagem:', data?.id );
        console.log( '\n🎯 Verifique sua caixa de entrada: thiagobodevanadvocacia@gmail.com' );
        console.log( '💡 Pode levar alguns segundos para chegar.' );

    } catch ( error )
    {
        console.error( '\n❌ ERRO na execução:', error );
        process.exit( 1 );
    }
}

// Executar teste
testResendEmail();
