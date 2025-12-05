/**
 * Trusted Types Implementation
 *
 * Trusted Types é uma API de segurança do navegador que ajuda a prevenir
 * ataques de DOM-based XSS, exigindo que valores passados para "sinks"
 * perigosos (como innerHTML) sejam criados por políticas aprovadas.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
 * @see https://web.dev/trusted-types/
 */

// Tipo genérico para policy com todas as opções
type FullTrustedTypePolicy = {
  readonly name: string;
  createHTML(input: string, ...args: unknown[]): TrustedHTML;
  createScript(input: string, ...args: unknown[]): TrustedScript;
  createScriptURL(input: string, ...args: unknown[]): TrustedScriptURL;
};

// Estado - usando tipo union para aceitar políticas parciais
let defaultPolicy: FullTrustedTypePolicy | null = null;
let sanitizerPolicy: Pick<FullTrustedTypePolicy, "name" | "createHTML"> | null = null;

// Lista de domínios permitidos para scripts
const ALLOWED_SCRIPT_ORIGINS = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://apis.google.com",
  "https://accounts.google.com",
  "https://vercel.live",
  "https://*.vercel.app",
  "https://*.sentry.io",
  // Origem local
  globalThis.window?.location?.origin ?? "",
];

// Tags HTML permitidas para sanitização
const ALLOWED_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "code",
  "dd",
  "del",
  "div",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

// Atributos permitidos
const ALLOWED_ATTRS = new Set([
  "href",
  "src",
  "alt",
  "title",
  "class",
  "id",
  "target",
  "rel",
  "width",
  "height",
  "colspan",
  "rowspan",
  "scope",
]);

/**
 * Verifica se Trusted Types é suportado pelo navegador
 */
export function isTrustedTypesSupported(): boolean {
  return (
    globalThis.window?.trustedTypes !== undefined &&
    typeof globalThis.window?.trustedTypes?.createPolicy === "function"
  );
}

// ===== Sanitization Helpers (reduces S3776 Cognitive Complexity) =====

/**
 * Verifica se um atributo href/src contém valor perigoso
 */
function isDangerousUrlValue(value: string): boolean {
  const normalizedValue = value.toLowerCase().trim();
  return (
    normalizedValue.startsWith("javascript:") ||
    normalizedValue.startsWith("data:text/html") ||
    normalizedValue.startsWith("vbscript:")
  );
}

/**
 * Verifica se um atributo é um event handler (onclick, onload, etc.)
 */
function isEventHandler(attrName: string): boolean {
  return attrName.toLowerCase().startsWith("on");
}

/**
 * Processa um único atributo e remove se não permitido
 */
function sanitizeAttribute(element: Element, attr: Attr): void {
  const attrName = attr.name.toLowerCase();

  // Remove atributos não permitidos
  if (!ALLOWED_ATTRS.has(attrName)) {
    element.removeAttribute(attr.name);
    return;
  }

  // Verifica valores de href/src perigosos
  if ((attrName === "href" || attrName === "src") && isDangerousUrlValue(attr.value)) {
    element.removeAttribute(attr.name);
    return;
  }

  // Remove event handlers
  if (isEventHandler(attrName)) {
    element.removeAttribute(attr.name);
  }
}

/**
 * Sanitiza todos os atributos de um elemento
 */
function sanitizeElementAttributes(element: Element): void {
  const attrs = Array.from(element.attributes);
  for (const attr of attrs) {
    sanitizeAttribute(element, attr);
  }
}

/**
 * Substitui tag não permitida por seu conteúdo de texto
 */
function replaceDisallowedTag(element: Element): void {
  const textContent = element.textContent || "";
  element.replaceWith(document.createTextNode(textContent));
}

/**
 * Sanitiza um nó DOM recursivamente
 */
function sanitizeNode(node: Node): void {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  // Remove tags não permitidas
  if (!ALLOWED_TAGS.has(tagName)) {
    replaceDisallowedTag(element);
    return;
  }

  // Sanitiza atributos
  sanitizeElementAttributes(element);

  // Recursivamente sanitiza filhos
  Array.from(element.childNodes).forEach(sanitizeNode);
}

/**
 * Sanitiza HTML removendo tags e atributos perigosos
 */
function sanitizeHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

/**
 * Verifica se uma origem corresponde a um padrão com wildcard
 */
