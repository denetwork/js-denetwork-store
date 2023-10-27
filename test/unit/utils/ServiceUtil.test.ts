import { describe, expect } from '@jest/globals';
import { ServiceUtil } from "../../../src";



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

	describe( "Get Web3Store method names", () =>
	{
		it( "should return Web3Store method names", async () =>
		{
			const methods : Array<string> = ServiceUtil.getWeb3StoreMethodNames();
			//
			//	console.log( methods )
			//	should output:
			//	[ 'add', 'update', 'updateFor', 'delete', 'queryOne', 'queryList' ]
			//
			expect( methods ).toBeDefined();
			expect( Array.isArray( methods ) ).toBeTruthy();
			expect( methods.length ).toBeGreaterThan( 0 );

		}, 60 * 10e3 );
	} );
} );
