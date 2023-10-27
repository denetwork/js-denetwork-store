import { EmptyService } from "../services/EmptyService";

/**
 * 	@class ServiceUtil
 */
export class ServiceUtil
{
	/**
	 *	@returns {Array<string>}
	 */
	public static getWeb3StoreMethodNames() : Array<string>
	{
		const emptyService = new EmptyService();
		return Object.getOwnPropertyNames( Object.getPrototypeOf( emptyService ) )
			.filter( name => name !== "constructor" );
	}
}
