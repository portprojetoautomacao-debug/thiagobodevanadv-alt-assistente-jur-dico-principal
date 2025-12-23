/**
 * GitHub OAuth Callback Handler
 * Processa o callback do GitHub após autorização OAuth
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extrair code e state dos query params
    const { code, state, error, error_description } = req.query;

    // Tratar erro de autorização
    if (error) {
      console.error("[GitHub OAuth] Erro na autorização:", error_description || error);
      return res.redirect(
        `/?error=github_auth_failed&message=${encodeURIComponent(
          (error_description as string) || (error as string)
        )}`
      );
    }

    // Validar presença do code
    if (!code || typeof code !== "string") {
      console.error("[GitHub OAuth] Code não fornecido");
      return res.redirect("/?error=missing_code");
    }

    // Trocar code por access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state: state as string,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange falhou: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // Obter dados do usuário
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!userResponse.ok) {
      throw new Error(`GitHub user fetch falhou: ${userResponse.status}`);
    }

    const userData = await userResponse.json();

    // Criar sessão (você pode usar cookies ou JWT)
    // Por enquanto, vamos redirecionar com o token nos query params
    // ⚠️ IMPORTANTE: Em produção, use cookies HTTP-only ou sessão segura

    const redirectUrl = new URL("/", process.env.VERCEL_URL || "http://localhost:5173");
    redirectUrl.searchParams.append("github_token", accessToken);
    redirectUrl.searchParams.append("github_user", userData.login);
    redirectUrl.searchParams.append("github_name", userData.name || userData.login);
    redirectUrl.searchParams.append("github_email", userData.email || "");
    redirectUrl.searchParams.append("github_avatar", userData.avatar_url || "");

    console.log("[GitHub OAuth] Autenticação bem-sucedida:", userData.login);

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("[GitHub OAuth] Erro no callback:", error);

    return res.redirect(
      `/?error=github_callback_failed&message=${encodeURIComponent(
        error instanceof Error ? error.message : "Erro desconhecido"
      )}`
    );
  }
}
