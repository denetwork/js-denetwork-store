import { describe, expect } from '@jest/globals';
import {
	ERefDataTypes,
	LikeListResult,
	likeSchema,
	LikeType, postSchema, PostService, PostType
} from "../../../src";
import { EtherWallet, TWalletBaseItem, Web3Digester, Web3Signer } from "web3id";
import { ethers } from "ethers";
import { DatabaseConnection } from "../../../src";
import { SchemaUtil } from "../../../src";
import { LikeService } from "../../../src";
import { TQueryListOptions } from "../../../src/models/TQuery";
import { resultErrors } from "../../../src";


/**
 *	unit test
 */
describe( "LikeService", () =>
{
	const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
	const exceptedKeys : Array<string> = Array.isArray( statisticKeys ) ? statisticKeys : [];
	let walletObj : TWalletBaseItem;
	let savedPost : PostType;
	let savedLike : LikeType;

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
	const oneLikeHash : string = `0x21393d589acdac81de848d71ddabf907775b7efb5d5e25361a6a2c2df3aaa4ea`;

	describe( "Add record", () =>
	{
		it( "should add a record to database", async () =>
		{
			//
			//	create a new like with ether signature
			//
			let like : LikeType = {
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
			like.sig = await Web3Signer.signObject( walletObj.privateKey, like );
			like.hash = await Web3Digester.hashObject( like );
			expect( like.sig ).toBeDefined();
			expect( typeof like.sig ).toBe( 'string' );
			expect( like.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			const likeService = new LikeService();
			await likeService.clearAll();

			//	find post first time
			const findPost : PostType | null = await postService.queryOne( walletObj.address, { by : 'walletAndHash', hash : savedPost.hash } );
			expect( findPost ).not.toBe( null );
			expect( findPost ).toBeDefined();
			expect( findPost ).toHaveProperty( 'statisticLike' );
			expect( findPost.statisticLike ).toBeGreaterThanOrEqual( 0 );

			//	add favorite and update statistic
			savedLike = await likeService.add( walletObj.address, like, like.sig );
			expect( savedLike ).toBeDefined();

			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( likeSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const key of requiredKeys )
				{
					expect( savedLike ).toHaveProperty( key );
				}
			}

			//	check for updating of statistic
			const findPostAgain : PostType | null = await postService.queryOne( walletObj.address, { by : 'walletAndHash', hash : savedPost.hash } );
			expect( findPostAgain ).not.toBe( null );
			expect( findPostAgain ).toBeDefined();
			expect( findPostAgain ).toHaveProperty( 'statisticLike' );
			expect( findPostAgain.statisticLike ).toBeGreaterThan( findPost.statisticLike );


			try
			{
				const resultDup = await likeService.add( walletObj.address, like, like.sig );
				expect( resultDup ).toBe( null );
			}
			catch ( err )
			{
				//	MongoServerError: E11000 duplicate key error collection: denetwork.likes index: deleted_1_wallet_1_address_1 dup key: { deleted: ObjectId('000000000000000000000000'), wallet: "0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" }
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
		it( "should return a record by hexId", async () =>
		{
			const likeService = new LikeService();
			const result : LikeType | null = await likeService.queryOne( walletObj.address, { by : 'hexId', hexId : savedLike._id.toHexString() } );
			expect( result ).not.toBe( null );
			expect( result ).toBeDefined();

			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( likeSchema );
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
			const likeService = new LikeService();
			const result : LikeType | null = await likeService.queryOne( walletObj.address, { by : 'hash', hash : savedLike.hash } );
			expect( result ).not.toBe( null );
			expect( result ).toBeDefined();

			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( likeSchema );
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

		it( "should return a record by walletAndRefTypeAndRefHash", async () =>
		{
			const likeService = new LikeService();
			const result : LikeType | null = await likeService.queryOne(
				walletObj.address,
				{ by : 'walletAndRefTypeAndRefHash',
					refType : ERefDataTypes.post,
					refHash : savedPost.hash
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
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( likeSchema );
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
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			const likeService = new LikeService();
			const findFavorite : LikeType | null = await likeService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : ERefDataTypes.post, refHash : oneLikeHash } );
			expect( findFavorite ).toBeDefined();
			if ( findFavorite )
			{
				let likeToBeUpdated : LikeType = { ...findFavorite,
					name : `name-${ new Date().toLocaleString() }`,
					avatar : `https://avatar-${ new Date().toLocaleString() }`,
					remark : `remark .... ${ new Date().toLocaleString() }`,
				};
				likeToBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, likeToBeUpdated );
				expect( likeToBeUpdated.sig ).toBeDefined();
				expect( typeof likeToBeUpdated.sig ).toBe( 'string' );
				expect( likeToBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( likeSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();

				//	...
				try
				{
					const updatedContact : LikeType | null = await likeService.update( walletObj.address, likeToBeUpdated, likeToBeUpdated.sig );
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
			//	create a post with signature
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
			//	create a new like with ether signature
			//
			let like : LikeType = {
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
			like.sig = await Web3Signer.signObject( walletObj.privateKey, like );
			like.hash = await Web3Digester.hashObject( like );
			expect( like.sig ).toBeDefined();
			expect( typeof like.sig ).toBe( 'string' );
			expect( like.sig.length ).toBeGreaterThanOrEqual( 0 );

			const likeService = new LikeService();
			savedLike = await likeService.add( walletObj.address, like, like.sig );
			expect( savedLike ).toBeDefined();

			//	...
			let likeToBeDeleted : LikeType = {
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				wallet : walletObj.address,
				//hexId : savedLike._id.toHexString(),
				hash : savedLike.hash,
			};
			likeToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, likeToBeDeleted );
			expect( likeToBeDeleted.sig ).toBeDefined();
			expect( typeof likeToBeDeleted.sig ).toBe( 'string' );
			expect( likeToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const result : number = await likeService.delete( walletObj.address, likeToBeDeleted, likeToBeDeleted.sig );
			expect( result ).toBeGreaterThanOrEqual( 0 );

			const findFavoriteAgain : LikeType | null = await likeService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : ERefDataTypes.post, refHash : savedPost.hash } );
			expect( findFavoriteAgain ).toBe( null );

			//
			//	like again after being deleted
			//
			let likeAgain : LikeType = {
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
			likeAgain.sig = await Web3Signer.signObject( walletObj.privateKey, likeAgain );
			likeAgain.hash = await Web3Digester.hashObject( likeAgain );
			expect( likeAgain.sig ).toBeDefined();
			expect( typeof likeAgain.sig ).toBe( 'string' );
			expect( likeAgain.sig.length ).toBeGreaterThanOrEqual( 0 );

			console.log( `savedLike :`, savedLike );
			console.log( `likeToBeDeleted :`, likeToBeDeleted );
			console.log( `findFavoriteAgain :`, findFavoriteAgain );
			console.log( `likeAgain :`, likeAgain );

			const savedLikeAgain = await likeService.add( walletObj.address, likeAgain, likeAgain.sig );
			expect( savedLikeAgain ).toBeDefined();

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
			//	create a new like with ether signature
			//
			let like : LikeType = {
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
			like.sig = await Web3Signer.signObject( walletObj.privateKey, like );
			like.hash = await Web3Digester.hashObject( like );
			expect( like.sig ).toBeDefined();
			expect( typeof like.sig ).toBe( 'string' );
			expect( like.sig.length ).toBeGreaterThanOrEqual( 0 );

			const likeService = new LikeService();
			savedLike = await likeService.add( walletObj.address, like, like.sig );
			expect( savedLike ).toBeDefined();

			//	...
			let likeToBeDeleted : LikeType = {
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				wallet : walletObj.address,
				hash : savedLike.hash,
			};
			likeToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, likeToBeDeleted );
			expect( likeToBeDeleted.sig ).toBeDefined();
			expect( typeof likeToBeDeleted.sig ).toBe( 'string' );
			expect( likeToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const result : number = await likeService.delete( walletObj.address, likeToBeDeleted, likeToBeDeleted.sig );
			expect( result ).toBeGreaterThanOrEqual( 0 );

			const findFavoriteAgain : LikeType | null = await likeService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : ERefDataTypes.post, refHash : oneLikeHash } );
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
			//	create a new like with ether signature
			//
			let like : LikeType = {
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
			like.sig = await Web3Signer.signObject( walletObj.privateKey, like );
			like.hash = await Web3Digester.hashObject( like );
			expect( like.sig ).toBeDefined();
			expect( typeof like.sig ).toBe( 'string' );
			expect( like.sig.length ).toBeGreaterThanOrEqual( 0 );

			const likeService = new LikeService();
			savedLike = await likeService.add( walletObj.address, like, like.sig );
			expect( savedLike ).toBeDefined();

			//	...
			let likeToBeDeleted : LikeType = {
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
			};
			likeToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, likeToBeDeleted );
			expect( likeToBeDeleted.sig ).toBeDefined();
			expect( typeof likeToBeDeleted.sig ).toBe( 'string' );
			expect( likeToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const result : number = await likeService.delete( walletObj.address, likeToBeDeleted, likeToBeDeleted.sig );
			expect( result ).toBeGreaterThanOrEqual( 0 );

			const findFavoriteAgain : LikeType | null = await likeService.queryOne( walletObj.address, { by : 'walletAndRefTypeAndRefHash', refType : ERefDataTypes.post, refHash : oneLikeHash } );
			expect( findFavoriteAgain ).toBe( null );

		}, 60 * 10e3 );
	} );


	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			const likeService = new LikeService();
			const results : LikeListResult = await likeService.queryList( walletObj.address, { by : 'walletAndRefType', refType : ERefDataTypes.post } );
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
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( likeSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const like of results.list )
				{
					for ( const key of requiredKeys )
					{
						expect( like ).toHaveProperty( key );
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
			//	create many favorites
			//
			const postService = new PostService();
			const likeService = new LikeService();
			await likeService.clearAll();

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
				let like : LikeType = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					refType : ERefDataTypes.post,
					refHash : newPagePost.hash,
					refAuthorWallet : postAuthorWallet,
					refAuthorName : postAuthorName,
					refAuthorAvatar : postAuthorAvatar,
					refBody : JSON.stringify( newPagePost ),
					sig : ``,
					remark : `no remark ${ NoStr }`,
					createdAt: new Date(),
					updatedAt: new Date()
				};
				like.sig = await Web3Signer.signObject( walletObj.privateKey, like );
				like.hash = await Web3Digester.hashObject( like );
				expect( like.sig ).toBeDefined();
				expect( typeof like.sig ).toBe( 'string' );
				expect( like.sig.length ).toBeGreaterThanOrEqual( 0 );

				const result = await likeService.add( walletObj.address, like, like.sig );
				expect( result ).toBeDefined();

			}

			//	....
			for ( let page = 1; page <= 10; page ++ )
			{
				const options : TQueryListOptions = {
					pageNo : page,
					pageSize : 10
				};
				const results : LikeListResult = await likeService.queryList( walletObj.address, { by : 'walletAndRefType', refType : ERefDataTypes.post, options : options } );
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
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( likeSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const like of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( like ).toHaveProperty( key );
						}
					}
				}
			}

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );





} );
