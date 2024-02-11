import { describe, expect } from '@jest/globals';
import { EtherWallet, Web3Signer, TWalletBaseItem, Web3Digester } from "web3id";
import {
	DatabaseConnection,
	ERefDataTypes,
	FavoriteService,
	FavoriteType, LikeService,
	LikeType
} from "../../../src";
import { SchemaUtil } from "../../../src";
import { PostListResult, postSchema, PostType } from "../../../src";
import { PostService } from "../../../src";
import { TQueryListOptions } from "../../../src/models/TQuery";

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
export const testWalletObjList = {
	alice : EtherWallet.createWalletFromMnemonic( testUserList[ 0 ].mnemonic ),
	bob : EtherWallet.createWalletFromMnemonic( testUserList[ 1 ].mnemonic ),
	mary : EtherWallet.createWalletFromMnemonic( testUserList[ 2 ].mnemonic ),
};



/**
 *	unit test
 */
describe( "PostServiceFavLike", () =>
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
	let walletObj : TWalletBaseItem;

	//	...
	const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
	const exceptedKeys : Array<string> = Array.isArray( statisticKeys ) ? statisticKeys : [];
	let savedPost : PostType;


	describe( "Test liked and favorited posts", () =>
	{
		it( "should create some posts by one, and favorite and like them by the other", async () =>
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

			const limitTotal = 100;
			for ( let i = 0; i < limitTotal; i ++ )
			{
				//	choose a user to create post
				walletObj = testWalletObjList.alice;
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

				savedPost = await postService.add( walletObj.address, post, post.sig );
				expect( savedPost ).toBeDefined();
				expect( savedPost ).toHaveProperty( '_id' );
				expect( savedPost ).toHaveProperty( 'wallet' );

				//
				//	favorite the post we just created by Bob
				//
				walletObj = testWalletObjList.bob;
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
			}

			//
			//	query the post list of Alice by Bob
			//
			walletObj = testWalletObjList.bob;
			const pageSize = 10;
			for ( let page = 1; page <= Math.ceil( limitTotal / pageSize ); page ++ )
			{
				const options : TQueryListOptions = {
					pageNo : page,
					pageSize : pageSize
				};
				const results : PostListResult = await postService.queryList(
					walletObj.address,	//	current user
					{
						by : 'address',
						address : testWalletObjList.alice.address,	//	target user
						options : options
					} );
				expect( results ).toHaveProperty( 'total' );
				expect( results ).toHaveProperty( 'pageNo' );
				expect( results ).toHaveProperty( 'pageSize' );
				expect( results ).toHaveProperty( 'list' );
				expect( results.pageNo ).toBe( options.pageNo );
				expect( results.pageSize ).toBe( options.pageSize );
				expect( results.total ).toBe( limitTotal );

				// console.log( results );
				// {
				// 	total: 100,
				// 		pageNo: 1,
				// 	pageSize: 10,
				// 	list: [
				// 	{
				// 		_id: new ObjectId("65c7e38adcb658af2b43a848"),
				// 		timestamp: 1707598730420,
				// 		hash: '0xc03a4d51ebbc140d4859f1194d71b97d312a54ae1606b0973948416aa24af6b0',
				// 		version: '1.0.0',
				// 		deleted: '000000000000000000000000',
				// 		wallet: '0xc8f60eaf5988ac37a2963ac5fabe97f709d6b357',
				// 		bitcoinPrice: 26888,
				// 		sig: '0x3b82a4b8b101e4e0ddecc16daabdb91a8dad5c28f5c3d6dcb008f4c40f5906445cc502475c80553edfbee0733e5d49ac018ea8ed836dc35ea46c70a2cb5639c71c',
				// 		contentType: 'original',
				// 		authorName: 'XING',
				// 		authorAvatar: 'https://avatars.githubusercontent.com/u/142800322?v=4',
				// 		body: 'Hello 1 99',
				// 		pictures: [],
				// 		videos: [],
				// 		statisticView: 0,
				// 		statisticRepost: 0,
				// 		statisticQuote: 0,
				// 		statisticLike: 1,
				// 		statisticFavorite: 1,
				// 		statisticReply: 0,
				// 		remark: 'no ... 99',
				// 		createdAt: 2024-02-10T20:58:50.420Z,
				// 		updatedAt: 2024-02-10T20:58:50.444Z,
				// 		__v: 0,
				// 		_walletFavorited: true,
				// 		_walletLiked: true
				// 	},
				//	...
				// }
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
						expect( record[ postService.walletFavoritedKey ] ).toBeTruthy();
						expect( record[ postService.walletLikedKey ] ).toBeTruthy();
					}
				}
			}

		}, 60 * 10e3 );
	} );
} );
