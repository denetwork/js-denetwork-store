import { PageUtil, TestUtil, TypeUtil } from "denetwork-utils";
import { EtherWallet, Web3Digester, Web3Validator } from "web3id";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueryListOptions } from "../models/TQuery";
import { CommentListResult, CommentModel, commentSchema, CommentType } from "../entities/CommentEntity";
import { QueryUtil } from "../utils/QueryUtil";
import { SchemaUtil } from "../utils/SchemaUtil";
import { postSchema } from "../entities/PostEntity";
import { resultErrors } from "../constants/ResultErrors";
import _ from "lodash";
import { isAddress } from "ethers";
import { FollowerModel } from "../entities/FollowerEntity";

/**
 * 	class CommentService
 */
export class CommentService extends BaseService implements IWeb3StoreService<CommentType, CommentListResult>
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{PostType}
	 *	@param sig	{string}
	 *	@returns {Promise<CommentType | null>}
	 */
	public add( wallet : string, data : CommentType, sig : string ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! data )
				{
					return reject( `invalid data` );
				}

				//	'statisticView', 'statisticRepost', 'statisticQuote', 'statisticLike', 'statisticFavorite', 'statisticReply'
				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( postSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `failed to calculate statistic prefixed keys` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig, statisticKeys ) )
				{
					return reject( resultErrors.failedValidate );
				}

				//	...
				const commentModel : Document = new CommentModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				} );
				let error : Error.ValidationError | null = commentModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat check
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByCreatedAt<CommentType>( CommentModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				await this.connect();
				const savedDoc : Document<CommentType> = await commentModel.save();

				//
				//	update .childrenCount of parent comment
				//
				if ( Web3Digester.isValidHash( data.parentHash ) )
				{
					const parentComment : CommentType = await this._queryOneByHash( ``, data.parentHash );
					if ( parentComment )
					{
						await this._updateCommentStatistics( parentComment.wallet, parentComment.hash, 'statisticChildrenCount', 1 );
					}
				}

				//	...
				resolve( savedDoc.toObject() );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{CommentType}
	 *	@param sig	{string}
	 *	@returns {Promise< CommentType | null >}
	 */
	public update( wallet : string, data : CommentType, sig : string ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				return reject( resultErrors.updatingBanned );
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
	 *	@returns { Promise< CommentType | null > }
	 */
	public updateFor( wallet : string, data : any, sig ? : string ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObject( data ) )
				{
					return reject( `invalid data` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( data.hash ) )
				{
					return reject( `invalid data.hash` );
				}
				if ( ! TypeUtil.isNotEmptyString( data.key ) )
				{
					return reject( `invalid data.key` );
				}

				//
				//	update statistics
				//
				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( commentSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `failed to calculate statistic prefixed keys` );
				}
				if ( statisticKeys.includes( data.key ) )
				{
					const result : CommentType | null = await this._updateCommentStatistics( wallet, data.hash, data.key, data.value );
					return resolve( result );
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
	 *	@param hash	{string}
	 *	@param key	{string} statisticView, statisticRepost, statisticQuote, ...
	 *	@param value	{number} 1 or -1
	 *	@returns {Promise< CommentType | null >}
	 */
	private _updateCommentStatistics( wallet : string, hash : string, key : string, value : 1 | -1 ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( hash ) )
				{
					return reject( `invalid hash` );
				}
				if ( ! TypeUtil.isNotEmptyString( key ) )
				{
					return reject( `invalid key` );
				}

				const statisticKeys : Array<string> | null = SchemaUtil.getPrefixedKeys( commentSchema, 'statistic' );
				if ( ! Array.isArray( statisticKeys ) || 0 === statisticKeys.length )
				{
					return reject( `failed to calculate statistic prefixed keys` );
				}
				if ( ! statisticKeys.includes( key ) )
				{
					return reject( `invalid key` );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() && this.throatCheckingInterval > 0 )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<CommentType>( CommentModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < this.throatCheckingInterval )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				await this.connect();
				const find : CommentType | null = await CommentModel
					.findOne()
					.byHash( hash )
					.lean<CommentType>()
					.exec();
				if ( find )
				{
					const orgValue : number = _.has( find, key ) ? find[ key ] : 0;
					const newValue : number = orgValue + ( 1 === value ? 1 : -1 );
					const update : Record<string, any> = { [ key ] : newValue >= 0 ? newValue : 0 };
					const savedComment : CommentType | null = await CommentModel.findOneAndUpdate( find, update, { new : true } ).lean<CommentType>();

					//	...
					return resolve( savedComment );
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
	 *	@param wallet	{string}
	 *	@param data	{CommentType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : CommentType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'hash' ] ) ||
					! TypeUtil.isNotEmptyString( data.hash ) )
				{
					return reject( `invalid data.hash` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				{
					return reject( resultErrors.failedValidate );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'deleted' ] ) ||
					Types.ObjectId.createFromTime( 1 ).toHexString() !== data.deleted )
				{
					//	MUST BE 1 for DELETION
					return reject( `invalid data.deleted` );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() && this.throatCheckingInterval > 0 )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<CommentType>( CommentModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < this.throatCheckingInterval )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				await this.connect();
				const find : CommentType | null = await CommentModel
					.findOne()
					.byWalletAndHash( wallet, data.hash )
					.lean<CommentType>()
					.exec();
				if ( find )
				{
					const update = { deleted : find._id.toHexString() };
					const newDoc = await CommentModel.findOneAndUpdate( find, update, { new : true } );
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
	 * 	@returns {Promise< CommentType | null >}
	 */
	public queryOne( wallet : string, data : any, sig ? : string ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `invalid data, missing key : by` );
				}

				let comment : CommentType | null = null;
				switch ( data.by )
				{
					case 'walletAndHash' :
						comment = await this._queryOneByWalletAndHash( wallet, data.hash );
						break;
					case 'hash' :
						comment = await this._queryOneByHash( wallet, data.hash );
						break;
				}

				//
				//	update `statisticView`
				//
				if ( comment )
				{
					const updatedComment : CommentType | null = await this.updateStatistics<CommentType>( CommentModel, comment._id, `statisticView`, 1 );
					if ( updatedComment )
					{
						comment.statisticView = updatedComment.statisticView;
					}
				}

				resolve( comment );
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
	 *	@returns { Promise<CommentListResult> }
	 */
	public queryList( wallet : string, data : any, sig ? : string ) : Promise<CommentListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `invalid data, missing key : by` );
				}

				let listResult : CommentListResult | null = null;
				switch ( data.by )
				{
					case 'walletAndPostHash' :
						//	retrieve all my comments in a post
						listResult = await this._queryListByWalletAndPostHash( wallet, data.postHash, data.options );
						break;
					case 'postHash' :
						//	retrieve all comments in a post
						listResult = await this._queryListByPostHash( wallet, data.postHash, data.options );
						break;
					case 'postHashAndParentHash' :
						//	retrieve all replies(children comments) to a comment in a post
						listResult = await this._queryListByPostHashAndParentHash( wallet, data.postHash, data.parentHash, data.options );
						break;
				}

				//
				//	update `statisticView`
				//
				if ( listResult )
				{
					if ( Array.isArray( listResult.list ) && listResult.list.length > 0 )
					{
						for ( let i = 0; i < listResult.list.length; i ++ )
						{
							const comment : CommentType = listResult.list[ i ];
							const updatedComment : CommentType | null = await this.updateStatistics<CommentType>( CommentModel, comment._id, `statisticView`, 1 );
							if ( updatedComment )
							{
								listResult.list[ i ].statisticView = updatedComment.statisticView;
							}
						}
					}

					return resolve( listResult );
				}

				//	...
				resolve( this.getListResultDefaultValue<CommentListResult>( data ) );
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
	 *	@returns {Promise< CommentType | null >}
	 */
	private _queryOneByWalletAndHash( wallet : string, hash : string ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotEmptyString( hash ) )
				{
					return reject( `invalid hash` );
				}

				await this.connect();
				const record = await CommentModel
					.findOne()
					.byWalletAndHash( wallet, hash )
					.lean<CommentType>()
					.exec();
				if ( record )
				{
					record[ this.walletFavoritedKey ] =
						Web3Digester.isValidHash( record.hash ) &&
						await this.walletFavoritedComment( wallet, record.hash );
					record[ this.walletLikedKey ] =
						Web3Digester.isValidHash( record.hash ) &&
						await this.walletLikedComment( wallet, record.hash );

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
	 *	@param wallet	{string}	-
	 *	@param hash	{string}	- a 66-character hexadecimal string
	 *	@returns {Promise< CommentType | null >}
	 */
	private _queryOneByHash( wallet : string, hash : string ) : Promise<CommentType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotEmptyString( hash ) )
				{
					return reject( `invalid hash` );
				}

				await this.connect();
				const record = await CommentModel
					.findOne()
					.byHash( hash )
					.lean<CommentType>()
					.exec();
				if ( record )
				{
					if ( isAddress( wallet ) )
					{
						record[ this.walletFavoritedKey ] =
							Web3Digester.isValidHash( record.hash ) &&
							await this.walletFavoritedComment( wallet, record.hash );
						record[ this.walletLikedKey ] =
							Web3Digester.isValidHash( record.hash ) &&
							await this.walletLikedComment( wallet, record.hash );
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
	 *	@param wallet		{string}	wallet address
	 *	@param postHash		{string}	post hash
	 *	@param options	{TQueryListOptions}
	 *	@returns {Promise<CommentListResult>}
	 */
	private _queryListByWalletAndPostHash( wallet : string, postHash ? : string, options ? : TQueryListOptions ) : Promise<CommentListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( postHash &&
					! SchemaUtil.isValidKeccak256Hash( postHash ) )
				{
					return reject( `invalid postHash` );
				}

				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : {
					[ key : string ] : SortOrder
				} = QueryUtil.getSafeSortBy( options?.sort );

				let result : CommentListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const total : number = await CommentModel
					.find( { parentHash : { $exists : false } } )
					.byWalletAndPostHash( wallet, postHash )
					.countDocuments();
				const comments : Array<CommentType> = await CommentModel
					.find( { parentHash : { $exists : false } } )
					.byWalletAndPostHash( wallet, postHash )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<CommentType>>()
					.exec();
				if ( Array.isArray( comments ) )
				{
					for ( let i = 0; i < comments.length; i++ )
					{
						comments[ i ][ this.walletFavoritedKey ] =
							Web3Digester.isValidHash( comments[ i ].hash ) &&
							await this.walletFavoritedComment( wallet, comments[ i ].hash );
						comments[ i ][ this.walletLikedKey ] =
							Web3Digester.isValidHash( comments[ i ].hash ) &&
							await this.walletLikedComment( wallet, comments[ i ].hash );
					}

					//	...
					result.list = comments;
					//result.total = comments.length;
					result.total = total;
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
	 *	@param [wallet]		{string}		- optional wallet address, if user specialized, will return fav info
	 *	@param postHash		{string}		- post hash
	 *	@param options		{TQueryListOptions}
	 *	@returns {Promise<CommentListResult>}
	 */
	private _queryListByPostHash( wallet : string, postHash : string, options ? : TQueryListOptions ) : Promise<CommentListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! SchemaUtil.isValidKeccak256Hash( postHash ) )
				{
					return reject( `invalid postHash` );
				}

				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : {
					[ key : string ] : SortOrder
				} = QueryUtil.getSafeSortBy( options?.sort );

				let result : CommentListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const total : number = await CommentModel
					.find( { parentHash : { $exists : false } } )
					.byPostHash( postHash )
					.countDocuments();
				const comments : Array<CommentType> = await CommentModel
					.find( { parentHash : { $exists : false } } )
					.byPostHash( postHash )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<CommentType>>()
					.exec();
				if ( Array.isArray( comments ) )
				{
					if ( isAddress( wallet ) )
					{
						for ( let i = 0; i < comments.length; i++ )
						{
							comments[ i ][ this.walletFavoritedKey ] =
								Web3Digester.isValidHash( comments[ i ].hash ) &&
								await this.walletFavoritedComment( wallet, comments[ i ].hash );
							comments[ i ][ this.walletLikedKey ] =
								Web3Digester.isValidHash( comments[ i ].hash ) &&
								await this.walletLikedComment( wallet, comments[ i ].hash );
						}
					}

					//	...
					result.list = comments;
					//result.total = comments.length;
					result.total = total;
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
	 *	@param [wallet]		{string}		- optional wallet address, if user specialized, will return fav info
	 *	@param postHash		{string}		- post hash
	 *	@param parentHash	{string}		- parent comment hash
	 *	@param options		{TQueryListOptions}
	 *	@returns {Promise<CommentListResult>}
	 */
	private _queryListByPostHashAndParentHash( wallet : string, postHash : string, parentHash : string, options ? : TQueryListOptions ) : Promise<CommentListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! SchemaUtil.isValidKeccak256Hash( postHash ) )
				{
					return reject( `invalid postHash` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( parentHash ) )
				{
					return reject( `invalid parentHash` );
				}

				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : {
					[ key : string ] : SortOrder
				} = QueryUtil.getSafeSortBy( options?.sort );

				let result : CommentListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const total : number = await CommentModel
					.find()
					.byPostHashAndParentHash( postHash, parentHash )
					.countDocuments();
				const comments : Array<CommentType> = await CommentModel
					.find()
					.byPostHashAndParentHash( postHash, parentHash )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<CommentType>>()
					.exec();
				if ( Array.isArray( comments ) )
				{
					if ( isAddress( wallet ) )
					{
						for ( let i = 0; i < comments.length; i++ )
						{
							comments[ i ][ this.walletFavoritedKey ] =
								Web3Digester.isValidHash( comments[ i ].hash ) &&
								await this.walletFavoritedComment( wallet, comments[ i ].hash );
							comments[ i ][ this.walletLikedKey ] =
								Web3Digester.isValidHash( comments[ i ].hash ) &&
								await this.walletLikedComment( wallet, comments[ i ].hash );
						}
					}

					result.list = comments;
					//result.total = comments.length;
					result.total = total;
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
		return super.clearAll<CommentType>( CommentModel );
	}
}
