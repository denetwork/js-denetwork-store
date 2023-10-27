/**
 * 	@interface IWeb3StoreService
 */
export interface IWeb3StoreService< T, R >
{
	/**
	 * 	add new
	 */
	add( wallet: string, data : T, sig : string ) : Promise< T | null >;

	/**
	 *	update item
	 */
	update( wallet: string, data : T, sig : string )  : Promise< T | null>;

	/**
	 *	update for the specified key
	 */
	updateFor( wallet: string, data : any, sig : string )  : Promise< T | null>;

	/**
	 *	delete item
	 */
	delete( wallet: string, data : T, sig : string )  : Promise<number>;

	/**
	 *	query one or list
	 */
	queryOne( wallet : string, data : any, sig : string ) : Promise< T | null >
	queryList( wallet : string, data : any, sig : string ) : Promise< R >
}
