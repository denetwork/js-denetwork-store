import { describe, expect } from '@jest/globals';
import { EtherWallet, Web3Signer, TWalletBaseItem, Web3Digester } from "web3id";
import { isAddress } from "ethers";
import {
	DatabaseConnection,
	ERefDataTypes,
	FavoriteService,
	FavoriteType, FollowerListResult, FollowerService,
	FollowerType,
	LikeService,
	LikeType
} from "../../../src";
import { TestUtil, TypeUtil } from "denetwork-utils";
import { SchemaUtil } from "../../../src";
import { PostListResult, postSchema, PostType } from "../../../src";
import { PostService } from "../../../src";
import { TQueryListOptions } from "../../../src/models/TQuery";
import { PortalService } from "../../../src";
import _ from "lodash";

export interface TestUser
{
	id : number,
	name : string;
	mnemonic : string;
}
export const testUserList : Array<TestUser> = [
	{
		id : 1,
		name : 'Alice',
		mnemonic : 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient',
	},
	{
		id : 2,
		name : 'Bob',
		mnemonic : 'evidence cement snap basket genre fantasy degree ability sunset pistol palace target',
	},
	{
		id : 3,
		name : 'Mary',
		mnemonic : 'electric shoot legal trial crane rib garlic claw armed snow blind advance',
	}
];
export const testUserAlice : number = 0;
export const testUserBob : number = 1;
export const testUserMary : number = 2;





/**
 *	unit test
 */
