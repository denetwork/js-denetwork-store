import { describe, expect } from '@jest/globals';
import { ContactListResult, contactSchema, ContactType } from "../../../src";
import { EtherWallet, Web3Signer, TWalletBaseItem, Web3Digester } from "web3id";
import { ethers } from "ethers";
import { ContactService } from "../../../src";
import { DatabaseConnection } from "../../../src";
import { TQueryListOptions } from "../../../src/models/TQuery";
import { SchemaUtil } from "../../../src";
import { resultErrors } from "../../../src";



/**
 *	unit test
 */
describe( "ContactService", () =>
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

		//	clear up all
		const contactService = new ContactService();
		await contactService.clearAll();
	} );
	afterAll( async () =>
	{
		//
		//	disconnect
		//
		await new DatabaseConnection().disconnect();
	} );

	describe( "Add record", () =>
	{
		it( "should add a record to database", async () =>
		{
			//
			//	create a new contact with ether signature
			//
			let contact : ContactType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				address : '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			contact.sig = await Web3Signer.signObject( walletObj.privateKey, contact );
			contact.hash = await Web3Digester.hashObject( contact );
			expect( contact.sig ).toBeDefined();
			expect( typeof contact.sig ).toBe( 'string' );
			expect( contact.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const contactService = new ContactService();

			//	wait for a while
			//await TestUtil.sleep(100 );

			//	...
			const result = await contactService.add( walletObj.address, contact, contact.sig );
			expect( result ).toBeDefined();

			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( contactSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const key of requiredKeys )
				{
					expect( result ).toHaveProperty( key );
				}
			}

			//	wait for a while
			//await TestUtil.sleep(100 );

			try
			{
				const resultDup = await contactService.add( walletObj.address, contact, contact.sig );
				expect( resultDup ).not.toBeDefined();
			}
			catch ( err )
			{
				//	MongoServerError: E11000 duplicate key error collection: denetwork.contacts index: deleted_1_wallet_1_address_1 dup key: { deleted: ObjectId('000000000000000000000000'), wallet: "0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" }
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

				//console.log( `err: `, JSON.stringify( err ) );
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
		it( "should return a record by wallet and address from database", async () =>
		{
			const contactService = new ContactService();
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			const result : ContactType | null = await contactService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
			//
			//    console.log( result );
			//    {
			//       _id: new ObjectId("64f77f5bec0dc99ac8b63d2e"),
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x1940051530cfec64217770a6ad239ceb9d891e1724e3664b53e17b09117426961a10a7e2a0ae4a7391d13a8b087b03e034ef4cd6d123e8df34ba11b11ed11ee41c',
			//       name: 'Sam',
			//       address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
			//       avatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       remark: 'no remark',
			//       createdAt: 2023-09-05T19:19:55.852Z,
			//       updatedAt: 2023-09-05T19:19:55.852Z,
			//       __v: 0
			//     }
			//
			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( contactSchema );
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
			const contactService = new ContactService();
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			const results : ContactListResult = await contactService.queryList( walletObj.address, { by : 'walletAndAddress', address : address } );
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
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( contactSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const contact of results.list )
				{
					for ( const key of requiredKeys )
					{
						expect( contact ).toHaveProperty( key );
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
			//	create many contacts
			//
			const contactService = new ContactService();

			let walletObjNew : TWalletBaseItem = walletObj;
			const limitTotal = 100;
			for ( let i = 0; i < limitTotal; i ++ )
			{
				const NoStr : string = Number(i).toString().padStart( 2, '0' );

				walletObjNew = EtherWallet.createNewAddress( walletObjNew );
				let contact : ContactType = {
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
				contact.sig = await Web3Signer.signObject( walletObj.privateKey, contact );
				contact.hash = await Web3Digester.hashObject( contact );
				expect( contact.sig ).toBeDefined();
				expect( typeof contact.sig ).toBe( 'string' );
				expect( contact.sig.length ).toBeGreaterThanOrEqual( 0 );

				const result = await contactService.add( walletObj.address, contact, contact.sig );
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
				const results : ContactListResult = await contactService.queryList( walletObj.address, { by : 'walletAndAddress', address : undefined, options : options } );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.pageNo ).toBe( options.pageNo );
				expect( results.pageSize ).toBe( options.pageSize );
				expect( results.total ).toBeGreaterThanOrEqual( limitTotal );
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
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( contactSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const contact of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( contact ).toHaveProperty( key );
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
			const contactService = new ContactService();
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			const findContact : ContactType | null = await contactService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
			expect( findContact ).toBeDefined();
			if ( findContact )
			{
				let contactToBeUpdated : ContactType = { ...findContact,
					name : `name-${ new Date().toLocaleString() }`,
					avatar : `https://avatar-${ new Date().toLocaleString() }`,
					remark : `remark .... ${ new Date().toLocaleString() }`,
				};
				contactToBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, contactToBeUpdated );
				expect( contactToBeUpdated.sig ).toBeDefined();
				expect( typeof contactToBeUpdated.sig ).toBe( 'string' );
				expect( contactToBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( contactSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();

				//	...
				const updatedContact : ContactType | null = await contactService.update( walletObj.address, contactToBeUpdated, contactToBeUpdated.sig );
				expect( null !== updatedContact ).toBeTruthy();
				if ( requiredKeys && updatedContact )
				{
					for ( const key of requiredKeys )
					{
						expect( updatedContact ).toHaveProperty( key );
					}

					expect( SchemaUtil.createHexStringObjectIdFromTime( 0 ) === updatedContact.deleted ).toBeTruthy();
					expect( updatedContact.sig ).toBe( contactToBeUpdated.sig );
					expect( updatedContact.name ).toBe( contactToBeUpdated.name );
					expect( updatedContact.avatar ).toBe( contactToBeUpdated.avatar );
					expect( updatedContact.remark ).toBe( contactToBeUpdated.remark );
				}

				//	...
				const findContactAgain : ContactType | null = await contactService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
				expect( null !== findContactAgain ).toBeTruthy();
				if ( requiredKeys && findContactAgain )
				{
					for ( const key of requiredKeys )
					{
						expect( findContactAgain ).toHaveProperty( key );
					}

					expect( SchemaUtil.createHexStringObjectIdFromTime( 0 ) === findContactAgain.deleted ).toBeTruthy();
					expect( findContactAgain.sig ).toBe( contactToBeUpdated.sig );
					expect( findContactAgain.name ).toBe( contactToBeUpdated.name );
					expect( findContactAgain.avatar ).toBe( contactToBeUpdated.avatar );
					expect( findContactAgain.remark ).toBe( contactToBeUpdated.remark );
				}

			}

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );

		it( "should only be able to update keys that are allowed to be updated", async () =>
		{
			const contactService = new ContactService();
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			const findContact : ContactType | null = await contactService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
			expect( findContact ).toBeDefined();
			if ( findContact )
			{
				let contactToBeUpdated : ContactType = { ...findContact,
					//	deleted key is not allowed to be updated, will be ignored ...
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),

					//	keys that are allowed to be updated
					name : `name-${ new Date().toLocaleString() }`,
					avatar : `https://avatar-${ new Date().toLocaleString() }`,
					remark : `remark .... ${ new Date().toLocaleString() }`,
				};
				contactToBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, contactToBeUpdated );
				expect( contactToBeUpdated.sig ).toBeDefined();
				expect( typeof contactToBeUpdated.sig ).toBe( 'string' );
				expect( contactToBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( contactSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();

				//	...
				const updatedContact : ContactType | null = await contactService.update( walletObj.address, contactToBeUpdated, contactToBeUpdated.sig );
				expect( null !== updatedContact ).toBeTruthy();
				if ( requiredKeys && updatedContact )
				{
					for ( const key of requiredKeys )
					{
						expect( updatedContact ).toHaveProperty( key );
					}

					expect( SchemaUtil.createHexStringObjectIdFromTime( 0 ) === updatedContact.deleted ).toBeTruthy();
					expect( updatedContact.sig ).toBe( contactToBeUpdated.sig );
					expect( updatedContact.name ).toBe( contactToBeUpdated.name );
					expect( updatedContact.avatar ).toBe( contactToBeUpdated.avatar );
					expect( updatedContact.remark ).toBe( contactToBeUpdated.remark );

					//	check the result according to the keys that are not allowed to be updated
					expect( SchemaUtil.createHexStringObjectIdFromTime( 0 ) === updatedContact.deleted ).toBeTruthy();
				}
			}

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );


		it( "should throw an not found error", async () =>
		{
			const contactService = new ContactService();
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			const find : ContactType | null = await contactService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
			expect( find ).toBeDefined();
			if ( find )
			{
				let toBeUpdated : ContactType = { ...find,
					//	not found address
					address : `0xeBec795c9c8bBD61FFc14A6662944748F299cAcf`,
					name : `name-${ new Date().toLocaleString() }`,
					avatar : `https://avatar-${ new Date().toLocaleString() }`,
					remark : `remark .... ${ new Date().toLocaleString() }`,
				};
				toBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, toBeUpdated );
				expect( toBeUpdated.sig ).toBeDefined();
				expect( typeof toBeUpdated.sig ).toBe( 'string' );
				expect( toBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( contactSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();

				//	...
				try
				{
					const updated : ContactType | null = await contactService.update( walletObj.address, toBeUpdated, toBeUpdated.sig );
					expect( updated ).toBe( null );
				}
				catch ( err )
				{
					expect( err ).toBe( resultErrors.notFound );
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
			const contactService = new ContactService();
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			const findContact : ContactType | null = await contactService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
			if ( findContact )
			{
				let contactToBeDeleted : ContactType = { ...findContact,
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				};
				contactToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, contactToBeDeleted );
				expect( contactToBeDeleted.sig ).toBeDefined();
				expect( typeof contactToBeDeleted.sig ).toBe( 'string' );
				expect( contactToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const result : number = await contactService.delete( walletObj.address, contactToBeDeleted, contactToBeDeleted.sig );
				expect( result ).toBeGreaterThanOrEqual( 0 );

				const findContactAgain : ContactType | null = await contactService.queryOne( walletObj.address, { by : 'walletAndAddress', address : address } );
				expect( findContactAgain ).toBe( null );
			}

		}, 60 * 10e3 );
	} );
} );
