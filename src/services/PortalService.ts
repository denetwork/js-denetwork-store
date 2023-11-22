import { BaseService } from "./BaseService";
import { TQueryListOptions } from "../models/TQuery";
import { PostListResult, PostModel, PostType } from "../entities/PostEntity";
import { Web3Digester } from "web3id";
import { PageUtil } from "denetwork-utils";
import { SortOrder } from "mongoose";
import { QueryUtil } from "../utils/QueryUtil";
import { isAddress } from "ethers";
import { PostService } from "./PostService";
import { FollowerService } from "./FollowerService";
import { FollowerListResult } from "../entities/FollowerEntity";
import _ from "lodash";

/**
 * 	@class
 */
export class PortalService extends BaseService
{
	constructor()
	{
		super();
	}

	public queryRecommendedPostList( wallet ?: string, options ? : TQueryListOptions ) : Promise<PostListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : {
					[ key : string ] : SortOrder
				} = QueryUtil.getSafeSortBy( options?.sort );

				let result : PostListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				//	...
				const postService = new PostService();

				//	...
				await this.connect();
				const posts : Array<PostType> = await PostModel
					.find()
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<PostType>>()
					.exec();
				if ( Array.isArray( posts ) )
				{
					for ( let i = 0; i < posts.length; i++ )
					{
						if ( isAddress( wallet ) )
						{
							posts[ i ][ this.walletFavoritedKey ] =
								Web3Digester.isValidHash( posts[ i ].hash ) &&
								await postService.walletFavoritedPost( wallet, posts[ i ].hash );
							posts[ i ][ this.walletLikedKey ] =
								Web3Digester.isValidHash( posts[ i ].hash ) &&
								await postService.walletLikedPost( wallet, posts[ i ].hash );
						}
					}

					//	...
					result.list = posts;
					result.total = posts.length;
				}

				//	...
				resolve( result );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	public queryFolloweePostList( wallet : string, options ?: TQueryListOptions ) : Promise<PostListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! isAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}

				//	...
				const followerService = new FollowerService();
				const postService = new PostService();

				let followers : Array<string> = [];
				const followerResult : FollowerListResult = await followerService.queryList(
					wallet,
					{ by : 'wallet',
						options : {
							pageNo : 1,
							pageSize : 300
						} }
				);
				if ( followerResult &&
					_.has( followerResult, 'list' ) )
				{
					followers = followerResult.list.map( item => String( item.address ).trim().toLowerCase() );
				}

				//	...
				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : {
					[ key : string ] : SortOrder
				} = QueryUtil.getSafeSortBy( options?.sort );

				let result : PostListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				//	...
				await this.connect();
				const posts : Array<PostType> = await PostModel
					.find( { "wallet": { $in: followers } } )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<PostType>>()
					.exec();
				if ( Array.isArray( posts ) )
				{
					for ( let i = 0; i < posts.length; i++ )
					{
						if ( isAddress( wallet ) )
						{
							posts[ i ][ this.walletFavoritedKey ] =
								Web3Digester.isValidHash( posts[ i ].hash ) &&
								await postService.walletFavoritedPost( wallet, posts[ i ].hash );
							posts[ i ][ this.walletLikedKey ] =
								Web3Digester.isValidHash( posts[ i ].hash ) &&
								await postService.walletLikedPost( wallet, posts[ i ].hash );
						}
					}

					//	...
					result.list = posts;
					result.total = posts.length;
				}

				//	...
				resolve( result );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}
}
