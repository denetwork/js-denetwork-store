import { describe, expect } from '@jest/globals';
import { postSchema, SchemaUtil, ServiceUtil } from "../../../src";



/**
 *	unit test
 */
describe( "ServiceUtil", () =>
{
	beforeAll( async () =>
	{
	} );
	afterAll( async () =>
	{
	} );

	describe( "getRequiredKeys", () =>
	{
		it( "should return required Keys of schema by Schema", async () =>
		{
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
			expect( requiredKeys ).toBeDefined();
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				expect( requiredKeys.length ).toBeGreaterThan( 0 );
			}

		}, 60 * 10e3 );

		it( "should return required Keys of schema by schema name", async () =>
		{
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( 'post' );
			expect( requiredKeys ).toBeDefined();
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				expect( requiredKeys.length ).toBeGreaterThan( 0 );
			}

		}, 60 * 10e3 );
	} );
} );
