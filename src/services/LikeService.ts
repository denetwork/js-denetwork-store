import { PageUtil, TestUtil, TypeUtil } from "denetwork-utils";
import { EtherWallet, Web3Validator } from "web3id";
import { LikeListResult, LikeModel, LikeType } from "../entities/LikeEntity";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueryListOptions } from "../models/TQuery";
import { QueryUtil } from "../utils/QueryUtil";
import { SchemaUtil } from "../utils/SchemaUtil";
import { resultErrors } from "../constants/ResultErrors";
import { ERefDataTypes } from "../models/ERefDataTypes";
import { PostModel, PostType } from "../entities/PostEntity";
import { CommentModel, CommentType } from "../entities/CommentEntity";

/**
 * 	@class LikeService
 */
export class LikeService extends BaseService implements IWeb3StoreService< LikeType, LikeListResult >
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{LikeType}
	 *	@param sig	{string}
	 *	@returns {Promise< LikeType | null >}
	 */
	public add( wallet : string, data : LikeType, sig : string ) : Promise< LikeType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				{
					return reject( resultErrors.failedValidate );
				}
				if ( ! Object.values( ERefDataTypes ).includes( data.refType ) )
				{
					return reject( `${ this.constructor.name } :: invalid data.refType` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( data.refHash ) )
				{
					return reject( `${ this.constructor.name } :: invalid data.refHash` );
				}

				//	...
				const likeModel : Document = new LikeModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				} );
				let error : Error.ValidationError | null = likeModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond = await this.queryLatestElapsedMillisecondByCreatedAt<LikeType>( LikeModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				const origin = await this.queryOneByRefTypeAndRefHash( data.refType, data.refHash );
				if ( ! origin || ! origin._id )
				{
					return reject( `${ this.constructor.name } :: origin not found` );
				}

				//	check duplicate
				const find : LikeType = await this._queryOneByWalletAndRefTypeAndRefHash( data.wallet, data.refType, data.refHash );
				if ( find )
				{
					return reject( resultErrors.duplicateKeyError );
				}

				//	...
				await this.connect();
				const savedDoc : Document<LikeType> = await likeModel.save();
				if ( savedDoc )
				{
					//	statisticLike +1
					if ( 'post' === data.refType )
					{
						await this.updateStatistics<PostType>( PostModel, origin._id, `statisticLike`, 1 );
					}
					else
					{
						await this.updateStatistics<CommentType>( CommentModel, origin._id, `statisticLike`, 1 );
					}
					return resolve( savedDoc.toObject() );
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
	 *	@param data	{LikeType}
	 *	@param sig	{string}
	 *	@returns {Promise< LikeType | null >}
	 */
	public update( wallet : string, data : LikeType, sig : string ) : Promise< LikeType | null >
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
	 *	@returns { Promise< LikeType | null > }
	 */
	public updateFor( wallet: string, data : any, sig : string )  : Promise< LikeType | null >
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{LikeType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : LikeType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
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
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<LikeType>( LikeModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < this.throatCheckingInterval )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				await this.connect();
				let find : LikeType | null;
				if ( SchemaUtil.isValidKeccak256Hash( data.hash ) )
				{
					find = await this._queryOneByHash( data.hash );
				}
				else if ( Object.values( ERefDataTypes ).includes( data.refType ) &&
					SchemaUtil.isValidKeccak256Hash( data.refHash ) )
				{
					find = await this._queryOneByWalletAndRefTypeAndRefHash( wallet, data.refType, data.refHash );
				}
				else if ( TypeUtil.isNotEmptyString( data.hexId ) )
				{
					find = await this._queryOneByHexId( data.hexId );
				}
				else
				{
					return reject( `${ this.constructor.name } :: not found` );
				}

				if ( find )
				{
					const update = { deleted : find._id.toHexString() };
					const newDoc = await LikeModel.findOneAndUpdate( find, update, { new : true } );
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
	 * 	@returns {Promise< LikeType | null >}
	 */
	public queryOne( wallet : string, data : any, sig ?: string ) : Promise<LikeType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `${ this.constructor.name } :: invalid data, missing key : by` );
				}

				let result = null;
				switch ( data.by )
				{
					case 'hexId' :
						if ( ! TypeUtil.isNotEmptyString( data.hexId ) )
						{
							return reject( `${ this.constructor.name } :: invalid data.hexId` );
						}
						result = await this._queryOneByHexId( data.hexId );
						break;
					case 'hash' :
						if ( ! SchemaUtil.isValidKeccak256Hash( data.hash ) )
						{
							return reject( `${ this.constructor.name } :: invalid data.hash` );
						}
						result = await this._queryOneByHash( data.hash );
						break;
					case 'walletAndRefTypeAndRefHash' :
						if ( ! Object.values( ERefDataTypes ).includes( data.refType ) )
						{
							return reject( `${ this.constructor.name } :: invalid data.refType` );
						}
						if ( ! SchemaUtil.isValidKeccak256Hash( data.refHash ) )
						{
							return reject( `${ this.constructor.name } :: invalid data.refHash` );
						}
						result = await this._queryOneByWalletAndRefTypeAndRefHash( wallet, data.refType, data.refHash );
						break;
				}

				if ( result &&
					TypeUtil.isNotNullObjectWithKeys( result, [ 'refType', 'refHash' ] ) )
				{
					result.refData = await this.queryOneByRefTypeAndHash(
						wallet,
						result.refType,
						result.refHash
					);
				}

				resolve( result );
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
	 *	@returns { Promise<LikeListResult> }
	 */
	public queryList( wallet : string, data : any, sig ?: string ) : Promise<LikeListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `${ this.constructor.name } :: invalid data, missing key : by` );
				}

				switch ( data.by )
				{
					case 'walletAndRefType' :
						return resolve( await this._queryListByWalletAndRefType( wallet, data.address, data.options ) );
				}

				//	...
				resolve( this.getListResultDefaultValue<LikeListResult>( data ) );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param hexId	{string}
	 *	@returns { Promise<LikeType | null> }
	 *	@private
	 */
	private _queryOneByHexId( hexId : string ) : Promise<LikeType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotEmptyString( hexId ) )
				{
					return reject( `${ this.constructor.name } :: invalid hexId` );
				}

				await this.connect();
				const record = await LikeModel
					.findOne()
					.byHexId( hexId )
					.lean<LikeType>()
					.exec();
				if ( record )
				{
					return resolve( record );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param hash	{string}
	 *	@returns { Promise<LikeType | null> }
	 *	@private
	 */
	private _queryOneByHash( hash : string ) : Promise<LikeType | null>
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
				const record = await LikeModel
					.findOne()
					.byHash( hash )
					.lean<LikeType>()
					.exec();
				if ( record )
				{
					return resolve( record );
				}

				resolve( null );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param wallet	{string}	wallet address
	 *	@param refType	{ERefDataTypes}
	 *	@param refHash	{string}
	 *	@returns {Promise< LikeType | null >}
	 */
	private _queryOneByWalletAndRefTypeAndRefHash( wallet : string, refType : ERefDataTypes, refHash : string ) : Promise<LikeType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}
				if ( ! Object.values( ERefDataTypes ).includes( refType ) )
				{
					return reject( `${ this.constructor.name } :: invalid refType` );
				}
				if ( ! SchemaUtil.isValidKeccak256Hash( refHash ) )
				{
					return reject( `${ this.constructor.name } :: invalid refHash` );
				}

				await this.connect();
				const record = await LikeModel
					.findOne()
					.byWalletAndRefTypeAndRefHash( wallet, refType, refHash )
					.lean<LikeType>()
					.exec();
				if ( record )
				{
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
	 *	@param refType		{ERefDataTypes}
	 *	@param options	{TQueryListOptions}
	 *	@returns {Promise<ContactListResult>}
	 */
	private _queryListByWalletAndRefType( wallet : string, refType ?: ERefDataTypes, options ?: TQueryListOptions ) : Promise<LikeListResult>
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
				const sortBy : { [ key : string ] : SortOrder } = QueryUtil.getSafeSortBy( options?.sort );

				let result : LikeListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				result.total = await LikeModel
					.find()
					.byWalletAndRefType( wallet, refType )
					.countDocuments();
				const list : Array<LikeType> = await LikeModel
					.find()
					.byWalletAndRefType( wallet, refType )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<LikeType>>()
					.exec();
				if ( Array.isArray( list ) )
				{
					for ( let i = 0; i < list.length; i ++ )
					{
						list[ i ].refData = await this.queryOneByRefTypeAndHash(
							wallet,
							list[ i ].refType,
							list[ i ].refHash
						);
					}

					//	...
					result.list = list;
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
		return super.clearAll<LikeType>( LikeModel );
	}
}
