# Java configuration for SonarLint (project)

This file captures the local VS Code SonarLint configuration we use for this project.

## Key config in `.vscode/settings.json`

```json
{
  "sonarlint.pathToNodeExecutable": "/usr/local/share/nvm/versions/node/v22.21.1/bin/node",
  "sonarlint.ls.javaHome": "/usr/lib/jvm/java-21-openjdk-amd64",
  "sonarlint.connectedMode.connections.sonarcloud": [
    {
      "connectionId": "thiagobodevan-a11y",
      "organizationKey": "thiagobodevan-a11y"
    }
  ],
  "sonarlint.connectedMode.project": {
    "connectionId": "thiagobodevan-a11y",
    "projectKey": "thiagobodevan-a11y_assistente-juridico-p"
  }
}
```

## Troubleshooting tips

- Ensure Java (JRE) is installed and `sonarlint.ls.javaHome` is set.
- For Node, point `sonarlint.pathToNodeExecutable` to the Node 22 path (nvm or system).

## How to verify

```bash
java -version
which java
node --version
which node
```

## Reload VS Code & SonarLint

- `Developer: Reload Window` in the Command Palette
- Check the SonarLint output channel for logs