describe( "PortalService", () =>
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

	//
	//	create a wallet by mnemonic
	//
	const mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
	let walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( mnemonic );

	//	...
	const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
	const exceptedKeys : Array<string> = Array.isArray( statisticKeys ) ? statisticKeys : [];
	let savedPost : PostType;


	describe( "Test recommended portal", () =>
	{
		it( "should create some posts, and then favorite and like them", async () =>
		{
			//
			//	create many contacts
			//
			const postService = new PostService();
			await postService.clearAll();

			const favoriteService = new FavoriteService();
			await favoriteService.clearAll();

			const likeService = new LikeService();
			await likeService.clearAll();

			for ( let i = 0; i < 500; i ++ )
			{
				//	randomly, choose a user
				walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ new Date().getTime() % 3 ].mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

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
					bitcoinPrice : '25888',
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

				savedPost = await postService.add( walletObj.address, post, post.sig );
				expect( savedPost ).toBeDefined();
				expect( savedPost ).toHaveProperty( '_id' );
				expect( savedPost ).toHaveProperty( 'wallet' );

				//
				//	randomly, choose a user and favorite the post we just created
				//
				walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ new Date().getTime() % 3 ].mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

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

				//	save to our database
				const favoritedRecord = await favoriteService.add( walletObj.address, favorite, favorite.sig );
				expect( favoritedRecord ).toBeDefined();
				expect( favoritedRecord ).toHaveProperty( '_id' );
				expect( favoritedRecord ).toHaveProperty( 'wallet' );
				expect( favoritedRecord ).toHaveProperty( 'refType' );
				expect( favoritedRecord ).toHaveProperty( 'refHash' );


				//
				//	randomly, choose a user and like the post we just created
				//
				walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ new Date().getTime() % 3 ].mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();
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

				//	save to our database
				const lickedRecord = await likeService.add( walletObj.address, like, like.sig );
				expect( lickedRecord ).toBeDefined();
				expect( lickedRecord ).toHaveProperty( '_id' );
				expect( lickedRecord ).toHaveProperty( 'wallet' );
				expect( lickedRecord ).toHaveProperty( 'refType' );
				expect( lickedRecord ).toHaveProperty( 'refHash' );

				await TestUtil.sleep(new Date().getTime() % 30 );
			}

			//	wait for a while
			await TestUtil.sleep(3 * 1000 );

		}, 60 * 10e3 );


		it( "should return recommended posts for each person", async () =>
		{
			for ( let i = 0; i < 3; i ++ )
			{
				//	Alice
				walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ i ].mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

				const portalService = new PortalService();
				const pageOptions : TQueryListOptions = {
					pageNo : 1,
					pageSize : 30,
					sort : { createdAt : 'desc' }
				};
				//const results : PostListResult = await portalService.queryRecommendedPostList( walletObj.address, { options : pageOptions }, undefined );
				const results : PostListResult = await portalService.queryList( walletObj.address, { by : 'recommendedPostList', options : pageOptions }, undefined );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'list' );
				expect( _.isNumber( results.total ) ).toBeTruthy();
				expect( results.total ).toBeGreaterThan( 0 );
				expect( Array.isArray( results.list ) ).toBeTruthy();
				expect( results.list.length ).toBeGreaterThan( 0 );
				expect( results.total ).toBeGreaterThanOrEqual( results.list.length );

				let walletFavorited : number = 0;
				let walletLiked : number = 0;
				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					let recordIndex : number = 0;
					let previousPost : PostType = {};
					for ( const record of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( record ).toHaveProperty( key );
						}

						expect( record ).toHaveProperty( portalService.walletFavoritedKey );
						expect( record ).toHaveProperty( portalService.walletLikedKey );
						walletFavorited += Number( !! record[ portalService.walletFavoritedKey ] );
						walletLiked += Number( !! record[ portalService.walletLikedKey ] );

						if ( recordIndex > 0 )
						{
							expect( previousPost ).toBeDefined();
							expect( previousPost.timestamp ).not.toBeNaN();
							expect( previousPost.timestamp ).toBeGreaterThan( 0 );
							expect( previousPost.timestamp ).toBeGreaterThan( record.timestamp );
							expect( previousPost.timestamp ).toBeLessThan( new Date().getTime() );
							expect( record.timestamp - previousPost.timestamp ).toBeLessThanOrEqual( 30 );
						}

						//	save previous post
						previousPost = _.cloneDeep( record );
						recordIndex ++;
					}
				}

				expect( walletFavorited ).toBeGreaterThan( 0 );
				expect( walletLiked ).toBeGreaterThan( 0 );
			}

		}, 60 * 10e3 );
	} );





	describe( "Test followee portal", () =>
	{
		it( "should clear following relationship", async () =>
		{
			const followerService = new FollowerService();
			await followerService.clearAll();

			for ( const testUser of testUserList )
			{
				const userWalletObj = EtherWallet.createWalletFromMnemonic( testUser.mnemonic );
				expect( userWalletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( userWalletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( userWalletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( userWalletObj.address ) ).toBeTruthy();

				const results : FollowerListResult = await followerService.queryList( userWalletObj.address, { by : 'wallet' } );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.total ).toBe( 0 );
				expect( Array.isArray( results.list ) ).toBeTruthy();
				expect( results.list.length ).toBe( 0 );
			}
		});
		it( "should make Bob following Alice", async () =>
		{
			//
			//	create role instances
			//
			const aliceWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserAlice ].mnemonic );
			expect( aliceWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( aliceWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( aliceWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( aliceWalletObj.address ) ).toBeTruthy();

			const bobWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserBob ].mnemonic );
			expect( bobWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( bobWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( bobWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( bobWalletObj.address ) ).toBeTruthy();

			//
			//	Make Bob following Alice
			//
			let bobFollowAlice : FollowerType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : bobWalletObj.address,		//	follower
				address : aliceWalletObj.address,	//	followee
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			//	signed by Bob
			bobFollowAlice.sig = await Web3Signer.signObject( bobWalletObj.privateKey, bobFollowAlice );
			bobFollowAlice.hash = await Web3Digester.hashObject( bobFollowAlice );
			expect( bobFollowAlice.sig ).toBeDefined();
			expect( typeof bobFollowAlice.sig ).toBe( 'string' );
			expect( bobFollowAlice.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	save to our database
			const followerService = new FollowerService();
			const resultBobFollowAlice = await followerService.add( bobWalletObj.address, bobFollowAlice, bobFollowAlice.sig );
			expect( resultBobFollowAlice ).toBeDefined();

		});
		it( "should make Mary following Alice", async () =>
		{
			//
			//	create role instances
			//
			const aliceWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserAlice ].mnemonic );
			expect( aliceWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( aliceWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( aliceWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( aliceWalletObj.address ) ).toBeTruthy();

			const maryWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserMary ].mnemonic );
			expect( maryWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( maryWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( maryWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( maryWalletObj.address ) ).toBeTruthy();

			//
			//	Make Mary follow Alice
			//
			let maryFollowAlice : FollowerType = {
				timestamp : new Date().getTime(),
				hash : '',
				version : '1.0.0',
				deleted : SchemaUtil.createHexStringObjectIdFromTime( 0 ),
				wallet : maryWalletObj.address,		//	follower
				address : aliceWalletObj.address,	//	followee
				sig : ``,
				name : `Sam`,
				avatar : 'https://avatars.githubusercontent.com/u/142800322?v=4',
				remark : 'no remark',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			//	signed by Bob
			maryFollowAlice.sig = await Web3Signer.signObject( maryWalletObj.privateKey, maryFollowAlice );
			maryFollowAlice.hash = await Web3Digester.hashObject( maryFollowAlice );
			expect( maryFollowAlice.sig ).toBeDefined();
			expect( typeof maryFollowAlice.sig ).toBe( 'string' );
			expect( maryFollowAlice.sig.length ).toBeGreaterThanOrEqual( 0 );

			//	save to our database
			const followerService = new FollowerService();
			const result = await followerService.add( maryWalletObj.address, maryFollowAlice, maryFollowAlice.sig );
			expect( result ).toBeDefined();
		});

		it( "should create some posts in the persona of Alice", async () =>
		{
			//
			//	create many contacts
			//
			const postService = new PostService();
			await postService.clearAll();

			walletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserAlice ].mnemonic );
			expect( walletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

			for ( let i = 0; i < 500; i ++ )
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
					bitcoinPrice : '25888',
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

				//	save to our database
				savedPost = await postService.add( walletObj.address, post, post.sig );
				expect( savedPost ).toBeDefined();
				expect( savedPost ).toHaveProperty( '_id' );
				expect( savedPost ).toHaveProperty( 'wallet' );

				await TestUtil.sleep(new Date().getTime() % 30 );
			}

			//	wait for a while
			await TestUtil.sleep(3 * 1000 );

		}, 60 * 10e3 );


		it( "should return the followee posts in the persona of Bob and Mary", async () =>
		{
			//
			//	create role instances
			//
			const aliceWalletObj = EtherWallet.createWalletFromMnemonic( testUserList[ testUserAlice ].mnemonic );
			expect( aliceWalletObj ).not.toBeNull();
			expect( EtherWallet.isValidPrivateKey( aliceWalletObj.privateKey ) ).toBeTruthy();
			expect( EtherWallet.isValidPublicKey( aliceWalletObj.publicKey ) ).toBeTruthy();
			expect( EtherWallet.isValidAddress( aliceWalletObj.address ) ).toBeTruthy();

			//	...
			const mnemonicsBobAndMary : Array<string> = [
				testUserList[ testUserBob ].mnemonic,
				testUserList[ testUserMary ].mnemonic,
			];
			for ( const mnemonic of mnemonicsBobAndMary )
			{
				walletObj = EtherWallet.createWalletFromMnemonic( mnemonic );
				expect( walletObj ).not.toBeNull();
				expect( EtherWallet.isValidPrivateKey( walletObj.privateKey ) ).toBeTruthy();
				expect( EtherWallet.isValidPublicKey( walletObj.publicKey ) ).toBeTruthy();
				expect( EtherWallet.isValidAddress( walletObj.address ) ).toBeTruthy();

				const portalService = new PortalService();
				const pageOptions : TQueryListOptions = {
					pageNo : 1,
					pageSize : 30,
					sort : { createdAt : 'desc' }
				};
				//const results : PostListResult = await portalService.queryFolloweePostList( walletObj.address, { options : pageOptions }, undefined );
				const results : PostListResult = await portalService.queryList( walletObj.address, { by : 'followeePostList', options : pageOptions }, undefined );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'list' );
				expect( _.isNumber( results.total ) ).toBeTruthy();
				expect( results.total ).toBeGreaterThan( 0 );
				expect( Array.isArray( results.list ) ).toBeTruthy();
				expect( results.list.length ).toBeGreaterThan( 0 );
				expect( results.total ).toBeGreaterThanOrEqual( results.list.length );

				const requiredKeys : Array<string> | null = SchemaUtil.getRequiredKeys( postSchema );
				expect( Array.isArray( requiredKeys ) ).toBeTruthy();
				if ( requiredKeys )
				{
					let recordIndex : number = 0;
					let previousPost : PostType = {};
					for ( const record of results.list )
					{
						for ( const key of requiredKeys )
						{
							expect( record ).toHaveProperty( key );
						}

						//	check the following relationship
						expect( record ).toHaveProperty( `wallet` );
						expect( isAddress( record.wallet ) ).toBeTruthy();
						expect( TypeUtil.isStringEqualNoCase( record.wallet, aliceWalletObj.address ) ).toBeTruthy();

						//	...
						expect( record ).toHaveProperty( portalService.walletFavoritedKey );
						expect( record ).toHaveProperty( portalService.walletLikedKey );

						//	check order
						if ( recordIndex > 0 )
						{
							expect( previousPost ).toBeDefined();
							expect( previousPost.timestamp ).not.toBeNaN();
							expect( previousPost.timestamp ).toBeGreaterThan( 0 );
							expect( previousPost.timestamp ).toBeGreaterThan( record.timestamp );
							expect( previousPost.timestamp ).toBeLessThan( new Date().getTime() );
							expect( record.timestamp - previousPost.timestamp ).toBeLessThanOrEqual( 30 );
						}

						//	save previous post
						previousPost = _.cloneDeep( record );
						recordIndex ++;
					}
				}
			}

		}, 60 * 10e3 );
	} );
} );
