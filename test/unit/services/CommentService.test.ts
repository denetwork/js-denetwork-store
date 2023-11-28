import { describe, expect } from '@jest/globals';
import { EtherWallet, Web3Signer, TWalletBaseItem, Web3Digester } from "web3id";
import { ethers } from "ethers";
import { DatabaseConnection, ERefDataTypes, FavoriteService, FavoriteType, LikeService, LikeType } from "../../../src";
import { SchemaUtil } from "../../../src";
import { PostListResult, postSchema, PostType } from "../../../src";
import { PostService } from "../../../src";
import { TQueryListOptions } from "../../../src/models/TQuery";
import { commentSchema, CommentType } from "../../../src";
import { CommentService } from "../../../src";
import { resultErrors } from "../../../src";
import _ from "lodash";


/**
 *	unit test
 */
describe( "CommentService", () =>
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

		//	clear all before all testing
		const postService = new PostService();
		await postService.clearAll();
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
	let savedComment : CommentType;


	describe( "Add record", () =>
	{
		it( "should add a comment to an existing post", async () =>
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
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
				refType : ERefDataTypes.post,
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
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( '_id' );
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( savedPost ).toHaveProperty( 'sig' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();
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

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );


			//
			//	create comment
			//
			let comment : CommentType = {
				postHash : post.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );
			expect( comment.sig ).toBeDefined();
			expect( typeof comment.sig ).toBe( 'string' );
			expect( comment.sig.length ).toBeGreaterThanOrEqual( 0 );

			//
			//	try to save the record to database
			//
			const commentService = new CommentService();
			savedComment = await commentService.add( walletObj.address, comment, comment.sig );
			expect( savedComment ).toBeDefined();
			expect( savedComment ).toHaveProperty( '_id' );
			expect( savedComment ).not.toHaveProperty( commentService.walletFavoritedKey );
			expect( savedComment[ commentService.walletFavoritedKey ] ).toBe( undefined );

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query one", () =>
	{
		it( "should return a record by wallet and address from database", async () =>
		{
			const commentService = new CommentService();
			const result : CommentType | null = await commentService.queryOne( walletObj.address, { by : `walletAndHash`, hash : savedComment.hash } );
			expect( result ).toBeDefined();
			expect( result ).toHaveProperty( commentService.walletFavoritedKey );
			expect( result[ commentService.walletFavoritedKey ] ).toBeFalsy();
			//
			//    console.log( result );
			//    {
			//       _id: new ObjectId("6500d84870e70b0ca08d1609"),
			//       timestamp: 1694554184832,
			//       hash: '0xe4748c36ffeaa9ef4d314c7679d6d9e4baa4fb1a1723852603c9558bbdb453b9',
			//       version: '1.0.0',
			//       deleted: new ObjectId("000000000000000000000000"),
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       sig: '0x0797329fb0d351a5b5ebcf8d09ddcb3f17fc6fd581b41e0e96a2dd691b5d3f421267fcfb6f2960fa5e6eccca55a9c8469fea151998c80b03ddf835ffac009eb51c',
			//       postHash: '0xd8c0eb03e5ffb11c7e980ce1aad43a7e002bc8775070be3419e25903cf7af875',
			//       authorName: 'XING',
			//       authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       replyTo: 'HaSeme',
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
			//       createdAt: 2023-09-12T21:29:44.832Z,
			//       updatedAt: 2023-09-12T21:29:44.832Z,
			//       __v: 0
			//     }
			//
			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
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

	describe( "Query one with my favorite", () =>
	{
		it( "should return a record by wallet and hash with key `_walletFavorited`", async () =>
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
				refType : ERefDataTypes.comment,
				refHash : savedComment.hash,
				refBody : 'will favorite this comment',
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
			const favoriteRecord = await favoriteService.add( walletObj.address, favorite, favorite.sig );
			expect( favoriteRecord ).toBeDefined();

			//
			//	...
			//
			const commentService = new CommentService();
			const result : CommentType | null = await commentService.queryOne( walletObj.address, { by : `hash`, hash : savedComment.hash } );
			expect( result ).toBeDefined();
			expect( result ).toHaveProperty( commentService.walletFavoritedKey );
			expect( result[ commentService.walletFavoritedKey ] ).toBeTruthy();
			//
			//	console.log( result );
			//
			//	{
			//       _id: new ObjectId("655ceab804408ad6071a1119"),
			//       timestamp: 1700588216042,
			//       hash: '0xc7b84e4e80394d8e8e923d32bbc4ad5e8d2dcda3fe9f249429ce2b17f1d941b8',
			//       version: '1.0.0',
			//       deleted: '000000000000000000000000',
			//       wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//       bitcoinPrice: '25888',
			//       sig: '0x558032f5793fd26eb51dd779f8f4a8c6f7913bb0002fdd19eaecf06cff19020747f290c8bd91e55eaff14173e1c28adbc2ec7069f965fc94aecf4c25c5ebcaf31b',
			//       postHash: '0x34f51428a0b33bccc0f65d369a425c72ef32e6b0239048ca0a042fbb946dacc3',
			//       authorName: 'XING',
			//       authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//       replyTo: 'HaSeme',
			//       postSnippet: 'post name abc',
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
			//       createdAt: 2023-11-21T17:36:56.042Z,
			//       updatedAt: 2023-11-21T17:37:01.127Z,
			//       __v: 0,
			//       _walletFavorited: true
			//     }
			//
			if ( result )
			{
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
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

		it( "should return a record with false by key `_walletFavorited` after cancelling fav", async () =>
		{
			const favoriteService = new FavoriteService();
			await favoriteService.clearAll();

			//
			//	favorite this comment
			//
			let favorite : FavoriteType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.comment,
				refHash : savedComment.hash,
				refBody : 'will favorite this comment',
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
			const favoriteRecord = await favoriteService.add( walletObj.address, favorite, favorite.sig );
			expect( favoriteRecord ).toBeDefined();

			//
			//	check the value of field `_walletFavorited` in comment
			//
			const commentService = new CommentService();
			const result : CommentType | null = await commentService.queryOne( walletObj.address, { by : `hash`, hash : savedComment.hash } );
			expect( result ).toBeDefined();
			expect( result ).toHaveProperty( commentService.walletFavoritedKey );
			expect( result[ commentService.walletFavoritedKey ] ).toBeTruthy();

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
			//	check the value of field `_walletFavorited` in comment
			//
			const commentOneResult : CommentType | null = await commentService.queryOne( walletObj.address, { by : `hash`, hash : savedComment.hash } );
			expect( commentOneResult ).toBeDefined();
			expect( commentOneResult ).toHaveProperty( commentService.walletFavoritedKey );
			expect( commentOneResult[ commentService.walletFavoritedKey ] ).toBeFalsy();

		}, 60 * 10e3 );

		it( "should return a record with false by key `_walletFavorited` after unliking", async () =>
		{
			const commentService = new CommentService();
			const likeService = new LikeService();
			await likeService.clearAll();

			//
			//	create a new like with ether signature
			//
			let like : LikeType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				refType : ERefDataTypes.comment,
				refHash : savedComment.hash,
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

			//	add favorite and update statistic
			const likeRecord = await likeService.add( walletObj.address, like, like.sig );
			expect( likeRecord ).toBeDefined();

			//
			//	check the value of field `_walletFavorited` in comment
			//
			const commentResult : CommentType | null = await commentService.queryOne( walletObj.address, { by : `hash`, hash : savedComment.hash } );
			expect( commentResult ).toBeDefined();
			expect( commentResult ).toHaveProperty( commentService.walletLikedKey );
			expect( commentResult[ commentService.walletLikedKey ] ).toBeTruthy();


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
			//	check the value of field `_walletFavorited` in comment
			//
			const commentOneResult : CommentType | null = await commentService.queryOne( walletObj.address, { by : `hash`, hash : savedComment.hash } );
			expect( commentOneResult ).toBeDefined();
			expect( commentOneResult ).toHaveProperty( commentService.walletLikedKey );
			expect( commentOneResult[ commentService.walletLikedKey ] ).toBeFalsy();

		}, 60 * 10e3 );
	} );

	describe( "Query list", () =>
	{
		it( "should return a list by postHash", async () =>
		{
			expect( savedPost ).toBeDefined();
			expect( savedPost ).toHaveProperty( 'hash' );
			expect( SchemaUtil.isValidKeccak256Hash( savedPost.hash ) ).toBeTruthy();

			const commentService = new CommentService();
			const listResult : PostListResult = await commentService.queryList( '', { by : 'postHash', postHash : savedPost.hash } );
			expect( listResult ).toHaveProperty( 'total' );
			expect( listResult ).toHaveProperty( 'list' );
			//
			//    console.log( results );
			//    {
			//       total: 1,
			//       pageNo: 1,
			//       pageSize: 30,
			//       list: [
			//         {
			//           _id: new ObjectId("6500da146696c1522030a371"),
			//           timestamp: 1694554644423,
			//           hash: '0xae5c370e8b9ee7b938f861ca0e2a13e2880833d763b70b21b7b3c1cdb7300c58',
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0x56c1d0395bd2d4211656c80c29715e60c6ba3f48c26bf120d0038060606209034fcb8c493eff16b0e56355ba2b14ac36de9362a8cc9765cbc3ba9141f5108ee61c',
			//           postHash: '0x7c44ad52db9020aec80ab8efabda2c5ac4dd01d0d4aafac2a660fa73854d249b',
			//           authorName: 'XING',
			//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           replyTo: 'HaSeme',
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
			//           createdAt: 2023-09-12T21:37:24.423Z,
			//           updatedAt: 2023-09-12T21:37:24.423Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const record of listResult.list )
				{
					for ( const key of requiredKeys )
					{
						expect( record ).toHaveProperty( key );
					}

					//
					//	the wallet field is empty when submitting the query,
					//	so `commentService.walletFavoritedKey` will undefined
					//
					expect( record ).not.toHaveProperty( commentService.walletFavoritedKey );
					expect( record[ commentService.walletFavoritedKey ] ).toBe( undefined );

					//
					//	check statisticView
					//
					expect( record ).toHaveProperty( `statisticView` );
					expect( _.isNumber( record.statisticView ) ).toBeTruthy();
					expect( record.statisticView ).toBeGreaterThan( 0 );
				}
			}

		}, 60 * 10e3 );

		it( "should return a list by wallet", async () =>
		{
			const commentService = new CommentService();
			const results : PostListResult = await commentService.queryList( walletObj.address, { by : 'walletAndPostHash', address : walletObj.address } );
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
			//           _id: new ObjectId("6500db9a0726ae21cc1b5ef2"),
			//           timestamp: 1694555034596,
			//           hash: '0x9edc9f19eea240cf171f41fa463690467850a0d6eb1025bcdc75d02b1e3fd386',
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0x2d3de4632f64ee9dd39d3582ab7796ead0cd65c3c58323bb98f523b2968a178c143d0ccb6fe8800d1e629afc45cb43993b28a7c6ba54dfdd13a985a3f2d7f0c41b',
			//           postHash: '0xda30597a60ef0795e277656edcf6ac9aeae4d81d39f79bf7f7297013c002325a',
			//           authorName: 'XING',
			//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           replyTo: 'HaSeme',
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
			//           createdAt: 2023-09-12T21:43:54.597Z,
			//           updatedAt: 2023-09-12T21:43:54.597Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const record of results.list )
				{
					for ( const key of requiredKeys )
					{
						expect( record ).toHaveProperty( key );
					}

					expect( record ).toHaveProperty( commentService.walletFavoritedKey );
					//expect( record[ commentService.walletFavoritedKey ] ).toBeFalsy();
				}
			}

		}, 60 * 10e3 );

		it( "should return a list by wallet and postHash", async () =>
		{
			const commentService = new CommentService();
			const results : PostListResult = await commentService.queryList( walletObj.address, { by : 'walletAndPostHash', address : walletObj.address, postHash : savedPost.hash } );
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
			//           _id: new ObjectId("6500dc0a3547a24378f5018b"),
			//           timestamp: 1694555146372,
			//           hash: '0x5290d0b8917e44ba6c474ed144776c06892ac92a0c81600ab84227540af016fd',
			//           version: '1.0.0',
			//           deleted: new ObjectId("000000000000000000000000"),
			//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
			//           sig: '0x2034327d3b1f79699ad195c55a86552b216f827e62ea6a4fc068886bba5679586b7be855eecd8e1bbc3b116b920e07ca4cedaa1e4b4cbf0b2930e6d371d4d0211b',
			//           postHash: '0x628d5cbdaf3cd099ab0e02a9515f0da08a60f1fb0129661893101009738e0066',
			//           authorName: 'XING',
			//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
			//           replyTo: 'HaSeme',
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
			//           createdAt: 2023-09-12T21:45:46.373Z,
			//           updatedAt: 2023-09-12T21:45:46.373Z,
			//           __v: 0
			//         }
			//       ]
			//     }
			//
			const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
			expect( Array.isArray( requiredKeys ) ).toBeTruthy();
			if ( requiredKeys )
			{
				for ( const record of results.list )
				{
					for ( const key of requiredKeys )
					{
						expect( record ).toHaveProperty( key );
					}

					expect( record ).toHaveProperty( commentService.walletFavoritedKey );
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
			const commentService = new CommentService();
			await commentService.clearAll();
			for ( let i = 0; i < 100; i ++ )
			{
				const NoStr : string = Number(i).toString().padStart( 2, '0' );
				let comment : CommentType = {
					postHash : savedPost.hash,
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					sig : ``,
					authorName : 'XING',
					authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					replyTo : 'HaSeme',
					postSnippet : `post name abc`,
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
				comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
				comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );
				expect( comment.sig ).toBeDefined();
				expect( typeof comment.sig ).toBe( 'string' );
				expect( comment.sig.length ).toBeGreaterThanOrEqual( 0 );

				const result : PostType | null = await commentService.add( walletObj.address, comment, comment.sig );
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
				const results : PostListResult = await commentService.queryList( '', { by : 'postHash', postHash : savedPost.hash, options : options } );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.pageNo ).toBe( options.pageNo );
				expect( results.pageSize ).toBe( options.pageSize );
				//
				//    console.log( results );
				//    {
				//       total: 10,
				//       pageNo: 1,
				//       pageSize: 10,
				//       list: [
				//         {
				//           _id: new ObjectId("6500dd417151729b4d74e1dd"),
				//           timestamp: 1694555457819,
				//           hash: '0xee83972f75b9383ae83a0ed07bc6fe70608f173038df30499b257454d2bf53f1',
				//           version: '1.0.0',
				//           deleted: new ObjectId("000000000000000000000000"),
				//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
				//           sig: '0xe8c21138207d857d49d7be75e9b0df5d297b4c3d20861e4f074b06656421ed8445f3093bb9791d05cf7f48c68daba9dc1ab888e5e71e4c9e19026fee352157641b',
				//           postHash: '0x80b43c836b71f252c4aa87398fc7c765cb7cd96fd81fb4def58f641bee6a3a66',
				//           authorName: 'XING',
				//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
				//           replyTo: 'HaSeme',
				//           body: 'Hello 1 99',
				//           pictures: [],
				//           videos: [],
				//           bitcoinPrice: '25888',
				//           statisticView: 0,
				//           statisticRepost: 0,
				//           statisticQuote: 0,
				//           statisticLike: 0,
				//           statisticFavorite: 0,
				//           statisticReply: 0,
				//           remark: 'no ... 99',
				//           createdAt: 2023-09-12T21:50:57.819Z,
				//           updatedAt: 2023-09-12T21:50:57.819Z,
				//           __v: 0
				//         },
				//         ...
				//       ]
				//     }
				//
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const record of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( record ).toHaveProperty( key );
						}

						//
						//	the wallet field is empty when submitting the query,
						//	so `commentService.walletFavoritedKey` will undefined
						//
						expect( record ).not.toHaveProperty( commentService.walletFavoritedKey );
						expect( record[ commentService.walletFavoritedKey ] ).toBe( undefined );
					}
				}
			}

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );

	describe( "Query children by pagination", () =>
	{
		it( "should return a list of records by pagination from database", async () =>
		{
			const commentService = new CommentService();
			await commentService.clearAll();

			//
			//	create a parent comment
			//
			let comment : CommentType = {
				postHash : savedPost.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
				body : `Hello, this is the body of parent comment`,
				pictures : [],
				videos : [],
				bitcoinPrice : 26888,
				statisticView : 0,
				statisticRepost : 0,
				statisticQuote : 0,
				statisticLike : 0,
				statisticFavorite : 0,
				statisticReply : 0,
				remark : `this is parent comment`,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );
			expect( comment.sig ).toBeDefined();
			expect( typeof comment.sig ).toBe( 'string' );
			expect( comment.sig.length ).toBeGreaterThanOrEqual( 0 );

			const parentComment : PostType | null = await commentService.add( walletObj.address, comment, comment.sig );
			expect( parentComment ).toBeDefined();

			//
			//	create children comments
			//
			for ( let i = 0; i < 100; i ++ )
			{
				const NoStr : string = Number(i).toString().padStart( 2, '0' );
				let comment : CommentType = {
					postHash : savedPost.hash,
					timestamp : new Date().getTime(),
					hash : '',
					version : '1.0.0',
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
					wallet : walletObj.address,
					sig : ``,
					authorName : 'XING',
					authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
					parentHash : parentComment.hash,
					replyTo : 'HaSeme',
					postSnippet : `post name abc`,
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
				comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
				comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );
				expect( comment.sig ).toBeDefined();
				expect( typeof comment.sig ).toBe( 'string' );
				expect( comment.sig.length ).toBeGreaterThanOrEqual( 0 );

				const result : PostType | null = await commentService.add( walletObj.address, comment, comment.sig );
				expect( result ).toBeDefined();
			}

			//
			//	check .statisticChildrenCount
			//
			const checkParentComment : CommentType = await commentService.queryOne( ``, { by : 'hash', hash : parentComment.hash } );
			expect( checkParentComment ).toBeDefined();
			expect( checkParentComment ).toHaveProperty( `statisticChildrenCount` );
			expect( _.isNumber( checkParentComment.statisticChildrenCount ) ).toBeTruthy();
			expect( checkParentComment.statisticChildrenCount ).toBe( 100 );

			//
			//	Query the normal list by pagination
			//
			for ( let page = 1; page <= 10; page ++ )
			{
				const options : TQueryListOptions = {
					pageNo : page,
					pageSize : 10
				};
				const results : PostListResult = await commentService.queryList( '',
					{ by : 'postHash',
						postHash : savedPost.hash,
						options : options }
				);
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.pageNo ).toBe( options.pageNo );
				expect( results.pageSize ).toBe( options.pageSize );
				//
				//    console.log( results );
				//    {
				//       total: 10,
				//       pageNo: 1,
				//       pageSize: 10,
				//       list: [
				//         {
				//           _id: new ObjectId("6500dd417151729b4d74e1dd"),
				//           timestamp: 1694555457819,
				//           hash: '0xee83972f75b9383ae83a0ed07bc6fe70608f173038df30499b257454d2bf53f1',
				//           version: '1.0.0',
				//           deleted: new ObjectId("000000000000000000000000"),
				//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
				//           sig: '0xe8c21138207d857d49d7be75e9b0df5d297b4c3d20861e4f074b06656421ed8445f3093bb9791d05cf7f48c68daba9dc1ab888e5e71e4c9e19026fee352157641b',
				//           postHash: '0x80b43c836b71f252c4aa87398fc7c765cb7cd96fd81fb4def58f641bee6a3a66',
				//           authorName: 'XING',
				//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
				//           replyTo: 'HaSeme',
				//           body: 'Hello 1 99',
				//           pictures: [],
				//           videos: [],
				//           bitcoinPrice: '25888',
				//           statisticView: 0,
				//           statisticRepost: 0,
				//           statisticQuote: 0,
				//           statisticLike: 0,
				//           statisticFavorite: 0,
				//           statisticReply: 0,
				//           remark: 'no ... 99',
				//           createdAt: 2023-09-12T21:50:57.819Z,
				//           updatedAt: 2023-09-12T21:50:57.819Z,
				//           __v: 0
				//         },
				//         ...
				//       ]
				//     }
				//
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const record of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( record ).toHaveProperty( key );
						}

						expect( record ).not.toHaveProperty( `parentHash` );
						expect( record.parentHash ).toBe( undefined );

						//
						//	the wallet field is empty when submitting the query,
						//	so `commentService.walletFavoritedKey` will undefined
						//
						expect( record ).not.toHaveProperty( commentService.walletFavoritedKey );
						expect( record[ commentService.walletFavoritedKey ] ).toBe( undefined );
					}
				}
			}

			//
			//	Query the children by pagination
			//
			for ( let page = 1; page <= 10; page ++ )
			{
				const options : TQueryListOptions = {
					pageNo : page,
					pageSize : 10
				};
				const results : PostListResult = await commentService.queryList( '',
					{ by : 'postHashAndParentHash',
						postHash : savedPost.hash,
						parentHash : parentComment.hash,
						options : options }
				);
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.pageNo ).toBe( options.pageNo );
				expect( results.pageSize ).toBe( options.pageSize );
				//
				//    console.log( results );
				//    {
				//       total: 10,
				//       pageNo: 1,
				//       pageSize: 10,
				//       list: [
				//         {
				//           _id: new ObjectId("6500dd417151729b4d74e1dd"),
				//           timestamp: 1694555457819,
				//           hash: '0xee83972f75b9383ae83a0ed07bc6fe70608f173038df30499b257454d2bf53f1',
				//           version: '1.0.0',
				//           deleted: new ObjectId("000000000000000000000000"),
				//           wallet: '0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357',
				//           sig: '0xe8c21138207d857d49d7be75e9b0df5d297b4c3d20861e4f074b06656421ed8445f3093bb9791d05cf7f48c68daba9dc1ab888e5e71e4c9e19026fee352157641b',
				//           postHash: '0x80b43c836b71f252c4aa87398fc7c765cb7cd96fd81fb4def58f641bee6a3a66',
				//           authorName: 'XING',
				//           authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
				//           replyTo: 'HaSeme',
				//           body: 'Hello 1 99',
				//           pictures: [],
				//           videos: [],
				//           bitcoinPrice: '25888',
				//           statisticView: 0,
				//           statisticRepost: 0,
				//           statisticQuote: 0,
				//           statisticLike: 0,
				//           statisticFavorite: 0,
				//           statisticReply: 0,
				//           remark: 'no ... 99',
				//           createdAt: 2023-09-12T21:50:57.819Z,
				//           updatedAt: 2023-09-12T21:50:57.819Z,
				//           __v: 0
				//         },
				//         ...
				//       ]
				//     }
				//
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( commentSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					for ( const record of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( record ).toHaveProperty( key );
						}

						expect( record ).toHaveProperty( `parentHash` );
						expect( record.parentHash ).toBe( parentComment.hash );

						//
						//	the wallet field is empty when submitting the query,
						//	so `commentService.walletFavoritedKey` will undefined
						//
						expect( record ).not.toHaveProperty( commentService.walletFavoritedKey );
						expect( record[ commentService.walletFavoritedKey ] ).toBe( undefined );
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
			//
			//	create a new post with signature
			//
			let comment : CommentType = {
				postHash : savedPost.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );

			//
			//	try to save the record to database
			//
			const commentService = new CommentService();
			const savedNewComment = await commentService.add( walletObj.address, comment, comment.sig );
			expect( savedNewComment ).toBeDefined();
			expect( savedNewComment ).toHaveProperty( '_id' );

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

			//
			//	....
			//
			const findComment : CommentType | null = await commentService.queryOne( walletObj.address, { by : 'walletAndHash', hash : comment.hash } );
			expect( findComment ).toBeDefined();
			if ( findComment )
			{
				let toBeUpdated : CommentType = { ...findComment,
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
					const updatedComment : CommentType | null = await commentService.update( walletObj.address, toBeUpdated, toBeUpdated.sig );
					expect( null !== updatedComment ).toBeTruthy();
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
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );

		it( "should update statistics", async () =>
		{
			//
			//	create a new comment with signature
			//
			let comment : CommentType = {
				postHash : savedPost.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );

			//
			//	try to save the record to database
			//
			const commentService = new CommentService();
			const savedNewComment = await commentService.add( walletObj.address, comment, comment.sig );
			expect( savedNewComment ).toBeDefined();
			expect( savedNewComment ).toHaveProperty( '_id' );

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

			//
			//	try to increase statistic
			//
			const increasePost : CommentType | null = await commentService.updateFor( walletObj.address, { hash : comment.hash, key : `statisticView`, value : 1 } );
			expect( increasePost ).toBeDefined();
			expect( increasePost.statisticView ).toBe( 1 );

			//
			//	the value of .statisticView will be increased after calling .queryOne
			//
			const findComment : CommentType | null = await commentService.queryOne( walletObj.address, { by : 'walletAndHash', hash : comment.hash } );
			expect( findComment ).toBeDefined();
			expect( findComment.statisticView ).toBe( 2 );

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

			//	the value of .statisticView will be changed to 1 from 2
			const decreasedComment : CommentType | null = await commentService.updateFor( walletObj.address, { hash : comment.hash, key : `statisticView`, value : -1 } );
			expect( decreasedComment ).toBeDefined();
			expect( decreasedComment.statisticView ).toBe( 1 );

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

		}, 60 * 10e3 );
	} );



	describe( "Deletion", () =>
	{
		it( "should logically delete a record by wallet and address from database", async () =>
		{
			//
			//	create a new comment with signature
			//
			let comment : CommentType = {
				postHash : savedPost.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );

			//
			//	try to save the record to database
			//
			const commentService = new CommentService();
			const savedNewComment = await commentService.add( walletObj.address, comment, comment.sig );
			expect( savedNewComment ).toBeDefined();
			expect( savedNewComment ).toHaveProperty( '_id' );

			//	wait for a while
			//await TestUtil.sleep(5 * 1000 );

			//	...
			const findComment : CommentType | null = await commentService.queryOne( walletObj.address, { by : `walletAndHash`, hash : savedNewComment.hash } );
			expect( findComment ).toBeDefined();
			if ( findComment )
			{
				let toBeDeleted : CommentType = { ...findComment,
					deleted : SchemaUtil.createHexStringObjectIdFromTime( 1 ),
				};
				toBeDeleted.sig = await Web3Signer.signObject( walletObj.privateKey, toBeDeleted );
				expect( toBeDeleted.sig ).toBeDefined();
				expect( typeof toBeDeleted.sig ).toBe( 'string' );
				expect( toBeDeleted.sig.length ).toBeGreaterThanOrEqual( 0 );

				//	...
				const result : number = await commentService.delete( walletObj.address, toBeDeleted, toBeDeleted.sig );
				expect( result ).toBeGreaterThanOrEqual( 0 );

				const findCommentAgain : PostType | null = await commentService.queryOne( walletObj.address, { by : 'walletAndHash', hash : savedNewComment.hash } );
				console.log( `findCommentAgain :`, findCommentAgain );
				expect( findCommentAgain ).toBe( null );
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

		it( "should increase the value of statisticView after calling queryOne/queryList", async () =>
		{
			const commentService = new CommentService();
			await commentService.clearAll();

			//
			//	create a new comment with signature
			//
			let comment : CommentType = {
				postHash : savedPost.hash,
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : walletObj.address,
				sig : ``,
				authorName : 'XING',
				authorAvatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				replyTo : 'HaSeme',
				postSnippet : `post name abc`,
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
			comment.sig = await Web3Signer.signObject( walletObj.privateKey, comment, exceptedKeys );
			comment.hash = await Web3Digester.hashObject( comment, exceptedKeys );

			//	try to save the record to database
			const savedNewComment = await commentService.add( walletObj.address, comment, comment.sig );
			expect( savedNewComment ).toBeDefined();
			expect( savedNewComment ).toHaveProperty( '_id' );


			//
			//	the value of statisticView will be increased after calling queryOne
			//
			const findComment : CommentType | null = await commentService.queryOne( walletObj.address, { by : `hash`, hash : savedNewComment.hash } );
			expect( findComment ).toBeDefined();
			expect( findComment ).toHaveProperty( `statisticView` );
			expect( _.isNumber( findComment.statisticView ) ).toBeTruthy();
			expect( findComment.statisticView ).toBe( 1 );


			//
			//	the value of statisticView of items in the list will be increased after calling queryList
			//
			const options : TQueryListOptions = {
				pageNo : 1,
				pageSize : 10
			};
			const listResult : PostListResult = await commentService.queryList( '', { by : 'postHash', postHash : savedPost.hash, options : options } );
			expect( listResult ).toBeDefined();
			expect( listResult ).toHaveProperty( `list` );
			expect( Array.isArray( listResult.list ) ).toBeTruthy();
			expect( listResult.list.length ).toBeGreaterThan( 0 );
			for ( const commentItem of listResult.list )
			{
				expect( commentItem ).toBeDefined();
				expect( commentItem ).toHaveProperty( `statisticView` );
				expect( _.isNumber( commentItem.statisticView ) ).toBeTruthy();
				expect( commentItem.statisticView ).toBe( 2 );
			}
		} );
	});
} );
