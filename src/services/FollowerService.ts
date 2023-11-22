import { PageUtil, TestUtil, TypeUtil } from "denetwork-utils";
import { EtherWallet, Web3Validator } from "web3id";
import { FollowerListResult, FollowerModel, FollowerType } from "../entities/FollowerEntity";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueryListOptions } from "../models/TQuery";
import { QueryUtil } from "../utils/QueryUtil";
import { resultErrors } from "../constants/ResultErrors";

/**
 * 	class FollowerService
 */
export class FollowerService extends BaseService implements IWeb3StoreService<FollowerType, FollowerListResult>
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{FollowerType}
	 *	@param sig	{string}
	 *	@returns {Promise< FollowerType | null >}
	 */
	public add( wallet : string, data : FollowerType, sig : string ) : Promise<FollowerType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				{
					return reject( resultErrors.failedValidate );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
					return reject( `invalid data.address` );
				}

				//	...
				const followerModel : Document = new FollowerModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				} );
				let error : Error.ValidationError | null = followerModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond = await this.queryLatestElapsedMillisecondByCreatedAt<FollowerType>( FollowerModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				const findFollower : FollowerType = await this._queryOneByWalletAndAddress( data.wallet, data.address );
				if ( findFollower )
				{
					return reject( resultErrors.duplicateKeyError );
				}

				//	...
				await this.connect();
				const savedDoc : Document<FollowerType> = await followerModel.save();

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
	 *	@param data	{FollowerType}
	 *	@param sig	{string}
	 *	@returns {Promise< FollowerType | null >}
	 */
	public update( wallet : string, data : FollowerType, sig : string ) : Promise<FollowerType | null>
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
	 *	@returns { Promise< FollowerType | null > }
	 */
	public updateFor( wallet : string, data : any, sig : string ) : Promise<FollowerType | null>
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
		} );
	}


	/**
	 *	@param wallet	{string}
	 *	@param data	{FollowerType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : FollowerType, sig : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! await Web3Validator.validateObject( wallet, data, sig ) )
				{
					return reject( resultErrors.failedValidate );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
					return reject( `invalid data.address` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'deleted' ] ) ||
					Types.ObjectId.createFromTime( 1 ).toHexString() !== data.deleted )
				{
					//	MUST BE 1 for DELETION
					return reject( `invalid data.deleted` );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<FollowerType>( FollowerModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 3 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				await this.connect();
				const find : FollowerType | null = await this._queryOneByWalletAndAddress( wallet, data.address );
				if ( find )
				{
					const update = { deleted : find._id.toHexString() };
					const newDoc = await FollowerModel.findOneAndUpdate( find, update, { new : true } );
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
	 * 	@returns {Promise< FollowerType | null >}
	 */
	public queryOne( wallet : string, data : any, sig ?: string ) : Promise<FollowerType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `invalid data, missing key : by` );
				}

				switch ( data.by )
				{
					case 'walletAndAddress' :
						return resolve( await this._queryOneByWalletAndAddress( wallet, data.address ) );
					case 'walletAndHash' :
						return resolve( await this._queryOneByWalletAndHash( wallet, data.hash ) );
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
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns { Promise<FollowerListResult> }
	 */
	public queryList( wallet : string, data : any, sig ?: string ) : Promise<FollowerListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'by' ] ) )
				{
					return reject( `invalid data, missing key : by` );
				}

				switch ( data.by )
				{
					case 'walletAndAddress' :
						//	wallet - means follower
						//	this will return a followee list
						return resolve( await this._queryListByWalletAndAddress( wallet, data.address, data.options ) );
					case 'wallet' :
						//	wallet - means follower
						//	this will return a followee list
						return resolve( await this._queryListByWalletAndAddress( wallet, undefined, data.options ) );
					case 'address' :
						//
						//	address - means followee
						//	This will return a followers list of the followee(person being followed)
						//
						return resolve( await this._queryListByAddress( data.address, data.options ) );
				}

				//	...
				resolve( this.getListResultDefaultValue<FollowerListResult>( data ) );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param wallet	{string}	wallet address
	 *	@param address	{string}	contact wallet address
	 *	@returns {Promise< FollowerType | null >}
	 */
	private _queryOneByWalletAndAddress( wallet : string, address : string ) : Promise<FollowerType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}
				if ( ! EtherWallet.isValidAddress( address ) )
				{
					return reject( `invalid address` );
				}

				await this.connect();
				const record = await FollowerModel
					.findOne()
					.byWalletAndAddress( wallet, address )
					.lean<FollowerType>()
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
	 *	@param wallet	{string}	wallet address
	 * 	@param hash	{string}	a 66-character hexadecimal string
	 *	@returns {Promise< FollowerType | null >}
	 */
	private _queryOneByWalletAndHash( wallet : string, hash : string ) : Promise<FollowerType | null>
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
				const record = await FollowerModel
					.findOne()
					.byWalletAndHash( wallet, hash )
					.lean<FollowerType>()
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
	 *	@param address		{string}	contact wallet address
	 *	@param options	{TQueryListOptions}
	 *	@returns {Promise<ContactListResult>}
	 */
	private _queryListByWalletAndAddress( wallet : string, address ? : string, options ? : TQueryListOptions ) : Promise<FollowerListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `invalid wallet` );
				}

				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : {
					[ key : string ] : SortOrder
				} = QueryUtil.getSafeSortBy( options?.sort );

				let result : FollowerListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const contacts : Array<FollowerType> = await FollowerModel
					.find()
					.byWalletAndAddress( wallet, address )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<FollowerType>>()
					.exec();
				if ( Array.isArray( contacts ) )
				{
					result.list = contacts;
					result.total = contacts.length;
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
	 *	@param address		{string}	contact wallet address
	 *	@param options	{TQueryListOptions}
	 *	@returns {Promise<ContactListResult>}
	 */
	private _queryListByAddress( address : string, options ? : TQueryListOptions ) : Promise<FollowerListResult>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( address ) )
				{
					return reject( `invalid address` );
				}

				const pageNo = PageUtil.getSafePageNo( options?.pageNo );
				const pageSize = PageUtil.getSafePageSize( options?.pageSize );
				const skip = ( pageNo - 1 ) * pageSize;
				const sortBy : {
					[ key : string ] : SortOrder
				} = QueryUtil.getSafeSortBy( options?.sort );

				let result : FollowerListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				const contacts : Array<FollowerType> = await FollowerModel
					.find()
					.byAddress( address )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<FollowerType>>()
					.exec();
				if ( Array.isArray( contacts ) )
				{
					result.list = contacts;
					result.total = contacts.length;
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
		return super.clearAll<FollowerType>( FollowerModel );
	}
}