function matchesWildcardOrigin(
  parsedOrigin: string,
  parsedHref: string,
  allowedPattern: string
): boolean {
  if (allowedPattern.includes("*")) {
    const pattern = allowedPattern.replace("*", "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(parsedOrigin);
  }
  return parsedOrigin === allowedPattern || parsedHref.startsWith(allowedPattern);
}

/**
 * Valida se uma URL de script é permitida
 */
function validateScriptURL(url: string): boolean {
  try {
    const parsed = new URL(url, globalThis.location.origin);

    // Permite URLs relativas (mesma origem)
    if (parsed.origin === globalThis.location.origin) {
      return true;
    }

    // Verifica contra lista de origens permitidas
    return ALLOWED_SCRIPT_ORIGINS.some((allowed) =>
      matchesWildcardOrigin(parsed.origin, parsed.href, allowed)
    );
  } catch {
    return false;
  }
}

/**
 * Inicializa as políticas de Trusted Types
 */
export function initTrustedTypes(): void {
  if (!isTrustedTypesSupported()) {
    console.info("🔒 Trusted Types: Não suportado neste navegador");
    return;
  }

  try {
    // Política padrão (fallback) - mais permissiva, para compatibilidade
    defaultPolicy = globalThis.window.trustedTypes!.createPolicy("default", {
      createHTML: (input: string) => {
        // Log para debugging em dev
        if (import.meta.env.DEV) {
          console.warn("🔒 Trusted Types (default): createHTML chamado", input.substring(0, 100));
        }
        // Sanitiza input
        return sanitizeHTML(input);
      },
      createScript: (_input: string) => {
        // Scripts inline geralmente não são permitidos
        console.warn("🔒 Trusted Types (default): createScript bloqueado");
        return "";
      },
      createScriptURL: (input: string) => {
        if (validateScriptURL(input)) {
          return input;
        }
        console.warn("🔒 Trusted Types (default): URL bloqueada:", input);
        return "about:blank";
      },
    });

    // Política para sanitização de HTML do usuário
    sanitizerPolicy = globalThis.window.trustedTypes!.createPolicy("sanitizer", {
      createHTML: (input: string) => sanitizeHTML(input),
    });

    // Política para o React (innerHTML interno)
    globalThis.window.trustedTypes!.createPolicy("react", {
      createHTML: (input: string) => input, // React já sanitiza
    });

    // Política para GTM
    globalThis.window.trustedTypes!.createPolicy("gtm", {
      createScript: (input: string) => input,
      createScriptURL: (input: string) => {
        if (input.includes("googletagmanager.com") || input.includes("google-analytics.com")) {
          return input;
        }
        return "about:blank";
      },
    });

    // Política para Sentry
    globalThis.window.trustedTypes!.createPolicy("sentry", {
      createScriptURL: (input: string) => {
        if (input.includes("sentry.io") || input.includes("browser.sentry-cdn.com")) {
          return input;
        }
        return "about:blank";
      },
    });

    console.log(
      "✅ Trusted Types inicializado com políticas: default, sanitizer, react, gtm, sentry"
    );
  } catch (error) {
    console.error("❌ Falha ao inicializar Trusted Types:", error);
  }
}

/**
 * Cria HTML seguro usando a política de sanitização
 */
export function createSafeHTML(unsafeHTML: string): TrustedHTML | string {
  if (sanitizerPolicy) {
    return sanitizerPolicy.createHTML(unsafeHTML);
  }
  // Fallback: sanitiza manualmente se Trusted Types não disponível
  return sanitizeHTML(unsafeHTML);
}

/**
 * Verifica se um valor é TrustedHTML
 */
export function isTrustedHTML(value: unknown): value is TrustedHTML {
  if (!isTrustedTypesSupported()) {
    return typeof value === "string";
  }
  return globalThis.window.trustedTypes!.isHTML(value);
}

/**
 * Cria URL de script segura
 */
export function createSafeScriptURL(url: string): TrustedScriptURL | string {
  if (!validateScriptURL(url)) {
    console.warn("🔒 URL de script não permitida:", url);
    return "about:blank";
  }

  if (defaultPolicy) {
    return defaultPolicy.createScriptURL(url);
  }
  return url;
}

/**
 * Hook para usar em componentes React que precisam de innerHTML
 *
 * @example
 * ```tsx
 * function MyComponent({ htmlContent }: { htmlContent: string }) {
 *   const safeHTML = useSafeHTML(htmlContent);
 *   return <div dangerouslySetInnerHTML={{ __html: safeHTML }} />;
 * }
 * ```
 */
export function getSafeInnerHTML(html: string): string {
  const safe = createSafeHTML(html);
  return typeof safe === "string" ? safe : safe.toString();
}

/**
 * Retorna a política padrão (para uso avançado)
 */
export function getDefaultPolicy(): FullTrustedTypePolicy | null {
  return defaultPolicy;
}

/**
 * Retorna a política de sanitização (para uso avançado)
 */
export function getSanitizerPolicy(): Pick<FullTrustedTypePolicy, "name" | "createHTML"> | null {
  return sanitizerPolicy;
}
