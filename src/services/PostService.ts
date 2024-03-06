import { PageUtil, TestUtil, TypeUtil } from "denetwork-utils";
import { EtherWallet, Web3Digester, Web3Validator } from "web3id";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueryListOptions } from "../models/TQuery";
import { PostContentTypes, PostListResult, PostModel, postSchema, PostType } from "../entities/PostEntity";
import { QueryUtil } from "../utils/QueryUtil";
import { SchemaUtil } from "../utils/SchemaUtil";
import { resultErrors } from "../constants/ResultErrors";
import { CommentModel, commentSchema, CommentType } from "../entities/CommentEntity";
import { isAddress } from "ethers";

/**
 * 	class PostService
 */
export class PostService extends BaseService implements IWeb3StoreService<PostType, PostListResult>
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{PostType}
	 *	@param sig	{string}
	 *	@returns {Promise<PostType>}
	 */
	public add( wallet : string, data : PostType, sig : string ) : Promise<PostType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}
				if ( ! data )
				{
					return reject( `${ this.constructor.name } :: invalid data` );
				}

				//	'statisticView', 'statisticRepost', 'statisticQuote', 'statisticLike', 'statisticFavorite', 'statisticReply'
				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `${ this.constructor.name } :: failed to calculate statistic prefixed keys` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig, statisticKeys ) )
				{
					return reject( resultErrors.failedValidate );
				}

				//	...
				const toBeSaved = {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				};
				const postModel : Document = new PostModel( toBeSaved );
				let error : Error.ValidationError | null = postModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat check
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByCreatedAt<PostType>( PostModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				let origin;
				if ( [ PostContentTypes.reposted, PostContentTypes.quoted ].includes( data.contentType ) )
				{
					origin = await this.queryOneByRefTypeAndRefHash( data.refType, data.refHash );
					if ( ! origin || ! origin._id )
					{
						return reject( `${ this.constructor.name } :: origin not found` );
					}
				}

				//	...
				await this.connect();
				const savedDoc : Document<PostType> = await postModel.save();
				if ( savedDoc )
				{
					if ( [ PostContentTypes.reposted, PostContentTypes.quoted ].includes( data.contentType ) )
					{
						//
						//	update statistics
						//
						let statisticKey;
						switch ( data.contentType )
						{
							case PostContentTypes.reposted:
								statisticKey = 'statisticRepost';
								break;
							case PostContentTypes.quoted:
								statisticKey = 'statisticQuote';
								break;
						}
						if ( statisticKey && TypeUtil.isNotEmptyString( statisticKey ) )
						{
							//	statisticFavorite +1
							if ( 'post' === data.refType )
							{
								await this.updateStatistics<PostType>( PostModel, origin._id, statisticKey, 1 );
							}
							else
							{
								await this.updateStatistics<CommentType>( CommentModel, origin._id, statisticKey, 1 );
							}
						}
					}

					//	...
					return resolve( savedDoc.toObject() );
				}

				//	...
				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{PostType}
	 *	@param sig	{string}
	 *	@returns {Promise< ContactType | null >}
	 */
	public update( wallet : string, data : PostType, sig : string ) : Promise<PostType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				return reject( resultErrors.updatingBanned );
				// if ( ! EtherWallet.isValidAddress( wallet ) )
				// {
				// 	return reject( `invalid wallet` );
				// }
				// if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'hexId' ] ) ||
				// 	! TypeUtil.isNotEmptyString( data.hexId ) )
				// {
				// 	return reject( `invalid data.hexId` );
				// }
				// if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				// {
				// 	return reject( `failed to validate` );
				// }
				//
				//
				// //	throat checking
				// const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<PostType>( PostModel, wallet );
				// if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
				// {
				// 	return reject( `operate too frequently.` );
				// }
				//
				// await this.connect();
				// const findContact : PostType | null = await this.queryOneByWalletAndHexId( wallet, data.hexId );
				// if ( findContact )
				// {
				// 	const allowUpdatedKeys : Array<string> = [
				// 		'version',
				// 		`authorName`, `authorAvatar`,
				// 		`body`,
				// 		`pictures`, `videos`,
				// 		`statisticView`, `statisticRepost`, `statisticQuote`, `statisticLike`, `statisticFavorite`, `statisticReply`,
				// 		`remark`
				// 	];
				// 	const update : Record<string, any> = { ...Web3Encoder.reserveObjectKeys( data, allowUpdatedKeys ), sig : sig };
				// 	const savedPost : PostType | null = await PostModel.findOneAndUpdate( findContact, update, { new : true } ).lean<PostType>();
				//
				// 	//	...
				// 	return resolve( savedPost );
				// }
				//
				// resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns { Promise< PostType | null > }
	 */
	public updateFor( wallet : string, data : any, sig ? : string ) : Promise<PostType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObject( data ) )
				{
					return reject( `${ this.constructor.name } :: invalid data` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( data.hash ) )
				{
					return reject( `${ this.constructor.name } :: invalid data.hash` );
				}
				if ( ! TypeUtil.isNotEmptyString( data.key ) )
				{
					return reject( `${ this.constructor.name } :: invalid data.key` );
				}

				//
				//	update statistics
				//
				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( commentSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `${ this.constructor.name } :: failed to calculate statistic prefixed keys` );
				}
				if ( statisticKeys.includes( data.key ) )
				{
					const find : PostType | null = await this._queryOneByHash( wallet, data.hash );
					if ( find )
					{
						const result : PostType | null = await this.updateStatistics<PostType>( PostModel, find._id, data.key, data.value );
						return resolve( result );
					}
				}

				//	...
				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{PostType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : PostType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'hash' ] ) ||
					! TypeUtil.isNotEmptyString( data.hash ) )
				{
					return reject( `${ this.constructor.name } :: invalid data.hash` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				{
					return reject( resultErrors.failedValidate );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'deleted' ] ) ||
					Types.ObjectId.createFromTime( 1 ).toHexString() !== data.deleted )
				{
					//	MUST BE 1 for DELETION
					return reject( `${ this.constructor.name } :: invalid data.deleted` );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() && this.throatCheckingInterval > 0 )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<PostType>( PostModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < this.throatCheckingInterval )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				await this.connect();
				const find : PostType | null = await PostModel
					.findOne()
					.byWalletAndHash( wallet, data.hash )
					.lean<PostType>()
					.exec();
				if ( find )
				{
					const update = { deleted : find._id.toHexString() };
					const newDoc = await PostModel.findOneAndUpdate( find, update, { new : true } );
					return resolve( newDoc ? 1 : 0 );
				}

				resolve( 0 );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}


	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 * 	@returns {Promise< PostType | null >}
	 */
	public queryOne( wallet : string, data : any, sig ? : string ) : Promise<PostType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `${ this.constructor.name } :: invalid data, missing key : by` );
				}

				let post : PostType | null = null;
				switch ( data.by )
				{
					case 'hash' :
						post = await this._queryOneByHash( wallet, data.hash );
						break;
					case 'walletAndHash' :
						post = await this._queryOneByWalletAndHash( wallet, data.hash );
						break;
				}

				//
				//	update `statisticView`
				//
				if ( post )
				{
					const updatedPost : PostType | null = await this.updateStatistics<PostType>( PostModel, post._id, `statisticView`, 1 );
					if ( updatedPost )
					{
						post.statisticView = updatedPost.statisticView;
					}
				}

				//	...
				resolve( post );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns { Promise<PostListResult> }
	 */
	public queryList( wallet : string, data : any, sig ? : string ) : Promise<PostListResult>
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
					case 'wallet' :
						//	query the posts belonging to the `wallet`,
						//	as well as the value of favorite and like attributes
						//	wallet		- required
						return resolve( await this._queryListByWallet( wallet, data.options ) );
					case 'address' :
						//	query the posts belonging to the `data.address`,
						//	and the value of favorite and like attributes belonging to the `wallet`,
						//	wallet		- optional
						//	data.address	- required
						return resolve( await this._queryListByAddress( wallet, data.address, data.options ) );
					case 'refAuthorWallet' :
						//	wallet 		- optional
						return resolve( await this._queryListByRefAuthorWallet( wallet, data.refAuthorWallet, data.options ) );
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
	 *	@param wallet	{string}	-
	 *	@param hash	{string}	- a 66-character hexadecimal string
	 *	@returns {Promise< PostType | null >}
	 */
	private _queryOneByHash( wallet : string, hash : string ) : Promise<PostType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotEmptyString( hash ) )
				{
					return reject( `${ this.constructor.name } :: invalid hash` );
				}

				await this.connect();
				const record : PostType | null = await PostModel
					.findOne()
					.byHash( hash )
					.lean<PostType>()
					.exec();
				if ( record )
				{
					if ( isAddress( wallet ) )
					{
						//	to check whether the specified wallet has favorited this post
						record[ this.walletFavoritedKey ] =
							Web3Digester.isValidHash( record.hash ) &&
							await this.walletFavoritedPost( wallet, record.hash );

						//	to check whether the specified wallet has liked this post
						record[ this.walletLikedKey ] =
							Web3Digester.isValidHash( record.hash ) &&
							await this.walletLikedPost( wallet, record.hash );
					}

					//	...
					return resolve( record );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}	wallet address
	 *	@param hash	{string}	a 66-character hexadecimal string
	 *	@returns {Promise< PostType | null >}
	 */
	private _queryOneByWalletAndHash( wallet : string, hash : string ) : Promise<PostType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}
				if ( ! TypeUtil.isNotEmptyString( hash ) )
				{
					return reject( `${ this.constructor.name } :: invalid hash` );
				}

				await this.connect();
				const record = await PostModel
					.findOne()
					.byWalletAndHash( wallet, hash )
					.lean<PostType>()
					.exec();
				if ( record )
				{
					record[ this.walletFavoritedKey ] =
						Web3Digester.isValidHash( record.hash ) &&
						await this.walletFavoritedPost( wallet, record.hash );
					record[ this.walletLikedKey ] =
						Web3Digester.isValidHash( record.hash ) &&
						await this.walletLikedPost( wallet, record.hash );
					//	...
					return resolve( record );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 * 	query the posts belonging to the `wallet`, as well as the value of favorite and like attributes
	 *	@param wallet		{string}	wallet address
	 *	@param options	{TQueryListOptions}
	 *	@returns {Promise<PostListResult>}
	 */
	private _queryListByWallet( wallet : string, options ? : TQueryListOptions ) : Promise<PostListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}

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

				await this.connect();
				result.total = await PostModel
					.find()
					.byWallet( wallet )
					.countDocuments();
				const posts : Array<PostType> = await PostModel
					.find()
					.byWallet( wallet )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<PostType>>()
					.exec();
				if ( Array.isArray( posts ) )
				{
					for ( let i = 0; i < posts.length; i++ )
					{
						posts[ i ][ this.walletFavoritedKey ] =
							Web3Digester.isValidHash( posts[ i ].hash ) &&
							await this.walletFavoritedPost( wallet, posts[ i ].hash );
						posts[ i ][ this.walletLikedKey ] =
							Web3Digester.isValidHash( posts[ i ].hash ) &&
							await this.walletLikedPost( wallet, posts[ i ].hash );
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
	 *	query the posts belonging to the `address`,
	 * 	and the value of favorite and like attributes belonging to the `wallet`,
	 *	@param [wallet]		{string}	optional, wallet address, current user
	 *	@param address		{string}	required, wallet address, target user
	 *	@param options	{TQueryListOptions}
	 *	@returns {Promise<PostListResult>}
	 */
	private _queryListByAddress( wallet : string, address : string, options ? : TQueryListOptions ) : Promise<PostListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( address ) )
				{
					return reject( `${ this.constructor.name } :: invalid address` );
				}

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

				await this.connect();
				result.total = await PostModel
					.find()
					.byWallet( address )
					.countDocuments();
				const posts : Array<PostType> = await PostModel
					.find()
					.byWallet( address )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<PostType>>()
					.exec();
				if ( Array.isArray( posts ) )
				{
					if ( EtherWallet.isValidAddress( wallet ) )
					{
						for ( let i = 0; i < posts.length; i++ )
						{
							posts[ i ][ this.walletFavoritedKey ] =
								Web3Digester.isValidHash( posts[ i ].hash ) &&
								await this.walletFavoritedPost( wallet, posts[ i ].hash );
							posts[ i ][ this.walletLikedKey ] =
								Web3Digester.isValidHash( posts[ i ].hash ) &&
								await this.walletLikedPost( wallet, posts[ i ].hash );
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
	 *
	 *	@param [wallet]			{string}	-
	 *	@param refAuthorWallet		{string}	- wallet address of quoted author
	 *	@param options	{TQueryListOptions}
	 *	@returns {Promise<PostListResult>}
	 */
	private _queryListByRefAuthorWallet( wallet : string, refAuthorWallet : string, options ? : TQueryListOptions ) : Promise<PostListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( refAuthorWallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}

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

				await this.connect();
				result.total = await PostModel
					.find()
					.byRefAuthorWallet( refAuthorWallet )
					.countDocuments();
				const posts : Array<PostType> = await PostModel
					.find()
					.byRefAuthorWallet( refAuthorWallet )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<PostType>>()
					.exec();
				if ( Array.isArray( posts ) )
				{
					if ( isAddress( wallet ) )
					{
						for ( let i = 0; i < posts.length; i++ )
						{
							posts[ i ][ this.walletFavoritedKey ] =
								Web3Digester.isValidHash( posts[ i ].hash ) &&
								await this.walletFavoritedPost( wallet, posts[ i ].hash );
							posts[ i ][ this.walletLikedKey ] =
								Web3Digester.isValidHash( posts[ i ].hash ) &&
								await this.walletLikedPost( wallet, posts[ i ].hash );
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
	 * 	@returns {Promise<void>}
	 */
	public clearAll() : Promise<void>
	{
		return super.clearAll<PostType>( PostModel );
	}
}
