import { beforeAll, expect, test } from "vitest";
import handler from "../../api/agents-v2";
import { HYBRID_AGENTS_DISABLED } from "../../src/lib/hybrid-agents-integration";

interface MockResponse
{
  statusCode?: number;
  payload?: Record<string, unknown>;
  headers: Record<string, string>;
  setHeader: ( k: string, v: string ) => MockResponse;
  status: ( code: number ) => MockResponse;
  json: ( payload: Record<string, unknown> ) => MockResponse;
  end: () => MockResponse;
}

function makeReq ( body: Record<string, unknown>, apiKey = "test-autogen-key" )
{
  return {
    method: "POST",
    headers: {
      authorization: `Bearer ${ apiKey }`,
      "content-type": "application/json",
    },
    body,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function makeRes (): MockResponse
{
  const result = {} as MockResponse;
  result.headers = {};
  result.setHeader = ( k: string, v: string ) =>
  {
    result.headers[ k ] = v;
    return result;
  };
  result.status = ( code: number ) =>
  {
    result.statusCode = code;
    return result;
  };
  result.json = ( payload: Record<string, unknown> ) =>
  {
    result.payload = payload;
    return result;
  };
  result.end = () => result;
  return result;
}

beforeAll( () =>
{
  // Configurar variáveis de ambiente para testes
  process.env.AUTOGEN_API_KEY = "test-autogen-key";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.UPSTASH_REDIS_REST_URL = "http://localhost:8079";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  // Mock para resend evitar erro de API key
  process.env.RESEND_API_KEY = "re_test_key_123";
} );

test( "POST /api/agents-v2 executa agente LangGraph com sucesso", async () =>
{
  const req = makeReq( { agentId: "harvey", message: "Analisar caso com prazo curto" } );
  const res = makeRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await handler( req as any, res as any );

  if ( HYBRID_AGENTS_DISABLED )
  {
    expect( res.statusCode ).toBe( 400 );
    expect( res.payload?.error ).toContain( "has no v2/hybrid implementation" );
    return;
  }

  expect( res.statusCode ).toBe( 200 );
  expect( res.payload ).toBeDefined();
  expect( res.payload?.success ).toBe( true );
  expect( res.payload?.data ).toBeDefined();
  expect( res.payload?.mode ).toBe( "langgraph" );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect( ( res.payload?.data as any )?.langGraphResult?.completed ).toBe( true );
} );
