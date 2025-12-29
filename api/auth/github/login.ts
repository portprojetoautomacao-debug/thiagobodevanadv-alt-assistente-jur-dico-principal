/**
 * GitHub OAuth Login Handler
 * Inicia o fluxo de autenticação OAuth com GitHub
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes } from "node:crypto";

export default async function handler ( req: VercelRequest, res: VercelResponse )
{
  try
  {
    const clientId = process.env.GITHUB_CLIENT_ID;

    if ( !clientId )
    {
      return res.status( 500 ).json( {
        error: "GitHub OAuth não configurado",
        message: "GITHUB_CLIENT_ID não encontrado nas variáveis de ambiente",
      } );
    }

    // Gerar state aleatório para CSRF protection
    const state = randomBytes( 16 ).toString( "hex" );

    // Construir URL de autorização do GitHub
    const authUrl = new URL( "https://github.com/login/oauth/authorize" );
    authUrl.searchParams.append( "client_id", clientId );
    authUrl.searchParams.append(
      "redirect_uri",
      `${ process.env.VERCEL_URL || "http://localhost:5173" }/api/auth/github/callback`
    );
    authUrl.searchParams.append( "scope", "read:user user:email" );
    authUrl.searchParams.append( "state", state );

    // ⚠️ IMPORTANTE: Em produção, armazene o state em sessão para validar no callback
    // Por enquanto, vamos apenas gerar e enviar

    console.log( "[GitHub OAuth] Redirecionando para autorização:", authUrl.toString() );

    return res.redirect( authUrl.toString() );
  } catch ( error )
  {
    console.error( "[GitHub OAuth] Erro ao iniciar login:", error );

    return res.status( 500 ).json( {
      error: "Erro ao iniciar autenticação",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    } );
  }
}
