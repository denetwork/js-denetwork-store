import { PageUtil, TestUtil, TypeUtil } from "denetwork-utils";
import { EtherWallet, Web3Encoder, Web3Validator } from "web3id";
import { ContactListResult, ContactModel, ContactType } from "../entities/ContactEntity";
import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { Document, Error, SortOrder, Types } from "mongoose";
import { TQueryListOptions } from "../models/TQuery";
import { QueryUtil } from "../utils/QueryUtil";
import { PostType } from "../entities/PostEntity";
import { resultErrors } from "../constants/ResultErrors";
import { CommentModel } from "../entities/CommentEntity";

/**
 * 	class ContactsService
 */
export class ContactService extends BaseService implements IWeb3StoreService<ContactType, ContactListResult>
{
	constructor()
	{
		super();
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{ContactType}
	 *	@param sig	{string}
	 *	@returns {Promise< ContactType | null >}
	 */
	public add( wallet : string, data : ContactType, sig : string ) : Promise<ContactType | null>
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
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
					return reject( `${ this.constructor.name } :: invalid data.address` );
				}

				//	...
				const contactModel : Document = new ContactModel( {
					...data,
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				} );
				let error : Error.ValidationError | null = contactModel.validateSync();
				if ( error )
				{
					return reject( error );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() )
				{
					const latestElapsedMillisecond = await this.queryLatestElapsedMillisecondByCreatedAt<ContactType>( ContactModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < 30 * 1000 )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				const findContact : ContactType = await this._queryOneByWalletAndAddress( data.wallet, data.address );
				if ( findContact )
				{
					return reject( resultErrors.duplicateKeyError );
				}

				//	...
				await this.connect();
				const savedDoc : Document<ContactType> = await contactModel.save();

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
	 *	@param data	{ContactType}
	 *	@param sig	{string}
	 *	@returns {Promise< ContactType | null >}
	 */
	public update( wallet : string, data : ContactType, sig : string ) : Promise<ContactType | null>
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
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
					return reject( `${ this.constructor.name } :: invalid data.address` );
				}

				//	throat checking
				if ( ! TestUtil.isTestEnv() && this.throatCheckingInterval > 0 )
				{
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<ContactType>( ContactModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < this.throatCheckingInterval )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				await this.connect();
				const findContact : ContactType | null = await this._queryOneByWalletAndAddress( wallet, data.address );
				if ( ! findContact )
				{
					return reject( resultErrors.notFound );
				}

				const allowUpdatedKeys : Array<string> = [ 'version', 'name', 'avatar', 'remark' ];
				const update : Record<string, any> = {
					...Web3Encoder.reserveObjectKeys( data, allowUpdatedKeys ),
					sig : sig
				};
				const newContact : ContactType | null = await ContactModel.findOneAndUpdate( findContact, update, { new : true } ).lean<ContactType>();

				//	...
				return resolve( newContact );
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
	 *	@returns { Promise< ContactType | null > }
	 */
	public updateFor( wallet: string, data : any, sig : string )  : Promise< ContactType | null >
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
	 *	@param data	{ContactType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : ContactType, sig : string ) : Promise<number>
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
				if ( ! TypeUtil.isNotNullObjectWithKeys( data, [ 'address' ] ) ||
					! TypeUtil.isNotEmptyString( data.address ) )
				{
					return reject( `${ this.constructor.name } :: invalid data.address` );
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
					const latestElapsedMillisecond : number = await this.queryLatestElapsedMillisecondByUpdatedAt<ContactType>( ContactModel, wallet );
					if ( latestElapsedMillisecond > 0 && latestElapsedMillisecond < this.throatCheckingInterval )
					{
						return reject( resultErrors.operateFrequently );
					}
				}

				//	...
				await this.connect();
				const findContact : ContactType | null = await this._queryOneByWalletAndAddress( wallet, data.address );
				if ( findContact )
				{
					const update = { deleted : findContact._id.toHexString() };
					const newDoc = await ContactModel.findOneAndUpdate( findContact, update, { new : true } );
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
	 * 	@returns {Promise< ContactType | null >}
	 */
	public queryOne( wallet : string, data : any, sig ?: string ) : Promise<ContactType | null>
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
	 *	@returns { Promise<ContactListResult> }
	 */
	public queryList( wallet : string, data : any, sig ?: string ) : Promise<ContactListResult>
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
					case 'walletAndAddress' :
						return resolve( await this._queryListByWalletAndAddress( wallet, data.address, data.options ) );
				}

				//	...
				resolve( this.getListResultDefaultValue<ContactListResult>( data ) );
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
	 *	@returns {Promise< ContactType | null >}
	 */
	private _queryOneByWalletAndAddress( wallet : string, address : string ) : Promise<ContactType | null>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! EtherWallet.isValidAddress( wallet ) )
				{
					return reject( `${ this.constructor.name } :: invalid wallet` );
				}
				if ( ! EtherWallet.isValidAddress( address ) )
				{
					return reject( `${ this.constructor.name } :: invalid address` );
				}

				await this.connect();
				const record = await ContactModel
					.findOne()
					.byWalletAndAddress( wallet, address )
					.lean<ContactType>()
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
	 *	@returns {Promise< ContactType | null >}
	 */
	private _queryOneByWalletAndHash( wallet : string, hash : string ) : Promise<ContactType | null>
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
				const record = await ContactModel
					.findOne()
					.byWalletAndHash( wallet, hash )
					.lean<PostType>()
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
	private _queryListByWalletAndAddress( wallet : string, address ? : string, options ? : TQueryListOptions ) : Promise<ContactListResult>
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

				let result : ContactListResult = {
					total : 0,
					pageNo : pageNo,
					pageSize : pageSize,
					list : [],
				};

				await this.connect();
				result.total = await ContactModel
					.find()
					.byWalletAndAddress( wallet, address )
					.countDocuments();
				const contacts : Array<ContactType> = await ContactModel
					.find()
					.byWalletAndAddress( wallet, address )
					.sort( sortBy )
					.skip( skip )
					.limit( pageSize )
					.lean<Array<ContactType>>()
					.exec();
				if ( Array.isArray( contacts ) )
				{
					result.list = contacts;
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
		return super.clearAll<ContactType>( ContactModel );
	}
}
