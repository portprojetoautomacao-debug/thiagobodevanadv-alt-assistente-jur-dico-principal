/**
 * Vite Plugin: Phosphor Icon Optimizer
 *
 * Faz análise estática dos imports de @phosphor-icons/react e
 * registra no build quantos ícones estão sendo usados.
 *
 * Útil para:
 *  - Monitorar se o bundle está crescendo demais por excesso de ícones
 *  - Ajudar a identificar oportunidades de refatorar para imports mais enxutos
 */

import type { Plugin } from 'vite'

export function phosphorIconOptimizer(): Plugin {
  const usedIcons = new Set<string>()

  // Sem flag "g" aqui para não ter problema com lastIndex em múltiplos .test()
  const iconPattern = /from\s+['"]@phosphor-icons\/react['"]/
  const importPattern =
    /import\s+\{([^}]+)\}\s+from\s+['"]@phosphor-icons\/react['"]/g

  return {
    name: 'phosphor-icon-optimizer',

    enforce: 'pre',

    transform(code: string, id: string) {
      // Ignorar arquivos externos irrelevantes
      if (
        !/\.(?:[cm]?[jt]sx?)$/.test(id) || // js, jsx, ts, tsx, mjs, cjs
        id.includes('node_modules') ||
        id.includes('dist')
      ) {
        return undefined
      }

      // Se não importar @phosphor-icons/react, ignora
      if (!iconPattern.test(code)) return undefined

      let match: RegExpExecArray | null
      while ((match = importPattern.exec(code)) !== null) {
        const imports = match[1]

        const iconNames = imports
          .split(',')
          .map((name) => name.trim())
          .filter((name) => !!name && name !== 'default')

        for (const name of iconNames) {
          usedIcons.add(name)
        }
      }

      return undefined
    },

    buildEnd() {
      if (usedIcons.size === 0) {
        console.log('\n📦 Phosphor Icons Optimizer: nenhum ícone nomeado detectado.')
        return
      }

      const TOTAL_ICONS_ESTIMATE = 1514
      const savings =
        ((TOTAL_ICONS_ESTIMATE - usedIcons.size) / TOTAL_ICONS_ESTIMATE) * 100

      console.log('\n📦 Phosphor Icons Optimizer:')
      console.log(`   Ícones utilizados: ${usedIcons.size}`)
      console.log(
        `   Estimativa de economia potencial: ~${Math.max(
          0,
          Math.round(savings),
        )}% do bundle de ícones`,
      )
      console.log(
        `   Exemplos: ${[...usedIcons].slice(0, 10).join(', ')}${
          usedIcons.size > 10 ? '…' : ''
        }`,
      )
    },
  }
}
