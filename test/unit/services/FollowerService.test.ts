import { describe, expect } from '@jest/globals';
import { FollowerListResult, followerSchema, FollowerType } from "../../../src";
import { EtherWallet, Web3Signer, TWalletBaseItem, Web3Digester } from "web3id";
import { ethers } from "ethers";
import { DatabaseConnection } from "../../../src";
import { TQueryListOptions } from "../../../src/models/TQuery";
import { TestUtil } from "denetwork-utils";
import { SchemaUtil } from "../../../src";
import { FollowerService } from "../../../src";
import { resultErrors } from "../../../src";



/**
 *	unit test
 */
describe( "FollowerService", () =>
{
	//
	//	create a wallet by mnemonic
	//
	const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
	const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

	beforeAll( async () =>
	{
		//	assert ...
		expect( walletObj ).not.toBeNull();
		expect( walletObj.mnemonic ).toBe( mnemonic );
		expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
		expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
		expect( walletObj.index ).toBe( 0 );
		expect( walletObj.path ).toBe( ethers.defaultPath );
	} );
	afterAll( async () =>
	{
		//
		//	disconnect
		//
		await new DatabaseConnection().disconnect();
	} );

	//	...
	const followeeAddress : string = `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`.trim().toLowerCase();

	describe( "Add record", () =>
	{
		it( "should add a record to database", async () =>
		{
			//
			//	create a new follower with ether signature
			//
			let follower : FollowerType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				address : followeeAddress,
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			follower.sig = await Web3Signer.signObject( walletObj.privateKey, follower );
			follower.hash = await Web3Digester.hashObject( follower );
			expect( follower.sig ).toBeDefined();
			expect( typeof follower.sig ).toBe( 'string' );
			expect( follower.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const followerService = new FollowerService();
			await followerService.clearAll();

			//	wait for a while
			//await TestUtil.sleep(1000 );

			//	...
			const result = await followerService.add( walletObj.address, follower, follower.sig );
			expect( result ).toBeDefined();

			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( followerSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const key of requiredKeys )
				{
					expect( result ).toHaveProperty( key );
				}
			}


			try
			{
				const resultDup = await followerService.add( walletObj.address, follower, follower.sig );
				expect( resultDup ).toBe( null );
			}
			catch ( err )
			{
				//	MongoServerError: E11000 duplicate key error collection: denetwork.followers index: deleted_1_wallet_1_address_1 dup key: { deleted: ObjectId('000000000000000000000000'), wallet: "0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" }
				//         at /Users/x/Documents/wwwroot/denetwork/js-denetwork-store/node_modules/mongodb/src/operations/insert.ts:85:25
				//         at /Users/x/Documents/wwwroot/denetwork/js-denetwork-store/node_modules/mongodb/src/operations/command.ts:173:14
				//         at processTicksAndRejections (node:internal/process/task_queues:95:5) {
				//       index: 0,
				//       code: 11000,
				//       keyPattern: { deleted: 1, wallet: 1, address: 1 },
				//       keyValue: {
				//         deleted: new ObjectId("000000000000000000000000"),
				//         wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
				//         address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
				//       },
				//       [Symbol(errorLabels)]: Set(0) {}
				//     }

				// console.log( `err: `, JSON.stringify( err ) );
				//	err: {"index":0,"code":11000,"keyPattern":{"deleted":1,"wallet":1,"address":1},"keyValue":{"deleted":"000000000000000000000000","wallet":"0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357","address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}}
				expect( JSON.stringify( err ).includes( `"code":11000,` )
					||
					JSON.stringify( err ).includes( resultErrors.duplicateKeyError )  ).toBeTruthy();
			}

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "should return a record by wallet and address", async () =>
		{
			const followerService = new FollowerService();
			const result : FollowerType | null = await followerService.queryOne( walletObj.address, { by : 'walletAndAddress', address : followeeAddress } );
			expect( result ).not.toBe( null );
			expect( result ).toBeDefined();
			//
			//    console.log( result );
			//    {
			//       _id: new ObjectId("650224f4e471e1a1637722d2"),
			//       timestamp: 1694639348227,
			//       hash: '0xcbc70ff34e94695aa4695b192f8c05b2ce862d595c6744539efda3e67d79cebf',
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x2370448b6d72d4f02b335d35a6f0ebf5f8fc09744530e2e72480d0e245c301cd7d396af0c611fc97473d04e411aa8f7c1ef18fb9f22499b9846e6098e67e7b131c',
			//       address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
			//       name: 'Sam',
			//       avatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       remark: 'no remark',
			//       createdAt: 2023-09-13T21:09:08.227Z,
			//       updatedAt: 2023-09-13T21:09:08.227Z,
			//       __v: 0
			//     }
			//
			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( followerSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const key of requiredKeys )
					{
						expect( result ).toHaveProperty( key );
					}
				}
			}

		}, 60 * 10e3 );
	} );


	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			const followerService = new FollowerService();
			const results : FollowerListResult = await followerService.queryList( walletObj.address, { by : 'walletAndAddress', address : followeeAddress } );
			expect( results ).toHaveProperty( 'total' );
			expect( results ).toHaveProperty( 'list' );
			//
			//    console.log( results );
			//    {
			//       total: 1,
			//       list: [
			//         {
			//           _id: new ObjectId("64f77f309936976f7397f70b"),
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0x1940051530cfec64217770a6ad239ceb9d891e1724e3664b53e17b09117426961a10a7e2a0ae4a7391d13a8b087b03e034ef4cd6d123e8df34ba11b11ed11ee41c',
			//           name: 'Sam',
			//           address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
			//           avatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           remark: 'no remark',
			//           createdAt: 2023-09-05T19:19:12.263Z,
			//           updatedAt: 2023-09-05T19:19:12.263Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( followerSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const follower of results.list )
				{
					for ( const key of requiredKeys )
					{
						expect( follower ).toHaveProperty( key );
					}
				}
			}

		}, 60 * 10e3 );
	} );


	describe( "Query list by pagination", () =>
	{
		it( "should return a list of records by pagination from database", async () =>
		{
			//
			//	create many followers
			//
			const followerService = new FollowerService();
			await followerService.clearAll();

			let walletObjNew : TWalletBaseItem = walletObj;
			for ( let i = 0; i < 100; i ++ )
			{
				const NoStr : string = Number(i).toString().padStart( 2, '0' );

				walletObjNew = EtherWallet.createNewAddress( walletObjNew );
				let follower : FollowerType = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					address : walletObjNew.address,
					sig : ``,
					name : `Sam-${ NoStr }`,
					avatar : `https://avatars.githubusercontent.com/u/142800322?v=4&no=${ NoStr }`,
					remark : `no remark ${ NoStr }`,
					createdAt: new Date(),
					updatedAt: new Date()
				};
				follower.sig = await Web3Signer.signObject( walletObj.privateKey, follower );
				follower.hash = await Web3Digester.hashObject( follower );
				expect( follower.sig ).toBeDefined();
				expect( typeof follower.sig ).toBe( 'string' );
				expect( follower.sig.length ).toBeGreaterThanOrEqual( 0 );

				const result = await followerService.add( walletObj.address, follower, follower.sig );
				expect( result ).toBeDefined();
			}

			//
			//	....
			//
			for ( let page = 1; page <= 10; page ++ )
			{
				const options : TQueryListOptions = {
					pageNo : page,
					pageSize : 10
				};
				const results : FollowerListResult = await followerService.queryList( walletObj.address, { by : 'walletAndAddress', address : undefined, options : options } );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.pageNo ).toBe( options.pageNo );
				expect( results.pageSize ).toBe( options.pageSize );
				//
				//    console.log( results );
				//    {
				//       total: 1,
				//       pageNo: 2,
				//       pageSize: 10,
				//       list: [
				//         {
				//           _id: new ObjectId("64f77f309936976f7397f70b"),
				//           version: '1.0.0',
				//           deleted: new ObjectId("000000000000000000000000"),
				//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
				//           sig: '0x1940051530cfec64217770a6ad239ceb9d891e1724e3664b53e17b09117426961a10a7e2a0ae4a7391d13a8b087b03e034ef4cd6d123e8df34ba11b11ed11ee41c',
				//           name: 'Sam',
				//           address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
				//           avatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
				//           remark: 'no remark',
				//           createdAt: 2023-09-05T19:19:12.263Z,
				//           updatedAt: 2023-09-05T19:19:12.263Z,
				//           __v: 0
				//         }
				//       ]
				//     }
				//
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( followerSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const follower of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( follower ).toHaveProperty( key );
						}
					}
				}
			}

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );


	describe( "Updating", () =>
	{
		it( "should update a record by wallet and address from database", async () =>
		{
			const followerService = new FollowerService();
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			const findContact : FollowerType | null = await followerService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
			expect( findContact ).toBeDefined();
			if ( findContact )
			{
				let followerToBeUpdated : FollowerType = { ...findContact,
					name : `name-${ new Date().toLocaleString() }`,
					avatar : `https://avatar-${ new Date().toLocaleString() }`,
					remark : `remark .... ${ new Date().toLocaleString() }`,
				};
				followerToBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, followerToBeUpdated );
				expect( followerToBeUpdated.sig ).toBeDefined();
				expect( typeof followerToBeUpdated.sig ).toBe( 'string' );
				expect( followerToBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( followerSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();

				//	...
				try
				{
					const updatedContact : FollowerType | null = await followerService.update( walletObj.address, followerToBeUpdated, followerToBeUpdated.sig );
					expect( null === updatedContact ).toBeTruthy();
				}
				catch ( err )
				{
					expect( err ).toBe( resultErrors.updatingBanned );
				}
			}

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Deletion", () =>
	{
		it( "should logically delete a record by wallet and address from database", async () =>
		{
			const followerService = new FollowerService();
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			const findContact : FollowerType | null = await followerService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
			if ( findContact )
			{
				let followerToBeDeleted : FollowerType = { ...findContact,
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				};
				followerToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, followerToBeDeleted );
				expect( followerToBeDeleted.sig ).toBeDefined();
				expect( typeof followerToBeDeleted.sig ).toBe( 'string' );
				expect( followerToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const result : number = await followerService.delete( walletObj.address, followerToBeDeleted, followerToBeDeleted.sig );
				expect( result ).toBeGreaterThanOrEqual( 0 );

				const findContactAgain : FollowerType | null = await followerService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
				expect( findContactAgain ).toBe( null );
			}

		}, 60 * 10e3 );
	} );
} );
