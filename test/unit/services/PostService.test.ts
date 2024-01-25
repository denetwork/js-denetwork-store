import { describe, expect } from '@jest/globals';
import { EtherWallet, Web3Signer, TWalletBaseItem, Web3Digester } from "web3id";
import { ethers } from "ethers";
import {
	DatabaseConnection,
	ERefDataTypes,
	FavoriteService,
	FavoriteType,
	LikeService,
	LikeType
} from "../../../src";
import { SchemaUtil } from "../../../src";
import { PostListResult, postSchema, PostType } from "../../../src";
import { PostService } from "../../../src";
import { TQueryListOptions } from "../../../src/models/TQuery";
import { resultErrors } from "../../../src";
import _ from "lodash";



/**
 *	unit test
 */
describe( "PostService", () =>
{
	beforeAll( async () =>
	{
	} );
	afterAll( async () =>
	{
		//
		//	disconnect
		//
		await new DatabaseConnection().disconnect();
	} );

	//	...
	const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
	const exceptedKeys : Array<string> = Array.isArray( statisticKeys ) ? statisticKeys : [];
	let savedPost : PostType;

	describe( "Add record", () =>
	{
		it( "should add a record to database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

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
			await postService.clearAll();

			savedPost = await postService.add( walletObj.address, post, post.sig );
			//console.log( savedPost );
			//    {
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x6db7684cb68625a938bac35da7e4fd1c22b5736d75c7beca90cb407667077ee320bad6932c9fc9d11d027dc74dfa5417d18dbca97e68d117d1bcb592573d008c1c',
			//       authorName: 'XING',
			//       authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       body: 'Hello 1',
			//       pictures: [],
			//       videos: [],
			//       bitcoinPrice: '25888',
			//       statisticView: 0,
			//       statisticRepost: 0,
			//       statisticQuote: 0,
			//       statisticLike: 0,
			//       statisticFavorite: 0,
			//       statisticReply: 0,
			//       remark: 'no ...',
			//       _id: new ObjectId("64fdb15861892bf5a5a6f2a2"),
			//       createdAt: 2023-09-10T12:06:48.021Z,
			//       updatedAt: 2023-09-10T12:06:48.021Z,
			//       __v: 0
			//     }
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
		const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

		it( "should return a record queried by hash", async () =>
		{
			const postService = new PostService();
			const result : PostType | null = await postService.queryOne( ``, { by : 'hash', hash : savedPost.hash } );
			expect( result ).toBeDefined();
			//
			//    console.log( result );
			//    {
			//       _id: new ObjectId("64fdb1a6d04b9d62081581fb"),
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x6db7684cb68625a938bac35da7e4fd1c22b5736d75c7beca90cb407667077ee320bad6932c9fc9d11d027dc74dfa5417d18dbca97e68d117d1bcb592573d008c1c',
			//       authorName: 'XING',
			//       authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       body: 'Hello 1',
			//       pictures: [],
			//       videos: [],
			//       bitcoinPrice: '25888',
			//       statisticView: 0,
			//       statisticRepost: 0,
			//       statisticQuote: 0,
			//       statisticLike: 0,
			//       statisticFavorite: 0,
			//       statisticReply: 0,
			//       remark: 'no ...',
			//       createdAt: 2023-09-10T12:08:06.724Z,
			//       updatedAt: 2023-09-10T12:08:06.724Z,
			//       __v: 0
			//     }
			//
			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
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

		it( "should return a record queried by wallet and hash", async () =>
		{
			const postService = new PostService();
			const result : PostType | null = await postService.queryOne( walletObj.address, { by : 'walletAndHash', hash : savedPost.hash } );
			expect( result ).toBeDefined();
			//
			//    console.log( result );
			//    {
			//       _id: new ObjectId("64fdb1a6d04b9d62081581fb"),
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x6db7684cb68625a938bac35da7e4fd1c22b5736d75c7beca90cb407667077ee320bad6932c9fc9d11d027dc74dfa5417d18dbca97e68d117d1bcb592573d008c1c',
			//       authorName: 'XING',
			//       authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       body: 'Hello 1',
			//       pictures: [],
			//       videos: [],
			//       bitcoinPrice: '25888',
			//       statisticView: 0,
			//       statisticRepost: 0,
			//       statisticQuote: 0,
			//       statisticLike: 0,
			//       statisticFavorite: 0,
			//       statisticReply: 0,
			//       remark: 'no ...',
			//       createdAt: 2023-09-10T12:08:06.724Z,
			//       updatedAt: 2023-09-10T12:08:06.724Z,
			//       __v: 0
			//     }
			//
			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
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

	describe( "Query one with my favorite and like", () =>
	{
		const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
		const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

		it( "should return a record with key `_walletFavorited` and `_walletLiked`", async () =>
		{
			//
			//	favorite this comment
			//
			let favorite : FavoriteType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : 'will favorite this post',
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
			const favoritedRecord = await favoriteService.add( walletObj.address, favorite, favorite.sig );
			expect( favoritedRecord ).toBeDefined();


			//
			//	like this post
			//
			let like : LikeType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : 'will like this post',
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
			const lickedRecord = await likeService.add( walletObj.address, like, like.sig );
			expect( lickedRecord ).toBeDefined();


			//
			//	query the post
			//
			const postService = new PostService();
			const result : PostType | null = await postService.queryOne( walletObj.address, { by : 'hash', hash : savedPost.hash } );
			expect( result ).toBeDefined();
			expect( result ).toHaveProperty( postService.walletFavoritedKey );
			expect( result[ postService.walletFavoritedKey ] ).toBeTruthy();
			expect( result ).toHaveProperty( postService.walletLikedKey );
			expect( result[ postService.walletLikedKey ] ).toBeTruthy();
			//
			//    console.log( result );
			//    {
			//       _id: new ObjectId("655d0c95333a4359d4d0d2b9"),
			//       timestamp: 1700596885250,
			//       hash: '0xec5b4e660e09f84e0b5fe57c3e6eab1aaac86703b5cb3b02a12ae2ed0f368d65',
			//       version: '1.0.0',
			//       deleted: '000000000000000000000000',
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       bitcoinPrice: '25888',
			//       sig: '0x722faef894cb32492c4ccbc7c4fb41e269b8f25c26f13270561f2008b4425fa21d8cd362f4f0c4a75ec577dbb1a78724f806909cb6a99dc8efded127af4b4f621b',
			//       contentType: 'original',
			//       authorName: 'XING',
			//       authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       body: 'Hello 1',
			//       pictures: [],
			//       videos: [],
			//       statisticView: 0,
			//       statisticRepost: 0,
			//       statisticQuote: 0,
			//       statisticLike: 0,
			//       statisticFavorite: 1,
			//       statisticReply: 0,
			//       remark: 'no ...',
			//       createdAt: 2023-11-21T20:01:25.250Z,
			//       updatedAt: 2023-11-21T20:01:30.454Z,
			//       __v: 0,
			//       _walletFavorited: true,
			//       _walletLiked: true
			//     }
			//
			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const key of requiredKeys )
					{
						expect( result ).toHaveProperty( key );
					}
				}
			}
		});
	});

	describe( "Query one with favorite and like interactions", () =>
	{
		const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
		const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

		it( "should return a record with key `_walletFavorited` and `_walletLiked`", async () =>
		{
			const postService = new PostService();

			const favoriteService = new FavoriteService();
			await favoriteService.clearAll();

			const likeService = new LikeService();
			await likeService.clearAll();

			//
			//	favorite this comment
			//
			let favorite : FavoriteType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : 'will favorite this post',
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
			const favoritedRecord = await favoriteService.add( walletObj.address, favorite, favorite.sig );
			expect( favoritedRecord ).toBeDefined();

			//
			//	like this post
			//
			let like : LikeType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.post,
				refHash : savedPost.hash,
				refBody : 'will like this post',
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

			const lickedRecord = await likeService.add( walletObj.address, like, like.sig );
			expect( lickedRecord ).toBeDefined();

			//
			//	query the post
			//
			const postResult1 : PostType | null = await postService.queryOne( walletObj.address, { by : 'hash', hash : savedPost.hash } );
			expect( postResult1 ).toBeDefined();
			expect( postResult1 ).toHaveProperty( postService.walletFavoritedKey );
			expect( postResult1[ postService.walletFavoritedKey ] ).toBeTruthy();
			expect( postResult1 ).toHaveProperty( postService.walletLikedKey );
			expect( postResult1[ postService.walletLikedKey ] ).toBeTruthy();


			//
			//	try to cancel the fav
			//
			let favoriteToBeDeleted : FavoriteType = {
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				wallet : walletObj.address,
				hash : favorite.hash
			};
			favoriteToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, favoriteToBeDeleted );
			expect( favoriteToBeDeleted.sig ).toBeDefined();
			expect( typeof favoriteToBeDeleted.sig ).toBe( 'string' );
			expect( favoriteToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const deleteResult : number = await favoriteService.delete( walletObj.address, favoriteToBeDeleted, favoriteToBeDeleted.sig );
			expect( deleteResult ).toBeGreaterThanOrEqual( 0 );

			const findFavoriteAgain : FavoriteType | null = await favoriteService.queryOne( walletObj.address, { by : 'hash', hash : favorite.hash } );
			expect( findFavoriteAgain ).toBe( null );


			//
			//	try to cancel the like
			//
			let likeToBeDeleted : LikeType = {
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				wallet : walletObj.address,
				hash : like.hash
			};
			likeToBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, likeToBeDeleted );
			expect( likeToBeDeleted.sig ).toBeDefined();
			expect( typeof likeToBeDeleted.sig ).toBe( 'string' );
			expect( likeToBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	...
			const deleteLikeResult : number = await likeService.delete( walletObj.address, likeToBeDeleted, likeToBeDeleted.sig );
			expect( deleteLikeResult ).toBeGreaterThanOrEqual( 0 );

			const findLikeAgain : LikeType | null = await likeService.queryOne( walletObj.address, { by : 'hash', hash : like.hash } );
			expect( findLikeAgain ).toBe( null );


			//
			//	check the value of field `_walletFavorited` in post
			//	check the value of field `_walletLiked` in post
			//
			const postResult2 : PostType | null = await postService.queryOne( walletObj.address, { by : 'hash', hash : savedPost.hash } );
			expect( postResult2 ).toBeDefined();
			expect( postResult2 ).toHaveProperty( postService.walletFavoritedKey );
			expect( postResult2[ postService.walletFavoritedKey ] ).toBeFalsy();
			expect( postResult2 ).toHaveProperty( postService.walletLikedKey );
			expect( postResult2[ postService.walletLikedKey ] ).toBeFalsy();
		});
	});


	describe( "Query list", () =>
	{
		it( "should return a list of records from database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			const postService = new PostService();
			const results : PostListResult = await postService.queryList( walletObj.address, { by : 'wallet' } );
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
			//           _id: new ObjectId("64fdb23b50d64d4de36e24e7"),
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0x6db7684cb68625a938bac35da7e4fd1c22b5736d75c7beca90cb407667077ee320bad6932c9fc9d11d027dc74dfa5417d18dbca97e68d117d1bcb592573d008c1c',
			//           authorName: 'XING',
			//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           body: 'Hello 1',
			//           pictures: [],
			//           videos: [],
			//           bitcoinPrice: '25888',
			//           statisticView: 0,
			//           statisticRepost: 0,
			//           statisticQuote: 0,
			//           statisticLike: 0,
			//           statisticFavorite: 0,
			//           statisticReply: 0,
			//           remark: 'no ...',
			//           createdAt: 2023-09-10T12:10:35.280Z,
			//           updatedAt: 2023-09-10T12:10:35.280Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const record of results.list )
				{
					for ( const key of requiredKeys )
					{
						expect( record ).toHaveProperty( key );
					}

					expect( record ).toHaveProperty( postService.walletFavoritedKey );
					//expect( record[ postService.walletFavoritedKey ] ).toBeTruthy();
					expect( record ).toHaveProperty( postService.walletLikedKey );
				}
			}

		}, 60 * 10e3 );
	} );


	describe( "Query list by pagination", () =>
	{
		it( "should return a list of records by pagination from database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			//
			//	create many contacts
			//
			const postService = new PostService();
			await postService.clearAll();

			const limitTotal = 100;
			for ( let i = 0; i < limitTotal; i ++ )
			{
				const NoStr : string = Number(i).toString().padStart( 2, '0' );
				let post : PostType = {
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					sig : ``,
					authorName : 'XING',
					authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					body : `Hello 1 ${ NoStr }`,
					pictures : [],
					videos : [],
					bitcoinPrice : 26888,
					statisticView : 0,
					statisticRepost : 0,
					statisticQuote : 0,
					statisticLike : 0,
					statisticFavorite : 0,
					statisticReply : 0,
					remark : `no ... ${ NoStr }`,
					createdAt: new Date(),
					updatedAt: new Date()
				};
				post.sig = await Web3Signer.signObject( walletObj.privateKey, post, exceptedKeys );
				post.hash = await Web3Digester.hashObject( post, exceptedKeys );
				expect( post.sig ).toBeDefined();
				expect( typeof post.sig ).toBe( 'string' );
				expect( post.sig.length ).toBeGreaterThanOrEqual( 0 );

				const result : PostType | null = await postService.add( walletObj.address, post, post.sig );
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
				const results : PostListResult = await postService.queryList( walletObj.address, { by : 'wallet', options : options } );
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
				//       total: 10,
				//       pageNo: 10,
				//       pageSize: 10,
				//       list: [
				//         {
				//           _id: new ObjectId("64fdb3d4c240d91dcfebb791"),
				//           version: '1.0.0',
				//           deleted: new ObjectId("000000000000000000000000"),
				//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
				//           sig: '0xbeeefb36752307891e017f4afe8d3ccaa9406a7941335629e0411aa57ad91ce253236a7a20b9d03cb095cb88534538eb966631955a54bf7419fc2b2ee21df5011b',
				//           authorName: 'XING',
				//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
				//           body: 'Hello 1 09',
				//           pictures: [],
				//           videos: [],
				//           bitcoinPrice: '25888',
				//           statisticView: 0,
				//           statisticRepost: 0,
				//           statisticQuote: 0,
				//           statisticLike: 0,
				//           statisticFavorite: 0,
				//           statisticReply: 0,
				//           remark: 'no ... 09',
				//           createdAt: 2023-09-10T12:17:24.983Z,
				//           updatedAt: 2023-09-10T12:17:24.983Z,
				//           __v: 0
				//         },
				//         ...
				//       ]
				//     }
				//
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const record of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( record ).toHaveProperty( key );
						}

						expect( record ).toHaveProperty( postService.walletFavoritedKey );
						expect( record ).toHaveProperty( postService.walletLikedKey );
					}
				}
			}

			//	wait for a while
			//await TestUtil.sleep(3 * 1000 );

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

			//
			//	create a new post with signature
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

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			savedPost = await postService.add( walletObj.address, post, post.sig );
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );

			//	wait for a while
			//await TestUtil.sleep(3 * 1000 );

			//
			//	....
			//
			const findPost : PostType | null = await postService.queryOne( walletObj.address, { by : 'walletAndHash', hash : post.hash } );
			expect( findPost ).toBeDefined();
			if ( findPost )
			{
				let toBeUpdated : PostType = { ...findPost,
					// hexId : findPost._id.toString(),
					authorName : `authorName-${ new Date().toLocaleString() }`,
					authorAvatar : `https://avatar-${ new Date().toLocaleString() }`,
					body : `Hello 1 at ${ new Date().toLocaleString() }`,
					pictures : [ `pic-${ new Date().toLocaleString() }` ],
					videos : [ `video-${ new Date().toLocaleString() }` ],
					remark : `remark .... ${ new Date().toLocaleString() }`,
				};
				toBeUpdated.sig = await Web3Signer.signObject( walletObj.privateKey, toBeUpdated );
				expect( toBeUpdated.sig ).toBeDefined();
				expect( typeof toBeUpdated.sig ).toBe( 'string' );
				expect( toBeUpdated.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();

				//	...
				try
				{
					const updatedPost : PostType | null = await postService.update( walletObj.address, toBeUpdated, toBeUpdated.sig );
					expect( null !== updatedPost ).toBeTruthy();
					// if ( requiredKeys && updatedPost )
					// {
					// 	for ( const key of requiredKeys )
					// 	{
					// 		expect( updatedPost ).toHaveProperty( key );
					// 	}
					//
					// 	expect( Types.ObjectId.createFromTime( 0 ).equals( updatedPost.deleted ) ).toBeTruthy();
					// 	expect( updatedPost.sig ).toBe( toBeUpdated.sig );
					// 	expect( updatedPost.authorName ).toBe( toBeUpdated.authorName );
					// 	expect( updatedPost.authorAvatar ).toBe( toBeUpdated.authorAvatar );
					// 	expect( updatedPost.body ).toBe( toBeUpdated.body );
					// 	expect( updatedPost.remark ).toBe( toBeUpdated.remark );
					// }
					//
					// //	...
					// const findPostAgain : PostType | null = await postService.queryOneByWalletAndHexId( walletObj.address, hexId );
					// expect( null !== findPostAgain ).toBeTruthy();
					// if ( requiredKeys && findPostAgain )
					// {
					// 	for ( const key of requiredKeys )
					// 	{
					// 		expect( findPostAgain ).toHaveProperty( key );
					// 	}
					//
					// 	expect( Types.ObjectId.createFromTime( 0 ).equals( findPostAgain.deleted ) ).toBeTruthy();
					// 	expect( findPostAgain.sig ).toBe( toBeUpdated.sig );
					// 	expect( findPostAgain.authorName ).toBe( toBeUpdated.authorName );
					// 	expect( findPostAgain.authorAvatar ).toBe( toBeUpdated.authorAvatar );
					// 	expect( findPostAgain.body ).toBe( toBeUpdated.body );
					// 	expect( findPostAgain.remark ).toBe( toBeUpdated.remark );
					// }
				}
				catch ( err )
				{
					//
					expect( err ).toBe( resultErrors.updatingBanned );
				}

			}

			//	wait for a while
			//await TestUtil.sleep(3 * 1000 );

		}, 60 * 10e3 );


		it( "should update statistics", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			//
			//	create a new post with signature
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

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			savedPost = await postService.add( walletObj.address, post, post.sig );
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );

			//	wait for a while
			//await TestUtil.sleep(3 * 1000 );

			//
			//	will increase statisticView after calling .queryOne
			//
			// const increasePost : PostType | null = await postService.updateFor( walletObj.address, { hash : post.hash, key : `statisticView`, value: 1 } );
			// expect( increasePost ).toBeDefined();
			// expect( increasePost.statisticView ).toBe( 1 );
			const findPost : PostType | null = await postService.queryOne( walletObj.address, { by : 'walletAndHash', hash : post.hash } );
			expect( findPost ).toBeDefined();
			expect( findPost.statisticView ).toBe( 1 );

			//	wait for a while
			//await TestUtil.sleep(3 * 1000 );

			const decreasePost : PostType | null = await postService.updateFor( walletObj.address, { hash : post.hash, key : `statisticView`, value : -1 } );
			expect( decreasePost ).toBeDefined();
			expect( decreasePost.statisticView ).toBe( 0 );

			//	wait for a while
			//await TestUtil.sleep(3 * 1000 );

		}, 60 * 10e3 );
	} );


	describe( "Deletion", () =>
	{
		it( "should logically delete a record by wallet and address from database", async () =>
		{
			//
			//	create a wallet by mnemonic
			//
			const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
			const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

			//
			//	create a new post with signature
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

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			savedPost = await postService.add( walletObj.address, post, post.sig );
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );

			//	wait for a while
			//await TestUtil.sleep(3 * 1000 );

			//	...
			const findPost : PostType | null = await postService.queryOne( walletObj.address, { by : 'walletAndHash', hash : post.hash } );
			expect( findPost ).toBeDefined();
			if ( findPost )
			{
				let toBeDeleted : PostType = { ...findPost,
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				};
				toBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, toBeDeleted );
				expect( toBeDeleted.sig ).toBeDefined();
				expect( typeof toBeDeleted.sig ).toBe( 'string' );
				expect( toBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const result : number = await postService.delete( walletObj.address, toBeDeleted, toBeDeleted.sig );
				expect( result ).toBeGreaterThanOrEqual( 0 );

				const findPostAgain : PostType | null = await postService.queryOne( walletObj.address, { by : 'walletAndHash', hash : post.hash } );
				expect( findPostAgain ).toBe( null );
			}

		}, 60 * 10e3 );
	} );

	describe( "Test statisticView", () =>
	{
		//
		//	create a wallet by mnemonic
		//
		const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
		const walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

		it( "should increase the value of statisticView after calling queryOne", async () =>
		{
			//	assert ...
			expect( walletObj ).not.toBeNull();
			expect( walletObj.mnemonic ).toBe( mnemonic );
			expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.index ).toBe( 0 );
			expect( walletObj.path ).toBe( ethers.defaultPath );

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			await postService.clearAll();

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

			savedPost = await postService.add( walletObj.address, post, post.sig );
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );


			const findPost : PostType | null = await postService.queryOne( walletObj.address, { by : 'hash', hash : post.hash } );
			expect( findPost ).toBeDefined();
			expect( findPost ).toHaveProperty( `statisticView` );
			expect( _.isNumber( findPost.statisticView ) ).toBeTruthy();
			expect( findPost.statisticView ).toBe( 1 );

			//	wait for a while
			//await TestUtil.sleep(3 * 1000 );

		}, 60 * 10e3 );

		it( 'should increase the value of statisticShare', async () =>
		{
			//	assert ...
			expect( walletObj ).not.toBeNull();
			expect( walletObj.mnemonic ).toBe( mnemonic );
			expect( walletObj.privateKey.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.address.startsWith( '0x' ) ).toBe( true );
			expect( walletObj.index ).toBe( 0 );
			expect( walletObj.path ).toBe( ethers.defaultPath );

			//
			//	try to save the record to database
			//
			const postService = new PostService();
			await postService.clearAll();

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

			savedPost = await postService.add( walletObj.address, post, post.sig );
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );

			//
			//	will increase the value of field .statisticShare
			//
			const increasePost1 : PostType | null = await postService.updateFor( walletObj.address, { hash : post.hash, key : `statisticShare`, value : 1 } );
			expect( increasePost1 ).toBeDefined();
			expect( increasePost1.statisticShare ).toBe( 1 );

			const increasePost2 : PostType | null = await postService.updateFor( walletObj.address, { hash : post.hash, key : `statisticShare`, value : 1 } );
			expect( increasePost2 ).toBeDefined();
			expect( increasePost2.statisticShare ).toBe( 2 );
		} );
	} );
} );
