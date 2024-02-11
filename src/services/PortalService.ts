import { BaseService } from "./BaseService";
import { TQueryListOptions } from "../models/TQuery";
import { PostListResult, PostModel, PostType } from "../entities/PostEntity";
import { Web3Digester } from "web3id";
import { PageUtil, TypeUtil } from "denetwork-utils";
import { SortOrder, Types } from "mongoose";
import { QueryUtil } from "../utils/QueryUtil";
import { isAddress } from "ethers";
import { PostService } from "./PostService";
import { FollowerService } from "./FollowerService";
import { FollowerListResult } from "../entities/FollowerEntity";
import _ from "lodash";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { resultErrors } from "../constants/ResultErrors";

/**
 * 	@class
 */
export class PortalService extends BaseService implements IWeb3StoreService<PostType, PostListResult>
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet		{string}
	 *	@param [data]		{any}
	 *	@param [sig]		{string}
	 *	@returns {Promise<PostListResult>}
	 */
	queryList( wallet : string, data ?: any, sig ?: string ) : Promise<PostListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `${ this.constructor.name } :: invalid data, missing key : by` );
				}

				switch ( data.by )
				{
					case 'recommendedPostList' :
						//	wallet - required
						return resolve( await this.queryRecommendedPostList( wallet, data, sig ) );
					case 'followeePostList' :
						//	wallet - optional
						return resolve( await this.queryFolloweePostList( wallet, data, sig ) );
				}

				//	...
				resolve( this.getListResultDefaultValue<PostListResult>( data ) );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param [wallet]		{string}
	 *	@param [data]		{any}
	 *	@param [_sig]		{string}
	 *	@returns {Promise<PostListResult>}
	 */
	public queryRecommendedPostList( wallet ?: string, data ?: any, _sig ?: string ) : Promise<PostListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const options : TQueryListOptions = data?.options;
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
				result.total = await PostModel
					.find()
					.countDocuments();
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

	/**
	 * 	@param wallet		{string}
	 * 	@param [data]		{any}
	 * 	@param [_sig]		{string}
	 * 	@returns {Promise<PostListResult>}
	 */
	public queryFolloweePostList( wallet : string, data ?: any, _sig ?: string ) : Promise<PostListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! isAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}

				//	...
				const options : TQueryListOptions = data?.options;
				const followerService = new FollowerService();
				const postService = new PostService();

				let followees : Array<string> = [];
				const followeeResult : FollowerListResult = await followerService.queryList(
					wallet,
					{ by : 'wallet',
						options : {
							pageNo : 1,
							pageSize : 300,
							sortBy : {
								//	will be sorted by followee's wallet address
								address : 'desc'
							}
						} }
				);
				if ( followeeResult &&
					_.has( followeeResult, 'list' ) )
				{
					followees = followeeResult.list.map( item => String( item.address ).trim().toLowerCase() );
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
				result.total = await PostModel
					.find()
					.where( {
						deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
						wallet: { $in: followees }
					} )
					.countDocuments();
				// result.total = await LikeModel.countDocuments({
				// 	deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				// 	wallet: { $in: followees }
				// });
				const posts : Array<PostType> = await PostModel
					.find()
					.where( {
						deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
						wallet: { $in: followees }
					} )
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


	add( _wallet : string, _data : PostType, _sig : string ) : Promise<PostType | null>
	{
		return Promise.reject( resultErrors.addingBanned );
	}

	delete( _wallet : string, _data : PostType, _sig : string ) : Promise<number>
	{
		return Promise.reject( resultErrors.deletingBanned );
	}

	queryOne( _wallet : string, _data : PostType, _sig : string ) : Promise<PostType | null>
	{
		return Promise.reject( resultErrors.queryOneBanned );
	}

	update( _wallet : string, _data : PostType, _sig : string ) : Promise<PostType | null>
	{
		return Promise.reject( resultErrors.updatingBanned );
	}

	updateFor( _wallet : string, _data : PostType, _sig : string ) : Promise<PostType | null>
	{
		return Promise.reject( resultErrors.updatingBanned );
	}

}
