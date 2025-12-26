/**
 * Vercel Function - Azure Blob Storage Upload
 *
 * Endpoint para upload de autos processuais para Azure Blob Storage
 * Valida arquivos, faz upload e dispara análise automática pelos agentes
 */

import { BlobServiceClient } from "@azure/storage-blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as formidable from "formidable";

interface UploadResponse
{
  success: boolean;
  blobName?: string;
  url?: string;
  size?: number;
  processNumber?: string;
  error?: string;
  taskId?: string;
}

export const config = {
  api: {
    bodyParser: false, // Desabilitar body parser padrão para multipart/form-data
  },
};

export default async function handler (
  req: VercelRequest,
  res: VercelResponse
): Promise<void>
{
  // CORS
  res.setHeader( "Access-Control-Allow-Origin", "*" );
  res.setHeader( "Access-Control-Allow-Methods", "POST, OPTIONS" );
  res.setHeader( "Access-Control-Allow-Headers", "Content-Type" );

  if ( req.method === "OPTIONS" )
  {
    res.status( 200 ).end();
    return;
  }

  if ( req.method !== "POST" )
  {
    res.status( 405 ).json( { error: "Method not allowed" } );
    return;
  }

  try
  {
    // Validar configuração Azure
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "process-documents";

    if ( !connectionString )
    {
      res.status( 500 ).json( {
        success: false,
        error: "Azure Storage não configurado. Defina AZURE_STORAGE_CONNECTION_STRING.",
      } );
      return;
    }

    // Parse form data
    const form = formidable( {
      maxFileSize: 50 * 1024 * 1024, // 50MB max
      filter: ( part: any ) =>
      {
        {
          // Aceitar apenas PDFs, DOC, DOCX, TXT
          const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
          ];
          return part.mimetype ? allowedTypes.includes( part.mimetype ) : false;
        },
      } );

    const [ fields, files ] = await form.parse( req );

    const processNumber = Array.isArray( fields.processNumber )
      ? fields.processNumber[ 0 ]
      : fields.processNumber;

    if ( !processNumber )
    {
      res.status( 400 ).json( {
        success: false,
        error: "Número do processo é obrigatório",
      } );
      return;
    }

    const fileArray = files.file;
    if ( !fileArray || fileArray.length === 0 )
    {
      res.status( 400 ).json( {
        success: false,
        error: "Nenhum arquivo enviado",
      } );
      return;
    }

    const file = fileArray[ 0 ];

    // Conectar ao Azure Blob Storage
    const blobServiceClient =
      BlobServiceClient.fromConnectionString( connectionString );
    const containerClient = blobServiceClient.getContainerClient( containerName );

    // Criar container se não existir
    await containerClient.createIfNotExists( {
      access: "blob",
    } );

    // Gerar nome único para o blob
    const timestamp = Date.now();
    const sanitizedFileName = file.originalFilename?.replace( /[^a-zA-Z0-9.-]/g, "_" ) || "document";
    const blobName = `${ processNumber }/${ timestamp }_${ sanitizedFileName }`;

    // Upload do arquivo
    const blockBlobClient = containerClient.getBlockBlobClient( blobName );

    // Ler arquivo do disco
    const fileBuffer = readFileSync( file.filepath );

    await blockBlobClient.uploadData( fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype || "application/pdf",
      },
      metadata: {
        processNumber,
        originalFileName: file.originalFilename || "",
        uploadedBy: "assistente-juridico",
        uploadedAt: new Date().toISOString(),
        size: file.size.toString(),
      },
    } );

    // Limpar arquivo temporário
    unlinkSync( file.filepath );

    console.log( `[Azure Upload] ✅ Upload concluído: ${ blobName }` );

    // Disparar análise automática (opcional - via webhook ou fila)
    const shouldAnalyze = Array.isArray( fields.autoAnalyze )
      ? fields.autoAnalyze[ 0 ] === "true"
      : fields.autoAnalyze === "true";

    let taskId: string | undefined;

    if ( shouldAnalyze )
    {
      // Criar tarefa para análise pelos agentes
      try
      {
        const analyzeResponse = await fetch(
          `${ process.env.VERCEL_URL || "http://localhost:5173" }/api/agents`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify( {
              type: "ANALISAR_AUTO_PROCESSUAL",
              processNumber,
              blobName,
              url: blockBlobClient.url,
              priority: "high",
              creator: "sistema",
            } ),
          }
        );

        if ( analyzeResponse.ok )
        {
          const data = await analyzeResponse.json();
          taskId = data.taskId;
          console.log( `[Azure Upload] ✅ Análise automática agendada: ${ taskId }` );
        }
      } catch ( error )
      {
        console.error( "[Azure Upload] Erro ao agendar análise:", error );
      }
    }

    const response: UploadResponse = {
      success: true,
      blobName,
      url: blockBlobClient.url,
      size: file.size,
      processNumber,
      taskId,
    };

    res.status( 200 ).json( response );
  } catch ( error )
  {
    console.error( "[Azure Upload] Erro:", error );
    res.status( 500 ).json( {
      success: false,
      error: error instanceof Error ? error.message : "Erro no upload",
    } );
  }
}
