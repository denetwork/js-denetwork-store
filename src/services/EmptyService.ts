import { IWeb3StoreService } from "../interfaces/IWeb3StoreService";
import { BaseService } from "./BaseService";
import { CommentListResult, CommentType } from "../entities/CommentEntity";

/**
 * 	class EmptyService
 */
export class EmptyService extends BaseService implements IWeb3StoreService< CommentType, CommentListResult >
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
	public add( wallet : string, data : CommentType, sig : string ) : Promise< CommentType | null >
	{
		return Promise.resolve( null );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{CommentType}
	 *	@param sig	{string}
	 *	@returns {Promise< ContactType | null >}
	 */
	public update( wallet : string, data : CommentType, sig : string ) : Promise< CommentType | null >
	{
		return Promise.resolve( null );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns { Promise< CommentType | null > }
	 */
	public updateFor( wallet: string, data : any, sig ?: string )  : Promise< CommentType | null >
	{
		return Promise.resolve( null );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{CommentType}
	 *	@param sig	{string}
	 *	@returns {Promise<number>}
	 */
	public delete( wallet : string, data : CommentType, sig : string ) : Promise<number>
	{
		return Promise.resolve( 0 );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 * 	@returns {Promise< CommentType | null >}
	 */
	public queryOne( wallet : string, data : any, sig ?: string ) : Promise<CommentType | null>
	{
		return Promise.resolve( null );
	}

	/**
	 *	@param wallet	{string}
	 *	@param data	{any}
	 *	@param sig	{string}
	 *	@returns { Promise<CommentListResult> }
	 */
	public queryList( wallet : string, data : any, sig ?: string ) : Promise<CommentListResult>
	{
		return Promise.resolve( this.getListResultDefaultValue<CommentListResult>() );
	}
}
