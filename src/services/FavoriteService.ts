import { PageUtil, TestUtil, TypeUtil } from "denetwork-utils";
import { EtherWallet, Web3Digester, Web3Validator } from "web3id";
import { ERefDataTypes } from "../models/ERefDataTypes";
import { FavoriteListResult, FavoriteModel, FavoriteType } from "../entities/FavoriteEntity";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueryListOptions } from "../models/TQuery";
import { QueryUtil } from "../utils/QueryUtil";
import { SchemaUtil } from "../utils/SchemaUtil";
import { resultErrors } from "../constants/ResultErrors";
import { CommentListResult, CommentModel, CommentType } from "../entities/CommentEntity";
import { PostModel, PostType } from "../entities/PostEntity";

/**
 * 	@class FavoriteService
 */
export class FavoriteService extends BaseService implements IWeb3StoreService< FavoriteType, FavoriteListResult >
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{FavoriteType}
	 *	@param sig	{string}
	 *	@returns {Promise< FavoriteType | null >}
	 */
	public add( wallet : string, data : FavoriteType, sig : string ) : Promise< FavoriteType | null >
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
				const favoriteModel : Document = new FavoriteModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				} );
				let error : Error.ValidationError | null = favoriteModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond = await this.queryLatestElapsedMillisecondByCreatedAt<FavoriteType>( FavoriteModel, wallet );
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
				const find : FavoriteType = await this._queryOneByWalletAndRefTypeAndRefHash( data.wallet, data.refType, data.refHash );
				if ( find )
				{
					return reject( resultErrors.duplicateKeyError );
				}

				//	...
				// const conn = await this.connect();
				// const session : ClientSession = await conn.startSession();
				// const result = await session.withTransaction( async () =>
				// {
				// 	const savedDoc : Document<FavoriteType> = await followerModel.save( { session } );
				// 	return savedDoc;
				// });
				// await session.endSession();
				// resolve( result ? result.toObject() : null );

				//	...
				await this.connect();
				const savedDoc : Document<FavoriteType> = await favoriteModel.save();
				if ( savedDoc )
				{
					//	statisticFavorite +1
					if ( 'post' === data.refType )
					{
						await this.updateStatistics<PostType>( PostModel, origin._id, `statisticFavorite`, 1 );
					}
					else
					{
						await this.updateStatistics<CommentType>( CommentModel, origin._id, `statisticFavorite`, 1 );
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
	 *	@param data	{FavoriteType}
	 *	@param sig	{string}
	 *	@returns {Promise< FavoriteType | null >}
	 */
	public update( wallet : string, data : FavoriteType, sig : string ) : Promise< FavoriteType | null >
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
	 *	@returns { Promise< FavoriteType | null > }
	 */
	public updateFor( wallet: string, data : any, sig : string )  : Promise< FavoriteType | null >
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
	 *	@param data	{FavoriteType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : FavoriteType, sig : string ) : Promise<number>
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
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<FavoriteType>( FavoriteModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < this.throatCheckingInterval )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				await this.connect();
				let find : FavoriteType | null;
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
					const newDoc = await FavoriteModel.findOneAndUpdate( find, update, { new : true } );
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
	 *	@param wallet	{string}	current user
	 *	@param data	{any}
	 *	@param sig	{string}
	 * 	@returns {Promise< FavoriteType | null >}
	 */
	public queryOne( wallet : string, data : any, sig ?: string ) : Promise<FavoriteType | null>
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
	 *	@returns { Promise<FavoriteListResult> }
	 */
	public queryList( wallet : string, data : any, sig ?: string ) : Promise<FavoriteListResult>
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
				if ( ! Object.values( ERefDataTypes ).includes( data.refType ) )
				{
					return reject( `${ this.constructor.name } :: invalid data.refType` );
				}

				switch ( data.by )
				{
					case 'walletAndRefType' :
						return resolve( await this._queryListByWalletAndRefType( wallet, data.refType, data.options ) );
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
	 *	@param hexId	{string}
	 *	@returns { Promise<FavoriteType | null> }
	 *	@private
	 */
	private _queryOneByHexId( hexId : string ) : Promise<FavoriteType | null>
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
				const record = await FavoriteModel
					.findOne()
					.byHexId( hexId )
					.lean<FavoriteType>()
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
	 *	@returns { Promise<FavoriteType | null> }
	 *	@private
	 */
	private _queryOneByHash( hash : string ) : Promise<FavoriteType | null>
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
				const record = await FavoriteModel
					.findOne()
					.byHash( hash )
					.lean<FavoriteType>()
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
	 *	@returns {Promise< FavoriteType | null >}
	 */
	private _queryOneByWalletAndRefTypeAndRefHash( wallet : string, refType : ERefDataTypes, refHash : string ) : Promise<FavoriteType | null>
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
				const record = await FavoriteModel
					.findOne()
					.byWalletAndRefTypeAndRefHash( wallet, refType, refHash )
					.lean<FavoriteType>()
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
	private _queryListByWalletAndRefType( wallet : string, refType ?: ERefDataTypes, options ?: TQueryListOptions ) : Promise<FavoriteListResult>
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

				let result : FavoriteListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				result.total = await FavoriteModel
					.find()
					.byWalletAndRefType( wallet, refType )
					.countDocuments();
				const list : Array<FavoriteType> = await FavoriteModel
					.find()
					.byWalletAndRefType( wallet, refType )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<FavoriteType>>()
					.exec();
				if ( Array.isArray( list ) )
				{
					for ( let i = 0; i < list.length; i ++ )
					{
						const itemRefType = list[ i ].refType;
						const itemRefHash = list[ i ].refHash;
						list[ i ].refData = await this.queryOneByRefTypeAndHash(
							wallet,
							itemRefType,
							itemRefHash
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
		return super.clearAll<FavoriteType>( FavoriteModel );
	}
}
