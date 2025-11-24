export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('GitHub token exchange failed:', await tokenResponse.text())
      return Response.json({ error: 'Failed to exchange code for token' }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return Response.json({ error: 'No access token received' }, { status: 400 })
    }

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!userResponse.ok) {
      console.error('GitHub user fetch failed:', await userResponse.text())
      return Response.json({ error: 'Failed to fetch user data' }, { status: 400 })
    }

    const userData = await userResponse.json()

    // Get user email (might be private)
    let email = userData.email
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (emailsResponse.ok) {
        const emails = await emailsResponse.json()
        const primaryEmail = emails.find((e: any) => e.primary)
        email = primaryEmail?.email || emails[0]?.email
      }
    }

    // Return user data
    const user = {
      id: userData.id.toString(),
      login: userData.login,
      email: email || '',
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
    }

    return Response.json(user)
  } catch (error) {
    console.error('GitHub auth error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}