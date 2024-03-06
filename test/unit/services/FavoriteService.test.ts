import { describe, expect } from '@jest/globals';
import {
	DatabaseConnection,
	ERefDataTypes,
	FavoriteListResult,
	favoriteSchema,
	FavoriteService,
	FavoriteType, LikeService, LikeType, postSchema,
	PostService,
	PostType,
	resultErrors,
	SchemaUtil
} from "../../../src";
import { EtherWallet, TWalletBaseItem, Web3Digester, Web3Signer } from "web3id";
import { ethers } from "ethers";
import { TQueryListOptions } from "../../../src/models/TQuery";
import { TypeUtil } from "denetwork-utils";


/**
 *	unit test
 */
describe( "FavoriteService", () =>
{
	let walletObj : TWalletBaseItem;

	const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
	const exceptedKeys : Array<string> = Array.isArray( statisticKeys ) ? statisticKeys : [];
	let savedPost : PostType;
	let savedFavorite : FavoriteType;

	beforeAll( async () =>
	{
		//
		//	create a wallet by mnemonic
		//
		const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
		walletObj = EtherWallet.createWalletFromMnemonic( mnemonic );

		//	assert ...
		expect( walletObj ).not.toBeNull();
		expect( walletObj.mnemonic ).toBe( mnemonic );
		expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
		expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
		expect( walletObj.index ).toBe( 0 );
		expect( walletObj.path ).toBe( ethers.defaultPath );

		//
		//	create a new contact with ether signature
		//
		let post : PostType = {
			timestamp : new Date().getTime(),
			hash : '',
			version : '1.0.0',
			deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
			wallet : walletObj.address,
			sig : ``,
			authorName : 'XING',
			authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
			body : 'Hello 1',
			pictures : [],
			videos : [],
			bitcoinPrice : 26888,
			statisticView : 0,
			statisticRepost : 0,
			statisticQuote : 0,
			statisticLike : 0,
			statisticFavorite : 0,
			statisticReply : 0,
			remark : 'no ...',
			createdAt: new Date(),
			updatedAt: new Date()
		};
		post.sig = await Web3Signer.signObject( walletObj.privateKey, post, exceptedKeys );
		post.hash = await Web3Digester.hashObject( post, exceptedKeys );
		expect( post.sig ).toBeDefined();
		expect( typeof post.sig ).toBe( 'string' );
		expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

		//
		//	try to save the record to database
		//
		const postService = new PostService();
		savedPost = await postService.add( walletObj.address, post, post.sig );
	} );
	afterAll( async () =>
	{
		//
		//	disconnect
		//
		await new DatabaseConnection().disconnect();
	} );

	//	...
	const oneFavHash : string = `0x21393d589acdac81de848d71ddabf907775b7efb5d5e25361a6a2c2df3aaa4ea`;

	describe( "Add record", () =>
	{
		it( "should add a record to database", async () =>
		{
			//
			//	create a new favorite with ether signature
			//
			let favorite : FavoriteType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : '',
				sig : ``,
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			favorite.sig = await Web3Signer.signObject( walletObj.privateKey, favorite );
			favorite.hash = await Web3Digester.hashObject( favorite );
			expect( favorite.sig ).toBeDefined();
			expect( typeof favorite.sig ).toBe( 'string' );
			expect( favorite.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			const favoriteService = new FavoriteService();
			await favoriteService.clearAll();

			//	find post first
			const findPost : PostType | null = await postService.queryOne( walletObj.address, { by : 'walletAndHash', hash : savedPost.hash } );
			expect( findPost ).not.toBe( null );
			expect( findPost ).toBeDefined();
			expect( findPost ).toHaveProperty( 'statisticFavorite' );
			expect( findPost.statisticFavorite ).toBeGreaterThanOrEqual( 0 );

			//	add favorite and update statistic
			savedFavorite = await favoriteService.add( walletObj.address, favorite, favorite.sig );
			expect( savedFavorite ).toBeDefined();

			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( favoriteSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const key of requiredKeys )
				{
					expect( savedFavorite ).toHaveProperty( key );
				}
			}

			//	check for updating of statistic
			const findPostAgain : PostType | null = await postService.queryOne( walletObj.address, { by : 'walletAndHash', hash : savedPost.hash } );
			expect( findPostAgain ).not.toBe( null );
			expect( findPostAgain ).toBeDefined();
			expect( findPostAgain ).toHaveProperty( 'statisticFavorite' );
			expect( findPostAgain.statisticFavorite ).toBeGreaterThan( findPost.statisticFavorite );

			try
			{
				const resultDup = await favoriteService.add( walletObj.address, favorite, favorite.sig );
				expect( resultDup ).toBe( null );
			}
			catch ( err )
			{
				//	MongoServerError: E11000 duplicate key error collection: denetwork.favorites index: deleted_1_wallet_1_address_1 dup key: { deleted: ObjectId('000000000000000000000000'), wallet: "0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" }
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
		it( "should return a record by wallet, refType and refHash", async () =>
		{
			expect( savedFavorite ).toBeDefined();
			expect( savedFavorite ).toHaveProperty( 'refType' );
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );

			const favoriteService = new FavoriteService();
			const result : FavoriteType | null = await favoriteService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : savedFavorite.refType, refHash : savedPost.hash } );
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
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( favoriteSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const key of requiredKeys )
					{
						expect( result ).toHaveProperty( key );
					}
				}

				//	check .refData
				expect( result ).toHaveProperty( 'refHash' );
				expect( result.refHash ).not.toBeNull();
				expect( TypeUtil.isString( result.refHash ) ).toBeTruthy();
				expect( result.refHash.length ).toBeGreaterThan( 0 );

				expect( result ).toHaveProperty( 'refData' );
				if ( result.refData )
				{
					expect( result.refData ).not.toBeNull();
					expect( result.refData ).toHaveProperty( 'hash' );
					expect( result.refData.hash ).not.toBeNull();
					expect( TypeUtil.isString( result.refData.hash ) ).toBeTruthy();
					expect( result.refData.hash.length ).toBeGreaterThan( 0 );
					expect( result.refData.hash ).toBe( result.refHash );
				}
				else
				{
					//	referred data may be deleted by its author
				}
			}

		}, 60 * 10e3 );

		it( "should return a record by hexId", async () =>
		{
			expect( savedFavorite ).toBeDefined();
			expect( savedFavorite ).toHaveProperty( '_id' );

			const favoriteService = new FavoriteService();
			const result : FavoriteType | null = await favoriteService.queryOne( walletObj.address, { by : 'hexId', hexId : savedFavorite._id.toHexString() } );
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
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( favoriteSchema );
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

		it( "should return a record by hash", async () =>
		{
			expect( savedFavorite ).toBeDefined();
			expect( savedFavorite ).toHaveProperty( 'hash' );

			const favoriteService = new FavoriteService();
			const result : FavoriteType | null = await favoriteService.queryOne( walletObj.address, { by : 'hash', hash : savedFavorite.hash } );
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
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( favoriteSchema );
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

		//	walletAndRefTypeAndRefHash

		it( "should return a record by walletAndRefTypeAndRefHash", async () =>
		{
			expect( savedFavorite ).toBeDefined();
			expect( savedFavorite ).toHaveProperty( 'hash' );

			const favoriteService = new FavoriteService();
			const result : FavoriteType | null = await favoriteService.queryOne(
				walletObj.address,
				{ by : 'walletAndRefTypeAndRefHash',
					refType : ERefDataTypes.post,
					refHash : savedPost.hash,
				}
			);
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
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( favoriteSchema );
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

	describe( "Updating", () =>
	{
		it( "should update a record by wallet and address from database", async () =>
		{
			const favoriteService = new FavoriteService();
			const findFavorite : FavoriteType | null = await favoriteService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : ERefDataTypes.post, refHash : oneFavHash } );
			expect( findFavorite ).toBeDefined();
			if ( findFavorite )
			{
				let favoriteToBeUpdated : FavoriteType = { ...findFavorite,
					name : `name-${ new Date().toLocaleString() }`,
					avatar : `https://avatar-${ new Date().toLocaleString() }`,
					remark : `remark .... ${ new Date().toLocaleString() }`,
				};
				favoriteToBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, favoriteToBeUpdated );
				expect( favoriteToBeUpdated.sig ).toBeDefined();
				expect( typeof favoriteToBeUpdated.sig ).toBe( 'string' );
				expect( favoriteToBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( favoriteSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();

				//	...
				try
				{
					const updatedContact : FavoriteType | null = await favoriteService.update( walletObj.address, favoriteToBeUpdated, favoriteToBeUpdated.sig );
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
		it( "should logically delete a record by hexId", async () =>
		{
			//
			//	create a new contact with ether signature
			//
			let post : PostType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				body : 'Hello 1',
				pictures : [],
				videos : [],
				bitcoinPrice : 26888,
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			post.sig = await Web3Signer.signObject( walletObj.privateKey, post, exceptedKeys );
			post.hash = await Web3Digester.hashObject( post, exceptedKeys );
			expect( post.sig ).toBeDefined();
			expect( typeof post.sig ).toBe( 'string' );
			expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			savedPost = await postService.add( walletObj.address, post, post.sig );


			//
			//	create a new favorite with ether signature
			//
			let favorite : FavoriteType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : '',
				sig : ``,
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			favorite.sig = await Web3Signer.signObject( walletObj.privateKey, favorite );
			favorite.hash = await Web3Digester.hashObject( favorite );
			expect( favorite.sig ).toBeDefined();
			expect( typeof favorite.sig ).toBe( 'string' );
			expect( favorite.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const favoriteService = new FavoriteService();
			//	add favorite and update statistic
			savedFavorite = await favoriteService.add( walletObj.address, favorite, favorite.sig );
			expect( savedFavorite ).toBeDefined();

			//	....
			let favoriteToBeDeleted : FavoriteType = {
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				wallet : walletObj.address,
				hexId : savedFavorite._id.toHexString()
			};
			favoriteToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, favoriteToBeDeleted );
			expect( favoriteToBeDeleted.sig ).toBeDefined();
			expect( typeof favoriteToBeDeleted.sig ).toBe( 'string' );
			expect( favoriteToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const result : number = await favoriteService.delete( walletObj.address, favoriteToBeDeleted, favoriteToBeDeleted.sig );
			expect( result ).toBeGreaterThanOrEqual( 0 );

			const findFavoriteAgain : FavoriteType | null = await favoriteService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : ERefDataTypes.post, refHash : oneFavHash } );
			expect( findFavoriteAgain ).toBe( null );

		}, 60 * 10e3 );

		it( "should logically delete a record by hash", async () =>
		{
			//
			//	create a new contact with ether signature
			//
			let post : PostType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				body : 'Hello 1',
				pictures : [],
				videos : [],
				bitcoinPrice : 26888,
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			post.sig = await Web3Signer.signObject( walletObj.privateKey, post, exceptedKeys );
			post.hash = await Web3Digester.hashObject( post, exceptedKeys );
			expect( post.sig ).toBeDefined();
			expect( typeof post.sig ).toBe( 'string' );
			expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			savedPost = await postService.add( walletObj.address, post, post.sig );


			//
			//	create a new favorite with ether signature
			//
			let favorite : FavoriteType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : '',
				sig : ``,
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			favorite.sig = await Web3Signer.signObject( walletObj.privateKey, favorite );
			favorite.hash = await Web3Digester.hashObject( favorite );
			expect( favorite.sig ).toBeDefined();
			expect( typeof favorite.sig ).toBe( 'string' );
			expect( favorite.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const favoriteService = new FavoriteService();
			//	add favorite and update statistic
			savedFavorite = await favoriteService.add( walletObj.address, favorite, favorite.sig );
			expect( savedFavorite ).toBeDefined();

			//	....
			let favoriteToBeDeleted : FavoriteType = {
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				wallet : walletObj.address,
				hash : savedFavorite.hash
			};
			favoriteToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, favoriteToBeDeleted );
			expect( favoriteToBeDeleted.sig ).toBeDefined();
			expect( typeof favoriteToBeDeleted.sig ).toBe( 'string' );
			expect( favoriteToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const result : number = await favoriteService.delete( walletObj.address, favoriteToBeDeleted, favoriteToBeDeleted.sig );
			expect( result ).toBeGreaterThanOrEqual( 0 );

			const findFavoriteAgain : FavoriteType | null = await favoriteService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : ERefDataTypes.post, refHash : oneFavHash } );
			expect( findFavoriteAgain ).toBe( null );

		}, 60 * 10e3 );

		it( "should logically delete a record by refType and refHash", async () =>
		{
			//
			//	create a new contact with ether signature
			//
			let post : PostType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				body : 'Hello 1',
				pictures : [],
				videos : [],
				bitcoinPrice : 26888,
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			post.sig = await Web3Signer.signObject( walletObj.privateKey, post, exceptedKeys );
			post.hash = await Web3Digester.hashObject( post, exceptedKeys );
			expect( post.sig ).toBeDefined();
			expect( typeof post.sig ).toBe( 'string' );
			expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			savedPost = await postService.add( walletObj.address, post, post.sig );


			//
			//	create a new favorite with ether signature
			//
			let favorite : FavoriteType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : '',
				sig : ``,
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			favorite.sig = await Web3Signer.signObject( walletObj.privateKey, favorite );
			favorite.hash = await Web3Digester.hashObject( favorite );
			expect( favorite.sig ).toBeDefined();
			expect( typeof favorite.sig ).toBe( 'string' );
			expect( favorite.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const favoriteService = new FavoriteService();
			//	add favorite and update statistic
			savedFavorite = await favoriteService.add( walletObj.address, favorite, favorite.sig );
			expect( savedFavorite ).toBeDefined();

			//	....
			const findFavorite : FavoriteType | null = await favoriteService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : ERefDataTypes.post, refHash : oneFavHash } );
			if ( findFavorite )
			{
				let favoriteToBeDeleted : FavoriteType = { ...findFavorite,
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				};
				favoriteToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, favoriteToBeDeleted );
				expect( favoriteToBeDeleted.sig ).toBeDefined();
				expect( typeof favoriteToBeDeleted.sig ).toBe( 'string' );
				expect( favoriteToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const result : number = await favoriteService.delete( walletObj.address, favoriteToBeDeleted, favoriteToBeDeleted.sig );
				expect( result ).toBeGreaterThanOrEqual( 0 );

				const findFavoriteAgain : FavoriteType | null = await favoriteService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : ERefDataTypes.post, refHash : oneFavHash } );
				expect( findFavoriteAgain ).toBe( null );
			}

		}, 60 * 10e3 );
	} );


	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			const favoriteService = new FavoriteService();
			const results : FavoriteListResult = await favoriteService.queryList( walletObj.address, { by : 'walletAndRefType', refType : ERefDataTypes.post } );
			expect( results ).toHaveProperty( 'total' );
			expect( results ).toHaveProperty( 'list' );
			//
			//    console.log( results );
			//    {
			//       total: 1,
			//       pageNo: 1,
			//       pageSize: 30,
			//       list: [
			//         {
			//           _id: new ObjectId("65023a22f870e9137fd9df68"),
			//           timestamp: 1694644770290,
			//           hash: '0x14b1fc070708ef81cef1282a723a5ec993e6169ec2171b3595f4344b21fc986d',
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0xc16b915fc3cfdafd7d9a3cc08a2d7f071dbddd89745c95437cc63605f01886e40e4f4a91c7fe36f069f0fce1611e7510b00d1112cf521a4a54dbfad2ec07043f1c',
			//           refType: 'post',
			//           refHash: '0x21393d589acdac81de848d71ddabf907775b7efb5d5e25361a6a2c2df3aaa4ea',
			//           remark: 'no remark',
			//           createdAt: 2023-09-13T22:39:30.290Z,
			//           updatedAt: 2023-09-13T22:39:30.290Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( favoriteSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const favorite of results.list )
				{
					//console.log( `favorite item :`, favorite )
					for ( const key of requiredKeys )
					{
						expect( favorite ).toHaveProperty( key );
					}

					expect( favorite ).toHaveProperty( `refData` );
					expect( favorite.refData ).toBeDefined();
					expect( favorite.refData ).toHaveProperty( favoriteService.walletFavoritedKey );
					expect( favorite.refData ).toHaveProperty( favoriteService.walletLikedKey );
					expect( favorite.refData[ favoriteService.walletFavoritedKey ] ).toBeTruthy();
				}
			}

		}, 60 * 10e3 );

		it( "should return a list of favorites belonging to `data.address`, and extended attributes of .refData belonging to the `wallet`", async () =>
		{
			const AliceMnemonic = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const AliceWalletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( AliceMnemonic );

			const BobMnemonic = 'evidence cement snap basket genre fantasy degree ability sunset pistol palace target';
			const BobWalletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( BobMnemonic );

			const postService = new PostService();
			await postService.clearAll();

			const likeService = new LikeService();
			await likeService.clearAll();

			const favoriteService = new FavoriteService();
			await favoriteService.clearAll();

			//	create Alice's post
			let post : PostType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : AliceWalletObj.address,
				sig : ``,
				authorName : 'Alice',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				body : 'Hello, I am ALice',
				pictures : [],
				videos : [],
				bitcoinPrice : 26888,
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : 'no ...',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			post.sig = await Web3Signer.signObject( AliceWalletObj.privateKey, post, exceptedKeys );
			post.hash = await Web3Digester.hashObject( post, exceptedKeys );
			expect( post.sig ).toBeDefined();
			expect( typeof post.sig ).toBe( 'string' );
			expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

			const savedAlicePost = await postService.add( AliceWalletObj.address, post, post.sig );
			expect( savedAlicePost ).toBeDefined();
			expect( savedAlicePost ).toHaveProperty( '_id' );

			//
			//	Bob liked this post
			//
			let likedByBob : LikeType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : BobWalletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedAlicePost.hash,
				refBody : '',
				sig : ``,
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			likedByBob.sig = await Web3Signer.signObject( BobWalletObj.privateKey, likedByBob );
			likedByBob.hash = await Web3Digester.hashObject( likedByBob );
			expect( likedByBob.sig ).toBeDefined();
			expect( typeof likedByBob.sig ).toBe( 'string' );
			expect( likedByBob.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	like the post
			const savedBobLike = await likeService.add( BobWalletObj.address, likedByBob, likedByBob.sig );
			expect( savedBobLike ).toBeDefined();

			//
			//	Alice favorite this post
			//
			let favoritedByAlice : FavoriteType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : AliceWalletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedAlicePost.hash,
				refBody : '',
				sig : ``,
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			favoritedByAlice.sig = await Web3Signer.signObject( AliceWalletObj.privateKey, favoritedByAlice );
			favoritedByAlice.hash = await Web3Digester.hashObject( favoritedByAlice );
			expect( favoritedByAlice.sig ).toBeDefined();
			expect( typeof favoritedByAlice.sig ).toBe( 'string' );
			expect( favoritedByAlice.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	Bob favorite this post
			//
			let favoritedByBob : FavoriteType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : BobWalletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedAlicePost.hash,
				refBody : '',
				sig : ``,
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			favoritedByBob.sig = await Web3Signer.signObject( BobWalletObj.privateKey, favoritedByBob );
			favoritedByBob.hash = await Web3Digester.hashObject( favoritedByBob );
			expect( favoritedByBob.sig ).toBeDefined();
			expect( typeof favoritedByBob.sig ).toBe( 'string' );
			expect( favoritedByBob.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	favorite it
			const savedBobFavorite = await favoriteService.add( BobWalletObj.address, favoritedByBob, favoritedByBob.sig );
			expect( savedBobFavorite ).toBeDefined();


			//
			//	Using Bob's identity, query the list of favorites belonging to Alice
			//
			const results : FavoriteListResult = await favoriteService.queryList(
				BobWalletObj.address, {
					by : 'addressAndRefType', address : AliceWalletObj.address, refType : ERefDataTypes.post
				} );
			expect( results ).toHaveProperty( 'total' );
			expect( results ).toHaveProperty( 'list' );

			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( favoriteSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const favorite of results.list )
				{
					//console.log( `favorite item :`, favorite )
					for ( const key of requiredKeys )
					{
						expect( favorite ).toHaveProperty( key );
					}

					expect( favorite ).toHaveProperty( `refData` );
					expect( favorite.refData ).toBeDefined();
					expect( favorite.refData ).toHaveProperty( favoriteService.walletFavoritedKey );
					expect( favorite.refData ).toHaveProperty( favoriteService.walletLikedKey );
					expect( favorite.refData[ favoriteService.walletLikedKey ] ).toBeTruthy();
					expect( favorite.refData[ favoriteService.walletFavoritedKey ] ).toBeTruthy();
				}
			}

		}, 60 * 10e3 );
	} );


	describe( "Query list by pagination", () =>
	{
		it( "should return a list of records by pagination from database", async () =>
		{
			//
			//	create many favorites
			//
			const postService = new PostService();
			const favoriteService = new FavoriteService();
			await favoriteService.clearAll();

			const limitTotal = 100;
			for ( let i = 0; i < limitTotal; i ++ )
			{
				const NoStr : string = Number(i).toString().padStart( 2, '0' );

				//
				//	create a new contact with ether signature
				//
				const postAuthorWallet = EtherWallet.createWalletFromMnemonic().address;
				const postAuthorName = 'XING';
				const postAuthorAvatar = 'https://avatars.githubusercontent.com/u/142800322?v=4';
				let post : PostType = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : postAuthorWallet,
					sig : ``,
					authorName : postAuthorName,
					authorAvatar : postAuthorAvatar,
					body : 'Hello 1',
					pictures : [],
					videos : [],
					bitcoinPrice : 26888,
					statisticView : 0,
					statisticRepost : 0,
					statisticQuote : 0,
					statisticLike : 0,
					statisticFavorite : 0,
					statisticReply : 0,
					remark : `no ...${ NoStr }`,
					createdAt: new Date(),
					updatedAt: new Date()
				};
				post.sig = await Web3Signer.signObject( walletObj.privateKey, post, exceptedKeys );
				post.hash = await Web3Digester.hashObject( post, exceptedKeys );
				expect( post.sig ).toBeDefined();
				expect( typeof post.sig ).toBe( 'string' );
				expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	try to save the record to database
				const newPagePost = await postService.add( walletObj.address, post, post.sig );
				expect( newPagePost ).toBeDefined();

				//
				//	create favorite
				//
				let favorite : FavoriteType = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					refType : ERefDataTypes.post,
					refHash : newPagePost.hash,
					refBody : JSON.stringify( newPagePost ),
					refAuthorWallet : postAuthorWallet,	//	wallet address of quoted author
					refAuthorName : postAuthorName,
					refAuthorAvatar : postAuthorAvatar,
					sig : ``,
					remark : `no remark ${ NoStr }`,
					createdAt: new Date(),
					updatedAt: new Date()
				};
				favorite.sig = await Web3Signer.signObject( walletObj.privateKey, favorite );
				favorite.hash = await Web3Digester.hashObject( favorite );
				expect( favorite.sig ).toBeDefined();
				expect( typeof favorite.sig ).toBe( 'string' );
				expect( favorite.sig.length ).toBeGreaterThanOrEqual( 0 );

				const result = await favoriteService.add( walletObj.address, favorite, favorite.sig );
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
				const results : FavoriteListResult = await favoriteService.queryList( walletObj.address, { by : 'walletAndRefType', refType : ERefDataTypes.post, options : options } );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.pageNo ).toBe( options.pageNo );
				expect( results.pageSize ).toBe( options.pageSize );
				expect( results.total ).toBe( limitTotal );
				//
				//    console.log( results );
				//    {
				//       total: 1,
				//       pageNo: 2,
				//       pageSize: 10,
				//       list: [
				//         {
				// 		_id: new ObjectId("65bbf777b828c4288add5e0c"),
				// 		timestamp: 1706817399025,
				// 		hash: '0x9a1bff1fa239fff3b9e9e75dc198b14b76cba07dbabc72c07855f86d227f14d2',
				// 		version: '1.0.0',
				// 		deleted: '000000000000000000000000',
				// 		wallet: '0xc8f60eaf5988ac37a2963ac5fabe97f709d6b357',
				// 		sig: '0x835031444c527f5215896725f3f07cdc9fa24041c05e21321699dab5c7e602de2d79d653b1fd156b2c864540c1c475d9ee7525d755d6695e41640c1086f0fa201c',
				// 		refAuthorWallet: '0x463d64f45748eeddf098a96e03705b90d2053ee3',
				// 		refAuthorName: 'XING',
				// 		refAuthorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
				// 		refType: 'post',
				// 		refHash: '0x8c8a61fd1a0d3f65e620d200814b24ddc45da37ba2f9a65229f5be284828dfc5',
				// 		refBody: '{"timestamp":1706817399019,"hash":"0x8c8a61fd1a0d3f65e620d200814b24ddc45da37ba2f9a65229f5be284828dfc5","version":"1.0.0","deleted":"000000000000000000000000","wallet":"0x463d64f45748eeddf098a96e03705b90d2053ee3","bitcoinPrice":26888,"sig":"0x3a5f7a78c7bdddafc68578aa2df1a71af2b973168227404941f48ae8d402f7236e6acc2f5c8580a15f9ab3d1e4f9b8129074eeccff8845076052b4979b4954c11b","contentType":"original","authorName":"XING","authorAvatar":"https://avatars.githubusercontent.com/u/142800322?v=4","body":"Hello 1","pictures":[],"videos":[],"statisticView":0,"statisticRepost":0,"statisticQuote":0,"statisticLike":0,"statisticFavorite":0,"statisticReply":0,"remark":"no ...99","_id":"65bbf777b828c4288add5e0a","createdAt":"2024-02-01T19:56:39.019Z","updatedAt":"2024-02-01T19:56:39.019Z","__v":0}',
				// 		remark: 'no remark 99',
				// 		createdAt: 2024-02-01T19:56:39.025Z,
				// 		updatedAt: 2024-02-01T19:56:39.025Z,
				// 		__v: 0,
				// 		refData: [Object]
				//         }
				//       ]
				//     }
				//
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( favoriteSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const favorite of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( favorite ).toHaveProperty( key );
						}

						// console.log( `favorite :`, favorite );
						// favorite : {
						// 	_id: new ObjectId("65bbf984b4f56806c33bc89e"),
						// 		timestamp: 1706817924495,
						// 		hash: '0xfedaeb6d712c20a48fa6d22f93fe0e9d3644b39b637c42b0c61becd89853d0db',
						// 		version: '1.0.0',
						// 		deleted: '000000000000000000000000',
						// 		wallet: '0xc8f60eaf5988ac37a2963ac5fabe97f709d6b357',
						// 		sig: '0xca7d38ce5069f6ebc1bfdead6b883d795c4df988cdeb4e6d4f04d1431f7c8fe3461f98551a13e47199e032dac297c35a364b7b9c764e03dcdf1d0b5a3f10ca941c',
						// 		refAuthorWallet: '0x88401eaee61ca950839d4c45a3733bcab33bb258',
						// 		refAuthorName: 'XING',
						// 		refAuthorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
						// 		refType: 'post',
						// 		refHash: '0x814223852a0cd6176267d5892497e5174e14ba891799bdb23f300300cb365714',
						// 		refBody: '{"timestamp":1706817924489,"hash":"0x814223852a0cd6176267d5892497e5174e14ba891799bdb23f300300cb365714","version":"1.0.0","deleted":"000000000000000000000000","wallet":"0x88401eaee61ca950839d4c45a3733bcab33bb258","bitcoinPrice":26888,"sig":"0xceb7b9fe4e3e5eea25602b174ba0be79de279f0d12eba47d447e173ede696365037a90107dc87e42dac4123e95f03178ab1ef1db10b568a6da28d990c23b6af71b","contentType":"original","authorName":"XING","authorAvatar":"https://avatars.githubusercontent.com/u/142800322?v=4","body":"Hello 1","pictures":[],"videos":[],"statisticView":0,"statisticRepost":0,"statisticQuote":0,"statisticLike":0,"statisticFavorite":0,"statisticReply":0,"remark":"no ...99","_id":"65bbf984b4f56806c33bc89c","createdAt":"2024-02-01T20:05:24.489Z","updatedAt":"2024-02-01T20:05:24.489Z","__v":0}',
						// 		remark: 'no remark 99',
						// 		createdAt: 2024-02-01T20:05:24.495Z,
						// 		updatedAt: 2024-02-01T20:05:24.495Z,
						// 		__v: 0,
						// 		refData: {
						// 		_id: new ObjectId("65bbf984b4f56806c33bc89c"),
						// 			timestamp: 1706817924489,
						// 			hash: '0x814223852a0cd6176267d5892497e5174e14ba891799bdb23f300300cb365714',
						// 			version: '1.0.0',
						// 			deleted: '000000000000000000000000',
						// 			wallet: '0x88401eaee61ca950839d4c45a3733bcab33bb258',
						// 			bitcoinPrice: 26888,
						// 			sig: '0xceb7b9fe4e3e5eea25602b174ba0be79de279f0d12eba47d447e173ede696365037a90107dc87e42dac4123e95f03178ab1ef1db10b568a6da28d990c23b6af71b',
						// 			contentType: 'original',
						// 			authorName: 'XING',
						// 			authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
						// 			body: 'Hello 1',
						// 			pictures: [],
						// 			videos: [],
						// 			statisticView: 0,
						// 			statisticRepost: 0,
						// 			statisticQuote: 0,
						// 			statisticLike: 0,
						// 			statisticFavorite: 1,
						// 			statisticReply: 0,
						// 			remark: 'no ...99',
						// 			createdAt: 2024-02-01T20:05:24.489Z,
						// 			updatedAt: 2024-02-01T20:05:24.504Z,
						// 			__v: 0
						// 	}
						// }
						expect( favorite ).toHaveProperty( 'refHash' );
						expect( favorite.refHash ).not.toBeNull();
						expect( TypeUtil.isString( favorite.refHash ) ).toBeTruthy();
						expect( favorite.refHash.length ).toBeGreaterThan( 0 );

						expect( favorite ).toHaveProperty( 'refData' );
						if ( favorite.refData )
						{
							expect( favorite.refData ).not.toBeNull();
							expect( favorite.refData ).toHaveProperty( 'hash' );
							expect( favorite.refData ).toHaveProperty( favoriteService.walletFavoritedKey );
							expect( favorite.refData ).toHaveProperty( favoriteService.walletLikedKey );
							expect( favorite.refData.hash ).not.toBeNull();
							expect( TypeUtil.isString( favorite.refData.hash ) ).toBeTruthy();
							expect( favorite.refData.hash.length ).toBeGreaterThan( 0 );
							expect( favorite.refData.hash ).toBe( favorite.refHash );
						}
						else
						{
							//	referred data may be deleted by its author
						}
					}
				}
			}

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );





} );
