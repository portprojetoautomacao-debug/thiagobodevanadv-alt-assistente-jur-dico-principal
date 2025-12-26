import { describe, expect, it } from "vitest";
import { isExpedienteArray } from "./type-guards";

describe( "type-guards", () =>
{
  describe( "isExpedienteArray", () =>
  {
    it( "deve retornar true para array válido de expedientes", () =>
    {
      const validData: unknown = [
        { id: "1", numero: "001", tipo: "intimacao" },
        { id: "2", numero: "002", tipo: "citacao" },
      ];

      expect( isExpedienteArray( validData ) ).toBe( true );
    } );

    it( "deve retornar true para array com um único expediente", () =>
    {
      const validData: unknown = [
        { id: "1", numero: "001", tipo: "intimacao" },
      ];

      expect( isExpedienteArray( validData ) ).toBe( true );
    } );

    it( "deve retornar false para array vazio", () =>
    {
      const emptyArray: unknown = [];

      expect( isExpedienteArray( emptyArray ) ).toBe( false );
    } );

    it( "deve retornar false para null", () =>
    {
      expect( isExpedienteArray( null ) ).toBe( false );
    } );

    it( "deve retornar false para undefined", () =>
    {
      expect( isExpedienteArray( undefined ) ).toBe( false );
    } );

    it( "deve retornar false para string", () =>
    {
      expect( isExpedienteArray( "not an array" ) ).toBe( false );
    } );

    it( "deve retornar false para number", () =>
    {
      expect( isExpedienteArray( 123 ) ).toBe( false );
    } );

    it( "deve retornar false para objeto simples", () =>
    {
      expect( isExpedienteArray( { id: "1" } ) ).toBe( false );
    } );

    it( "deve retornar false para array de números", () =>
    {
      expect( isExpedienteArray( [ 1, 2, 3 ] ) ).toBe( false );
    } );

    it( "deve retornar false para array de strings", () =>
    {
      expect( isExpedienteArray( [ "a", "b", "c" ] ) ).toBe( false );
    } );

    it( "deve retornar false para array de null", () =>
    {
      expect( isExpedienteArray( [ null, null ] ) ).toBe( false );
    } );

    it( "deve retornar false para array de objetos sem propriedade 'id'", () =>
    {
      const invalidData: unknown = [
        { numero: "001", tipo: "intimacao" },
        { numero: "002", tipo: "citacao" },
      ];

      expect( isExpedienteArray( invalidData ) ).toBe( false );
    } );

    it( "deve realizar narrowing de tipo correto", () =>
    {
      const data: unknown = [ { id: "1", numero: "001" } ];

      if ( isExpedienteArray( data ) )
      {
        // TypeScript deve reconhecer data como Expediente[]
        const firstId: string = data[ 0 ].id;
        expect( firstId ).toBe( "1" );
      }
    } );
  } );
} );
